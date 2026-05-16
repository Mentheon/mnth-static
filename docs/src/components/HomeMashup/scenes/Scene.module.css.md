# `src/components/HomeMashup/scenes/Scene.module.css`

## What this file is

The **shared canvas frame for every vignette**. There is exactly one rule —
`.canvas` — and *every* scene component (`HelixScene`, `EcgScene`, …) imports
this same module and applies `styles.canvas` to its root `<svg>`. It is the
visual common denominator of the scene contract described in
`types.ts.md` / `HomeMashup.tsx.md`.

## Line-by-line / block walkthrough

```css
.canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  display: block;
}
```

- **`position: absolute; inset: 0`** — `inset: 0` is shorthand for
  `top/right/bottom/left: 0`. Because the scene's `<svg>` is dropped inside
  `.canvasArea` (which is itself absolutely positioned and filling `.stage` —
  see `HomeMashup.module.css.md`), this makes the SVG **fill its container
  edge-to-edge**. So every scene draws across the entire stage.
- **`width: 100%; height: 100%`** — belt-and-braces sizing alongside `inset: 0`,
  and it gives the SVG a concrete box to scale its `viewBox` into. Each scene's
  SVG declares `viewBox="0 0 800 520"` with `preserveAspectRatio="xMidYMid meet"`,
  meaning the 800×520 coordinate system is scaled to *fit inside* this 100%×100%
  box, centred, preserving aspect ratio (letterboxed if the box's ratio differs).
  Scenes therefore do all their maths in fixed 800×520 coordinates and CSS
  handles fitting that to any screen — a clean separation.
- **`pointer-events: none`** — the animation is decorative; mouse/touch passes
  straight through to whatever is behind/around it. This is essential so the
  carousel pills (which sit *above* in z-index) remain clickable and the
  animation never traps clicks.
- **`display: block`** — `<svg>` is `inline` by default, which adds a few pixels
  of phantom descender space below it (inline elements reserve room for text
  descenders). `display: block` removes that gap so the SVG sits flush.

## Libraries & APIs used

- **CSS Modules** — one shared module imported by every scene; `styles.canvas`
  is the single exported class.
- **CSS** — absolute positioning with `inset`, percentage sizing,
  `pointer-events`, `display: block`.
- Works in tandem with **SVG `viewBox` + `preserveAspectRatio`** declared in
  each scene's markup.

## Concepts to learn here

- A *single shared stylesheet* used by many components — the CSS half of the
  scene contract. Every scene looks/positions identically because they all wear
  this one class.
- `position: absolute; inset: 0` = "fill my (positioned) parent".
- Why decorative full-bleed overlays use `pointer-events: none`.
- The `display: block` fix for the inline-SVG descender gap.
- How fixed `viewBox` coordinates + `preserveAspectRatio` let scene code use
  constant 800×520 maths regardless of real pixel size.

## How to edit it safely

- **This file affects every scene at once.** A change here is global — great for
  consistency, dangerous for surprises. Verify against several scenes after any
  edit.
- **Make scenes interactive (rare):** you'd remove `pointer-events: none`, but
  then the SVG would sit above the canvas and could block the pills depending on
  z-index. Almost always the wrong move for this decorative carousel.
- **Add a shared frame style** (e.g. a subtle inset shadow on every scene): add
  it here rather than to each scene file — that's the point of a shared module.
- **Gotcha:** don't give `.canvas` a background; scenes assume the stage's
  `var(--bg)` shows through transparent SVG. A background here would hide the
  themed stage colour behind every vignette.
- **Gotcha:** removing `inset: 0` (or the parent's `position`) collapses every
  scene to zero/auto size — nothing would render. The fill behaviour depends on
  the positioned-ancestor chain documented in `HomeMashup.module.css.md`.
