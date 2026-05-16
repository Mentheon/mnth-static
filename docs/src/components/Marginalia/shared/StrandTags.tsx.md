# `src/components/Marginalia/shared/StrandTags.tsx`

## What this file is

A shared component that renders the small **strand-affiliation pills**
("Kindreon", "Aevorix", …) showing which R&D strands an article belongs
to. It resolves strand *ids* (stored on the article) to display
*labels*, and behaves differently per `variant`:

- `card` (default): passive, non-clickable pills (the whole card is
  already a link, so the tags must not be).
- `detail`: each pill is an anchor that navigates the Marginalia list
  filtered to that strand.

Used by both [`List/ArticleCard.tsx`](../List/ArticleCard.tsx.md) and
[`Detail/MarginaliaArticle.tsx`](../Detail/MarginaliaArticle.tsx.md).

## Line-by-line / block walkthrough

```tsx
import { STRANDS } from '../../../data/strands'
import styles from './StrandTags.module.css'
```

The `STRANDS` value array (id → label source, `src/data/strands.ts`,
cross-referenced) and the paired CSS Module
([`StrandTags.module.css`](./StrandTags.module.css.md)).

```tsx
interface StrandTagsProps {
  /** Strand IDs to render. Empty array → component renders nothing. */
  strands: string[]
  /**
   * `card`: passive small grape pills (whole card is the link).
   * `detail`: anchor pills that filter the marginalia list when clicked.
   */
  variant?: 'card' | 'detail'
}
```

Props: an array of strand id strings, and the optional
`'card' | 'detail'` variant. The TSDoc comments document the contract,
including the "empty array → renders nothing" behaviour implemented
below.

```tsx
export default function StrandTags({ strands, variant = 'card' }: StrandTagsProps) {
  if (!strands.length) return null
```

- `variant = 'card'` — default parameter (card is the common case).
- `if (!strands.length) return null` — **a component returning `null`**
  renders *nothing* (no DOM at all). This is the idiomatic React way to
  say "render nothing under this condition". This is why the call sites
  can write `{article.strands.length > 0 && <StrandTags .../>}` *and*
  the component still self-guards — defence in depth.

```tsx
  const resolved = strands
    .map((id) => STRANDS.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => s != null)
  if (!resolved.length) return null
```

Resolve ids to strand objects, dropping unknowns:

- `.map((id) => STRANDS.find((s) => s.id === id))` — for each id, look
  it up in `STRANDS`. `find` returns the matching strand **or
  `undefined`** if the id isn't known. So `resolved` is at this point
  `(Strand | undefined)[]`.
- `.filter((s): s is NonNullable<typeof s> => s != null)` — drop the
  `undefined`s (unknown ids, e.g. a typo in markdown frontmatter — fail
  soft, never crash). The interesting part is the type annotation:
  - `s != null` — `!=` (loose) against `null` is a deliberate idiom that
    is true for *both* `null` and `undefined` and false for everything
    else. So only real strands survive.
  - `(s): s is NonNullable<typeof s>` — a **type predicate** (a "type
    guard"). Without it, TypeScript would still think the filtered array
    might contain `undefined`. The predicate tells the compiler "if this
    returns true, `s` is the non-nullable type", so `resolved` is
    correctly narrowed to `Strand[]`. `NonNullable<T>` is a built-in
    **utility type** that strips `null`/`undefined` from `T`;
    `typeof s` is the element's type. This is an advanced but very
    practical TypeScript pattern for "filter out nullish and have the
    types know it".
- `if (!resolved.length) return null` — if *every* id was unknown, again
  render nothing.

```tsx
  return (
    <span className={styles.row}>
      {resolved.map((s) => {
        const tagClass = `${styles.tag} ${variant === 'detail' ? styles.tagDetail : ''}`
        if (variant === 'detail') {
          const href = `#marginalia?strand=${s.id}`
          return (
            <a
              key={s.id}
              href={href}
              className={tagClass}
              onClick={(e) => {
                e.preventDefault()
                window.location.hash = href
              }}
            >
              {s.label}
            </a>
          )
        }
        return (
          <span key={s.id} className={tagClass}>
            {s.label}
          </span>
        )
      })}
    </span>
  )
}
```

- `<span className={styles.row}>` — an inline wrapper (a `<span>`, not a
  `<div>`, so it sits inline within meta rows).
- `{resolved.map((s) => { ... })}` — **list rendering** of the resolved
  strands.
- `tagClass` — template-literal class composition: always
  `styles.tag`, conditionally adding `styles.tagDetail` only for the
  detail variant (which CSS uses to add a hover/cursor affordance).
- **Per-variant element choice**:
  - `variant === 'detail'` → render an `<a>` linking to
    `#marginalia?strand=<id>` — the *same* hash-filter URL the
    [`StrandFilter`](../List/StrandFilter.tsx.md) chips produce, so a
    strand tag on an article jumps you to the filtered list. The
    `onClick` uses the recurring defensive `preventDefault()` +
    `window.location.hash = href` pattern (real `href` for
    accessibility/no-JS; manual hash to dodge scroll-snap/overlay
    swallowing).
  - otherwise → render an inert `<span>` (no link), because in card
    context the whole card is already the link and a nested `<a>` inside
    an `<a>` is invalid HTML *and* a bad UX. Choosing `<span>` vs `<a>`
    by context is a deliberate, correct call.
- `key={s.id}` on both branches — the **list key**, the strand id
  (stable, unique among siblings; not the array index).

## Libraries & APIs used

- **React** — function component, props, list rendering with keys,
  conditional element type, returning `null` to render nothing.
- **TypeScript** — optional union prop, **type predicate**
  (`s is NonNullable<typeof s>`), `NonNullable<T>` utility type,
  `typeof` in type position.
- **JavaScript** — `Array#map`, `Array#find`, `Array#filter`, the
  `!= null` nullish idiom.
- **CSS Modules** — `styles.*` + template-literal composition.
- **Browser DOM** — `window.location.hash`, `preventDefault()`.
- Project data — `STRANDS` (`src/data/strands.ts`, cross-ref).

## Concepts to learn here

- **`return null` to render nothing** — the React way to conditionally
  omit a component's output (and why call sites *also* guard:
  defence in depth).
- **Resolving ids → display objects** with `map` + `find`, then
  **filtering out unknowns** so bad data fails soft.
- **Type predicates / type guards** (`x is T`) and `NonNullable<T>` —
  how to make `.filter(Boolean)`-style narrowing type-correct.
- **The `!= null` idiom** matching both `null` and `undefined`.
- **Choosing the element type by context** (`<a>` vs inert `<span>`),
  including avoiding nested anchors.
- **List keys** with a stable id.
- The shared **hash-filter URL** convention linking tags to the filtered
  list.

## How to edit it safely

- **Add / rename a strand**: edit `src/data/strands.ts`
  (cross-referenced). This component resolves labels from `STRANDS`
  dynamically, so a renamed `label` updates everywhere automatically.
  Article frontmatter must reference the strand's exact lowercase `id`
  (the pipeline lowercases/trims — cross-ref `loadArticles.ts`); an
  unrecognised id is silently dropped here (intended).
- **Change the tag link target**: keep the `#marginalia?strand=<id>`
  format consistent with [`StrandFilter`](../List/StrandFilter.tsx.md)
  and whatever parses the hash for [`Marginalia`](../Marginalia.tsx.md)
  — they must all agree.
- **Add a new variant** (e.g. a large detail-page chip): add the literal
  to the `variant` union, branch on it, and add CSS in
  [`StrandTags.module.css`](./StrandTags.module.css.md).
- **Restyle pills**: edit the paired
  [`StrandTags.module.css`](./StrandTags.module.css.md); class names
  must match `styles.*` here.
- **Gotcha**: do **not** make the `card` variant an `<a>`. It is
  rendered inside the `<a>` card in
  [`List/ArticleCard.tsx`](../List/ArticleCard.tsx.md); nested anchors
  are invalid HTML. The `variant` split exists precisely to prevent
  this.
- **Gotcha**: keep the `.filter((s): s is NonNullable<typeof s> => s !=
  null)` predicate. Replacing it with a plain `.filter(s => s != null)`
  compiles but leaves `resolved` typed as possibly-`undefined`,
  reintroducing type errors / unsafe `s.id` access downstream.
