# `src/components/HomeMashup/scenes/CellScene.tsx`

## What this file is

A carousel scene: a single cell exponentially divides for ~7 generations; the
readout ticks elapsed culture hours and the population count.

It follows the **shared scene contract / skeleton** (explained once in
`HelixScene.tsx.md` — read that first). New concepts here:
**`<g>` group transforms, recursive `setTimeout` scheduling, and animating a
plain object whose values you write back onto the DOM yourself via `onUpdate`.**

## Line-by-line / block walkthrough

### A cell is a `<g>` group

```tsx
const makeCell = (x: number, y: number, r: number): Cell => {
  const g = document.createElementNS(SVG_NS, 'g')
  g.setAttribute('transform', `translate(${x} ${y})`)
  const outer = document.createElementNS(SVG_NS, 'circle')
  outer.setAttribute('r', String(r))
  outer.setAttribute('fill', 'rgba(163,11,55,0.18)')
  outer.setAttribute('stroke', 'var(--crimson)')
  …
  const nuc = document.createElementNS(SVG_NS, 'circle')
  nuc.setAttribute('r', String(r * 0.45))
  …
  g.appendChild(outer); g.appendChild(nuc)
  return { el: g, x, y, r }
}
```

An **SVG `<g>`** is a *group*: a container with no shape of its own. Its
`transform="translate(x y)"` shifts *everything inside it*. So the two circles
(membrane `outer` + `nuc`leus) are drawn at the local origin `(0,0)` and the
group's `translate` positions the whole cell. This is the standard way to move a
multi-part object as one unit: animate/set the group's transform, not each
child. The membrane uses a literal `rgba(...)` fill (semi-transparent crimson)
instead of a theme variable because it needs partial alpha.

```tsx
let cells: Cell[] = []
const initial = makeCell(400, 260, 30)
svg.appendChild(initial.el)
cells.push(initial)
```

Start with one cell at canvas centre, radius 30. `cells` is the live population
list.

### One division step

```tsx
const divideAll = () => {
  elapsed += 4
  const newCells: Cell[] = []
  cells.forEach(cell => {
    const { x, y, r } = cell
    const newR = Math.max(7, r * 0.78)
    const ang = Math.random() * Math.PI * 2
    const sep = r * 1.1
    const c1x = Math.max(60, Math.min(740, x + Math.cos(ang) * sep + (Math.random() * 30 - 15)))
    const c1y = Math.max(80, Math.min(440, y + Math.sin(ang) * sep + (Math.random() * 30 - 15)))
    const c2x = Math.max(60, Math.min(740, x - Math.cos(ang) * sep + …))
    const c2y = Math.max(80, Math.min(440, y - Math.sin(ang) * sep + …))
```

For every existing cell, compute two daughter targets:

- `newR = Math.max(7, r * 0.78)` — daughters are 78% the size, but never below
  7 (a floor so deep generations stay visible).
- `ang = Math.random() * 2π` — a random split direction.
- `Math.cos(ang)*sep` / `Math.sin(ang)*sep` — the two daughters move in
  **opposite directions** along that random axis (`+` vs `−`), like a real cell
  pinching apart, plus a little jitter `Math.random()*30 - 15` (∈ [−15, +15]).
- `Math.max(60, Math.min(740, …))` is the **clamp idiom**: keep the value
  between 60 and 740 so daughters can't drift off-canvas. `Math.min` caps the
  top, `Math.max` caps the bottom.

```tsx
    const child1 = makeCell(x, y, newR)
    const child2 = makeCell(x, y, newR)
    svg.appendChild(child1.el)
    svg.appendChild(child2.el)
    cell.el.remove()

    animations.push(
      animate({ x, y }, {
        x: c1x, y: c1y,
        duration: 500,
        ease: 'outCubic',
        onUpdate: (anim) => {
          const obj = anim.targets[0] as { x: number; y: number }
          child1.el.setAttribute('transform', `translate(${obj.x} ${obj.y})`)
          child1.x = obj.x; child1.y = obj.y
        },
      }),
      animate({ x, y }, { x: c2x, y: c2y, … same for child2 … }),
    )
    newCells.push(child1, child2)
  })
  cells = newCells
  onReadoutChange(`Cell culture · t = ${elapsed}h`, `Pop. ${cells.length.toLocaleString()}`)
}
```

Each parent spawns two daughters *at the parent's position*, then the parent is
removed (`cell.el.remove()`).

The animation here is a variant of the object-counter idiom from
`HelixScene.tsx.md`, but instead of feeding a *readout*, **`onUpdate` writes the
tweened values back onto the DOM**: anime.js tweens a plain `{ x, y }` object
from the parent's spot toward the daughter target, and every frame we set the
group's `transform="translate(x y)"`. This is how you animate an SVG attribute
that anime.js can't tween directly (a composite `transform` string) — animate a
proxy object and project it onto the node yourself. We also write back
`child1.x/y` so the *next* generation divides from the daughter's settled
position. The population/time readout updates once per generation.

### Recursive timed scheduling

```tsx
const tickDivision = () => {
  if (step < generations && alive) {
    divideAll()
    step++
    const id = window.setTimeout(tickDivision, 380)
    timers.push(id)
  }
}
timers.push(window.setTimeout(tickDivision, 200))
```

This is the new scheduling pattern: a function that, at the end of its work,
**schedules itself again** via `setTimeout(tickDivision, 380)`, stopping when
`step` reaches `generations` (7) *or* `alive` flips false. This produces a
"every 380ms, do the next generation" cadence — like a manual `setInterval`, but
self-limiting and easy to cancel. The first call is delayed 200ms. Every timer
id is pushed to `timers` for cleanup.

`let alive = true` plus the `alive` check is a **guard flag**: cleanup sets
`alive = false`, so even if a timer callback is already queued when the scene
unmounts, `tickDivision` sees `alive === false` and does nothing. Belt-and-braces
alongside `clearTimeout`.

### Cleanup

```tsx
return () => {
  alive = false
  timers.forEach(id => clearTimeout(id))
  animations.forEach(a => a.pause())
  while (svg.firstChild) svg.removeChild(svg.firstChild)
}
```

The mandatory cleanup plus two extras: flip the `alive` guard and clear *every*
recursively-scheduled timer. Both matter because the scene schedules many timers
over its lifetime.

## Libraries & APIs used

- **React / anime.js / DOM-SVG / CSS Modules / TypeScript** — the shared set
  (see `HelixScene.tsx.md`).
- New here: SVG `<g>` + `transform="translate()"`, recursive `setTimeout`
  self-scheduling, `Math.max`/`Math.min` clamping, `Math.cos`/`Math.sin` for a
  random split axis, a local `type Cell = {…}` alias.

## Concepts to learn here

- `<g>` grouping + a group `transform` to move a multi-part object as one.
- Animating an unsupported composite attribute by tweening a proxy object and
  writing it onto the DOM in `onUpdate`.
- Recursive/self-scheduling `setTimeout` for a finite repeating cadence.
- The clamp idiom `Math.max(lo, Math.min(hi, v))`.
- An `alive` guard flag complementing `clearTimeout` for robust teardown.

## How to edit it safely

- **More/fewer generations:** change `const generations = 7`. Population doubles
  each step, so node count grows as `2^generations` (7 → 128 cells). Large
  values get expensive fast — keep the size floor (`Math.max(7, …)`) so they
  stay visible, and ensure total runtime
  (`200 + generations*380` ms + 500ms last move) fits this scene's `duration`
  (4200ms) in `HomeMashup`'s `SCENES` (see `HomeMashup.tsx.md`).
- **Faster division:** lower the `380` in the self-`setTimeout`.
- **Tighter spread:** shrink `sep` or the jitter range; the clamp bounds
  (60/740/80/440) keep cells on-canvas — widen the viewBox before widening these.
- **Gotcha:** keep both `alive = false` *and* `timers.forEach(clearTimeout)` in
  cleanup. A self-scheduling loop that isn't both flagged and cleared can fire
  once more after unmount.
- See `HelixScene.tsx.md` for the universal scene gotchas (cleanup,
  `createElementNS`, string attributes).
