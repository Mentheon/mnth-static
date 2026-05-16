# `src/components/StrandDetail/CTAs/CTAButton.module.css`

## What this file is

The **CSS Module** paired with [`CTAButton.tsx`](./CTAButton.tsx.md). It defines
the shared button look (`.cta`), two colour variants (`.primary`, `.secondary`),
and the hover animation for the trailing arrow. This is a good file to learn
**CSS transitions** and **transforms** from, because they are used minimally and
purposefully.

## Line-by-line / block walkthrough

```css
.cta {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 1rem;
  font-weight: 700;
  padding: 0.85rem 1.6rem;
  text-decoration: none;
  border-radius: 2px;
  transition: background-color 0.2s, color 0.2s, gap 0.2s;
  font-family: 'Lato', sans-serif;
}
```

The shared base, applied to every CTA regardless of variant.

- `display: inline-flex` + `align-items: center` lays the label and arrow on one
  centred row. `gap: 0.6rem` is the space between them — using Flexbox `gap`
  rather than margins.
- `text-decoration: none` removes the default underline (this is an `<a>`).
- `transition: background-color 0.2s, color 0.2s, gap 0.2s;` declares that
  **three specific properties** animate over 0.2s whenever they change. A CSS
  transition means "when this property's value changes (e.g. on `:hover`),
  interpolate to the new value over the given duration instead of jumping."
  Listing properties explicitly (rather than `transition: all`) is good
  practice — it is faster and avoids accidentally animating unrelated changes.
  Animating `gap` is the trick that makes the label/arrow spread apart on hover.

```css
.primary {
  background: #A30B37;
  color: #FFECE1;
}

.primary:hover {
  background: #2F0147;
  gap: 0.9rem;
}
```

The primary variant: crimson background, cream text. On `:hover` it darkens to
plum **and** widens the `gap` from `0.6rem` to `0.9rem`. Because `.cta` declared
`gap` as transitionable, the label and arrow glide apart — a subtle "lean
forward" affordance.

```css
.secondary {
  background: transparent;
  color: #2F0147;
  border: 2px solid #2F0147;
}

.secondary:hover {
  background: #2F0147;
  color: #FFECE1;
}
```

The secondary variant: outlined, transparent fill. On hover it "fills in" —
background becomes plum and text becomes cream (an inversion). Both
`background-color` and `color` are in the transition list, so the fill animates
smoothly.

```css
.arrow {
  transition: transform 0.2s;
  display: inline-block;
}
```

The `<span class={styles.arrow}>→</span>`. `display: inline-block` is required
so that `transform` (which has no effect on a default inline element's layout
box the same way) applies predictably. It has its **own** transition, this time
for `transform`.

```css
.cta:hover .arrow {
  transform: translateX(3px);
}
```

A **descendant hover selector**: when the parent `.cta` is hovered, the nested
`.arrow` shifts 3px to the right via `transform: translateX(3px)`. `transform`
is GPU-friendly and does not trigger layout reflow, making it the preferred way
to do small motion. Combined with the `gap` widening above, hovering a primary
CTA both opens the gap and nudges the arrow — a layered micro-interaction built
from two tiny transitions.

## Libraries & APIs used

- Plain CSS as a **CSS Module**.
- **CSS transitions** (multi-property and single-property), **`transform:
  translateX`**, Flexbox (`inline-flex`, `gap`), `:hover` and descendant
  selectors.

## Concepts to learn here

- **`transition` syntax**: `property duration` pairs, comma-separated; explicit
  property lists over `all`.
- **Animating `gap`** for a spread effect, and **`transform: translateX`** for a
  reflow-free nudge.
- **Layered micro-interactions**: combining two independent small transitions
  (gap + arrow) for a richer hover.
- **Variant classes** sharing a base class.

## How to edit it safely

- If you add a property to a `:hover` rule and want it animated, you must also
  add that property to the relevant `transition` list — otherwise it snaps
  instantly. (E.g. adding `transform` to `.cta:hover` would need `transform` in
  `.cta`'s transition.)
- Keep using `transform` for movement, not `margin`/`left` — those force layout
  and feel janky.
- This component honours reduced motion only implicitly (transitions are brief).
  If you add larger motion here, consider gating it behind
  `@media (prefers-reduced-motion: reduce) { .cta, .arrow { transition: none } }`
  the way [`StrandDetailHeader.module.css`](../Header/StrandDetailHeader.module.css.md)
  disables its pulsing dot.
- Cross-reference: classes consumed in
  [`CTAButton.tsx`](./CTAButton.tsx.md).
