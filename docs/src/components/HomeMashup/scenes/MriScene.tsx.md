# `src/components/HomeMashup/scenes/MriScene.tsx`

## What this file is

A carousel scene: a pixel-grid MRI "slice" (a fuzzy radial blob rendered as
coloured cells) with a vertical sweep line travelling left→right, revealing
columns as it passes. A slice counter ticks 0 → 240.

Follows the **shared scene contract / skeleton** (`HelixScene.tsx.md` — read
first). New concepts: **building a pixel grid with a radial mask, manual colour
interpolation between two RGB triples, and position-driven animation delays.**

## Line-by-line / block walkthrough

### The grid + radial mask

```tsx
const COLS = 28, ROWS = 14
const cw = W / COLS
const ch = (440 - 80) / ROWS
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const x = c * cw
    const y = 80 + r * ch
    const dx = (c - COLS / 2) / (COLS / 2)
    const dy = (r - ROWS / 2) / (ROWS / 2)
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist > 1.05) continue
```

A nested loop walks a 28×14 grid; `cw`/`ch` are each cell's pixel size.

- `dx`,`dy` are the cell's offset from grid centre, **normalised** to roughly
  −1…+1 (divide by half-extent).
- `dist = Math.sqrt(dx*dx + dy*dy)` is the Euclidean distance from centre (the
  Pythagorean theorem). `dist ≈ 0` at the middle, `≈ 1` at the edges.
- **`if (dist > 1.05) continue`** — skip cells outside a radius of ~1.05. This
  is a **circular mask**: only cells inside the disc get drawn, so the grid
  reads as a round scan slice, not a rectangle. `continue` jumps to the next
  loop iteration.

### Manual colour interpolation

```tsx
const intensity = Math.max(0, 1 - dist) * (0.4 + Math.random() * 0.6)
const purple = [47, 1, 71]
const cream = [255, 236, 225]
const rr = Math.round(cream[0] * (1 - intensity) + purple[0] * intensity)
const gg = Math.round(cream[1] * (1 - intensity) + purple[1] * intensity)
const bb = Math.round(cream[2] * (1 - intensity) + purple[2] * intensity)
rect.setAttribute('fill', `rgb(${rr},${gg},${bb})`)
```

- `intensity` is high near the centre (`1 - dist`), zero at the rim
  (`Math.max(0, …)` clamps negatives), times a random 0.4–1.0 speckle so it
  looks like noisy tissue rather than a clean gradient.
- The three `rr/gg/bb` lines are **linear interpolation (lerp)** between two
  colours: `result = a*(1 - t) + b*t`. At `t=0` you get pure `cream`; at `t=1`
  pure `purple`; in between, a blend. Doing it per channel (R, G, B) blends the
  colours. This is the manual version of what anime.js does internally when you
  tween a `fill` — worth understanding once. The result is written as an
  `rgb(r,g,b)` string into the rect's `fill`. (anime.js isn't used for the
  colour here because the colour is *static per cell* — only opacity animates.)

Each cell is an SVG **`<rect>`** (`x`,`y`,`width`,`height`; `+0.5` on size to
avoid hairline gaps between tiles) starting at `opacity: 0`.

### The sweep line

```tsx
const sweep = document.createElementNS(SVG_NS, 'line')
sweep.setAttribute('y1', '60'); sweep.setAttribute('y2', '460')
sweep.setAttribute('x1', '0');  sweep.setAttribute('x2', '0')
…
animate(sweep, { x1: [0, 800], x2: [0, 800], duration: 1500, ease: 'inOutQuad' }),
animate(sweep, { opacity: [0.8, 0], duration: 300, delay: 1500, ease: 'outQuad' }),
```

A tall vertical `<line>` whose `x1` and `x2` both tween 0→800, sliding it
across the canvas in 1500ms, then fading out once it reaches the right edge
(`delay: 1500`).

### Position-driven reveal

```tsx
cells.forEach(rect => {
  const x = parseFloat(rect.getAttribute('x') || '0')
  const delay = (x / 800) * 1400
  animations.push(
    animate(rect, {
      opacity: [0, 1], duration: 200, delay: delay + Math.random() * 80, ease: 'outQuad',
    }),
  )
})
```

The clever bit: each cell's fade-in **delay is derived from its x position** —
`(x/800)*1400` maps left-edge cells to ~0ms and right-edge cells to ~1400ms.
Since the sweep line also travels left→right over 1500ms, cells appear *as the
line passes over them*, selling the "scanning" illusion. `Math.random()*80`
adds jitter so columns don't pop in as a rigid wall. `parseFloat(getAttribute…)`
reads the value back off the DOM (it was stored as a string).

The slice counter is the standard object-counter idiom (`HelixScene.tsx.md`)
counting to 240, `String(v).padStart(3,'0')` → "007".

### Cleanup

```tsx
return () => {
  animations.forEach(a => a.pause())
  while (svg.firstChild) svg.removeChild(svg.firstChild)
}
```

The minimal mandatory cleanup — this scene uses no `setTimeout` (all timing is
expressed via anime.js `delay`), so there are no timers to clear.

## Libraries & APIs used

- **React / anime.js / DOM-SVG / CSS Modules / TypeScript** — shared set
  (`HelixScene.tsx.md`).
- New: SVG `<rect>`, `Math.sqrt` distance, normalised coordinates, manual RGB
  lerp, `parseFloat`/`getAttribute` round-trip, deriving `delay` from geometry.

## Concepts to learn here

- A pixel grid + circular mask via `continue` on a distance test.
- Euclidean distance and normalised coordinates.
- Linear interpolation (lerp) between two RGB colours, per channel — the math
  anime.js hides when it tweens a colour.
- Synchronising two independent animations (the sweep line and the per-cell
  fade) by deriving one's `delay` from position so they *look* causally linked
  even though they're separate tweens.

## How to edit it safely

- **Resolution:** raise `COLS`/`ROWS` for a finer image (more `<rect>` nodes —
  cost grows with `COLS*ROWS`).
- **Recolour the scan:** change the `purple`/`cream` RGB triples.
- **Sweep speed:** change the `1500` in the sweep `animate` *and* keep the
  per-cell `(x/800)*1400` factor close to it so cells still reveal under the
  line. They're intentionally coupled; edit together. Keep total time within
  this scene's `duration` (3600ms) in `HomeMashup`'s `SCENES`.
- **Mask shape/size:** tweak the `1.05` threshold (bigger = larger disc) or the
  `dx`/`dy` normalisation for an ellipse.
- **Gotcha:** the "scan" illusion only holds while sweep duration ≈ the cell
  delay span. Change one without the other and the line and the reveal
  desynchronise.
- Universal scene gotchas (cleanup, `createElementNS`, string attributes) are
  in `HelixScene.tsx.md`.
