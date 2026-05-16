# `src/components/StrandDetail/Progress/ProgressBranchTooltip.tsx`

## What this file is

The floating **tooltip** that appears above an output node when you hover/focus
a branch. It is an HTML `<div>` (not SVG) positioned over the SVG by *measuring*
the hovered branch node's screen rectangle relative to the timeline container.
It is rendered once by [`ProgressTimeline`](./ProgressTimeline.tsx.md), driven
entirely by the hover state passed down as props — it never reaches into the SVG
by id.

This file is the best example in the folder of **`useLayoutEffect` + measuring
the DOM with `getBoundingClientRect`**.

## Line-by-line / block walkthrough

```tsx
import { useLayoutEffect, useRef, useState } from 'react'
import type { ProgressOutput } from './types'
import styles from './ProgressBranchTooltip.module.css'
```

- `useLayoutEffect` — like `useEffect` but runs **synchronously after DOM
  mutations and before the browser paints**. Used here so the tooltip is
  positioned before the user can see it (no flicker at the wrong spot).
- `useRef`, `useState` — a ref to the tooltip div, state for its position.

```tsx
export interface ProgressBranchTooltipProps {
  output: ProgressOutput | null
  containerRef: React.RefObject<HTMLDivElement | null>
  anchorEl: SVGElement | null
}
```

- `output` — the hovered output's data, or `null` when nothing is hovered.
- `containerRef` — a ref to the timeline's outer `<div>` (the tooltip is
  absolutely positioned *within* it, so it needs that element's screen box).
- `anchorEl` — the actual SVG element (the branch's `<rect>`) to position
  against. The parent passes whichever node the branch reported via
  `onHoverChange`. The comment restates the rule: "we never reach into the DOM
  ourselves" — the anchor is *handed in*.

```tsx
export default function ProgressBranchTooltip({
  output, containerRef, anchorEl,
}: ProgressBranchTooltipProps) {
  const tipRef = useRef<HTMLDivElement | null>(null)
  const [pos, setPos] = useState<Position | null>(null)
```

`tipRef` points at the tooltip div; `pos` is its computed `{left, top}` (or
`null` when hidden).

```tsx
  useLayoutEffect(() => {
    if (!output || !anchorEl || !containerRef.current) {
      setPos(null)
      return
    }
    const a = anchorEl.getBoundingClientRect()
    const c = containerRef.current.getBoundingClientRect()
    setPos({
      left: a.left + a.width / 2 - c.left,
      top:  a.top - c.top,
    })
  }, [output, anchorEl, containerRef])
```

The positioning logic:

- If anything needed is missing (nothing hovered, no anchor, container not
  mounted), clear the position and bail — the tooltip hides.
- `getBoundingClientRect()` returns an element's size and position **in viewport
  coordinates** (`left/top/width/height` relative to the window). It is the
  standard way to measure a rendered element.
- `a` is the anchor (branch `<rect>`)'s box; `c` is the container's box.
- The tooltip is `position: absolute` inside the container, so its `left/top`
  must be **relative to the container**, not the viewport. Subtracting `c.left`
  / `c.top` converts viewport coords into container-local coords.
  `a.left + a.width/2 - c.left` = the horizontal centre of the anchor, in
  container space; `a.top - c.top` = the anchor's top edge in container space
  (the CSS then shifts the tooltip up and centres it via `transform`).
- Running this in `useLayoutEffect` (not `useEffect`) means the measurement and
  `setPos` happen before paint, so the tooltip never appears momentarily in the
  wrong place. The dependency array re-measures whenever the hovered output or
  anchor changes.

> Why measure at all instead of computing from the SVG viewBox numbers? The SVG
> is *scaled responsively* (`preserveAspectRatio`), so a viewBox coordinate is
> not a screen pixel. Measuring the actual painted `<rect>` is resolution- and
> scale-independent — it works no matter how the SVG was stretched.

```tsx
  const visible = output !== null && pos !== null
```

The tooltip is shown only when there is both an output *and* a computed
position. Deriving `visible` from state (rather than storing a separate boolean)
keeps the two in sync automatically.

```tsx
  return (
    <div
      ref={tipRef}
      className={`${styles.tip} ${visible ? styles.visible : ''}`}
      role="tooltip"
      aria-hidden={!visible}
      style={pos ? { left: pos.left, top: pos.top } : undefined}
    >
```

- Always renders the `.tip` div (it is always in the DOM); the `.visible` class
  is added conditionally. The CSS keeps `.tip` at `opacity: 0` and `.visible`
  fades it in — a CSS transition driven by a state-derived class (same pattern
  as the beacon chevron / the timeline panel).
- `role="tooltip"` + `aria-hidden={!visible}` — correct semantics; hidden from
  assistive tech when not shown (the branch's own `aria-label` already conveys
  the info to screen-reader users, so the visual tooltip is supplementary).
- **`style={...}`** — an *inline style object* (not CSS Modules) is the right
  tool here because `left`/`top` are **dynamic, computed at runtime**; you
  cannot express runtime pixel values in a static CSS file. When `pos` is null
  the style is `undefined` (no positioning applied while hidden).

```tsx
      {output && (
        <>
          <div className={styles.meta}>{output.tooltipMeta}</div>
          <strong className={styles.title}>{output.title}</strong>
          {output.tooltipDesc}
        </>
      )}
    </div>
  )
}
```

Render the content only when there is an `output` (`&&` guard, wrapped in a
Fragment): an uppercase meta line, a bold title, and the description text — all
straight from the `ProgressOutput` data (`src/data/strands.ts`). Keeping the
outer div always mounted (and only swapping its inner content/visibility) lets
the opacity transition play smoothly instead of the element popping in/out.

## Libraries & APIs used

- **React**: `useLayoutEffect` (pre-paint side effect), `useRef`, `useState`,
  derived state, conditional rendering, **inline `style` for dynamic values**,
  Fragments.
- **DOM**: `Element.getBoundingClientRect()` for measuring; viewport→container
  coordinate conversion.
- **CSS Modules** + a state-derived `.visible` class for the fade.
- **Accessibility**: `role="tooltip"`, `aria-hidden`.

## Concepts to learn here

- **`useLayoutEffect` vs `useEffect`**: use layout effect when you must measure
  and reposition *before* the browser paints, to avoid visible flicker.
- **`getBoundingClientRect` + coordinate-space conversion** (viewport → a
  `position: relative` container) — the standard "place a floating element next
  to another element" technique, robust to responsive SVG scaling.
- **Inline `style` for runtime-computed values** vs CSS Modules for static
  styling — knowing which to reach for.
- **Decoupling via props, not DOM ids**: the anchor element is passed in; this
  component never queries the SVG. Multi-instance safe by construction.
- **Always-mounted element + class toggle** to allow CSS opacity transitions.

## How to edit it safely

- Keep using `useLayoutEffect` for the measurement; switching to `useEffect`
  would let the tooltip flash at a stale/zero position for one frame.
- The position math assumes the tooltip is `position: absolute` inside the
  element referenced by `containerRef` (the timeline's `.inner`/panel). The
  visual offset (shift up, centre horizontally) is done in
  [`ProgressBranchTooltip.module.css`](./ProgressBranchTooltip.module.css.md)
  via `transform: translate(-50%, -100%) …` — adjust *placement nudges* there,
  not here.
- To change tooltip text/structure, edit the JSX here and the data fields
  (`tooltipMeta/title/tooltipDesc`) in `src/data/strands.ts`.
- Never query the branch DOM by id to find the anchor — it must keep arriving
  via the `anchorEl` prop (the parent gets it from
  [`ProgressBranch`](./ProgressBranch.tsx.md)'s `onHoverChange`). This is the
  subsystem's explicit rule.
- Cross-refs: [`ProgressTimeline.tsx`](./ProgressTimeline.tsx.md) (owns hover
  state, passes props), [`ProgressBranch.tsx`](./ProgressBranch.tsx.md)
  (supplies the anchor element),
  [`ProgressBranchTooltip.module.css`](./ProgressBranchTooltip.module.css.md)
  (the static styling + transform offset).
