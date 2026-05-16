# `src/components/StrandDetail/Sections/ObjectivesSection.tsx`

## What this file is

The **§02 "Objectives"** section: a heading plus a responsive grid of
[`ObjectiveCard`](./ObjectiveCard.tsx.md)s, one per objective. It is a
container/list component — it owns the heading and the iteration; each card owns
its own presentation.

## Line-by-line / block walkthrough

```tsx
import type { ObjectiveItem } from '../../../data/strands'
import SectionTitle from './SectionTitle'
import ObjectiveCard from './ObjectiveCard'
import styles from './ObjectivesSection.module.css'
```

The data type (`ObjectiveItem` = `{ verb, text }`, see `src/data/strands.ts`),
the shared title, the leaf card, and the paired CSS Module
([`ObjectivesSection.module.css`](./ObjectivesSection.module.css.md)).

```tsx
export interface ObjectivesSectionProps {
  items: ObjectiveItem[]
  sectionNumber?: string
}
```

`items` is an array of objectives; `sectionNumber?` the optional `"02"`. The
parent passes `strand.objectives ?? []`.

```tsx
export default function ObjectivesSection({ items, sectionNumber }: ObjectivesSectionProps) {
  if (items.length === 0) return null
```

The **self-suppressing empty guard** — same idiom as the other sections; no
objectives → render nothing, so [`StrandDetail`](../StrandDetail.tsx.md) can
list it unconditionally.

```tsx
  return (
    <section className={styles.section}>
      <SectionTitle text="Objectives" number={sectionNumber} />
      <div className={styles.grid}>
        {items.map((item, idx) => (
          <ObjectiveCard key={idx} item={item} index={idx} />
        ))}
      </div>
    </section>
  )
}
```

- Composes the shared `<SectionTitle>` with the label `"Objectives"`.
- `<div className={styles.grid}>` — the CSS Module turns this into a responsive
  CSS Grid (auto-fitting columns; see the paired CSS).
- `{items.map((item, idx) => <ObjectiveCard key={idx} item={item} index={idx}
  />)}` — the **list-rendering pattern**. Each objective becomes a card. Note
  **`index={idx}` is passed as a real prop**, not just used as the React `key`:
  the card displays a numeric badge (`01`, `02`, …) derived from it. `key={idx}`
  (the array index) is acceptable here because objectives come straight from
  static data and are never reordered/filtered (same reasoning as
  [`StrandCTARow`](../CTAs/StrandCTARow.tsx.md)).

## Libraries & APIs used

- **React**: function component, early `return null`, list rendering with
  `.map` + `key`, composition (`SectionTitle`, `ObjectiveCard`).
- **CSS Modules**.
- Semantic HTML: `<section>`.

## Concepts to learn here

- **Container vs leaf split**: this owns the section + iteration;
  [`ObjectiveCard`](./ObjectiveCard.tsx.md) owns one item.
- **`index` as data, not just a `key`** — passing the position down so the card
  can show its number, while still also using it as the key.
- The **self-suppressing section pattern** repeated across the folder.

## How to edit it safely

- Objectives are data — edit `strand.objectives` (array of `{ verb, text }`) in
  `src/data/strands.ts`. The grid and numbering follow automatically.
- If objectives ever become reorderable, give `ObjectiveItem` a stable `id` and
  use `key={item.id}` (and decide whether the displayed number should follow
  data order or display order — currently it follows render order via `index`).
- Grid layout lives in
  [`ObjectivesSection.module.css`](./ObjectivesSection.module.css.md); per-card
  look in [`ObjectiveCard.module.css`](./ObjectiveCard.module.css.md); heading
  in [`SectionTitle.module.css`](./SectionTitle.module.css.md).
- Cross-refs: [`ObjectiveCard.tsx`](./ObjectiveCard.tsx.md),
  [`SectionTitle.tsx`](./SectionTitle.tsx.md), parent
  [`StrandDetail.tsx`](../StrandDetail.tsx.md).
