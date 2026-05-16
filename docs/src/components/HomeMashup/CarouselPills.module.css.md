# `src/components/HomeMashup/CarouselPills.module.css`

## What this file is

The scoped stylesheet for `CarouselPills.tsx`: the horizontal dot row beneath
the carousel. Class names are hashed by the CSS-Modules build step;
`CarouselPills.tsx` references them as `styles.pillnav`, `styles.pill`,
`styles.pillDot`, `styles.pillActive`.

It defines the small grey dots, the active = crimson + scaled-up state, and the
hover feedback — all done with **CSS, no JavaScript**.

## Line-by-line / block walkthrough

### `.pillnav` — the row container

```css
.pillnav {
  position: absolute;
  bottom: 1.25rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: row;
  gap: 0.7rem;
  z-index: 6;
}
```

- **Centring trick:** `left: 50%` puts the element's *left edge* at the
  horizontal centre; `transform: translateX(-50%)` then shifts it left by half
  *its own width*, so the element's centre lands on the page centre. This
  "50% + translate -50%" pair is the standard way to centre an
  absolutely-positioned element of unknown width.
- **`bottom: 1.25rem`** pins it near the bottom of the `.stage`.
- **`display: flex; flex-direction: row; gap: 0.7rem`** — lay the pills in a
  horizontal line with even `0.7rem` spacing. `gap` spaces flex children without
  needing margins on each.
- **`z-index: 6`** — the highest layer in the folder (readout is `5`, headline
  `4`), so the dots are always clickable on top of everything.

### `.pill` — the clickable hit target

```css
.pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
}
```

This styles the `<button>`. The visible dot is only 8px, but the button is
**22×22px** — a deliberately larger invisible hit area so the dots are easy to
tap on touchscreens (accessibility/usability). `inline-flex` + `align-items` +
`justify-content: center` perfectly centre the small dot inside that larger box.
`background: transparent; border: none; padding: 0` strip the browser's default
button chrome so only the dot shows. `cursor: pointer` shows the hand cursor.

### `.pillDot` — the visible dot

```css
.pillDot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--ink);
  opacity: 0.35;
  transition: background 220ms ease, opacity 220ms ease, transform 220ms ease;
}
```

- **`width/height: 8px` + `border-radius: 50%`** — a square with fully rounded
  corners is a circle. The classic CSS-dot recipe.
- **`background: var(--ink); opacity: 0.35`** — dim grey-ish dot at rest
  (theme `--ink` colour, mostly transparent).
- **`transition: background 220ms ease, opacity 220ms ease, transform 220ms ease`**
  — *this is the animation*. A CSS `transition` says "whenever these properties
  change, interpolate them smoothly over 220ms with an `ease` curve instead of
  snapping". So when a different rule changes `background`/`opacity`/`transform`
  (on hover or when active), the dot animates. No JS, no anime.js — pure CSS.
  Listing each property individually (rather than `transition: all`) is good
  practice: it's explicit and avoids transitioning things you didn't mean to.

### `.pill:hover .pillDot` — hover feedback

```css
.pill:hover .pillDot {
  opacity: 0.7;
  transform: scale(1.15);
}
```

- **`:hover`** is a pseudo-class — these styles apply only while the pointer is
  over the button.
- **`.pill:hover .pillDot`** is a *descendant selector*: "a `.pillDot` inside a
  `.pill` that is being hovered". So hovering the (large) button brightens and
  slightly enlarges the (small) inner dot.
- **`transform: scale(1.15)`** scales the dot to 115%. Because `.pillDot` has a
  `transition` on `transform`, this grows smoothly over 220ms.

### `.pillActive` — the current scene's dot

```css
.pillActive .pillDot,
.pillActive:hover .pillDot {
  background: var(--crimson);
  opacity: 1;
  transform: scale(1.4);
}
```

When `CarouselPills.tsx` adds the `.pillActive` class to the active button, its
dot turns full-opacity crimson and scales to 140%. The selector also lists
`.pillActive:hover .pillDot` so the active pill *stays* crimson/large on hover
(it doesn't fall back to the weaker `.pill:hover` styling). Again every change
animates via the dot's `transition`, so switching scenes makes the old dot
shrink/grey and the new one grow/redden in sync.

### Responsive override

```css
@media (max-width: 640px) {
  .pillnav {
    gap: 0.45rem;
    bottom: 0.75rem;
  }
}
```

On phones, tighten the spacing (more dots fit on a narrow screen) and move the
row a little closer to the bottom edge.

## Libraries & APIs used

- **CSS Modules** — scoped class names.
- **CSS** — absolute positioning, the 50%/translate centring idiom, flexbox
  `gap`, `border-radius` circles, **`transition`** for property animation,
  `:hover` pseudo-class, descendant selectors, `transform: scale`, custom
  properties, media queries.

## Concepts to learn here

- Centring an absolutely-positioned, unknown-width element with
  `left: 50%; transform: translateX(-50%)`.
- A large invisible hit target around a small visual (touch usability).
- Making a circle from a square with `border-radius: 50%`.
- **CSS transitions**: declare `transition` once on the element; any later rule
  that changes those properties animates automatically — the lightest-weight
  animation tool, no JS. (Contrast with the scenes, which use anime.js because
  they animate dynamically-created SVG nodes with complex sequencing.)
- `:hover` and descendant selectors to style an inner element based on an
  ancestor's state.

## How to edit it safely

- **Bigger / smaller dots:** change `width`/`height` in `.pillDot`. Keep
  `.pill` (the hit target) comfortably larger for touch.
- **Change the active colour:** swap `var(--crimson)` in `.pillActive` — prefer
  a theme variable to stay consistent with the scenes.
- **Faster/slower feedback:** change the `220ms` durations in `.pillDot`'s
  `transition`. If you add a new animatable property, add it to that
  `transition` list or it will snap instead of animating.
- **Gotcha — class name coupling.** Renaming `.pillActive` here without
  updating `styles.pillActive` in `CarouselPills.tsx` silently breaks the
  active state (CSS Modules return `undefined` for a missing class; no error).
- **Gotcha — stacking.** `z-index: 6` keeps the pills clickable above the
  readout (`5`). If you lower it below the readout, the readout's area could
  swallow pill clicks even though it has `pointer-events: none` only on itself.
- The active appearance is driven entirely by the presence/absence of the
  `.pillActive` class, which `CarouselPills.tsx` toggles from `activeIndex`.
  This file never decides which pill is active — don't try to express that here.
