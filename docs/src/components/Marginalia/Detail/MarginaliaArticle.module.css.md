# `src/components/Marginalia/Detail/MarginaliaArticle.module.css`

## What this file is

The **scoped stylesheet** for the article detail page,
[`MarginaliaArticle.tsx`](./MarginaliaArticle.tsx.md). It styles the
breadcrumb, the framed article box with its decorative corner crops, the
header (title/tagline/tags), and the footer back-link. Article **body**
typography lives in a *separate* file
([`ArticleBody.module.css`](./ArticleBody.module.css.md)) because that
content is injected HTML and needs special handling.

This is a CSS Module: class names are hashed at build time and reached
from the component via `styles.<name>`. (See
[`Marginalia.module.css.md`](../Marginalia.module.css.md) for a fuller
explanation of CSS Modules if this is new.)

## Line-by-line / block walkthrough

```css
.breadcrumb {
  max-width: 1280px;
  margin: 0 auto;
  padding: 1.75rem 3rem 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-quiet, rgba(47, 1, 71, 0.55));
}
```

The `marginalia / slug` trail.

- `max-width: 1280px; margin: 0 auto;` — the centring idiom (fixed max
  width, auto horizontal margins) so the breadcrumb aligns with the
  article frame below.
- `padding: 1.75rem 3rem 0` — top/sides/bottom = 1.75rem / 3rem / 0.
- The mono + uppercase + wide-tracking treatment is the site's "label"
  style.
- `var(--ink-quiet, rgba(47, 1, 71, 0.55))` — CSS variable with a
  fallback (ink at 55% alpha) — a muted text colour.

```css
.breadcrumb a {
  color: var(--ink);
  text-decoration: none;
  opacity: 0.7;
  transition: color 0.15s, opacity 0.15s;
}
.breadcrumb a:hover {
  opacity: 1;
  color: var(--crimson);
}
```

`.breadcrumb a` is a **descendant selector**: it targets any `<a>`
*inside* an element with the breadcrumb class. The link sits at 70%
opacity normally; on `:hover` it brightens to full and turns crimson,
animated via the `transition`. This hover-feedback pattern recurs across
Marginalia.

```css
.sep {
  padding: 0 0.6em;
  opacity: 0.4;
}
```

The `/` separator span — quiet (40% opacity) with horizontal breathing
room in `em` (scales with its own font size).

```css
.page {
  max-width: 1280px;
  margin: 1.5rem auto 5rem;
  padding: 0 3rem;
  position: relative;
}
```

The `<main>` wrapper. Centred like the breadcrumb (same `max-width` so
they align). `position: relative` makes it the positioning context for
absolutely-positioned descendants.

```css
.frame {
  position: relative;
  background: var(--bg);
  border: 2px solid var(--ink);
  padding: 3rem 3rem 3.5rem;
}
```

The bordered `<article>` box. `position: relative` here is the anchor
for the corner-crop marks, which are positioned *relative to this box*.

```css
.cornerCrop {
  position: absolute;
  width: 28px;
  height: 28px;
  pointer-events: none;
}

.cornerTL { top: -14px; left: -14px;   border-top:    3px solid var(--crimson); border-left:  3px solid var(--crimson); }
.cornerTR { top: -14px; right: -14px;  border-top:    3px solid var(--crimson); border-right: 3px solid var(--crimson); }
.cornerBL { bottom: -14px; left: -14px;  border-bottom: 3px solid var(--crimson); border-left:  3px solid var(--crimson); }
.cornerBR { bottom: -14px; right: -14px; border-bottom: 3px solid var(--crimson); border-right: 3px solid var(--crimson); }
```

This is the **base-class + modifier-class** pattern, mirrored by the
JSX which writes `className={`${styles.cornerCrop} ${styles.cornerTL}`}`.

- `.cornerCrop` is the shared base: `position: absolute` (positioned
  relative to the nearest `position: relative` ancestor — the
  `.frame`), a fixed 28×28 box, and `pointer-events: none` so these
  decorations never intercept clicks meant for the article.
- Each `.cornerTL/TR/BL/BR` is a tiny modifier adding only what differs:
  *which* corner (`top/left/bottom/right: -14px` nudges it half-outside
  the frame, so the L-bracket overhangs the border) and *which two
  borders* to draw to form the L. Crimson accent.
- Writing each modifier on one line is a deliberate readability choice —
  the four rules are visually a 4-corner table.

```css
.header {
  margin: 0 0 2.4rem;
  padding-bottom: 1.8rem;
  border-bottom: 1px solid var(--ink-soft, rgba(47, 1, 71, 0.15));
  max-width: 75ch;
}
```

The header block above the body. `max-width: 75ch` — the **`ch` unit**
is the width of the "0" glyph in the current font, so `75ch` ≈ 75
characters. Capping measure in `ch` is the standard typographic way to
keep line length comfortable for reading. A 1px bottom border separates
header from body.

```css
.title {
  font-family: 'Lato', sans-serif;
  font-weight: 900;
  font-size: clamp(2.4rem, 5vw, 4rem);
  line-height: 1.05;
  letter-spacing: -0.015em;
  color: var(--ink);
  margin: 0 0 0.8rem;
}
```

The `<h1>`. The interesting part is **`clamp(2.4rem, 5vw, 4rem)`** — a
fluid type technique:

- `clamp(MIN, PREFERRED, MAX)` returns `PREFERRED`, but never below
  `MIN` or above `MAX`.
- `5vw` = 5% of the viewport width, so the title grows/shrinks with the
  window…
- …but is clamped to never go below 2.4rem (readable on phones) or above
  4rem (not absurd on huge monitors).

This gives **responsive typography with no media queries**. Negative
`letter-spacing` tightens big display type; tight `line-height: 1.05`
suits multi-line headlines.

```css
.tagline {
  font-family: 'Lato', sans-serif;
  font-style: italic;
  font-size: 1.15rem;
  color: var(--ink);
  opacity: 0.75;
  margin: 0;
  max-width: 65ch;
}
```

The italic summary line under the title — softened with `opacity` and
measure-capped at `65ch`.

```css
.tagsRow { margin-top: 1rem; }

.backRow {
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px dashed var(--ink-soft, rgba(47, 1, 71, 0.15));
}
```

`.tagsRow` just spaces the strand tags below the tagline. `.backRow`
separates the footer link with a **dashed** top border (a softer
divider than the solid header rule).

```css
.backCta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Lato', sans-serif;
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--ink);
  text-decoration: none;
  padding: 0.6rem 1rem;
  background: transparent;
  border: 1px solid var(--ink-soft, rgba(47, 1, 71, 0.15));
  border-radius: 2px;
  transition: background-color 0.2s, border-color 0.2s, color 0.2s, gap 0.2s;
}
.backCta:hover {
  background: var(--bg-soft, rgba(47, 1, 71, 0.04));
  border-color: var(--ink);
  color: var(--crimson);
  gap: 0.7rem;
}
```

The button-styled "back" link. This is the *same* inline-flex +
animated-`gap` hover idiom used by the 404 CTA (see
[`Marginalia.module.css.md`](../Marginalia.module.css.md)) — on hover
the `gap` widens from 0.5rem to 0.7rem and, because `gap` is in the
`transition` list, the arrow visually "steps away". Keeping this idiom
identical across the feature is intentional consistency.

```css
@media (max-width: 880px) {
  .breadcrumb,
  .page { padding-left: 1.25rem; padding-right: 1.25rem; }
  .frame { padding: 2rem 1.5rem 2.5rem; }
}
@media (max-width: 480px) {
  .breadcrumb,
  .page { padding-left: 0.75rem; padding-right: 0.75rem; }
  .frame { padding: 1.5rem 1rem 2rem; }
}
```

**Media queries** = responsive design. `@media (max-width: 880px)`
applies its rules only when the viewport is ≤ 880px (tablet-ish), and
the nested `≤ 480px` block applies on phones. Both just *tighten the
horizontal gutters* progressively so the article stays readable at
360px wide without horizontal scroll. The comment notes the 480px block
is the "phone class". Note this CSS is **mobile-considerate but
desktop-first**: base rules target large screens, media queries override
*down*.

## Libraries & APIs used

- **Plain CSS** as a CSS Module.
- **CSS variables with fallbacks**, **flexbox**, **pseudo-classes**,
  **transitions**, **media queries**.
- **Modern CSS functions/units**: `clamp()`, `vw`, `ch`, `rem`, `em`.

## Concepts to learn here

- **Fluid typography with `clamp(min, vw, max)`** — responsive type
  without media queries.
- **The `ch` unit** for capping line length (readable measure).
- **Base + modifier class composition** (`.cornerCrop` + `.cornerTL`),
  matching the JSX template-literal `className`.
- **Absolute positioning** anchored by a `position: relative` ancestor,
  and `pointer-events: none` for decorative overlays.
- **Mobile-considerate, desktop-first responsive design** with stacked
  `max-width` media queries.
- **Solid vs dashed dividers** for visual hierarchy.

## How to edit it safely

- **Renaming classes**: change here *and* in
  [`MarginaliaArticle.tsx`](./MarginaliaArticle.tsx.md) together — a
  mismatch silently yields `undefined`/unstyled output.
- **Title scaling**: tune the three `clamp()` arguments. Keep MIN
  readable on phones (≈2.2–2.6rem) and MAX sane on 4K.
- **Gutters on small screens**: adjust the values inside the two
  `@media` blocks; the breakpoints (880px, 480px) are shared
  conventions across Marginalia's stylesheets — keep them consistent
  with the list/body files if you change them.
- **Body typography is NOT here** — edit
  [`ArticleBody.module.css`](./ArticleBody.module.css.md) for paragraph,
  heading, code-block, blockquote styles inside the article text.
- **Gotcha**: the corner-crop `-14px` offsets are exactly half the
  `28px` `width/height`; changing the size means re-deriving the offsets
  to keep the L-brackets centred on the frame corner.
- **Gotcha**: don't remove `pointer-events: none` from `.cornerCrop` —
  the corner spans overlap the article and would otherwise eat clicks.
- Paired file: [`MarginaliaArticle.tsx`](./MarginaliaArticle.tsx.md).
