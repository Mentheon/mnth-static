# `src/components/StrandDetail/Sections/AbstractSection.tsx`

## What this file is

The **§01 "Abstract"** section: a heading plus one paragraph of prose (with a
decorative drop-cap on the first letter, done in CSS). It is the simplest of the
three section components and a clean template for the pattern they all share:
*self-suppress when empty, render a [`SectionTitle`](./SectionTitle.tsx.md) +
content*.

## Line-by-line / block walkthrough

```tsx
import SectionTitle from './SectionTitle'
import styles from './AbstractSection.module.css'
```

The shared title component and the paired CSS Module
([`AbstractSection.module.css`](./AbstractSection.module.css.md)).

```tsx
export interface AbstractSectionProps {
  text: string
  sectionNumber?: string
}
```

`text` is the abstract prose; `sectionNumber?` is the optional `"01"` shown as
`§ 01`. The parent always passes `strand.abstract ?? ''` (see
[`StrandDetail.tsx`](../StrandDetail.tsx.md)), so `text` may be an empty string.

```tsx
export default function AbstractSection({ text, sectionNumber }: AbstractSectionProps) {
  if (!text) return null
```

**Self-suppressing empty guard.** `if (!text) return null` — if the abstract is
empty (e.g. `''` from the `?? ''` fallback for strands that have none), the
component renders nothing. This is *why* `StrandDetail` can unconditionally list
all sections: each one removes itself when it has no data. (Same idiom as
[`StrandCTARow`](../CTAs/StrandCTARow.tsx.md),
[`ObjectivesSection`](./ObjectivesSection.tsx.md),
[`ResearchQuestionsSection`](./ResearchQuestionsSection.tsx.md).) Note `!text`
treats `''` as "no abstract."

```tsx
  return (
    <section className={styles.section}>
      <SectionTitle text="Abstract" number={sectionNumber} />
      <p className={styles.body}>{text}</p>
    </section>
  )
}
```

- `<section>` — semantic grouping element for a standalone part of the document.
- `<SectionTitle text="Abstract" number={sectionNumber} />` — **composing the
  shared heading**, passing the fixed label `"Abstract"` and forwarding the
  optional number. The heading's look/behaviour is owned by `SectionTitle`, not
  duplicated here.
- `<p className={styles.body}>{text}</p>` — the prose. The visual drop-cap on
  its first letter is pure CSS (`::first-letter` in the paired module) — the TSX
  stays plain text.

## Libraries & APIs used

- **React**: function component, early `return null` (self-suppress),
  composition of `SectionTitle`.
- **CSS Modules**.
- Semantic HTML: `<section>`, `<p>`.

## Concepts to learn here

- **The self-suppressing section pattern** that keeps the parent
  ([`StrandDetail`](../StrandDetail.tsx.md)) free of conditional includes.
- **Composing a shared sub-component** (`SectionTitle`) rather than re-coding
  the heading.
- Keeping presentation (the drop-cap) in CSS, JSX trivially simple.

## How to edit it safely

- The content is data — edit `strand.abstract` in `src/data/strands.ts`. The
  `?? ''` in [`StrandDetail.tsx`](../StrandDetail.tsx.md) plus the `if (!text)`
  guard here means a missing abstract simply omits §01; don't remove the guard.
- To restyle the prose/drop-cap, edit
  [`AbstractSection.module.css`](./AbstractSection.module.css.md). To restyle
  the heading, edit [`SectionTitle`](./SectionTitle.module.css.md) (shared by
  all sections).
- Mirror this exact structure if you add a new prose section (see the recipe in
  [`StrandDetail.tsx`](../StrandDetail.tsx.md)'s doc).
- Cross-refs: [`SectionTitle.tsx`](./SectionTitle.tsx.md),
  [`AbstractSection.module.css`](./AbstractSection.module.css.md), parent
  [`StrandDetail.tsx`](../StrandDetail.tsx.md).
