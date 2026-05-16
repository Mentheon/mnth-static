# `src/components/StrandDetail/Sections/SectionTitle.tsx`

## What this file is

A tiny **shared heading component** used by all three content sections
(Abstract, Objectives, Research questions). It renders the section's name plus
an optional right-aligned section number like `§ 01`. Factoring this out means
every section heading looks and behaves identically — change it once, change it
everywhere.

## Line-by-line / block walkthrough

```tsx
import styles from './SectionTitle.module.css'
```

Only the paired CSS Module
([`SectionTitle.module.css`](./SectionTitle.module.css.md)). No data import — it
takes plain strings, making it reusable for any heading.

```tsx
export interface SectionTitleProps {
  text: string
  number?: string
}
```

`text` is the heading; `number?` is **optional** — a section may omit its
number.

```tsx
export default function SectionTitle({ text, number }: SectionTitleProps) {
  return (
    <h2 className={styles.title}>
      {text}
      {number && <span className={styles.num}>{`§ ${number}`}</span>}
    </h2>
  )
}
```

- `<h2>` — the correct heading level: the page's `<h1>` is the strand name in
  the header, sections are one level down. Consistent heading hierarchy matters
  for accessibility and document outline.
- `{text}` renders the heading text.
- `{number && <span>…</span>}` — `&&` conditional rendering: only show the
  number span when `number` is provided. The template literal `` `§ ${number}` ``
  builds the displayed string (the `§` "section sign" is just a literal
  character prefixed to the value, so callers pass `"01"`, not `"§ 01"`).

The component is pure props→markup with one conditional — small, single-purpose,
reused three times.

## Libraries & APIs used

- **React**: function component, `&&` conditional rendering, template literal.
- **CSS Modules**.
- Semantic HTML: `<h2>`.

## Concepts to learn here

- **Extracting a shared sub-component** to enforce consistency and DRY
  (Don't Repeat Yourself) across sibling sections.
- **Optional props with `&&`** for "render this extra bit only if provided."
- **Heading hierarchy** (`<h1>` page title → `<h2>` sections).

## How to edit it safely

- The `§` prefix is added here; callers in
  [`StrandDetail.tsx`](../StrandDetail.tsx.md) pass plain `"01"/"02"/"03"`. If
  you want a different prefix (or none), change it here once.
- Keep it data-agnostic (plain `string` props) so it stays reusable; section
  *content* lives in the individual section components.
- Visual styling (the tick before the title, the number's faint colour and
  right alignment) is in
  [`SectionTitle.module.css`](./SectionTitle.module.css.md).
- Cross-refs: used by [`AbstractSection`](./AbstractSection.tsx.md),
  [`ObjectivesSection`](./ObjectivesSection.tsx.md),
  [`ResearchQuestionsSection`](./ResearchQuestionsSection.tsx.md); styled by
  [`SectionTitle.module.css`](./SectionTitle.module.css.md).
