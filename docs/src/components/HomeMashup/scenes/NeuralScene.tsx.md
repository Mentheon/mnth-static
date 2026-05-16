# `src/components/HomeMashup/scenes/NeuralScene.tsx`

## What this file is

A carousel scene: a five-layer feed-forward neural network with all-pairs edges.
Layers fade in left→right, then "pulses" recolour random subsets of edges and
nodes crimson in waves; an epoch counter ticks 0 → 4096.

Follows the **shared scene contract / skeleton** (`HelixScene.tsx.md` — read
first). New concepts: **nested layout loops, building a fully-connected graph,
random sampling, animating `stroke`/`fill` colour and re-firing pulses on a
timer.**

## Line-by-line / block walkthrough

### Laying out the layers (nested loop)

```tsx
const layers = [5, 8, 8, 6, 3]
const startX = 130, endX = 670
const layerSpacing = (endX - startX) / (layers.length - 1)
const nodes: { el: SVGCircleElement; x: number; y: number }[][] = []

layers.forEach((count, li) => {
  const x = startX + li * layerSpacing
  const totalH = 320
  const gap = totalH / (count + 1)
  for (let i = 0; i < count; i++) {
    const y = 100 + gap * (i + 1)
    const c = document.createElementNS(SVG_NS, 'circle')
    …
    layerNodes.push({ el: c, x, y })
  }
  nodes.push(layerNodes)
})
```

`layers = [5, 8, 8, 6, 3]` is the node count per column. The outer loop spaces
the 5 layers evenly between x=130 and x=670 (`layerSpacing` = even gap). The
inner loop distributes `count` nodes vertically: `gap = totalH/(count+1)` then
`y = 100 + gap*(i+1)` leaves equal margins top and bottom (the `+1`s ensure
nodes don't touch the edges). `nodes` is a **2-D array** (`[][]`): `nodes[li]`
is the array of node objects for layer `li`. Each node is a `<circle>` with
`fill: var(--bg)` and a `stroke` outline — a hollow "neuron".

### Fully-connected edges (all-pairs)

```tsx
for (let li = 0; li < layers.length - 1; li++) {
  nodes[li].forEach(a => {
    nodes[li + 1].forEach(b => {
      const line = document.createElementNS(SVG_NS, 'line')
      line.setAttribute('x1', String(a.x)); line.setAttribute('y1', String(a.y))
      line.setAttribute('x2', String(b.x)); line.setAttribute('y2', String(b.y))
      …
      svg.insertBefore(line, svg.firstChild)
      edges.push({ line, layer: li })
    })
  })
}
```

A **triple-nested loop** builds every edge between consecutive layers: for each
adjacent layer pair, connect *every* node `a` in layer `li` to *every* node `b`
in layer `li+1` (a Cartesian product → "all-pairs"/dense connectivity). Each
edge stores `layer: li` so pulses can target one inter-layer band. `insertBefore`
puts edges first in document order so they paint *behind* the node circles (SVG
has no z-index; see `MoleculeScene.tsx.md`).

### Fade-in animations

```tsx
const animations = [
  animate(edges.map(e => e.line), {
    opacity: [0, 0.18], duration: 400, delay: stagger(2), ease: 'outQuad',
  }),
]
nodes.forEach((layer, li) => {
  animations.push(
    animate(layer.map(n => n.el), {
      opacity: [0, 1], duration: 300, delay: 200 + li * 100, ease: 'outQuad',
    }),
  )
})
```

Edges fade to a faint 0.18 with `stagger(2)` (anime.js per-element cascade —
see `HelixScene.tsx.md`). Nodes fade in **layer by layer**: every node in layer
`li` shares `delay: 200 + li*100`, so columns light up left→right.

### Firing pulses (colour animation + sampling)

```tsx
const firePulse = () => {
  layers.forEach((_, li) => {
    if (li === 0) return
    const t = window.setTimeout(() => {
      const subset = edges.filter(e => e.layer === li - 1)
      const sample = [...subset].sort(() => Math.random() - 0.5).slice(0, Math.floor(subset.length * 0.4))
      sample.forEach(e => {
        animations.push(
          animate(e.line, {
            opacity: [0.18, 0.85, 0.18],
            stroke: ['var(--ink)', 'var(--crimson)', 'var(--ink)'],
            strokeWidth: [0.5, 1.6, 0.5],
            duration: 300, ease: 'inOutQuad',
          }),
        )
      })
      nodes[li].forEach(n => {
        animations.push(
          animate(n.el, {
            fill: ['var(--bg)', 'var(--crimson)', 'var(--bg)'],
            r: [6, 9, 6], duration: 300, ease: 'inOutQuad',
          }),
        )
      })
    }, li * 90)
    timers.push(t)
  })
}
timers.push(window.setTimeout(firePulse, 800))
timers.push(window.setTimeout(firePulse, 1500))
```

The pulse logic introduces several ideas:

- **`[...subset].sort(() => Math.random() - 0.5).slice(0, n)`** — a quick
  *random sample*: copy the array (`[...subset]` spread, to avoid mutating
  `edges`), shuffle by sorting with a random comparator, take the first ~40%.
  (It's a rough shuffle, fine for a visual effect.) So only some edges in the
  band flash, looking like signal propagation rather than the whole net lighting
  up.
- **Three-keyframe tween arrays**: `opacity: [0.18, 0.85, 0.18]` and
  `stroke: ['var(--ink)', 'var(--crimson)', 'var(--ink)']` mean *start → peak →
  return*. anime.js can tween `stroke`/`fill` **colours** (it interpolates the
  RGB) and `strokeWidth` — so an edge flares bright crimson and thick, then
  settles back. Likewise nodes pulse `fill` to crimson and `r` 6→9→6 (a brief
  swell).
- **Wave timing**: `setTimeout(..., li * 90)` inside the loop makes layer 1
  pulse, then layer 2 ~90ms later, etc. — the pulse "travels" left→right through
  the network.
- `firePulse` is called twice (at 800ms and 1500ms) so the network pulses again,
  reinforcing the "forward pass" idea.

The epoch counter is the standard object-counter idiom (see `HelixScene.tsx.md`)
counting to 4096, `padStart(4,'0')` zero-padding to "0042".

### Cleanup

```tsx
return () => {
  timers.forEach(id => clearTimeout(id))
  animations.forEach(a => a.pause())
  while (svg.firstChild) svg.removeChild(svg.firstChild)
}
```

Mandatory cleanup + clearing every pulse timer (this scene schedules many).

## Libraries & APIs used

- **React / anime.js / DOM-SVG / CSS Modules / TypeScript** — shared set
  (`HelixScene.tsx.md`).
- New: anime.js multi-keyframe arrays and **colour** tweening
  (`stroke`/`fill`), 2-D arrays, nested loops, array spread + random-comparator
  shuffle + `slice` sampling, `padStart`.

## Concepts to learn here

- Nested loops for grid/graph layout; 2-D arrays (`T[][]`).
- Building all-pairs connectivity (Cartesian product of two layers).
- Random sampling via spread + shuffle + `slice`.
- Multi-keyframe tweens (`[start, peak, end]`) and colour interpolation.
- Staggering with per-index `setTimeout` to make an effect "travel".

## How to edit it safely

- **Reshape the network:** edit `layers = [5,8,8,6,3]`. Edge count grows as the
  sum of products of adjacent layers — big layers explode the node/line count
  and the all-pairs loop; keep it modest for performance.
- **Denser/sparser pulses:** change the `0.4` in
  `Math.floor(subset.length * 0.4)` (fraction of edges that flash).
- **More pulse waves:** add another `setTimeout(firePulse, …)`; keep all firings
  inside this scene's `duration` (4400ms) in `HomeMashup`'s `SCENES`.
- **Gotcha:** copy with `[...subset]` before `.sort()` — `sort` mutates in
  place; sorting `edges` directly would scramble the shared array for later
  pulses.
- **Gotcha:** keep `timers.forEach(clearTimeout)` in cleanup — pulses are all
  deferred via `setTimeout`.
- Universal scene gotchas (cleanup, `createElementNS`, string attrs, paint
  order via `insertBefore`) are covered in `HelixScene.tsx.md` /
  `MoleculeScene.tsx.md`.
