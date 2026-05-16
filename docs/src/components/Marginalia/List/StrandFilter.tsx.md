# `src/components/Marginalia/List/StrandFilter.tsx`

## What this file is

The **filter chip strip** above the article grid: a row of pill buttons
("All", "Kindreon", "Aevorix", "Acumentra", …) each showing how many
articles it would yield. Clicking a chip filters the list — and because
each chip is an anchor whose `href` encodes the filter into the URL
hash, filtered views are **deep-linkable and back-button friendly**.

It is rendered by [`MarginaliaList.tsx`](./MarginaliaList.tsx.md), which
also computes the `counts` it displays and passes the `activeStrand`.

## Line-by-line / block walkthrough

```tsx
import { STRANDS } from '../../../data/strands'
import styles from './StrandFilter.module.css'
```

A **value** import of `STRANDS` (the canonical strand list — `{ id,
label, ... }` objects — from `src/data/strands.ts`, cross-referenced)
and the paired CSS Module
([`StrandFilter.module.css`](./StrandFilter.module.css.md)). The chips
are *derived* from `STRANDS`, so adding a strand there automatically
adds a chip here.

```tsx
interface StrandFilterProps {
  /** Currently-active strand id, or null for "All". */
  activeStrand: string | null
  /** Count of articles available under each strand id, plus 'all'. */
  counts: Record<string, number>
}
```

Props:

- `activeStrand: string | null` — which chip is selected (`null` = the
  "All" chip).
- `counts: Record<string, number>` — a string→number map (built by
  `buildCounts` in [`MarginaliaList.tsx`](./MarginaliaList.tsx.md))
  giving the badge number per strand id, plus an `all` key.

The component does **not** compute counts or filter — it is a pure
display of data passed in. Keeping the tally logic in the parent and the
chrome here is a clean separation of concerns.

```tsx
export default function StrandFilter({ activeStrand, counts }: StrandFilterProps) {
  const chips: Array<{ id: string | null; label: string; count: number }> = [
    { id: null, label: 'All', count: counts.all ?? 0 },
    ...STRANDS.map((s) => ({
      id: s.id,
      label: s.label,
      count: counts[s.id] ?? 0,
    })),
  ]
```

Builds a **uniform array of chip descriptors** so the JSX can render
them with one `.map()` instead of special-casing "All".

- The explicit type annotation `Array<{ id: string | null; label:
  string; count: number }>` documents the shape (an array of small
  objects); `Array<T>` is the generic-syntax equivalent of `T[]`.
- The first element is the synthetic **"All"** chip with `id: null` and
  `counts.all ?? 0` (nullish coalescing — fall back to `0` if the key is
  missing).
- `...STRANDS.map((s) => ({...}))` — the **spread operator** `...`
  expands the mapped array's elements *inline* into the literal. So the
  result is `[allChip, kindredChip, vitalisChip, vitrixChip, ...]`. Each
  real strand becomes `{ id, label, count }`.
- `counts[s.id] ?? 0` — bracket lookup of this strand's count, defaulting
  to `0`.

Note the parentheses in `(s) => ({ ... })`: an arrow function returning
an **object literal** must wrap it in `()`, otherwise `{` is parsed as a
function body block, not an object.

```tsx
  return (
    <nav className={styles.strip} aria-label="Filter by strand">
      {chips.map((chip) => {
        const isActive =
          (chip.id === null && activeStrand === null) ||
          (chip.id !== null && chip.id === activeStrand)
        const href = chip.id === null ? '#marginalia' : `#marginalia?strand=${chip.id}`
        return (
          <a
            key={chip.id ?? '__all'}
            className={`${styles.chip} ${isActive ? styles.chipActive : ''}`}
            href={href}
            aria-current={isActive ? 'true' : undefined}
            onClick={(e) => {
              e.preventDefault()
              window.location.hash = href
            }}
          >
            <span className={styles.label}>{chip.label}</span>
            <span className={styles.count} aria-hidden="true">
              {chip.count}
            </span>
          </a>
        )
      })}
    </nav>
  )
}
```

- `<nav aria-label="Filter by strand">` — a semantic navigation
  landmark, labelled so assistive tech distinguishes it from the
  breadcrumb nav.
- `{chips.map((chip) => { ... return (<a .../>) })}` — **list rendering**
  again. Here the callback has a block body (`{ ... }`) so it can
  compute locals before returning JSX.
- `isActive` — boolean: true if this is the "All" chip *and* no strand
  is active, OR this chip's id matches `activeStrand`. The two-part
  condition handles the `null` ("All") case explicitly rather than
  relying on `null === null` falling out of the strand branch.
- `href = chip.id === null ? '#marginalia' : `#marginalia?strand=${chip.id}``
  — "All" links to the bare hash (no query, i.e. no filter); a strand
  chip encodes `?strand=<id>` into the hash. This is what makes a
  filtered list a **shareable URL** and makes the browser Back button
  step through filters.
- `key={chip.id ?? '__all'}` — the **list key**. `chip.id` is the stable
  unique identifier; the "All" chip has `id: null`, so `?? '__all'`
  supplies a stable non-null fallback (a key must be a string/number,
  unique among siblings, and stable across renders). Using the id (not
  the array index) is correct.
- `className={`${styles.chip} ${isActive ? styles.chipActive : ''}`}` —
  template-literal class composition: always `chip`, plus the
  `chipActive` modifier *conditionally* (empty string when inactive).
  Classic "conditional class" idiom.
- `aria-current={isActive ? 'true' : undefined}` — accessibility:
  `aria-current="true"` marks the currently-selected filter for screen
  readers. Setting it to `undefined` when inactive makes React **omit
  the attribute entirely** (rather than render `aria-current="false"`,
  which has different semantics). Knowing that `undefined` removes a
  JSX attribute is a useful detail.
- `onClick` — the same defensive `preventDefault()` +
  `window.location.hash = href` pattern used across Marginalia (cards,
  back links): keep a real `href` for accessibility/no-JS, but drive the
  hash manually so a scroll-snap/overlay ancestor can't swallow it.
- The label span shows `chip.label`; the count span shows `chip.count`
  and is `aria-hidden` (the number is decorative chrome; the label
  already names the filter).

## Libraries & APIs used

- **React** — function component, props, list rendering with keys,
  conditional className/attributes, event handler.
- **TypeScript** — props interface, `Record<string, number>`, explicit
  array-of-object type, nullish coalescing `??`.
- **JavaScript** — spread `...`, `Array.map`, arrow function returning
  an object literal.
- **CSS Modules** — `styles.*`.
- **Browser DOM** — `window.location.hash`, `preventDefault()`.
- Project data — `STRANDS` (`src/data/strands.ts`, cross-ref).

## Concepts to learn here

- **Normalising heterogeneous UI into one list** (synthetic "All" chip +
  spread of real strands) so a single `.map()` renders everything.
- **Spread operator** to flatten a mapped array into a literal; the
  `(s) => ({...})` object-literal-return parenthesis gotcha.
- **List keys** with a stable id and a `?? fallback` for the null case.
- **Conditional className** via template literal + ternary.
- **Conditional attribute via `undefined`** (`aria-current`) — how to
  *omit* an attribute, not just set it false.
- **Deep-linkable filter state encoded in the URL hash** (`?strand=…`)
  for shareability and Back-button support.
- **Accessibility**: labelled `<nav>` landmark, `aria-current`,
  `aria-hidden` on decorative counts.

## How to edit it safely

- **Add / rename / remove a filter strand**: edit
  `src/data/strands.ts` (cross-referenced). This component maps over
  `STRANDS`, so the chip appears automatically; the count comes from
  `buildCounts` in [`MarginaliaList.tsx`](./MarginaliaList.tsx.md),
  which also reads `STRANDS`. For articles to actually match, their
  markdown frontmatter `strands:` must use the **exact lowercase id**
  (the content pipeline lowercases/trims; cross-ref `loadArticles.ts`).
- **Change the filter URL scheme**: the `href`/hash format
  (`#marginalia?strand=<id>`) must stay in sync with whatever parent
  parses `window.location.hash` into the `strandFilter` prop of
  [`Marginalia.tsx`](../Marginalia.tsx.md). Changing it here without
  updating the parser breaks filtering and deep links.
- **Restyle chips** (active colour, pill shape, count badge): edit the
  paired [`StrandFilter.module.css`](./StrandFilter.module.css.md);
  class names must match `styles.*` here.
- **Gotcha**: keep `key={chip.id ?? '__all'}` — the "All" chip's `id` is
  `null`, which is not a valid key on its own; the fallback is required
  and must stay stable/unique.
- **Gotcha**: keep `aria-current={isActive ? 'true' : undefined}` (not
  `'false'`) so the attribute is *absent* on inactive chips — that's the
  correct accessibility semantic.
- **Gotcha**: don't drop the real `href` or the manual hash assignment —
  both are intentional (accessibility + scroll-snap defence).
