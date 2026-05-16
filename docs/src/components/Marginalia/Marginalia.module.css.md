# `src/components/Marginalia/Marginalia.module.css`

## What this file is

This is the **scoped stylesheet** for the top-level
[`Marginalia.tsx`](./Marginalia.tsx.md) component. In practice it styles
exactly one thing: the **"article not found" (404) stub**. The two view
components (`MarginaliaList`, `MarginaliaArticle`) have their own
`.module.css` files, so this file only needs the not-found classes plus
one shared `.code` helper.

### What "CSS Module" means

The `.module.css` suffix is significant. When `Marginalia.tsx` does
`import styles from './Marginalia.module.css'`, the build tool (Vite):

1. Reads every class selector in this file (`.notFoundPage`, etc.).
2. Rewrites each to a globally-unique name
   (e.g. `.Marginalia_notFoundPage__7f3a1`).
3. Hands the component a `styles` object mapping the *original* name
   (`notFoundPage`) to the *hashed* name.

So `className={styles.notFoundPage}` in the TSX resolves to the hashed
class. The upshot: a class called `.code` here cannot accidentally
collide with a `.code` class in some other component's module — they
hash differently. You get the convenience of short, readable class
names with the safety of fully isolated scope.

## Line-by-line / block walkthrough

```css
.notFoundPage {
  max-width: 720px;
  margin: 4rem auto;
  padding: 0 2rem;
}
```

The outermost wrapper of the 404 view (`<main className={styles.notFoundPage}>`).

- `max-width: 720px` — the content never grows wider than 720px, which
  keeps text line-lengths readable on big screens.
- `margin: 4rem auto` — shorthand for `margin: 4rem auto 4rem auto`:
  4rem top/bottom, `auto` left/right. `auto` horizontal margins on a
  block with a fixed `max-width` is the classic **centring idiom** —
  the browser splits leftover horizontal space equally.
- `padding: 0 2rem` — 0 top/bottom, 2rem left/right inner gutter so text
  never touches the screen edge on narrow viewports.
- `rem` is a **relative unit**: 1rem = the root font size (usually
  16px). Sizing in `rem` keeps the layout proportional if the user
  changes their browser font size — better for accessibility than `px`.

```css
.notFoundFrame {
  position: relative;
  background: var(--bg);
  border: 2px solid var(--ink);
  padding: 2.5rem 2.5rem 2rem;
}
```

The bordered card the message sits inside.

- `position: relative` — establishes this box as the **positioning
  context** for any absolutely-positioned descendants. (Here it is
  mostly defensive/consistent with the other Marginalia frames, which
  use it for corner-crop decorations.)
- `var(--bg)` and `var(--ink)` — **CSS custom properties** (CSS
  variables). They are defined once at a higher level (a global theme
  stylesheet / `:root`) so the whole site shares a palette. `--bg` is
  the page background colour, `--ink` the primary dark text colour.
  Using variables means a theme change happens in one place.
- `border: 2px solid var(--ink)` — width, style, colour shorthand.
- `padding: 2.5rem 2.5rem 2rem` — three-value padding: top=2.5rem,
  left/right=2.5rem, bottom=2rem.

```css
.notFoundKicker {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--crimson);
  margin: 0 0 0.5rem;
}
```

The small `404 · marginalia` eyebrow line.

- `font-family: 'JetBrains Mono', monospace` — a **font stack**: try
  "JetBrains Mono"; if unavailable fall back to the generic `monospace`.
  Monospace + uppercase + wide `letter-spacing` is this site's recurring
  "label/eyebrow" treatment.
- `letter-spacing: 0.22em` — `em` here is relative to *this element's*
  font size, so the tracking scales with the text.
- `text-transform: uppercase` — renders uppercase without changing the
  source text (good for accessibility/copy-paste).
- `color: var(--crimson)` — the brand accent colour.
- `margin: 0 0 0.5rem` — only a small bottom margin; resets the
  browser-default paragraph margins on this `<p>`.

```css
.notFoundTitle {
  font-family: 'Lato', sans-serif;
  font-weight: 900;
  font-size: 2rem;
  color: var(--ink);
  margin: 0 0 0.8rem;
}
```

The big "No such article." heading. `font-weight: 900` is the heaviest
weight (extra-black); `'Lato', sans-serif` is the site's display
typeface with a generic fallback.

```css
.notFoundBody {
  font-family: 'Lato', sans-serif;
  font-size: 1rem;
  line-height: 1.55;
  color: var(--ink);
  opacity: 0.85;
  margin: 0 0 1.5rem;
}
```

The explanatory paragraph.

- `line-height: 1.55` — unitless line-height = 1.55 × the font size.
  Unitless is the recommended form because it inherits sensibly.
- `opacity: 0.85` — renders the text at 85% opacity, a soft de-emphasis
  versus the solid-`--ink` title.

```css
.code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9em;
  background: var(--bg-soft, rgba(47, 1, 71, 0.04));
  padding: 0.1em 0.35em;
  border-radius: 2px;
}
```

Styles the inline `<code>{slug}</code>` showing the bad slug.

- `font-size: 0.9em` — 90% of the *surrounding* text size (`em`
  inherits the parent's font size), so inline code sits slightly
  smaller than body copy.
- `var(--bg-soft, rgba(47, 1, 71, 0.04))` — note the **second argument
  to `var()`: a fallback**. If `--bg-soft` is not defined, use the
  literal `rgba(47, 1, 71, 0.04)` (the ink colour at 4% alpha — a barely
  tinted background). This defensive fallback pattern recurs all over
  the Marginalia stylesheets.
- `border-radius: 2px` — very subtle rounded corners.

```css
.notFoundCta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Lato', sans-serif;
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--ink);
  text-decoration: none;
  padding: 0.6rem 1rem;
  border: 1px solid var(--ink-soft, rgba(47, 1, 71, 0.15));
  border-radius: 2px;
  transition: background-color 0.2s, border-color 0.2s, color 0.2s, gap 0.2s;
}
```

The "← Back to marginalia" button-styled link.

- `display: inline-flex` — makes the `<a>` a **flex container** that
  still flows inline like text. Flexbox lets us align the arrow and the
  label on one row.
- `align-items: center` — vertically centres the arrow glyph against the
  label within the flex row (the **cross axis**).
- `gap: 0.5rem` — modern fl ex/grid spacing: puts 0.5rem *between* flex
  children without margins.
- `text-decoration: none` — removes the default underline so it reads as
  a button, not a link.
- `transition: ... 0.2s` — animates the listed properties over 0.2s
  whenever they change (e.g. on hover). Note `gap` is transitioned too,
  which is what makes the arrow visually "step away" on hover (see
  next).

```css
.notFoundCta:hover {
  background: var(--bg-soft, rgba(47, 1, 71, 0.04));
  border-color: var(--ink);
  color: var(--crimson);
  gap: 0.7rem;
}
```

The **`:hover` pseudo-class** — these rules apply only while the pointer
is over the element. Background softly tints, border darkens, text goes
crimson, and `gap` grows from `0.5rem` to `0.7rem`. Because `gap` is in
the `transition` list above, that growth animates, giving a subtle
"nudge" effect. This exact hover idiom (crimson + widening gap) is
reused on the back/CTA links across Marginalia for consistency.

## Libraries & APIs used

- **Plain CSS** processed as a **CSS Module** by Vite.
- **CSS custom properties** (`var(--name, fallback)`).
- **Flexbox** (`display: inline-flex`, `align-items`, `gap`).
- **Pseudo-classes** (`:hover`) and **transitions**.

## Concepts to learn here

- **CSS Modules scoping** and the `styles.foo` → hashed-class mapping.
- **The centring idiom**: `max-width` + `margin: ... auto`.
- **Relative units**: `rem` (root-relative), `em` (parent-relative),
  unitless `line-height`.
- **CSS variables with fallbacks**: `var(--token, fallback)`.
- **Flexbox basics**: container, main/cross axis, `align-items`, `gap`.
- **State styling** with `:hover` plus `transition` for smooth changes.
- Margin/padding **shorthand value counts** (1, 2, 3, or 4 values).

## How to edit it safely

- **Renaming a class**: change it here *and* in
  [`Marginalia.tsx`](./Marginalia.tsx.md) (`styles.notFoundX`).
  CSS Modules will silently give you `undefined` (and thus an unstyled
  element) if the names drift apart — there's no error, so keep them in
  lockstep.
- **Recolouring**: prefer changing the global `--ink` / `--crimson` /
  `--bg` tokens (defined elsewhere) over hard-coding hex values here, so
  the rest of the site stays consistent. Only touch the
  `rgba(47, 1, 71, ...)` literals if you intend to change just the
  fallback.
- **Spacing/typography tweaks**: adjust `rem`/`em` values; keep
  `line-height` unitless.
- **Gotcha**: this file styles *only* the 404 stub. The list and detail
  pages are styled by
  [`List/MarginaliaList.module.css`](./List/MarginaliaList.module.css.md)
  and
  [`Detail/MarginaliaArticle.module.css`](./Detail/MarginaliaArticle.module.css.md)
  respectively — don't add list/detail rules here.
- **Gotcha**: the `transition` list explicitly includes `gap`. If you
  remove `gap` from the transition, the hover "nudge" becomes an instant
  jump. That animated micro-interaction is intentional and shared across
  the feature.
- Paired file: [`Marginalia.tsx`](./Marginalia.tsx.md).
