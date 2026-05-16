# `src/components/StrandDetail/Progress/ProgressTimeline.module.css`

## What this file is

The **CSS Module** paired with
[`ProgressTimeline.tsx`](./ProgressTimeline.tsx.md). Its standout feature is the
**slide-open disclosure transition**: how a panel animates from collapsed to
expanded using `max-height` + `opacity`, driven by a class toggled from React
state. It also styles the panel's inner padding/divider, the section title, and
sizes the SVG.

## Line-by-line / block walkthrough

```css
.panel {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-height 0.5s ease, opacity 0.4s ease 0.1s, margin 0.4s ease;
  margin-top: 0;
  margin-bottom: 0;
}
```

The collapsed state (always present; the TSX adds `.open` to expand).

- `max-height: 0; overflow: hidden` — the classic **"animate height open"
  trick.** You cannot CSS-transition `height: auto` (the browser can't
  interpolate to/from an unknown value). Instead the panel transitions
  `max-height` between `0` and a number larger than the content will ever be;
  `overflow: hidden` clips the content while collapsed so nothing shows at
  height 0.
- `opacity: 0` — also faded out while collapsed.
- `transition: max-height 0.5s ease, opacity 0.4s ease 0.1s, margin 0.4s ease`
  — three coordinated transitions. The `opacity`'s third value `0.1s` is a
  **transition-delay**: opacity starts fading in 0.1s *after* the height begins
  expanding, so the content does not appear before there is room for it (and on
  collapse it fades before height shrinks). Thoughtful sequencing makes a
  `max-height` open feel intentional rather than janky.
- `aria-hidden` is set in the TSX when collapsed, so this isn't only a visual
  hide.

```css
.panel.open {
  max-height: 700px;
  opacity: 1;
  margin-top: 2rem;
  margin-bottom: 1rem;
}
```

The expanded state, applied when the TSX adds the `.open` class (because
`expanded` from the shared `useDisclosure` is true). `max-height: 700px` must be
**comfortably larger than the tallest content** (the 460px SVG plus title/
padding/margins) — if it were too small the content would clip. The margins
expand too, animated for a smooth push of the content below. Because `.panel`
declared the transitions, simply *adding this class* triggers the open
animation; removing it reverses it. This **state→class→CSS-transition** pattern
recurs across the folder (beacon chevron, tooltip fade).

```css
.inner {
  position: relative;
  padding: 2rem 0 1rem;
  border-top: 1px solid rgba(47, 1, 71, 0.15);
}
```

The inner wrapper. `position: relative` is **load-bearing**: the
[`ProgressBranchTooltip`](./ProgressBranchTooltip.tsx.md) is `position:
absolute` and is positioned relative to the container the timeline measures with
`getBoundingClientRect`; this establishes that positioning context. The solid
plum hairline `border-top` separates the timeline from the meta row above
(another instance of the folder's divider motif).

```css
.title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #9C528B;
  font-weight: 700;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.8em;
}

.title::before {
  content: '';
  display: inline-block;
  width: 28px;
  height: 1px;
  background: #9C528B;
}
```

The "Progress · expanded" `<h2>`. Same mono/uppercase/letter-spaced **label
idiom** as `SectionTitle`, in mauve `#9C528B`. The `::before`
**pseudo-element** draws a 28px decorative tick line *before* the text
(`content: ''` with a fixed width/height background) — a generated-content
flourish that needs no extra markup. This exact tick pattern is reused in
[`SectionTitle.module.css`](../Sections/SectionTitle.module.css.md).

```css
.svg {
  width: 100%;
  height: 460px;
  display: block;
  overflow: visible;
}

@media (max-width: 880px) {
  .svg { height: 540px; }
}
```

The SVG element. `height: 460px` matches `VBH = 460` in the TSX so the viewBox
maps cleanly. `overflow: visible` lets the pulsing current-phase circle (which
grows beyond its base radius) and any labels near the edges render outside the
viewBox box without clipping. On narrow screens the height *increases* to 540px:
the diagram is squeezed horizontally so it needs more vertical room for the
labels not to collide — a deliberate responsive adjustment paired with the SVG's
`preserveAspectRatio`.

## Libraries & APIs used

- Plain CSS as a **CSS Module**: the `max-height` + `opacity` disclosure
  transition with a staggered `transition-delay`, `::before` pseudo-element,
  Flexbox, `@media`, `overflow`.

## Concepts to learn here

- **Animating a panel open with `max-height`** (because `height: auto` can't
  transition) + `overflow: hidden`, and **staggering `opacity` with
  `transition-delay`** for polish.
- **State→class→transition**: React owns the boolean, CSS owns the motion (same
  idea as the beacon chevron and tooltip fade).
- **`position: relative` as a positioning context** for an absolutely-positioned
  descendant (the tooltip).
- **`::before` decorative content** without extra DOM.
- Matching CSS pixel height to the SVG viewBox; responsive height bump.

## How to edit it safely

- If the timeline content can ever exceed **700px**, raise `.panel.open
  max-height` or it will be clipped. Keep it generously above the real content
  height (don't try to make it exact — over-estimate). If you change `VBH` or
  `.svg` height, recheck this.
- Keep `.svg { height }` in sync with `VBH` in
  [`ProgressTimeline.tsx`](./ProgressTimeline.tsx.md) (currently both 460), and
  revisit the 880px override if you change the aspect ratio.
- Do not remove `position: relative` from `.inner` — the
  [`ProgressBranchTooltip`](./ProgressBranchTooltip.tsx.md) positioning math
  assumes the container it measures against is this element.
- The open/close animation is triggered purely by the `.open` class the TSX
  toggles from `expanded`; don't add JS height calculations — the
  `max-height` approach is intentional.
- Cross-refs: [`ProgressTimeline.tsx`](./ProgressTimeline.tsx.md),
  [`ProgressBranchTooltip.tsx`](./ProgressBranchTooltip.tsx.md); the title tick
  matches [`SectionTitle.module.css`](../Sections/SectionTitle.module.css.md).
