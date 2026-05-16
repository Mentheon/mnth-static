# `src/lib/marginalia/renderMarkdown.ts`

## What this file is

The **Markdown → HTML renderer** for the Marginalia pipeline. It takes
the raw article body (the text *after* the frontmatter, produced by
`parseFrontmatter`) and returns an HTML string, with **fenced code blocks
syntax-highlighted** by highlight.js. `loadArticles.ts` calls this once
per article at module load and stores the result as `article.bodyHtml`,
which a React component then injects into the page.

This is step 3 of the content pipeline; see
[`loadArticles.ts`](./loadArticles.ts.md) for the full picture and
[`parseFrontmatter.ts`](./parseFrontmatter.ts.md) for step 2.

## Line-by-line / block walkthrough

```ts
import { Marked } from 'marked'
import hljs from 'highlight.js/lib/common'
```

- `marked` is a popular, fast Markdown-to-HTML library. Importing the
  **`Marked` class** (capital M) lets us create our *own configured
  instance* rather than mutating the shared global `marked` function.
- `highlight.js` is a syntax-highlighting library. The deep import path
  `highlight.js/lib/common` is deliberate: it pulls in only the
  ~40 "common" languages instead of all ~200 grammars, saving roughly
  200 KB in the bundle (noted in the file's header comment). Choosing a
  narrower entry point to shrink bundle size is a common optimisation.

```ts
const renderer = {
  code({ text, lang }: { text: string; lang?: string }): string {
    const valid = lang && hljs.getLanguage(lang)
    const html = valid
      ? hljs.highlight(text, { language: lang as string }).value
      : hljs.highlightAuto(text).value
    return `<pre class="hljsBlock"><code class="hljs">${html}</code></pre>`
  },
}
```

This is a **custom renderer override** for code blocks. `marked` lets
you replace how specific Markdown constructs become HTML. Here we
override `code`, which `marked` calls for every fenced block:

````markdown
```ts
const x = 1
```
````

- The parameter is destructured as `{ text, lang }` with an **inline
  object type** `{ text: string; lang?: string }`. `text` is the code,
  `lang` is the language tag after the opening fence (the `ts` above) —
  optional (`?`).
- `const valid = lang && hljs.getLanguage(lang)` — truthy only if a
  language was given *and* highlight.js actually knows it.
  `hljs.getLanguage` returns the grammar or `undefined`. The `&&` short-
  circuits: if `lang` is missing, `valid` is the falsy `lang` value.
- `valid ? hljs.highlight(text, { language: lang as string }).value :
  hljs.highlightAuto(text).value` — if we have a known language,
  highlight with it explicitly; otherwise let highlight.js **auto-detect**
  the language. Both return an object whose `.value` is the
  HTML-with-`<span class="hljs-...">` markup. `lang as string` is a
  **type assertion**: inside the truthy branch we know `lang` is a
  non-empty string, but TS still types it `string | undefined`, so we
  assert.
- The return is a **template literal** building the wrapper HTML. The
  `hljsBlock` / `hljs` classes are styled in
  `ArticleBody.module.css` — the file's header comment explains they
  deliberately *don't* import a prebuilt highlight.js theme so the colour
  palette stays on-brand. The highlighted `${html}` is interpolated
  inside.

```ts
const marked = new Marked({
  gfm: true,
  breaks: false,
})
marked.use({ renderer })
```

- `new Marked({...})` creates a **scoped instance** with options:
  - `gfm: true` — enable **GitHub Flavored Markdown** (tables,
    strikethrough, autolinks, task lists, etc.).
  - `breaks: false` — a single newline does *not* become a `<br>`; you
    need a blank line for a new paragraph. This is standard Markdown
    behaviour and matches how the article `.md` files are written
    (paragraphs separated by blank lines).
- `marked.use({ renderer })` registers our custom code-block renderer on
  *this instance only*. The header comment calls out why a scoped
  instance matters: mutating the global `marked` would leak this config
  to any other code that imports `marked` elsewhere. Prefer scoped
  instances over global mutation.

```ts
export function renderMarkdown(body: string): string {
  return marked.parse(body) as string
}
```

The public function. `marked.parse(body)` converts the Markdown to an
HTML string. `marked.parse` can return `string | Promise<string>`
depending on whether async extensions are used; since none are, the
`as string` assertion narrows the type for callers. The returned HTML is
later rendered by the article component (typically via React's
`dangerouslySetInnerHTML`, since this is trusted, author-written
content).

## Libraries & APIs used

- **`marked`** — Markdown → HTML. We use the `Marked` class for a scoped
  instance, the `gfm`/`breaks` options, and the `renderer` override API.
  Docs: <https://marked.js.org/> (see "Using Pro" → custom renderers,
  and the options reference).
- **`highlight.js`** — syntax highlighting. `highlight.js/lib/common`
  ships only common languages. APIs used: `getLanguage(name)`,
  `highlight(code, { language })`, `highlightAuto(code)`. Docs:
  <https://highlightjs.org/> and
  <https://github.com/highlightjs/highlight.js/blob/main/docs/api.rst>.
- **Template literals** for HTML string assembly.
- The output classes (`hljs`, `hljs-keyword`, …) are styled by
  `src/components/Marginalia/ArticleBody.module.css`, not by an imported
  highlight.js theme.

## Concepts to learn here

- Markdown is just text; a renderer turns it into HTML.
- Library configuration via a **scoped instance** instead of mutating a
  global — avoids cross-module config leakage.
- Customising library output through a **renderer override** hook.
- Bundle-size awareness: importing `highlight.js/lib/common` not the
  full package.
- GitHub Flavored Markdown vs. plain Markdown; the `breaks` option's
  effect on newlines.
- Type assertions (`as string`, `lang as string`) to satisfy the
  compiler when you know more than it does.
- Why generated HTML classes are styled separately (theming/brand
  control).

## How to edit it safely

- **To restyle code blocks**, edit `ArticleBody.module.css` (the
  `.hljs*` classes), *not* this file. Importing a prebuilt highlight.js
  theme would override the on-brand palette — that's why none is
  imported.
- **To enable a language highlight.js doesn't include in `common`**
  (e.g. a niche grammar), import it from `highlight.js/lib/languages/...`
  and register it with `hljs.registerLanguage(...)`. Switching to the
  full `highlight.js` package works too but re-adds the ~200 KB.
- **Changing Markdown behaviour:** flip `gfm`/`breaks` here if needed,
  but know that `breaks: true` would turn every single newline in the
  article files into a `<br>`, reflowing existing prose — test the
  rendered articles after.
- **Keep the scoped `new Marked(...)` instance.** Don't switch to
  `import { marked } from 'marked'` and call `marked.use(...)` globally;
  that mutates shared state.
- The output is injected as raw HTML. It's safe here because content is
  author-written and committed to the repo. If you ever render
  user-submitted Markdown, add sanitisation (e.g. DOMPurify) before
  injecting.
