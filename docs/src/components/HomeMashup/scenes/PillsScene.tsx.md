# `src/components/HomeMashup/scenes/PillsScene.tsx`

## What this file is

A carousel scene: 36 two-tone capsule pills cascade down through the canvas with
varied rotation; a "Dispensed" counter ticks 0 → 36.

Follows the **shared scene contract / skeleton** (`HelixScene.tsx.md` — read
first). New concept: **animating a composite SVG `transform` (translate + rotate
together) by tweening a proxy object and reprojecting it every frame.**

## Line-by-line / block walkthrough

### A pill is a `<g>` of two rounded rects

```tsx
const g = document.createElementNS(SVG_NS, 'g')
g.setAttribute('transform', `translate(${x} ${startY}) rotate(${rot0})`)
const w = 50, h = 20
const r1 = document.createElementNS(SVG_NS, 'rect')
r1.setAttribute('x', String(-w / 2)); r1.setAttribute('y', String(-h / 2))
r1.setAttribute('width', String(w / 2)); r1.setAttribute('height', String(h))
r1.setAttribute('rx', String(h / 2))
r1.setAttribute('fill', c[0])
const r2 = document.createElementNS(SVG_NS, 'rect')
r2.setAttribute('x', '0'); r2.setAttribute('y', String(-h / 2))
r2.setAttribute('width', String(w / 2)); r2.setAttribute('height', String(h))
r2.setAttribute('rx', String(h / 2))
r2.setAttribute('fill', c[1])
g.appendChild(r1); g.appendChild(r2)
```

Each pill is a `<g>` group (see `CellScene.tsx.md` for `<g>` basics) holding two
`<rect>`s drawn around the local origin `(0,0)`:

- `r1` spans `x = -w/2 … 0` (left half), `r2` spans `x = 0 … w/2` (right half) —
  two halves meeting at centre, each a different colour from the `colors` pair
  `c`. This makes the classic two-tone capsule.
- **`rx` (= `h/2`)** is the rectangle's corner radius. Setting it to half the
  height fully rounds the short ends into a capsule/lozenge shape.
- Drawing around `(0,0)` (note the negative `x`/`y` offsets) is deliberate: it
  puts the pill's *centre* at the group origin, so `rotate()` on the group spins
  it about its middle, not a corner.
- The group's initial `transform` combines `translate(x startY) rotate(rot0)` —
  position **and** orientation in one attribute string. Pills start above the
  canvas (`startY = -60 - random*200`, off-screen top) at a random angle.

### Animating translate+rotate via a proxy object

```tsx
pills.forEach((p, i) => {
  animations.push(
    animate(p, {
      y: p.endY,
      rot: p.endRot,
      duration: 900 + Math.random() * 300,
      delay: i * 60,
      ease: 'inQuad',
      onUpdate: () => {
        p.el.setAttribute('transform', `translate(${p.x} ${p.y}) rotate(${p.rot})`)
      },
    }),
  )
})
```

Key technique (also seen in `CellScene`): anime.js can't directly tween a
*composite SVG `transform` string*. So instead we **animate a plain JS object**
— here the `Pill` record `p` itself, which holds numeric `x`, `y`, `rot`. anime
tweens `p.y → p.endY` and `p.rot → p.endRot`, and every frame **`onUpdate`
rebuilds the transform string** from the current numbers and writes it onto the
group. The pill falls (`y` increases — remember +y is *down* in SVG) while
spinning (`rot`). `ease: 'inQuad'` accelerates downward, mimicking gravity.
Per-pill randomness in duration and a `delay: i*60` make them cascade rather
than fall in lockstep. `endRot = rot0 + (random*720 - 360)` gives each pill up
to ±360° of additional spin.

The "Dispensed" counter is the standard object-counter idiom
(`HelixScene.tsx.md`) counting to `N` with `ease: 'linear'`.

### Cleanup

```tsx
return () => {
  animations.forEach(a => a.pause())
  while (svg.firstChild) svg.removeChild(svg.firstChild)
}
```

Minimal mandatory cleanup — no `setTimeout` here (all timing via anime `delay`),
so no timers to clear.

## Libraries & APIs used

- **React / anime.js / DOM-SVG / CSS Modules / TypeScript** — shared set
  (`HelixScene.tsx.md`).
- New: SVG `<rect>` with `rx` rounded corners, `<g>` composite
  `translate()+rotate()`, the animate-a-proxy-object-then-reproject pattern,
  per-element randomness for organic motion.

## Concepts to learn here

- Building a shape from primitives around a local origin so rotation pivots at
  the centre.
- `rx` on `<rect>` for pill/lozenge shapes.
- Why composite `transform` strings need the proxy-object animation pattern
  (you cannot tween `transform="translate(...) rotate(...)"` directly).
- Randomising duration/delay/rotation per element to avoid robotic uniformity.

## How to edit it safely

- **More/fewer pills:** change `const N = 36`. Also drives the counter target.
- **Recolour:** edit the `colors` array of `[left, right]` pairs; pills cycle
  through it via `i % colors.length`.
- **Pill size:** change `w`/`h`. Keep `rx = h/2` to preserve the capsule
  roundness; the `±w/2`, `±h/2` offsets keep the pivot centred.
- **Retime fall:** adjust the `900 + random*300` duration and `i*60` stagger;
  the slowest pill (`(N-1)*60 + 1200`ms) must finish within this scene's
  `duration` (3200ms) in `HomeMashup`'s `SCENES`.
- **Gotcha:** you must keep the `onUpdate` reprojection. Removing it (or trying
  to `animate(g, { transform: … })`) breaks the motion — anime can't tween the
  composite transform string.
- Universal scene gotchas (cleanup, `createElementNS`, string attrs) in
  `HelixScene.tsx.md`.
