# `src/components/HomeMashup/scenes/HelixScene.tsx`

## What this file is

A carousel scene: a DNA double-helix assembles rung-by-rung, a base-pair
counter ticks up to "3,200 bp", then the rungs unzip and the strands dissolve
outward.

**This is the reference scene.** It is the simplest implementation of the shared
scene contract (defined in `types.ts` / explained in `types.ts.md` and
`HomeMashup.tsx.md`). Every other scene doc assumes you've read this one and
points back here for the boilerplate. Read it carefully; the others only
describe what's *different*.

## The shared scene pattern (learn it once, here)

Every scene file — including this one — follows the same skeleton:

```tsx
import { useEffect, useRef } from 'react'
import { animate } from 'animejs'
import type { SceneProps } from '../types'
import styles from './Scene.module.css'

export default function XxxScene({ onReadoutChange }: SceneProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    onReadoutChange('left text', 'right text')      // 1. seed the corner readout
    const svg = svgRef.current
    if (!svg) return                                 // 2. bail if ref not ready

    // 3. imperatively build SVG nodes with document.createElementNS
    // 4. animate them with animejs `animate(...)` (+ window.setTimeout phases)
    // 5. update the readout from animation onUpdate callbacks

    return () => {
      // 6. CLEANUP: pause every animation, clear every timer, empty the SVG
    }
  }, [onReadoutChange])

  return (
    <svg ref={svgRef} className={styles.canvas}
         viewBox="0 0 800 520" preserveAspectRatio="xMidYMid meet" />
  )
}
```

Why this shape?

- **`useRef`** gives a stable handle (`svgRef.current`) to the real `<svg>` DOM
  node so we can append children to it imperatively. `useRef(null)` holds a
  mutable `.current`; React sets it to the SVG element because we pass
  `ref={svgRef}` on the `<svg>`. Unlike state, changing a ref does **not**
  trigger a re-render — exactly what we want for direct DOM drawing.
- **`useEffect(fn, [onReadoutChange])`** runs `fn` once after the scene mounts
  (and re-runs only if `onReadoutChange` changes — which it never does, because
  `HomeMashup` wraps it in `useCallback(…, [])`; see `HomeMashup.tsx.md`). So
  the whole animation is set up exactly once per scene appearance.
- The scene renders an **empty `<svg>`** in JSX and fills it imperatively. Why
  not declarative JSX elements? Because these scenes create dozens-to-hundreds
  of nodes with random/computed positions and per-node animation handles; doing
  that imperatively with anime.js is far simpler than expressing it in React.
- The **cleanup return** is mandatory. Because `HomeMashup` gives each scene a
  changing `key`, switching scenes *unmounts* this component, which runs the
  cleanup. If you don't pause animations / clear timers / empty the SVG, the old
  scene's animations keep firing against detached nodes and leak; in React
  StrictMode (dev) the effect runs twice and you get doubled/overlaid drawings.

`document.createElementNS(ns, tag)` (not `createElement`) is used because SVG
elements live in the **SVG XML namespace**
(`http://www.w3.org/2000/svg`). Plain `createElement('circle')` makes an
unknown HTML element that won't render as a circle.

From here, scene docs focus on *what each scene draws and animates*, referring
back to this skeleton for the plumbing.

## Line-by-line / block walkthrough

```tsx
import { useEffect, useRef } from 'react'
import { animate, stagger } from 'animejs'
```

- `animate` is **anime.js**'s core function: `animate(target, properties)`
  tweens `properties` on `target` over time. `target` can be a DOM node *or a
  plain JS object* (used for counters — see below).
- `stagger` produces a *function* that returns an increasing delay per element,
  so a list of targets animates in a cascade instead of all at once.

```tsx
const N = 50
const cx = 400, midY = 260, span = 720, ampX = 80
```

Constants in the fixed 800×520 `viewBox` space (see `Scene.module.css.md` for
why coordinates are constant regardless of screen size). 50 rungs, centred at
x=400, baseline y=260, helix spans 720px wide, sine amplitude 80.

```tsx
for (let i = 0; i < N; i++) {
  const t = i / (N - 1)
  const x = (cx - span / 2) + t * span
  const phase = t * Math.PI * 6
  const y1 = midY + Math.sin(phase) * ampX * 0.55
  const y2 = midY - Math.sin(phase) * ampX * 0.55
```

The maths that makes it look like a helix:

- `t = i / (N - 1)` — a normalised position from `0` to `1` across the strand.
- `x` — evenly spaced left→right.
- `phase = t * Math.PI * 6` — `Math.PI*6` is three full sine cycles
  (`2π` per cycle × 3). As `t` goes 0→1, `phase` sweeps three waves.
- `y1 = midY + sin(phase)·44` and `y2 = midY − sin(phase)·44` — the two strands
  are **mirror images**: where one is high the other is low. A rung is a vertical
  line connecting `y1`↔`y2`; as `sin` oscillates the rung lengths pulse, which
  reads as a 2-D projection of a twisting 3-D helix. (`ampX * 0.55` = 44.)

```tsx
const rung = document.createElementNS(SVG_NS, 'line')
rung.setAttribute('x1', String(x))
rung.setAttribute('y1', String(y1))
rung.setAttribute('x2', String(x))
rung.setAttribute('y2', String(y2))
rung.setAttribute('stroke', i % 2 ? 'var(--crimson)' : 'var(--ink)')
rung.setAttribute('stroke-width', '2')
rung.setAttribute('opacity', '0')
svg.appendChild(rung)
```

An **SVG `<line>`** is defined by its two endpoints `(x1,y1)–(x2,y2)`. It has no
fill; `stroke` is its colour and `stroke-width` its thickness. Note all
attribute values are strings (`String(x)`) — SVG attributes are text.
`i % 2 ? … : …` alternates rung colour every other base pair (theme variables
`--crimson`/`--ink`). It starts at `opacity: 0` so it can fade in.

The two `<circle>`s (`c1`, `c2`) are the nucleotide "beads" at each strand,
positioned at `(x,y1)` and `(x,y2)`. A **`<circle>`** uses `cx`/`cy` (centre)
and `r` (radius). They too start invisible.

```tsx
rungs.push({ rung, c1, c2, y1, y2 })
```

We stash the DOM handles **and** the original `y1/y2` in an array so the dissolve
phase later knows where each circle started.

### Animations

```tsx
const animations = [
  animate(rungs.flatMap(r => [r.rung, r.c1, r.c2]), {
    opacity: [0, 0.7],
    duration: 400,
    delay: stagger(8),
    ease: 'outQuad',
  }),
```

- `rungs.flatMap(r => [r.rung, r.c1, r.c2])` builds a flat array of *all* 150
  nodes (`flatMap` = map then flatten one level).
- `animate(targets, { opacity: [0, 0.7], … })` — `[0, 0.7]` is a **from→to**
  tween: every node fades from invisible to 0.7.
- `duration: 400` ms per node; `ease: 'outQuad'` is an *easing function*
  (decelerating — fast start, gentle stop) so it feels organic, not linear.
- **`delay: stagger(8)`** — instead of a fixed delay, `stagger(8)` gives node 0
  a 0ms delay, node 1 8ms, node 2 16ms… so the helix "draws on" left-to-right
  like a zipper closing. This is the key anime.js idiom for cascading lists.

```tsx
  animate({ v: 0 }, {
    v: 3200,
    duration: 1100,
    delay: 200,
    ease: 'outQuad',
    onUpdate: (anim) => {
      const v = Math.round((anim.targets[0] as { v: number }).v)
      onReadoutChange('Sequencing', `${v.toLocaleString()} / 3,200 bp`)
    },
  }),
]
```

This is the **counter pattern**, used in almost every scene. Instead of
animating a DOM node, we animate a *plain object* `{ v: 0 }` toward `{ v: 3200 }`.
anime.js mutates that object every frame and calls **`onUpdate`** each tick.
There we read the current `v`, round it, and push it into the corner readout via
`onReadoutChange`. `(anim.targets[0] as { v: number })` is a **TypeScript type
assertion** — anime.js types `targets` loosely, so we tell the compiler "this is
my `{ v }` object". `v.toLocaleString()` formats `3200` as `"3,200"`. Net
effect: the readout smoothly counts up while the helix draws.

### Dissolve phase

```tsx
rungs.forEach((r, i) => {
  animations.push(
    animate(r.rung, { opacity: [0.7, 0], duration: 300, delay: 1500 + i * 12, ease: 'inQuad' }),
    animate(r.c1, { cy: r.y1 - 60, opacity: [1, 0], duration: 600, delay: 1500 + i * 12, ease: 'inQuad' }),
    animate(r.c2, { cy: r.y2 + 60, opacity: [1, 0], duration: 600, delay: 1500 + i * 12, ease: 'inQuad' }),
  )
})
```

After 1500ms (plus a manual per-index stagger `i * 12`), each rung fades out and
its two beads fly apart: `c1` moves up to `cy = y1 - 60`, `c2` down to
`y2 + 60`, both fading. This is the "unzip and dissolve" — animating the
`cy` attribute literally moves the circle. `ease: 'inQuad'` *accelerates*
(slow start, fast end), the opposite of `outQuad`, giving a "falling apart"
feel. All these handles are collected into `animations` so cleanup can pause
them.

### Cleanup

```tsx
return () => {
  animations.forEach(a => a.pause())
  while (svg.firstChild) svg.removeChild(svg.firstChild)
}
```

The mandatory cleanup: pause every anime.js instance (so callbacks stop firing)
and remove every child node from the SVG (so nothing lingers / no StrictMode
double-draw). Other scenes additionally `clearTimeout` their phase timers — this
one has none, so it's the minimal cleanup.

### JSX

```tsx
return (
  <svg ref={svgRef} className={styles.canvas}
       viewBox="0 0 800 520" preserveAspectRatio="xMidYMid meet" />
)
```

An **empty self-closing `<svg>`**. `ref={svgRef}` wires the DOM node into the
ref. `className={styles.canvas}` applies the shared fill/position styling (see
`Scene.module.css.md`). `viewBox="0 0 800 520"` defines the internal coordinate
system every constant above uses; `preserveAspectRatio="xMidYMid meet"` scales
that box to fit the screen, centred. All visible content is added imperatively
in the effect — the JSX is just the empty stage.

## Libraries & APIs used

- **React** — `useRef`, `useEffect`, function component, JSX.
- **anime.js** — `animate(target, props)`, `stagger()`, from→to arrays,
  `duration`/`delay`/`ease`, the `onUpdate` callback, `.pause()`.
- **DOM/SVG API** — `document.createElementNS`, `setAttribute`, `appendChild`,
  `removeChild`; SVG `<line>` / `<circle>`, `viewBox`,
  `preserveAspectRatio`.
- **CSS Modules** — shared `Scene.module.css`.
- **TypeScript** — typed ref `useRef<SVGSVGElement>(null)`, type assertions.

## Concepts to learn here

- The full shared scene contract/skeleton (this section is the canonical one).
- `useRef` for imperative DOM access without re-rendering.
- Building SVG nodes with `createElementNS` and string attributes.
- anime.js basics: tween arrays, easing, `stagger`, the object-counter +
  `onUpdate` → `onReadoutChange` idiom.
- Effect cleanup as the lifecycle backbone of every scene.
- Parametric trig (`sin`) to fake a 3-D helix in 2-D.

## How to edit it safely

- **Retime:** change `duration`/`delay` numbers. The dissolve starts at
  `1500 + i*12`; the whole scene must comfortably fit inside this scene's
  `duration` in `HomeMashup`'s `SCENES` (currently 4000ms — see
  `HomeMashup.tsx.md`). If you lengthen it, bump that.
- **Denser helix:** raise `N`. Note total nodes = `3*N` animating at once; very
  large `N` costs performance.
- **More twists:** change the `* 6` in `phase = t * Math.PI * 6` (each `2`
  ≈ one extra full wave).
- **Add a new scene instead:** copy this whole file as a template — it's the
  cleanest starting point — and follow the registration steps in
  `HomeMashup.tsx.md` / `types.ts.md`.
- **Gotcha:** never drop the cleanup. Without `animations.forEach(a => a.pause())`
  and the SVG-empty loop you get leaked animations and StrictMode double-draws.
- **Gotcha:** keep using `createElementNS` with `SVG_NS`. `document.createElement`
  silently produces non-rendering elements for SVG tags.
- **Gotcha:** SVG attribute values must be strings — wrap numbers in `String()`.
