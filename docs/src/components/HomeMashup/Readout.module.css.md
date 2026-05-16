# `src/components/HomeMashup/Readout.module.css`

## What this file is

The scoped stylesheet for `Readout.tsx`. Because the filename ends in
`.module.css`, the build tool **hashes every class name** so they can't collide
with other components' CSS. `Readout.tsx` imports it as `styles` and references
classes as `styles.readout`, `styles.left`, `styles.right`.

It styles the top-corner "LEAD II"-style monitor strip and makes it responsive.

## Line-by-line / block walkthrough

### `.readout` — the container

```css
.readout {
  position: absolute;
  top: 1.25rem;
  left: 1.5rem;
  right: 1.5rem;
  display: flex;
  justify-content: space-between;
  font-family: 'Lato', sans-serif;
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--ink);
  opacity: 0.55;
  pointer-events: none;
  z-index: 5;
}
```

- **`position: absolute`** — positions the element relative to its nearest
  *positioned* ancestor (the `.stage` in `HomeMashup.module.css`, which is
  `position: relative`). It's lifted out of normal document flow.
- **`top/left/right`** set together (with no `width`) stretch the strip across
  the stage with `1.5rem` gutters on each side. `rem` = multiples of the root
  font size; it scales with the user's base font setting.
- **`display: flex` + `justify-content: space-between`** — flexbox lays the two
  child `<span>`s in a row and pushes the first hard-left and the last
  hard-right, with the gap absorbed between them. This is what puts one label in
  each corner.
- **`letter-spacing: 0.18em` + `text-transform: uppercase` + `font-weight: 700`**
  — the wide-tracked, all-caps, bold look of a clinical monitor label. `em` here
  = multiples of *this element's* font size, so spacing scales with the text.
- **`color: var(--ink)`** — a **CSS custom property** (variable) defined
  globally elsewhere in the app's theme. `var(--ink)` reads it; if it's
  undefined you could supply a fallback with `var(--ink, #222)`. Using theme
  variables keeps every scene/component colour-consistent.
- **`opacity: 0.55`** — renders the whole strip semi-transparent so it reads as
  a subtle overlay, not foreground content.
- **`pointer-events: none`** — the strip ignores the mouse entirely: clicks
  "pass through" it to whatever's beneath. Important because it overlaps the
  animated canvas and the pills.
- **`z-index: 5`** — stacking order. Higher = painted on top. Compare with
  `.pillnav` at `z-index: 6` and the headline at `z-index: 4` in the sibling
  modules: the readout sits above the canvas/headline but below the pills.

### `.left` / `.right`

```css
.left,
.right {
  white-space: nowrap;
}
```

A grouped selector (comma = "apply to both"). **`white-space: nowrap`** forbids
the label text from wrapping onto a second line — a monitor readout must stay on
one line even if it's long.

### Responsive override

```css
@media (max-width: 640px) {
  .readout {
    left: 0.75rem;
    right: 0.75rem;
    font-size: 0.65rem;
    letter-spacing: 0.14em;
  }
}
```

- **`@media (max-width: 640px)`** is a *media query*: the rules inside apply
  only when the viewport is 640px wide or narrower (i.e. phones). This is the
  core mechanism of responsive design.
- On small screens the gutters tighten (`0.75rem`), the text shrinks, and
  tracking loosens slightly so the labels still fit the narrower stage. Only the
  four named properties are overridden; everything else from the base `.readout`
  rule still applies (CSS cascades).

## Libraries & APIs used

- **CSS Modules** — local class-name scoping via the `.module.css` extension.
- **CSS** — absolute positioning, flexbox, custom properties (`var(--ink)`),
  media queries, `rem`/`em` units.

## Concepts to learn here

- Absolute positioning anchored to a `position: relative` ancestor, with
  `top/left/right` (no width) to span an area.
- Flexbox `space-between` to push two items to opposite ends.
- CSS custom properties for theming.
- `pointer-events: none` for click-through overlays.
- `z-index` stacking, read alongside the other modules in this folder.
- Mobile-first thinking via `@media (max-width: …)` and selective overrides.

## How to edit it safely

- **Move the strip lower:** increase `top` in `.readout` (and the value in the
  media query if you want the phone layout to follow).
- **Make it interactive** (e.g. a clickable label): you must remove
  `pointer-events: none` — but then check it doesn't block clicks on the pills
  or canvas underneath.
- **Restyle colour:** prefer swapping the theme variable (`var(--crimson)`
  etc.) over a hard-coded hex, to stay consistent with the rest of HomeMashup.
- **Gotcha — class names must match the component.** If you rename `.left` here,
  you must update `styles.left` in `Readout.tsx`. CSS Modules give no error for
  a class that doesn't exist; `styles.typo` is silently `undefined` and the
  element simply renders unstyled.
- Keep `z-index` consistent with the rest of the folder: canvas `0`-ish,
  headline `4`, readout `5`, pills `6`. Re-layering one without checking the
  others can hide the pills behind the readout.
