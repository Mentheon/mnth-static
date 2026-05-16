# `src/components/StrandDetail/MetaRow/StrandMetaRow.tsx`

## What this file is

The horizontal **metadata strip** under the header text: it renders up to three
[`MetaItem`](./MetaItem.tsx.md)s (since / collaborators / phase) and then a
`children` slot. In this app the child is the
[`ProgressBeacon`](../Progress/ProgressBeacon.tsx.md) — so the clickable
progress summary visually lives at the end of the meta row, while this component
stays decoupled from it (same `children`-slot pattern as the header).

## Line-by-line / block walkthrough

```tsx
import type { ReactNode } from 'react'
import type { StrandMeta } from '../../../data/strands'
import MetaItem from './MetaItem'
import styles from './StrandMetaRow.module.css'
```

- `ReactNode` for the `children` type.
- `StrandMeta` is the `{ since?, collaborators?, phase? }` shape (type-only
  import; see `src/data/strands.ts`). Every field is optional.
- `MetaItem` leaf + paired CSS Module
  ([`StrandMetaRow.module.css`](./StrandMetaRow.module.css.md)).

```tsx
export interface StrandMetaRowProps {
  meta?: StrandMeta
  // The beacon (or any other inline disclosure trigger) is composed in
  // as a child so this row stays presentational.
  children?: ReactNode
}
```

`meta` is **optional** (a strand may have none), and `children` is the
composition slot. The comment again states intent: the row does not import the
beacon; the parent injects it.

```tsx
export default function StrandMetaRow({ meta, children }: StrandMetaRowProps) {
  return (
    <div className={styles.row}>
      {meta?.since         && <MetaItem label="since"         value={meta.since}         />}
      {meta?.collaborators && <MetaItem label="collaborators" value={meta.collaborators} />}
      {meta?.phase         && <MetaItem label="phase"         value={meta.phase}         />}
      {children}
    </div>
  )
}
```

Three near-identical lines, each combining two techniques:

- **Optional chaining** `meta?.since` — if `meta` is `undefined`, the whole
  expression is `undefined` (no crash) instead of throwing on
  `undefined.since`. This is why `meta` can safely be optional.
- **`&&` conditional rendering** — `meta?.since && <MetaItem .../>` renders the
  item only when that specific field exists. So a strand with only `phase` set
  shows just one item; the missing ones simply don't render. (Subtle gotcha
  worth knowing: `&&` with a value like `0` or `''` would render the falsy
  value; here all fields are non-empty strings or absent, so it is safe — see
  "How to edit it safely.")
- The label text is hardcoded (`"since"`, …) while the value comes from data —
  `MetaItem` is intentionally generic, so the *meaning* is assigned here.
- `{children}` renders the injected beacon last, after the data items.

## Libraries & APIs used

- **React**: `children` slot (`ReactNode`), `&&` conditional rendering.
- **JavaScript**: optional chaining (`?.`).
- **CSS Modules**.

## Concepts to learn here

- **Optional chaining + `&&`** as the standard "render this only if the optional
  data exists" pattern, used field-by-field.
- **`children` as a composition slot** (same decoupling idea as
  [`StrandDetailHeader`](../Header/StrandDetailHeader.tsx.md)) — the beacon is
  injected, not imported.
- **Assigning meaning at the right level**: generic `MetaItem` + specific labels
  here.

## How to edit it safely

- To add a meta field (e.g. `funding`): add `funding?` to `StrandMeta` in
  `src/data/strands.ts`, then add one line here mirroring the others.
- **Gotcha**: if a future meta value could be the number `0`, `meta?.count && …`
  would render `0`. Use an explicit check (`meta?.count != null && …`) for
  numeric fields. The current string fields are safe.
- Do not import the beacon here; keep the row presentational. Wiring lives in
  [`StrandDetail.tsx`](../StrandDetail.tsx.md).
- Row layout (gap, the dashed top border, wrapping) is in
  [`StrandMetaRow.module.css`](./StrandMetaRow.module.css.md); each pair's look
  is in [`MetaItem.module.css`](./MetaItem.module.css.md).
