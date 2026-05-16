# `src/components/Marginalia/List/MarginaliaList.tsx`

## What this file is

The **list / index view** of the Marginalia feature: the page you see at
`#marginalia`. It renders the section header, a strand-filter chip
strip, and a responsive grid of article cards — applying the active
strand filter and computing per-strand counts along the way.

It is rendered by [`Marginalia.tsx`](../Marginalia.tsx.md) when `slug`
is `null`. This is the best file for learning **list rendering with
keys, array filtering, and deriving data during render**.

## Line-by-line / block walkthrough

```tsx
import type { Article } from '../types'
import { STRANDS } from '../../../data/strands'
import ArticleCard from './ArticleCard'
import StrandFilter from './StrandFilter'
import styles from './MarginaliaList.module.css'
```

- `Article` — type-only import from [`types.ts`](../types.ts.md).
- `STRANDS` — a **value** import (no `type` keyword): the canonical
  array of R&D strands from `src/data/strands.ts` (cross-referenced).
  Each has `{ id, label, ... }`. Three `../` segments climb from
  `Marginalia/List/` up to `src/` then into `data/`.
- `ArticleCard`, `StrandFilter` — sibling child components
  ([`ArticleCard.tsx`](./ArticleCard.tsx.md),
  [`StrandFilter.tsx`](./StrandFilter.tsx.md)).
- `styles` — paired CSS Module
  ([`MarginaliaList.module.css`](./MarginaliaList.module.css.md)).

```tsx
interface MarginaliaListProps {
  articles: Article[]
  /** Currently-active strand filter id, or null for "All". */
  activeStrand: string | null
}
```

Props: the full article array and the active filter. The `/** ... */`
above `activeStrand` is a **JSDoc/TSDoc comment** — editors surface it
as a tooltip when you hover the prop elsewhere. Good habit for shared
props.

```tsx
function buildCounts(articles: Article[]): Record<string, number> {
  const counts: Record<string, number> = { all: articles.length }
  for (const s of STRANDS) counts[s.id] = 0
  for (const a of articles) {
    for (const id of a.strands) {
      if (id in counts) counts[id] += 1
    }
  }
  return counts
}
```

A **pure helper** (module scope, no React) that tallies how many
articles fall under each filter chip.

- Return type `Record<string, number>` — a TypeScript **index/record
  type** meaning "an object whose keys are strings and values are
  numbers" (a string→number map/dictionary).
- `{ all: articles.length }` — the `all` bucket counts *every* article.
- `for (const s of STRANDS) counts[s.id] = 0` — seed every known strand
  id to `0` so chips with no articles still show `0` (not `undefined`).
- The nested loops walk each article's `strands` array and increment the
  matching bucket. `if (id in counts)` — the **`in` operator** tests
  whether a key exists on the object; this *silently ignores* unknown
  strand ids (e.g. a typo in markdown frontmatter), a deliberate
  robustness choice echoed in `StrandTags`/`StrandFilter`.

Why compute counts here rather than store them? They are **derived
data** — fully determined by `articles`. Recomputing on render keeps a
single source of truth (the articles) and avoids stale duplicated state.

```tsx
export default function MarginaliaList({ articles, activeStrand }: MarginaliaListProps) {
  const counts = buildCounts(articles)
  const filtered = activeStrand
    ? articles.filter((a) => a.strands.includes(activeStrand))
    : articles
```

- `const counts = buildCounts(articles)` — derive the counts each
  render. (It's O(n) and the list is small; no memoisation needed. If it
  were expensive you'd reach for `useMemo` — that concept is *not* used
  here precisely because it isn't warranted.)
- `const filtered = activeStrand ? ... : articles` — the **ternary
  operator** `cond ? a : b`. If a strand is active, keep only articles
  whose `strands` array `.includes(activeStrand)`; otherwise show all.
  `Array.prototype.filter` returns a *new* array of the elements for
  which the callback is truthy — it never mutates the original. This is
  the canonical React way to render a filtered subset: filter into a new
  array, then map it.

```tsx
  const activeStrandLabel = activeStrand
    ? STRANDS.find((s) => s.id === activeStrand)?.label ?? null
    : null
```

Resolve the active strand *id* to its human **label** for the empty-state
message. Two notable operators:

- `?.` — **optional chaining**. `STRANDS.find(...)` may return
  `undefined` (no match); `?.label` safely yields `undefined` instead of
  throwing "cannot read property of undefined".
- `?? null` — **nullish coalescing**: if the left side is `null` *or
  `undefined`*, use `null`. (Distinct from `||`, which would also
  replace `""`/`0`.)

```tsx
  return (
    <main className={styles.page}>
      <article className={styles.frame}>
        <span className={`${styles.cornerCrop} ${styles.cornerTL}`} aria-hidden="true" />
        ... (TR, BL, BR) ...
        <header className={styles.header}>
          <p className={styles.kicker}>
            Mentheon Marginalia &middot; field notes &amp; longer pieces
          </p>
          <h1 className={styles.title}>Marginalia</h1>
          <p className={styles.tagline}>
            Essays, dispatches, and reading notes from the studio &mdash;
            things that didn&rsquo;t want to be a paper or a project, but
            wanted to be written down anyway.
          </p>
        </header>
```

The framed page with the same decorative corner-crop spans as the detail
view (shared visual idiom — see
[`MarginaliaArticle.tsx`](../Detail/MarginaliaArticle.tsx.md)). HTML
entities again: `&middot;` (·), `&amp;` (&), `&mdash;` (—), `&rsquo;`
(’). One `<h1>` per page.

```tsx
        <StrandFilter activeStrand={activeStrand} counts={counts} />
```

Renders the filter chip strip, handing down the active filter and the
computed counts. See [`StrandFilter.tsx`](./StrandFilter.tsx.md).

```tsx
        {filtered.length === 0 ? (
          <p className={styles.empty}>
            {activeStrandLabel
              ? `No articles tagged with ${activeStrandLabel} yet.`
              : 'No articles yet. Check back soon.'}
          </p>
        ) : (
          <div className={styles.grid}>
            {filtered.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        )}
```

The core list-rendering block. Two layered patterns:

1. **Conditional rendering with a ternary in JSX**: `{cond ? (<A/>) :
   (<B/>)}`. If nothing survived the filter, show an empty-state `<p>`;
   otherwise show the grid. The inner ternary tailors the empty message
   (filtered vs truly empty), using a **template literal**
   `` `No articles tagged with ${activeStrandLabel} yet.` `` to
   interpolate the label.

2. **List rendering with `.map()` + `key`**:
   `{filtered.map((a) => <ArticleCard key={a.slug} article={a} />)}`.
   - `Array.prototype.map` transforms each `Article` into a JSX element;
     React renders an array of elements as siblings.
   - **`key={a.slug}`** is essential. React uses `key` to match elements
     across re-renders so it can update/reorder efficiently and preserve
     component state. The key must be **stable and unique among
     siblings** — `slug` is the article's primary key, perfect. Never
     use the array index as a key when the list can reorder/filter
     (filtering here changes positions), and never omit it (React warns).
   - `article={a}` passes each article down to
     [`ArticleCard.tsx`](./ArticleCard.tsx.md).

## Libraries & APIs used

- **React** — function component, props, list rendering, conditional
  rendering, Fragment-free single root.
- **TypeScript** — `import type`, `Record<string, number>` index type,
  optional chaining `?.`, nullish coalescing `??`.
- **JavaScript array methods** — `filter`, `map`, `includes`, `find`,
  the `in` operator, `for...of`.
- **CSS Modules** — `styles` + template-literal class composition.
- Project data — `STRANDS` from `src/data/strands.ts` (cross-ref).

## Concepts to learn here

- **Deriving data during render** (`buildCounts`, `filtered`) instead of
  storing it in state — single source of truth. Note `useMemo`/`useState`
  are deliberately *absent*; the work is cheap and input-derived.
- **Filtering then mapping**: `array.filter(...).map(...)` is the
  bread-and-butter list pipeline in React.
- **`key` props**: why they exist, why `slug` (stable id) is right and
  array index is wrong here.
- **Ternary conditional rendering** inside JSX, including a nested
  ternary for the message.
- **Optional chaining and nullish coalescing** for safe lookups.
- **Robustness via `if (id in counts)`** — tolerate bad data instead of
  crashing.

## How to edit it safely

- **Add an article**: not this file — drop a Markdown file in
  `src/content/marginalia/` (cross-referenced); the pipeline discovers
  it and it flows in through the `articles` prop automatically.
- **Add/rename a filter strand**: edit `src/data/strands.ts`
  (cross-referenced). `buildCounts` and the filter UI read `STRANDS`
  dynamically, so a new strand id automatically gets a chip and a count
  — *provided* articles tag it with the exact lowercase id. See
  [`StrandFilter.tsx`](./StrandFilter.tsx.md).
- **Change the grid/columns or empty-state look**: edit the paired
  [`MarginaliaList.module.css`](./MarginaliaList.module.css.md)
  (`.grid`, `.empty`); class names must match `styles.*` here.
- **Change a card's appearance**: edit
  [`ArticleCard.tsx`](./ArticleCard.tsx.md) /
  `ArticleCard.module.css`, not this file.
- **Gotcha**: keep `key={a.slug}` on the mapped `ArticleCard`. Removing
  it (React warning + buggy reordering) or switching to `key={index}`
  (state mismatch when filtering reorders the list) are classic bugs.
- **Gotcha**: `buildCounts` only counts ids present in `STRANDS` (the
  `in` check). An article tagged with a strand not in `strands.ts`
  contributes to `all` but to no chip — by design, not a bug.
