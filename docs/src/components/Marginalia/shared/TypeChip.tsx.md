# `src/components/Marginalia/shared/TypeChip.tsx`

## What this file is

A tiny shared component that renders the **article-type badge** — the
small uppercase chip reading "ESSAY", "NOTE", "DISPATCH", etc., in a
type-specific colour. It maps the `ArticleType` union value to (a) a
human label and (b) a colour-variant CSS class.

Used wherever meta is shown, via
[`shared/ArticleMeta.tsx`](./ArticleMeta.tsx.md) (which in turn is used
by both the list card and the detail header).

## Line-by-line / block walkthrough

```tsx
import type { ArticleType } from '../types'
import styles from './TypeChip.module.css'
```

Type-only import of the `ArticleType` string-literal union (see
[`types.ts`](../types.ts.md)) and the paired CSS Module
([`TypeChip.module.css`](./TypeChip.module.css.md)).

```tsx
interface TypeChipProps {
  type: ArticleType
}
```

One prop: the article's `type`, constrained to the
`'essay' | 'note' | ...` union. Because it's the union (not `string`),
the lookup tables below get compile-time checking.

```tsx
const LABELS: Record<ArticleType, string> = {
  essay: 'Essay',
  note: 'Note',
  dispatch: 'Dispatch',
  'paper-summary': 'Paper summary',
  'link-roundup': 'Link roundup',
}
```

A **lookup table** mapping each type id to its display label.

- `Record<ArticleType, string>` — a TypeScript **mapped/record type**:
  "an object with *exactly* one key per `ArticleType` member, each
  valued by a string". This is powerful: if you add a new member to the
  `ArticleType` union in `types.ts` and forget to add it here, the
  compiler errors ("property X is missing"). The type makes the table
  **exhaustive by construction**.
- `'paper-summary'` is quoted because it contains a hyphen (not a valid
  bare JS identifier); `essay` etc. don't need quotes.

```tsx
const VARIANT: Record<ArticleType, string> = {
  essay: 'chipCrimson',
  note: 'chipPlum',
  dispatch: 'chipInk',
  'paper-summary': 'chipGrape',
  'link-roundup': 'chipGrape',
}
```

A second exhaustive lookup mapping each type to a **CSS-module class
key** (the *name* of the class as written in the stylesheet, not the
hashed value). Two types share `chipGrape` — many-to-one is fine.

```tsx
function chipClass(type: ArticleType): string {
  const key = VARIANT[type] ?? 'chipInk'
  return styles[key]
}
```

Resolves a type to its actual hashed class string.

- `VARIANT[type] ?? 'chipInk'` — look up the variant key; **nullish
  coalescing** falls back to `'chipInk'` defensively. (With the
  `Record<ArticleType, ...>` typing every member is present, so this
  fallback is belt-and-braces for any value that slips past the types at
  runtime.)
- `return styles[key]` — **dynamic CSS-module access**. `styles` is the
  object the CSS-module import produced (`{ chipCrimson: "TypeChip_chipCrimson__x1", ... }`).
  Indexing it by the *variable* `key` returns the hashed class string.
  This is the standard way to pick a CSS-module class **at runtime** by
  a computed name — you can't write `styles.chipCrimson` when the class
  depends on data.

```tsx
export default function TypeChip({ type }: TypeChipProps) {
  const label = LABELS[type] ?? 'Note'
  return <span className={`${styles.chip} ${chipClass(type)}`}>{label}</span>
}
```

- `LABELS[type] ?? 'Note'` — resolve the display label, defaulting to
  `'Note'` if somehow unknown (again defensive; the comment in
  `loadArticles.ts`, cross-referenced, explains the same philosophy:
  "never throw — a fallback tag beats dropping editorial").
- The returned `<span>` composes **two** classes via a template literal:
  `styles.chip` (shared shape: padding, mono, uppercase — see paired
  CSS) plus the per-type colour class from `chipClass(type)`. This is
  the base + variant class pattern, but here the variant is chosen
  *dynamically from data*.
- `{label}` is the chip's text.

## Libraries & APIs used

- **React** — function component, props.
- **TypeScript** — string-literal union prop, `Record<K, V>` mapped
  type for exhaustive lookup tables, nullish coalescing `??`.
- **CSS Modules** — `styles` object, **dynamic key access**
  `styles[key]`.

## Concepts to learn here

- **`Record<UnionType, T>` lookup tables** that are exhaustive by
  construction — add a union member and the compiler forces you to add
  the row. A clean alternative to `switch` statements.
- **Dynamic CSS-module class selection**: `styles[variableKey]` when the
  class depends on runtime data (vs static `styles.foo`).
- **Base + data-driven variant class** composed via a template literal.
- **Defensive `?? fallback`** so unexpected data degrades gracefully
  instead of crashing — a recurring philosophy in this feature.
- **Quoting object keys** that aren't valid identifiers
  (`'paper-summary'`).

## How to edit it safely

- **Add a new article type**: first add it to the `ArticleType` union in
  [`types.ts`](../types.ts.md). The compiler will then flag *both*
  `LABELS` and `VARIANT` here as missing the new key — add a label and a
  colour-class key to each. Also add the colour class itself in
  [`TypeChip.module.css`](./TypeChip.module.css.md), and update
  `KNOWN_TYPES` in `src/lib/marginalia/loadArticles.ts`
  (cross-referenced). The `Record` typing turns this into a guided
  checklist rather than a guessing game.
- **Recolour a type**: change its value in `VARIANT` to a different
  `chip*` key, or edit that class's colour in
  [`TypeChip.module.css`](./TypeChip.module.css.md).
- **Rename a colour class**: must change in *three* coordinated places —
  the `VARIANT` values here, and the class definition + name in
  [`TypeChip.module.css`](./TypeChip.module.css.md). A mismatch makes
  `styles[key]` return `undefined` (unstyled chip, no error).
- **Gotcha**: `styles[key]` returns `undefined` if `key` isn't a real
  class in the module. Keep the `VARIANT` values exactly matching class
  names in the CSS file.
- **Gotcha**: the fallbacks (`?? 'chipInk'`, `?? 'Note'`) are
  intentional resilience for malformed/unknown frontmatter — don't
  remove them assuming the types guarantee safety at *runtime* (the data
  comes from hand-written markdown).
- Paired file: [`TypeChip.module.css`](./TypeChip.module.css.md).
  Consumed via [`shared/ArticleMeta.tsx`](./ArticleMeta.tsx.md).
