# `src/components/StrandDetail/CTAs/StrandCTARow.tsx`

## What this file is

A thin **list/container component**: it takes the strand's array of CTAs and
renders one [`CTAButton`](./CTAButton.tsx.md) per entry inside a flex row. It is
the last thing rendered by [`StrandDetail.tsx`](../StrandDetail.tsx.md).

This file teaches the **"render a list with `.map`"** pattern and the
**"render nothing when empty"** guard.

## Line-by-line / block walkthrough

```tsx
import type { CTA } from '../../../data/strands'
import CTAButton from './CTAButton'
import styles from './StrandCTARow.module.css'
```

The `CTA` type, the leaf component, and the paired CSS Module
([`StrandCTARow.module.css`](./StrandCTARow.module.css.md)).

```tsx
export interface StrandCTARowProps {
  ctas: CTA[]
}
```

Props: an **array** of `CTA`. `StrandDetail` passes `strand.ctas ?? []`, so this
component always receives a real array (possibly empty), never `undefined`.

```tsx
export default function StrandCTARow({ ctas }: StrandCTARowProps) {
  if (ctas.length === 0) return null
```

**Early return / empty guard.** If there are no CTAs, return `null` — a
component that returns `null` renders nothing. This means the parent does not
have to conditionally include `<StrandCTARow>`; the component self-suppresses.
Several components in this folder use this same pattern (`AbstractSection`,
`ObjectivesSection`, …), which is why `StrandDetail` can blindly render all
sections.

```tsx
  return (
    <div className={styles.row}>
      {ctas.map((cta, i) => (
        <CTAButton key={i} cta={cta} />
      ))}
    </div>
  )
}
```

- `{ctas.map(...)}` — **rendering a list**. `Array.prototype.map` transforms
  each data item into a `<CTAButton>` element; JSX renders an array of elements
  in order.
- `key={i}` — React requires a **`key`** on each element in a rendered list. The
  key lets React match elements between renders so it can update efficiently.
  Here the index `i` is used as the key. Index keys are acceptable **only for
  static, never-reordered lists** like this one (CTAs come straight from static
  data and are not sorted/filtered/inserted). For dynamic lists you would use a
  stable unique id instead.
- `cta={cta}` hands the data object down to the leaf.

## Libraries & APIs used

- **React**: list rendering with `.map`, `key` prop, returning `null` to render
  nothing.
- **CSS Modules** (`styles.row`).

## Concepts to learn here

- **The list-rendering pattern**: `array.map(item => <Comp key=… … />)`.
- **Why `key` exists** and when an index key is safe vs unsafe.
- **Self-suppressing components** (`return null` on empty) to keep the parent
  simple — a recurring idiom across this folder's section components.
- **Container vs leaf split**: this file owns layout/iteration; `CTAButton`
  owns one item's presentation.

## How to edit it safely

- If CTAs ever become reorderable or filterable, switch `key={i}` to a stable
  identifier (add an `id` to the `CTA` type in `src/data/strands.ts` and use
  `key={cta.id}`).
- Layout (gap, wrapping) lives in
  [`StrandCTARow.module.css`](./StrandCTARow.module.css.md); per-button look in
  [`CTAButton.module.css`](./CTAButton.module.css.md). Edit the right file.
- Keep the empty guard — removing it would render an empty `<div>` with margin
  for strands that have no CTAs (most strands in `src/data/strands.ts` other
  than `kindred` have none).
