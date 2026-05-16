# `src/components/StrandDetail/Progress/ProgressPhaseNode.tsx`

## What this file is

Draws **one phase milestone** on the timeline spine: a dot plus a label above
and an optional date below. The visual differs by the phase's `status` —
`past` (solid plum), `current` (crimson, with a looping pulse), or `projected`
(hollow dashed outline). It also owns the **current-phase pulse** via
[`usePulse`](./usePulse.ts.md). The parent
[`ProgressTimeline`](./ProgressTimeline.tsx.md) renders one of these per phase
and passes in its `x` position (from [`geometry.ts`](./geometry.ts.md)).

## Line-by-line / block walkthrough

```tsx
import { useRef } from 'react'
import type { Phase } from './types'
import usePulse from './usePulse'
import styles from './ProgressPhaseNode.module.css'
```

`Phase` data type, the reusable pulse hook, and the (intentionally near-empty)
paired CSS Module
([`ProgressPhaseNode.module.css`](./ProgressPhaseNode.module.css.md)).

```tsx
export interface ProgressPhaseNodeProps {
  phase: Phase
  x: number
  y: number
}
```

The phase data plus its coordinates. Like
[`ProgressBranch`](./ProgressBranch.tsx.md), it receives geometry as numbers and
does no math — the **"components ask for coordinates, never compute them"** rule.

```tsx
export default function ProgressPhaseNode({ phase, x, y }: ProgressPhaseNodeProps) {
  const pulseRef = useRef<SVGCircleElement | null>(null)

  usePulse(
    pulseRef,
    {
      rFrom: 18,
      rTo: 28,
      opacityFrom: 0.18,
      opacityTo: 0,
      duration: 1700,
      delay: 1200,
    },
    phase.status === 'current',
  )
```

A ref for the pulsing circle, fed to [`usePulse`](./usePulse.ts.md). Two
important details, both explained by the source comments:

- **`enabled` = `phase.status === 'current'`.** The hook is *always called*
  (Rules of Hooks — you cannot call hooks conditionally), but it only *runs* its
  animation for the current phase. Past/projected nodes mount the hook with
  `enabled=false` and it does nothing.
- **`delay: 1200`.** The pulse should begin only after the entrance animation
  finishes. Rather than coordinate with [`useProgressEntrance`](./useProgressEntrance.ts.md)
  via a `setTimeout` (fragile, stateful), it simply hands a 1200ms delay to
  anime.js. The comment: "we just hand a 1200ms delay to anime.js, so it lines
  up with the entrance no matter when the user expands." A clean example of
  **coordinating animations by parameter, not by orchestration code.**

```tsx
  if (phase.status === 'current') {
    return (
      <g
        className={`${styles.node} ${styles.current} phase phase--current`}
        transform={`translate(${x}, ${y})`}
      >
        <circle ref={pulseRef} r={18} fill="#A30B37" opacity={0.18} />
        <circle r={14} fill="#A30B37" />
        <text y={-32} textAnchor="middle" fontFamily="Lato, sans-serif" fontSize={16} fontWeight={900} fill="#A30B37">
          {phase.label}
        </text>
        {phase.date && (
          <text y={46} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize={11} fill="#A30B37" fontWeight={700} letterSpacing={0.5}>
            {phase.date}
          </text>
        )}
      </g>
    )
  }
```

**Current phase** branch. An **early return per status** — three separate
`return`s, one per status, instead of one big conditional JSX. This keeps each
variant's markup readable.

- `<g transform="translate(x, y)">` positions the whole group; children then use
  origin-relative coords (so `<text y={-32}>` is "32 above the dot", `y={46}` is
  "46 below"). Same origin-centred technique as
  [`ProgressBranch`](./ProgressBranch.tsx.md).
- Two circles: the outer one with `ref={pulseRef}` (this is the circle
  `usePulse` grows `18→28` and fades `0.18→0` on a loop — the radar ping) and a
  solid `r={14}` crimson dot on top.
- `<text textAnchor="middle">` centres the label on the group origin (x=0). The
  date `<text>` is rendered only if `phase.date` exists (`&&` guard;
  `Phase.date` is optional).
- The class string mixes **CSS-module classes** (`styles.node`,
  `styles.current` — empty hooks) with **plain classes** (`phase`,
  `phase--current`) that [`useProgressEntrance`](./useProgressEntrance.ts.md)
  selects (`.phase--current circle`, etc.) to stagger the nodes in. Note this
  group has **no `opacity={0}`** — the entrance hook uses `utils.set` to hide
  past/current nodes just before animating them, so they don't need a static
  starting opacity (contrast with branches/projected which do).

```tsx
  if (phase.status === 'projected') {
    return (
      <g
        className={`${styles.node} ${styles.projected} phase phase--projected`}
        transform={`translate(${x}, ${y})`}
        opacity={0}
      >
        <circle r={13} fill="#FFECE1" stroke="#2F0147" strokeWidth={2.5} strokeDasharray="4 4" />
        <text y={-30} ... opacity={0.7}>{phase.label}</text>
        {phase.date && (<text y={44} ... opacity={0.4}>{phase.date}</text>)}
      </g>
    )
  }
```

**Projected phase**: a hollow circle (cream fill so it reads as empty) with a
dashed plum outline (`strokeDasharray="4 4"`) — visually "not reached yet."
Labels are dimmed (`opacity={0.7}` / `0.4`). Crucially the group has
**`opacity={0}`** *and* the plain class `phase--projected`: the entrance hook
fades projected phases in last (step 4/5), and the reduced-motion branch snaps
them to `opacity:1`. The static `opacity={0}` is the contract that lets the hook
own the reveal (without it, the projected node would flash visible first).

```tsx
  // past
  return (
    <g className={`${styles.node} ${styles.past} phase phase--past`} transform={`translate(${x}, ${y})`}>
      <circle r={13} fill="#2F0147" />
      <text y={-30} ... fill="#2F0147">{phase.label}</text>
      {phase.date && (<text y={44} ... opacity={0.55}>{phase.date}</text>)}
    </g>
  )
}
```

**Past phase** (the fall-through default): a solid plum dot, full-strength
label, slightly dimmed date. Plain class `phase--past` so the entrance hook
staggers it in (via `utils.set` then animate — hence no static `opacity={0}`
here either).

## Libraries & APIs used

- **React**: function component, `useRef`, **early-return-per-variant** rendering,
  `&&` conditional rendering, Rules-of-Hooks-compliant conditional animation
  (always call `usePulse`, gate via `enabled`).
- **Inline SVG**: `<g transform="translate()">`, `<circle>` (`strokeDasharray`
  for the dashed projected ring), origin-relative `<text>` (`textAnchor`).
- **CSS Modules** (empty status hooks) + plain animation class names.
- Custom hook [`usePulse`](./usePulse.ts.md).

## Concepts to learn here

- **One component, status-driven variants** via clean early returns rather than
  nested ternaries.
- **Conditional animation without breaking Rules of Hooks**: always call the
  hook; pass `enabled`.
- **Coordinating two animations by `delay`, not orchestration** (pulse `delay:
  1200` lining up with the entrance) — pairs with
  [`useProgressEntrance`](./useProgressEntrance.ts.md).
- **The `opacity={0}` + plain-class contract** with the entrance hook, and the
  subtlety that *past/current* nodes skip the static `opacity={0}` because the
  hook uses `utils.set` for them while *projected* keeps it.
- **Origin-centred SVG group** positioned once via `transform="translate"`.

## How to edit it safely

- Phases are **data** — add/remove/relabel them in `src/data/strands.ts`
  (`progress.phases`); this component just renders whatever status it is given.
  `date` is optional, so the `{phase.date && …}` guards must stay.
- If you add a new `PhaseStatus`, add a new early-return branch here (and decide
  its entrance behaviour in
  [`useProgressEntrance.ts`](./useProgressEntrance.ts.md) by adding it to the
  relevant selectors, plus the reduced-motion snap).
- Keep the plain classes `phase`, `phase--past/current/projected` exactly as-is
  — they are the selectors [`useProgressEntrance`](./useProgressEntrance.ts.md)
  depends on. Keep `opacity={0}` on the **projected** group (the hook fades it
  in) but do **not** add it to past/current (the hook `utils.set`s those).
- If you change the entrance timeline length, revisit the pulse `delay: 1200`
  so the pulse still starts when the entrance ends (see
  [`usePulse.ts`](./usePulse.ts.md)).
- Cross-refs: [`usePulse.ts`](./usePulse.ts.md),
  [`useProgressEntrance.ts`](./useProgressEntrance.ts.md),
  [`geometry.ts`](./geometry.ts.md),
  [`ProgressTimeline.tsx`](./ProgressTimeline.tsx.md),
  [`ProgressPhaseNode.module.css`](./ProgressPhaseNode.module.css.md);
  miniature counterpart in [`ProgressBeacon.tsx`](./ProgressBeacon.tsx.md).
