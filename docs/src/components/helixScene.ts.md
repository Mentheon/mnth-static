# `src/components/helixScene.ts`

## What this file is

This is the **imperative SVG engine** behind the helix. It owns *all* DOM/SVG creation, animation, and interaction for the Rod-of-Asclepius diagram. It exports one function, `mountHelix(refs)`, which takes refs to pre-existing DOM nodes (created by the React shell `Helix.tsx`) and returns a `HelixHandle` (a bag of functions the shell calls). `Helix.tsx` is the thin React boundary; **this file is where the actual drawing and animation happen**, using vanilla DOM APIs plus **anime.js v4**.

The first ~100 lines are a hand-written primer (worth reading in the source) on anime.js v4 and the animation-coordination rules. `// @ts-nocheck` at the top disables TypeScript for the whole file — a pragmatic choice for a near-verbatim port of a well-tested prototype full of loosely-typed SVG attribute bags.

There is **no three.js here** — the helix is 2D SVG drawn with trigonometry. (The WebGL version is the separate `Helix3D.tsx`.) The 3D *feel* is faked: each strand point computes a `depth` and front/back segments are drawn with different opacity.

## Line-by-line / block walkthrough

### anime.js v4 — the imports

```ts
import { animate, createTimeline, stagger, createSpring, utils } from 'animejs'
```

anime.js v4 dropped the v3 `anime({ targets })` form for small named functions:

- **`animate(target, props)`** — animate one or more DOM/SVG nodes. `props` keys are CSS properties or SVG attributes in camelCase (`strokeWidth` → `stroke-width`). Values: a number (animate current→that), `[from, to]`, or `[from, mid, to]` (keyframes). Reserved keys: `duration` (ms), `ease` (name string or ease function), `delay` (ms or a stagger fn), `loop: true`, `onComplete`/`onUpdate`/`onBegin`. Returns an instance with `.play()`/`.pause()`/`.restart()`.
- **`createTimeline({ defaults, onComplete })`** — a sequencer. `.add(target, props, position)` per step. `position` is absolute (`'500'`) or relative (`'-=300'` = start 300ms *before* previous step ends → overlap; `'+=200'` = 200ms after).
- **`stagger(amount, opts?)`** — returns a delay generator; with N targets, target *i* gets delay `i * amount` ms.
- **`createSpring({ stiffness, damping })`** — returns an **ease function** modelling a real spring (overshoots/oscillates — bouncier than any bezier).
- **`utils.set(target, props)`** — set instantly, no animation. Used to pre-stage initial state.

### Types & data

```ts
interface HelixRefs { stageEl: HTMLElement; legendEl: HTMLElement; ... }
export interface HelixHandle {
  cleanup: () => void
  getProjectViewboxYs: () => Record<string, number>
  setSelected: (rdStrandsId: string | null) => void
  viewBoxHeight: number
  viewBoxWidth: number
}
```

`HelixRefs` is the input contract (DOM nodes from React). `HelixHandle` is the output contract (what `Helix.tsx` calls). Designing a tiny explicit handle like this is the clean way to expose an imperative subsystem to React without leaking its internals.

```ts
const DOMAINS = [ { id:'research', name:'Research', color:'#A30B37', themes:[...] }, ... ]
const PROJECTS = [ { id:'kindreon', rdStrandsId:'kindred', domainIds:['research','design','development'], position: 0.4, ... }, ... ]
```

Two parallel data lists drive everything. A **domain** = a coloured spiral strand. A **project** with one `domainId` renders as a *bead*; with two or more it renders as a *capsule* (a gradient line bridging strand points at the same height). `position` is the parameter `t ∈ [0,1]` along the spiral. `rdStrandsId` bridges to the legacy ids used elsewhere — the same bridging concern `Helix.tsx` handles with its lookup maps. The long comments on `position` values document hard-won pixel-tuning — read them before changing positions.

### Geometry — the math of the spiral

```ts
function strandPointAt(orientation, cfg, t) {
  const angle = cfg.phase + t * cfg.turns * Math.PI * 2
  const across = Math.sin(angle) * cfg.amplitude
  const along = t * cfg.length
  const depth = Math.cos(angle)
  let x, y
  if (orientation === 'vertical') { x = cfg.axisOffset + across; y = along }
  else                            { x = along; y = cfg.axisOffset + across }
  return { x, y, depth, t }
}
```

This is the heart of the visual. A point at parameter `t` on a strand:

- `angle` = how far around the staff (starting offset `phase`, plus `t × turns × 2π`).
- `across = sin(angle) × amplitude` = sideways swing from the central staff.
- `along = t × length` = distance down (or across) the staff axis.
- `depth = cos(angle) ∈ [-1, 1]` = a fake z-coordinate. `depth ≥ 0` → in front of the staff; `< 0` → behind. Behind segments are drawn thinner/fainter → the 2D SVG reads as a 3D coil.

This `sin`/`cos` parametric pattern is the standard way to draw a helix/spiral; understanding it transfers to any procedural curve.

```ts
function sampleStrand(orientation, cfg) {
  ... // walk many samples; when depth flips sign, start a new segment
  ... // at the crossing, linearly interpolate prev→curr to land exactly on depth=0
}
```

`sampleStrand` discretises a continuous strand into front-side and back-side polyline segments (so each can be styled by depth) plus one continuous `fullPath` used as an invisible click hitbox. At each front↔back crossing it **linearly interpolates** the two samples to find the exact `depth = 0` point and pushes it into *both* the closing and opening segments, so front and back visually meet with no gap. Linear interpolation to find a zero-crossing is a broadly useful numerical trick.

```ts
function pointsToPath(pts) {
  return pts.map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ')
}
```

Builds an SVG path `d` string: `M x,y` (moveto) then `L x,y` (lineto) repeated. This is the minimal SVG path grammar — learn `M`/`L` first; curves (`C`, `Q`) come later.

### Creating SVG elements

```ts
function svgEl(name, attrs?) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', name)
  if (attrs) for (const k in attrs) el.setAttribute(k, attrs[k])
  return el
}
```

**Critical SVG concept:** SVG elements must be created with `createElementNS` and the SVG namespace URI, *not* `document.createElement`. With plain `createElement` the browser makes an unknown HTML element that never renders. Attributes are set with `setAttribute` (not `.className = ` etc.). This helper is the SVG equivalent of `React.createElement`.

### `buildScene(orientation)` — drawing everything

Wipes any old SVG, then:

```ts
const W = orientation === 'vertical' ? 820 : 1280
const H = orientation === 'vertical' ? 900 : 540
const root = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'helix-svg', preserveAspectRatio: 'xMidYMid meet' })
```

`viewBox="0 0 W H"` defines an internal coordinate system independent of the rendered pixel size; CSS scales the element and the drawing scales with it. The verbose comments around `W`/`H`/`labelGap`/`tailMargin` record exactly why those numbers are what they are (to keep the scroll-snap in `Helix.tsx` reachable) — *do not* casually change them.

```ts
const layerStrandBack  = group('strand-back')
const layerStaff       = group('staff')
const layerStrandFront = group('strand-front')
const layerProjects    = group('projects')
;[layerStrandBack, layerStaff, layerStrandFront, layerProjects, layerLabels, layerHitboxes].forEach(g => root.appendChild(g))
```

**SVG paint order = document order**: elements appended later draw on top. So back-strands first, then staff, then front-strands, then projects (beads never hidden by a strand crossing them), then labels, then invisible hitboxes last. There is no `z-index` in SVG — order *is* z-order. Each layer is a `<g>` group.

```ts
const transformAttr = orientation === 'vertical' ? 'translate(0,' + startOffset + ')' : ...
;[layerStrandBack, ...].forEach(g => g.setAttribute('transform', transformAttr))
```

A group `transform="translate(0, startOffset)"` shifts a whole layer at once — every child inherits it. This frees the top band for header labels. Remember this offset: `getProjectViewboxYs` later has to add `startOffset` back to convert layer-local Y to root viewBox Y.

```ts
const strandConfigs = {}
DOMAINS.forEach((d, i) => {
  const phase = (i / DOMAINS.length) * Math.PI * 2
  strandConfigs[d.id] = { phase, basePhase: phase, amplitude, baseAmplitude: amplitude, length: lengthAxis, axisOffset, turns }
})
```

Each strand gets an evenly-spaced starting `phase` (0, π/2, π, 3π/2) so the four strands braid the staff. `basePhase`/`baseAmplitude` keep the originals for the (currently disabled) idle-drift breathing math.

**Single-domain bead** branch builds a `<g class="project-bead">` containing a leader `<line>` (a tether from the strand point to the bead), a `<circle>` bead, and a `<text>` label, positioned with the geometry helpers. **Multi-domain capsule** branch builds a `<g class="project-bridge">` with a `<linearGradient>` in `<defs>` (colour stops per strand), a `<path>` line through the strand points using the gradient as `stroke`, cap `<circle>`s, and a label. The gradient note teaches a real SVG gotcha: `gradientUnits="userSpaceOnUse"` coordinates are in the SVG's own space, *outside* the layer's `translate`, so `startOffset` is added back into the gradient endpoints.

`buildScene` returns a `scene` record holding refs to every element downstream code mutates — the imperative analogue of React state.

### Selection state & `applyAppearance()`

```ts
let state = { selectedDomain: null, selectedProject: null }
function highlightedDomainIds() { ... } // selected domain → itself; selected project → all its domains
```

`state` is the user-selection model (at most one of two ids set). `applyAppearance()` is the **central renderer**: every time `state` changes it walks all strands/projects, toggles dim/active CSS classes plus inline `opacity`/`strokeWidth`, re-renders the legend, reconciles which bead should be "breathing", and pauses/resumes the ambient breath + idle drift. This is essentially a hand-rolled render function — the imperative equivalent of React re-rendering from state.

```ts
function applyStrandStateClasses(strandObj, { dim, highlight }) {
  const apply = (el) => {
    el.classList.remove('is-dim', 'is-highlighted')
    if (dim) { el.style.opacity = '0.18' }
    else if (highlight) { el.style.opacity = '1'; el.style.strokeWidth = ... }
    else { el.style.opacity = ''; el.style.strokeWidth = '' }
  }
  strandObj.frontEls.forEach(apply); strandObj.backEls.forEach(apply)
}
```

Setting `el.style.opacity = ''` (empty string) *removes* the inline override so the CSS rule's value (and its `transition`) takes back over — the standard way to "un-set" an inline style. The actual fade is the `transition` in `Helix.css`; JS only flips the target.

### Panel open/close — measured-height animation

```ts
panelEl.style.maxHeight = 'none'      // uncap so we can read true height
const targetHeight = panelEl.scrollHeight
panelEl.style.maxHeight = '0'         // reset for the animation start
void panelEl.offsetHeight             // force reflow
panelOpenAnim = animate(panelEl, { maxHeight: [0, targetHeight], opacity: [0,1], duration: 480 })
```

A genuinely important technique. You cannot CSS-transition `height: auto`. The trick: temporarily uncap, **read `scrollHeight`** (the true content height), set `maxHeight` back to 0, then **force a synchronous reflow by reading `offsetHeight`** (`void panelEl.offsetHeight` — reading a layout property flushes pending style changes so the next animation starts from a committed 0), then animate the explicit `[0, targetHeight]` range. `onComplete` sets `maxHeight: 'none'` so later content reflow is not clipped. The "read offsetHeight to force reflow" idiom is reusable any time you need a style change to take effect *before* the next one to make a transition work.

`panelOpenAnim` is kept module-scoped so a new selection mid-animation can `.pause()` the in-flight one before starting a new one (otherwise two animations fight over `maxHeight`).

### `playEntrance()` — the orchestrated draw-in

```ts
allSegs.forEach(p => {
  const len = p.getTotalLength()
  utils.set(p, { strokeDasharray: len, strokeDashoffset: len })
})
...
tl.add(allSegs, { strokeDashoffset: 0, duration: 1100, delay: stagger(18, { start: 0 }) }, '-=300')
```

The **"draw a line" SVG trick**, fully shown: set `stroke-dasharray` to the path's full length (`getTotalLength()`) and `stroke-dashoffset` to the same → the whole stroke is one giant gap, invisible. Animate `strokeDashoffset` to 0 → the dash slides in and the path appears to *draw itself*. `stagger(18)` delays each segment by 18ms so they draw in sequence; the `'-=300'` overlaps this step with the staff fade. This is the canonical SVG line-drawing animation — memorise it.

```ts
onComplete: () => {
  entranceFinishedAt = performance.now()
  allSegs.forEach(p => { p.style.strokeDasharray = 'none'; p.style.strokeDashoffset = '' })
  startAmbientBreath()
}
```

A subtle bug-fix worth understanding: the dasharray was set to the *initial* path length. If the path later grows longer (drift), the extra length falls into a zero-length dash and renders nothing — random gaps. Clearing `strokeDasharray = 'none'` after the entrance lets segments render full at any length. Lesson: an animation set-up can leave inline styles that sabotage later behaviour; clean them up when the animation's job is done.

### Idle drift — manual requestAnimationFrame loop

```ts
function startIdleDrift() {
  function tick(now) {
    idleDriftRAF = requestAnimationFrame(tick)   // re-schedule FIRST
    if (idleDriftPaused || isAnythingSelected()) { lastTick = now; return }
    if (now - lastTick < DRIFT_TICK_MIN_MS) return
    const dt = Math.min(now - lastTick, MAX_DT)
    lastTick = now
    DOMAINS.forEach(d => { cfg.phase += PHASE_DRIFT_PER_MS * dt; cfg.amplitude = ... })
    rebuildStrandSegments()
  }
  idleDriftRAF = requestAnimationFrame(tick)
}
```

Why a hand-written **`requestAnimationFrame`** loop instead of anime.js: anime.js animates finite/per-target properties; continuously regenerating whole SVG path strings every frame does not fit its model. Teaching points embedded here:

- **Re-schedule first** (`requestAnimationFrame(tick)` at the top) so a thrown error in the body does not kill the loop forever.
- **Delta time** `dt = now - lastTick` makes motion frame-rate-independent; `Math.min(dt, MAX_DT)` caps it so a long stall (tab backgrounded, debugger) does not warp the animation forward by minutes in one frame.
- Keep `lastTick` fresh even while paused, for the same reason.
- A throttle (`DRIFT_TICK_MIN_MS`) skips work if ticked too recently.

(This loop is currently *not started* — see the `onComplete` comment in `playEntrance`: starting drift would move the strand emergence points and desync the header labels. The function is kept intact, deliberately dormant. `cancelAnimationFrame(idleDriftRAF)` in `stopIdleDrift` is the matching teardown.)

### Ambient breath & project breath (anime.js loops)

```ts
ambientBreath = animate(target, { scale: [1, 1.005, 1], duration: 8000, ease: 'inOutSine', loop: true })
```

A 3-value keyframe `[1, 1.005, 1]` + `loop: true` = a gentle infinite "breathing" scale on the SVG root (not the scroll container — scaling the scroller would glitch scroll position). `startProjectBreath` does the same on the selected bead's `r` (SVG attribute — anime.js animates attributes and CSS transparently) or a capsule's `strokeWidth`, via a **computed property key** `[projectEl.shape ? 'r' : 'strokeWidth']`.

### Hover springs

```ts
const spring = createSpring({ stiffness: 220, damping: 18 })
pe.g.addEventListener('pointerenter', () => {
  if (projectBreaths.has(pe.project.id)) return
  animate(target, { r: 16, duration: 500, ease: spring })
})
```

`createSpring` returns an **ease function** passed as `ease:`. The guard prevents a hover animation from racing the breath animation on the same `r` attribute (two `animate()` calls on one property fight; last one wins, producing a stutter). Avoiding two animations on the same property is a general anime.js discipline.

### Mount sequence & the returned handle

```ts
scene = buildScene(currentOrientation)
attachInteractions()
attachSpringHovers()
applyAppearance()
playEntrance()

return {
  cleanup: () => { stopIdleDrift(); ambientBreath?.pause(); ...; stageEl.querySelectorAll('svg').forEach(s => s.remove()) },
  getProjectViewboxYs: () => { ... out[pe.project.id] = yStrand + scene.startOffset ... },
  setSelected: (rdStrandsId) => { ... onSelect(null, proj.id) },
  viewBoxHeight: scene.viewBox.H, viewBoxWidth: scene.viewBox.W,
}
```

`cleanup` is the **teardown contract** `Helix.tsx`'s effect calls on unmount/StrictMode-remount: stop the RAF loop, pause every anime.js instance, remove module-scope listeners (SVG-internal listeners are GC'd when their nodes are removed), wipe the DOM. Skipping this leaks loops and listeners. `getProjectViewboxYs` adds `startOffset` to convert layer-local Y → root viewBox Y (closing the loop with the `translate` applied in `buildScene` and the px-conversion math in `Helix.tsx`).

## Libraries & APIs used

- **anime.js v4** — `animate`, `createTimeline`, `stagger`, `createSpring`, `utils.set`. Docs: <https://animejs.com/documentation/>
- **DOM/SVG APIs**: `document.createElementNS` (<https://developer.mozilla.org/docs/Web/API/Document/createElementNS>), `Element.setAttribute`, `SVGGeometryElement.getTotalLength()` (<https://developer.mozilla.org/docs/Web/API/SVGGeometryElement/getTotalLength>), `Element.scrollHeight`/`offsetHeight` (forced reflow), `classList`, `requestAnimationFrame`/`cancelAnimationFrame`, `performance.now()`, `addEventListener` (`pointerenter`/`pointerleave`/`click`).
- **SVG**: `viewBox`, `preserveAspectRatio`, `<g>` transforms, `<linearGradient>`/`<defs>`, path `M`/`L` grammar, `stroke-dasharray`/`stroke-dashoffset`. <https://developer.mozilla.org/docs/Web/SVG>
- **TypeScript**: `// @ts-nocheck`, `Record<string,number>`, exported interfaces.

## Concepts to learn here

- Exposing an imperative subsystem to React via a small typed handle (input refs in, function bag out).
- Parametric helix geometry with `sin`/`cos` and a fake `depth` for pseudo-3D.
- SVG fundamentals: namespace creation, paint order = document order, viewBox coords, group transforms, gradients, the path mini-language.
- The SVG line-drawing animation (`stroke-dasharray`/`stroke-dashoffset` + animate offset to 0).
- anime.js v4: `animate`, timelines with relative position strings for overlap, `stagger`, spring eases, `utils.set` pre-staging, computed property keys for attribute-vs-CSS.
- Animating `height:auto` via measure-`scrollHeight` → reset → force reflow (`void offsetHeight`) → animate explicit range.
- Manual `requestAnimationFrame` loops done right: re-schedule first, delta-time with a cap, throttling, pause-safe.
- Cleaning up loops/listeners/DOM in a teardown function (StrictMode-safe).
- Resetting an inline style to `''` to hand control back to a CSS rule + its transition.

## How to edit it safely

- **Change strand/project content**: edit `DOMAINS` / `PROJECTS`. Adding a project: ensure its `domainIds` reference existing domain ids; if it has an `rdStrandsId`, mirror that id in `Helix.tsx`'s `HELIX_TO_RD`/`RD_TO_HELIX` maps and in `src/data/strands.ts` or selection sync silently no-ops.
- **Change a project's spiral position**: edit its `position` (0..1), but read the long comments first — the values are tuned so `Helix.tsx`'s scroll-snap can reach every project on common viewport heights. Re-test snapping on a short laptop window.
- **Change colours**: each `DOMAINS[i].color`. Strand stroke colour is set inline at creation; visual fade is the CSS `transition` in `Helix.css`.
- **Re-enable idle drift**: call `startIdleDrift()` in `playEntrance`'s timeline `onComplete` (the function is intact). Accept that header strand-labels will then desync from strand positions (that is why it is off).
- **Gotcha — class names are a contract with `Helix.css`.** Renaming `strand-segment`/`project-bead`/`panel`/`themeCard` etc. requires editing the stylesheet too.
- **Gotcha — always create SVG nodes with `svgEl()` (`createElementNS`)**, never `document.createElement`, or they will not render.
- **Gotcha — never start an anime.js loop without a matching pause in `cleanup`**, and never `requestAnimationFrame` without a matching `cancelAnimationFrame`. Leaks and zombie loops under React StrictMode otherwise.
- **Gotcha — two `animate()` calls on the same property race.** Guard with the `projectBreaths.has(...)` style check before adding new per-property animations.
- Paired files: **`Helix.tsx`** (React shell, scroll-snap, rod size) and **`Helix.css`** (the styles for every element this file creates). The `startOffset` translate here ↔ `getProjectPxY` math in `Helix.tsx` must stay consistent.
