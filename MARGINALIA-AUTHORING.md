# Authoring Mentheon Marginalia articles

Drop a `.md` file into `src/content/marginalia/` and it'll appear in the list view at `/#marginalia` on the next dev-server reload (or build). No registration, no index file.

---

## File location & naming

```
src/content/marginalia/<slug>.md
```

- The **filename** (without `.md`) becomes the article's URL slug.
  - `pose-tracking-politics.md` → `/#marginalia/pose-tracking-politics`
- Use lowercase, hyphenated filenames. Avoid spaces, underscores, capitals.
- Don't move articles into subdirectories — the loader globs only the top level of `marginalia/`.

---

## File structure

Every article is **frontmatter + body**, separated by `---` fences:

```
---
title: On the politics of pose tracking
date: 2026-04-12
type: essay
author: NQ Smith
summary: A short blurb shown in the list view.
---

Body markdown follows here…
```

The opening `---` MUST be the very first line of the file. The closing `---` MUST sit on its own line. Both fences need a newline immediately after them. If either is missing or malformed, the loader treats the whole file as body (no metadata) and it'll render but with `(untitled)` and an empty meta row.

---

## Frontmatter fields

The parser is intentionally minimal — single-line `key: value` pairs only. No nested objects, no arrays, no multi-line strings.

| Field     | Required | Format               | Notes |
|-----------|----------|----------------------|-------|
| `title`   | yes      | plain string         | Falls back to `(untitled)` if missing. Wrap in quotes if it contains a colon: `title: "On X: a note"` |
| `date`    | yes      | `YYYY-MM-DD`         | ISO format. Sorting is lexicographic, so `2026-04-12` works correctly without date parsing. A missing date sorts to the bottom. |
| `type`    | yes      | one of the recognised types (see below) | Anything else falls back to `note` |
| `author`  | optional | plain string         | Defaults to `NQ Smith` |
| `summary` | optional | plain string         | Shown on the list-view card. Aim for ~140 chars / two lines max — the card clamps. Empty = card shows just title + meta. |

### Quoting

Values are trimmed. Wrapping single or double quotes are stripped (`title: "Foo"` and `title: 'Foo'` both yield `Foo`). Use quotes if your value contains a literal colon, otherwise everything before the first colon would be treated as the key.

### Recognised `type` values

| `type` value     | Display label    | Chip colour |
|------------------|------------------|-------------|
| `essay`          | Essay            | crimson     |
| `note`           | Note             | plum        |
| `dispatch`       | Dispatch         | ink         |
| `paper-summary`  | Paper summary    | grape       |
| `link-roundup`   | Link roundup     | grape       |

Any other value silently coerces to `note`.

---

## Body markdown

Standard CommonMark + GFM (GitHub-flavoured) features are supported via [`marked`](https://marked.js.org). Specifically:

### Headings

```
## Section heading
### Sub-heading
```

- `#` (h1) is reserved for the page title — don't use it in the body. Start at `##`.
- Every section heading gets generous top margin and a clean line.

### Paragraphs

Just write them. Blank line between paragraphs.

The **first paragraph** of the article gets an automatic crimson dropcap on its first letter (CSS `::first-letter`). Don't try to control it manually.

### Emphasis

```
*italic*  or  _italic_
**bold**  or  __bold__
~~strikethrough~~
```

### Lists

```
- bullet
- bullet
  - nested bullet

1. numbered
2. numbered
```

### Links

```
[link text](https://example.com)
```

Links render in ink with an underline and turn crimson on hover. External-link icons are not added — keep the meaning in the link text.

### Images

```
![alt text](/path-or-url-to-image.png)
```

- Images get `max-width: 100%`, a 1px ink-soft border, and 1.5rem of vertical margin.
- For local images, drop them in `public/marginalia/` and reference as `/marginalia/your-file.png`.
- Always include alt text.

### Blockquotes

```
> A quote, set in plum italic with a 3px crimson left border.
> Multi-line quotes wrap normally.
```

### Inline code

Backtick a `term` inline — renders monospaced on a soft-cream pill.

### Fenced code blocks

Use triple backticks with a language tag for syntax highlighting:

````
```ts
type Phase = 'past' | 'current' | 'projected'

interface Article {
  slug: string
  title: string
}
```
````

**Supported languages** (via `highlight.js/lib/common`):

`bash`, `c`, `cpp`, `csharp`, `css`, `diff`, `go`, `graphql`, `html`/`xml`, `ini`/`toml`, `java`, `javascript`/`js`, `json`, `kotlin`, `less`, `lua`, `makefile`, `markdown`, `objectivec`, `perl`, `php`, `php-template`, `plaintext`, `python`/`py`, `python-repl`, `r`, `ruby`, `rust`, `scss`, `shell`/`console`, `sql`, `swift`, `typescript`/`ts`, `vbnet`, `wasm`, `yaml`.

If you omit the language tag, highlight.js auto-detects. If you genuinely don't want highlighting, use ` ```text `.

The on-brand palette: ink text on bg-soft, crimson keywords, plum strings, ink-quiet comments, grape numbers.

### Horizontal rules

```
---
```

A single line of three or more hyphens. (Make sure there's a blank line before it so it isn't mistaken for an alternate h2 underline.)

### Tables (GFM)

```
| Column A | Column B |
|----------|----------|
| value    | value    |
```

Tables work but aren't currently styled beyond browser defaults — if you need them often, ask and we'll add table styles to `ArticleBody.module.css`.

---

## What's NOT supported

- **HTML in markdown**: technically `marked` will pass it through, but don't rely on it. Keep articles in pure markdown so the renderer stays the source of truth.
- **Footnotes**: not enabled. Use inline links instead.
- **Math (`$...$` / `$$...$$`)**: not enabled. Ask and we'll add KaTeX if there's a clear need.
- **Diagrams (Mermaid, etc.)**: not enabled.
- **Multi-line frontmatter values**: the parser is single-line only. If you need a long summary, just shorten it — the list-card clamps anyway.

---

## Workflow

1. Create the file: `src/content/marginalia/your-slug.md`
2. Add frontmatter + body.
3. Save. The dev server picks it up via Vite HMR; refresh the browser if the list doesn't update.
4. To verify before publishing, run `npm run build` and check it exits clean. The build also catches any TypeScript regressions if you've touched code alongside the article.

That's it. No registration step, no index update.

---

## Quick template

```
---
title: Your title here
date: 2026-05-04
type: essay
author: NQ Smith
summary: One or two sentences for the card.
---

Opening paragraph — gets a crimson dropcap on the first letter automatically. Keep it punchy; this is what the reader lands on.

## A section

Body. **Bold**, *italic*, `inline code`, [a link](https://example.com).

> A blockquote sets the tone for an aside.

```ts
// fenced code with a language tag gets syntax highlighting
const x: number = 42
\```

A closing thought, perhaps with a [further read](https://example.com).
```

(In the template above, the literal triple-backticks at the bottom are escaped with `\` for display — when authoring real articles, omit the backslash.)
