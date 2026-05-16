# `src/components/Marginalia/Detail/ArticleBody.module.css`

## What this file is

The **typography stylesheet for the rendered article body**. Every rule
in it is scoped under a single `.body` class. That scoping is not
cosmetic — it is *load-bearing*, because the HTML it styles is injected
via `dangerouslySetInnerHTML` (see
[`ArticleBody.tsx`](./ArticleBody.tsx.md)) and therefore contains plain,
**un-hashed** tags like `<p>`, `<h2>`, `<pre>`. If these rules were not
nested under `.body`, they would leak and restyle every paragraph and
heading on the whole site.

It also contains the **on-brand syntax-highlighting palette** for code
blocks emitted by `src/lib/marginalia/renderMarkdown.ts`
(cross-referenced).

## Line-by-line / block walkthrough

```css
.body {
  font-family: 'Lato', sans-serif;
  color: var(--ink);
  max-width: 70ch;
}
```

The wrapper `<div>` (it carries `styles.body`). Sets the base font,
text colour, and a `70ch` measure so prose lines stay ~70 characters —
the standard readable line length.

```css
.body > p:first-of-type::first-letter {
  font-family: 'Lato', sans-serif;
  font-size: 3.2rem;
  font-weight: 900;
  color: var(--crimson);
  float: left;
  line-height: 0.9;
  margin: 0.1em 0.12em 0 0;
}
```

A **drop cap** — the large decorative first letter of the article.
Several selector concepts at once:

- `.body > p` — the **child combinator** `>`: only `<p>` elements that
  are *direct* children of `.body` (not paragraphs nested in
  blockquotes, etc.).
- `:first-of-type` — a **structural pseudo-class**: the first `<p>`
  among its siblings (i.e. the opening paragraph).
- `::first-letter` — a **pseudo-element**: targets just the first
  typographic letter of that paragraph, without any wrapping markup.
- `float: left` lets the following text wrap around the big letter; the
  `em`-based margins position it relative to its own (large) size.

This is a classic editorial typographic flourish done entirely in CSS,
no JS or extra spans.

```css
.body h2 { ... margin: 2.5rem 0 0.6rem; ... }
.body h3 { ... margin: 1.8rem 0 0.5rem; ... }
.body p  { ... line-height: 1.65; margin: 0 0 1.1rem; max-width: 70ch; }
```

`.body h2`, `.body h3`, `.body p` are **descendant selectors**: any
heading/paragraph *anywhere inside* `.body`. Generous top margins on
headings create section rhythm; `line-height: 1.65` on paragraphs is a
comfortable reading leading. These tags have no classes (they came from
markdown), so element selectors scoped by `.body` are exactly the right
tool.

```css
.body blockquote {
  border-left: 3px solid var(--crimson);
  padding: 0.2rem 0 0.2rem 1.2rem;
  margin: 1.4rem 0;
  font-style: italic;
  color: var(--plum);
  max-width: 65ch;
}
.body blockquote p { margin: 0.4rem 0; color: var(--plum); }
```

Blockquotes get the signature crimson left-rule, italic plum text, and
slightly tighter measure. `.body blockquote p` overrides the default
`.body p` spacing/colour *inside* quotes — a good example of using
selector specificity/context to override a general rule for a special
case.

```css
.body a {
  color: var(--ink);
  text-decoration: underline;
  text-underline-offset: 2px;
  text-decoration-thickness: 1px;
  transition: color 0.15s ease;
}
.body a:hover { color: var(--crimson); }
```

In-body links keep their underline (good for in-prose link
affordance — unlike the *button*-style links elsewhere which strip it),
with a refined offset/thickness, and a crimson hover.

```css
.body ul,
.body ol {
  padding-left: 1.4rem;
  margin: 0.6rem 0 1.2rem;
  max-width: 70ch;
}
.body ul li,
.body ol li { font-size: 1.05rem; line-height: 1.65; margin: 0.3rem 0; color: var(--ink); }
.body ul li::marker,
.body ol li::marker { color: var(--ink); }
```

List styling. Note `,` is the **selector list / grouping** combinator —
`.body ul, .body ol` applies the same rule to both. `::marker` is the
pseudo-element for the bullet/number itself, recoloured to match body
ink.

```css
.body img {
  max-width: 100%;
  height: auto;
  display: block;
  border: 1px solid var(--ink-soft, rgba(47, 1, 71, 0.15));
  margin: 1.5rem auto;
}
```

Responsive images: `max-width: 100%` + `height: auto` is the canonical
"never overflow the container, keep aspect ratio" pair. `display: block`
+ `margin: ... auto` centres them.

```css
.body code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9em;
  background: var(--bg-soft, rgba(47, 1, 71, 0.04));
  padding: 0.1em 0.35em;
  border-radius: 2px;
  color: var(--ink);
}
```

Inline `` `code` `` styling — mono, faint tinted background, small.

```css
.body :global(pre.hljsBlock) {
  background: var(--bg-soft, rgba(47, 1, 71, 0.04));
  border-left: 3px solid var(--ink);
  padding: 1rem 1.1rem;
  margin: 1.4rem 0;
  overflow-x: auto;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  line-height: 1.55;
  color: var(--ink);
  border-radius: 0 2px 2px 0;
}
.body :global(pre.hljsBlock code.hljs) { ... white-space: pre; }
```

This is the most important *mechanism* in the file: **`:global()`**.

By default a CSS Module hashes every class name. But the markdown
renderer (`renderMarkdown.ts`) emits **literal, fixed class names** like
`pre.hljsBlock` and `code.hljs` inside the injected HTML string — those
classes were never written in a `.module.css` file, so they are *not*
hashed. If we wrote `.body pre.hljsBlock` here, the module would try to
hash `hljsBlock` and the selector would never match the real markup.

`:global(...)` tells the CSS-module compiler "do **not** hash the class
names inside these parentheses; match them literally." So
`.body :global(pre.hljsBlock)` means: a hashed `.body` (still scoped),
containing a *literal* `pre.hljsBlock`. This is the correct bridge
between CSS Modules and externally-generated class names. `overflow-x:
auto` + `white-space: pre` give code blocks horizontal scroll instead of
wrapping.

```css
.body :global(.hljs-keyword),
.body :global(.hljs-selector-tag),
.body :global(.hljs-built_in),
.body :global(.hljs-tag) { color: var(--crimson); font-weight: 700; }

.body :global(.hljs-string), ... { color: var(--plum); }
.body :global(.hljs-comment), ... { color: var(--ink-quiet); font-style: italic; }
.body :global(.hljs-number), ... { color: var(--grape); }
.body :global(.hljs-title), ... { color: var(--ink); font-weight: 700; }
.body :global(.hljs-variable), ... { color: var(--ink); }
```

The **custom syntax-highlight theme**. highlight.js tags tokens with
classes like `.hljs-keyword`, `.hljs-string`, `.hljs-comment`. Instead
of importing one of highlight.js' prebuilt CSS themes (which would clash
with the site palette), this maps each token class to a brand colour:
crimson keywords, plum strings, quiet italic comments, grape numerals,
ink titles. Each is wrapped in `:global()` for the same reason as above
— those classes come from the injected HTML, not from this module.

## Libraries & APIs used

- **Plain CSS** as a **CSS Module**.
- **CSS Modules `:global()`** to opt selectors out of name-hashing.
- **CSS variables with fallbacks** for the palette.
- Styles the output of **highlight.js** (`hljs-*` token classes) and the
  `marked` renderer's `pre.hljsBlock` wrapper — both configured in
  `src/lib/marginalia/renderMarkdown.ts` (cross-referenced).

## Concepts to learn here

- **Scoping injected HTML** by nesting *every* rule under one
  CSS-module class (`.body ...`) — the key partner technique to
  `dangerouslySetInnerHTML`.
- **`:global()`** and *why* it's mandatory for the `hljs*` selectors
  (those class names are emitted by the renderer, not authored here, so
  they must not be hashed).
- **Selector toolkit**: descendant (space), child (`>`), grouping
  (`,`), pseudo-classes (`:first-of-type`, `:hover`), pseudo-elements
  (`::first-letter`, `::marker`).
- **Responsive image idiom** (`max-width:100%; height:auto`).
- **Overriding a general rule for a special context** (`.body blockquote
  p` vs `.body p`).
- **Theming third-party token output** without importing its CSS.

## How to edit it safely

- **Restyling prose** (font size, spacing, colours): edit the relevant
  `.body <tag>` rule. Keep *every* new selector prefixed with `.body `
  (or `.body :global(...)`) — dropping that prefix leaks styles to the
  whole site, which is the entire hazard this file guards against.
- **Recolouring syntax highlighting**: edit the `:global(.hljs-*)`
  groups. The class names (`hljs-keyword`, etc.) are dictated by
  highlight.js — don't invent new ones; consult highlight.js token
  documentation for which classes exist.
- **The code-block wrapper class `pre.hljsBlock`** is emitted verbatim
  by `src/lib/marginalia/renderMarkdown.ts` (cross-referenced). If that
  file's class name changes, update the `:global(pre.hljsBlock)`
  selector here to match — they are coupled by an exact string.
- **Gotcha**: never remove `:global()` from the `hljs*`/`hljsBlock`
  selectors thinking it's redundant. Without it the compiler hashes the
  names and the selectors stop matching the injected HTML entirely (code
  blocks render unstyled).
- **Gotcha**: the drop-cap selector is specifically
  `.body > p:first-of-type::first-letter`. If the renderer ever wraps
  the first paragraph (e.g. in a `<div>`), the child combinator `>`
  breaks it — adjust the selector rather than the markup.
- Paired file: [`ArticleBody.tsx`](./ArticleBody.tsx.md).
