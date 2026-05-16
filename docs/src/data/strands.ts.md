# `src/data/strands.ts`

## What this file is

The **static data + type model for "strands"** — the site's named
research programmes (Kindreon, Aevorix, Acumentra). It's the richest data
file in the project: it defines a layered set of TypeScript types and
then one fully-populated entry (`kindred`) plus two lighter ones. The
detail page, the 3D helix, and the Marginalia strand-filter all read from
this. Like `people.ts`, there's no logic — just types and a typed
constant — but the types here teach unions, optional fields, and
`as const`-style literal modelling.

The `id` values here (`kindred`, `vitalis`, `vitrix`) are the **canonical
strand IDs** that Marginalia article frontmatter `strands:` lines are
matched against — see
[`loadArticles.ts`](../lib/marginalia/loadArticles.ts.md).

## Line-by-line / block walkthrough

```ts
export interface ResearchTheme {
  title: string
  description: string
}
```

Same idea as `PersonTheme` in `people.ts`: a small reusable card type.

```ts
export type PhaseId = 'nascent' | 'research' | 'design' | 'development' | 'evaluation'
export type PhaseStatus = 'past' | 'current' | 'projected'
```

These are **string-literal union types** (`type X = 'a' | 'b' | ...`). A
value of type `PhaseId` must be *exactly one of those five strings* —
nothing else compiles. This is how TypeScript models a fixed enum-like
set without a runtime `enum`. It gives you autocomplete and catches typos
(`'reserch'` would be rejected).

```ts
export interface Phase {
  id: PhaseId
  label: string
  status: PhaseStatus
  date?: string
}
```

One milestone in a strand's timeline. `id`/`status` are constrained to
the unions above; `label` is free text; `date?` is **optional** (the `?`)
— a phase may have no date.

```ts
export type OutputType = 'paper' | 'prototype' | 'artefact'
export type OutputBehaviour = 'output' | 'terminus'

export interface ProgressOutput {
  id: string
  type: OutputType
  title: string
  metaLabel: string             // 'PAPER · CHI \'25 LBW' for the SVG label under node
  tooltipMeta: string           // 'CHI \'25 · Late-breaking work'
  tooltipDesc: string
  attachedAfterPhase: PhaseId
  behaviour: OutputBehaviour
}
```

A research **output** hung off the timeline (a paper, prototype, or
artefact). Note:

- `type` and `behaviour` are again literal unions.
- `attachedAfterPhase: PhaseId` ties the output to a specific timeline
  phase — and reuses the `PhaseId` union, so it can only point at a real
  phase.
- The inline `//` comments document exactly how each string is used by
  the rendering layer (SVG node label vs. tooltip). When data fields map
  to specific UI, comments like these are gold.
- `behaviour: 'output' | 'terminus'` — `'terminus'` marks a dead-end
  branch (something superseded), `'output'` something that fed back into
  the main line. Pure presentation semantics encoded as data.

```ts
export interface StrandProgress {
  phases: Phase[]
  outputs: ProgressOutput[]
}
```

Composes the two: a strand's progress is its list of phases plus its
list of outputs.

```ts
export interface ObjectiveItem {
  verb: string
  text: string
}
export interface CTA {
  label: string
  href: string
  variant: 'primary' | 'secondary'
  arrow?: boolean
}
export interface StrandMeta {
  since?: string
  collaborators?: string
  phase?: string
}
```

More small building-block types. In `CTA` (call-to-action button),
`variant` is a two-value union (styling variant) and `arrow?: boolean`
is an optional flag for whether to render a trailing arrow. `StrandMeta`
is an all-optional metadata bundle.

```ts
export interface Strand {
  id: string
  label: string
  tagline: string
  href: string
  themes: ResearchTheme[]
  // new optional fields used by StrandDetail:
  abstract?: string
  objectives?: ObjectiveItem[]
  researchQuestions?: string[]
  ctas?: CTA[]
  progress?: StrandProgress
  kicker?: string                 // 'strand · 03 of 06 · in progress'
  meta?: StrandMeta
}
```

The top-level type. The first five fields are **required** (every strand
must have at least an id, label, tagline, href, and themes). Everything
below the comment is **optional** (`?`). This is a deliberate design: a
strand can be a stub (just the basics, like `vitalis` and `vitrix`
below) *or* a fully fleshed-out detail page (like `kindred`). Optional
fields let one type serve both without separate "summary" vs "full"
types — components just check `if (strand.progress) { ... }` before
rendering that section.

```ts
export const STRANDS: Strand[] = [
  { id: 'kindred', label: 'Kindreon', ... progress: { phases: [...], outputs: [...] } },
  { id: 'vitalis', label: 'Aevorix', ... },   // only required fields
  { id: 'vitrix',  label: 'Acumentra', ... }, // only required fields
]
```

The data. `kindred` exercises *every* optional field — abstract,
objectives, researchQuestions, ctas, progress (with five phases and
three outputs), kicker, meta. `vitalis` and `vitrix` supply only the
required fields, demonstrating the optional-field design in practice.
The whole array is typed `Strand[]`, so the compiler validates each
entry — including that, e.g., every `phase.status` is one of the three
allowed literals and every `output.attachedAfterPhase` is a real
`PhaseId`.

Notice the data also tells a story through these typed fields:
`kindred`'s outputs include a `behaviour: 'terminus'` prototype that was
"superseded" and `behaviour: 'output'` items that continued — the helix
component reads these to draw branches vs. the main spine.

## Libraries & APIs used

None. Pure TypeScript: `interface`, `type` unions, optional properties,
and a typed `const`. Consumed by React components (the strand detail
page, the 3D helix in `src/components/Helix3D/`, and Marginalia's strand
filter).

## Concepts to learn here

- **String-literal union types** (`'a' | 'b' | 'c'`) as a typo-proof,
  enum-like vocabulary, and reusing them across interfaces
  (`PhaseId` used in both `Phase` and `ProgressOutput`).
- **Optional properties** (`field?: T`) and the pattern of one flexible
  type serving both "stub" and "full" records.
- Type **composition**: small interfaces (`Phase`, `ProgressOutput`)
  assembled into larger ones (`StrandProgress`, `Strand`).
- Encoding **presentation semantics as data** (`variant`, `behaviour`,
  `status`) so components stay declarative.
- Documenting data→UI mapping with inline comments.
- Separating content from components for compiler-checked editability.

## How to edit it safely

- **To add a strand:** append a `Strand` object to `STRANDS`. Only
  `id`, `label`, `tagline`, `href`, `themes` are mandatory — start
  there (copy the shape of `vitalis`). Add the optional sections later
  as content is ready; components guard on their presence.
- **`id` is the canonical strand key.** It must be lowercase and is
  matched against Marginalia frontmatter `strands:` values (see
  `loadArticles.ts`) and used in `#/strands/<id>` routes. Keep it
  unique and stable; renaming breaks article cross-links and saved URLs.
- **Stay inside the unions.** `phase.status` must be
  `past|current|projected`; `output.type` must be
  `paper|prototype|artefact`; `attachedAfterPhase` must equal one of the
  `phase.id`s you actually listed. The compiler enforces the union
  membership, but it does *not* check that `attachedAfterPhase` refers
  to a phase that exists in *this* strand — that's a logical invariant
  you must keep by hand, or the helix will attach an output to nothing.
- **Adding a new field:** add it to the relevant interface first. Make
  it optional (`?`) unless you're prepared to fill it in for *every*
  existing strand (required fields force all entries to be updated).
- **Adding a new phase or output type:** extend the union
  (`PhaseId`/`OutputType`) — every place that switches on it should be
  updated too, so search the components for usages after changing a
  union.
- No side effects here; risk is purely "does the data still satisfy the
  types and the helix's structural assumptions".
