# `src/content/marginalia/evening-notes-on-bpm.md`

## What this file is

A **content file** (not code): a short Marginalia article of
`type: note`. Plain Markdown + a frontmatter header. The pipeline in
`src/lib/marginalia/` consumes it; the file itself contains no logic.

This file is a good example of **two things at once**: the `note` type
(the *default* `ArticleType`) and a **multi-strand** frontmatter tag.

## Line-by-line / block walkthrough

```markdown
---
title: Evening notes on BPM
date: 2026-04-05
type: note
author: NQ Smith
summary: A short aside on heart-rate variability authoring — the difference between a number on a chart and a number a designer can act on.
strands: vitalis, vitrix
---
```

The frontmatter schema (consistent across all Marginalia files; see the
`april-dispatch.md` doc for the full table). Two points specific to this
file:

- **`type: note`** — `note` is also the *fallback* value
  `coerceType` returns in
  [`loadArticles.ts`](../../lib/marginalia/loadArticles.ts.md) when
  `type` is missing or unrecognised. So stating it explicitly here is
  equivalent to omitting it — but being explicit is clearer for the
  author and future-proofs the file if the default ever changes.
- **`strands: vitalis, vitrix`** — *two* strand IDs, comma-separated on
  one line. `parseStrands` does
  `"vitalis, vitrix".split(',')` → `['vitalis', ' vitrix']`, then
  `.map(s => s.trim().toLowerCase())` → `['vitalis', 'vitrix']`, then
  `.filter(Boolean)` (drops empties). The result is
  `strands: ['vitalis', 'vitrix']`. Both IDs must exist as `STRANDS[].id`
  in [`data/strands.ts`](../../data/strands.ts.md) (Aevorix and
  Acumentra). This article therefore surfaces under *either* the Aevorix
  **or** the Acumentra strand filter, and in the unfiltered list.

```markdown
I sat with a heart-rate trace tonight ... The interesting question
isn't *what was the user's heart rate at second 38?* but *was it
doing the kind of moving we wanted it to be doing?*

... Note to self: spend a session next week ...
```

The body is three short paragraphs (blank-line separated). `*...*` marks
emphasis (`<em>`). No headings, lists, or code — the simplest possible
body. [`renderMarkdown`](../../lib/marginalia/renderMarkdown.ts.md) turns
it into `<p>` elements with `<em>` spans.

## How this file flows through the pipeline

Same as every Marginalia file (full diagram in
[`loadArticles.ts`](../../lib/marginalia/loadArticles.ts.md)):

1. `import.meta.glob` discovers the file by virtue of its location, not
   any explicit reference.
2. `parseFrontmatter` → `{ frontmatter, body }`.
3. `renderMarkdown(body)` → HTML.
4. `loadArticles.ts` assembles the `Article`: `slug =
   evening-notes-on-bpm`, `type = 'note'`, `strands = ['vitalis',
   'vitrix']`, defaults filled for absent keys.
5. Sorted newest-first by `date`; retrievable via
   `findArticle('evening-notes-on-bpm')`.

## Libraries & APIs used

None directly. Pipeline: Vite `import.meta.glob`, `marked`,
`highlight.js` (the last unused — no code blocks here).

## Concepts to learn here

- `note` is both a valid type *and* the pipeline's default fallback.
- **Multiple strand tags** on one comma-separated line, and how
  `parseStrands` trims/lowercases/filters them.
- Cross-referencing content to multiple research strands so it appears
  under several filters.
- The minimal Markdown body (paragraphs + emphasis only).

## How to edit it safely

- **Strand tags:** keep them lowercase and matching `STRANDS[].id`
  exactly. Add/remove IDs in the single comma-separated `strands:` line.
  A typo (e.g. `vitrx`) silently makes the article invisible to that
  filter — there's no validation; cross-check against
  `src/data/strands.ts`.
- One line per frontmatter key; quote values containing colons.
- `date` must stay ISO `yyyy-mm-dd` for correct sorting.
- Renaming the file changes the slug/URL.
- Body is free-form Markdown; edits re-render on next build.
