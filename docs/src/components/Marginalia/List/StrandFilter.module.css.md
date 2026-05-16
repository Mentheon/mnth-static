# `src/components/Marginalia/List/StrandFilter.module.css`

## What this file is

The **scoped stylesheet** for the filter chip strip,
[`StrandFilter.tsx`](./StrandFilter.tsx.md). It styles the wrapping
flex strip, the pill chips (inactive outline vs active filled-crimson),
their hover state, and the small count badge.

## Line-by-line / block walkthrough

```css
/* StrandFilter — pill-style chip strip above the article grid.
   Inactive chips are outline ink-soft; active is filled crimson with
   cream type. Count badge sits to the right of the label, dimmer. */
```

A header comment summarising the design intent — useful orientation
before reading the rules.

```css
.strip {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin: 0 0 2rem;
}
```

The `<nav>` container.

- `display: flex` — lay the chips out in a horizontal row.
- `flex-wrap: wrap` — **critical for responsiveness**: when the chips
  exceed the available width they *wrap onto the next line* instead of
  overflowing or shrinking. This is how the strip stays usable on narrow
  screens with **no media query** needed.
- `gap: 0.6rem` — even spacing between chips, including across wrapped
  rows (flex `gap` applies between both rows and columns of wrapped
  items). Bottom margin separates the strip from the grid below.

```css
.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.95rem;
  border-radius: 999px;
  border: 1px solid rgba(47, 1, 71, 0.2);
  background: transparent;
  text-decoration: none;
  font-family: 'Lato', sans-serif;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--ink);
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;
}
```

Each chip (an `<a>`).

- `display: inline-flex; align-items: center; gap: 0.5rem` — lay the
  label and the count badge on one centred row with a small gap.
- `border-radius: 999px` — the **pill trick**: an absurdly large radius
  is clamped by the browser to a perfect half-height (fully rounded)
  capsule regardless of the chip's actual size. Easier than computing
  the exact radius.
- `border: 1px solid rgba(47, 1, 71, 0.2)` — faint outline for the
  default (inactive) state.
- `background: transparent` — inactive chips are outline-only.
- `text-decoration: none` — it's an `<a>`, so kill the link underline.
- `transition: background-color, border-color, color (0.18s)` — declared
  on the base rule so both hover-in and active-state changes animate
  smoothly.

```css
.chip:hover {
  background: rgba(47, 1, 71, 0.04);
  border-color: var(--ink);
}
```

Hover (only on chips that aren't active — see specificity note next): a
barely-there tint and a darker border, signalling interactivity.

```css
.chipActive,
.chipActive:hover {
  background: var(--crimson);
  border-color: var(--crimson);
  color: var(--bg);
}
```

The **active** chip (the component adds `styles.chipActive` when
`isActive`). Filled crimson with cream (`--bg`) text — a strong selected
state.

Note the grouped selector `.chipActive, .chipActive:hover`: it applies
the *same* crimson treatment whether or not the active chip is hovered.
This deliberately **overrides the `.chip:hover` rule** for the active
chip so it doesn't flicker to the faint hover tint when you mouse over
the currently-selected filter. A neat lesson in using a grouped selector
to neutralise an inherited hover.

```css
.label { line-height: 1; }

.count {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  opacity: 0.55;
}
.chipActive .count { opacity: 0.85; }
```

- `.label` — `line-height: 1` removes extra vertical leading so the text
  sits tight and vertically centred against the count badge.
- `.count` — the article-count number: small, monospace, dimmed to 55%
  opacity so it reads as secondary metadata.
- `.chipActive .count` — a descendant selector: inside an *active* chip,
  bump the count to 85% opacity so it stays legible against the crimson
  fill. Another example of contextual override based on the parent's
  state class.

## Libraries & APIs used

- **Plain CSS** as a **CSS Module**.
- **Flexbox** (`flex-wrap`, `gap`, `inline-flex`, `align-items`).
- **CSS transitions**, **pseudo-classes** (`:hover`).
- **CSS variables** (`--crimson`, `--bg`, `--ink`).

## Concepts to learn here

- **`flex-wrap: wrap` + `gap`** for a self-wrapping toolbar/chip strip
  that needs no media query to stay usable on narrow screens.
- **The pill idiom**: `border-radius: 999px` for a fully-rounded
  capsule of any size.
- **State styling with a modifier class** (`.chipActive`) set from the
  component, not from a pseudo-class — because "selected" is application
  state, not pointer state.
- **Grouped selectors to override inherited hover**
  (`.chipActive, .chipActive:hover`) so the selected chip ignores the
  hover tint.
- **Contextual overrides via parent state class**
  (`.chipActive .count`).
- **Declaring `transition` on the base rule** so changes animate both
  directions.

## How to edit it safely

- **Recolour the active chip**: edit the `.chipActive` group. Keep both
  `.chipActive` *and* `.chipActive:hover` in the selector list, or the
  active chip will revert to the faint `.chip:hover` look when hovered.
- **Change chip shape/size**: tweak `padding` and keep `border-radius:
  999px` for the pill (or set a specific radius for a softer rectangle).
- **Adjust spacing/wrapping**: change `.strip`'s `gap`; keep
  `flex-wrap: wrap` unless you deliberately want a single
  non-wrapping row (which would overflow on mobile).
- **The "active" state is driven by the component**, not CSS — the
  selected chip gets `styles.chipActive` from
  [`StrandFilter.tsx`](./StrandFilter.tsx.md)'s `isActive` logic. To
  change *when* a chip is active, edit the TSX, not this file.
- **Class renames** must mirror
  [`StrandFilter.tsx`](./StrandFilter.tsx.md) (CSS Modules fail silently
  on a name mismatch — you'd get an unstyled chip with no error).
- Paired file: [`StrandFilter.tsx`](./StrandFilter.tsx.md).
