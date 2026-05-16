# `src/content/marginalia/april-dispatch.md`

## What this file is

A **content file**, not code. It's one article in the "Marginalia"
section (the site's notes/blog). It is plain Markdown with a
**frontmatter** metadata block at the top. It contains *no JavaScript* —
the build pipeline reads it as raw text, parses the metadata, renders the
prose to HTML, and the site displays it. You author content here; the
code that consumes it lives in `src/lib/marginalia/`.

This particular file is a short "dispatch" (`type: dispatch`) — a brief
monthly studio update.

## Line-by-line / block walkthrough

```markdown
---
title: April dispatch
date: 2026-04-30
type: dispatch
author: NQ Smith
summary: A short note on what the studio's been doing this month — Kindreon milestones, a paper draft, and one good visit.
---
```

Everything between the opening `---` and the closing `---` is the
**frontmatter**: single-line `key: value` metadata. The
[`parseFrontmatter`](../../lib/marginalia/parseFrontmatter.ts.md) parser
turns this into `{ title, date, type, author, summary }`. The
**frontmatter schema** used across all Marginalia files:

| Key       | Required? | Used for | Notes |
|-----------|-----------|----------|-------|
| `title`   | recommended (defaults to `(untitled)`) | headline in list + detail | |
| `date`    | recommended (defaults to `''`) | sort order + display | **must be ISO `yyyy-mm-dd`** — the list is sorted by string comparison, which only works for that format |
| `type`    | recommended (defaults to `note`) | category tag/filter | must be one of: `essay`, `note`, `dispatch`, `paper-summary`, `link-roundup` (anything else silently becomes `note`) |
| `author`  | optional (defaults to `NQ Smith`) | byline | |
| `summary` | optional (defaults to `''`) | teaser in the list view | one line |
| `strands` | optional (defaults to none) | cross-link to research strands; comma-separated lowercase IDs | *absent here* → this is a "general" article: it shows in the unfiltered list but is hidden when a strand filter is active |

Note this file has **no `strands:` line**, so
`parseStrands(undefined)` returns `[]` in
[`loadArticles.ts`](../../lib/marginalia/loadArticles.ts.md).

```markdown
A quiet month, by design. The Kindreon team locked the v0.4 prop
vocabulary at the start of April ...
```

Everything after the closing `---` is the **body**: ordinary Markdown
prose. Here it's plain paragraphs separated by blank lines (the renderer
is configured with `breaks: false`, so a blank line — not just a
newline — starts a new paragraph). `*low-arousal authoring*` uses
Markdown emphasis (`*...*` → `<em>`). This body is passed to
[`renderMarkdown`](../../lib/marginalia/renderMarkdown.ts.md), which
turns it into the HTML the page displays.

## How this file flows through the pipeline

1. **Discovery** — `import.meta.glob('../../content/marginalia/*.md',
   { query: '?raw', eager: true })` in `loadArticles.ts` finds this file
   at build time and imports its contents as a raw string. *No code
   references this filename anywhere* — being in the folder is enough.
2. **Split** — `parseFrontmatter(raw)` separates the `---` block from the
   body.
3. **Render** — `renderMarkdown(body)` converts the prose to HTML.
4. **Normalise** — `loadArticles.ts` builds an `Article` object:
   `slug` comes from the filename (`april-dispatch`), missing fields get
   defaults, `type` is validated against the known set.
5. **Sort & expose** — all articles are sorted newest-first by `date`;
   `loadArticles()` returns the list, `findArticle('april-dispatch')`
   returns this one for its detail page.

Read [`loadArticles.ts`](../../lib/marginalia/loadArticles.ts.md) for the
full pipeline diagram.

## Libraries & APIs used

Indirectly (this file itself uses none): Vite's `import.meta.glob` for
discovery, `marked` for Markdown rendering, `highlight.js` for any code
blocks. See the docs for `renderMarkdown.ts` and `loadArticles.ts`.

## Concepts to learn here

- Markdown frontmatter as a metadata convention.
- **Content vs. code**: this file is data; the behaviour is in the
  pipeline.
- Why `date` must be ISO format (string-sortable).
- Omitting `strands` → "general" article (visible unfiltered, hidden
  under a strand filter).
- The Markdown `breaks: false` paragraph rule (blank line = new
  paragraph).

## How to edit it safely

- **Editing prose:** just edit the text below the closing `---`. It
  re-renders automatically on next build/dev reload.
- **Changing metadata:** keep each frontmatter key on **one line**
  (`key: value`). The parser doesn't support YAML lists or multi-line
  values. If a value contains a colon, wrap it in quotes
  (`title: "Foo: bar"`).
- **Don't change `type` to a value outside the five allowed** — it will
  silently fall back to `note`. To introduce a new type, edit
  `ArticleType` and `KNOWN_TYPES` (see `loadArticles.ts` doc).
- **Renaming the file changes the slug/URL** (`#/marginalia/april-
  dispatch`). Any links to the old slug break.
- Keep `date` as `yyyy-mm-dd` or the article will sort to the wrong
  position in the list.
