# `src/index.css`

## What this file is

This is the **global stylesheet** for the whole site. It is imported once, at the top of `src/main.tsx` (`import './index.css'`), which makes its rules apply to every page. Its job is small but foundational: define the site-wide colour palette as **CSS custom properties** (variables), set a sane box model, reset default page margins, choose the base font and colours on `<body>`, and style links globally. Component-specific styling lives elsewhere (mostly `*.module.css` files scoped to single components); this file is only for things that should be truly global.

## Line-by-line / block walkthrough

```css
:root {
  --bg:             #FFECE1;
  --ink:            #2F0147;
  --plum:           #3F0247;
  --crimson:        #A30B37;
  --grape:          #9C528B;
  --white:          #FFECE1;
  --strand-default:  #9C528B;
  --strand-selected: #A30B37;
  --strand-hover-scale: 1.12;
}
```

`:root` is a CSS pseudo-class that matches the document's root element (`<html>`). Defining things here makes them available everywhere.

The `--name: value;` entries are **CSS custom properties** (commonly called "CSS variables"). Any property starting with `--` becomes a reusable token. Elsewhere in the codebase you use them with the `var()` function, e.g. `color: var(--ink);`. Benefits:

- **One place to change a colour** — update `--crimson` here and every `var(--crimson)` across the whole site changes.
- They cascade and can be overridden in a more specific selector (e.g. a dark-mode block could redefine `--bg`).
- They can hold any value, not just colours: note `--strand-hover-scale: 1.12;` is a number used by transform/scale animations on strand elements.

The names are semantic/brand-oriented (`--ink` for body text, `--bg` for background, plus the brand palette `plum`/`crimson`/`grape`, and interaction tokens `--strand-default`/`--strand-selected`). Note `--bg` and `--white` are the same colour (`#FFECE1`) — a warm off-white used both as the page background and as "white" text on dark areas.

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}
```

The `*` is the **universal selector** (every element); `::before` and `::after` are **pseudo-elements** (generated content boxes). `box-sizing: border-box` changes the box model so an element's `width`/`height` *includes* its padding and border instead of adding them on top. This makes layout math predictable and is a near-universal best practice. Applying it to `*` plus the pseudo-elements is the standard global reset.

```css
html,
body {
  margin: 0;
  padding: 0;
  font-family: 'Lato', sans-serif;
  background-color: var(--bg);
  color: var(--ink);
}
```

- `margin: 0; padding: 0;` removes the small default spacing browsers put around `<body>` (otherwise you'd see a white gap at the page edges).
- `font-family: 'Lato', sans-serif;` sets the base typeface. This is a **font stack**: try `Lato` first, and if it isn't available fall back to the system's generic `sans-serif`. (Note: this file doesn't itself load the Lato web font — that would be done via an `@font-face` rule or a `<link>` in `index.html`; if Lato isn't loaded, the browser falls back to `sans-serif`.)
- `background-color: var(--bg);` and `color: var(--ink);` — here is the **`var()`** function consuming the custom properties defined in `:root`. The whole page gets the warm off-white background and deep-purple text by default, and child elements inherit `color` unless they override it.

```css
a {
  color: #FFECE1;
  text-decoration: none;
}
```

A **type/element selector** targeting every `<a>` (link). It sets links to the off-white colour and `text-decoration: none` removes the default underline. Note this colour is the *same* as the page background (`#FFECE1` = `--bg`), which means a plain link on the default background would be invisible — links are clearly intended to be styled/placed on dark-coloured surfaces (headers, buttons) by component styles. (Stylistically you could write `color: var(--white);` here to match the token system; it's the same value.)

## Libraries & APIs used

- No JavaScript libraries — this is plain **CSS**, a web standard understood directly by browsers.
- It is pulled into the build by **Vite's CSS handling** because `src/main.tsx` does `import './index.css'`. Docs: <https://vitejs.dev/guide/features.html#css>
- Reference for the features used: CSS custom properties <https://developer.mozilla.org/docs/Web/CSS/Using_CSS_custom_properties>, `box-sizing` <https://developer.mozilla.org/docs/Web/CSS/box-sizing>.

## Concepts to learn here

- **CSS custom properties** (`--x`) defined on `:root` and consumed with `var(--x)` — design tokens / theming.
- The **CSS box model** and why `box-sizing: border-box` makes layouts sane.
- **Selectors**: universal (`*`), pseudo-elements (`::before`/`::after`), element/type selectors (`html`, `body`, `a`).
- A **browser reset** (zeroing default `margin`/`padding`).
- **Font stacks** and generic fallbacks (`'Lato', sans-serif`).
- CSS **inheritance** (setting `color` on `body` cascades to descendants).
- Global CSS vs. scoped CSS Modules — this file is the *global* layer; see the `*.module.css` docs for the scoped approach.

## How to edit it safely

- **To rebrand colours:** change the hex values in `:root` only. Because components reference `var(--crimson)` etc., the change propagates everywhere automatically — don't hunt for hardcoded hex values in components, fix them at the token.
- **To add a new global token:** add another `--my-token: value;` line inside `:root`, then use `var(--my-token)` wherever needed.
- **The link colour gotcha:** `a { color: #FFECE1 }` equals the page background, so links are only visible on dark surfaces. If you add links on a light background, give them their own colour (ideally a `var(--...)` token) in the relevant component CSS rather than changing this global rule.
- **Keep this file minimal.** Component-specific styles belong in that component's `*.module.css` (scoped, no naming collisions). Adding broad selectors here can unintentionally affect the whole site.
- If you want to change the body font, update the `font-family` here *and* make sure the font is actually loaded (web font `@font-face` / `<link>` in `index.html`), otherwise you'll silently get the `sans-serif` fallback.
