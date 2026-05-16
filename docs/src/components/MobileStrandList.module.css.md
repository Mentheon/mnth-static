# `src/components/MobileStrandList.module.css`

## What this file is

The **CSS Module** for `MobileStrandList.tsx`: a touch-first stacked list of strand cards. The design priorities (stated in the header comment) are **≥44px tap targets, generous spacing, no decorative animations that delay first interaction** — a good example of mobile-specific styling intent.

## Line-by-line / block walkthrough

```css
.list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  padding: 0 1rem;
}
```

A vertical flex stack (`flex-direction: column`) with consistent `gap` between cards, centred and capped at 480px (a comfortable phone-content width) via `max-width` + `margin: 0 auto`.

```css
.heading { font-size: clamp(1.25rem, 5vw, 1.75rem); text-align: center; }
.thin { font-weight: 400; }
```

Fluid heading sized by viewport width (`5vw`, clamped). `.thin` is the lighter-weight span the component wraps around part of the heading (mixed-weight typography).

```css
.card {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem 1rem;
  background: var(--bg);
  border: 1.5px solid rgba(47, 1, 71, 0.18);
  border-radius: 10px;
  text-align: left;
  font: inherit;
  color: inherit;
  cursor: pointer;
  appearance: none;
  width: 100%;
  box-shadow: 0 1px 3px rgba(47, 1, 71, 0.06);
  transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.15s ease;
}
.card:active { transform: scale(0.99); }
.cardActive {
  border-color: var(--crimson);
  background-color: rgba(163, 11, 55, 0.05);
  box-shadow: 0 4px 14px rgba(163, 11, 55, 0.12);
}
```

The card is a `<button>` styled as a horizontal flex row. Note the **button reset**: `appearance: none` (strip native button rendering), `font: inherit` and `color: inherit` (buttons do not inherit font/colour by default — you must opt in), `text-align: left`, `width: 100%`. This is the full recipe for "make a `<button>` look like a custom card while staying a real button". `border-radius: 10px` softens it for touch. The base `transition` covers the state changes; `.cardActive` (toggled by JS) recolours the border/background/shadow and it animates smoothly. **`.card:active { transform: scale(0.99) }`** — the `:active` pseudo-class fires while the element is being pressed/tapped, giving a subtle press-down tactile feedback (important on touch where there is no hover).

```css
.iconWrap { flex: 0 0 auto; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; }
.icon { width: 100%; height: 100%; display: block; }
.copy { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 0.15rem; }
```

**Flex sizing shorthand**: `flex: 0 0 auto` on the icon = do not grow, do not shrink, natural size (a fixed 56px disc). `flex: 1 1 auto` on the copy column = grow and shrink to fill the remaining row width. **`min-width: 0`** is the crucial line: flex items have a default `min-width: auto` that *refuses to shrink below content size*, which breaks text truncation in a flex row; setting `min-width: 0` lets the text column shrink and ellipsis work. This is one of the most common flexbox gotchas — memorise it. The copy is itself a nested column for label/tagline/meta.

```css
.label { font-size: 1.05rem; font-weight: 700; line-height: 1.2; }
.tagline { font-size: 0.85rem; line-height: 1.3; opacity: 0.72; }
.meta { display: inline-flex; align-items: center; gap: 0.4rem; text-transform: uppercase; color: var(--ink); opacity: 0.78; }
.metaPill { display: inline-flex; padding: 0.15rem 0.45rem; border: 1px solid currentColor; border-radius: 999px; }
.metaPhase { font-weight: 700; color: var(--crimson); }
```

Text hierarchy: bold label, quieter tagline (`opacity`), small-caps meta row. `.metaPill` is a **pill/chip**: `border-radius: 999px` (any value larger than half the height yields a perfect pill) + `border: 1px solid currentColor` so the border matches the text colour automatically (`currentColor` keyword). `.metaPhase` highlights the phase in crimson. Pills via huge `border-radius` + `currentColor` borders is a reusable chip recipe.

```css
.chev { flex: 0 0 auto; font-size: 1.2rem; color: var(--crimson); opacity: 0.6; }
.cardActive .chev { opacity: 1; }
```

The chevron column is fixed-size (`flex: 0 0 auto`). `.cardActive .chev` (descendant selector) brightens the chevron when the card is active — a parent-state-drives-child-style pattern within one component.

## Libraries & APIs used

Pure CSS. References:

- CSS Modules (Vite): <https://vitejs.dev/guide/features#css-modules>
- Flexbox + the `flex` shorthand + `min-width:0` gotcha: <https://developer.mozilla.org/docs/Web/CSS/flex>
- `:active` pseudo-class: <https://developer.mozilla.org/docs/Web/CSS/:active>
- `appearance: none` (button reset): <https://developer.mozilla.org/docs/Web/CSS/appearance>
- `currentColor`: <https://developer.mozilla.org/docs/Web/CSS/color_value#currentcolor_keyword>
- `clamp()`: <https://developer.mozilla.org/docs/Web/CSS/clamp>

## Concepts to learn here

- Touch-first design intent: large tap targets, no first-paint-blocking animation, `:active` press feedback.
- Full button reset (`appearance: none; font/color: inherit; text-align; width`) to style a real `<button>` as a card.
- The `flex: grow shrink basis` shorthand (`0 0 auto` vs `1 1 auto`).
- The `min-width: 0` flex gotcha that enables text shrink/truncation in a flex row.
- Base `transition` + JS-toggled `.cardActive` modifier (no hover dependence — uses `:active` instead).
- Pill/chip via large `border-radius` + `currentColor` border.
- Descendant selector for parent-state → child-style within a component.

## How to edit it safely

- **Resize tap targets**: keep `.card` padding and `.iconWrap` size such that the card is ≥44px tall (touch-accessibility minimum).
- **Change active styling**: `.cardActive` (border/background/shadow) and `.cardActive .chev`.
- **Change press feedback**: `.card:active { transform }` (use `:active`, not `:hover`, on this touch fork).
- **Gotcha — keep `min-width: 0` on `.copy`.** Removing it makes a long tagline/label refuse to shrink and overflow the card in a flex row.
- **Gotcha — keep the button reset (`font: inherit; color: inherit; appearance: none`)** or the card will inherit ugly default button styling.
- **Gotcha — this is its OWN module**, not shared with `RDStrands.module.css`. Renaming a class only affects `MobileStrandList.tsx`.
- Paired file: **`MobileStrandList.tsx`** consumes every class here via `styles.*`; the `.cardActive` modifier is applied from the `isActive` derived prop.
