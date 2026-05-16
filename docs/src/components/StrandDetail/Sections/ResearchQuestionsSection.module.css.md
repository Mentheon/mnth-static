# `src/components/StrandDetail/Sections/ResearchQuestionsSection.module.css`

## What this file is

The **CSS Module** paired with
[`ResearchQuestionsSection.tsx`](./ResearchQuestionsSection.tsx.md). It keeps the
shared section spacing and turns the semantic `<ol>` into an unmarked,
responsive grid of question cards.

## Line-by-line / block walkthrough

```css
.section { margin-bottom: 3.5rem; }
```

Same `3.5rem` rhythm as the other section modules.

```css
.list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.25rem;
}
```

This styles the `<ol>`:

- `list-style: none; padding: 0; margin: 0` — the **list reset**. Browsers give
  `<ol>` default numbers, left padding, and vertical margin. We strip all of
  that because each item renders its own `RQ1`/`RQ2` badge and we want grid
  layout, *not* the default numbered-list look. Important: we keep the element
  an `<ol>` for semantics (see the TSX doc) and only remove its *visual*
  defaults here — semantics and presentation are separate concerns.
- `display: grid` with `grid-template-columns: repeat(auto-fit, minmax(320px,
  1fr))` — the **same responsive auto-grid idiom** as
  [`ObjectivesSection.module.css`](./ObjectivesSection.module.css.md), but with
  a larger `320px` minimum (questions are longer than objective verbs, so they
  want wider columns / fewer per row). As many ≥320px columns as fit, stretching
  to fill; collapses to one column on narrow screens; no media queries.
- `gap: 1.25rem` — spacing between question cards.

## Libraries & APIs used

- Plain CSS as a **CSS Module**: list reset (`list-style/padding/margin`), CSS
  Grid `repeat(auto-fit, minmax(...))`, `gap`.

## Concepts to learn here

- **List reset**: removing a list's default chrome while *keeping* its semantic
  element — separating semantics from presentation.
- **Reusing the `repeat(auto-fit, minmax(min, 1fr))` grid** with a tuned `min`
  to suit content width (320px here vs 260px for objectives).
- Consistent section spacing across the folder.

## How to edit it safely

- Adjust the `320px` minimum to change how many questions sit per row.
- Keep the list reset if you keep the `<ol>` (and you should, for semantics) —
  without it you'd get stray default numbers/indentation fighting the grid.
- Item appearance (the left accent bar, the `RQ` badge, hover) is in
  [`ResearchQuestionItem.module.css`](./ResearchQuestionItem.module.css.md), not
  here.
- Cross-refs: [`ResearchQuestionsSection.tsx`](./ResearchQuestionsSection.tsx.md);
  the grid idiom matches
  [`ObjectivesSection.module.css`](./ObjectivesSection.module.css.md).
