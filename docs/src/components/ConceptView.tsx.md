# `src/components/ConceptView.tsx`

## What this file is

The **scroll-snap carousel page**: an Apple-style full-viewport vertical slideshow with sections A ("…fast" headline + a live mouse-driven ECG trace), B ("we get it" + an animated roadmap with a travelling blob), C (the R&D strand picker + the `Helix`), and D (the selected strand's panel, which mounts only when a strand is open). It is the largest single component here and the best file for studying **`IntersectionObserver`**, **anime.js timelines**, **hand-written `requestAnimationFrame` loops driving SVG**, and cross-component communication via custom events.

Pairs with `ConceptView.css`. Renders `RDStrands`, `StrandPanel`, `Helix`, `HomeMashup`.

## Line-by-line / block walkthrough

### Imports & refs

```tsx
import { useEffect, useRef, useState } from 'react'
import { animate, createTimeline, stagger, utils } from 'animejs'
import RDStrands from './RDStrands'
import StrandPanel from './StrandPanel'
import Helix from './Helix'
...
const scrollerRef = useRef<HTMLDivElement>(null)
const sectionARef = useRef<HTMLElement>(null)
...
const playedRef = useRef<Set<string>>(new Set())
```

anime.js v4 named imports (see `helixScene.ts` doc for the API primer). Refs to the scroll container and each section so the `IntersectionObserver` can observe them and anime.js can query inside them. `playedRef` is a **ref used as a mutable `Set`** — it remembers which sections already played their entrance so re-scrolling does not replay them. Using a ref (not state) is correct: this value must persist but changing it should *not* trigger a re-render.

### State

```tsx
const [openStrandId, setOpenStrandId] = useState<string | null>(null)
const openStrand = STRANDS.find(s => s.id === openStrandId) ?? null
const [currentSection, setCurrentSection] = useState<'a' | 'b' | 'c' | 'd'>('a')
```

`openStrandId` is the selected strand (the helix + picker + panel all share this single source of truth). `openStrand` is a **derived value** (looked up from data each render — not stored). `currentSection` drives the side pill-nav highlight. The union type `'a' | 'b' | 'c' | 'd'` is a TS **literal type** constraining the value to exactly those four strings.

### Broadcasting the active section

```tsx
useEffect(() => {
  document.dispatchEvent(new CustomEvent('mentheon:section', { detail: { section: currentSection } }))
}, [currentSection])
useEffect(() => {
  return () => { document.dispatchEvent(new CustomEvent('mentheon:section', { detail: { section: null } })) }
}, [])
```

`ConceptView` publishes the active section on a **`CustomEvent`** so `Header` can fold itself compact without prop-drilling through the app tree. The first effect fires whenever `currentSection` changes (`[currentSection]` dep). The second has `[]` deps and **only a cleanup** — it dispatches `section: null` on unmount so other routes do not inherit a stale section. An effect that is "just a cleanup" is a valid pattern for "do X when this component goes away". Custom events are a decoupled sibling-communication channel; the trade-off is an invisible wire (the listener lives in `Header.tsx`).

### IntersectionObserver — entrance triggers + active-section tracking

```tsx
useEffect(() => {
  const scroller = scrollerRef.current
  if (!scroller) return
  const observed: HTMLElement[] = []
  if (sectionARef.current) observed.push(sectionARef.current)
  ... // B, C, D
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return
      const id = (entry.target as HTMLElement).dataset.section
      if (id === 'a' || ...) setCurrentSection(id)
      if (playedRef.current.has(id)) return
      playedRef.current.add(id)
      if (id === 'a') playSectionA()
      else if (id === 'b') playSectionB()
    })
  }, { root: scroller, threshold: 0.55 })
  observed.forEach(el => observer.observe(el))
  return () => observer.disconnect()
}, [openStrandId !== null])
```

**`IntersectionObserver`** is the modern, performant API for "tell me when this element enters/leaves the viewport" — never poll scroll position for this. Concepts:

- `{ root: scroller, threshold: 0.55 }` — observe relative to the *internal scroll container* (not the window), firing when ≥55% of a section is visible.
- `entry.isIntersecting` filters to "now visible"; `dataset.section` reads the section id from the `data-section` HTML attribute.
- It does double duty: update `currentSection` (for the pill nav) **and** fire each section's entrance animation **once** (the `playedRef` Set guard — a hand-rolled "run-once-per-id").
- Cleanup `observer.disconnect()` — mandatory; leaking observers is a classic mistake.
- **`[openStrandId !== null]` deps** — a clever, deliberate choice explained in the comment: the effect must re-run when section D *mounts/unmounts* (so D joins the observed set), but must NOT re-run on every `openStrand` object change. `openStrandId !== null` is a boolean that only flips when D appears/disappears, so the effect re-subscribes exactly when needed and no more. This is an advanced deps-array technique: depend on a *derived boolean*, not an object identity, to control re-subscription precisely.

### `playSectionA` — staggered text + counter rollover + ECG

```tsx
utils.set(words,   { opacity: 0, translateY: 28 })
const tl = createTimeline({ defaults: { ease: 'outQuad' } })
tl.add(words, { opacity: [0,1], translateY: [28,0], duration: 460, delay: stagger(110) })
tl.add(letters, { opacity: [0,1], duration: 100, delay: stagger(100) }, '-=80')
```

`utils.set` pre-stages elements invisible/offset (no animation). A **timeline** sequences steps; `stagger(110)` delays each word by 110ms (cascade); the `'-=80'` position string overlaps the letters step 80ms before the words step ends. Same anime.js v4 vocabulary as `helixScene.ts`.

```tsx
const finals = ['f', 'a', 's', 't']
letters.forEach((letter, i) => {
  const handle = window.setInterval(() => {
    const elapsed = performance.now() - startedAt - startDelay
    if (elapsed < 0) return
    if (elapsed < rollDurationMs) letter.textContent = String.fromCharCode(97 + Math.floor(Math.random()*26))
    else { letter.textContent = finals[i]; window.clearInterval(handle) }
  }, 50)
})
```

The "slot machine" letter-scramble: a `setInterval` per letter swaps in random lowercase chars (`String.fromCharCode(97+rand)` → `'a'..'z'`) until its roll duration elapses, then locks the final letter and clears its own interval. A self-terminating interval is a useful pattern; note the timing is computed from `performance.now()` deltas so it stays accurate even if intervals drift.

### `startEcg` — a hand-written rAF loop generating an SVG heartbeat

```tsx
function pqrstSegment(amp: number): Pt[] { ... return [[0,BASELINE_Y], ... [x0+22, BASELINE_Y - 22*A], ...] }
function tick(dtMs: number) {
  pathOffset += (PIXEL_SPEED * dtMs) / 1000
  const targetAmp = Math.min(1.6, displacement * 0.022)
  amplitude += (targetAmp - amplitude) * Math.min(1, dtMs / 35)
  displacement *= Math.max(0, 1 - dtMs / 350)
  while (queue.length && queue[0].startX + queue[0].width - pathOffset < -20) queue.shift()
  while (segmentCursor - pathOffset < VIEW_W + ...) appendSegment()
  tracePath.setAttribute('d', rebuildPath())
}
function loop(ts) { const dt = ts - lastFrame; lastFrame = ts; tick(dt); requestAnimationFrame(loop) }
```

A self-contained ECG engine — a strong study in procedural SVG animation:

- The trace is a **queue of fixed-width segments** (alternating PQRST heartbeat and flat-line). Each frame translates the whole path left (`pathOffset`), drops segments scrolled off the left, and appends fresh ones on the right — a **ring-buffer / object-pool** pattern so the path string stays bounded.
- `pqrstSegment(amp)` builds a real ECG waveform (P wave, QRS spike, T wave) whose vertical scale is `amp`.
- **Amplitude is driven by mouse displacement**: a separate `mousemove` listener accumulates pixels moved; `tick` maps that to a target amplitude, eases `amplitude` toward it (`+= (target-amp) * min(1, dt/35)` — exponential approach, frame-rate independent via `dt`), and bleeds `displacement` off over a ~350ms half-life (`*= 1 - dt/350`) so the trace flattens when the cursor stops. Cursor-velocity → waveform amplitude is the headline interaction.
- `rebuildPath()` flattens the queue to one SVG path `d` string (`M x,y L x,y …`) and `setAttribute('d', ...)` updates the live `<path>` each frame.
- Delta-time everywhere makes motion independent of frame rate.

### `playSectionB` — roadmap reveal + the travelling blob

```tsx
drawOn.forEach(el => { const len = el.getTotalLength(); utils.set(el, { strokeDasharray: len, strokeDashoffset: len }) })
const tl = createTimeline({ defaults: { ease: 'outQuad' }, onComplete: () => { ... build the traverse timeline ... } })
tl.add(line, { strokeDashoffset: 0, duration: 900, ease: 'inOutQuad' })
tl.add(ticks, { opacity: [0,0.7], duration: 400, delay: stagger(80) }, '-=500')
tl.add(primaryNodes, { opacity:[0,1], scale:[0.6,1], duration:550, delay: stagger(120), ease:'outBack' }, '-=300')
```

The **SVG line-drawing trick** again (`stroke-dasharray`/`strokeDashoffset` = path length, animate offset → 0 to "draw" the line — see `helixScene.ts` doc). Nodes pop in with `ease: 'outBack'` (overshoots slightly — bouncy). Once the static layout finishes, the timeline's `onComplete` builds a **second, looping timeline** (`createTimeline({ loop: true })`) that moves a blob's `cx` between the three node positions with `onBegin`/`onUpdate` callbacks (`arriveAt`/`releaseFrom`/`departFrom`) that animate the bubbles "absorbing" and "releasing" the blob, plus an independent infinite `r` breath animation. This shows two important anime.js ideas: **nested timelines** (a one-shot entrance that, on completion, starts a looping behaviour) and **per-frame `onUpdate` callbacks** reading the animated value (`dot.getAttribute('cx')`) to drive *other* animations conditionally.

### Pill nav helpers & PILLS

```tsx
function jumpTo(id) { const map = { a: sectionARef, ... }; map[id].current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
const PILLS = [ { id:'a', label:'Fast' }, ..., ...(openStrand ? [{ id:'d' as const, label:'Strand details' }] : []) ]
```

`jumpTo` smooth-scrolls to a section via `Element.scrollIntoView`. `PILLS` is built with a **conditional spread**: `...(cond ? [extra] : [])` appends the D pill only when a strand is open — a clean way to conditionally include array items. `'d' as const` is a TS **const assertion** narrowing the string to the literal type `'d'` so it matches the union.

### Render — the scroll-snap structure

```tsx
return (
  <div className="concept-scroller" ref={scrollerRef}>
    <nav className="concept-pillnav"> {PILLS.map(p => <button ... onClick={() => jumpTo(p.id)} ... />)} </nav>
    <section className="concept-section concept-a concept-a--mashup" ref={sectionARef} data-section="a">
      <HomeMashup showHeadline />
    </section>
    <section className="concept-section concept-b" ref={sectionBRef} data-section="b"> ... <svg className="roadmap-svg">...</svg> </section>
    <section className="concept-section concept-c" ref={sectionCRef} data-section="c">
      <RDStrands openId={openStrandId} onSelect={setOpenStrandId} />
      <Helix selectedStrandId={openStrandId} onSelect={setOpenStrandId} />
      {openStrand && <button className="concept-c-seemore ...">See more</button>}
    </section>
    {openStrand && (
      <section className="concept-section concept-d" ref={sectionDRef} data-section="d">
        <StrandPanel key={openStrand.id} strand={openStrand} isOpen={openStrandId !== null} onClose={() => setOpenStrandId(null)} />
      </section>
    )}
  </div>
)
```

- The outer `.concept-scroller` is the scroll container; each `<section>` is a snap stop (the snapping is pure CSS in `ConceptView.css`). `data-section="x"` is what the `IntersectionObserver` reads.
- **Section B's roadmap is inline JSX SVG** (`<svg viewBox="0 -30 800 470">` with `<line>`, `<path d="M 130 248 Q 130 188 ...">` quadratic-curve braces, `<g className="roadmap-node">` groups, `<text>` labels). Note the SVG path `Q` command = quadratic Bézier curve; `M`/`L`/`Q` are the path mini-language. Authoring SVG as JSX (vs `createElementNS`) is the React-idiomatic way when the structure is static; `playSectionB` then animates it imperatively by `querySelector`.
- **`RDStrands` and `Helix` share `openStrandId`/`setOpenStrandId`** — both are controlled by ConceptView's state, so clicking a strand bubble and the helix snapping select the same thing and stay in sync (single source of truth across three children).
- `{openStrand && <section .../>}` — **conditional mounting**: section D only exists in the DOM when a strand is open. Because it is a real sibling section, scroll-snap treats it as its own stop. `<StrandPanel key={openStrand.id} ...>` — the **`key`** forces React to remount the panel (fresh entrance animation) when a *different* strand opens, rather than reusing the instance. Changing `key` to force remount is a deliberate, useful technique.
- `onClose={() => setOpenStrandId(null)}` closes by clearing the shared state, which unmounts D and updates the helix/picker together.

## Libraries & APIs used

- **React 18** — `useState`, `useEffect`, `useRef`; conditional rendering/mounting; `key` to force remount. <https://react.dev/reference/react>
- **anime.js v4** — `animate`, `createTimeline` (incl. nested + `loop: true`), `stagger`, `utils.set`, position strings, `onBegin`/`onUpdate`/`onComplete`, eases (`outBack`, `outElastic`). <https://animejs.com/documentation/>
- **`IntersectionObserver`** — <https://developer.mozilla.org/docs/Web/API/Intersection_Observer_API>
- **DOM/SVG** — `CustomEvent`/`dispatchEvent`, `requestAnimationFrame`, `performance.now()`, `setInterval`/`clearInterval`, `Element.scrollIntoView`, `SVGGeometryElement.getTotalLength()`, `setAttribute('d', ...)`, SVG path `M`/`L`/`Q` grammar, `dataset`.

## Concepts to learn here

- `IntersectionObserver` for scroll-driven entrance + active-section tracking (with `disconnect()` cleanup).
- Choosing a *derived boolean* (`openStrandId !== null`) as an effect dependency to control exactly when it re-subscribes.
- A ref-held `Set` as a "run once per id" guard (persists without re-render).
- Custom events as decoupled sibling communication; an effect that is only a cleanup ("do X on unmount").
- anime.js timelines: pre-stage with `utils.set`, sequence with position strings, stagger, then start a looping behaviour in `onComplete`; `onUpdate` reading the tweened value to drive other animations.
- Procedural SVG animation via a hand-written rAF loop with a ring-buffer/object-pool and delta-time easing; input (mouse velocity) → output (waveform amplitude).
- Inline JSX SVG with the path mini-language (`M`/`L`/`Q`).
- One state shared by multiple controlled children (helix + picker + panel stay in sync).
- Conditional mounting + `key` to force a fresh component instance (replay animation).
- CSS owns scroll-snap; JS only triggers entrances and tracks position.

## How to edit it safely

- **Add/reorder sections**: add a `<section data-section="x">` + a ref, push it into `observed`, add to `PILLS`/`jumpTo`'s `map`, and an entrance function if it needs one. The `data-section` attribute is the contract with the observer.
- **Tune entrance timing**: durations/`stagger()`/position strings inside `playSectionA`/`playSectionB`.
- **Tune the ECG feel**: `PIXEL_SPEED`, `Y_SCALE`, the `targetAmp` coefficient (`displacement * 0.022`), the easing divisors (`dt/35`, `dt/350`) in `startEcg`.
- **Gotcha — keep the `[openStrandId !== null]` deps on the observer effect.** Using `[openStrand]` (object) would re-run it every render; `[]` would never let section D join the observed set (its pill never activates).
- **Gotcha — every `setInterval`/`requestAnimationFrame`/`addEventListener` started here must be cleared.** The letter intervals self-clear; verify any new loop you add does too, or it leaks/zombies under StrictMode. (The ECG/blob loops here run for the page's lifetime by design — be deliberate.)
- **Gotcha — `<StrandPanel key={openStrand.id}>`**: the `key` is intentional (remount on strand change for a fresh animation). Removing it makes the panel reuse the instance and skip its entrance.
- **Gotcha — `playedRef` Set guard** is what prevents entrance replays; clearing/removing it makes animations restart every time a section re-enters view.
- Paired files: **`ConceptView.css`** (scroll-snap, section layout, roadmap/ECG styles, pill nav), and the child components **`RDStrands`**, **`Helix`**, **`StrandPanel`**, **`HomeMashup`** — all wired to the shared `openStrandId` state.
