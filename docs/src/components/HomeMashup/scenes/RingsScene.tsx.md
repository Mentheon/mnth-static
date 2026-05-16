# `src/components/HomeMashup/scenes/RingsScene.tsx`

## What this file is

A carousel scene: three concentric "activity rings" (like a smartwatch) fill in,
with three stat readouts beside them (steps / active kcal / HRV) counting up.

Follows the **shared scene contract / skeleton** (`HelixScene.tsx.md` — read
first). New concepts: **the `stroke-dasharray` / `stroke-dashoffset` trick to
"draw on" a circular progress ring, nested `<g>` transforms, and per-stat
formatter functions.**

## Line-by-line / block walkthrough

### Ring definitions tied to real data

```tsx
const ringDefs = [
  { r: 80, color: 'var(--crimson)', base: 502.65, fillPct: 1.00 },
  { r: 60, color: 'var(--plum)',    base: 376.99, fillPct: 0.95 },
  { r: 40, color: 'var(--ink)',     base: 251.33, fillPct: 0.78 },
]
```

Three rings of radius 80/60/40. `base` is the **circumference** of each circle:
`2 * π * r` (e.g. `2π·80 ≈ 502.65`). `fillPct` is how far the ring should fill,
chosen to reflect the displayed stats vs. a goal (the in-file comment explains
the prior placeholder bug — read it; it's a good lesson in keeping the visual
honest to the data).

### The dasharray draw-on trick

```tsx
const group = document.createElementNS(SVG_NS, 'g')
group.setAttribute('transform', 'translate(280 260)')
svg.appendChild(group)
…
const ring = document.createElementNS(SVG_NS, 'circle')
ring.setAttribute('r', String(def.r))
ring.setAttribute('fill', 'none')
ring.setAttribute('stroke', def.color)
ring.setAttribute('stroke-width', '14')
ring.setAttribute('stroke-linecap', 'round')
ring.setAttribute('stroke-dasharray', String(def.base))
ring.setAttribute('stroke-dashoffset', String(def.base))
ring.setAttribute('transform', 'rotate(-90)')
group.appendChild(ring)

animate(ring, {
  strokeDashoffset: [def.base, def.base * (1 - def.fillPct)],
  duration: 1500, delay: 100, ease: 'outQuart',
})
```

This is the headline technique. To draw a circular progress arc without paths:

- **`stroke-dasharray`** turns a stroke into dashes. Set to the full
  circumference (`def.base`), the "dash" is exactly as long as the whole circle
  — i.e. one dash covering the entire ring, with an equally long invisible gap.
- **`stroke-dashoffset`** shifts where the dash pattern starts. Set it to the
  full circumference and the visible dash is pushed entirely out of view — the
  ring looks **empty**.
- Animating `strokeDashoffset` from `base` down toward
  `base * (1 - fillPct)` slides the dash into view, so the ring **progressively
  draws on**. Offset `0` = fully drawn; `base*(1-1.0)=0` for the 100% ring;
  `base*(1-0.78)` leaves ~22% undrawn for the HRV ring. This same trick draws
  the ECG trace in `EcgScene` — it's a fundamental SVG animation idiom.
- `transform: rotate(-90)` rotates the start point to 12 o'clock (strokes
  otherwise begin at 3 o'clock). `stroke-linecap: round` rounds the arc tip.
  The outer `<g translate(280 260)>` positions the whole stack with one
  transform (a track circle + the progress ring per `ringDef` are appended to
  it) — see `CellScene.tsx.md` for `<g>` grouping.

A faint `track` circle (same radius, low-opacity stroke) sits behind each ring
as the "unfilled" groove.

### Stats with per-row formatter functions

```tsx
const stats = [
  { label: 'Steps',       target: 12847, format: (v: number) => v.toLocaleString(), color: 'var(--crimson)', y: 180 },
  { label: 'Active kcal', target: 642,   format: (v: number) => String(v),          color: 'var(--plum)',    y: 260 },
  { label: 'HRV (ms)',    target: 78,    format: (v: number) => String(v),          color: 'var(--ink)',     y: 340 },
]
```

Each stat carries its **own `format` function** — a function stored as data.
Steps uses `toLocaleString()` ("12,847"), the others plain `String(v)`. Storing
behaviour per row keeps the render loop uniform.

```tsx
stats.forEach((s, i) => {
  … create <text> label + value …
  animate({ v: 0 }, {
    v: s.target, duration: 1500, delay: i * 150, ease: 'outQuart',
    onUpdate: (anim) => {
      const v = Math.round((anim.targets[0] as { v: number }).v)
      val.textContent = s.format(v)
    },
  })
})
```

The object-counter idiom (`HelixScene.tsx.md`), but `onUpdate` writes into an
SVG **`<text>`** node's `textContent` (not the readout), formatted via that
row's `s.format`. `delay: i * 150` staggers the three counters.

### Cleanup (with a documented StrictMode note)

```tsx
return () => {
  animations.forEach(a => a.pause())
  // React StrictMode (dev) re-invokes the effect after first cleanup;
  // without this the second run stacks fresh nodes on the first run's leftovers…
  while (svg.firstChild) svg.removeChild(svg.firstChild)
}
```

The mandatory cleanup. The in-file comment is the clearest explanation in the
codebase of *why* the `while (svg.firstChild)` wipe matters: in dev,
**React StrictMode runs every effect twice** (mount → cleanup → mount) to surface
bugs. Without emptying the SVG in cleanup, the second mount draws on top of the
first run's nodes — you'd literally see a stale "0" overlaid on the final
"12,847". This is the canonical reason every scene ends with that loop.

## Libraries & APIs used

- **React / anime.js / DOM-SVG / CSS Modules / TypeScript** — shared set
  (`HelixScene.tsx.md`).
- New: SVG `stroke-dasharray`/`stroke-dashoffset`, `stroke-linecap`,
  `transform: rotate`, nested `<g>`, SVG `<text>` `textContent`, functions
  stored as data, the circumference formula `2πr`.

## Concepts to learn here

- The dasharray/dashoffset "draw-on" technique for circular (and any stroked)
  progress — the single most reusable SVG animation trick (reused in
  `EcgScene`).
- Why a stroke starts at 3 o'clock and `rotate(-90)` fixes it.
- Keeping a visual honest to its data (read the `fillPct` comment).
- Storing per-item behaviour (formatter functions) as data for a uniform loop.
- React StrictMode double-invocation and why scene cleanup must wipe the SVG.

## How to edit it safely

- **Change a stat's value:** edit `target`; also revisit the matching ring's
  `fillPct` so the ring still honestly reflects the number (that's exactly the
  bug the in-file comment describes).
- **Add a fourth ring:** add a `ringDef` with correct `base = 2*Math.PI*r`. Get
  the circumference right or the fill maths breaks (it must equal the
  dasharray).
- **Retime:** all animations are 1500ms with small staggers; keep within this
  scene's `duration` (3600ms) in `HomeMashup`'s `SCENES` (see
  `HomeMashup.tsx.md`).
- **Gotcha:** `stroke-dasharray` must equal the true circumference `2πr`. A
  wrong value makes the ring under/overfill or show a dash seam.
- **Gotcha:** keep the `while (svg.firstChild)` wipe — this file's comment shows
  exactly what breaks without it under StrictMode.
- Universal scene gotchas in `HelixScene.tsx.md`.
