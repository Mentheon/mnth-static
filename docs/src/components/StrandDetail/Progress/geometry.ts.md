# `src/components/StrandDetail/Progress/geometry.ts`

## What this file is

The **coordinate brain** of the Progress subsystem. It is a tiny module of
**pure functions** that turn the strand's progress *data* (phases and outputs)
into SVG *x-coordinates*. It contains **no React, no DOM, no side effects** — it
is just math. Every Progress component asks these functions for positions
instead of hardcoding numbers.

This is arguably the most important file to understand the Progress
architecture, because the central design rule is: *coordinates are computed
here, once, and flow outward as plain numbers.*

## Why a separate pure module?

The original reference for this UI was a static HTML demo with hand-typed `cx`,
`x1`, `d="..."` values. That cannot adapt if the data changes. Extracting the
math into pure functions means:

- **Data-driven layout**: add a phase to `src/data/strands.ts` and every
  coordinate recalculates correctly.
- **Testability**: pure functions (same input → same output, no side effects)
  are trivial to unit test without rendering anything.
- **Reuse**: both the big [`ProgressTimeline`](./ProgressTimeline.tsx.md) and
  the small [`ProgressBeacon`](./ProgressBeacon.tsx.md) call the *same*
  functions with different viewBox sizes/margins, so the two renderings stay
  geometrically consistent.

## Line-by-line / block walkthrough

```ts
import type { Phase, PhaseId, ProgressOutput } from './types'
```

Type-only import from the local [`types.ts`](./types.ts.md) re-export. `Phase`
is `{ id, label, status, date? }`; `PhaseId` is the string-literal union of
phase ids; `ProgressOutput` describes a paper/prototype/artefact branch (see
`src/data/strands.ts`).

### `phasePositions` — spread phases evenly

```ts
export function phasePositions(
  phases: Phase[],
  viewBoxWidth: number,
  margin: number,
): Map<PhaseId, number> {
  const result = new Map<PhaseId, number>()
  if (phases.length === 0) return result
```

Returns a **`Map`** from each phase id to its x-coordinate. A `Map` (rather than
a plain object) is a clean key→value structure with `.get()`/`.set()`; here keys
are `PhaseId`s. Empty input → empty map (defensive base case).

```ts
  if (phases.length === 1) {
    result.set(phases[0].id, viewBoxWidth / 2)
    return result
  }
```

Special case: a lone phase is centred (dividing by `phases.length - 1` below
would be a divide-by-zero with one phase).

```ts
  const span = viewBoxWidth - margin * 2
  const step = span / (phases.length - 1)
  phases.forEach((p, i) => {
    result.set(p.id, margin + step * i)
  })
  return result
}
```

The core layout math. `span` is the usable width after reserving `margin` on
both sides. `step` is the gap between adjacent phases: dividing the span into
`n - 1` equal intervals places the **first phase exactly at `margin`** and the
**last exactly at `viewBoxWidth - margin`**, with the rest evenly between. Phase
`i` lands at `margin + step * i`. This is classic even-distribution: for `n`
points across a span you want `n-1` gaps.

Worked example (timeline: `VBW=1400`, `MARGIN=120`, 5 phases):
`span = 1400 - 240 = 1160`; `step = 1160 / 4 = 290`. Positions:
`120, 410, 700, 990, 1280`.

### `branchX` — where an output's branch leaves the spine

```ts
export function branchX(
  output: ProgressOutput,
  positions: Map<PhaseId, number>,
  phases: Phase[],
): number {
  const idx = phases.findIndex(p => p.id === output.attachedAfterPhase)
  if (idx === -1) return positions.values().next().value ?? 0
```

An output is "attached after" some phase (`output.attachedAfterPhase`). We find
that phase's index. `findIndex` returns `-1` if not found; the fallback
`positions.values().next().value ?? 0` grabs the first position in the map (an
iterator's first value) or `0` — a defensive "don't crash on bad data" path.

```ts
  const here = positions.get(output.attachedAfterPhase) ?? 0
  const next = idx + 1 < phases.length
    ? positions.get(phases[idx + 1].id)
    : undefined
  if (next === undefined) return here
  return (here + next) / 2
}
```

`here` is the attachment phase's x. If there is a following phase, `next` is its
x and the branch leaves the spine at the **midpoint** `(here + next) / 2` —
visually, the branch drops down *between* two phases. If the output is attached
after the last phase (no `next`), it leaves at `here` itself. So branches hang
between nodes, not on top of them.

### `returnTargetX` — where a returning branch rejoins the spine

```ts
export function returnTargetX(
  output: ProgressOutput,
  positions: Map<PhaseId, number>,
  phases: Phase[],
): number | undefined {
  if (output.behaviour !== 'output') return undefined
```

An output's `behaviour` is `'output'` (the strand continued from it — its branch
loops back to the spine) or `'terminus'` (a dead-end — no return curve, the
branch instead gets little "cap" lines). For a terminus, return `undefined`,
signalling the caller to draw caps instead of a return curve.

```ts
  const idx = phases.findIndex(p => p.id === output.attachedAfterPhase)
  if (idx === -1 || idx + 1 >= phases.length) return undefined
  return positions.get(phases[idx + 1].id)
}
```

For an `'output'`, the branch rejoins the spine at the **next phase's x**. If
there is no next phase, return `undefined` (nowhere to return to). The return
type `number | undefined` makes the "maybe no target" case explicit and forces
callers to handle it (they do — see `ProgressBranch`/`ProgressBeacon`).

## Libraries & APIs used

- Pure TypeScript/JavaScript: `Map`, `Array.findIndex` / `forEach`,
  iterator `.values().next()`, nullish coalescing `??`.
- No React, no DOM, no third-party libs — intentionally.

## Concepts to learn here

- **Pure functions** and why isolating them (testable, reusable, predictable)
  matters in a graphics codebase.
- **Even-distribution math**: `n` points over a span need `n - 1` gaps;
  endpoints land on the margins.
- **Returning `Map` / `number | undefined`** to model "lookup" and "maybe
  absent" cleanly, pushing the "what if absent" decision to the caller.
- **Data-driven coordinates**: the contract that components never hardcode
  positions — the backbone of the whole subsystem.

## How to edit it safely

- **Adding/removing phases or outputs** requires *no change here* — just edit
  the data in `src/data/strands.ts`. These functions recompute automatically.
- If you change spacing strategy (e.g. weight phases by date), change *only*
  `phasePositions`; every caller benefits and nothing else needs editing.
- Keep these functions **pure** — no `Date.now()`, no DOM reads, no React. The
  entire subsystem relies on them being deterministic and side-effect free
  (e.g. `useMemo` in [`ProgressTimeline`](./ProgressTimeline.tsx.md) assumes
  same `progress` → same positions).
- `branchX`/`returnTargetX` depend on `output.attachedAfterPhase` matching a
  real `phase.id` and on `behaviour` being `'output' | 'terminus'`. If you add a
  new `OutputBehaviour`, decide here what its return curve should do.
- Cross-references: consumed by
  [`ProgressTimeline.tsx`](./ProgressTimeline.tsx.md) and
  [`ProgressBeacon.tsx`](./ProgressBeacon.tsx.md); the shapes it operates on are
  in [`types.ts`](./types.ts.md) (→ `src/data/strands.ts`); the visual use of
  its outputs is in [`ProgressBranch.tsx`](./ProgressBranch.tsx.md).
