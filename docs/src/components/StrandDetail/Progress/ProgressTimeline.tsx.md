# `src/components/StrandDetail/Progress/ProgressTimeline.tsx`

## What this file is

The **expandable, animated SVG timeline** — the centrepiece of the Progress
subsystem. When the user expands the beacon, this panel slides open and an
SVG draws itself: a horizontal "spine" of phases, with "branches" dropping off
it for research outputs (papers, prototypes, artefacts), an animated entrance,
and hover tooltips.

This doc doubles as the **architecture overview for the whole Progress folder**.
Read it before the other Progress files.

---

## The Progress subsystem at a glance

The timeline is split into many small files so that **geometry, drawing,
animation, and state** are each isolated:

```
ProgressTimeline.tsx        ← THIS FILE. Owns layout state:
                              - computes path data from geometry
                              - holds hover state for the tooltip
                              - drives the entrance animation (useProgressEntrance)
                              - renders the <svg>, the spine, branches, nodes
│
├── geometry.ts             Pure math. Given phases/outputs, returns x-coordinates.
│                           NO React, NO DOM. The single source of coordinates.
├── ProgressPhaseNode.tsx   One phase dot+label on the spine (past/current/projected).
│                           Owns the current-phase pulse via usePulse.
├── ProgressBranch.tsx      One output branch (line down + node + labels + caps).
│                           Pure presentation; bubbles hover up via a callback.
├── ProgressBranchTooltip.tsx  The floating tooltip, positioned from the hovered
│                              branch's <rect> via getBoundingClientRect.
├── useProgressEntrance.ts  One-shot anime.js timeline that strokes the spine,
│                           staggers nodes, reveals branches. Honours reduced motion.
├── usePulse.ts             Reusable looping pulse on an SVG <circle> (anime.js).
│                           Used by the current phase node AND the beacon.
├── ProgressBeacon.tsx      The tiny inline summary SVG that acts as the
│                           disclosure trigger (separate, smaller render of the
│                           same data — lives beside this in the meta row).
└── types.ts                Re-exports the progress data types locally.
```

**Key architectural rule (stated in several files):** components never hardcode
or guess SVG coordinates and never query each other's DOM by id. Coordinates
come from `geometry.ts`; cross-component communication (hover) goes through
React props/callbacks. This keeps it safe to mount more than once on a page and
easy to reason about.

**Data flow:** `StrandDetail` → `progress` prop (a `StrandProgress` =
`{ phases[], outputs[] }`, see `src/data/strands.ts`) → `geometry.ts` turns it
into x-coordinates → this component builds SVG path strings → child components
draw → `useProgressEntrance` animates the drawn DOM in.

---

## SVG primer (you need this to read the rest)

- `<svg viewBox="0 0 W H">` defines an internal coordinate system `W` wide and
  `H` tall. The SVG then scales to fit its CSS box; you author in viewBox units,
  not pixels.
- `<path d="...">` draws a shape. In the `d` string: `M x,y` = move pen to;
  `L x,y` = line to; `Q cx,cy x,y` = quadratic Bézier curve to `x,y` with
  control point `cx,cy`. `fill="none"` + `stroke` draws just the outline.
- `<circle cx cy r>` a circle; `<rect x y width height>` a rectangle;
  `<line x1 y1 x2 y2>` a segment; `<text x y>` text.
- `<g>` groups elements; a `transform="translate(x,y)"` on a `<g>` moves
  everything inside it (children then use coordinates relative to that origin).
- `<defs>` holds reusable defs (here an arrowhead `<marker>`); `<marker>` is a
  little shape stamped at the end of a path via `marker-end`.
- The **stroke-dash trick** for "drawing" a line: set `stroke-dasharray` and
  `stroke-dashoffset` both to the path's total length (line is invisible),
  then animate `stroke-dashoffset` to `0` — the line appears to draw itself.
  `useProgressEntrance` does exactly this.

---

## Line-by-line / block walkthrough

```tsx
import { useMemo, useRef, useState } from 'react'
import type { StrandProgress, ProgressOutput } from './types'
import { phasePositions, branchX, returnTargetX } from './geometry'
import ProgressPhaseNode from './ProgressPhaseNode'
import ProgressBranch from './ProgressBranch'
import ProgressBranchTooltip from './ProgressBranchTooltip'
import useProgressEntrance from './useProgressEntrance'
import styles from './ProgressTimeline.module.css'
```

- `useMemo` — caches an expensive computation between renders.
- `useRef` — a mutable box that persists across renders and does not trigger
  re-renders; here used to hold DOM/SVG element references.
- `useState` — the hover state.
- Types come from the local [`types.ts`](./types.ts.md) re-export, geometry from
  [`geometry.ts`](./geometry.ts.md), and the child components/animation hook.

```tsx
const VBW    = 1400
const VBH    = 460
const SPINE_Y = 140
const NODE_Y  = 310
const MARGIN  = 120
```

The **SVG coordinate constants** in viewBox units. The drawing area is
1400×460. The spine (horizontal phase line) sits at y=140; output branch nodes
sit lower at y=310; phases are inset `MARGIN`=120 from the left/right edges.
Centralising these as named constants (rather than scattering magic numbers)
makes the geometry readable and tweakable.

```tsx
interface HoverState {
  output: ProgressOutput | null
  anchor: SVGElement | null
}
```

The hover state shape: which output is hovered (`output`) and which SVG element
to anchor the tooltip against (`anchor`). `| null` means "or nothing hovered."

```tsx
export default function ProgressTimeline({ id, progress, expanded }: ProgressTimelineProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [hover, setHover] = useState<HoverState>({ output: null, anchor: null })
```

- `svgRef` will point at the `<svg>` DOM node (via `ref={svgRef}` below) so the
  entrance hook can query elements *within this svg only*.
- `containerRef` points at the outer `<div>` so the tooltip can position itself
  relative to it.
- `useRef<T>(null)` creates `{ current: null }`; React assigns the DOM node into
  `.current` after mount. Refs are the right tool here because we need imperative
  DOM access for SVG measurement/animation, which React state cannot express.
- `hover` state starts empty; `setHover` updates it when a branch is
  entered/left, triggering a re-render so the tooltip shows.

```tsx
  useProgressEntrance(svgRef, expanded)
```

The **custom animation hook** (see
[`useProgressEntrance.ts`](./useProgressEntrance.ts.md)). It is given the svg ref
and the `expanded` flag; the first time `expanded` becomes `true` it plays the
entrance timeline. The component does not manage the animation itself — it
delegates, keeping render logic clean.

```tsx
  const positions = useMemo(
    () => phasePositions(progress.phases, VBW, MARGIN),
    [progress],
  )
```

`phasePositions` (from geometry) returns a `Map<PhaseId, number>` of x
coordinates for each phase, evenly spread across the viewBox. **`useMemo`**
caches that result and only recomputes when `progress` changes. Why it matters:
hovering a branch calls `setHover`, which re-renders this component. Without
`useMemo`, the geometry (and the derived path strings below) would be recomputed
on *every* hover move — and, worse, produce **new array/string identities** that
could retrigger the entrance effect's dependencies. Memoising keeps geometry
**stable across hover-driven re-renders**. This is the comment's "geometry is
memoised so it stays stable" point.

```tsx
  const activePathD = useMemo(() => {
    const xs: number[] = []
    progress.phases.forEach(p => {
      if (p.status !== 'projected') {
        const x = positions.get(p.id)
        if (x !== undefined) xs.push(x)
      }
    })
    if (xs.length === 0) return ''
    return xs.map((x, i) => (i === 0 ? `M${x},${SPINE_Y}` : `L${x},${SPINE_Y}`)).join(' ')
  }, [progress, positions])
```

Builds the **SVG path string for the "active" spine** — the solid part covering
`past` + `current` phases (anything not `projected`). It collects each
non-projected phase's x, then constructs a path: the first point is `M x,140`
(move-to), the rest are `L x,140` (line-to), joined with spaces — a horizontal
polyline at y=`SPINE_Y`. Result for `kindred`: a straight line through nascent →
research → design → development. Memoised on `[progress, positions]` for the
same stability reason. (Template literals build the `d` string from data — you
will see this everywhere in SVG-in-React.)

```tsx
  const futurePathD = useMemo(() => {
    const lastActive  = [...progress.phases].reverse().find(p => p.status !== 'projected')
    const firstFuture = progress.phases.find(p => p.status === 'projected')
    if (!lastActive || !firstFuture) return ''
    const a = positions.get(lastActive.id)
    const b = positions.get(firstFuture.id)
    if (a === undefined || b === undefined) return ''
    return `M${a},${SPINE_Y} L${b + 220},${SPINE_Y}`
  }, [progress, positions])
```

Builds the **dashed "future" spine** — from the last active phase to past the
first projected phase. `[...progress.phases].reverse()` copies the array (the
spread `[...]` avoids mutating the original) then `.find` gets the last
non-projected phase; `.find` again gets the first projected one. The path runs
from `a` to `b + 220` (a little beyond the projected node so the dashed line +
arrowhead extend off into the "future"). Returns `''` if there is no future
segment (then nothing renders).

```tsx
  const handleHoverChange = (output: ProgressOutput | null, anchor: SVGElement | null) => {
    setHover({ output, anchor })
  }
```

A single callback passed down to every `ProgressBranch`. When a branch is
entered it calls this with its output + its node element; on leave it calls with
`(null, null)`. **Children report events up; the parent owns the state** — the
same callbacks-up pattern as the disclosure. Branches never touch the tooltip or
each other directly.

```tsx
  return (
    <div
      ref={containerRef}
      id={id}
      className={`${styles.panel} ${expanded ? styles.open : ''}`}
      aria-hidden={!expanded}
    >
```

The outer panel `<div>`:
- `ref={containerRef}` so the tooltip can measure relative to it.
- `id={id}` — this is the id `StrandDetail` generated with `useId` and also gave
  to the beacon as `aria-controls`, completing the accessible disclosure link.
- `className={`${styles.panel} ${expanded ? styles.open : ''}`}` — always has
  `.panel`, conditionally adds `.open`. The CSS animates `max-height`/`opacity`
  between the two (the slide-open). Toggling a class is the standard way to drive
  a CSS transition from React state.
- `aria-hidden={!expanded}` — when collapsed, hide the panel's content from
  assistive tech (it is visually collapsed anyway).

```tsx
      <div className={styles.inner}>
        <h2 className={styles.title}>Progress · expanded</h2>
        <svg
          ref={svgRef}
          className={styles.svg}
          viewBox={`0 0 ${VBW} ${VBH}`}
          preserveAspectRatio="xMidYMid meet"
          aria-label="Strand progression timeline"
        >
```

- `<h2>` section heading (the `<h1>` is the strand name in the header).
- `ref={svgRef}` binds the ref so the entrance hook can `querySelectorAll`
  scoped to this svg.
- `viewBox={`0 0 ${VBW} ${VBH}`}` → `"0 0 1400 460"` — the internal coordinate
  system every child draws into.
- `preserveAspectRatio="xMidYMid meet"` — scale to fit while preserving aspect
  ratio, centred both axes ("meet" = fit entirely inside, like
  `object-fit: contain`).
- `aria-label` gives the graphic an accessible name (it has no text equivalent
  otherwise).

```tsx
          <defs>
            <marker id="arrowFull" viewBox="0 0 10 10" refX={9} refY={5} markerWidth={7} markerHeight={7} orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="#2F0147" />
            </marker>
          </defs>
```

A reusable **arrowhead** definition. `<defs>` content is not drawn directly; it
is referenced. The `<marker>` is a small triangle (`M0,0 L10,5 L0,10 z` — the
`z` closes the path); `orient="auto"` rotates it to match the direction of the
path it caps; `refX/refY` set the marker's anchor point so the tip lands at the
path end. It is applied below via `markerEnd="url(#arrowFull)"`.

```tsx
          <g>
            <path
              className="spine-active"
              d={activePathD}
              stroke="#2F0147"
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
            />
```

The solid spine. Note `className="spine-active"` is a **plain string, not a CSS
Module class**. That is deliberate: `useProgressEntrance` finds this element via
`root.querySelector('.spine-active')`. The animation hook needs predictable
selectors, so the few animated SVG elements use plain semantic class names;
their *visual* attributes (`stroke`, `strokeWidth`) are set inline because each
element type needs different colours. `fill="none"` (it is a line, not a shape),
`strokeLinecap="round"` (rounded ends).

```tsx
            {futurePathD && (
              <path
                className="spine-future"
                d={futurePathD}
                stroke="#2F0147"
                strokeWidth={2}
                fill="none"
                strokeDasharray="7 9"
                strokeLinecap="round"
                opacity={0}
                markerEnd="url(#arrowFull)"
              />
            )}
          </g>
```

The dashed future spine, rendered only if `futurePathD` is non-empty (`&&`
guard). `strokeDasharray="7 9"` makes the dashed pattern (7-long dash, 9-long
gap). **`opacity={0}`** — it starts invisible; the entrance hook fades it in
(`.spine-future` is in the hook's selector list). `markerEnd="url(#arrowFull)"`
stamps the arrowhead from `<defs>` at the path's end.

```tsx
          {progress.outputs.map(o => (
            <ProgressBranch
              key={o.id}
              output={o}
              startX={branchX(o, positions, progress.phases)}
              spineY={SPINE_Y}
              nodeY={NODE_Y}
              returnToX={returnTargetX(o, positions, progress.phases)}
              onHoverChange={handleHoverChange}
            />
          ))}
```

Render one [`ProgressBranch`](./ProgressBranch.tsx.md) per output. **All
geometry is computed here and passed in as numbers** — `branchX` and
`returnTargetX` (from [`geometry.ts`](./geometry.ts.md)) decide *where* the
branch leaves the spine and *where* (if anywhere) it rejoins. The branch
component receives only numbers and the hover callback; it does no math and no
DOM querying. `key={o.id}` uses the stable output id (these are real ids, unlike
the index keys used for the static CTA list).

```tsx
          <g>
            {progress.phases.map(p => (
              <ProgressPhaseNode
                key={p.id}
                phase={p}
                x={positions.get(p.id) ?? 0}
                y={SPINE_Y}
              />
            ))}
          </g>
```

Render one [`ProgressPhaseNode`](./ProgressPhaseNode.tsx.md) per phase, after
the branches so the dots draw **on top of** the spine and branch lines (SVG has
no z-index — paint order is document order). `x={positions.get(p.id) ?? 0}`
pulls the memoised coordinate (`?? 0` is a defensive fallback that should never
trigger).

```tsx
        </svg>
        <ProgressBranchTooltip
          output={hover.output}
          containerRef={containerRef}
          anchorEl={hover.anchor}
        />
      </div>
    </div>
  )
}
```

The [`ProgressBranchTooltip`](./ProgressBranchTooltip.tsx.md) is rendered
*outside* the `<svg>` (it is an HTML `<div>`, not SVG) but inside the
`containerRef` div. It receives the current hover state. When `hover.output` is
non-null it measures `hover.anchor`'s screen rectangle relative to
`containerRef` and positions itself. All of this flows through props — the
tooltip never reaches into the SVG by id.

## Libraries & APIs used

- **React**: `useMemo` (stability across re-renders), `useRef` (DOM access for
  SVG/animation), `useState` (hover), conditional rendering, list rendering with
  stable `key`s, callbacks-up.
- **Inline SVG**: `viewBox`, `preserveAspectRatio`, `<defs>`/`<marker>`,
  `<path>` (`M`/`L`), `<g>`, `stroke`/`fill`/`strokeDasharray`/`markerEnd`.
- **CSS Modules** for layout (`styles.panel/open/inner/title/svg`), plus plain
  string classes (`spine-active`, `spine-future`) as animation hooks.
- Custom hook `useProgressEntrance`; geometry from `geometry.ts`.

## Concepts to learn here

- **Separation of concerns in a graphics component**: math (geometry) /
  presentation (branch, node) / animation (hook) / state (here) are different
  files.
- **Building SVG `d` strings from data** with `M`/`L` and template literals.
- **`useMemo` for identity stability**, not just speed — preventing hover
  re-renders from churning derived data and effect deps.
- **Refs for imperative SVG work**, scoped per-instance via the svg ref.
- **Plain class names as animation selectors** vs CSS-module classes for layout.
- **Paint order = document order in SVG** (no z-index).
- **Accessible disclosure**: `id` here matches the beacon's `aria-controls`.

## How to edit it safely

- **To add/remove a phase or output:** edit the `progress` data in
  `src/data/strands.ts` (the `phases[]` / `outputs[]` arrays). Geometry,
  spine paths, branches and nodes all derive from it automatically — you should
  not need to touch this file. Constraints on output fields are documented in
  [`geometry.ts`](./geometry.ts.md) and
  [`ProgressBranch.tsx`](./ProgressBranch.tsx.md).
- **To resize/retune the diagram:** change the `VBW/VBH/SPINE_Y/NODE_Y/MARGIN`
  constants. Everything downstream uses them, so the layout scales coherently.
  If you change the viewBox height, also check `.svg { height }` in
  [`ProgressTimeline.module.css`](./ProgressTimeline.module.css.md) and the
  `max-height` of `.panel.open` (the slide-open clamp).
- **Do not rename** the `spine-active` / `spine-future` plain class names without
  also updating the selectors in
  [`useProgressEntrance.ts`](./useProgressEntrance.ts.md). The contract between
  this file and the entrance hook is those class names + the initial `opacity={0}`
  on animated elements (the hook reveals them; if you forget `opacity={0}` they
  flash visible before animating).
- **Hover/tooltip:** keep the data flowing through `onHoverChange` →
  `setHover` → `<ProgressBranchTooltip>` props. Never query branch DOM by id;
  that breaks multi-instance safety (the explicit rule of this subsystem).
- Cross-references: [`geometry.ts`](./geometry.ts.md),
  [`ProgressBranch.tsx`](./ProgressBranch.tsx.md),
  [`ProgressPhaseNode.tsx`](./ProgressPhaseNode.tsx.md),
  [`ProgressBranchTooltip.tsx`](./ProgressBranchTooltip.tsx.md),
  [`useProgressEntrance.ts`](./useProgressEntrance.ts.md),
  [`usePulse.ts`](./usePulse.ts.md),
  [`ProgressBeacon.tsx`](./ProgressBeacon.tsx.md),
  [`ProgressTimeline.module.css`](./ProgressTimeline.module.css.md), and the
  parent [`StrandDetail.tsx`](../StrandDetail.tsx.md).
