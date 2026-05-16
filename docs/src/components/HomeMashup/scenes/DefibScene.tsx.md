# `src/components/HomeMashup/scenes/DefibScene.tsx`

## What this file is

A carousel scene: a charge bar fills, the bar wipes away, "CLEAR" flashes, and
three concentric shockwave rings radiate outward. The Joule readout ticks
0 → 200J.

Follows the **shared scene contract / skeleton** (`HelixScene.tsx.md` — read
first). Main lesson here: **multi-phase choreography with `setTimeout`, and the
`onComplete` callback on an anime.js tween to remove DOM nodes at the right
moment.**

## Line-by-line / block walkthrough

### Phase 0 — the charge bar (set up immediately)

```tsx
const track = document.createElementNS(SVG_NS, 'rect')   // grey groove
…
const fill = document.createElementNS(SVG_NS, 'rect')    // crimson fill, width 0
fill.setAttribute('width', '0')
…
const clearLbl = document.createElementNS(SVG_NS, 'text') // "CLEAR", opacity 0
clearLbl.setAttribute('opacity', '0')
clearLbl.textContent = 'CLEAR'
```

A `track` rect (the empty groove, faint), a `fill` rect starting at `width 0`,
and a hidden `CLEAR` `<text>` are all created up front. `rx` rounds the bar
ends. Nothing is visible yet except the track.

```tsx
const animations: ReturnType<typeof animate>[] = [
  animate(fill, { width: [0, trackW], duration: 1100, ease: 'inQuad' }),
  animate({ v: 0 }, {
    v: 200, duration: 1100, ease: 'inQuad',
    onUpdate: (anim) => {
      const v = Math.round((anim.targets[0] as { v: number }).v)
      onReadoutChange('Defibrillator', `Charging ${v}J`)
    },
  }),
]
```

Two simultaneous tweens started at t=0: the `fill` rect's `width` grows 0 →
`trackW` over 1100ms (the bar charging), and the object-counter idiom
(`HelixScene.tsx.md`) drives the "Charging …J" readout to 200 over the same
1100ms. `ease: 'inQuad'` accelerates — the charge "ramps up".

### Phase 1 — wipe the bar (1100ms)

```tsx
const wipeTimer = window.setTimeout(() => {
  animations.push(
    animate(fill, {
      opacity: [1, 0], duration: 250, ease: 'outQuad',
      onComplete: () => { if (fill.parentNode) fill.parentNode.removeChild(fill) },
    }),
    animate(track, {
      opacity: [1, 0], duration: 250, ease: 'outQuad',
      onComplete: () => { if (track.parentNode) track.parentNode.removeChild(track) },
    }),
  )
}, 1100)
```

The **multi-phase pattern**: a `setTimeout` at 1100ms (exactly when the bar hits
full) starts the next beat. Both bar parts fade out over 250ms. The new idea is
anime.js's **`onComplete` callback**: it fires once the *tween* finishes, and
here it removes the node from the DOM (`parentNode.removeChild`, guarded by
`if (fill.parentNode)` in case it's already gone). This is how you sequence
"animate, *then* clean up that specific element" — the bar is gone before the
big "CLEAR" drops, so they never overlap. The in-file comments narrate this
ordering; read them.

### Phase 2 — CLEAR flash + shockwaves (1400ms)

```tsx
const shockTimer = window.setTimeout(() => {
  animations.push(
    animate(clearLbl, { opacity: [0, 1, 1, 0], duration: 700, ease: 'outQuad' }),
  )

  const waves = [
    { color: 'var(--crimson)', maxR: 600, delay: 0,   opacity: 0.9 },
    { color: 'var(--crimson)', maxR: 500, delay: 100, opacity: 0.7 },
    { color: 'var(--ink)',     maxR: 700, delay: 50,  opacity: 0.5 },
  ]
  waves.forEach(w => {
    const c = document.createElementNS(SVG_NS, 'circle')
    c.setAttribute('r', '0'); c.setAttribute('fill', 'none')
    c.setAttribute('stroke', w.color); …
    svg.appendChild(c)
    animations.push(
      animate(c, {
        r: [0, w.maxR], opacity: [w.opacity, 0],
        duration: 800, delay: w.delay, ease: 'outQuad',
      }),
    )
  })
}, 1400)
```

A second `setTimeout` at 1400ms (after the 1100ms charge + 250ms wipe ≈ 1350ms,
with margin). The `CLEAR` text uses a **four-keyframe opacity tween**
`[0, 1, 1, 0]` — fade in, hold, hold, fade out — anime.js distributes the
keyframes evenly across the 700ms, giving a flash-and-linger. Then three
stroked `<circle>`s start at `r: 0` and expand to `maxR` while fading
`opacity → 0`: classic radiating shockwaves. Each has a different colour, size
and small `delay` so the rings don't move in perfect lockstep — a more organic
blast.

### Cleanup

```tsx
return () => {
  clearTimeout(shockTimer)
  clearTimeout(wipeTimer)
  animations.forEach(a => a.pause())
  while (svg.firstChild) svg.removeChild(svg.firstChild)
}
```

Mandatory cleanup **plus clearing both phase timers** (`wipeTimer`,
`shockTimer`). Critical because this scene's phases are deferred: if the scene
unmounts mid-charge, an uncleared timer would later fire and animate/append to a
detached SVG.

## Libraries & APIs used

- **React / anime.js / DOM-SVG / CSS Modules / TypeScript** — shared set
  (`HelixScene.tsx.md`).
- New: anime.js **`onComplete`** callback for post-tween DOM removal,
  multi-`setTimeout` choreography, four-keyframe opacity flash, expanding
  stroked circles for shockwaves.

## Concepts to learn here

- Choreographing distinct phases with chained `setTimeout`s, sized to match the
  preceding phase's duration.
- `onComplete` to remove a node exactly when its exit animation ends (and
  guarding the removal with a `parentNode` check).
- Multi-keyframe opacity (`[0,1,1,0]`) for flash-and-hold.
- Expanding-circle shockwave: tween `r` up + `opacity` down.

## How to edit it safely

- **Retime phases:** the three phase offsets (`0`, `1100`, `1400`) must stay in
  order — each later phase must start after the previous one's animation
  finishes (charge 1100 + wipe 250 ≈ 1350 < 1400). Shift one, re-check the
  chain. Total must fit this scene's `duration` (3600ms) in `HomeMashup`'s
  `SCENES` (see `HomeMashup.tsx.md`).
- **More/bigger shockwaves:** add entries to `waves` (each `{color,maxR,delay,
  opacity}`).
- **Gotcha:** keep `clearTimeout(wipeTimer)` *and* `clearTimeout(shockTimer)` in
  cleanup. Deferred phases must be cancellable.
- **Gotcha:** guard DOM removals with `if (node.parentNode)` — the node may
  already be detached (e.g. cleanup ran first), and `removeChild` on a detached
  node throws.
- Universal scene gotchas in `HelixScene.tsx.md`.
