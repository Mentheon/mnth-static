# `src/content/marginalia/pose-tracking-politics.md`

## What this file is

A **content file** (not code): the longest Marginalia article, of
`type: essay`. Plain Markdown + frontmatter. The pipeline in
`src/lib/marginalia/` reads it. This is the most instructive content file
because it is the **only one with a fenced code block**, so it actually
exercises the custom syntax-highlighting renderer in
[`renderMarkdown.ts`](../../lib/marginalia/renderMarkdown.ts.md). It also
contains a Markdown **blockquote**.

## Line-by-line / block walkthrough

```markdown
---
title: On the politics of pose tracking
date: 2026-04-12
type: essay
author: NQ Smith
summary: Calibration is never neutral. Notes on consent, defaults, and what a body in WebXR is allowed to be.
strands: kindred, vitalis
---
```

Frontmatter, same schema as all Marginalia files (full table in the
`april-dispatch.md` doc). Notable: `type: essay` (long-form), and
`strands: kindred, vitalis` → `parseStrands` yields
`['kindred', 'vitalis']`, both of which must match `STRANDS[].id` in
[`data/strands.ts`](../../data/strands.ts.md) (Kindreon, Aevorix). The
article appears under either strand's filter and in the general list.

```markdown
## What a calibration step is for
...
> The calibration step is doing two jobs — making the avatar work,
> and making the user agree — and we have only ever resourced it
> for the first.
```

- `## ...` → `<h2>` (the essay has several section headings).
- Lines starting with `> ` are a Markdown **blockquote**; `marked`
  renders them as `<blockquote>`. Useful to know which Markdown features
  the pipeline supports — blockquotes do, because GFM is enabled
  (`gfm: true` in `renderMarkdown.ts`).

````markdown
```ts
// Joints we get directly from WebXR's hand-tracking input source.
type JointKey =
  | 'wrist'
  | 'thumb-tip'
  ...

interface TrackedJoint {
  key: JointKey
  position: [number, number, number]
  radius: number
}
```
````

This is the key teaching moment. A **fenced code block**: three
backticks, a **language tag** (`ts`), the code, then three closing
backticks. When `marked` encounters this it calls the custom `code`
renderer defined in
[`renderMarkdown.ts`](../../lib/marginalia/renderMarkdown.ts.md):

- `lang` is `'ts'`. `hljs.getLanguage('ts')` resolves (TypeScript is in
  the `highlight.js/lib/common` bundle), so it takes the
  `hljs.highlight(text, { language: 'ts' })` path — *explicit*
  highlighting rather than auto-detect.
- The output is wrapped as
  `<pre class="hljsBlock"><code class="hljs">…<span class="hljs-keyword">…</span>…</code></pre>`.
- Those `hljs-*` classes are coloured by `ArticleBody.module.css`, not
  by an imported highlight.js theme (so the palette stays on-brand).

If the fence had **no** language tag, the renderer would fall back to
`hljs.highlightAuto(text)` (heuristic detection). If you tag a language
highlight.js's common bundle doesn't know, it also falls back to
auto-detect.

The TypeScript shown *inside* the article is itself a nice example of a
literal **union type** (`JointKey`) and an `interface` — the same
concepts used in `src/data/strands.ts` — but note it's just illustrative
prose content here, not executed.

## How this file flows through the pipeline

Same five steps as every Marginalia file (diagram in
[`loadArticles.ts`](../../lib/marginalia/loadArticles.ts.md)):
discovered by `import.meta.glob` (location is the only "registration"),
split by `parseFrontmatter`, rendered by `renderMarkdown` — **this is
where the code block becomes highlighted HTML** — assembled into an
`Article` (`slug = pose-tracking-politics`, `strands = ['kindred',
'vitalis']`), sorted by `date`, exposed via `loadArticles()` /
`findArticle('pose-tracking-politics')`.

## Libraries & APIs used

None directly in the file. Pipeline-side, this is the one content file
that actually triggers **`highlight.js`** (via the custom `marked` code
renderer). `marked` also handles the headings, blockquote, lists, and
emphasis. See the `renderMarkdown.ts` doc for details and links.

## Concepts to learn here

- Fenced code blocks with a language tag and how they reach the custom
  highlight.js renderer (explicit vs. auto-detected language; fallback
  behaviour).
- Generated `hljs-*` classes are themed by project CSS, not a bundled
  theme.
- Markdown blockquotes (`> `) and multi-section essays with `##`
  headings under GFM.
- `essay` type; multi-strand cross-linking (`kindred, vitalis`).

## How to edit it safely

- **Code blocks:** always put a correct language tag after the opening
  fence (```` ```ts ````, ```` ```js ````, ```` ```css ````, …) for
  accurate highlighting. Untagged or unknown-language blocks still
  render, just via auto-detection. To restyle highlighting, edit
  `ArticleBody.module.css` — *don't* import a highlight.js theme.
- **Strand tags / frontmatter:** lowercase IDs matching
  `src/data/strands.ts`, one comma-separated line; one line per
  frontmatter key; quote values with colons; keep `date` ISO
  `yyyy-mm-dd`.
- Renaming the file changes the slug/URL.
- The TypeScript inside the article is content, not compiled — edit it
  freely as prose; it won't be type-checked.
