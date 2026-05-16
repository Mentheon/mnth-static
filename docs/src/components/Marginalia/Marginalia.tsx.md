# `src/components/Marginalia/Marginalia.tsx`

## What this file is

This is the **top-level component and router shell** for the entire
Marginalia feature. It is small on purpose: its whole responsibility is
to decide *which of two views* to render — the list of articles, or one
article's detail page — and to handle the "article not found" edge case
gracefully.

Think of it as a fork in the road. Everything downstream
(`MarginaliaList`, `MarginaliaArticle`, the cards, the filter, the
shared chips) is rendered *through* this component.

### How routing works here (the big picture)

There is no router library. The "route" is just the **URL hash**
(the part after `#`). A parent component, outside this folder, reads
`window.location.hash`, parses it, and passes the result down as the two
props defined in [`types.ts`](./types.ts.md):

- `slug: string | null`
  - `null` → the URL is `#marginalia` → show the **list**.
  - `"april-dispatch"` → the URL is `#marginalia/april-dispatch` →
    show the **detail** of that article.
- `strandFilter?: string | null` — from `?strand=kindred` on the hash;
  used only by the list view.

So this component is *stateless and pure*: given the same props it
always renders the same thing. The actual `#`-driven navigation is
performed by child components (`ArticleCard`, `StrandFilter`,
`StrandTags`, and the back/breadcrumb links) which set
`window.location.hash` directly.

## Line-by-line / block walkthrough

```tsx
import type { MarginaliaProps } from './types'
import { loadArticles, findArticle } from '../../lib/marginalia/loadArticles'
import MarginaliaList from './List/MarginaliaList'
import MarginaliaArticle from './Detail/MarginaliaArticle'
import styles from './Marginalia.module.css'
```

Five imports — note the three distinct *kinds*:

1. `import type { MarginaliaProps } from './types'` — a **type-only
   import**. `MarginaliaProps` is used only to annotate the props; the
   `type` keyword lets the compiler erase it from the JS output. See
   [`types.ts`](./types.ts.md).
2. `import { loadArticles, findArticle } from '...'` — **named imports**
   of two functions from the content pipeline
   (`src/lib/marginalia/loadArticles.ts`, cross-referenced; not owned by
   this doc). `loadArticles()` returns the full sorted `Article[]`;
   `findArticle(slug)` returns one `Article | undefined`.
3. `import MarginaliaList from './List/MarginaliaList'` and the
   `MarginaliaArticle` line — **default imports** of the two view
   components. No braces, because each of those files has a single
   `export default`.
4. `import styles from './Marginalia.module.css'` — a **CSS Modules**
   import. `styles` is an object whose keys are the class names you
   wrote in the `.css` file and whose values are *uniquely hashed*
   class strings (e.g. `styles.notFoundTitle` →
   `"Marginalia_notFoundTitle__a1b2c"`). This is how CSS Modules
   guarantees a class name here can never collide with a class of the
   same name elsewhere in the app. The matching stylesheet is
   [`Marginalia.module.css`](./Marginalia.module.css.md).

```tsx
// Router-aware shell: a `null` slug renders the index/list view; any
// other value tries to find a matching article and renders its detail.
// An unknown slug falls through to a small "not found" stub so a stale
// deep-link doesn't crash the app.
export default function Marginalia({ slug, strandFilter = null }: MarginaliaProps) {
```

This is the **component declaration**. Several teaching points:

- A React **function component** is just a function that returns JSX
  (the HTML-like markup). Its name is capitalised (`Marginalia`) — React
  *requires* component names to start with a capital letter so JSX can
  tell `<Marginalia />` (a component) apart from `<main />` (a DOM tag).
- `export default function Marginalia(...)` — this is the default export
  the [`index.ts`](./index.ts.md) barrel re-exports.
- `({ slug, strandFilter = null })` — this is **destructuring the props
  object** in the parameter list. React calls a component with a single
  `props` object; instead of writing `props.slug` everywhere, we pull
  `slug` and `strandFilter` out by name immediately.
- `strandFilter = null` — a **default parameter value**. If the parent
  doesn't pass `strandFilter` (it's optional in `MarginaliaProps`), it
  defaults to `null` here, so the rest of the function never has to deal
  with `undefined`.
- `: MarginaliaProps` — the **type annotation** on the destructured
  parameter. It tells TypeScript the shape of what's coming in.

```tsx
  const articles = loadArticles()
```

Calls into the content pipeline to get the full `Article[]`. Because
`loadArticles.ts` builds and memoises this array *once at module load*,
calling it here on every render is cheap — it just returns the same
cached array.

```tsx
  if (slug === null) {
    return <MarginaliaList articles={articles} activeStrand={strandFilter} />
  }
```

The first branch of the fork. **Early return** is a very common React
pattern: if there's no slug, render the list view and stop.

- `<MarginaliaList ... />` — JSX for "render the `MarginaliaList`
  component".
- `articles={articles}` and `activeStrand={strandFilter}` — passing
  **props** down. The curly braces `{}` mean "evaluate this JavaScript
  expression"; the left side is the prop name the child expects, the
  right side is the value from this scope. See
  [`List/MarginaliaList.tsx`](./List/MarginaliaList.tsx.md).

```tsx
  const article = findArticle(slug)
  if (!article) {
    return (
      <main className={styles.notFoundPage}>
        <div className={styles.notFoundFrame}>
          <p className={styles.notFoundKicker}>404 &middot; marginalia</p>
          <h1 className={styles.notFoundTitle}>No such article.</h1>
          <p className={styles.notFoundBody}>
            Couldn&rsquo;t find an article with the slug{' '}
            <code className={styles.code}>{slug}</code>. It may have been
            renamed or removed.
          </p>
          <a
            href="#marginalia"
            className={styles.notFoundCta}
            onClick={(e) => {
              e.preventDefault()
              window.location.hash = '#marginalia'
            }}
          >
            <span aria-hidden="true">&larr;</span> Back to marginalia
          </a>
        </div>
      </main>
    )
  }
```

We reach here only when `slug` is *not* `null`. `findArticle(slug)`
returns `Article | undefined`. `if (!article)` is the **truthiness
check**: `undefined` is falsy, so `!article` is `true` when no article
matched. This is the defensive "404" branch — a stale or mistyped
deep-link renders a friendly stub instead of crashing.

JSX details worth learning here:

- `className=` not `class=` — JSX uses `className` because `class` is a
  reserved word in JavaScript. `styles.notFoundPage` etc. are the hashed
  CSS-module class strings.
- `&middot;`, `&rsquo;`, `&larr;` — **HTML entities**. JSX supports them
  for typographic characters: middle dot, right single quote
  (apostrophe), left arrow. Using `&rsquo;` instead of a raw `'` avoids
  the typographically-ugly straight quote and also dodges any JSX
  parsing ambiguity.
- `{' '}` — a literal, deliberate space wrapped in braces. JSX collapses
  some whitespace between elements/lines; `{' '}` *forces* a space so
  "slug" and the `<code>` aren't glued together.
- `<code className={styles.code}>{slug}</code>` — `{slug}` interpolates
  the runtime string value of the `slug` variable into the markup.
- The `<a>` is the "back" link. `href="#marginalia"` provides a real,
  accessible URL that works even without JS. But `onClick` *also* runs
  `e.preventDefault()` (stop the browser's own anchor navigation) and
  then sets `window.location.hash = '#marginalia'` manually. This
  belt-and-braces pattern is used throughout Marginalia — the comment in
  `ArticleCard.tsx` explains why: a scroll-snapping parent or overlay
  upstream might otherwise swallow the navigation, so the code drives
  the hash itself.
- `aria-hidden="true"` on the `<span>` arrow tells screen readers to
  skip the decorative `←` glyph (the link text "Back to marginalia"
  already conveys the meaning).
- `<main>` is a semantic landmark element — there should be one main
  content region per view.

The `return ( ... )` wraps multi-line JSX in parentheses so the
`return` keyword and the JSX can sit on different lines without
JavaScript's automatic-semicolon-insertion breaking it.

```tsx
  return <MarginaliaArticle article={article} />
}
```

The final fork outcome: a valid article was found, so render the detail
view, passing the resolved `article` object down as a prop. By this
point TypeScript has *narrowed* `article` from `Article | undefined` to
just `Article` (the `if (!article) return` above eliminated the
`undefined` possibility) — this is **control-flow type narrowing**, and
it's why `article={article}` type-checks here without complaint. See
[`Detail/MarginaliaArticle.tsx`](./Detail/MarginaliaArticle.tsx.md).

## Libraries & APIs used

- **React** — function components, JSX, props, default export.
- **TypeScript** — `import type`, prop type annotation via
  `MarginaliaProps`, control-flow narrowing.
- **CSS Modules** — `import styles from './Marginalia.module.css'`.
- **Browser DOM API** — `window.location.hash` for hash routing,
  `event.preventDefault()`.
- **Project content pipeline** — `loadArticles` / `findArticle` from
  `src/lib/marginalia/loadArticles.ts` (cross-referenced, documented
  elsewhere).

## Concepts to learn here

- **Conditional rendering via early `return`s**: a clean way to express
  "if A render X; else if B render Y; else render Z".
- **Props destructuring with defaults** in the function signature.
- **Component composition**: a parent component's job can be just
  choosing and wiring children.
- **Hash-based routing without a router**: the URL hash is the source of
  truth; this component is a pure function of `(slug, strandFilter)`.
- **Defensive UI**: never trust a deep-link; render a stub instead of
  crashing.
- **JSX fundamentals**: `className`, `{expression}`, HTML entities,
  `{' '}`, `aria-hidden`, parenthesised multi-line returns.
- **CSS Modules** name-hashing and why it prevents global class clashes.

## How to edit it safely

- **To change which view shows when**: this is *the* file. The two
  decisions live in `if (slug === null)` and `if (!article)`. Add a new
  branch above the final `return` if you ever need a third view.
- **To restyle the 404 page**: edit
  [`Marginalia.module.css`](./Marginalia.module.css.md) — change the
  `.notFound*` rules. The class names there must match the
  `styles.notFound*` references here; rename in *both* files together.
- **To add a new article**: you do **not** touch this file. Add a
  Markdown file under `src/content/marginalia/` (cross-referenced; that
  pipeline auto-discovers it via glob import and `loadArticles()` will
  return it). The slug is derived from the filename.
- **To add a filter strand**: also not this file — see
  [`List/StrandFilter.tsx`](./List/StrandFilter.tsx.md) and
  `src/data/strands.ts`.
- **Gotcha**: keep this component *pure and stateless*. Resist adding
  `useState`/`useEffect` here — the routing input comes in entirely via
  props, and pushing state in would split the source of truth between
  this component and the hash. The defensive `preventDefault()` +
  `window.location.hash = ...` pattern on links is intentional; don't
  "simplify" it to a plain `<a href>` without understanding the
  scroll-snap caveat noted in `ArticleCard.tsx`.
- **Gotcha**: `findArticle` can return `undefined`. Always keep the
  `if (!article)` guard before using `article`, or TypeScript will (and
  should) complain at the final `return`.
