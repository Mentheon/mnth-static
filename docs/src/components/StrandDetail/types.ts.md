# `src/components/StrandDetail/types.ts`

## What this file is

This file declares the **prop contract** for the top-level `StrandDetail`
component, and re-exports a couple of data types so the rest of the folder can
import them from one local place instead of reaching into the data layer.

Think of it as the "what does this component need to be handed?" document,
written in TypeScript so the compiler enforces it.

## Line-by-line / block walkthrough

```ts
import type { Strand, StrandProgress } from '../../data/strands'
```

`import type` imports **only the type shapes**, not any runtime code. `Strand`
and `StrandProgress` are interfaces defined in `src/data/strands.ts` (the
canonical data module). `Strand` describes a whole research strand (id, label,
tagline, abstract, objectives, etc.); `StrandProgress` describes the timeline
(its `phases[]` and `outputs[]`). We do not document `src/data/strands.ts`
itself, but it is worth opening once to see the real data the UI renders.

```ts
export interface StrandDetailProps {
  strand: Strand
  progress: StrandProgress
  onBack?: () => void   // optional — drives breadcrumb back-link if present
}
```

This is a **TypeScript interface** describing the object the `StrandDetail`
component receives as its single `props` argument:

- `strand: Strand` — the full strand record. Required.
- `progress: StrandProgress` — the timeline data. Required, and passed
  *separately* from `strand` even though `Strand` also has an optional
  `progress?` field. The component is given the resolved progress explicitly so
  it never has to deal with the "what if it's undefined" case for the timeline.
- `onBack?: () => void` — the `?` makes this **optional**. Its type is "a
  function that takes no arguments and returns nothing." If a parent passes one,
  the breadcrumb renders a `<button>` that calls it; if not, the breadcrumb
  renders a plain `<a href="#">` instead. (See
  [`StrandDetail.tsx`](./StrandDetail.tsx.md).)

The `// optional` comment teaches the *intent*, not just the syntax — a good
habit when a prop's presence changes behaviour.

```ts
// Re-export the canonical Strand for convenience inside this folder.
export type { Strand, StrandProgress }
```

This **re-exports** the two imported types so other files inside `StrandDetail/`
can do `import type { Strand } from '../types'` instead of computing the
relative path back to `src/data/strands.ts`. It is a small ergonomics and
decoupling win: if the data module ever moves, only this file's import path
changes.

(Note: the `Progress/` subfolder has its *own* `types.ts` doing the same trick
for the progress-specific types — see
[`Progress/types.ts`](./Progress/types.ts.md).)

## Libraries & APIs used

- TypeScript `interface`, optional properties (`?`), function type syntax
  (`() => void`), `import type` / `export type`.

## Concepts to learn here

- **Props as a typed contract.** The interface is the single source of truth for
  what the component accepts; the compiler rejects callers who omit `strand`.
- **Optional props that change behaviour** (`onBack`). Optionality is a design
  decision, not just syntax.
- **Re-exporting types to localise dependencies** on the data layer.

## How to edit it safely

- To **change the strand data shape** (add a field, change a type), edit
  `src/data/strands.ts` first (that is the canonical definition). The change
  flows here automatically because `Strand`/`StrandProgress` are imported from
  there.
- To add a new *prop* to the component (e.g. a `variant` flag), add it to
  `StrandDetailProps` here, then handle it in
  [`StrandDetail.tsx`](./StrandDetail.tsx.md), then — if external callers need
  to type it — confirm it is re-exported via
  [`index.ts`](./index.ts.md).
- Keep new optional props marked with `?` unless every caller will always pass
  them; making a prop required is a breaking change for callers.
