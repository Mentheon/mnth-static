# `src/components/HomeMashup/scenes/EcgScene.tsx`

## What this file is

A carousel scene: a heartbeat trace draws on (cycle 1: normal beats), morphs and
redraws faster/taller (cycle 2: speed-up), a clinical vital-stats strip fades in
above it, then everything flatlines, the vitals collapse to alarm values, and
the trace fades out.

Follows the **shared scene contract / skeleton** (`HelixScene.tsx.md` — read
first) and uses the **dasharray draw-on technique** (explained in
`RingsScene.tsx.md`) plus the **`buildEcgPath` SVG path generator** (see
`buildEcgPath.ts.md` for `M`/`L`/`Q` path syntax). This is the most
multi-phase scene; the lesson is **module-level constants/data, building a
labelled stat strip, and animating a `<path>`'s `d` attribute.**

## Line-by-line / block walkthrough

### Module-level constants and the `Vital` data table

```tsx
const SVG_NS = 'http://www.w3.org/2000/svg'
const ECG_Y = 360

interface Vital {
  label: string; value: string; unit: string
  color: string; x: number; flatline: string
}
const VITALS: Vital[] = [
  { label: 'HR',   value: '142',    unit: 'bpm',  color: 'var(--crimson)', x: 130, flatline: '0'     },
  { label: 'BP',   value: '138/89', unit: 'mmHg', color: 'var(--ink)',     x: 320, flatline: '--/--' },
  …
]
```

Note these are declared **outside the component**, at module scope. Constant
data that never changes per render belongs here — it's created once for the
whole app, not on every mount, and keeps the component body focused on
behaviour. Each `Vital` carries both its normal `value` and its `flatline`
(alarm) string, so the collapse phase just swaps text.

### The vital-stats strip

```tsx
const valueRefs: SVGTextElement[] = []
VITALS.forEach((v, i) => {
  const g = document.createElementNS(SVG_NS, 'g')
  g.setAttribute('opacity', '0')
  // label <text> (small, dim), value <text> (big, coloured), unit <text> (small)
  …
  svg.appendChild(g)
  valueRefs.push(value)
  animations.push(
    animate(g, { opacity: [0, 1], duration: 500, delay: 200 + i * 120, ease: 'outQuad' }),
  )
})
```

Each vital is a `<g>` containing three `<text>` nodes (label / big value /
unit), faded in staggered (`200 + i*120`). The big value node is pushed into
`valueRefs` so the later flatline phase can mutate its text — **keeping handles
to the specific nodes you'll need again** is a recurring pattern.

### Cycle 1 — draw the trace via dashoffset

```tsx
const trace = document.createElementNS(SVG_NS, 'path')
trace.setAttribute('d', buildEcgPath(1.5, 6, 800, ECG_Y))
trace.setAttribute('fill', 'none')
trace.setAttribute('stroke', 'var(--crimson)')
…
const len = trace.getTotalLength()
trace.style.strokeDasharray = String(len)
trace.style.strokeDashoffset = String(len)

animations.push(
  animate(trace, { strokeDashoffset: [len, 0], duration: 1100, ease: 'outSine' }),
)
```

- `buildEcgPath(1.5, 6, 800, ECG_Y)` builds the `d` path string — 6 beats,
  amplitude 1.5 (see `buildEcgPath.ts.md`).
- **`trace.getTotalLength()`** is an SVG DOM API that returns the rendered length
  of a `<path>` in user units. This is exactly the value you need for the
  dasharray draw-on trick (see `RingsScene.tsx.md`): set both
  `strokeDasharray` and `strokeDashoffset` to the full length so the line is
  fully hidden, then tween `strokeDashoffset → 0` to "draw it on" like a pen.
  Here it's set via `trace.style.…` (CSS via the DOM `style` object) rather than
  `setAttribute` — either works for these properties.

### Cycle 2 — snap to a new path, then redraw (1100ms)

```tsx
const cycle2Timer = window.setTimeout(() => {
  trace.setAttribute('d', buildEcgPath(1.8, 9, 800, ECG_Y))
  const len2 = trace.getTotalLength()
  trace.style.strokeDasharray = String(len2)
  trace.style.strokeDashoffset = String(len2)
  animations.push(
    animate(trace, { strokeDashoffset: [len2, 0], duration: 1100, ease: 'outSine' }),
  )
}, 1100)
```

At 1100ms it **replaces** `d` with a faster, taller waveform (9 beats, amp 1.8),
recomputes the new length, and redraws via the same dashoffset trick. Note it
*snaps* `d` (instant `setAttribute`) rather than tweening `d` between the two —
the comment in `buildEcgPath.ts.md` explains why (different beat counts =
different command counts = path morphing would glitch). The "play through
again, faster" effect comes from re-running the draw-on, not from morphing.

### Flatline + collapse (2400ms)

```tsx
const flatlineTimer = window.setTimeout(() => {
  trace.style.strokeDasharray = 'none'
  trace.style.strokeDashoffset = '0'
  animations.push(
    animate(trace, { d: `M 0 ${ECG_Y} L 800 ${ECG_Y}`, duration: 500, ease: 'inQuad' }),
  )
  onReadoutChange('Lead II · cardiac monitor', 'HR 0')
  VITALS.forEach((v, i) => {
    valueRefs[i].textContent = v.flatline
    animations.push(
      animate(valueRefs[i], { opacity: [1, 0.35], duration: 400, ease: 'outQuad' }),
    )
  })
}, 2400)
```

Now it **does** animate `d` — tweening the (still wavy) path to the straight
line `M 0 360 L 800 360`. This works because the dash pattern is first reset
(`strokeDasharray = 'none'`, `dashoffset = '0'`) so the flat line renders solid,
not as residual dashes. anime.js can tween `d` *here* because it's morphing to a
target, and the comment explains the dash reset is required. Each vital's text
is swapped to its `flatline` string (via the saved `valueRefs`) and dimmed.

### Fade & remove (3000ms)

```tsx
const dropTimer = window.setTimeout(() => {
  animations.push(
    animate(trace, {
      opacity: [1, 0], duration: 700, ease: 'inCubic',
      onComplete: () => { if (trace.parentNode) trace.parentNode.removeChild(trace) },
    }),
  )
}, 3000)
```

Final phase: fade the flat trace out and remove it on `onComplete` (see
`DefibScene.tsx.md` for the `onComplete`-removal idiom) so nothing bleeds into
the next scene.

### Cleanup

```tsx
return () => {
  timers.forEach(id => clearTimeout(id))
  animations.forEach(a => a.pause())
  while (svg.firstChild) svg.removeChild(svg.firstChild)
}
```

Mandatory cleanup + clearing all four phase timers (`cycle2Timer`,
`flatlineTimer`, `dropTimer`, etc., all collected in `timers`).

## Libraries & APIs used

- **React / anime.js / DOM-SVG / CSS Modules / TypeScript** — shared set
  (`HelixScene.tsx.md`).
- `buildEcgPath` helper (see `buildEcgPath.ts.md`).
- New: SVG `<path>` `d` + **`getTotalLength()`**, dasharray draw-on (see
  `RingsScene.tsx.md`), tweening the `d` attribute (path morph), setting SVG
  presentation props via the DOM `style` object, module-scope constant data.

## Concepts to learn here

- Module-level constants/data tables vs. per-render values.
- `getTotalLength()` to drive the stroke-dash draw-on for an arbitrary path.
- When you can vs. can't tween a `<path>`'s `d`: snap when command structure
  differs (cycle 2), morph when going to a same-ish target (flatline). The dash
  reset before a solid render.
- Keeping node handles (`valueRefs`) for later mutation across phases.
- A four-phase choreography (`draw → redraw → flatline → drop`) via stacked
  `setTimeout`s, each timed after the previous beat.

## How to edit it safely

- **Change the waveform:** pass different `amp`/`beats` to `buildEcgPath` (or
  edit that helper — see `buildEcgPath.ts.md`). After changing `d`, always
  recompute `getTotalLength()` before re-running the dash draw-on, or the reveal
  is wrong.
- **Retime phases:** the offsets `1100 / 2400 / 3000` must stay ordered and each
  start after the prior animation completes. The whole sequence must fit this
  scene's `duration` (4600ms) in `HomeMashup`'s `SCENES`.
- **Edit vitals:** change the module-level `VITALS` table (and each entry's
  `flatline`). `x` positions space them across the 800-wide viewBox.
- **Gotcha:** don't tween `d` between two `buildEcgPath` outputs with different
  `beats` — snap it (as cycle 2 does), then redraw. Mismatched command counts
  glitch path morphing (see `buildEcgPath.ts.md`).
- **Gotcha:** reset `strokeDasharray` to `'none'` before rendering the flat line
  solid, else the leftover dash pattern shows.
- **Gotcha:** keep all timers in `timers` and clear them in cleanup.
- Universal scene gotchas in `HelixScene.tsx.md`.
