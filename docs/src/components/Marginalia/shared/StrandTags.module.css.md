# `src/components/Marginalia/shared/StrandTags.module.css`

## What this file is

The **scoped stylesheet** for the strand-tag pills,
[`StrandTags.tsx`](./StrandTags.tsx.md). It styles the inline pill row,
the base "grape" pill, and a `detail`-only interactive (hover) variant.

## Line-by-line / block walkthrough

```css
/* StrandTags — small grape pills indicating strand affiliation. */
```

Intent comment.

```css
.row {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  align-items: center;
}
```

The wrapper `<span>`.

- `display: inline-flex` — a flex container that still flows **inline**
  (so the pill row can sit within a meta line / header without forcing a
  block break). `inline-flex` = flexbox layout for the children, inline
  behaviour for the box itself.
- `flex-wrap: wrap` — multiple tags wrap to the next line on narrow
  widths instead of overflowing (responsive, no media query).
- `gap: 0.35rem` — small even spacing between pills.
- `align-items: center` — vertically centres pills against adjacent
  text.

```css
.tag {
  display: inline-block;
  padding: 0.18rem 0.55rem;
  border-radius: 999px;
  background: rgba(156, 82, 139, 0.15);  /* grape @ 15% — soft pill */
  color: var(--grape);
  font-family: 'Lato', sans-serif;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  line-height: 1;
  text-decoration: none;
  transition: background 0.18s ease, color 0.18s ease;
}
```

The base pill (applied to both the `<span>` and `<a>` forms — the
component composes `styles.tag` for every variant).

- `display: inline-block` — lets the pill take padding/size while
  flowing inline.
- `border-radius: 999px` — the pill idiom: an over-large radius clamps to
  a perfect capsule of whatever height the content produces.
- `background: rgba(156, 82, 139, 0.15)` — the "grape" brand colour at
  15% alpha for a soft tinted fill. The inline comment documents the
  literal (it's a faded version of `--grape`, which is also used for the
  text colour). Using an explicit `rgba` here (rather than a token) is
  acceptable because it's a one-off translucent tint; the comment keeps
  it legible.
- `color: var(--grape)` — solid grape text on the faded grape fill.
- `text-decoration: none` — needed because in the `detail` variant the
  pill is an `<a>`; this strips the default link underline so it still
  reads as a pill.
- `transition: background, color (0.18s)` — declared on the base so the
  hover (defined next) animates smoothly. Harmless on the `<span>`
  variant (it just never changes).

```css
.tagDetail {
  cursor: pointer;
}
.tagDetail:hover {
  background: var(--crimson);
  color: var(--bg);
}
```

The **detail-only modifier**. The component adds `styles.tagDetail`
*only* when `variant === 'detail'` (where the pill is a clickable
filter link):

- `cursor: pointer` — signals it's interactive.
- `:hover` — flips to a filled crimson pill with cream (`--bg`) text,
  smoothly (thanks to the base `transition`). This hover affordance is
  deliberately **absent on the `card` variant** (which has no
  `.tagDetail`), because there the pill is inert text inside the
  card-wide link — a hover effect would wrongly imply it's separately
  clickable.

This is a clean example of the **base class + optional modifier class**
pattern matching a component `variant`: shared look in `.tag`,
behaviour-specific affordance in `.tagDetail`.

## Libraries & APIs used

- **Plain CSS** as a **CSS Module**.
- **Flexbox** (`inline-flex`, `flex-wrap`, `gap`, `align-items`).
- **CSS transitions**, **pseudo-classes** (`:hover`).
- **CSS variables** (`--grape`, `--crimson`, `--bg`) plus a documented
  literal `rgba`.

## Concepts to learn here

- **`inline-flex`** — flex layout inside an inline-flowing box (for pill
  rows embedded in text/meta lines).
- **The pill idiom** (`border-radius: 999px`).
- **Base + optional modifier class** (`.tag` always, `.tagDetail` only
  for the interactive variant) — the CSS counterpart of the component's
  `variant`.
- **Why interactivity affordances must match behaviour**: hover only
  where the element is actually a link, never on the inert card variant.
- **Translucent tint via `rgba(..., 0.15)`** and documenting one-off
  literals with a comment.
- **Declaring `transition` on the base rule** so state changes animate.

## How to edit it safely

- **Recolour pills**: adjust the `rgba(156, 82, 139, 0.15)` fill and/or
  `color: var(--grape)`. If you change `--grape` globally, update the
  literal's comment so it stays accurate (or switch the literal to a
  token if the project later adds a translucent grape variable).
- **Change the detail hover**: edit `.tagDetail:hover`. Do **not** move
  hover styling onto `.tag` — that would (incorrectly) make the inert
  card-variant pills appear interactive.
- **Spacing/wrap behaviour**: tweak `.row`'s `gap`; keep
  `flex-wrap: wrap` so many tags don't overflow on mobile.
- **Class renames** must mirror
  [`StrandTags.tsx`](./StrandTags.tsx.md) (CSS Modules fail silently on
  mismatch).
- **Gotcha**: the component decides *when* `.tagDetail` is applied (only
  for `variant="detail"`). To change which contexts get the interactive
  style, edit [`StrandTags.tsx`](./StrandTags.tsx.md), not this file.
- Paired file: [`StrandTags.tsx`](./StrandTags.tsx.md).
