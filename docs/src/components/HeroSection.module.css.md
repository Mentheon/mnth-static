# `src/components/HeroSection.module.css`

## What this file is

The **CSS Module** stylesheet for `HeroSection.tsx`. Because it ends in `.module.css`, the build tool **hashes every class name** so it cannot collide with any other file's classes — `HeroSection.tsx` references them through the imported `styles` object (`styles.hero`, `styles.line1`, …). This is the codebase's default styling approach for ordinary components (contrast `Helix.css`, which is global).

## Line-by-line / block walkthrough

```css
.hero {
  text-align: center;
  padding: 4rem 2rem;
  max-width: 1100px;
  margin: 0 auto;
}
```

The hero wrapper. `text-align: center` centres the inline text/elements. `padding: 4rem 2rem` is shorthand for top+bottom / left+right (the 2-value form). `max-width` + `margin: 0 auto` is the standard centred-content-column idiom: the box never exceeds 1100px and auto side margins centre it. `rem` units are relative to the root font size — using `rem` for spacing keeps the layout proportional if the base font size changes.

```css
.line1 {
  font-size: 2.5rem;
  margin-bottom: 0;
  margin-top: 5rem;
  font-family: 'Lato', sans-serif;
  color: var(--ink);
  font-weight: 400;
  line-height: 1.15;
}
.line2 {
  font-size: 2.5rem;
  margin-top: 1rem;
  ...
  font-weight: 700;
}
```

`.line1` (normal weight) and `.line2` (bold, `font-weight: 700`) are the two headline lines. `color: var(--ink)` reads a **global CSS custom property** defined in `src/index.css` — note CSS Modules only scope *class names*, not custom properties, so `var(--ink)` still resolves to the app-wide token. `line-height: 1.15` is a unitless multiplier of the font size (the recommended way to set line-height — it scales with font-size). The tight `margin-bottom: 0` on line1 and `margin-top: 1rem` on line2 keep the two lines visually paired.

```css
.scrollCue {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
  color: var(--ink);
  opacity: 0.55;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-size: 0.72rem;
  font-weight: 700;
}
```

The "scroll to see…" cue. `display: flex` + `justify-content: center` centres the inner `<span>`. `opacity: 0.55` makes it a quiet secondary element. `letter-spacing: 0.18em` + `text-transform: uppercase` is a common typographic "eyebrow/label" treatment — wide-tracked small caps. `em` here is relative to *this element's* font size, so the tracking scales with the (small) cue text.

```css
.scrollCue span {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.scrollCue span::before,
.scrollCue span::after {
  content: '';
  width: 26px;
  height: 1px;
  background: currentColor;
}
```

A **descendant selector** `.scrollCue span` (the hashed `.scrollCue` class, then any `span` inside) makes the span a flex row with `gap` between its items. The `::before` and `::after` **pseudo-elements** with `content: ''` create two small horizontal rules flanking the text — a pure-CSS "— label —" decoration. `background: currentColor` makes the rules the same colour as the text automatically (`currentColor` is the keyword resolving to the element's `color`); change the text colour and the lines follow. `height: 1px` gives a hairline. Note `::before`/`::after` require a `content` property to render at all, even if empty.

```css
@media (max-width: 1080px) {
  .line1, .line2 { font-size: 1.6rem; }
}
```

A **media query**: below a 1080px viewport, both headline lines shrink from 2.5rem to 1.6rem so the big type does not overflow on narrow screens. This is a responsive breakpoint — the rule only applies when the condition matches.

## Libraries & APIs used

Pure CSS. References:

- CSS Modules (Vite): <https://vitejs.dev/guide/features#css-modules>
- CSS custom properties / `var()`: <https://developer.mozilla.org/docs/Web/CSS/Using_CSS_custom_properties>
- Pseudo-elements `::before`/`::after`: <https://developer.mozilla.org/docs/Web/CSS/::before>
- `currentColor`: <https://developer.mozilla.org/docs/Web/CSS/color_value#currentcolor_keyword>
- Flexbox: <https://developer.mozilla.org/docs/Web/CSS/CSS_flexible_box_layout>
- Media queries: <https://developer.mozilla.org/docs/Web/CSS/CSS_media_queries>

## Concepts to learn here

- CSS Modules: class names are locally scoped/hashed; custom properties (`var(--ink)`) are *not* scoped and still read global tokens.
- Centred content column: `max-width` + `margin: 0 auto`.
- `rem` vs `em`: root-relative vs element-relative units.
- Unitless `line-height` as a font-size multiplier.
- Eyebrow/label typography: `letter-spacing` + `text-transform: uppercase` + reduced `opacity`.
- Decorative flanking rules with `::before`/`::after` + `content: ''` + `currentColor`.
- Responsive type via a `max-width` media query.

## How to edit it safely

- **Resize the headline**: change `.line1`/`.line2` `font-size` (and the media-query override for narrow screens — keep both consistent).
- **Recolour**: prefer changing the global `--ink` token in `src/index.css`; or hardcode a colour here for a hero-only override.
- **Change the cue decoration**: the `width`/`height`/`background` of `.scrollCue span::before/::after`. Removing the `content: ''` makes the lines disappear (pseudo-elements need `content`).
- **Gotcha — renaming a class** here means you must update the matching `styles.x` reference in `HeroSection.tsx`; they are linked by property name, and a mismatch silently applies no class.
- Paired file: **`HeroSection.tsx`** consumes these via `styles.hero`, `styles.line1`, `styles.line2`, `styles.scrollCue`.
