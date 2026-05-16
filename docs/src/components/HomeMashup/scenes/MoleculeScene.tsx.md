# `src/components/HomeMashup/scenes/MoleculeScene.tsx`

## What this file is

A carousel scene: atoms drift in from random positions, snap into a benzene-ring
layout with H and N substituents, bonds draw between them, and a binding-energy
readout (ΔG) ticks down to −42.7 kcal/mol.

It implements the **shared scene contract / skeleton** — `useRef` to the
`<svg>`, one `useEffect([onReadoutChange])`, imperative `createElementNS`
drawing, anime.js animation, mandatory cleanup. That boilerplate is explained
once in `HelixScene.tsx.md`; read that first. This doc covers only what's new
here: **polar-coordinate layout, atoms flying to targets, and bonds that grow.**

## Line-by-line / block walkthrough

### Building target positions with polar coordinates

```tsx
const cx = 400, cy = 260
const ringR = 70
for (let i = 0; i < 6; i++) {
  const a = (i / 6) * Math.PI * 2
  targets.push({ x: cx + Math.cos(a) * ringR, y: cy + Math.sin(a) * ringR, kind: 'C' })
}
```

This is the core new concept: **placing points evenly on a circle**. For each of
6 carbons, the angle `a = (i/6) * 2π` divides the full circle (`2π` radians)
into 6 equal slices. Then:

- `x = cx + cos(a) * r`
- `y = cy + sin(a) * r`

is the standard *polar → Cartesian* conversion: an angle + radius become an
(x, y) around centre `(cx, cy)`. The hydrogens use the same idea at a larger
radius (`ringR + 42`) and an angular offset `+ Math.PI / 6` so they sit *between*
the carbons; the nitrogens use radius `ringR + 85` with a `+ 0.4` offset. This
is the same trig family as the helix's `sin`, used here for circular layout.

```tsx
const bonds = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0],
               [0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11]]
```

A `bonds` list of index pairs into the `targets`/`atoms` arrays: the first 6
pairs close the carbon hexagon (note `[5, 0]` wraps the ring shut), the next 6
attach each hydrogen to its carbon. This *adjacency list* style (pairs of
indices) is a common, compact way to describe a graph/structure.

```tsx
const colors: Record<Kind, string> = { C: 'var(--ink)', H: 'var(--plum)', N: 'var(--crimson)', O: 'var(--crimson)' }
const radii: Record<Kind, number> = { C: 8, H: 4.5, N: 7, O: 7 }
```

`Record<Kind, string>` is a **TypeScript utility type** meaning "an object with
one key per `Kind` value, each mapping to a string". Lookup tables keyed by atom
kind — cleaner than a `switch`.

### Atoms spawn at random positions

```tsx
const atoms = targets.map(t => {
  const startX = Math.random() * 800
  const startY = Math.random() * 520
  const c = document.createElementNS(SVG_NS, 'circle')
  c.setAttribute('cx', String(startX))
  …
  c.setAttribute('opacity', '0')
  svg.appendChild(c)
  return { el: c, target: t }
})
```

Each atom is a `<circle>` created at a *random* point in the 800×520 canvas
(`Math.random()` ∈ [0,1)), invisible, remembering its intended `target`. We
keep `{ el, target }` so the animation knows where to fly each one.

```tsx
const animations = atoms.map((a, i) =>
  animate(a.el, {
    cx: a.target.x,
    cy: a.target.y,
    opacity: [0, 1],
    duration: 800,
    delay: i * 40,
    ease: 'inOutCubic',
  }),
)
```

Each atom tweens its `cx`/`cy` from its random spawn to its ring `target`, fading
in, staggered by `i * 40`ms (manual stagger via array index instead of anime's
`stagger()` — same effect). `ease: 'inOutCubic'` accelerates then decelerates —
a smooth "settle into place" motion.

### Bonds draw after the atoms arrive

```tsx
const bondTimer = window.setTimeout(() => {
  bonds.forEach((pair, i) => {
    const a = atoms[pair[0]].target
    const b = atoms[pair[1]].target
    const line = document.createElementNS(SVG_NS, 'line')
    line.setAttribute('x1', String(a.x)); line.setAttribute('y1', String(a.y))
    line.setAttribute('x2', String(a.x)); line.setAttribute('y2', String(a.y))
    …
    svg.insertBefore(line, svg.firstChild)
    animations.push(
      animate(line, { x2: b.x, y2: b.y, duration: 300, delay: i * 30, ease: 'outQuad' }),
    )
  })
}, 900)
```

This is the **phased-sequence pattern** (used across scenes): a
`window.setTimeout` schedules a later phase — here, bonds appear at 900ms, *after*
atoms have mostly arrived. Each bond `<line>` starts as a zero-length line
(`x2,y2` set equal to `x1,y1` = atom A), then `animate` tweens `x2,y2` to atom
B's position so the bond **grows out** from A to B over 300ms.

`svg.insertBefore(line, svg.firstChild)` inserts each bond as the **first**
child. SVG has no `z-index`; **paint order is document order** (later elements
draw on top). Inserting bonds first keeps them *behind* the atom circles, so
atoms sit on top of the sticks — exactly the chemistry-diagram look.

### The ΔG counter

```tsx
animations.push(
  animate({ v: 0 }, {
    v: -42.7,
    duration: 900,
    delay: 700,
    ease: 'outQuad',
    onUpdate: (anim) => {
      const v = (anim.targets[0] as { v: number }).v
      onReadoutChange('Docking ligand', `ΔG ${v.toFixed(1)} kcal/mol`)
    },
  }),
)
```

The object-counter idiom from `HelixScene.tsx.md`, counting *down* to a negative
target. `v.toFixed(1)` formats to one decimal ("-42.7"). It pushes into the
readout each frame.

### Cleanup

```tsx
return () => {
  clearTimeout(bondTimer)
  animations.forEach(a => a.pause())
  while (svg.firstChild) svg.removeChild(svg.firstChild)
}
```

Same mandatory cleanup as the reference scene, **plus `clearTimeout(bondTimer)`**
— because this scene schedules a deferred phase, the timer must be cancelled or a
late callback could fire after unmount and append a bond to a detached SVG.

## Libraries & APIs used

- **React / anime.js / DOM-SVG / CSS Modules / TypeScript** — same set as
  `HelixScene` (see that doc).
- New here: `window.setTimeout`/`clearTimeout` for phased sequencing,
  `svg.insertBefore` for paint-order control, `Record<K, V>` utility type,
  `Math.cos`/`Math.sin` for polar layout, `Number.toFixed`.

## Concepts to learn here

- Polar → Cartesian: placing points evenly on a ring with
  `cx + cos(a)*r`, `cy + sin(a)*r`.
- Adjacency-list (index-pair) description of a structure/graph.
- "Grow a line" animation: start `x2,y2 == x1,y1`, tween to the far end.
- SVG paint order = document order; `insertBefore` to put bonds behind atoms.
- The phased-sequence pattern: `setTimeout` to stage later beats, and the
  matching `clearTimeout` in cleanup.

## How to edit it safely

- **Change the molecule:** edit the `targets` loops (atom positions) and the
  `bonds` index-pair list together — a bond references atom indices, so adding
  atoms shifts indices. Get them consistent or bonds connect the wrong atoms.
- **Recolour/resize atoms:** edit the `colors` / `radii` records.
- **Retime:** the 900ms bond delay must stay *after* the atom flight finishes
  (last atom delay ≈ `atoms.length*40` + 800ms). The whole thing must fit this
  scene's `duration` (4000ms) in `HomeMashup`'s `SCENES`.
- **Gotcha:** keep `clearTimeout(bondTimer)` in cleanup — deferred phases must
  be cancelled on unmount (StrictMode/scene-switch), or you leak a late draw.
- **Gotcha:** bonds must be inserted *before* atoms in the SVG (`insertBefore`),
  not appended, or sticks paint over the atom dots.
- See `HelixScene.tsx.md` for the contract-level gotchas (cleanup,
  `createElementNS`, string attributes) that apply to every scene.
