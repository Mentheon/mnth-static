# `src/components/StrandDetail/MetaRow/MetaItem.module.css`

## What this file is

The two-rule **CSS Module** paired with [`MetaItem.tsx`](./MetaItem.tsx.md). It
produces the "faint mono label / bold value below it" stacked pair.

## Line-by-line / block walkthrough

```css
.item {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  color: rgba(47, 1, 71, 0.55);
  line-height: 1.3;
}
```

Styles the wrapper `<div>` (which directly contains the label text). This is the
recurring **"small label" design idiom** of this folder: monospace, small,
slightly letter-spaced, translucent plum (`#2F0147` at 55%). The label text
inherits all of this.

```css
.value {
  display: block;
  color: #2F0147;
  font-weight: 700;
  font-size: 0.85rem;
  margin-top: 0.15rem;
  letter-spacing: 0.04em;
}
```

Styles the `<strong>`. The key declaration is `display: block`: `<strong>` is
inline by default, so without this the value would sit *next to* the label on
the same line. `block` forces it onto its **own line** under the label,
producing the stacked pair. It is fully opaque plum and bold to contrast with
the faint label above it. `margin-top: 0.15rem` is the small gap between the two
lines.

## Libraries & APIs used

- Plain CSS as a **CSS Module**.

## Concepts to learn here

- **`display: block` to stack an inline element** — turning a `<strong>` into
  its own line is the entire layout trick here.
- The shared **label-text recipe** (mono + small + letter-spacing + translucent
  plum) you will recognise from the breadcrumb, kicker, section titles, and
  beacon label across this folder.

## How to edit it safely

- Want label and value side-by-side instead of stacked? Change `.value` from
  `display: block` to `inline` (and adjust spacing) — or make `.item` a flex
  column for explicit control.
- Keep the colour pair (faint label / solid value) for the established visual
  hierarchy; it mirrors `MetaItem`'s intent.
- Cross-reference: classes consumed in [`MetaItem.tsx`](./MetaItem.tsx.md);
  arranged into a row by
  [`StrandMetaRow.module.css`](./StrandMetaRow.module.css.md).
