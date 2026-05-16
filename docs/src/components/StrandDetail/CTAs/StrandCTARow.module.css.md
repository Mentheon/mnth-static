# `src/components/StrandDetail/CTAs/StrandCTARow.module.css`

## What this file is

A one-rule **CSS Module** paired with
[`StrandCTARow.tsx`](./StrandCTARow.tsx.md). It only lays out the row of buttons;
the buttons style themselves via
[`CTAButton.module.css`](./CTAButton.module.css.md). Small as it is, it is a
clean example of separating *layout* (the row) from *item appearance* (the
button).

## Line-by-line / block walkthrough

```css
.row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 1rem;
}
```

- `display: flex` — the children (`CTAButton`s) lay out in a horizontal row.
- `gap: 1rem` — consistent 1rem spacing **between** items, with no leading or
  trailing margin (a key advantage of Flexbox `gap` over per-item margins).
- `flex-wrap: wrap` — if the buttons do not fit the available width, they wrap
  onto the next line instead of overflowing. This is the simplest form of
  responsiveness: no media query needed, the layout adapts to whatever space it
  has and to however many CTAs the data contains.
- `margin-top: 1rem` — separates the row from the section above it.

## Libraries & APIs used

- Plain CSS as a **CSS Module**: Flexbox (`display:flex`, `gap`, `flex-wrap`).

## Concepts to learn here

- **Flexbox `gap` + `flex-wrap`** for a self-adapting row — responsive with zero
  media queries.
- **Layout/appearance separation**: a container module that knows nothing about
  button colours, and a button module that knows nothing about row spacing.

## How to edit it safely

- To change spacing between buttons, edit `gap` here — not margins on
  `CTAButton`.
- Want the buttons right-aligned or centred? Add `justify-content: flex-end` /
  `center` here.
- Do not add button colour/padding rules here; those belong in
  [`CTAButton.module.css`](./CTAButton.module.css.md).
- Cross-reference: the `.row` class is consumed in
  [`StrandCTARow.tsx`](./StrandCTARow.tsx.md).
