# `src/components/Marginalia/types.ts`

## What this file is

This file is the **shared type vocabulary** for the entire Marginalia
feature. It contains no runtime code at all — no functions, no
components, no values. Every line here is a TypeScript *type
declaration*. When the project is compiled to JavaScript, this whole
file effectively disappears; it exists purely to let the compiler check
that the rest of the feature is internally consistent.

Because it defines the **shape of an article** and the **props the
top-level component accepts**, this file (together with
[`Marginalia.tsx`](./Marginalia.tsx.md)) is the best place to start
reading the feature. Almost every other file in `Marginalia/` imports
`Article` from here.

### Feature architecture (read this first)

Marginalia is a small blog/notes section with two views:

1. **List view** — an index page of article cards plus a strand filter.
   Rendered by [`List/MarginaliaList.tsx`](./List/MarginaliaList.tsx.md).
2. **Detail view** — one full article with its rendered markdown body.
   Rendered by
   [`Detail/MarginaliaArticle.tsx`](./Detail/MarginaliaArticle.tsx.md).

The single component `Marginalia` (in `Marginalia.tsx`) decides which
view to show based on its `slug` prop. There is **no React Router**
here. Routing is driven by the URL **hash** (`window.location.hash`,
e.g. `#marginalia` or `#marginalia/april-dispatch?strand=kindred`).
Some parent component (outside this folder) reads the hash and feeds the
parsed pieces into `Marginalia` as the `slug` and `strandFilter` props
described below.

The article *data* does not come from a server. At build time,
`src/lib/marginalia/loadArticles.ts` glob-imports every Markdown file
in `src/content/marginalia/*.md`, parses its frontmatter, renders the
body to HTML once, and produces an array of `Article` objects matching
the interface in this file. (Those pipeline files are documented
separately — cross-referenced by path only.)

## Line-by-line / block walkthrough

```ts
// Shared types for the Marginalia section.
```

A plain comment stating the file's purpose. Comments in `.ts` files use
`//` (single line) or `/* ... */` (block) just like JavaScript.

```ts
export type ArticleType =
  | 'essay'
  | 'note'
  | 'dispatch'
  | 'paper-summary'
  | 'link-roundup'
```

This is a **string literal union type** — one of the most useful
TypeScript ideas.

- `export` makes the type usable from other files.
- `type ArticleType = ...` declares a *type alias* named `ArticleType`.
- `'essay' | 'note' | ...` — the `|` is the **union operator**. It
  reads "OR". So an `ArticleType` value must be *exactly one of* these
  five specific strings. `'Essay'` (capital E) or `'blog'` would be a
  compile error.
- The leading `|` before `'essay'` is optional, purely cosmetic — it
  lets every member line up vertically. This is a common formatting
  idiom for multi-line unions.

Why do this instead of just `type ArticleType = string`? Because the
union gives you **exhaustiveness and autocomplete**. Wherever a piece of
code switches on the article type (see
[`shared/TypeChip.tsx`](./shared/TypeChip.tsx.md), which maps each of
these to a label and a colour), the compiler can warn if a case is
missing.

```ts
export interface Article {
  slug: string
  title: string
  date: string // ISO yyyy-mm-dd
  type: ArticleType
  author: string
  summary: string
  strands: string[]
  body: string // raw markdown (post-frontmatter)
  bodyHtml: string // rendered html (memoised at module load)
}
```

This is an **`interface`** — the canonical way to describe the shape of
an object in TypeScript. It says: "anything calling itself an `Article`
must have exactly these properties with these types."

Field by field:

- `slug: string` — the URL-safe identifier, derived from the markdown
  filename (e.g. `april-dispatch.md` → `"april-dispatch"`). It is the
  primary key: detail navigation is `#marginalia/<slug>` and
  `findArticle(slug)` looks articles up by it.
- `title: string` — display headline.
- `date: string` — note the inline comment `// ISO yyyy-mm-dd`. It is a
  *string*, not a `Date` object. The format (`2026-04-30`) is chosen
  deliberately because ISO date strings sort correctly with a plain
  string comparison — see how `loadArticles.ts` sorts newest-first
  without ever constructing a `Date`. The string is formatted for
  display later in [`shared/ArticleMeta.tsx`](./shared/ArticleMeta.tsx.md).
- `type: ArticleType` — reuses the union from above. This is *type
  composition*: one type referencing another.
- `author: string`, `summary: string` — plain text fields.
- `strands: string[]` — an **array of strings** (`string[]` means "array
  whose elements are all strings"). Each entry is a strand id like
  `'kindred'`, cross-linking the article to an R&D strand defined in
  `src/data/strands.ts`. Read the multi-line comment above it carefully:
  an **empty / missing** array means the article is "general" — it shows
  in the unfiltered list but is hidden whenever a strand filter is
  active. That single rule drives the filtering logic in
  [`List/MarginaliaList.tsx`](./List/MarginaliaList.tsx.md).
- `body: string` — the *raw* markdown text, with frontmatter already
  stripped off.
- `bodyHtml: string` — the body **already rendered to an HTML string**.
  The comment "memoised at module load" matters: the markdown→HTML
  conversion happens once when `loadArticles.ts` first runs, not on
  every render. This pre-rendered string is what
  [`Detail/ArticleBody.tsx`](./Detail/ArticleBody.tsx.md) injects via
  `dangerouslySetInnerHTML`.

```ts
export interface MarginaliaProps {
  slug: string | null
  strandFilter?: string | null
}
```

This interface describes the **props** (the input arguments) of the
top-level `Marginalia` React component.

- `slug: string | null` — another union, this time with `null`. The
  comment is the whole routing model in one line: *`null` → list view;
  otherwise → detail view of that slug*. So the presence/absence of a
  slug is literally how the component chooses which view to render.
- `strandFilter?: string | null` — the **`?`** after the name makes this
  property **optional**. A parent may pass it or omit it entirely.
  `string | null` means: a strand id to filter by, or `null` for "show
  everything". The comment notes it is ignored on the detail view (a
  single article doesn't filter).

Notice the subtle difference: `slug` is *required* (no `?`) but may be
`null`; `strandFilter` is *optional* (`?`) and may also be `null`.
"Optional" (`?`) is about whether the caller must supply the key at all;
the union with `null` is about what *value* it may hold once supplied.

## Libraries & APIs used

- **TypeScript** language features only: `type` aliases, string literal
  union types (`|`), `interface`, array types (`T[]`), optional members
  (`?`), and `null` in unions. No runtime libraries.

## Concepts to learn here

- **`interface` vs `type`**: both describe shapes. A rough rule used in
  this codebase — `interface` for object shapes (`Article`,
  `MarginaliaProps`), `type` for unions/aliases (`ArticleType`). They
  are largely interchangeable for objects; the distinction is mostly
  stylistic here.
- **String literal union types** as a lightweight, type-safe enum.
- **Optional members (`?`) vs `| null`** — two different kinds of
  "might not be there", explained above.
- **Types are erased at runtime** — nothing in this file produces
  JavaScript; it only constrains the code that imports it.
- **A shared types module as a contract**: the data pipeline
  (`loadArticles.ts`) *produces* `Article` objects; the UI components
  *consume* them. This file is the agreed contract between them, which
  is why a change here ripples through the whole feature.

## How to edit it safely

- **Adding a new article field** (say `readingTime: number`): add it to
  the `Article` interface here, then *the compiler becomes your
  to-do list* — every place that builds an `Article`
  (`src/lib/marginalia/loadArticles.ts`, cross-referenced, not owned by
  this doc) will fail to compile until it supplies the new field. Make
  it optional (`readingTime?: number`) if you want a gentler migration.
- **Adding a new article type** (e.g. `'review'`): add `| 'review'` to
  the `ArticleType` union. Then check the consumers that switch on type
  — at minimum `shared/TypeChip.tsx` (label + colour map) and
  `src/lib/marginalia/loadArticles.ts`'s `KNOWN_TYPES` list. The union
  makes those the natural failure points.
- **Strands** are *not* listed here — they are plain `string`s validated
  against `src/data/strands.ts` at render time. To add a filterable
  strand you edit `src/data/strands.ts`, **not** this file. See
  [`List/StrandFilter.tsx`](./List/StrandFilter.tsx.md).
- **Gotcha**: don't change `date` to a `Date` object lightly — the
  string form is relied upon for lexicographic sorting in
  `loadArticles.ts` and for the explicit UTC parse in
  `shared/ArticleMeta.tsx`. Changing the type would break both.
- This file is paired (conceptually) with
  [`Marginalia.tsx`](./Marginalia.tsx.md), which consumes
  `MarginaliaProps`, and is re-exported by
  [`index.ts`](./index.ts.md).
