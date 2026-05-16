# `src/components/StrandDetail/Header/StrandDetailHeader.tsx`

## What this file is

The **header block** of the strand-detail card: the round icon badge plus the
text column (kicker line, big name, italic tagline). Crucially it also accepts
`children` and renders them at the bottom of the text column — that is the slot
into which [`StrandDetail.tsx`](../StrandDetail.tsx.md) injects the meta row and
the progress timeline. The header itself stays **purely presentational**: it
knows about a `Strand`, not about beacons or timelines.

## Line-by-line / block walkthrough

```tsx
import type { ReactNode } from 'react'
import type { Strand } from '../../../data/strands'
import StrandIcon from '../../StrandIcon'
import styles from './StrandDetailHeader.module.css'
```

- `ReactNode` is the TypeScript type for "anything React can render": elements,
  strings, numbers, arrays, `null`, etc. It is the standard type for a
  `children` prop.
- `Strand` — the data shape (type-only import).
- `StrandIcon` — a shared component from elsewhere in the codebase
  (`src/components/StrandIcon`); it draws the per-strand glyph. We do not
  document it here, but note it takes a `strandId` and a `color`.
- `styles` — paired CSS Module
  ([`StrandDetailHeader.module.css`](./StrandDetailHeader.module.css.md)).

```tsx
export interface StrandDetailHeaderProps {
  strand: Strand
  // The meta-row + expanded progress timeline are composed in as
  // children so the header itself stays purely presentational.
  children?: ReactNode
}
```

Props: the `strand`, and **optional `children`** typed as `ReactNode`. The
comment states the design intent: the header is a frame, not a coordinator. By
accepting `children` it does not need to import or know about `StrandMetaRow` /
`ProgressTimeline` — the parent decides what goes there.

```tsx
export default function StrandDetailHeader({ strand, children }: StrandDetailHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.iconWrap} aria-hidden="true">
        <StrandIcon strandId={strand.id} color="#FFECE1" />
      </div>
```

- `<header>` is the **semantic** element for introductory content.
- `.iconWrap` is the circular plum badge (styled in the CSS). `aria-hidden="true"`
  because the icon is decorative — the strand name beside it carries the
  meaning.
- `<StrandIcon strandId={strand.id} color="#FFECE1" />` composes another
  component, passing the strand's id (so it picks the right glyph) and the cream
  colour so the icon contrasts on the plum circle.

```tsx
      <div className={styles.text}>
        {strand.kicker && (
          <div className={styles.kicker}>
            <span className={styles.kickerDot} aria-hidden="true" />
            {strand.kicker}
          </div>
        )}
```

The text column. `{strand.kicker && (...)}` — conditional `&&` rendering again:
only show the kicker line if the data has one (`kicker?` is optional;
`'strand · 03 of 06 · in progress'` for the `kindred` strand). Inside it, a
small `<span class={styles.kickerDot}>` is a decorative pulsing dot (the CSS
animates it) followed by the kicker text.

```tsx
        <h1 className={styles.name}>{strand.label}</h1>
        <p className={styles.tagline}>{strand.tagline}</p>
        {children}
      </div>
    </header>
  )
}
```

- `<h1>` is the page's main heading — the strand's display label (e.g.
  "Kindreon"). There should be exactly one `<h1>` per page; this is it.
- `<p class={styles.tagline}>` the italic one-liner.
- `{children}` — **the composition slot.** Whatever JSX the parent put between
  `<StrandDetailHeader>…</StrandDetailHeader>` renders here. In this app that is
  `<StrandMetaRow>` (with the beacon inside it) and `<ProgressTimeline>`. The
  header neither knows nor cares.

## Libraries & APIs used

- **React**: function component, `children` prop typed as `ReactNode`, `&&`
  conditional rendering, component composition (`StrandIcon`).
- **CSS Modules**.
- Semantic HTML (`<header>`, `<h1>`).

## Concepts to learn here

- **`children` as a generic slot** + `ReactNode` typing — the key technique that
  keeps this component decoupled from the meta row and timeline.
- **Decorative vs meaningful content**: `aria-hidden` on the icon wrapper and
  kicker dot; the real heading is the `<h1>`.
- **Composing third-party/shared components** (`StrandIcon`) by passing data and
  styling via props.
- One `<h1>` per page for document structure / accessibility.

## How to edit it safely

- To add another piece of header text (e.g. a status badge), add it to the
  `.text` div and drive it from an optional `Strand` field — keep it
  data-driven and guarded with `&&` like `kicker`.
- Do **not** import `StrandMetaRow`/`ProgressTimeline` here to "tidy up" the
  composition; the `children` slot is intentional. Coordinating those lives in
  [`StrandDetail.tsx`](../StrandDetail.tsx.md).
- The kicker dot's animation is defined in the paired CSS and disabled under
  reduced motion there — change motion in the CSS, not here.
- Cross-reference: layout/animation in
  [`StrandDetailHeader.module.css`](./StrandDetailHeader.module.css.md); parent
  composition in [`StrandDetail.tsx`](../StrandDetail.tsx.md); the injected
  children are [`StrandMetaRow`](../MetaRow/StrandMetaRow.tsx.md) and
  [`ProgressTimeline`](../Progress/ProgressTimeline.tsx.md).
