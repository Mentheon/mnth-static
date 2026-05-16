# `src/components/StrandDetail/Sections/ObjectivesSection.module.css`

## What this file is

The **CSS Module** paired with
[`ObjectivesSection.tsx`](./ObjectivesSection.tsx.md). Two rules: the standard
section spacing, and a **responsive auto-fitting CSS Grid** for the objective
cards. This is the cleanest example in the folder of grid auto-placement.

## Line-by-line / block walkthrough

```css
.section { margin-bottom: 3.5rem; }
```

The same `3.5rem` bottom margin as the other section modules — consistent
vertical rhythm across §01/§02/§03.

```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
}
```

The card grid. The single powerful line is
`grid-template-columns: repeat(auto-fit, minmax(260px, 1fr))`. Unpacking it:

- `minmax(260px, 1fr)` — each column is **at least 260px** and **at most 1
  fraction** of the free space. So cards never get narrower than 260px, but
  stretch to share leftover width evenly.
- `repeat(auto-fit, …)` — create **as many such columns as fit** on the current
  row, automatically. The browser computes the column count from the container
  width: wide screens get many columns, narrow screens collapse to fewer (down
  to one).
- `gap: 1rem` — uniform spacing between cards in both directions.

The result is a **fully responsive grid with no media queries**: add more
objectives in the data and they flow into new rows; resize the window and the
column count adapts on its own. This `repeat(auto-fit, minmax(...))` idiom is one
of the most useful patterns in modern CSS layout and is reused (with a different
min width) in
[`ResearchQuestionsSection.module.css`](./ResearchQuestionsSection.module.css.md).

## Libraries & APIs used

- Plain CSS as a **CSS Module**: CSS Grid, `repeat()`, `auto-fit`, `minmax()`,
  `1fr`, `gap`.

## Concepts to learn here

- **`repeat(auto-fit, minmax(min, 1fr))`** — responsive multi-column grid with
  zero media queries. Internalise this pattern; it solves a huge fraction of
  layout needs.
- **`minmax` and `fr`**: floor the column width, let it grow by fraction.
- **Consistent section spacing** across the folder.

## How to edit it safely

- Change the minimum card width by editing the `260px` in `minmax`. Larger min
  → fewer columns at a given width; smaller min → more, narrower columns.
- Use `auto-fill` instead of `auto-fit` if you want empty column tracks to be
  preserved (with `auto-fit`, leftover tracks collapse and existing cards
  stretch). Current behaviour (stretch to fill) is usually what you want here.
- The card's own appearance/hover is in
  [`ObjectiveCard.module.css`](./ObjectiveCard.module.css.md), not here — edit
  spacing/columns here, card visuals there.
- Cross-refs: [`ObjectivesSection.tsx`](./ObjectivesSection.tsx.md);
  same grid idiom in
  [`ResearchQuestionsSection.module.css`](./ResearchQuestionsSection.module.css.md).
