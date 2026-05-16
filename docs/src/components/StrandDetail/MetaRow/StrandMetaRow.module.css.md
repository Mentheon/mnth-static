# `src/components/StrandDetail/MetaRow/StrandMetaRow.module.css`

## What this file is

A one-rule **CSS Module** paired with
[`StrandMetaRow.tsx`](./StrandMetaRow.tsx.md). It lays the meta items (and the
injected beacon) out in a wrapping row separated from the tagline above by a
dashed divider.

## Line-by-line / block walkthrough

```css
.row {
  display: flex;
  gap: 2rem;
  align-items: center;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px dashed rgba(47, 1, 71, 0.15);
  flex-wrap: wrap;
}
```

- `display: flex` + `gap: 2rem` — the `MetaItem`s and the beacon sit in a row,
  2rem apart (Flexbox `gap` again — no per-child margins).
- `align-items: center` — vertically centres items of differing heights (the
  stacked `MetaItem` pairs vs the taller beacon) on a common centre line.
- `margin-top` / `padding-top` — separates the row from the tagline and gives
  breathing room below the divider.
- `border-top: 1px dashed rgba(47,1,71,0.15)` — a **dashed** hairline divider in
  translucent plum. Note the deliberate variety in this folder's dividers: the
  header uses a *solid* hairline, the meta row a *dashed* one, the timeline a
  *solid* one again — small touches that signal "different kind of boundary."
- `flex-wrap: wrap` — on narrow screens the items wrap to multiple lines instead
  of overflowing (responsive with no media query, just like
  [`StrandCTARow`](../CTAs/StrandCTARow.module.css.md)). This matters because the
  beacon has `min-width: 320px` (see
  [`ProgressBeacon.module.css`](../Progress/ProgressBeacon.module.css.md)) and
  will drop to its own line on small screens.

## Libraries & APIs used

- Plain CSS as a **CSS Module**: Flexbox (`flex`, `gap`, `align-items`,
  `flex-wrap`), dashed border.

## Concepts to learn here

- **Flexbox row with `gap` + `flex-wrap`** for a self-adapting strip mixing
  small items and a wide one.
- **`align-items: center`** to reconcile mixed-height flex children.
- Divider style as a **semantic signal** (solid vs dashed) — a design-system
  detail repeated across the folder.

## How to edit it safely

- To make the beacon always sit on its own line, you'd reduce sibling widths or
  add `flex-basis: 100%` to the beacon's class — but note the beacon is injected
  as `children`, so target it via its own module, not here.
- Change the divider feel by editing `border-top` (keep the translucent-plum
  colour for consistency with the rest of the folder).
- Cross-reference: `.row` consumed in
  [`StrandMetaRow.tsx`](./StrandMetaRow.tsx.md); item appearance in
  [`MetaItem.module.css`](./MetaItem.module.css.md); the wide child is the
  [`ProgressBeacon`](../Progress/ProgressBeacon.tsx.md).
