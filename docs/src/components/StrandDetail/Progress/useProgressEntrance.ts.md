# `src/components/StrandDetail/Progress/useProgressEntrance.ts`

## What this file is

A **custom animation hook** that plays the one-shot "entrance" of the expanded
timeline: the spine strokes itself in, phase nodes pop in with a stagger, each
output branch reveals in order, then the future/projected bits fade in. It uses
the **anime.js** library to build a *timeline* (a sequence of coordinated
animation steps). It is called once from
[`ProgressTimeline`](./ProgressTimeline.tsx.md).

This is the most involved hook in the folder. Read
[`ProgressTimeline.tsx`](./ProgressTimeline.tsx.md) (especially the SVG primer
and the stroke-dash trick) first.

## Line-by-line / block walkthrough

```ts
import { useEffect, useRef } from 'react'
import { createTimeline, stagger, utils } from 'animejs'
import useReducedMotion from '../hooks/useReducedMotion'
```

- `useEffect` — run the animation as a **side effect** after render.
- `useRef` — remember "have we already played?" without causing re-renders.
- From **anime.js v4**: `createTimeline` (a sequencer of animation steps),
  `stagger` (offset a group's start times), `utils.set` (instantly set
  properties without animating).
- `useReducedMotion` — the accessibility hook
  ([`../hooks/useReducedMotion.ts`](../hooks/useReducedMotion.ts.md)).

```ts
export default function useProgressEntrance(
  rootRef: React.RefObject<SVGSVGElement | null>,
  expanded: boolean,
): void {
```

Takes the `<svg>` ref and the `expanded` flag; returns `void` (it is purely a
side effect — it does not give the component any value back, it just mutates the
DOM).

```ts
  const hasAnimatedRef = useRef<boolean>(false)
  const reduced = useReducedMotion()
```

`hasAnimatedRef` is a **ref used as a one-shot latch**. The comment explains the
key design decision: "playing the timeline is a side effect on the DOM, not
React-visible state." A `useState` boolean would cause an extra render for no UI
reason; a ref persists across renders without re-rendering. We flip it to `true`
the first time we play, so re-expanding later does *not* replay the animation
(it just shows the already-final DOM).

```ts
  useEffect(() => {
    if (!expanded) return
    if (hasAnimatedRef.current) return
    const root = rootRef.current
    if (!root) return
    hasAnimatedRef.current = true
```

The effect's **guards**, in order: do nothing until expanded; do nothing if
already played; bail if the svg ref is not attached yet. Then immediately set
the latch so a fast double-trigger cannot start two timelines.

```ts
    if (reduced) {
      root.querySelectorAll<SVGElement>(
        '.branch-line, .branch-node, .branch-terminus-cap, .phase--projected, .spine-future',
      ).forEach(el => { el.style.opacity = '1' })
      root.querySelectorAll<SVGElement>('.branch-return').forEach(el => {
        el.style.opacity = '0.7'
      })
      return
    }
```

**Reduced-motion path.** If the user requested reduced motion, *do not animate*
— instead instantly snap every element that *would* have animated in to its
final visible state (`opacity: 1`, or `0.7` for the dashed return curves) and
return early. This is essential: those elements were rendered with
`opacity={0}` (so the animation can reveal them); without this branch they would
stay invisible forever for reduced-motion users. Note the selectors are the
plain semantic class names set on the SVG elements (not CSS-module classes), and
querying is **scoped to `root`** (this svg only) so multiple timelines on a page
do not interfere — the explicit multi-instance-safety rule of this subsystem.

```ts
    const tl = createTimeline({ defaults: { ease: 'outQuad' } })
```

Create an anime.js **timeline**. A timeline chains steps; each `tl.add(target,
props, position)` appends a step. `defaults: { ease: 'outQuad' }` sets the
default easing curve (decelerating) for all steps unless overridden.

```ts
    const spinePath = root.querySelector<SVGPathElement>('.spine-active')
    if (spinePath) {
      const spineLen = spinePath.getTotalLength()
      spinePath.style.strokeDasharray  = String(spineLen)
      spinePath.style.strokeDashoffset = String(spineLen)
      tl.add(spinePath, {
        strokeDashoffset: [spineLen, 0],
        duration: 1100,
        ease: 'inOutQuad',
      })
    }
```

**Step 1 — the spine draws itself (the stroke-dash trick).**
`getTotalLength()` is an SVG DOM API returning the path's length in user units.
Set both `strokeDasharray` and `strokeDashoffset` to that length: the dash is as
long as the whole path and offset entirely out of view, so the line is
invisible. Then animate `strokeDashoffset` from `spineLen → 0`: the dash slides
into place and the line appears to be drawn left-to-right over 1100ms. The
`[from, to]` array syntax is anime.js's "animate from this to that." This is the
canonical SVG line-drawing technique.

```ts
    const phaseEls = root.querySelectorAll<SVGElement>(
      '.phase--past circle, .phase--past text, .phase--current circle, .phase--current text',
    )
    if (phaseEls.length) {
      utils.set(phaseEls, { opacity: 0, scale: 0.6 })
      tl.add(phaseEls, {
        opacity: 1,
        scale: 1,
        duration: 380,
        delay: stagger(70),
        ease: 'outBack(1.6)',
      }, '-=600')
    }
```

**Step 2 — phase nodes pop in with a stagger.** Select the circles/labels of
past + current phases (the plain class names come from
[`ProgressPhaseNode`](./ProgressPhaseNode.tsx.md)). `utils.set` *instantly*
makes them invisible and shrunk (no animation) — the starting state. Then
animate to `opacity:1, scale:1`. **`stagger(70)`** offsets each element's start
by 70ms so they pop in one-after-another rather than all at once.
`ease: 'outBack(1.6)'` overshoots slightly then settles (a springy "pop").

The third argument **`'-=600'`** is a **relative timeline position**: start this
step 600ms *before* the previous step would end (overlapping them). This overlap
is what makes the entrance feel fluid instead of strictly sequential — a core
timeline-authoring idea. (`'+=N'` would mean "N ms after"; a number means an
absolute time.)

```ts
    const branchOrder: ReadonlyArray<string> = ['paper', 'prototype', 'artefact']
    branchOrder.forEach((branchType, i) => {
      const branch = root.querySelector<SVGGElement>(`[data-branch="${branchType}"]`)
      if (!branch) return
      const line = branch.querySelector<SVGPathElement>('.branch-line')
      const node = branch.querySelector<SVGGElement>('.branch-node')
      const ret  = branch.querySelector<SVGPathElement>('.branch-return')
      const caps = branch.querySelectorAll<SVGLineElement>('.branch-terminus-cap')
```

**Step 3 — reveal each branch in a fixed canonical order.** Rather than relying
on data order, it explicitly iterates `paper → prototype → artefact`. It finds
each branch group via the `data-branch` **attribute selector** (each
[`ProgressBranch`](./ProgressBranch.tsx.md) renders `data-branch={output.type}`)
— *not* by id, keeping with the no-DOM-querying-by-id rule (attribute scoping
within `root` is still multi-instance safe). Then it grabs the branch's parts
(line, node group, optional return curve, optional terminus caps).

```ts
      if (line) {
        const lineLen = line.getTotalLength()
        line.style.strokeDasharray  = String(lineLen)
        line.style.strokeDashoffset = String(lineLen)
        line.style.opacity = '1'
        tl.add(line, {
          strokeDashoffset: [lineLen, 0],
          duration: 380,
          ease: 'inOutQuad',
        }, i === 0 ? '-=200' : '-=240')
      }
```

The branch line draws itself with the **same stroke-dash trick** as the spine.
Note `line.style.opacity = '1'` — the line was rendered with `opacity={0}` (so
it is hidden before the animation reaches it); we make it opaque just before
drawing it. The relative position differs for the first branch (`'-=200'`) vs
the rest (`'-=240'`) — fine-tuned overlap so the cascade feels even.

```ts
      if (node) {
        tl.add(node, {
          opacity: [0, 1],
          translateY: [-8, 0],
          duration: 280,
          ease: 'outBack(1.8)',
        }, '-=140')
      }
      if (ret) {
        tl.add(ret, { opacity: [0, 0.7], duration: 320 }, '-=150')
      }
      if (caps.length) {
        tl.add(caps, {
          opacity: [0, 1],
          scaleX: [0.4, 1],
          duration: 260,
          delay: stagger(60),
        }, '-=200')
      }
    })
```

For each branch: the node group fades in while sliding up 8px (`translateY:
[-8, 0]`) with a springy ease; the return curve (if any) fades to `0.7` (its
final dashed opacity — matching the reduced-motion snap value); the terminus
caps (if any) fade in and grow horizontally (`scaleX: [0.4, 1]`) with their own
stagger. Every step uses a small negative offset to overlap the previous one.
`if (...)` guards mean a branch that has no return curve or no caps simply skips
those steps — driven entirely by the data.

```ts
    const future = root.querySelector<SVGPathElement>('.spine-future')
    if (future) tl.add(future, { opacity: [0, 1], duration: 420 }, '-=100')
    const projected = root.querySelectorAll<SVGElement>('.phase--projected')
    if (projected.length) {
      tl.add(projected, { opacity: [0, 1], duration: 420 }, '-=320')
    }
  }, [expanded, reduced, rootRef])
```

**Steps 4 + 5 — the future.** The dashed future spine and the projected phase
node(s) fade in last (they were rendered with `opacity={0}`). The comment notes
**Step 6 (the looping current-phase pulse) is NOT here** — it is owned by
[`usePulse`](./usePulse.ts.md) inside
[`ProgressPhaseNode`](./ProgressPhaseNode.tsx.md), which is given a `delay:
1200` so the pulse begins roughly when this entrance finishes, *without* this
hook having to coordinate it via a `setTimeout`. That separation (one-shot
entrance here, perpetual loop in `usePulse`) is a deliberate design choice.

The **dependency array** `[expanded, reduced, rootRef]`: the effect re-checks
when expansion or the motion preference changes (or the ref identity changes).
The `hasAnimatedRef` latch ensures it still only *plays* once even though the
effect may run more than once.

## Libraries & APIs used

- **React**: `useEffect` (side effect + deps), `useRef` as a non-rendering
  one-shot latch.
- **anime.js v4**: `createTimeline`, `tl.add(target, props, position)`,
  relative positions (`'-=ms'`), `stagger`, `utils.set`, easings
  (`outQuad`/`inOutQuad`/`outBack(n)`), `[from, to]` value syntax.
- **SVG DOM**: `getTotalLength()`, `strokeDasharray`/`strokeDashoffset` (the
  line-drawing trick), `querySelector`/`querySelectorAll` scoped to a root,
  attribute selectors (`[data-branch="…"]`).
- `useReducedMotion` for the accessibility short-circuit.

## Concepts to learn here

- **Animation as a side effect** belongs in `useEffect`, not in render.
- **Ref-as-latch** for "do this once" without an extra render.
- **The SVG stroke-dash draw-on trick** (used for both spine and branch lines).
- **anime.js timelines**: sequencing with overlapping relative positions and
  staggers to make a cascade feel organic.
- **Scoped DOM queries + attribute hooks** instead of ids → multi-instance
  safety.
- **Reduced-motion accessibility**: snap-to-final instead of animate; pairs with
  the CSS `@media (prefers-reduced-motion)` used elsewhere in the folder.
- **Separation of one-shot vs looping animation** (this hook vs `usePulse`).

## How to edit it safely

- The hook depends on a **naming contract** with
  [`ProgressTimeline`](./ProgressTimeline.tsx.md),
  [`ProgressBranch`](./ProgressBranch.tsx.md) and
  [`ProgressPhaseNode`](./ProgressPhaseNode.tsx.md): the plain class names
  (`.spine-active`, `.spine-future`, `.branch-line`, `.branch-node`,
  `.branch-return`, `.branch-terminus-cap`, `.phase--past/current/projected`)
  and the `data-branch` attribute. Rename one in a component and you must update
  the matching selector here, **and vice versa**.
- Any element this hook reveals must be rendered with `opacity={0}` (or it will
  flash visible before animating) **and** must be snapped to its final opacity
  in the `reduced` block (or it stays invisible for reduced-motion users). Add
  to both places when you add an animated element.
- To retune feel, edit `duration`, the easing strings, the `stagger(...)`
  values, and the relative `'-=ms'` offsets. Bigger negative offsets = more
  overlap = faster, busier entrance.
- Keep the looping current-phase pulse out of this timeline — that is
  [`usePulse`](./usePulse.ts.md)'s job; just keep its `delay` roughly aligned
  with this timeline's total length if you change overall duration.
- Don't convert `hasAnimatedRef` to state — it would cause a pointless re-render
  and the comment explicitly warns against it.
