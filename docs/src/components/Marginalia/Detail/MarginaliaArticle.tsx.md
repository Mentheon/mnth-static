# `src/components/Marginalia/Detail/MarginaliaArticle.tsx`

## What this file is

This is the **detail view** — the full single-article page. When
[`Marginalia.tsx`](../Marginalia.tsx.md) is given a slug that resolves
to a real `Article`, it renders this component. It lays out the
breadcrumb, the article header (meta line, title, tagline, strand
tags), the rendered markdown body, and a "back" link.

It is a **presentational / composition component**: it receives one
fully-formed `Article` object and arranges sub-components. It holds no
state and does no data loading itself.

## Line-by-line / block walkthrough

```tsx
import type { Article } from '../types'
import ArticleBody from './ArticleBody'
import ArticleMeta from '../shared/ArticleMeta'
import StrandTags from '../shared/StrandTags'
import styles from './MarginaliaArticle.module.css'
```

- `import type { Article }` — type-only import of the data shape from
  [`types.ts`](../types.ts.md).
- `ArticleBody` — sibling component that injects the rendered HTML;
  see [`ArticleBody.tsx`](./ArticleBody.tsx.md).
- `ArticleMeta`, `StrandTags` — **shared** sub-components reused by both
  list and detail views; see
  [`shared/ArticleMeta.tsx`](../shared/ArticleMeta.tsx.md) and
  [`shared/StrandTags.tsx`](../shared/StrandTags.tsx.md). Note the `../`
  to climb out of `Detail/` back into the feature root, then into
  `shared/`.
- `styles` — the paired CSS Module,
  [`MarginaliaArticle.module.css`](./MarginaliaArticle.module.css.md).

```tsx
interface MarginaliaArticleProps {
  article: Article
}
```

A small **props interface** declaring this component takes exactly one
prop: `article`, of type `Article`. Declaring props as a named
interface (rather than inline) is a readable convention used throughout
this codebase.

```tsx
function backToList(e: React.MouseEvent) {
  e.preventDefault()
  window.location.hash = '#marginalia'
}
```

A **module-scope helper** (declared *outside* the component). Because it
captures nothing from a render, defining it once at module level — not
inside the component body — avoids recreating the function on every
render. It is the recurring Marginalia navigation pattern:

- `e: React.MouseEvent` — the typed click event. `React.MouseEvent` is
  React's synthetic event type.
- `e.preventDefault()` — cancels the browser's default anchor behaviour.
- `window.location.hash = '#marginalia'` — manually drives the
  hash-router back to the list. The comment on the same pattern in
  `ArticleCard.tsx` explains the rationale: a scroll-snapping parent /
  overlay upstream could otherwise swallow a plain link click, so the
  code sets the hash itself.

```tsx
export default function MarginaliaArticle({ article }: MarginaliaArticleProps) {
  return (
    <>
```

The component, with `{ article }` destructured from props.

`<>...</>` is a **React Fragment** (shorthand for
`<React.Fragment>`). A component must return a *single* root node. The
breadcrumb `<nav>` and the `<main>` are siblings; wrapping them in a
Fragment groups them **without adding an extra DOM element** (no wrapper
`<div>` in the output). Use a Fragment whenever you need to return
multiple siblings but don't want an extra container in the HTML.

```tsx
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <a href="#marginalia" onClick={backToList}>marginalia</a>
        <span className={styles.sep}>/</span>
        <span>{article.slug}</span>
      </nav>
```

The breadcrumb trail.

- `<nav>` with `aria-label="Breadcrumb"` — a semantic navigation
  landmark; the label tells assistive tech *which* nav this is (a page
  can have several).
- The `<a>` reuses the `backToList` helper as its `onClick`. Note
  `onClick={backToList}` passes the *function reference* (no
  parentheses) — React calls it when clicked. `onClick={backToList()}`
  would be a bug: it would call it during render.
- `{article.slug}` — interpolates the current article's slug as plain
  text, showing where you are in the trail.

```tsx
      <main className={styles.page}>
        <article className={styles.frame}>
          <span className={`${styles.cornerCrop} ${styles.cornerTL}`} aria-hidden="true" />
          <span className={`${styles.cornerCrop} ${styles.cornerTR}`} aria-hidden="true" />
          <span className={`${styles.cornerCrop} ${styles.cornerBL}`} aria-hidden="true" />
          <span className={`${styles.cornerCrop} ${styles.cornerBR}`} aria-hidden="true" />
```

- `<main>` / `<article>` — semantic elements: `<main>` is the primary
  content region; `<article>` wraps a self-contained piece of content.
- The four `<span>`s are the **decorative corner-crop marks** (the
  little crimson L-brackets at each corner of the framed box).
  `aria-hidden="true"` hides them from screen readers (purely visual).
  Self-closing (`<span ... />`) because they have no children.
- `className={`${styles.cornerCrop} ${styles.cornerTL}`}` — a
  **template literal** building a multi-class string. Two CSS-module
  classes are combined: a shared `cornerCrop` (size/position base) plus
  a position modifier (`cornerTL` = top-left, `TR` = top-right, etc.).
  Composing a shared base class with a small modifier class is a clean
  CSS pattern; see
  [`MarginaliaArticle.module.css`](./MarginaliaArticle.module.css.md).

```tsx
          <header className={styles.header}>
            <ArticleMeta article={article} variant="detail" />
            <h1 className={styles.title}>{article.title}</h1>
            {article.summary && (
              <p className={styles.tagline}>{article.summary}</p>
            )}
            {article.strands.length > 0 && (
              <div className={styles.tagsRow}>
                <StrandTags strands={article.strands} variant="detail" />
              </div>
            )}
          </header>
```

The article header. Several key patterns:

- `<ArticleMeta article={article} variant="detail" />` — passes the
  whole article plus a `variant` string. The `variant` prop lets one
  shared component render differently per context (here the one-line
  mono row); see
  [`shared/ArticleMeta.tsx`](../shared/ArticleMeta.tsx.md).
- `<h1 ...>{article.title}</h1>` — exactly one `<h1>` per page is good
  document structure; the article title is the page's top heading.
- `{article.summary && (<p ...>{article.summary}</p>)}` — **conditional
  rendering with `&&`**. In JS, `A && B` evaluates to `B` only if `A` is
  truthy, otherwise to `A`. Here, if `summary` is a non-empty string the
  `<p>` renders; if it's `""` the expression is `""` and React renders
  nothing for it. This is the standard "render this element only if the
  data exists" idiom.
- `{article.strands.length > 0 && (...)}` — same idea, guarding on
  *array length*. Important nuance: `&&` is used with an explicit
  boolean (`length > 0`), not the bare array, and not a bare number.
  Rendering `{0 && ...}` would print a literal `0`; `length > 0` yields
  a clean `false` which React renders as nothing. A subtle but
  worthwhile lesson about JSX conditional rendering.
- `<StrandTags strands={article.strands} variant="detail" />` — passes
  the strand id array; the `detail` variant makes each tag a clickable
  filter link. See
  [`shared/StrandTags.tsx`](../shared/StrandTags.tsx.md).

```tsx
          <ArticleBody html={article.bodyHtml} />
```

Renders the body. Note it passes `article.bodyHtml` — the **already
rendered HTML string** (the markdown→HTML conversion happened once at
build time in the content pipeline). `ArticleBody` injects it via
`dangerouslySetInnerHTML`; see [`ArticleBody.tsx`](./ArticleBody.tsx.md)
for the safety discussion.

```tsx
          <div className={styles.backRow}>
            <a href="#marginalia" onClick={backToList} className={styles.backCta}>
              <span aria-hidden="true">&larr;</span> Back to marginalia
            </a>
          </div>
        </article>
      </main>
    </>
  )
}
```

The footer "back" link, again reusing the shared `backToList` helper and
the same accessible-anchor pattern (`&larr;` is the `←` entity, hidden
from screen readers). The closing tags mirror the opening structure;
`</>` closes the Fragment.

## Libraries & APIs used

- **React** — function component, props, Fragment (`<>...</>`),
  synthetic events (`React.MouseEvent`), event handlers.
- **TypeScript** — `import type`, props interface.
- **CSS Modules** — `styles` import + template-literal class
  composition.
- **Browser DOM** — `window.location.hash`, `event.preventDefault()`.

## Concepts to learn here

- **Composition over monolith**: the page is assembled from
  `ArticleMeta`, `StrandTags`, `ArticleBody` — each documented
  separately.
- **React Fragments** to return sibling nodes without extra DOM.
- **Conditional rendering with `&&`**, and the gotcha of guarding on
  `array.length > 0` (boolean) rather than a bare number.
- **Passing functions to `onClick`** by reference vs accidentally
  calling them.
- **The `variant` prop pattern**: one shared component, multiple
  context-driven looks.
- **Semantic HTML & ARIA**: `<main>`, `<article>`, `<nav aria-label>`,
  `aria-hidden` on decorative glyphs.
- **Template-literal `className` composition** for base + modifier
  classes.

## How to edit it safely

- **Reorder/restyle the header**: edit the JSX order here; restyle in
  [`MarginaliaArticle.module.css`](./MarginaliaArticle.module.css.md)
  (paired file). Class names must match between the two.
- **Change how meta or tags look**: edit the shared components
  ([`shared/ArticleMeta.tsx`](../shared/ArticleMeta.tsx.md),
  [`shared/StrandTags.tsx`](../shared/StrandTags.tsx.md)) — but remember
  those are also used by the list cards, so changes affect both views.
  If you need a detail-only look, prefer a new `variant` value over
  branching inside the shared component.
- **Add a new article**: not this file — add a Markdown file under
  `src/content/marginalia/` (cross-referenced; auto-discovered by the
  pipeline).
- **Change body rendering/markdown features**: not this file — that's
  `src/lib/marginalia/renderMarkdown.ts` (cross-referenced). This
  component only *displays* `article.bodyHtml`.
- **Gotcha**: keep `onClick={backToList}` (reference), never
  `onClick={backToList()}` (call). The latter runs on render and breaks
  the page.
- **Gotcha**: the `&&` guards rely on `summary` being a string and
  `strands` being an array (guaranteed by the `Article` type). If you
  change those types in [`types.ts`](../types.ts.md), revisit these
  conditionals.
