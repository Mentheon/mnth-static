# `src/components/StrandDetail/Sections/ResearchQuestionsSection.tsx`

## What this file is

The **§03 "Research questions"** section: a heading plus an ordered list of
[`ResearchQuestionItem`](./ResearchQuestionItem.tsx.md)s. Structurally the twin
of [`ObjectivesSection`](./ObjectivesSection.tsx.md), but its items are plain
strings (not objects) and it uses a semantic `<ol>`.

## Line-by-line / block walkthrough

```tsx
import SectionTitle from './SectionTitle'
import ResearchQuestionItem from './ResearchQuestionItem'
import styles from './ResearchQuestionsSection.module.css'
```

The shared title, the leaf item, and the paired CSS Module. **No data-type
import** here — the questions are just `string[]`, so there is no interface to
pull from `src/data/strands.ts`.

```tsx
export interface ResearchQuestionsSectionProps {
  items: string[]
  sectionNumber?: string
}
```

`items` is an **array of strings** (each a question); `sectionNumber?` the
optional `"03"`. The parent passes `strand.researchQuestions ?? []`.

```tsx
export default function ResearchQuestionsSection({
  items,
  sectionNumber,
}: ResearchQuestionsSectionProps) {
  if (items.length === 0) return null
```

The familiar **self-suppressing empty guard** — no questions → render nothing.

```tsx
  return (
    <section className={styles.section}>
      <SectionTitle text="Research questions" number={sectionNumber} />
      <ol className={styles.list}>
        {items.map((q, i) => (
          <ResearchQuestionItem key={i} text={q} index={i} />
        ))}
      </ol>
    </section>
  )
}
```

- Composes `<SectionTitle>` with the label `"Research questions"`.
- **`<ol>`** (ordered list) is the semantically correct element for a numbered
  sequence of questions — better than a `<div>` of `<div>`s. The CSS removes the
  default list markers (the items render their own `RQ1`, `RQ2` badges), but the
  *semantics* of "this is an ordered list" remain for assistive tech.
- `{items.map((q, i) => <ResearchQuestionItem key={i} text={q} index={i} />)}` —
  list rendering. `q` is the question string; `index={i}` is passed so the item
  can label itself `RQ1`, `RQ2`, … Index keys are fine here (static,
  non-reordered data — same reasoning as the other lists in the folder).

## Libraries & APIs used

- **React**: function component, early `return null`, `.map` + `key`,
  composition.
- **CSS Modules**.
- Semantic HTML: `<section>`, **`<ol>`** (ordered list) + `<li>` (in the item).

## Concepts to learn here

- **Choosing the right semantic element**: `<ol>` for an inherently ordered
  list, even when default markers are styled away.
- **String-array data** (vs object-array) — sometimes the simplest shape is
  enough; no interface needed.
- The repeated **self-suppressing section** + **container/leaf** patterns,
  mirroring [`ObjectivesSection`](./ObjectivesSection.tsx.md).

## How to edit it safely

- Questions are data — edit `strand.researchQuestions` (a `string[]`) in
  `src/data/strands.ts`. The `RQ` numbering follows array order via `index`.
- If a question ever needs more than text (e.g. a sub-note), change `items` to
  an object array and update the type + [`ResearchQuestionItem`](./ResearchQuestionItem.tsx.md)
  accordingly (mirror how [`ObjectiveCard`](./ObjectiveCard.tsx.md) takes an
  object).
- Keep the `<ol>` — switching to `<ul>`/`<div>` loses the ordered semantics.
- List layout in
  [`ResearchQuestionsSection.module.css`](./ResearchQuestionsSection.module.css.md);
  item look in
  [`ResearchQuestionItem.module.css`](./ResearchQuestionItem.module.css.md);
  heading in [`SectionTitle.module.css`](./SectionTitle.module.css.md).
- Cross-refs: [`ResearchQuestionItem.tsx`](./ResearchQuestionItem.tsx.md),
  [`SectionTitle.tsx`](./SectionTitle.tsx.md), parent
  [`StrandDetail.tsx`](../StrandDetail.tsx.md).
