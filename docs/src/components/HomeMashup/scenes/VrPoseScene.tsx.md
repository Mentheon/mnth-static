# `src/components/HomeMashup/scenes/VrPoseScene.tsx`

## What this file is

The most elaborate carousel scene, a pose-tracking splash with a long
choreography: sensor-noise dots scatter and dissolve → skeleton joints fly in
and snap to anatomy (confidence ticks to 0.99) → bones connect the joints → a VR
headset materialises on the head → a play button appears → a virtual cursor
glides in and "presses" it (depress + ripple) → a happy face pops in beside the
headset and idle-bobs forever.

Follows the **shared scene contract / skeleton** (`HelixScene.tsx.md` — read
first). New concepts: **a named skeleton model + bone adjacency list, deeply
nested `setTimeout` phases, `transform-origin` for CSS-transform animation, the
nested-`<g>` trick to compose an SVG-attribute placement with anime CSS
transforms, and a looping/alternating idle animation.**

## Line-by-line / block walkthrough

### Module-level model: skeleton + bones + floor

```tsx
const SKELETON = {
  head:      { x: 400, y: 135 },
  neck:      { x: 400, y: 175 },
  …
} as const
type JointKey = keyof typeof SKELETON

const BONES: [JointKey, JointKey][] = [
  ['head', 'neck'], ['neck', 'lShoulder'], …
]
```

The skeleton is a **named coordinate model** declared at module scope (constant
data, like `EhrScene`'s `LINES`). The TypeScript here is worth studying:

- **`as const`** makes the object *deeply readonly* and narrows every value to
  its literal type. Without it, `SKELETON.head.x` is type `number`; with it,
  TypeScript knows the exact keys.
- **`type JointKey = keyof typeof SKELETON`** — `typeof SKELETON` is the
  object's *type*; `keyof` extracts its keys as a union
  (`'head' | 'neck' | …`). So `JointKey` is auto-derived from the data — add a
  joint to `SKELETON` and `JointKey` updates itself.
- `BONES: [JointKey, JointKey][]` is an **adjacency list** of joint-name pairs
  (compare `MoleculeScene.tsx.md`'s index-pair bonds; here pairs are *names*,
  which is safer — a typo'd joint name is a compile error).

`FLOOR_LINES` is a tuple array describing a vanishing-point floor grid.

### Phase 0 — sensor noise + floor (t=0)

```tsx
for (let i = 0; i < 50; i++) {
  const j = document.createElementNS(SVG_NS, 'circle')
  … random position …
  animations.push(
    animate(j, { cx: x + (Math.random()*40-20), cy: y + (Math.random()*40-20),
                 opacity: [0.4, 0], duration: 600 + Math.random()*400, ease: 'outQuad' }),
  )
}
animations.push(animate(floor, { opacity: [0, 1], duration: 500, ease: 'outQuad' }))
```

50 dots jitter slightly and fade out (pre-lock sensor noise); the floor `<g>`
fades in. Standard fade/move tweens.

### The phase ladder (nested `setTimeout`)

The rest is a **ladder of nested `setTimeout`s** — the multi-phase pattern from
`DefibScene.tsx.md`, but deeper. The outer one fires at 600ms; inside it,
further timers fire at 700, 1500, 2100, 2700 (and a nested 600 within that),
3500 ms. Each `setTimeout` id is pushed to `timers`. Reading the offsets in
order gives you the storyboard. Highlights of the new techniques:

**Joints fly in (inside the 600ms timer):**

```tsx
const keys = Object.keys(SKELETON) as JointKey[]
keys.forEach((key, i) => {
  const target = SKELETON[key]
  const startX = target.x + (Math.random()*180 - 90)
  …
  animate(j, { cx: target.x, cy: target.y, opacity: [0,1],
               duration: 600, delay: i * 35, ease: 'outBack' })
})
```

Each joint spawns offset randomly from its anatomical target and tweens to it.
**`ease: 'outBack'`** overshoots slightly past the target then settles — a
"snap into place" feel (Back easing goes beyond the end value and returns).
Confidence uses the object-counter idiom (`HelixScene.tsx.md`) to 0.99.

**Bones connect (700ms):** each bone `<line>` starts zero-length at joint A and
tweens `x2,y2` to joint B — the grow-a-line idiom from `MoleculeScene.tsx.md`.

**Headset (1500ms):** a `<g>` of rects + strap lines built around the head
coords, faded in. Note `headsetG.setAttribute('transform-origin',
`${headX}px ${headY}px`)` — **`transform-origin`** sets the pivot for any CSS
transform anime applies (so scaling/rotation happens about the head, not the
SVG origin).

**Play button + cursor press (2100 / 2700 ms):**

```tsx
animate(playG, { scale: [1, 0.82, 1.06, 1], duration: 460, ease: 'outQuad' })
…
animate(ripple, { r: [PLAY_R, PLAY_R+30], opacity: [0.7, 0], duration: 600, ease: 'outQuad' })
```

The button is a crimson disc + a `<path>` triangle (`M … L … L … Z` — `Z`
closes the path back to the start; see `buildEcgPath.ts.md` for path syntax). A
cursor circle glides in (tween `cx,cy`), then a four-keyframe **`scale`** tween
`[1, 0.82, 1.06, 1]` makes the button depress and recoil (anime.js animates CSS
`transform: scale`, pivoting at the `transform-origin` set earlier), and an
expanding ring is the click ripple (same as `DefibScene`'s shockwaves).

### The nested-`<g>` placement trick (3500ms happy face)

```tsx
const placementG = document.createElementNS(SVG_NS, 'g')
placementG.setAttribute('transform', `translate(${headX + 50} ${headY})`)

const faceG = document.createElementNS(SVG_NS, 'g')
faceG.setAttribute('opacity', '0')
// … face circle, eyes, smile path appended to faceG …
placementG.appendChild(faceG)
svg.appendChild(placementG)

animate(faceG, { opacity: [0,1], scale: [0.4, 1], duration: 500, ease: 'outBack' })
animate(faceG, { translateY: [-4, 4], duration: 1400, delay: 600,
                 loop: true, alternate: true, ease: 'inOutSine' })
```

This is the most important new lesson, and the in-file comment explains it well.
**The problem:** anime.js animates an element's *CSS* `transform` (`scale`,
`translateY`). If you put the placement (`translate(headX+50 headY)`) in the
SVG `transform` **attribute** and also let anime animate `transform` on the
*same* element, anime's CSS transform *overwrites* the attribute and the element
jumps to (0,0).

**The fix:** two nested `<g>`s. The **outer `placementG`** owns the static
position via the SVG `transform` *attribute*. The **inner `faceG`** is what
anime animates (its CSS transforms compose *on top of* the parent's placement
because it's a child). So the face is both correctly placed *and* animatable.
Remember this pattern any time you need an anime CSS transform on top of an
SVG-attribute transform.

The smile is a `<path d="M -6 4 Q 0 11 6 4">` — a single quadratic Bézier curve
(see `buildEcgPath.ts.md` for `Q`).

The idle bob: `animate(faceG, { translateY: [-4, 4], loop: true, alternate:
true, … })`. **`loop: true`** repeats forever; **`alternate: true`** reverses
direction each repeat (−4→4, then 4→−4, …), producing a smooth perpetual bob
with `ease: 'inOutSine'`. This is the only *infinite* animation in any scene —
it's safe only because the cleanup pauses it.

### Cleanup

```tsx
return () => {
  timers.forEach(id => clearTimeout(id))
  animations.forEach(a => a.pause())
  while (svg.firstChild) svg.removeChild(svg.firstChild)
}
```

Mandatory cleanup + clearing the whole nested timer ladder. Especially critical
here: the infinite idle-bob loop would run forever if not paused, and the deep
`setTimeout` nest must all be cancelled if the scene unmounts mid-sequence.

## Libraries & APIs used

- **React / anime.js / DOM-SVG / CSS Modules / TypeScript** — shared set
  (`HelixScene.tsx.md`).
- New: `as const` + `keyof typeof` to derive a key union from data; deep
  `setTimeout` nesting; SVG `transform-origin`; the nested-`<g>`
  attribute-vs-CSS-transform composition trick; anime.js `scale`/`translateY`
  CSS transforms, `loop`/`alternate` infinite animation, `outBack` overshoot
  easing; `<path>` `Z` close command.

## Concepts to learn here

- Deriving a TypeScript union from a data object (`keyof typeof X`, `as const`).
- Named adjacency lists (typo-safe vs. index pairs).
- Deep multi-phase choreography via nested timers (read offsets as a storyboard).
- **The nested-`<g>` trick**: outer = SVG-attribute placement, inner = anime CSS
  transform, so they compose instead of clobbering. (The single most
  transferable lesson in this scene.)
- `transform-origin` to set a CSS-transform pivot on an SVG node.
- `loop` + `alternate` for a perpetual idle animation — and why cleanup makes it
  safe.
- Overshoot (`outBack`) easing for "snap" feel.

## How to edit it safely

- **Change the pose:** edit the `SKELETON` coordinates; `JointKey` updates
  automatically. Update `BONES` if you add/remove joints (names are
  compile-checked).
- **Retime the storyboard:** the offsets `600 / 700 / 1500 / 2100 / 2700 / 3500`
  must remain ordered, each starting after the previous beat's animation. The
  whole sequence (plus the perpetual bob) must fit this scene's `duration`
  (6500ms — the longest in the carousel) in `HomeMashup`'s `SCENES` (see
  `HomeMashup.tsx.md`).
- **Move the happy face:** edit the `placementG` `translate(...)` — never put a
  position on `faceG`; that's the element anime transforms (the trick above).
- **Gotcha:** keep the nested-`<g>` split. Animating `transform` on a `<g>` that
  also has an SVG `transform` attribute makes it jump to (0,0).
- **Gotcha:** the idle bob is `loop: true` — it *must* be paused in cleanup
  (it is). If you add more looping animations, they must be in `animations` so
  the `.pause()` loop catches them, or they leak forever across scene switches.
- **Gotcha:** clear the entire `timers` array — the deep `setTimeout` nest must
  all be cancellable on unmount.
- Universal scene gotchas in `HelixScene.tsx.md`.
