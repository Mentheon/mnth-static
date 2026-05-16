# `src/components/StrandDetail/Progress/ProgressBeacon.tsx`

## What this file is

The **inline progress summary** that sits in the meta row, *and* doubles as the
**disclosure trigger** for the big timeline. It is a `<button>` containing a tiny
fixed-height SVG that draws a miniature version of the same spine/phases/outputs.
Clicking it (or pressing Enter/Space) toggles
[`ProgressTimeline`](./ProgressTimeline.tsx.md) open. It shares geometry math
with the timeline ([`geometry.ts`](./geometry.ts.md)) and the pulse animation
([`usePulse`](./usePulse.ts.md)) — but renders a simpler, static (non-entrance)
picture.

## Line-by-line / block walkthrough

```tsx
import { useRef } from 'react'
import type { StrandProgress } from './types'
import usePulse from './usePulse'
import { phasePositions, branchX, returnTargetX } from './geometry'
import styles from './ProgressBeacon.module.css'
```

Same geometry and pulse hook as the timeline — proving the value of factoring
those out. Paired CSS:
[`ProgressBeacon.module.css`](./ProgressBeacon.module.css.md).

```tsx
export interface ProgressBeaconProps {
  progress: StrandProgress
  expanded: boolean
  onToggle: () => void
  ariaControls: string
}
```

- `progress` — the same data the timeline gets.
- `expanded` — the shared disclosure boolean (from `useDisclosure` up in
  [`StrandDetail`](../StrandDetail.tsx.md)); used for label text and the chevron
  rotation, and exposed as `aria-expanded`.
- `onToggle` — the callback that flips the disclosure (callbacks-up).
- `ariaControls` — the `useId` string also used as the timeline panel's `id`,
  linking trigger ↔ panel for assistive tech.

```tsx
const BEACON_VBW = 600
const BEACON_VBH = 56
const SPINE_Y    = 28
const MARGIN     = 20
```

The beacon's **own, smaller** viewBox coordinate constants (600×56 vs the
timeline's 1400×460). Same idea, different scale — the shared geometry functions
take the viewBox/margin as arguments precisely so both can reuse them.

```tsx
  const pulseRef = useRef<SVGCircleElement | null>(null)
  usePulse(
    pulseRef,
    { rFrom: 9, rTo: 16, opacityFrom: 0.18, opacityTo: 0, duration: 1600 },
    true,
  )
```

A ref to the pulsing circle, fed to [`usePulse`](./usePulse.ts.md). Here the
pulse is small (`r 9→16`), always `enabled` (`true`), and **no `delay`** — the
beacon is always visible, so its ping starts immediately (unlike the phase node,
which delays to line up with the entrance).

```tsx
  const positions = phasePositions(progress.phases, BEACON_VBW - 60, MARGIN)
```

Compute phase x-positions, but across `BEACON_VBW - 60` (not the full width):
the comment below explains a phantom margin is spliced in so the spine stops
short of the right edge and the dashed "future" segment fills the gap. Note
this is **not** wrapped in `useMemo` here (unlike the timeline) — the beacon has
no hover-driven re-renders and the data is small, so memoising would add
complexity for no benefit. A nice illustration that `useMemo` is a targeted
optimisation, not a default.

```tsx
  const lastPastIdx = progress.phases.findIndex(p => p.status === 'projected')
  const splitIdx = lastPastIdx === -1 ? progress.phases.length - 1 : lastPastIdx - 1
  const activeEnd = positions.get(progress.phases[splitIdx]?.id ?? progress.phases[0].id) ?? 0
  const futureEnd = BEACON_VBW - MARGIN
```

Compute where the solid spine ends and the dashed future begins.
`findIndex(... 'projected')` finds the first projected phase; if none (`-1`) the
split is the last phase, otherwise the phase just before the first projected
one. `activeEnd` is that split phase's x (with `?.`/`??` guards against bad
data). `futureEnd` is near the right edge. This is plain derived data, computed
each render — cheap and clear.

```tsx
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onToggle()
    }
  }
```

**Keyboard accessibility.** A native `<button>` already fires `onClick` on
Enter/Space, but this is an explicit, defensive handler ensuring Space does not
scroll the page (`e.preventDefault()`) and both keys toggle. The comment in
[`useDisclosure`](../hooks/useDisclosure.ts.md) noted "keyboard handling is
owned by whatever renders the trigger" — this is that ownership.

```tsx
  const activePath = (() => {
    const xs: number[] = []
    progress.phases.forEach(p => {
      if (p.status === 'past' || p.status === 'current') {
        const x = positions.get(p.id)
        if (x !== undefined) xs.push(x)
      }
    })
    if (xs.length === 0) return ''
    return xs.map((x, i) => (i === 0 ? `M${x},${SPINE_Y}` : `L${x},${SPINE_Y}`)).join(' ')
  })()
```

Build the solid spine path string — same `M…/L…` polyline technique as the
timeline's `activePathD`, but written as an **IIFE** (Immediately-Invoked
Function Expression: `(() => { ... })()` — a function defined and called on the
spot). It is used instead of `useMemo` because there is no re-render pressure
here; it just needs a local scope to build the array.

```tsx
  return (
    <button
      type="button"
      className={`${styles.beacon} ${expanded ? styles.expanded : ''}`}
      aria-expanded={expanded}
      aria-controls={ariaControls}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
    >
```

A real `<button>` (not a clickable `<div>`) — correct semantics, focusable and
keyboard-operable for free. `type="button"` stops it submitting any enclosing
form. `aria-expanded={expanded}` tells screen readers the disclosure state;
`aria-controls={ariaControls}` names the region it controls (the timeline
panel's `id`). `onClick` toggles; `onKeyDown` adds the explicit key handling.
The conditional `styles.expanded` class rotates the chevron via CSS.

```tsx
      <span className={styles.label}>
        <span>progression</span>
        <span className={styles.expand}>
          {expanded ? 'collapse' : 'expand'}
          <span className={styles.expandIcon} aria-hidden="true">▾</span>
        </span>
      </span>
```

The label row: "progression" on the left, and a state-dependent
"expand"/"collapse" hint on the right with a `▾` chevron. The chevron is
`aria-hidden` (decorative; `aria-expanded` already conveys state to assistive
tech). The text swaps via a ternary on `expanded`.

```tsx
      <svg
        className={styles.svg}
        viewBox={`0 0 ${BEACON_VBW} ${BEACON_VBH}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
```

The mini diagram SVG. **`aria-hidden="true"`** — unlike the timeline's svg
(which has an `aria-label`), the beacon graphic is purely decorative *because
the button itself is the meaningful control* and conveys everything via its
accessible name/state. Avoiding redundant announcements is good a11y practice.

```tsx
        <defs>
          <marker id="beaconArrow" viewBox="0 0 10 10" refX={9} refY={5} markerWidth={5} markerHeight={5} orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill="#2F0147" />
          </marker>
        </defs>
        <path d={activePath} stroke="#2F0147" strokeWidth={2} fill="none" strokeLinecap="round" />
        <path d={`M${activeEnd},${SPINE_Y} L${futureEnd},${SPINE_Y}`} stroke="#2F0147" strokeWidth={1.5} fill="none" strokeDasharray="4 5" strokeLinecap="round" markerEnd="url(#beaconArrow)" opacity={0.7} />
```

A small arrowhead marker (note the **unique id `beaconArrow`** — distinct from
the timeline's `arrowFull`; SVG marker ids are global, so two SVGs on the page
must not collide). Then the solid spine path and the dashed future segment from
`activeEnd` to `futureEnd` with the arrowhead. No entrance animation here — the
beacon shows the final picture immediately (only the pulse animates).

```tsx
        {progress.phases.map(p => {
          const x = positions.get(p.id) ?? 0
          if (p.status === 'projected') {
            return <circle key={p.id} cx={x} cy={SPINE_Y} r={5} fill="none" stroke="#2F0147" strokeWidth={1.5} strokeDasharray="2 2" />
          }
          if (p.status === 'current') {
            return (
              <g key={p.id}>
                <circle ref={pulseRef} cx={x} cy={SPINE_Y} r={9} fill="#A30B37" opacity={0.18} />
                <circle cx={x} cy={SPINE_Y} r={7} fill="#A30B37" />
              </g>
            )
          }
          return <circle key={p.id} cx={x} cy={SPINE_Y} r={5} fill="#2F0147" />
        })}
```

Render each phase dot, switching shape on `status` (the same three-way logic as
[`ProgressPhaseNode`](./ProgressPhaseNode.tsx.md), in miniature):
- `projected` → small dashed hollow circle.
- `current` → two stacked circles: a faint big one with `ref={pulseRef}` (this
  is the circle `usePulse` grows/fades) plus a solid smaller crimson dot on top.
- otherwise (`past`) → small solid plum dot.

`key={p.id}` because these are siblings in a mapped list.

```tsx
        {progress.outputs.map(o => {
          const bx = branchX(o, positions, progress.phases)
          const ret = returnTargetX(o, positions, progress.phases)
          const stroke = o.type === 'paper' ? '#9C528B' : o.type === 'artefact' ? '#A30B37' : '#2F0147'
          return (
            <g key={o.id}>
              <line x1={bx} y1={SPINE_Y} x2={bx} y2={SPINE_Y + 16} stroke={stroke} strokeWidth={1.5} />
              {o.type === 'paper' && (
                <rect x={bx - 4.5} y={SPINE_Y + 16} width={9} height={9} transform={`rotate(45 ${bx} ${SPINE_Y + 20.5})`} fill={stroke} />
              )}
              {o.type === 'prototype' && (
                <rect x={bx - 4} y={SPINE_Y + 16} width={8} height={8} fill={stroke} />
              )}
              {o.type === 'artefact' && (
                <rect x={bx - 5} y={SPINE_Y + 16} width={10} height={10} rx={2} fill={stroke} />
              )}
              {ret !== undefined && (
                <line x1={bx} y1={SPINE_Y + 16} x2={ret} y2={SPINE_Y} stroke={stroke} strokeWidth={1} strokeDasharray="2 2" opacity={0} />
              )}
            </g>
          )
        })}
      </svg>
    </button>
  )
}
```

For each output: `branchX`/`returnTargetX` from the **shared geometry** give the
positions (identical math to the timeline, just a smaller viewBox). A short
vertical tick drops off the spine, then a per-type glyph:
- `paper` → a square rotated 45° (`transform="rotate(45 cx cy)"` rotates around
  that point) = a diamond.
- `prototype` → a plain square.
- `artefact` → a rounded square (`rx={2}`).

The colour is chosen by `o.type` via nested ternaries (mauve/crimson/plum). The
return line is rendered with `opacity={0}` (effectively hidden in the beacon —
it exists for structural parity with the timeline but the tiny beacon does not
show return curves).

## Libraries & APIs used

- **React**: function component, `useRef`, list rendering with `key`, `&&` /
  ternary conditional rendering, IIFE for local scope, keyboard event typing
  (`React.KeyboardEvent<HTMLButtonElement>`).
- **Inline SVG**: `viewBox`, `<defs>`/`<marker>` (unique id!), `<path>`,
  `<circle>`, `<rect>`, `<line>`, `<g>`, `transform="rotate(a cx cy)"`,
  `strokeDasharray`.
- **CSS Modules**.
- Shared helpers: [`geometry.ts`](./geometry.ts.md),
  [`usePulse`](./usePulse.ts.md).
- **Accessibility**: native `<button>`, `aria-expanded`, `aria-controls`,
  `aria-hidden` on decorative graphic, explicit Enter/Space handling.

## Concepts to learn here

- **A summary view reusing the same geometry/animation as the detailed view** —
  the payoff of extracting [`geometry.ts`](./geometry.ts.md) and
  [`usePulse`](./usePulse.ts.md).
- **The accessible disclosure trigger**: real `<button>` + `aria-expanded` +
  `aria-controls` + keyboard handling, paired with the panel in
  [`ProgressTimeline`](./ProgressTimeline.tsx.md).
- **`useMemo` is optional**: the beacon skips it (no re-render pressure) while
  the timeline uses it — judgement, not ritual.
- **Unique SVG `<marker>`/`<defs>` ids** to avoid global id collisions when
  multiple SVGs coexist.
- **Status-driven SVG shape switching** and **`transform="rotate(a cx cy)"`**.

## How to edit it safely

- Phases/outputs are data-driven — change `src/data/strands.ts`, not this file,
  to alter what's drawn. Output glyph rules live here and in
  [`ProgressBranch`](./ProgressBranch.tsx.md); keep the two visually consistent.
- The beacon's coordinate constants are independent of the timeline's — tune
  `BEACON_VBW/VBH/SPINE_Y/MARGIN` for the inline size; the shared geometry
  adapts. Match `.svg` height in
  [`ProgressBeacon.module.css`](./ProgressBeacon.module.css.md) if you change
  `BEACON_VBH`.
- Keep the marker id (`beaconArrow`) different from the timeline's
  (`arrowFull`) — duplicate `<marker>` ids on one page break rendering.
- Don't remove the keyboard handler or the ARIA attributes — they are the
  contract that makes the disclosure usable without a mouse and announced
  correctly. The matching `id` lives on the timeline panel via
  [`StrandDetail.tsx`](../StrandDetail.tsx.md)'s `useId`.
- Cross-refs: [`usePulse.ts`](./usePulse.ts.md),
  [`geometry.ts`](./geometry.ts.md),
  [`ProgressTimeline.tsx`](./ProgressTimeline.tsx.md),
  [`ProgressBeacon.module.css`](./ProgressBeacon.module.css.md), parent
  [`StrandDetail.tsx`](../StrandDetail.tsx.md).
