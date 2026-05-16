# `src/components/Marginalia/List/MarginaliaList.module.css`

## What this file is

The **scoped stylesheet** for the list/index view,
[`MarginaliaList.tsx`](./MarginaliaList.tsx.md). It styles the framed
page, the header (kicker / title / tagline), the **responsive article
grid**, and the empty-state message. The most instructive part is the
auto-responsive CSS Grid.

It deliberately shares the *same* page/frame/corner-crop idiom as the
detail view's
[`MarginaliaArticle.module.css`](../Detail/MarginaliaArticle.module.css.md),
so the two pages feel like one design system.

## Line-by-line / block walkthrough

```css
.page {
  max-width: 1280px;
  margin: 1.5rem auto 5rem;
  padding: 1.75rem 3rem 0;
  position: relative;
}
.frame {
  position: relative;
  background: var(--bg);
  border: 2px solid var(--ink);
  padding: 3rem 3rem 3.5rem;
}
```

`.page` is the centred `<main>` (max-width + `auto` side margins).
`.frame` is the bordered `<article>`; `position: relative` anchors the
corner-crop spans. These match the detail view's equivalents — a shared
visual frame.

```css
.cornerCrop { position: absolute; width: 28px; height: 28px; pointer-events: none; }
.cornerTL { top: -14px; left: -14px;  border-top: 3px solid var(--crimson); border-left: 3px solid var(--crimson); }
.cornerTR { ... }  .cornerBL { ... }  .cornerBR { ... }
```

The identical **base + modifier** corner-crop pattern explained in
[`MarginaliaArticle.module.css.md`](../Detail/MarginaliaArticle.module.css.md):
a shared `.cornerCrop` (size, absolute position, click-through) plus a
per-corner modifier (offset + which two borders form the L-bracket).
`-14px` = half of `28px` keeps the bracket centred on the frame corner.

```css
.header {
  margin: 0 0 2.5rem;
  border-bottom: 1px solid var(--ink-soft, rgba(47, 1, 71, 0.15));
  padding-bottom: 2rem;
}
.kicker {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem; font-weight: 700;
  letter-spacing: 0.22em; text-transform: uppercase;
  color: var(--crimson); margin: 0 0 0.85rem;
}
.title {
  font-family: 'Lato', sans-serif; font-weight: 900;
  font-size: clamp(2.4rem, 5vw, 4rem);
  line-height: 1.05; letter-spacing: -0.015em;
  color: var(--ink); margin: 0 0 0.6rem;
}
.tagline {
  font-family: 'Lato', sans-serif; font-style: italic;
  font-size: 1.1rem; color: var(--ink);
  opacity: 0.7; max-width: 65ch; margin: 0;
}
```

Header typography, matching the detail page's vocabulary:

- `.kicker` — the mono uppercase eyebrow ("label" treatment), crimson.
- `.title` — fluid `clamp(2.4rem, 5vw, 4rem)`: scales with viewport
  width but clamped between a phone-readable min and a sane max — fluid
  typography with no media query. (See
  [`MarginaliaArticle.module.css.md`](../Detail/MarginaliaArticle.module.css.md)
  for the full `clamp` explanation.)
- `.tagline` — italic, dimmed (`opacity: 0.7`), measure-capped at
  `65ch`.

```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
}
```

The centrepiece: a **self-responsive CSS Grid** with no media query for
the columns.

- `display: grid` — make this a grid container; its direct children
  (the `ArticleCard` anchors) become grid items.
- `grid-template-columns: repeat(auto-fit, minmax(320px, 1fr))` — read
  it inside-out:
  - `minmax(320px, 1fr)` — each column is *at least* 320px wide but may
    grow up to `1fr` (one share of the leftover free space).
  - `repeat(auto-fit, ...)` — create *as many* such columns as fit on
    the current row. As the viewport widens, more 320px+ columns appear;
    as it narrows, columns drop off and the rest stretch via `1fr`.
- `gap: 1.5rem` — uniform gutter between rows and columns (no margins
  needed).

Net effect: the card grid reflows from 1 → 2 → 3 → … columns purely
from the available width. This is the modern, media-query-free
responsive layout idiom and is worth internalising.

```css
.empty {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  color: var(--ink-quiet);
  text-align: center;
  padding: 2rem 0;
}
```

The empty-state `<p>` (shown when the filter yields no articles) —
centred, quiet, mono.

```css
@media (max-width: 880px) {
  .page { padding-left: 1.25rem; padding-right: 1.25rem; }
  .frame { padding: 2rem 1.5rem 2.5rem; }
  .grid { grid-template-columns: 1fr; gap: 1rem; }
}
@media (max-width: 480px) {
  .page { padding-left: 0.75rem; padding-right: 0.75rem; margin-top: 0.75rem; margin-bottom: 2.5rem; }
  .frame { padding: 1.5rem 1rem 2rem; }
}
```

**Media queries** for small screens (desktop-first overriding *down*):

- At ≤880px the grid is forced to a single column
  (`grid-template-columns: 1fr`) — below tablet, the auto-fit math could
  still try 320px columns with cramped gutters, so this is an explicit,
  cleaner override. Gutters tighten too.
- At ≤480px ("phone class") gutters tighten further and vertical margins
  shrink to use phone screen real estate well, preventing horizontal
  scroll at ~360px.

The 880px / 480px breakpoints are the **shared convention** across all
Marginalia stylesheets — keep them aligned with the detail view.

## Libraries & APIs used

- **Plain CSS** as a **CSS Module**.
- **CSS Grid** (`display: grid`, `grid-template-columns`, `repeat`,
  `auto-fit`, `minmax`, `gap`).
- **CSS variables with fallbacks**, **`clamp()`**, **`vw`/`ch`/`rem`**,
  **media queries**.

## Concepts to learn here

- **Auto-responsive grid** with
  `repeat(auto-fit, minmax(MIN, 1fr))` — the single most useful CSS
  Grid pattern; reflows columns without a media query.
- **`fr` (fraction) unit** and **`minmax()`** for flexible column
  sizing.
- **`gap`** for grid/flex gutters instead of child margins.
- **Fluid type** via `clamp()` + `vw`, line-length caps via `ch`.
- **Desktop-first responsive overriding** with stacked `max-width`
  media queries, and *why* the grid is hard-pinned to one column on
  small screens.
- **Design-system consistency**: deliberately mirroring the detail
  view's frame/corner/header rules.

## How to edit it safely

- **Change card columns / minimum card width**: tweak the `320px` in
  `minmax(320px, 1fr)` (smaller → more, narrower columns). Re-check the
  ≤880px single-column override still makes sense for the new minimum.
- **Change gutters**: edit `gap` (and the per-breakpoint `gap`
  overrides).
- **Restyle the empty state**: edit `.empty` (the message text itself
  lives in [`MarginaliaList.tsx`](./MarginaliaList.tsx.md), not here).
- **Class renames**: must be mirrored in
  [`MarginaliaList.tsx`](./MarginaliaList.tsx.md) — a mismatch silently
  drops styling.
- **Card-internal styling** is *not* here — see
  [`ArticleCard.module.css`](./ArticleCard.module.css.md). The grid only
  controls *placement* of cards, not their interior.
- **Gotcha**: keep the 880px/480px breakpoints consistent with
  [`MarginaliaArticle.module.css`](../Detail/MarginaliaArticle.module.css.md)
  and the other Marginalia stylesheets, or list and detail pages will
  break to mobile at different widths and look inconsistent.
- **Gotcha**: the `-14px` corner offsets are coupled to the `28px`
  size; change one, recompute the other.
- Paired file: [`MarginaliaList.tsx`](./MarginaliaList.tsx.md).
