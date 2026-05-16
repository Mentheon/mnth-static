# `src/components/Marginalia/shared/ArticleMeta.tsx`

## What this file is

A small **shared component** that renders an article's metadata line —
its publication date, its type chip, and (in the detail layout) its
author. It is used by *both* views: the list card
([`List/ArticleCard.tsx`](../List/ArticleCard.tsx.md)) and the detail
header ([`Detail/MarginaliaArticle.tsx`](../Detail/MarginaliaArticle.tsx.md)),
each requesting a different layout via a `variant` prop.

It also contains the feature's **date-formatting logic** — a good
example of careful, timezone-safe date handling.

## Line-by-line / block walkthrough

```tsx
import type { Article } from '../types'
import TypeChip from './TypeChip'
import styles from './ArticleMeta.module.css'
```

Type-only `Article`; the sibling [`TypeChip.tsx`](./TypeChip.tsx.md)
(the coloured "Essay"/"Note" badge); and the paired CSS Module
([`ArticleMeta.module.css`](./ArticleMeta.module.css.md)).

```tsx
interface ArticleMetaProps {
  article: Article
  // The list card needs date in the corner and chip in the opposite
  // corner — the detail header wants them all on one mono row. Letting
  // the consumer pick the layout keeps both visually distinct.
  variant?: 'card' | 'detail'
}
```

Props:

- `article: Article` — the data.
- `variant?: 'card' | 'detail'` — an **optional string-literal-union
  prop** (the `?` makes it optional; the union restricts it to exactly
  those two strings). This is the **variant pattern**: one reusable
  component, two context-specific layouts, chosen by the parent. The
  comment explains *why* the layouts differ.

```tsx
function formatDate(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
```

A **pure helper** turning the stored ISO date string (`"2026-04-12"`)
into a human label (`"12 Apr 2026"`). Several important lessons:

- `if (!iso) return ''` — defensive: an empty/missing date renders
  nothing, never crashes. (`Article.date` can be `""` — see
  `loadArticles.ts`'s fallback, cross-referenced.)
- `iso.split('-').map(Number)` — split `"2026-04-12"` into
  `["2026","04","12"]`, then `.map(Number)` converts each string to a
  number. **`map(Number)`** works because `Number` is itself a function;
  passing it as the callback applies it to each element. Result:
  `[2026, 4, 12]`.
- `const [y, m, d] = ...` — **array destructuring**: pull the three
  parts into named variables in one line.
- `if (!y || !m || !d) return iso` — if any part failed to parse
  (`NaN`/`0` are falsy), fall back to returning the raw string rather
  than producing "Invalid Date".
- `new Date(Date.UTC(y, m - 1, d))` — the **timezone-safety crux**, and
  a classic JS gotcha worth memorising:
  - `Date.UTC(...)` builds the timestamp in **UTC**, not the user's
    local time. `new Date("2026-04-12")` parsed locally can roll back a
    day for users west of UTC ("off-by-one-day" bug). Constructing via
    `Date.UTC` avoids that entirely.
  - **`m - 1`**: JavaScript month arguments are **0-indexed** (January =
    0, December = 11). The ISO string's `04` means April, so we pass
    `4 - 1 = 3`. Forgetting this `-1` is one of the most common date
    bugs in JS.
- `.toLocaleDateString('en-GB', { ..., timeZone: 'UTC' })` — format with
  British conventions (`day month year`), short month name
  (`'short'` → "Apr"), and crucially `timeZone: 'UTC'` so the *display*
  also stays in UTC, matching how the date was constructed. Consistency
  between construction and formatting is what makes the result stable
  for every reader regardless of locale.

```tsx
export default function ArticleMeta({ article, variant = 'detail' }: ArticleMetaProps) {
  const dateLabel = formatDate(article.date)
```

`variant = 'detail'` — a **default parameter**: if a caller omits
`variant`, it defaults to `'detail'`. (Both call sites here pass it
explicitly, but the default makes the component safe to use without it.)
`dateLabel` is computed once.

```tsx
  if (variant === 'card') {
    return (
      <div className={styles.cardRow}>
        <span className={styles.date}>{dateLabel}</span>
        <TypeChip type={article.type} />
      </div>
    )
  }
  return (
    <div className={styles.detailRow}>
      <TypeChip type={article.type} />
      <span className={styles.dot} aria-hidden="true">·</span>
      <span className={styles.date}>{dateLabel}</span>
      <span className={styles.dot} aria-hidden="true">·</span>
      <span className={styles.author}>{article.author}</span>
    </div>
  )
}
```

**Variant-driven conditional rendering via early return**:

- `variant === 'card'` → a `.cardRow` with just date and type chip
  (the card CSS spaces them to opposite corners — see paired
  stylesheet).
- Otherwise (`'detail'`) → a `.detailRow` showing chip · date · author
  on one mono line, with `·` separator spans marked `aria-hidden`
  (purely visual punctuation; screen readers don't need to announce the
  middots).

Both branches delegate the badge to `<TypeChip type={article.type} />`
— passing the typed `article.type`. See
[`TypeChip.tsx`](./TypeChip.tsx.md).

Choosing layout by `variant` (rather than the parent assembling the
pieces itself) keeps the date-formatting and the meta markup in **one
place**, while still letting each view look right — the core value of a
shared, variant-aware component.

## Libraries & APIs used

- **React** — function component, props, conditional rendering, default
  parameter.
- **TypeScript** — `import type`, optional string-literal-union prop,
  array destructuring.
- **JavaScript Date API** — `Date.UTC`, `Date#toLocaleDateString`,
  `String#split`, `Array#map(Number)`.
- **CSS Modules** — `styles.*`.

## Concepts to learn here

- **The `variant` prop pattern** for reusable, context-aware components.
- **Timezone-safe date handling**: `Date.UTC` + `timeZone: 'UTC'` in
  formatting, and the **0-indexed month (`m - 1`)** gotcha — together
  the single most common source of date bugs in JS.
- **`array.map(Number)`** — passing a built-in as a transform callback.
- **Array destructuring** (`const [y, m, d] = ...`).
- **Defensive helpers**: return `''` / the raw string instead of
  throwing on bad input.
- **Default parameter values** for optional props.
- **`aria-hidden` on decorative punctuation.**

## How to edit it safely

- **Change the date format** (e.g. US style, long month, ISO): edit only
  `formatDate`. Keep `Date.UTC(...)` and `timeZone: 'UTC'` *together* —
  removing either reintroduces the off-by-one-day bug. Remember any new
  month index passed to `Date` must be 0-based.
- **Add a third layout** (say a compact footer): add another
  `variant` literal to the union in `ArticleMetaProps`, add a matching
  `if (variant === '...')` branch, and add CSS in
  [`ArticleMeta.module.css`](./ArticleMeta.module.css.md). Prefer a new
  variant over per-call ad-hoc styling.
- **Change what fields show**: edit the relevant branch's JSX (fields
  must exist on `Article` — see [`types.ts`](../types.ts.md)).
- **Restyle the rows/dots**: edit the paired
  [`ArticleMeta.module.css`](./ArticleMeta.module.css.md); class names
  must match `styles.*` here.
- **Gotcha**: this component is shared by the list card *and* the detail
  header. A change inside a given `variant` branch affects every place
  that uses that variant — search both
  [`List/ArticleCard.tsx`](../List/ArticleCard.tsx.md) and
  [`Detail/MarginaliaArticle.tsx`](../Detail/MarginaliaArticle.tsx.md)
  before changing shared markup.
- **Gotcha**: `article.date` may be `""` (missing frontmatter). Keep the
  `if (!iso) return ''` guard so empty dates render cleanly.
