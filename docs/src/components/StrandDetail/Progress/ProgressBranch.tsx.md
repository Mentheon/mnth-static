# `src/components/StrandDetail/Progress/ProgressBranch.tsx`

## What this file is

Draws **one output branch** in the expanded timeline: the curved line dropping
off the spine, the shaped node at its end, the title/meta labels, an optional
"return" curve back to the spine, and optional "terminus" cap lines. It is
**pure presentation** — all coordinates are computed by the parent
([`ProgressTimeline`](./ProgressTimeline.tsx.md), using
[`geometry.ts`](./geometry.ts.md)) and passed in as numbers; hover is reported
upward via a callback. It never queries the DOM by id or inspects siblings.

## Line-by-line / block walkthrough

```tsx
import type { ProgressOutput, OutputType } from './types'
import styles from './ProgressBranch.module.css'
```

Just the data types and the (almost empty) paired CSS Module
([`ProgressBranch.module.css`](./ProgressBranch.module.css.md)). Most visuals
are inline SVG attributes here because each output type uses different
colours/shapes.

```tsx
export interface ProgressBranchProps {
  output: ProgressOutput
  startX: number             // x where the branch leaves the spine
  spineY: number             // y of the spine
  nodeY: number              // y at which the branch's node sits
  returnToX?: number         // x where the branch rejoins the spine, if any
  onHoverChange: (output: ProgressOutput | null, target: SVGElement | null) => void
}
```

The props **are the geometry contract**: `startX` (from
[`geometry.ts`](./geometry.ts.md)'s `branchX`), `spineY`/`nodeY` (the timeline's
constants), optional `returnToX` (from `returnTargetX`, `undefined` for a
terminus), plus the `onHoverChange` callback. The component does no math itself
— it only draws what it is told and bubbles hover events.

```tsx
interface BranchVisuals {
  stroke: string
  metaFill: string
  metaWeight: 'normal' | 'bold'
  metaOpacity: number
  labelsAbove: boolean
}

function visualsFor(type: OutputType): BranchVisuals {
  switch (type) {
    case 'paper':
      return { stroke: '#9C528B', metaFill: '#2F0147', metaWeight: 'normal', metaOpacity: 0.6, labelsAbove: false }
    case 'prototype':
      return { stroke: '#2F0147', metaFill: '#2F0147', metaWeight: 'normal', metaOpacity: 0.6, labelsAbove: true }
    case 'artefact':
      return { stroke: '#A30B37', metaFill: '#A30B37', metaWeight: 'bold',   metaOpacity: 0.85, labelsAbove: false }
  }
}
```

A **lookup helper**: given the output's `type` (a string-literal union), return
its visual config. Using a typed `switch` over a union is a clean,
exhaustive-by-design pattern — TypeScript will warn if a new `OutputType` is
added and not handled. `labelsAbove` is the interesting one: the
prototype/terminus branch puts its labels *above* the node so they don't collide
with the terminus cap lines below it.

```tsx
export default function ProgressBranch({
  output, startX, spineY, nodeY, returnToX, onHoverChange,
}: ProgressBranchProps) {
  const v = visualsFor(output.type)
```

Resolve the visuals once per render into `v`.

```tsx
  const linePath = `M${startX},${spineY} Q ${startX},${(spineY + nodeY) / 2} ${startX},${nodeY}`
```

The branch line as an SVG path string. `M startX,spineY` moves to where it
leaves the spine; `Q cx,cy x,y` is a **quadratic Bézier curve**. Here the
control point is `(startX, midpoint-y)` — directly *on* the straight vertical
line — so the curve renders as a straight vertical segment. The comment explains
why: a `Q` is used (instead of a simple `L`) to match the reference HTML's path
type, even though geometrically it collapses to a straight line. (If `startX`
ever differed at top vs bottom, this would bow.)

```tsx
  let returnPath: string | null = null
  if (returnToX !== undefined) {
    const midY = nodeY - (nodeY - spineY) * 0.4
    returnPath = `M${startX},${nodeY} Q ${(startX + returnToX) / 2},${nodeY} ${(startX + returnToX) / 2 + (returnToX - startX) * 0.2},${midY} Q ${returnToX - 5},${spineY + 30} ${returnToX},${spineY}`
  }
```

If this output **returns** to the spine (`returnToX` provided — i.e. `behaviour
=== 'output'`), build a sweeping curve from the node back up to the next phase.
It is **two chained quadratic segments** (`M … Q … Q …`): from the node,
arcing out and up to a midpoint, then curving back down onto the spine at
`returnToX`. The control points are all derived arithmetically from the passed-in
geometry (`(startX+returnToX)/2`, `midY`, etc.) — no magic absolute coordinates.
For a terminus output `returnToX` is `undefined`, so `returnPath` stays `null`
and no curve is drawn (caps are drawn instead, below).

```tsx
  const renderNode = () => {
    if (output.type === 'paper') {
      return <rect x={-13} y={-13} width={26} height={26} transform="rotate(45)" fill="#9C528B" />
    }
    if (output.type === 'prototype') {
      return <rect x={-13} y={-13} width={26} height={26} fill="#2F0147" />
    }
    return <rect x={-14} y={-14} width={28} height={28} rx={4} fill="#A30B37" />
  }
```

The node shape per type. Note the coordinates are **centred on the origin**
(`x={-13} y={-13} width={26}` ⇒ a 26×26 square centred at 0,0). That works
because the node is rendered inside a `<g transform="translate(startX,
nodeY)">` (below) — so each shape only needs to be centred at its own local
origin, and the group does the positioning. `rotate(45)` turns the paper square
into a diamond; `rx={4}` rounds the artefact's corners. Same glyph language as
the mini version in [`ProgressBeacon`](./ProgressBeacon.tsx.md).

```tsx
  const titleY = v.labelsAbove ? -26 : 50
  const metaY  = v.labelsAbove ? -44 : 68
```

Label y-offsets, flipped by `labelsAbove`. Negative = above the node, positive =
below. This is why the prototype/terminus branch's text avoids its cap lines.

```tsx
  const renderTerminusCaps = () => {
    if (output.behaviour !== 'terminus') return null
    return (
      <>
        <line className="branch-terminus-cap" x1={startX - 15} y1={nodeY + 35} x2={startX + 15} y2={nodeY + 35} stroke={v.stroke} strokeWidth={2} opacity={0} />
        <line className="branch-terminus-cap" x1={startX - 20} y1={nodeY + 42} x2={startX + 20} y2={nodeY + 42} stroke={v.stroke} strokeWidth={1} opacity={0} />
      </>
    )
  }
```

Only a `'terminus'` output gets two short horizontal "cap" strokes below the
node (the visual "dead end" marker — like the end of a railway line). They use
the **plain class name `branch-terminus-cap`** (not a CSS-module class) and
`opacity={0}` so that [`useProgressEntrance`](./useProgressEntrance.ts.md) can
find and reveal them. Returning `null` when not a terminus renders nothing.

```tsx
  const handleEnter = (e: React.MouseEvent<SVGGElement>) => {
    const target = e.currentTarget.querySelector<SVGRectElement>('rect')
    onHoverChange(output, target)
  }
  const handleLeave = () => onHoverChange(null, null)
```

Hover handling. On enter, `e.currentTarget` is *this branch's group*; querying
`'rect'` **within it** finds this branch's node shape, which is handed up via
`onHoverChange` so the parent can anchor the tooltip to it. Crucially this query
is scoped to the event's own element — not a document-wide id lookup — preserving
the subsystem's "no DOM querying by id, multi-instance safe" rule. On leave,
clear the hover.

```tsx
  return (
    <g
      className={`${styles.branch} branch`}
      data-branch={output.type}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
      tabIndex={0}
      role="group"
      aria-label={`${output.title} — ${output.tooltipMeta}`}
    >
```

The branch group `<g>`:
- `className={`${styles.branch} branch`}` — a CSS-module class (`styles.branch`,
  just `cursor: pointer`) **and** a plain `branch` class.
- `data-branch={output.type}` — the **attribute hook** the entrance hook uses
  (`[data-branch="paper"]` etc.) to animate branches in canonical order.
- Both mouse **and focus** events trigger the same handlers, so the tooltip
  works for keyboard users too. `tabIndex={0}` makes the group focusable;
  `role="group"` + `aria-label` give it an accessible name combining the
  output's title and meta. This is thoughtful **keyboard + screen-reader
  accessibility for an SVG graphic**.

```tsx
      <path className="branch-line" d={linePath} stroke={v.stroke} strokeWidth={2} fill="none" strokeLinecap="round" opacity={0} />
      {returnPath && (
        <path className="branch-return" d={returnPath} stroke={v.stroke} strokeWidth={1.25} fill="none" strokeDasharray="3 5" opacity={0} />
      )}
      {renderTerminusCaps()}
      <g className="branch-node" transform={`translate(${startX}, ${nodeY})`} opacity={0}>
        {renderNode()}
        <text x={0} y={titleY} textAnchor="middle" fontFamily="Lato, sans-serif" fontSize={14} fontWeight={700} fill="#2F0147">
          {output.title}
        </text>
        <text x={0} y={metaY} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize={10} fill={v.metaFill} opacity={v.metaOpacity} fontWeight={v.metaWeight} letterSpacing={0.5}>
          {output.metaLabel}
        </text>
      </g>
    </g>
  )
}
```

The drawn content, every animated piece starting at **`opacity={0}`** with a
plain animation class so the entrance hook can reveal it:

- `.branch-line` — the (curved/straight) drop line; entrance hook strokes it on.
- `.branch-return` — the dashed return curve, only if `returnPath` exists;
  entrance hook fades it to 0.7.
- terminus caps via the helper.
- `.branch-node` group, positioned with `transform="translate(startX, nodeY)"`
  so its children can use local origin-centred coords. Inside: the shaped node,
  the bold title `<text>`, and the mono meta `<text>`. `textAnchor="middle"`
  centres text on `x={0}` (the group origin). The title is always plum; the meta
  uses the per-type `metaFill/metaOpacity/metaWeight` from `visualsFor`.

## Libraries & APIs used

- **React**: function component, helper functions returning JSX, `&&`/early
  `null` conditional rendering, Fragments, typed SVG events
  (`React.MouseEvent<SVGGElement>`), callbacks-up.
- **Inline SVG**: `<g transform="translate()">`, `<path>` with `M`/`Q`
  (quadratic Bézier), `<rect transform="rotate(45)">`, `<line>`, `<text>`
  (`textAnchor`), `strokeDasharray`, `data-*` attribute, ARIA on SVG.
- **CSS Modules** (minimal) + plain animation class names.
- TypeScript: exhaustive `switch` over a string-literal union.

## Concepts to learn here

- **Pure presentational component**: receives geometry as numbers, does zero
  math, zero DOM-by-id queries; reports hover via callback. This is the
  subsystem's core discipline.
- **Quadratic Bézier paths** (`Q`), including the trick of a control point on
  the line to keep it straight, and chained `Q` segments for the return sweep.
- **Origin-centred shapes inside a translated `<g>`** — position once on the
  group, draw locally.
- **Typed config lookup** (`visualsFor`) with exhaustive `switch`.
- **`opacity={0}` + plain class** as the contract with
  [`useProgressEntrance`](./useProgressEntrance.ts.md).
- **Accessible interactive SVG**: focus + mouse handlers, `tabIndex`, `role`,
  `aria-label`.

## How to edit it safely

- Output content (titles, types, behaviour, attachment) is **data** — edit
  `src/data/strands.ts`, not this file, to add/change a branch. The
  shape/colour rules for *each type* live in `visualsFor` and `renderNode` here;
  adding a new `OutputType` means updating the data union (`src/data/strands.ts`),
  then `visualsFor`'s `switch` and `renderNode` here (and the mini glyphs in
  [`ProgressBeacon`](./ProgressBeacon.tsx.md) for consistency).
- **Do not** remove the `opacity={0}` initial values or the plain class names
  (`branch-line`, `branch-node`, `branch-return`, `branch-terminus-cap`) or the
  `data-branch` attribute — they are the exact contract
  [`useProgressEntrance`](./useProgressEntrance.ts.md) relies on; changing one
  side requires changing the other.
- Keep this component free of math and DOM-by-id queries — geometry stays in
  [`geometry.ts`](./geometry.ts.md), orchestration in
  [`ProgressTimeline`](./ProgressTimeline.tsx.md).
- The tooltip text comes from `output.tooltipMeta/tooltipDesc/title` and is
  rendered by [`ProgressBranchTooltip`](./ProgressBranchTooltip.tsx.md) from the
  hover state this component bubbles up.
- Cross-refs: [`geometry.ts`](./geometry.ts.md),
  [`ProgressTimeline.tsx`](./ProgressTimeline.tsx.md),
  [`useProgressEntrance.ts`](./useProgressEntrance.ts.md),
  [`ProgressBranchTooltip.tsx`](./ProgressBranchTooltip.tsx.md),
  [`ProgressBranch.module.css`](./ProgressBranch.module.css.md),
  [`ProgressBeacon.tsx`](./ProgressBeacon.tsx.md).
