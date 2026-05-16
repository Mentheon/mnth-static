# `src/components/StrandDetail/Header/StrandDetailHeader.module.css`

## What this file is

The **CSS Module** paired with
[`StrandDetailHeader.tsx`](./StrandDetailHeader.tsx.md). It builds the
two-column header layout (icon | text), the circular icon badge, the typographic
scale of the name/tagline, and — the teaching highlight — a **CSS keyframe
animation** for the pulsing kicker dot that is correctly disabled under
`prefers-reduced-motion`.

## Line-by-line / block walkthrough

```css
.header {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 2.5rem;
  align-items: start;
  padding-bottom: 2.5rem;
  border-bottom: 1px solid rgba(47, 1, 71, 0.15);
  margin-bottom: 2.5rem;
}
```

A **CSS Grid** with two columns: a fixed `160px` track for the icon and `1fr`
("one fraction" — take the remaining space) for the text. `gap: 2.5rem` spaces
the columns; `align-items: start` top-aligns them so the text starts level with
the top of the icon. The bottom border + margin form the divider beneath the
header. The translucent plum `rgba(47,1,71,0.15)` border is the same hairline
used throughout the folder.

```css
.iconWrap {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: #2F0147;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(47, 1, 71, 0.18);
  flex-shrink: 0;
}
```

The circular badge. `border-radius: 50%` on an equal width/height makes a
perfect circle. It is itself a flex container that centres its child (the icon)
both axes. `box-shadow` gives it a soft drop shadow. `flex-shrink: 0` would only
matter if it were a flex item, but it documents intent that the badge must not
shrink.

```css
.iconWrap > * {
  width: 70%;
  height: 70%;
  display: block;
}
```

`> *` is the **direct-child universal selector**: whatever single element
`StrandIcon` renders, force it to 70% of the badge so the glyph sits inset with
breathing room. `display: block` removes the inline-element baseline gap.

```css
.text { min-width: 0; }
```

A subtle but important **Grid/Flex gotcha fix**. By default a grid/flex item has
`min-width: auto`, meaning it refuses to shrink below its content's intrinsic
width — long unbreakable text can then blow out the layout. `min-width: 0`
allows the text column to shrink and wrap properly inside its `1fr` track.

```css
.kicker {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #A30B37;
  font-weight: 700;
  margin-bottom: 0.6rem;
  display: flex;
  align-items: center;
  gap: 0.5em;
}
```

The kicker line. Same monospace/uppercase/letter-spaced "label" idiom seen
across the folder, here in crimson and bold. It is a flex row so the dot and
text sit on one centred line with a `0.5em` gap.

```css
.kickerDot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #A30B37;
  animation: kickerDot 2s ease-in-out infinite;
}
```

A 6px crimson circle. The key line is `animation: kickerDot 2s ease-in-out
infinite` — the **`animation` shorthand**: run the `@keyframes` named
`kickerDot`, each cycle `2s`, with an `ease-in-out` timing curve, repeating
`infinite`ly.

```css
@keyframes kickerDot {
  0%, 100% { opacity: 0.35; transform: scale(1); }
  50%      { opacity: 1;    transform: scale(1.2); }
}
```

A **`@keyframes` rule** defines the animation's stops. At `0%` and `100%` (start
and end of each cycle) the dot is dim and normal size; at `50%` (midpoint) it is
fully opaque and scaled up 20%. The browser interpolates between these stops,
producing a gentle "breathing" pulse. Listing `0%, 100%` together gives a
symmetric loop (fade in then back out). This is the **pure-CSS** way to loop an
animation — contrast with the JS-driven loops in
[`Progress/usePulse.ts`](../Progress/usePulse.ts.md), which exist because those
animate SVG attributes anime.js can sequence with the entrance timeline.

```css
.name {
  font-family: 'Lato', sans-serif;
  font-size: clamp(2rem, 4vw, 3.4rem);
  font-weight: 900;
  color: #2F0147;
  line-height: 1.05;
  letter-spacing: -0.015em;
  margin: 0 0 0.5rem;
}
```

The `<h1>`. The interesting part is `font-size: clamp(2rem, 4vw, 3.4rem)` —
**fluid typography**. `clamp(MIN, PREFERRED, MAX)` picks the preferred value
(`4vw` = 4% of viewport width, so it scales with screen size) but never below
`2rem` or above `3.4rem`. One line replaces several media-query font-size
overrides. Negative `letter-spacing` tightens a large bold heading (a common
typographic refinement).

```css
.tagline {
  font-size: 1.15rem;
  font-style: italic;
  color: #2F0147;
  opacity: 0.7;
  margin: 0;
  max-width: 50ch;
}
```

The italic subtitle. `max-width: 50ch` caps the line length at ~50 characters
(`ch` ≈ width of a "0") for comfortable reading — a typographic best practice.

```css
@media (max-width: 880px) {
  .header { grid-template-columns: 1fr; }
  .iconWrap { width: 100px; height: 100px; }
}
```

Responsive: below 880px the grid collapses to a **single column** (icon stacks
above text) and the badge shrinks to 100px.

```css
@media (prefers-reduced-motion: reduce) {
  .kickerDot { animation: none; opacity: 0.7; }
}
```

**Accessibility.** When the user requests reduced motion, the looping dot
animation is switched off (`animation: none`) and the dot is left at a fixed
mid-opacity so it still looks intentional. This is the **CSS-side** equivalent of
what [`hooks/useReducedMotion.ts`](../hooks/useReducedMotion.ts.md) does for the
JS animations — the app honours the preference from both layers. Always
remember: if you add a `@keyframes` animation, add a matching reduced-motion
override.

## Libraries & APIs used

- Plain CSS as a **CSS Module**: CSS Grid, Flexbox, `@keyframes` + `animation`
  shorthand, `clamp()` fluid type, `@media` (responsive **and**
  `prefers-reduced-motion`), `> *` child selector, `ch`/`vw`/`em`/`rem` units.

## Concepts to learn here

- **CSS keyframe animations** vs CSS transitions vs JS-driven animation (this
  file uses keyframes; [`CTAButton.module.css`](../CTAs/CTAButton.module.css.md)
  uses transitions; [`usePulse.ts`](../Progress/usePulse.ts.md) uses anime.js).
  Knowing which tool to reach for is a core skill.
- **`prefers-reduced-motion` in CSS** — the accessibility counterpart to the JS
  hook.
- **Fluid typography with `clamp()`** to avoid font-size media queries.
- The **`min-width: 0` flex/grid overflow fix** — a classic gotcha.
- Readability constraints: `max-width: 50ch`.

## How to edit it safely

- **Any new looping/keyframe animation must get a matching
  `@media (prefers-reduced-motion: reduce)` override**, or you regress
  accessibility. Follow the `.kickerDot` example.
- To resize the header icon, change both `.iconWrap` width/height and keep them
  equal (the `border-radius: 50%` depends on a square).
- Tune the heading scale via the three `clamp()` arguments rather than adding
  media queries.
- If long single-word strand names overflow, the `.text { min-width: 0 }` line
  is what allows wrapping — don't remove it.
- Cross-reference: classes consumed in
  [`StrandDetailHeader.tsx`](./StrandDetailHeader.tsx.md); palette and the
  label-text idiom are shared with
  [`StrandDetail.module.css`](../StrandDetail.module.css.md) and the MetaRow /
  Sections modules.
