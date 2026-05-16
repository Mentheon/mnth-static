# `src/components/Marginalia/shared/ArticleMeta.module.css`

## What this file is

The **scoped stylesheet** for the shared meta line,
[`ArticleMeta.tsx`](./ArticleMeta.tsx.md). It provides two layouts — one
per `variant` — plus the date/author/dot text styling. Small, but a
clean illustration of how a `variant` prop maps to a `variant` CSS
class.

## Line-by-line / block walkthrough

```css
.cardRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}
```

The **`variant="card"`** layout (used in
[`List/ArticleCard.tsx`](../List/ArticleCard.tsx.md)).

- `display: flex; align-items: center` — date and type-chip on one
  vertically-centred row.
- `justify-content: space-between` — the key rule: pushes the two
  children to **opposite ends** of the row (date hard-left, type chip
  hard-right), with the free space placed *between* them. This is the
  canonical flex idiom for "one thing left, one thing right".
- `gap: 0.75rem` — a minimum spacing safeguard if the row ever gets
  tight (prevents the two items touching even though `space-between`
  normally separates them).

```css
.detailRow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  color: var(--ink-quiet);
  margin: 0 0 1.2rem;
}
```

The **`variant="detail"`** layout (used in
[`Detail/MarginaliaArticle.tsx`](../Detail/MarginaliaArticle.tsx.md)).

- `display: flex; align-items: center` with `gap: 0.6rem` — chip · date
  · author flow left-to-right on one row, evenly spaced.
- `flex-wrap: wrap` — on a narrow screen the row can wrap to a second
  line instead of overflowing (responsive without a media query).
- The mono / small / wide-tracking / quiet treatment is the site's
  inline-metadata style; setting it on the *row* lets the children
  inherit it.

These two rules are the CSS counterpart of the component's
`if (variant === 'card')` branch: each variant returns a `<div>` with
the matching class, and the differing layout lives entirely here.

```css
.date {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  color: var(--ink-quiet);
}
.author {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  color: var(--ink-quiet);
}
```

Date and author text: identical mono, small, quiet styling. They are
kept as separate (duplicated) rules rather than a grouped
`.date, .author` selector — slightly more verbose but lets either be
tuned independently later. (A grouped selector would be a fine
refactor; both approaches are valid.)

```css
.dot {
  opacity: 0.4;
  color: var(--ink-quiet);
}
```

The `·` separator spans (only in the detail row) — faint and quiet so
they punctuate without competing with the actual text. (They are
`aria-hidden` in the TSX, so this is purely visual.)

## Libraries & APIs used

- **Plain CSS** as a **CSS Module**.
- **Flexbox** (`display: flex`, `align-items`, `justify-content:
  space-between`, `flex-wrap`, `gap`).
- **CSS variables** (`--ink-quiet`).

## Concepts to learn here

- **`justify-content: space-between`** — the standard "left item + right
  item" flex layout (the card row).
- **One component, two layout classes** keyed by a `variant` prop — the
  CSS half of the variant pattern (the JS half is in
  [`ArticleMeta.tsx`](./ArticleMeta.tsx.md)).
- **`flex-wrap: wrap`** for graceful narrow-screen behaviour without a
  media query.
- **Styling a flex container so children inherit** shared typography
  (set font/colour on `.detailRow`, not each child).
- Trade-off between **grouped selectors vs duplicated rules**
  (`.date`/`.author`).

## How to edit it safely

- **Tweak a single layout**: edit `.cardRow` (card) or `.detailRow`
  (detail) — they are independent, so changing one cannot affect the
  other view.
- **Add a new variant**: add the corresponding `variant` literal and
  branch in [`ArticleMeta.tsx`](./ArticleMeta.tsx.md), then add a new
  layout class here. Keep the class name identical to the `styles.*`
  reference in the TSX.
- **Recolour metadata**: prefer adjusting the `--ink-quiet` token
  (defined globally) so all quiet text stays consistent, rather than
  hard-coding a colour here.
- **Class renames** must mirror
  [`ArticleMeta.tsx`](./ArticleMeta.tsx.md) — CSS Modules silently
  produce an unstyled element on a name mismatch.
- **Gotcha**: the type-chip's own colours/shape are *not* here — that's
  [`TypeChip.module.css`](./TypeChip.module.css.md). This file only
  positions the chip within the row.
- Paired file: [`ArticleMeta.tsx`](./ArticleMeta.tsx.md).
