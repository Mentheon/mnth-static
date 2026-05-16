# `src/lib/marginalia/loadArticles.ts`

## What this file is

This is the **heart of the "Marginalia" content pipeline** — the
blog/notes section of the site. It does four things, *once, at module
load time*:

1. Finds every Markdown file in `src/content/marginalia/`.
2. Splits each into frontmatter + body (via `parseFrontmatter`).
3. Renders the body to HTML (via `renderMarkdown`).
4. Normalises the metadata into a typed `Article[]`, sorted
   newest-first, and exposes it through two functions.

Because it runs at *module load* rather than inside a React render, the
expensive Markdown work happens exactly once for the whole app session.
Navigating between the article list and a detail page, or switching
filters, just reads the already-built array.

### The whole pipeline (overview)

```
src/content/marginalia/*.md           ← raw Markdown files (frontmatter + prose)
        │
        │  import.meta.glob(... '?raw' ...)        ← Vite bundles all of them as strings
        ▼
parseFrontmatter(raw)                  ← splits "---\n...\n---\n" head from body
        │       │
   frontmatter  body
   (key:value)   │
        │        ├─ renderMarkdown(body) ─→ bodyHtml (HTML string, syntax-highlighted)
        ▼        ▼
   coerceType / parseStrands / defaults  ← this file normalises the raw strings
        ▼
   Article { slug,title,date,type,author,summary,strands,body,bodyHtml }
        ▼
   articles.sort(newest-first)
        ▼
   loadArticles()  /  findArticle(slug)  ← consumed by the Marginalia React components
```

Cross-references:
- Frontmatter splitting: see
  [`parseFrontmatter.ts`](./parseFrontmatter.ts.md).
- Markdown→HTML + highlighting: see
  [`renderMarkdown.ts`](./renderMarkdown.ts.md).
- The `Article` / `ArticleType` types live in
  `src/components/Marginalia/types.ts`.
- The frontmatter `strands:` values are matched against the canonical
  IDs in `src/data/strands.ts` (see [`strands.ts`](../../data/strands.ts.md)).

## Line-by-line / block walkthrough

```ts
import type { Article, ArticleType } from '../../components/Marginalia/types'
import { parseFrontmatter } from './parseFrontmatter'
import { renderMarkdown } from './renderMarkdown'
```

`import type { ... }` is a **type-only import** — it brings in TypeScript
types that are erased at compile time and contribute nothing to the
JS bundle. The other two imports are the pipeline helpers.

```ts
const KNOWN_TYPES: readonly ArticleType[] = [
  'essay', 'note', 'dispatch', 'paper-summary', 'link-roundup',
]
```

The allow-list of valid `type` values. `readonly ArticleType[]` means
"an array of `ArticleType` that cannot be mutated". `ArticleType` itself
is a **union type** (defined in the types file as
`'essay' | 'note' | 'dispatch' | 'paper-summary' | 'link-roundup'`) — a
value of that type must be exactly one of those five string literals.

```ts
function coerceType(raw: string | undefined): ArticleType {
  if (!raw) return 'note'
  return (KNOWN_TYPES as readonly string[]).includes(raw)
    ? (raw as ArticleType)
    : 'note'
}
```

Frontmatter is just text, so `frontmatter.type` is a plain `string |
undefined`. This function **coerces** it into the strict `ArticleType`
union:

- `if (!raw) return 'note'` — missing/empty → safe default. The comment
  explains the philosophy: never throw; a mislabelled article is better
  than a dropped one.
- `(KNOWN_TYPES as readonly string[]).includes(raw)` — the cast
  `as readonly string[]` is needed because `.includes` on a
  `readonly ArticleType[]` would refuse a generic `string` argument.
  Widening the array's type for the check sidesteps that.
- `(raw as ArticleType)` — a **type assertion**. We've just *proven at
  runtime* that `raw` is one of the known values, but the compiler can't
  see that, so we assert it. Unknown values fall back to `'note'`.

```ts
function slugFromPath(filePath: string): string {
  const file = filePath.split('/').pop() ?? filePath
  return file.replace(/\.md$/i, '')
}
```

Turns `"../../content/marginalia/pose-tracking-politics.md"` into the URL
slug `"pose-tracking-politics"`.

- `.split('/')` → array of path segments; `.pop()` → the last segment
  (the filename). `.pop()` can technically return `undefined`, so
  `?? filePath` (the **nullish-coalescing operator**: use the left side
  unless it's `null`/`undefined`) provides a fallback.
- `.replace(/\.md$/i, '')` strips the extension. `/\.md$/i` is a
  **regular expression**: `\.` is a literal dot, `md` literal, `$`
  anchors to end-of-string, and the `i` flag makes it case-insensitive
  (so `.MD` also matches).

```ts
const files = import.meta.glob('../../content/marginalia/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>
```

This is the magic that makes new articles auto-load. **`import.meta.glob`
is a Vite build-time feature** (not standard JS) that finds every file
matching a glob pattern and wires up imports for them automatically:

- The pattern `'../../content/marginalia/*.md'` matches every `.md` in
  that folder. Add a file there and it's included with **no code
  changes**.
- `query: '?raw'` + `import: 'default'` — tells Vite to import each
  file's **raw text contents** (a string), not to parse it as a module.
- `eager: true` — import everything immediately at module load instead
  of returning lazy `() => import(...)` functions. Combined with this
  file running at module load, that's why the pipeline executes exactly
  once.
- The result is typed `as Record<string, string>` — an object mapping
  *file path → raw file contents*. (`Record<K, V>` is a built-in utility
  type for "object with keys of type K and values of type V".)

```ts
function parseStrands(raw: string | undefined): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}
```

The frontmatter line `strands: kindred, vitalis` arrives as the string
`"kindred, vitalis"`. This:

- returns `[]` for missing/empty (a "general" article, shown unfiltered
  but excluded from any active strand filter — see the `Article.strands`
  comment in the types file);
- `.split(',')` → `['kindred', ' vitalis']`;
- `.map(s => s.trim().toLowerCase())` → `['kindred', 'vitalis']`
  (trims whitespace, lowercases to match the canonical IDs in
  `data/strands.ts`);
- `.filter(Boolean)` drops empty strings. `Boolean` used as a callback
  is a common idiom: it keeps only **truthy** elements (an empty `''` is
  falsy, so stray trailing commas are cleaned up).

```ts
const articles: Article[] = Object.entries(files).map(([path, raw]) => {
  const { frontmatter, body } = parseFrontmatter(raw)
  return {
    slug: slugFromPath(path),
    title: frontmatter.title ?? '(untitled)',
    date: frontmatter.date ?? '',
    type: coerceType(frontmatter.type),
    author: frontmatter.author ?? 'NQ Smith',
    summary: frontmatter.summary ?? '',
    strands: parseStrands(frontmatter.strands),
    body,
    bodyHtml: renderMarkdown(body),
  }
})
```

This builds the array.

- `Object.entries(files)` turns the `{ path: raw }` object into
  `[ [path, raw], [path, raw], ... ]` so we can `.map` over it.
- `.map(([path, raw]) => ...)` — the parameter is **destructured** from
  each `[path, raw]` pair.
- `parseFrontmatter(raw)` returns `{ frontmatter, body }`, destructured
  on the next line.
- Every field uses `?? fallback` so a missing frontmatter key never
  produces `undefined` — `title` defaults to `'(untitled)'`, `author`
  to `'NQ Smith'`, etc. This is defensive: the content pipeline must
  never crash on a half-written file.
- `body` is the raw post-frontmatter Markdown (kept for completeness);
  `bodyHtml` is the rendered, syntax-highlighted HTML, computed *here,
  once*.

```ts
articles.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
```

Sort **newest-first**. `Array.sort` takes a comparator returning a
negative/zero/positive number. Returning `1` when `a.date < b.date`
pushes older dates *after* newer ones (descending). The trick noted in
the comment: dates are ISO `yyyy-mm-dd` strings, and that format sorts
**lexicographically** identical to chronologically, so plain string
comparison (`<`, `>`) is correct — no need to parse `Date` objects.
Note `sort` mutates the array in place.

```ts
export function loadArticles(): Article[] {
  return articles
}

export function findArticle(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug)
}
```

The public API. `loadArticles()` returns the full sorted list (for the
index/list view). `findArticle(slug)` returns the one matching article
or `undefined` (for the detail view; `Article | undefined` forces
callers to handle "not found"). `.find` returns the first matching
element or `undefined`.

## Libraries & APIs used

- **Vite `import.meta.glob`** — build-time bulk import. The `?raw` query
  imports file contents as strings. This is Vite-specific, not portable
  to plain Node/webpack without changes.
  <https://vitejs.dev/guide/features.html#glob-import>
- **`parseFrontmatter`** (local) — splits the YAML-ish head from the
  body. See its doc.
- **`renderMarkdown`** (local) — `marked` + `highlight.js`. See its doc.
- **JS built-ins**: `Object.entries`, `Array.map/filter/find/sort`,
  `String.split/trim/replace`, regex, `??` nullish coalescing.

## Concepts to learn here

- Doing expensive work **once at module load** instead of per-render.
- Vite glob imports as a zero-config content/plugin discovery mechanism.
- Defensive normalisation: `?? defaults`, `coerceType`, never throwing
  on bad input.
- Union types + type assertions (`as ArticleType`) to bridge "untyped
  text" into "strict typed model".
- Lexicographic sorting of ISO date strings (why no `Date` parsing).
- `.filter(Boolean)` to drop falsy items; `Object.entries` + array
  destructuring in `.map`.
- Type-only imports (`import type`).

## How to edit it safely

- **To publish a new Marginalia article: just create a new
  `src/content/marginalia/<slug>.md` file** with the frontmatter schema
  below. `import.meta.glob` picks it up automatically — no edits to this
  file. The filename (minus `.md`) becomes the URL slug.

  Required/known frontmatter keys (all optional but recommended):
  ```yaml
  ---
  title: Your title
  date: 2026-05-01            # ISO yyyy-mm-dd, drives the sort
  type: essay                 # one of: essay | note | dispatch | paper-summary | link-roundup
  author: NQ Smith            # defaults to 'NQ Smith' if omitted
  summary: One-line teaser shown in the list view.
  strands: kindred, vitalis   # optional; comma-separated; matched to data/strands.ts IDs
  ---
  Body markdown starts here.
  ```
- **Adding a new article `type`:** add the literal to `ArticleType` in
  `src/components/Marginalia/types.ts` *and* to the `KNOWN_TYPES` array
  here. Miss either and the type silently coerces to `'note'`.
- **`strands` values must be lowercase canonical IDs** (`kindred`,
  `vitalis`, `vitrix`) matching `STRANDS[].id` in `data/strands.ts`, or
  the filter won't match. The parser lowercases for you, but the *spelling*
  must match.
- **Keep `date` as ISO `yyyy-mm-dd`.** Any other format breaks the
  string-comparison sort (e.g. `30/04/2026` would sort wrongly).
- Don't move the parsing into a React component/hook "to be reactive" —
  the content is static; module-load is intentional and faster.
