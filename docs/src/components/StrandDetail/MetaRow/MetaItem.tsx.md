# `src/components/StrandDetail/MetaRow/MetaItem.tsx`

## What this file is

The smallest possible **leaf component**: it renders one labelled metadata pair,
e.g.

```
since
OCT 2024
```

(a faint label above a bold value). It is used by
[`StrandMetaRow`](./StrandMetaRow.tsx.md) for the "since / collaborators /
phase" stats.

It is a great first example of how trivially small a React component can — and
sometimes should — be.

## Line-by-line / block walkthrough

```tsx
import styles from './MetaItem.module.css'
```

Just the paired CSS Module ([`MetaItem.module.css`](./MetaItem.module.css.md)).
No data import — this component is data-agnostic; it takes plain strings.

```tsx
export interface MetaItemProps {
  label: string
  value: string
}
```

Two `string` props. No domain types (`Strand` etc.) on purpose — `MetaItem`
could render *any* label/value pair, which makes it reusable and easy to test.

```tsx
export default function MetaItem({ label, value }: MetaItemProps) {
  return (
    <div className={styles.item}>
      {label}
      <strong className={styles.value}>{value}</strong>
    </div>
  )
}
```

- `<div class={styles.item}>` is styled as the small uppercase mono label
  (colour/size come from CSS).
- `{label}` is the bare label text rendered directly as a child.
- `<strong class={styles.value}>{value}</strong>` — `<strong>` is the
  **semantic** element for strong importance; the CSS makes it `display: block`
  so it drops onto its own line beneath the label and renders bolder/darker.
  Using `<strong>` rather than a styled `<span>` adds meaning, not just looks.

That is the whole component. Note there is **no logic at all** — it is a pure
mapping from props to markup, the simplest kind of component.

## Libraries & APIs used

- **React**: function component, JSX children.
- **CSS Modules** (`styles.item`, `styles.value`).
- Semantic HTML: `<strong>`.

## Concepts to learn here

- **Tiny presentational leaf components** with primitive (`string`) props are
  fine and good — not every component needs domain types or logic.
- **Semantic HTML for emphasis** (`<strong>`) instead of a meaningless `<span>`.
- The label/value visual is fully controlled by CSS, keeping the TSX trivial.

## How to edit it safely

- Keep it generic — do not import `Strand`/`StrandMeta` here. The mapping from
  strand data to label/value happens one level up in
  [`StrandMetaRow.tsx`](./StrandMetaRow.tsx.md).
- To change the stacked-pair look (label colour, value weight), edit
  [`MetaItem.module.css`](./MetaItem.module.css.md).
- If a value ever needs to be a link or have an icon, prefer making `value`
  accept `ReactNode` rather than `string`, and update the type accordingly.
- Cross-reference: used by [`StrandMetaRow.tsx`](./StrandMetaRow.tsx.md); styled
  by [`MetaItem.module.css`](./MetaItem.module.css.md).
