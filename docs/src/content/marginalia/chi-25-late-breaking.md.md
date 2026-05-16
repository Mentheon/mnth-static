# `src/content/marginalia/chi-25-late-breaking.md`

## What this file is

A **content file** (not code): a Marginalia article of
`type: paper-summary` — notes summarising an academic paper. It is plain
Markdown plus a frontmatter metadata header. The build pipeline in
`src/lib/marginalia/` reads it; this file holds no logic.

This one is useful for learning because it **uses the `strands:` field**
(unlike `april-dispatch.md`) and exercises more Markdown features
(headings, bold, bullet lists).

## Line-by-line / block walkthrough

```markdown
---
title: A small CHI '25 late-breaking — restraint as a WebXR design move
date: 2026-03-28
type: paper-summary
author: NQ Smith
summary: Notes on a late-breaking work that argues for stripping WebXR scenes back, not building them up.
strands: kindred
---
```

Standard frontmatter. The full schema (see also the
`april-dispatch.md` doc):

| Key | Notes for this file |
|-----|---------------------|
| `title` | Contains an apostrophe and an em-dash — fine, it's plain text on one line, not quoted (no colon, so no quoting needed). |
| `date` | ISO `yyyy-mm-dd`; drives the newest-first sort in `loadArticles.ts`. |
| `type` | `paper-summary` — one of the five valid `ArticleType` literals. |
| `author` | Explicit here; would default to `NQ Smith` if omitted. |
| `summary` | One-line teaser for the list view. |
| `strands` | **`kindred`** — a single canonical strand ID. |

The interesting bit: **`strands: kindred`**.
[`parseStrands`](../../lib/marginalia/loadArticles.ts.md) does
`"kindred".split(',').map(s => s.trim().toLowerCase()).filter(Boolean)`
→ `['kindred']`. That ID must match `STRANDS[].id` in
[`data/strands.ts`](../../data/strands.ts.md) (where `kindred` is
Kindreon). Because this article is tagged with a strand, it appears both
in the unfiltered list **and** when the Kindreon strand filter is
active. For multiple strands you'd write `strands: kindred, vitalis`.

```markdown
A late-breaking work that turned up in the CHI '25 program caught my
eye ... *"What you don't add: subtractive design heuristics ..."*

## Their three-part heuristic

- **Default to absence.** Every visual ...
- **Name the prop.** ...
- **Test for the stop.** ...
```

The body shows several Markdown constructs that
[`renderMarkdown`](../../lib/marginalia/renderMarkdown.ts.md) (via
`marked`) converts:

- `## Their three-part heuristic` → an `<h2>` heading (`##` = level 2).
- `- item` lines → an unordered list (`<ul><li>`).
- `**Default to absence.**` → bold (`<strong>`).
- `*"..."*` → emphasis (`<em>`).
- Blank lines separate paragraphs (`breaks: false` config).

There are no fenced code blocks in this article, so the custom
highlight.js code renderer in `renderMarkdown.ts` isn't triggered here
(contrast with `pose-tracking-politics.md`, which has a TypeScript
block).

## How this file flows through the pipeline

Identical to every Marginalia file:

1. `import.meta.glob` in `loadArticles.ts` discovers it (filename in the
   folder is all that's needed — nothing references it explicitly).
2. `parseFrontmatter` splits header from body.
3. `renderMarkdown` turns the body (headings, lists, emphasis) into
   HTML.
4. `loadArticles.ts` builds the `Article`: `slug` =
   `chi-25-late-breaking` (from the filename), `strands: ['kindred']`,
   defaults applied to any missing field.
5. Sorted into the list by `date`; reachable via
   `findArticle('chi-25-late-breaking')`.

Full diagram: [`loadArticles.ts`](../../lib/marginalia/loadArticles.ts.md).

## Libraries & APIs used

None directly. Pipeline-side: Vite `import.meta.glob` (discovery),
`marked` (Markdown→HTML), `highlight.js` (code blocks — unused by this
file as it has none).

## Concepts to learn here

- The `strands:` frontmatter field and how it cross-links content to the
  research-strand data and the filter UI.
- Canonical IDs must match `STRANDS[].id` exactly (lowercase).
- Comma-separated single-line lists in frontmatter (the only "list"
  form the tiny parser supports).
- Markdown headings/lists/bold/emphasis → HTML via `marked`.

## How to edit it safely

- **To tag this against more strands:** `strands: kindred, vitalis`
  (comma-separated, lowercase, must match IDs in `data/strands.ts`). To
  make it general, remove the line.
- Keep frontmatter one line per key; quote any value containing a colon.
- Keep `date` ISO `yyyy-mm-dd`.
- Renaming the file changes the slug/URL.
- Body edits are free-form Markdown; they re-render on the next build.
  If you add a fenced code block, the language tag after the opening
  fence (```` ```ts ````) controls syntax highlighting.
