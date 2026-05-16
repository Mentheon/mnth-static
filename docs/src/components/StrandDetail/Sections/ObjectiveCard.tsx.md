# `src/components/StrandDetail/Sections/ObjectiveCard.tsx`

## What this file is

A single **objective card**: a bold "verb" line over a description, with a
small zero-padded number badge in the corner. It is the leaf rendered by
[`ObjectivesSection`](./ObjectivesSection.tsx.md) for each objective. It also
demonstrates a neat **CSS-via-`data-` attribute** trick for the badge number.

## Line-by-line / block walkthrough

```tsx
import type { ObjectiveItem } from '../../../data/strands'
import styles from './ObjectiveCard.module.css'
```

The data type (`{ verb, text }`) and paired CSS Module
([`ObjectiveCard.module.css`](./ObjectiveCard.module.css.md)).

```tsx
export interface ObjectiveCardProps {
  item: ObjectiveItem
  index: number
}
```

`item` is the objective; `index` is its position (passed explicitly by the
parent, not just used as a React key — it drives the displayed number).

```tsx
export default function ObjectiveCard({ item, index }: ObjectiveCardProps) {
  const num = String(index + 1).padStart(2, '0')
```

Compute the badge text from `index`. `index` is 0-based, so `index + 1` is the
human number; `String(...)` converts it; **`.padStart(2, '0')`** left-pads to a
minimum of 2 characters with `'0'` — so `1 → "01"`, `10 → "10"`. This produces
the consistent `01, 02, …` formatting.

```tsx
  return (
    <div className={styles.card} data-num={num}>
      <p className={styles.verb}>{item.verb}</p>
      <p className={styles.text}>{item.text}</p>
    </div>
  )
}
```

- `data-num={num}` — a **custom `data-*` attribute**. Notice the number is *not*
  rendered as a JSX child; instead it is stashed on the element as data. The
  paired CSS reads it with `content: attr(data-num)` in a `::before`
  pseudo-element to display it. The source comment explains *why*: it mirrors
  the reference HTML's CSS counter, but using an explicit attribute means the
  shown number depends on the data/`index`, not on the element's DOM position
  (a CSS `counter` would renumber if cards moved). This is a great example of
  **passing data from JS into CSS via an attribute**.
- The two `<p>`s are the verb (styled bold/small-caps in CSS) and the
  description. Markup stays minimal; all the styling and the corner accent live
  in the CSS Module.

## Libraries & APIs used

- **React**: function component, derived value, `data-*` attribute as a CSS
  data channel.
- **JavaScript**: `String()`, `String.prototype.padStart`.
- **CSS Modules** (badge rendered via `attr()` in the paired CSS).

## Concepts to learn here

- **`padStart` for zero-padded numbering** (`"01"`, `"02"`).
- **`data-*` attribute → CSS `attr()`**: a clean way to feed a value computed in
  JS into a CSS-generated pseudo-element, decoupling display from DOM order
  (contrast with a pure CSS `counter`).
- **Leaf component**: minimal markup, presentation pushed to CSS.

## How to edit it safely

- Objective content is data — edit `strand.objectives` (`{ verb, text }`) in
  `src/data/strands.ts`.
- The numbering follows `index` (render order, supplied by
  [`ObjectivesSection`](./ObjectivesSection.tsx.md)). If you need it to follow
  some other order, change what `index`/`num` is computed from here.
- The badge is rendered by `::before { content: attr(data-num) }` in
  [`ObjectiveCard.module.css`](./ObjectiveCard.module.css.md) — if you remove
  `data-num` here, the badge disappears there. Keep them in sync.
- Card visuals/hover (corner accent, lift on hover) live in the paired CSS.
- Cross-refs: [`ObjectivesSection.tsx`](./ObjectivesSection.tsx.md),
  [`ObjectiveCard.module.css`](./ObjectiveCard.module.css.md).
