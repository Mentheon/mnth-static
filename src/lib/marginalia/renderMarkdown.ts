// Markdown → HTML rendering, with on-brand syntax highlighting baked in.
//
// We configure a single `marked` instance at module-load time: GFM on,
// paragraph-style hard breaks off, and a custom code-block renderer
// that runs the source through highlight.js' "common languages" bundle
// (drops the ~200 KB it'd cost to ship every grammar).
//
// Highlight class names (.hljs-keyword, .hljs-string, etc.) are styled
// in ArticleBody.module.css — we deliberately avoid importing one of
// highlight.js' prebuilt themes so the palette stays on-brand.

import { Marked } from 'marked'
import hljs from 'highlight.js/lib/common'

const renderer = {
  code({ text, lang }: { text: string; lang?: string }): string {
    const valid = lang && hljs.getLanguage(lang)
    const html = valid
      ? hljs.highlight(text, { language: lang as string }).value
      : hljs.highlightAuto(text).value
    return `<pre class="hljsBlock"><code class="hljs">${html}</code></pre>`
  },
}

// A scoped Marked instance avoids leaking config/renderer overrides to
// any future caller of the global `marked` import.
const marked = new Marked({
  gfm: true,
  breaks: false,
})
marked.use({ renderer })

export function renderMarkdown(body: string): string {
  return marked.parse(body) as string
}
