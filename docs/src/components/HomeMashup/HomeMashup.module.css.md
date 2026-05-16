# `src/components/HomeMashup/HomeMashup.module.css`

## What this file is

The scoped stylesheet for the orchestrator (`HomeMashup.tsx`). It defines the
**stage frame** — the fixed-size box the whole carousel lives in — plus the
optional "Digital health is moving… fast" headline overlay and its responsive
behaviour. CSS-Modules hashing makes every class local; `HomeMashup.tsx`
references them as `styles.stage`, `styles.canvasArea`, `styles.canvasAreaInset`,
`styles.headlineTop`, `styles.headlineFast`.

## Line-by-line / block walkthrough

### `.stage` — the outer frame

```css
.stage {
  position: relative;
  width: 100%;
  height: calc(100dvh - var(--header-h, 170px));
  background: var(--bg);
  overflow: hidden;
}
```

- **`position: relative`** — this is the crucial anchor. It doesn't move
  `.stage` itself, but it makes `.stage` the *positioning context* for every
  `position: absolute` child (the scene `<svg>`, the readout, the pills). Those
  children's `top/left/right/bottom` are measured against this box. Remove this
  and the absolutely-positioned children would escape to the page/viewport.
- **`height: calc(100dvh - var(--header-h, 170px))`** — `calc()` does arithmetic
  mixing units. `100dvh` is "100% of the *dynamic* viewport height" — `dvh`
  accounts for mobile browser chrome (the URL bar) that grows/shrinks, unlike
  the older `vh`. `var(--header-h, 170px)` reads a CSS variable the app
  publishes from JS for the site header's height, falling back to `170px` if
  it's not set yet. Net effect: the stage fills exactly the screen minus the
  header.
- **`background: var(--bg)`** — theme background colour.
- **`overflow: hidden`** — clips anything drawn outside the box. Scenes animate
  particles that fly off-edge (pills cascading down, shockwaves expanding); this
  stops them spilling into the rest of the page or causing scrollbars.

### `.canvasArea` / `.canvasAreaInset` — where the scene paints

```css
.canvasArea {
  position: absolute;
  inset: 0;
}
.canvasAreaInset {
  top: 0;
  bottom: 3rem;
}
```

- **`position: absolute; inset: 0`** — `inset: 0` is shorthand for
  `top:0; right:0; bottom:0; left:0`. Combined with the absolutely-positioned
  element, it makes `.canvasArea` **fill its `.stage` parent edge-to-edge**.
  The scene's `<svg>` (itself `inset: 0` from `Scene.module.css`) then fills
  *this*. So the active scene paints the entire stage.
- **`.canvasAreaInset`** is the *modifier* class `HomeMashup.tsx` adds only when
  `showHeadline` is true (template-literal className). It overrides `bottom` to
  `3rem` so the canvas stops just above the pills row while the headline rides
  on top. Read the in-file comments: the headline is drawn *over* the canvas
  (z-index), not by pushing the canvas down — this keeps scene animations
  uncramped.

### `.headlineTop` / `.headlineFast` — the overlay type

```css
.headlineTop {
  position: absolute;
  top: 4rem;
  left: 50%;
  transform: translateX(-50%);
  max-width: 90%;
  text-align: center;
  font-family: 'Lato', sans-serif;
  font-weight: 700;
  font-size: clamp(1.8rem, 4.5vw, 4rem);
  line-height: 1.05;
  letter-spacing: -0.01em;
  color: var(--ink);
  pointer-events: none;
  z-index: 4;
  white-space: nowrap;
}
.headlineFast {
  font-weight: 900;
  color: var(--crimson);
}
```

- **`left: 50%; transform: translateX(-50%)`** — the same centre-an-unknown-
  width-element idiom explained in `CarouselPills.module.css.md`.
- **`font-size: clamp(1.8rem, 4.5vw, 4rem)`** — `clamp(MIN, PREFERRED, MAX)` is
  *fluid typography*. The browser uses `4.5vw` (4.5% of viewport width) so the
  headline scales with the screen, but never smaller than `1.8rem` or larger
  than `4rem`. One line replaces a stack of media queries for font size.
- **`pointer-events: none`** — the headline is pure decoration over the
  animation; clicks pass through to the canvas/pills beneath.
- **`z-index: 4`** — sits *above* the canvas but *below* the readout (`5`) and
  pills (`6`). This is the layering that lets the type overlay the animation
  without blocking the controls.
- **`white-space: nowrap`** — forces "moving… fast" to stay on a single line on
  desktop (overridden on mobile below).
- **`.headlineFast`** is applied to just the word "fast" via a `<span>` in the
  JSX, making it heavier (`900`) and crimson — a typographic accent on one word.

### Responsive overrides

```css
@media (max-width: 640px) {
  .canvasAreaInset { top: 0; bottom: 2.5rem; }
  .headlineTop { top: 2.5rem; white-space: normal; }
}

@media (max-width: 640px) {
  .stage {
    height: calc(100dvh - var(--header-h, 120px));
  }
}
```

- Two separate `@media (max-width: 640px)` blocks — they could be merged; CSS
  doesn't mind multiple blocks with the same query, and keeping them separate
  groups related concerns (headline vs. stage sizing).
- On phones: the headline moves up (`top: 2.5rem`) and **`white-space: normal`**
  *re-enables wrapping* (it's allowed to break across lines on a tight screen,
  undoing the desktop `nowrap`).
- The stage's header-height fallback drops to `120px` for the typically shorter
  mobile header (still preferring the JS-published `--header-h` when present).

## Libraries & APIs used

- **CSS Modules** — scoped class names.
- **CSS** — `position: relative` as a containing block, `position: absolute` +
  `inset`, `calc()`, `dvh` units, custom properties with fallbacks
  (`var(--x, fallback)`), `clamp()` fluid type, `overflow: hidden` clipping,
  `z-index` stacking, the centre-via-translate idiom, media queries.

## Concepts to learn here

- The **positioned-ancestor** relationship: `position: relative` on a parent is
  what makes `position: absolute` children fill/anchor to it. This single rule
  underpins the entire HomeMashup layout (the scene SVG, readout, pills all
  depend on it).
- `inset: 0` as the "fill my parent" pattern.
- `calc()` + `dvh` + a JS-published CSS variable to size to "viewport minus
  header" robustly, including on mobile.
- `clamp()` for fluid, media-query-free responsive font sizing.
- Layering an overlay with `z-index` + `pointer-events: none` instead of
  reflowing the layout.
- The full z-index stack across this folder: canvas (~0) < headline (4) <
  readout (5) < pills (6).

## How to edit it safely

- **Resize the stage:** adjust the `calc()` in `.stage`. If the header height
  changes, prefer fixing the JS that publishes `--header-h` over hard-coding the
  fallback — the fallback is only a first-paint guess.
- **Reposition the headline:** edit `.headlineTop`'s `top` (and the mobile
  override). Keep `pointer-events: none` or it will start eating clicks meant
  for the animation/pills.
- **Change the layering:** if you alter any `z-index`, re-check the whole stack
  (canvas/headline/readout/pills) so the pills stay clickable on top and the
  headline stays above the canvas.
- **Gotcha — never remove `position: relative` from `.stage`.** Doing so
  un-anchors every absolutely-positioned descendant; the scene SVG, readout and
  pills would jump to the viewport. This is the load-bearing line in the file.
- **Gotcha — the inset modifier is conditional.** `.canvasAreaInset` only
  applies when `HomeMashup` is rendered with `showHeadline`. Test both states
  (home page = no headline; ConceptView = headline) after layout changes.
- **Gotcha — class name coupling.** Renaming a class here requires updating the
  matching `styles.*` reference in `HomeMashup.tsx`; a missing CSS-Module class
  is silently `undefined`, not an error.
