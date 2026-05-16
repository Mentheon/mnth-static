# `src/content/marginalia/useful-things-this-month.md`

## What this file is

A **content file** (not code): a Marginalia article of
`type: link-roundup` — a curated list of links. Plain Markdown +
frontmatter. The pipeline in `src/lib/marginalia/` consumes it. This
file is the best example of Markdown **links** flowing through the
renderer, and of the `link-roundup` article type.

## Line-by-line / block walkthrough

```markdown
---
title: Useful things this month
date: 2026-04-22
type: link-roundup
author: NQ Smith
summary: A small reading list — five links from April that are worth your time.
strands: vitrix
---
```

Frontmatter, the shared schema (full table in the `april-dispatch.md`
doc). Specifics:

- **`type: link-roundup`** — the fifth and last member of the
  `ArticleType` union (`'essay' | 'note' | 'dispatch' | 'paper-summary'
  | 'link-roundup'`). It's in `KNOWN_TYPES` in
  [`loadArticles.ts`](../../lib/marginalia/loadArticles.ts.md), so
  `coerceType` keeps it as-is rather than falling back to `note`.
- **`strands: vitrix`** — a single ID. `parseStrands('vitrix')` →
  `['vitrix']`. Must match `STRANDS[].id` in
  [`data/strands.ts`](../../data/strands.ts.md) (Acumentra). Article
  shows in the general list and under the Acumentra filter.

```markdown
- [On reading slowly in fast fields](https://example.com/slow-reading) — a short blog post ...
- [The author's "scratch repo" pattern](https://example.com/scratch-repo) — a tiny convention ...
- [Why your design system is mostly a vocabulary](https://example.com/design-vocab) — ...
- [A long interview with a clinical-trials statistician](https://example.com/stats-interview) — ...
- [An old talk on "interfaces of restraint"](https://example.com/restraint-talk) — ...

Send me your own if you have them.
```

The body is a single Markdown **unordered list** where each item
contains a **link**. Syntax `[link text](url)` →
[`renderMarkdown`](../../lib/marginalia/renderMarkdown.ts.md) (via
`marked`) produces `<ul><li><a href="https://example.com/...">link
text</a> — a short blog post ...</li>…</ul>`. The trailing line becomes
a `<p>`. Two things worth noting:

- The `—` (em-dash) and straight quotes are passed through literally;
  `marked` doesn't smarten punctuation by default.
- These are placeholder `example.com` URLs — the article is real
  content but the targets are stand-ins. The renderer doesn't validate
  URLs; whatever's in the parentheses becomes the `href`.

No headings or code blocks here, so the highlight.js path in
`renderMarkdown.ts` is not exercised by this file.

## How this file flows through the pipeline

Same as all Marginalia files (full diagram in
[`loadArticles.ts`](../../lib/marginalia/loadArticles.ts.md)):

1. `import.meta.glob('../../content/marginalia/*.md', …)` discovers it
   automatically — being in the folder is the only "registration"
   needed.
2. `parseFrontmatter` separates header and body.
3. `renderMarkdown` turns the list + links into HTML `<ul>`/`<a>`.
4. `loadArticles.ts` builds the `Article`: `slug =
   useful-things-this-month`, `type = 'link-roundup'`, `strands =
   ['vitrix']`, defaults for any missing key.
5. Sorted newest-first by `date`; available via
   `findArticle('useful-things-this-month')` and in `loadArticles()`.

## Libraries & APIs used

None directly. Pipeline: Vite `import.meta.glob` (discovery), `marked`
(Markdown list + links → HTML), `highlight.js` (unused — no code here).

## Concepts to learn here

- The `link-roundup` `ArticleType` and the full five-value union.
- Markdown link syntax `[text](url)` and unordered lists → HTML.
- The renderer passes punctuation/URLs through verbatim (no smartypants,
  no link validation).
- Single-strand cross-linking; ID must match `data/strands.ts`.

## How to edit it safely

- **Adding links:** add `- [text](https://...)` list items. Keep the
  blank line before the closing paragraph so it stays a separate `<p>`.
- **External links:** by default `marked` renders a plain `<a>` (no
  `target="_blank"` / `rel="noopener"`). If you want links to open in a
  new tab safely, that's a renderer concern — change it in
  `renderMarkdown.ts` (add a `link` renderer override), not here.
- **Frontmatter rules:** one line per key; quote any value with a colon;
  `date` stays ISO `yyyy-mm-dd`; `strands` lowercase and matching
  `src/data/strands.ts`.
- Renaming the file changes the slug/URL.
- Replace the `example.com` placeholders with real URLs when publishing;
  nothing validates them.
