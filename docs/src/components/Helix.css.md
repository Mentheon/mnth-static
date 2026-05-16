# `src/components/Helix.css`

## What this file is

A **global stylesheet** (imported as `import './Helix.css'` in `Helix.tsx`). Unlike a CSS *module*, class names are **not** hashed — they appear in the DOM exactly as written. That is deliberate: the imperative engine `helixScene.ts` creates elements with literal class names (`strand-segment`, `project-bead`, `panel`, `themeCard`, …) using `document.createElementNS`, so those names must match real CSS.

To stop those generic names leaking into the rest of the app, **every rule is scoped under `section.helix` / `.helix`**. This is a manual namespacing technique you use when a stylesheet must coexist with both a CSS-module file using the same names (`StrandPanel.module.css`) and the global app.

It pairs with `Helix.tsx` (structure + the rod-size state) and `helixScene.ts` (which creates the SVG nodes these rules style).

## Line-by-line / block walkthrough

### Header comment & design tokens

```css
/* Tokens (--bg, --ink, --crimson, etc.) come from src/index.css. */
```

The colours referenced as `var(--ink)`, `var(--crimson)` are **CSS custom properties** (CSS variables) defined globally in `src/index.css`. `var(--ink)` reads that variable; if you re-theme the site you change the variable once and every `var()` updates. Custom properties cascade and inherit like normal properties.

### The section container

```css
section.helix {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 2rem 1rem;
}
```

`section.helix` is a tag+class selector (slightly higher specificity than `.helix` alone). `margin: 0 auto` is the classic horizontal-centring idiom for a block with a `max-width`. `padding: 0 2rem 1rem` is shorthand for top / left+right / bottom (the 4-value/3-value/2-value shorthand is worth memorising).

### `.helix-key` — hidden legend

```css
.helix-key {
  display: none;
  justify-content: center;
  ...
}
```

`display: none` removes it from layout entirely (no box, not just invisible). The other properties are inert while hidden but ready if someone switches it back to `display: flex`. The comment documents that switch — a good habit when you disable rather than delete.

### `.helix-viewport` — the positioning context

```css
.helix-viewport {
  position: relative;
  max-width: 640px;
  margin: 0 auto;
  overflow: hidden;
}
```

`position: relative` here is load-bearing: it creates a **containing block** so the absolutely-positioned children (`.helix-header`, `.helix-selector`) position relative to *this* box, not the page. `overflow: hidden` clips the `.helix-line` which intentionally extends past the bottom. Understanding "`position: relative` parent → `position: absolute` child anchors to it" is one of the most important CSS layout concepts.

### `.helix-stage` — the scroll window

```css
.helix-stage {
  width: 100%; position: relative;
  z-index: 1;
  height: clamp(280px, 44dvh, 480px);
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.helix-stage::-webkit-scrollbar { display: none; }
```

- `clamp(MIN, PREFERRED, MAX)` — responsive sizing: never below 280px, never above 480px, otherwise `44dvh` (44% of the *dynamic* viewport height; `dvh` accounts for mobile browser chrome that grows/shrinks, unlike `vh`). `clamp()` is the modern way to express "fluid but bounded".
- `overflow-y: auto` makes this the scroll container the SVG lives inside; `helixScene.ts` makes the SVG taller than the box so there is something to scroll.
- `overscroll-behavior: contain` stops scroll "chaining" — when you hit the end of this scroller the page behind does not start scrolling.
- The three `scrollbar` lines + the `::-webkit-scrollbar` pseudo-element hide the scrollbar across Firefox / legacy Edge / WebKit while keeping scroll interaction. `::-webkit-scrollbar` is a vendor pseudo-element — non-standard but widely supported.
- `z-index: 1` plus the explicit z-index values throughout this file build a deliberate stacking order: stage (1) < line (2) < rod (3) < selector (8) < header (10). z-index only works on positioned elements (`position` not `static`).

### `.helix-svg`

```css
.helix-svg {
  width: 100%;
  height: auto;
  min-height: clamp(440px, 66dvh, 660px);
  display: block;
  overflow: visible;
}
```

`height: auto` + `width: 100%` keeps the SVG's intrinsic aspect ratio; `min-height` forces it taller than the stage so scrolling has content. `display: block` removes the few px of inline whitespace SVGs get by default. `overflow: visible` lets strands that swing past the viewBox edge still render.

### Static header overlay

```css
.helix-header {
  position: absolute;
  top: 0; left: 0; right: 0;
  z-index: 10;
  display: flex; flex-direction: column; align-items: center;
  pointer-events: none;
  background: var(--bg);
}
.helix-header-rod {
  position: relative;
  z-index: 3;
  transition: width 280ms cubic-bezier(0.4, 0, 0.2, 1),
              height 280ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

- `position: absolute` + `top/left/right: 0` pins a full-width bar to the top of the (relatively-positioned) `.helix-viewport`, *overlaying* the scroll content. `background: var(--bg)` makes it opaque so the scrolling SVG behind the rod is occluded — the rod reads as a fixed brand mark.
- `pointer-events: none` lets clicks/scroll pass *through* the overlay to the scroll stage beneath. Essential when an overlay must be visible but not interactive.
- The **`transition`** on the rod is the visible morph for `Helix.tsx`'s `rodSize` state. `Helix.tsx` only ever sets two discrete pixel sizes; this `transition` animates the change over 280ms. `cubic-bezier(0.4, 0, 0.2, 1)` is the Material "standard" easing curve (slow-out). Teaching point: **JS sets the target value; CSS `transition` animates the journey** — a clean separation.

### `.helix-line` — the vertical hairline

```css
.helix-line {
  position: absolute;
  left: 50%;
  top: 0;
  height: 100dvh;
  width: 2.5px;
  background: var(--ink);
  transform: translateX(-50%);
  z-index: 2;
  pointer-events: none;
}
```

`left: 50%` then `transform: translateX(-50%)` is the canonical **centre-an-element** trick: `left: 50%` puts the *left edge* at the midpoint, `translateX(-50%)` shifts it back by half its *own* width so it is truly centred (works regardless of width). `transform` here is GPU-cheap and does not affect layout. `z-index: 2` places it above the header background but below the rod image (z 3), so it shows through the rod's transparent pixels and continues unbroken.

### `.helix-selector` — the selection indicator

```css
.helix-selector {
  position: absolute;
  left: 0; right: 0;
  top: max(60%, 200px);
  transform: translateY(-50%);
  display: flex; align-items: center; gap: 12px;
  pointer-events: none;
  z-index: 8;
}
.helix-selector-line {
  flex: 1; height: 1px;
  background: linear-gradient(to right, transparent, var(--crimson) 10%, var(--crimson) 90%, transparent);
  opacity: 0.5;
}
```

- `top: max(60%, 200px)` — `max()` floors the position at 200px so it never sits behind the (up to 180px tall) opaque rod overlay, while tracking 60% on tall viewports. `min()`/`max()`/`clamp()` are the modern responsive math functions; learn all three together.
- `transform: translateY(-50%)` vertically centres the line on that `top` point (same trick as above but on the Y axis).
- `flex: 1` on `.helix-selector-line` makes it grow to fill the row between the two chevrons (`display: flex` on the parent + `gap: 12px`).
- The `linear-gradient(...)` with `transparent` at both ends and solid crimson 10%–90% produces a hairline that fades out at the edges — a soft, non-boxy divider. Gradients are first-class `background` values.

### Strand & project styles

```css
.strand-segment {
  fill: none; stroke-width: 2.5; stroke-linecap: round;
  cursor: pointer; transition: opacity 0.35s, stroke-width 0.25s;
  opacity: 0.5;
}
.strand-segment.is-back { stroke-width: 2; opacity: 0.32; }
.strand-hitbox { fill: none; stroke: transparent; stroke-width: 22; cursor: pointer; }
```

These style SVG path elements created by `helixScene.ts`. **SVG presentation attributes as CSS**: `fill`, `stroke-width`, `stroke-linecap` are SVG attributes that CSS can also set (CSS wins over the attribute). `fill: none` + a `stroke` is how you draw an outlined path. The `.strand-hitbox` is invisible (`stroke: transparent`) but `stroke-width: 22` gives a fat 22px-wide click/hover target along the thin visible line — a standard "fat invisible hitbox over a thin visual" accessibility/usability trick.

`transition: opacity 0.35s, stroke-width 0.25s` animates the dim/highlight states the engine toggles via class (`is-back`, `is-dim`, `is-active`). State classes added by JS + transitions in CSS = smooth state changes without JS animation code.

```css
.project-bead { cursor: pointer; transition: opacity 0.3s, transform 0.2s; transform-box: fill-box; transform-origin: center; }
.project-bead:hover { transform: scale(1.15); }
.project-bead.is-active .project-bead-shape { stroke: var(--crimson); stroke-width: 4; }
```

- `transform-box: fill-box` + `transform-origin: center` — for SVG, `transform-origin: center` alone is ambiguous; `transform-box: fill-box` makes "center" mean the centre of the element's own bounding box, so `scale(1.15)` grows it in place rather than flying off. This is the key SVG-transform gotcha.
- `:hover` pseudo-class scales the bead; `.is-active` (toggled by JS) recolours its stroke.

### Tooltip

```css
.helix-tooltip {
  position: absolute; pointer-events: none;
  transform: translate(-50%, -130%);
  opacity: 0; transition: opacity 0.18s;
}
.helix-tooltip::after {
  content: ''; position: absolute; left: 50%; bottom: -5px;
  transform: translateX(-50%);
  border: 5px solid transparent; border-top-color: var(--ink);
}
.helix-tooltip.is-visible { opacity: 1; }
```

The `::after` pseudo-element with `content: ''` and a **transparent border with one coloured side** is the classic pure-CSS triangle (the tooltip's pointer). `border: 5px solid transparent; border-top-color: var(--ink)` draws only the top wedge. The tooltip fades via `opacity` toggled by the `.is-visible` class. `transform: translate(-50%, -130%)` positions it centred above the cursor point JS set.

### Keyframe animations

```css
@keyframes helixIconPulse {
  0%   { transform: scale(0.85); opacity: 0; }
  60%  { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); }
}
.helix .headerIconCircle { animation: helixIconPulse 0.6s ease-out; }

.helix .themeCard { animation: helixCardRise 0.5s ease-out backwards; }
.helix .themeCard:nth-child(1) { animation-delay: 0.15s; }
@keyframes helixCardRise {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

`@keyframes NAME { … }` defines a named animation; `animation: NAME duration timing-function` plays it once on element appearance. `:nth-child(n)` + `animation-delay` staggers the cards so they rise in sequence (a pure-CSS stagger — no JS needed). `animation-fill-mode: backwards` (the `backwards` keyword) applies the `from` state during the delay so cards are invisible *before* their delayed start, not flashing in then animating.

### Panel hidden + media query

```css
.helix .panel { display: none !important; }
...
@media (max-width: 640px) {
  .helix .panelHeader { flex-direction: column; text-align: center; }
  .helix .themeGrid { grid-template-columns: 1fr; }
}
```

`.helix .panel { display: none !important }` — the helix's *internal* panel is hidden because the canonical panel is the app-level `<StrandPanel>` (a CSS-module-styled twin). The DOM stays so `helixScene.ts`'s refs stay valid; it just renders nothing. `!important` forces it over the engine's inline styles.

`@media (max-width: 640px)` is a **media query** — the rules inside apply only when the viewport is ≤640px. Here the panel header stacks vertically and the theme grid collapses to one column. `grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))` (in the non-mobile rule above) is responsive CSS Grid: as many 220px+ columns as fit, each sharing space equally.

## Libraries & APIs used

Pure CSS — no library. Relevant references:

- CSS custom properties / `var()`: <https://developer.mozilla.org/docs/Web/CSS/Using_CSS_custom_properties>
- `clamp()` / `min()` / `max()`: <https://developer.mozilla.org/docs/Web/CSS/clamp>
- `transition`: <https://developer.mozilla.org/docs/Web/CSS/transition>
- `@keyframes` / `animation`: <https://developer.mozilla.org/docs/Web/CSS/@keyframes>
- CSS Grid: <https://developer.mozilla.org/docs/Web/CSS/CSS_grid_layout>
- Media queries: <https://developer.mozilla.org/docs/Web/CSS/CSS_media_queries>
- SVG presentation attributes in CSS: <https://developer.mozilla.org/docs/Web/SVG/Attribute>

## Concepts to learn here

- Global vs module CSS, and manual scoping under a root class to avoid name collisions.
- `position: relative` parent → `position: absolute` child containing-block relationship.
- z-index stacking order built deliberately (and only working on positioned elements).
- The `left:50%; transform:translateX(-50%)` centring idiom.
- `pointer-events: none` for visible-but-non-interactive overlays.
- Fluid sizing with `clamp()` and `dvh`.
- State classes set by JS + CSS `transition`/`@keyframes` = smooth animation with minimal JS.
- SVG-specific: `fill:none`+`stroke`, fat transparent hitboxes, `transform-box: fill-box`.
- Pure-CSS triangle via bordered `::after`.
- CSS-only staggered entrance with `:nth-child` + `animation-delay` + `backwards` fill mode.
- Responsive grid with `repeat(auto-fit, minmax())` and media-query fallbacks.

## How to edit it safely

- **Recolour the helix**: change the `--ink` / `--crimson` etc. tokens in `src/index.css` (not here); every `var()` updates. To override only the helix, redefine the variable inside `section.helix { }`.
- **Resize the scroll window**: edit `.helix-stage { height: clamp(...) }` and the matching `.helix-svg { min-height: clamp(...) }` together — the snap math in `Helix.tsx` reads the *rendered* size so it adapts, but keep the SVG taller than the stage or there is nothing to scroll.
- **Change the logo morph speed**: `.helix-header-rod { transition: ... 280ms ... }` (the *sizes* are constants in `Helix.tsx`).
- **Move the selector line**: `.helix-selector { top: max(60%, 200px) }`. `Helix.tsx` *measures* the real position, so the snap stays correct, but keep it clear of the opaque rod (the `200px` floor exists for exactly that reason — do not lower it below the rod's height).
- **Gotcha — do not rename the generic class names** (`strand-segment`, `project-bead`, `panel`, `themeCard`, …) without also editing `helixScene.ts`, which creates those elements by literal string. They are coupled.
- **Gotcha — keep every rule under `.helix`/`section.helix`**. An unscoped `.panel` or `.themeCard` here would collide with the rest of the site. The whole isolation strategy depends on the prefix.
- **Gotcha — SVG transforms need `transform-box: fill-box`**; if you add a scaling/rotating SVG element and it jumps off-position, that property is almost always the fix.
