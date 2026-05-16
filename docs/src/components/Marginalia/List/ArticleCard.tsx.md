# `src/components/Marginalia/List/ArticleCard.tsx`

## What this file is

One **card** in the article grid: a clickable summary tile (date + type
chip, title, 2-line summary, strand tags, "Read →" call-to-action). The
*entire card is a single link* to that article's detail page.

It is rendered once per article by
[`MarginaliaList.tsx`](./MarginaliaList.tsx.md) inside a `.map()` with a
`key`. It is a small **presentational component** driven entirely by the
`article` prop.

## Line-by-line / block walkthrough

```tsx
import type { Article } from '../types'
import ArticleMeta from '../shared/ArticleMeta'
import StrandTags from '../shared/StrandTags'
import styles from './ArticleCard.module.css'
```

Type-only `Article` import; the two **shared** sub-components reused by
both list and detail views
([`shared/ArticleMeta.tsx`](../shared/ArticleMeta.tsx.md),
[`shared/StrandTags.tsx`](../shared/StrandTags.tsx.md)); and the paired
CSS Module ([`ArticleCard.module.css`](./ArticleCard.module.css.md)).

```tsx
interface ArticleCardProps {
  article: Article
}
```

Single prop: one `Article`.

```tsx
export default function ArticleCard({ article }: ArticleCardProps) {
  const href = `#marginalia/${article.slug}`
```

Builds the detail-page URL with a **template literal** —
`#marginalia/april-dispatch`. This matches the hash format
[`Marginalia.tsx`](../Marginalia.tsx.md) expects (a non-null slug ⇒
detail view).

```tsx
  // Same belt-and-braces pattern StrandPanel uses: drive the hash
  // change ourselves so any scroll-snap parent / overlay / preventDefault
  // upstream can't swallow the navigation.
  const onClick = (e: React.MouseEvent) => {
    e.preventDefault()
    window.location.hash = href
  }
```

The recurring Marginalia navigation handler. The `<a>` has a real
`href` (works without JS, right-clickable, accessible), but the click is
*also* handled manually:

- `e.preventDefault()` — stop the browser's default anchor navigation.
- `window.location.hash = href` — set the hash ourselves.

The comment states the rationale precisely: an ancestor with
scroll-snap, an overlay, or some upstream `preventDefault` could
otherwise eat the click. Driving the hash directly is a deliberate
defensive choice used identically across the feature (cards,
`StrandFilter`, `StrandTags`, the back links).

Note `onClick` is defined *inside* the component (it closes over `href`,
which depends on `article`) — unlike the parameter-less `backToList`
helper in `MarginaliaArticle.tsx`, which is module-scope because it
captures nothing. Recognising when a handler must close over props vs
when it can be hoisted is a useful instinct.

```tsx
  return (
    <a className={styles.card} href={href} onClick={onClick}>
      <span className={styles.cornerTick} aria-hidden="true" />
      <ArticleMeta article={article} variant="card" />
      <h3 className={styles.title}>{article.title}</h3>
      <p className={styles.summary}>{article.summary}</p>
      {article.strands.length > 0 && (
        <div className={styles.tagsRow}>
          <StrandTags strands={article.strands} variant="card" />
        </div>
      )}
      <span className={styles.cta} aria-hidden="true">
        Read <span className={styles.arrow}>&rarr;</span>
      </span>
    </a>
  )
}
```

- The root element is `<a>` — the **whole card is one link**. Using a
  single anchor (rather than a `<div>` with an inner link) gives a big
  click target and correct keyboard/accessibility behaviour for free.
- `onClick={onClick}` — passes the handler **by reference** (no
  parentheses; calling it would run it during render).
- `<span className={styles.cornerTick} aria-hidden="true" />` — a
  decorative corner tick (a single L mark, animated on hover via CSS).
  `aria-hidden` because it's purely visual; self-closing (no children).
- `<ArticleMeta article={article} variant="card" />` — the shared meta
  component with `variant="card"`, which renders the date-left /
  type-chip-right layout (vs the detail row). See
  [`shared/ArticleMeta.tsx`](../shared/ArticleMeta.tsx.md).
- `<h3>` for the title — note **`<h3>`, not `<h1>`**: on the list page
  the page's `<h1>` is "Marginalia" (in `MarginaliaList`); each card
  title is a sub-heading, so `<h3>` keeps the document outline correct.
  Heading levels are about structure, not size (size is CSS).
- `{article.title}` / `{article.summary}` — plain text interpolation.
  The summary is visually clamped to 2 lines by CSS, not here (see
  paired stylesheet).
- `{article.strands.length > 0 && (...)}` — **conditional rendering with
  `&&`**, guarded on an explicit boolean (`length > 0`). Renders the
  strand-tag row only when there are strands; otherwise renders nothing
  (not a stray `0`). `variant="card"` makes the tags passive (non-link)
  pills since the whole card is already the link — see
  [`shared/StrandTags.tsx`](../shared/StrandTags.tsx.md).
- The `.cta` span ("Read →") is `aria-hidden` because it's a decorative
  affordance; the link's accessible name already comes from the title
  text. `&rarr;` is the `→` HTML entity. The arrow nudges on hover via
  CSS.

## Libraries & APIs used

- **React** — function component, props, event handler, conditional
  rendering, `React.MouseEvent`.
- **TypeScript** — `import type`, props interface.
- **CSS Modules** — `styles.*` classes.
- **Browser DOM** — `window.location.hash`, `preventDefault()`.

## Concepts to learn here

- **Whole element as a link** (`<a>` as the card root) for a large,
  accessible click target.
- **Template-literal URL construction** matching the hash-router format.
- **Closure vs hoisted handlers**: `onClick` lives inside the component
  because it captures `href`/`article`; the defensive
  `preventDefault()` + manual hash assignment pattern and *why* it's
  used.
- **Heading hierarchy**: `<h3>` here vs the page `<h1>` — semantics over
  size.
- **Conditional rendering with `&&`** guarded on a boolean.
- **The `variant` prop** selecting context-appropriate looks for shared
  components.
- **`aria-hidden` for decorative content** so screen readers aren't
  cluttered.

## How to edit it safely

- **Add/remove a field on the card** (e.g. show author): add markup here
  reading `article.<field>` (the field must exist on `Article` in
  [`types.ts`](../types.ts.md)). Style it in the paired
  [`ArticleCard.module.css`](./ArticleCard.module.css.md).
- **Change card hover/animation/clamp**: that's CSS — edit
  [`ArticleCard.module.css`](./ArticleCard.module.css.md) (e.g. the
  `-webkit-line-clamp` for summary lines, the corner-tick / arrow hover
  transitions). Class names must match `styles.*` here.
- **Change where the card links**: edit the `href` template — but keep
  it `#marginalia/<slug>` or [`Marginalia.tsx`](../Marginalia.tsx.md)
  won't resolve it to a detail view.
- **Add a new article**: not this file — add a Markdown file under
  `src/content/marginalia/` (cross-referenced). Cards are generated from
  the data automatically by
  [`MarginaliaList.tsx`](./MarginaliaList.tsx.md).
- **Gotcha**: keep `onClick={onClick}` (reference). And keep both the
  real `href` *and* the manual hash assignment — removing the `href`
  hurts accessibility/SEO; removing the handler reintroduces the
  scroll-snap swallow bug the comment warns about.
- **Gotcha**: don't promote the card title to `<h1>`/`<h2>` to make it
  bigger — that corrupts the page heading outline. Resize via CSS in the
  paired stylesheet instead.
