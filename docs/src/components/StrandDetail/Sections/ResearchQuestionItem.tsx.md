# `src/components/StrandDetail/Sections/ResearchQuestionItem.tsx`

## What this file is

A single **research-question list item**: an `RQ1`-style badge next to the
question text, rendered as an `<li>` inside the section's `<ol>`. It is the leaf
for [`ResearchQuestionsSection`](./ResearchQuestionsSection.tsx.md) — the
string-array analogue of [`ObjectiveCard`](./ObjectiveCard.tsx.md).

## Line-by-line / block walkthrough

```tsx
import styles from './ResearchQuestionItem.module.css'
```

Only the paired CSS Module
([`ResearchQuestionItem.module.css`](./ResearchQuestionItem.module.css.md)). No
data-type import — it takes a plain `string`.

```tsx
export interface ResearchQuestionItemProps {
  text: string
  index: number
}
```

`text` is the question; `index` its 0-based position, passed by the parent so
the item can label itself.

```tsx
export default function ResearchQuestionItem({ text, index }: ResearchQuestionItemProps) {
  return (
    <li className={styles.item}>
      <span className={styles.num}>{`RQ${index + 1}`}</span>
      <p className={styles.text}>{text}</p>
    </li>
  )
}
```

- `<li>` — a list item, semantically correct because the parent renders an
  `<ol>`. (An `<li>` must be a child of `<ol>`/`<ul>`; the structure here is
  valid.)
- `<span className={styles.num}>{`RQ${index + 1}`}</span>` — the badge. Unlike
  [`ObjectiveCard`](./ObjectiveCard.tsx.md) (which stashed its number in a
  `data-` attribute and rendered it via CSS `attr()`), this one renders the
  label **directly as visible text** via a template literal: `index` is 0-based
  so `index + 1` gives `RQ1, RQ2, …`. No zero-padding here — `RQ1` not `RQ01`.
  Comparing the two approaches (text node vs `data-attr` + CSS `content`) is a
  good study in two valid ways to display a derived label.
- `<p className={styles.text}>{text}</p>` — the question prose.

Minimal markup; the left accent bar and badge positioning are CSS.

## Libraries & APIs used

- **React**: function component, template literal in JSX.
- **CSS Modules**.
- Semantic HTML: `<li>` (within the parent `<ol>`).

## Concepts to learn here

- **Rendering a derived label as a text node** — the simpler sibling of the
  `data-attr` + CSS `attr()` approach in
  [`ObjectiveCard`](./ObjectiveCard.tsx.md). Both are valid; this is the
  straightforward default.
- **`<li>` only valid inside `<ol>`/`<ul>`** — leaf and container components
  must agree on the HTML structure they jointly produce.

## How to edit it safely

- Questions are data — edit `strand.researchQuestions` (`string[]`) in
  `src/data/strands.ts`. Numbering follows array order via `index`.
- If you change the badge format (e.g. zero-pad to `RQ01`), do it here in the
  template literal (`` `RQ${String(index + 1).padStart(2, '0')}` ``).
- Keep this an `<li>` — it relies on the parent's `<ol>` for valid, accessible
  list structure.
- Visual styling (accent bar, badge placement, hover) lives in
  [`ResearchQuestionItem.module.css`](./ResearchQuestionItem.module.css.md).
- Cross-refs: [`ResearchQuestionsSection.tsx`](./ResearchQuestionsSection.tsx.md),
  [`ResearchQuestionItem.module.css`](./ResearchQuestionItem.module.css.md);
  compare numbering approach with [`ObjectiveCard.tsx`](./ObjectiveCard.tsx.md).
