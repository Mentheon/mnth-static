# `src/components/StrandDetail/Progress/types.ts`

## What this file is

A **type re-export barrel** for the Progress subsystem. It pulls the
progress-related types out of the canonical data module
(`src/data/strands.ts`) and re-exports them so every file inside `Progress/`
imports types from one short local path instead of computing
`../../../data/strands` repeatedly.

It contains *only* type re-exports — zero runtime code.

## Line-by-line / block walkthrough

```ts
// Re-exports the progress-related types from the canonical Strand
// data module so the Progress folder stays self-contained — components
// inside Progress/ should import from this file, not from the data layer.
export type {
  Phase,
  PhaseId,
  PhaseStatus,
  ProgressOutput,
  OutputType,
  OutputBehaviour,
  StrandProgress,
} from '../../../data/strands'
```

`export type { ... } from '...'` is a **type-only re-export**: it forwards the
listed type names without importing them as runtime values, so it compiles away
to nothing. The exported types and their roles (all defined in
`src/data/strands.ts`):

- `Phase` — `{ id, label, status, date? }`, one milestone on the spine.
- `PhaseId` — `'nascent' | 'research' | 'design' | 'development' | 'evaluation'`,
  the string-literal union used as `Map` keys in
  [`geometry.ts`](./geometry.ts.md).
- `PhaseStatus` — `'past' | 'current' | 'projected'`, drives which SVG shape a
  phase node renders ([`ProgressPhaseNode`](./ProgressPhaseNode.tsx.md)).
- `ProgressOutput` — a paper/prototype/artefact branch
  (`type`, `behaviour`, `attachedAfterPhase`, labels, tooltip text).
- `OutputType` — `'paper' | 'prototype' | 'artefact'`, picks the branch's shape
  and colour ([`ProgressBranch`](./ProgressBranch.tsx.md)).
- `OutputBehaviour` — `'output' | 'terminus'`, decides return-curve vs caps
  (see [`geometry.ts`](./geometry.ts.md)’s `returnTargetX`).
- `StrandProgress` — `{ phases: Phase[]; outputs: ProgressOutput[] }`, the whole
  timeline payload passed in as the `progress` prop.

This mirrors the same pattern used by the folder-level
[`StrandDetail/types.ts`](../types.ts.md) — both localise the dependency on the
data layer so the data module can move without touching many files.

## Libraries & APIs used

- TypeScript `export type { … } from` (type-only re-export).

## Concepts to learn here

- **Decoupling via a local type barrel**: one file knows the data layer's path;
  everyone else imports `./types`.
- **String-literal union types** (`PhaseStatus`, `OutputType`,
  `OutputBehaviour`) — finite enumerations the compiler checks, and which the
  components `switch`/branch on.
- **Type-only imports/exports** vanish at runtime (no bundle cost, no circular
  runtime dependency risk).

## How to edit it safely

- **Never define the actual interfaces here.** They live in
  `src/data/strands.ts` (the single source of truth). This file only forwards
  them.
- If you add a new progress type to `src/data/strands.ts` that Progress
  components need, add its name to this `export type { … }` list.
- Keep it `export type` (not plain `export`) — these are erased types; a plain
  `export` would attempt a runtime value re-export and break under
  `isolatedModules`.
- Cross-references: consumed throughout the folder, notably
  [`ProgressTimeline.tsx`](./ProgressTimeline.tsx.md),
  [`geometry.ts`](./geometry.ts.md),
  [`ProgressBranch.tsx`](./ProgressBranch.tsx.md),
  [`ProgressPhaseNode.tsx`](./ProgressPhaseNode.tsx.md). Compare with the
  folder-level [`types.ts`](../types.ts.md).
