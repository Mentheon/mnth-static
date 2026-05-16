# `src/components/HeroIconsWithContent.module.css`

## What this file is

The **CSS Module** for `HeroIconsWithContent.tsx`: layout for the icon row, the typewriter caption area, the blinking caret, and the status-dot row. Class names are hashed and locally scoped; the component references them via `styles.x`.

## Line-by-line / block walkthrough

```css
.iconsRow {
  display: flex;
  justify-content: center;
  gap: 8rem;
  margin-top: 5rem;
}
```

A **flexbox row**: `display: flex` lays the three icon groups horizontally; `justify-content: center` centres them as a group; `gap: 8rem` is the modern way to space flex children (no margins needed, no leftover edge margin). Large gap on desktop; the media query below tightens it for narrow screens.

```css
.iconGroup {
  display: flex;
  flex-direction: column;
  align-items: center;
}
```

Each group is a **vertical** flex column (`flex-direction: column`) with its children (the icon link + the label) centred (`align-items: center`). Nesting flex containers like this — row of columns — is one of the most common layout structures.

```css
.iconWrapper {
  width: 130px;
  height: 130px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.iconLink { display: inline-block; cursor: pointer; }
```

`.iconWrapper` is a fixed 130×130 box that centres the `IconCircle` (which is 120px and may scale up to ~1.15× on hover — the wrapper's extra room prevents the scaled circle from being clipped by surrounding layout). `position: relative` establishes a containing block in case the circle needs absolute positioning inside. `.iconLink` `cursor: pointer` signals interactivity (the anchor wraps the circle).

```css
.label {
  margin-top: 1rem;
  font-weight: bold;
  font-size: 1.5rem;
  text-align: center;
  color: var(--ink);
}
```

The text label under each circle. `color: var(--ink)` reads the global theme token (CSS Modules scope class names, not custom properties).

```css
.typedContent {
  min-height: 100px;
  margin-top: 5rem;
  font-size: 2rem;
  font-family: 'Lato', sans-serif;
  color: var(--ink);
  text-align: center;
  padding: 0 1rem;
}
```

The typewriter caption. **`min-height: 100px` is the important line**: the text length changes constantly as it types and erases; without a reserved minimum height the surrounding layout would jump up and down every keystroke. Reserving space for dynamic content to prevent layout shift is a key UI lesson.

```css
.caret {
  display: inline-block;
  width: 2px;
  height: 1.8rem;
  background: var(--ink);
  margin-left: 4px;
  vertical-align: -4px;
  animation: blink 1s step-start infinite;
}
@keyframes blink {
  50% { opacity: 0; }
}
```

The blinking text cursor. It is a thin (`width: 2px`) coloured bar (`background: var(--ink)`), `display: inline-block` so width/height apply and it sits inline after the text. `vertical-align: -4px` nudges it to line up with the text baseline. The blink is a **CSS `@keyframes` animation**: `animation: blink 1s step-start infinite` runs the `blink` keyframes over 1s, forever. `step-start` is a **stepping timing function** — it jumps instantly between states rather than easing, giving a hard on/off blink (a smooth fade would look wrong for a cursor). The keyframes only define `50% { opacity: 0 }`; the unspecified 0%/100% default to the element's normal `opacity: 1`, so it is visible→hidden→visible. Pure CSS, no JS — a great example of offloading a trivial animation to the platform.

```css
.statusIndicators {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1.75rem;
}
.indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #ccc;
  transition: background-color 0.3s;
}
.activeIndicator {
  background-color: var(--crimson);
}
```

The dot row: a centred flex row of 10×10 circles (`border-radius: 50%` turns a square into a circle). `.indicator` is the base (grey); `.activeIndicator` is the **modifier class** the component adds to the selected one (crimson). The `transition: background-color 0.3s` on the base means when the active class moves from one dot to another, the colour change *animates* smoothly on both — define the transition on the element that always exists, and toggling a state class gives you free animation. This base-class-with-transition + toggled-modifier-class pattern recurs throughout the codebase.

```css
@media (max-width: 1080px) {
  .iconsRow {
    gap: 2.5rem;
    flex-wrap: wrap;
  }
}
```

Responsive: under 1080px the gap shrinks and `flex-wrap: wrap` lets the three icon groups wrap onto multiple lines instead of overflowing or shrinking illegibly.

## Libraries & APIs used

Pure CSS. References:

- CSS Modules (Vite): <https://vitejs.dev/guide/features#css-modules>
- Flexbox + `gap` + `flex-wrap`: <https://developer.mozilla.org/docs/Web/CSS/CSS_flexible_box_layout>
- `@keyframes` / `animation` + `step-start`: <https://developer.mozilla.org/docs/Web/CSS/animation-timing-function>
- `transition`: <https://developer.mozilla.org/docs/Web/CSS/transition>
- Media queries: <https://developer.mozilla.org/docs/Web/CSS/CSS_media_queries>

## Concepts to learn here

- Nested flexbox: a centred row of centred columns; `gap` for spacing.
- Reserving space (`min-height`) for dynamic-length content to prevent layout shift.
- A pure-CSS blinking caret via `@keyframes` + `step-start` (stepped, not eased).
- Circles from squares with `border-radius: 50%`.
- Base class with a `transition` + a toggled modifier class = free animated state changes.
- Responsive wrapping with `flex-wrap` in a media query.

## How to edit it safely

- **Tighten/loosen the icon row**: `.iconsRow { gap }` (and the media-query override).
- **Change the caret blink speed/style**: the `1s` and `step-start` in `.caret`'s `animation`; for a soft fade change `step-start` to `ease-in-out` (and the keyframes if desired).
- **Recolour the active dot**: `.activeIndicator { background-color }` (prefer the `--crimson` token).
- **Gotcha — keep `.typedContent { min-height }`** at least as tall as the tallest caption; reducing it reintroduces layout jumping during typing.
- **Gotcha — class rename** must be mirrored in `HeroIconsWithContent.tsx` (`styles.iconsRow`, `styles.caret`, `styles.activeIndicator`, …); they are linked by property name.
- Paired file: **`HeroIconsWithContent.tsx`** consumes every class here via the `styles` object; the `.activeIndicator`/`.selected` modifiers are applied conditionally based on the `selected` prop.
