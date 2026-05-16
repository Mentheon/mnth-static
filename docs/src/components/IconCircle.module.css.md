# `src/components/IconCircle.module.css`

## What this file is

A tiny **CSS Module** with two classes: the round disc (`.circle`) and the emoji glyph (`.emoji`). It supplies only the *static* look; `IconCircle.tsx` supplies the *dynamic* parts (size, background colour, scale) via inline styles. The split — static in the module, dynamic inline — is the lesson here.

## Line-by-line / block walkthrough

```css
.circle {
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  transition: transform 0.1s ease-out, background-color 0.2s ease;
  transform-origin: center;
}
```

- `border-radius: 50%` turns the (square, because the component sets equal `width`/`height`) box into a perfect circle. This is the standard square→circle technique.
- `display: flex; align-items: center; justify-content: center` centres the emoji span both axes — the simplest reliable centring method.
- `box-shadow: 0 2px 6px rgba(0,0,0,0.2)` gives a soft drop shadow (offset-x, offset-y, blur, colour) for a subtle lift off the page.
- **`transition: transform 0.1s ease-out, background-color 0.2s ease`** is the load-bearing line. `IconCircle.tsx` writes `transform: scale(...)` inline, recomputed on every mouse move; this transition makes each discrete scale value *glide* over 100ms instead of snapping, so the magnet effect looks fluid even though JS is feeding stepwise values. It also smooths the `background-color` change when `isSelected` flips (200ms). **The general principle: define the `transition` on the element whose inline/dynamic property changes, and the change animates for free.** `ease-out` decelerates (natural for "settling" into a size).
- `transform-origin: center` makes `scale()` grow from the middle so the circle expands in place rather than from a corner. (For an HTML element `center` is unambiguous — unlike SVG, which needs `transform-box`.)

```css
.emoji {
  font-size: 72px;
  line-height: 1;
  font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', 'Android Emoji',
    EmojiSymbols, sans-serif;
}
```

- `font-size: 72px` sizes the emoji glyph (the emoji is rendered as text, so font-size controls it). 72px inside the default 120px circle is the 60%-diameter ratio reused elsewhere (e.g. ConceptView's roadmap nodes copy this ratio).
- `line-height: 1` removes the extra leading a glyph would otherwise add, keeping it vertically centred within the flex container.
- The **emoji `font-family` stack** lists the platform colour-emoji fonts in priority order (Apple → Windows → Android/Linux) with `sans-serif` as a last resort. You specify an explicit emoji font stack so the glyph renders as a proper colour emoji consistently rather than falling back to a mono outline on some platforms — a real cross-platform gotcha.

## Libraries & APIs used

Pure CSS. References:

- CSS Modules (Vite): <https://vitejs.dev/guide/features#css-modules>
- `border-radius`: <https://developer.mozilla.org/docs/Web/CSS/border-radius>
- Flexbox centring: <https://developer.mozilla.org/docs/Web/CSS/CSS_flexible_box_layout>
- `transition` / `transform` / `transform-origin`: <https://developer.mozilla.org/docs/Web/CSS/transition>
- `box-shadow`: <https://developer.mozilla.org/docs/Web/CSS/box-shadow>

## Concepts to learn here

- Square → circle via `border-radius: 50%` (works because the component sets equal width/height).
- Flexbox centring of a single child.
- The static-in-module / dynamic-inline division of responsibilities.
- `transition` on the element whose inline property JS changes = free, smooth animation of stepwise JS updates.
- `transform-origin: center` so `scale()` grows in place.
- Explicit emoji `font-family` stack for consistent colour-emoji rendering across OSes.

## How to edit it safely

- **Change the proximity-grow smoothness**: the `transform 0.1s ease-out` duration in `.circle`'s `transition`. Longer feels laggier; remove it and the magnet effect becomes a jittery snap.
- **Change the selection colour-fade speed**: the `background-color 0.2s ease` segment (the colour *value* itself is set inline in `IconCircle.tsx`).
- **Resize the emoji**: `.emoji { font-size }`. Keep it ~60% of the circle diameter for visual balance; the circle size is the component's `size` prop (default 120 → 72px).
- **Gotcha — do not set `width`/`height`/`background-color`/`transform` here**; the component owns those inline (they are dynamic). Setting them here would either be overridden by the inline style or fight it.
- **Gotcha — keep the emoji font stack**; dropping it can make emoji render as black outline glyphs on some platforms.
- **Gotcha — renaming `.circle`/`.emoji`** requires updating `styles.circle`/`styles.emoji` in `IconCircle.tsx`.
- Paired file: **`IconCircle.tsx`** — applies `styles.circle`/`styles.emoji` and supplies the dynamic `width`/`height`/`backgroundColor`/`transform` that this file's `transition` animates.
