# `src/components/Marginalia/Detail/ArticleBody.tsx`

## What this file is

A tiny, single-purpose component whose entire job is to **render a
string of HTML** as actual DOM inside the article page. The HTML it
receives is the article's markdown already converted to HTML by the
build-time content pipeline. This component is the one place in the
Marginalia feature that uses React's `dangerouslySetInnerHTML`, so it is
the most important file to understand the *why* and the *safety
reasoning* behind injecting raw HTML.

It is rendered by
[`MarginaliaArticle.tsx`](./MarginaliaArticle.tsx.md) as
`<ArticleBody html={article.bodyHtml} />`.

## Line-by-line / block walkthrough

```tsx
import styles from './ArticleBody.module.css'
```

The paired CSS Module,
[`ArticleBody.module.css`](./ArticleBody.module.css.md). All article-body
typography (paragraphs, headings, blockquotes, code blocks) lives there,
scoped under one `.body` class.

```tsx
interface ArticleBodyProps {
  html: string
}
```

The props contract: a single `html` string. It deliberately does *not*
accept JSX children or a markdown string — by the time it reaches here
the content is already rendered HTML (done once at build time in
`src/lib/marginalia/renderMarkdown.ts`, cross-referenced).

```tsx
// The rendered HTML is trusted (it comes from our own markdown files
// at build time), so dangerouslySetInnerHTML is fine here. All body
// typography lives in ArticleBody.module.css; selectors are scoped to
// `.body` so they cannot leak into the rest of the app.
export default function ArticleBody({ html }: ArticleBodyProps) {
  return <div className={styles.body} dangerouslySetInnerHTML={{ __html: html }} />
}
```

This one line is the heart of the file. Unpacking it:

### `dangerouslySetInnerHTML`

Normally React **escapes** any string you put in JSX. If you wrote
`<div>{html}</div>` and `html` was `"<h2>Hi</h2>"`, the page would
literally show the text `<h2>Hi</h2>` — angle brackets and all. That
escaping is a deliberate, central React security feature: it makes
**cross-site scripting (XSS)** hard, because user/content strings can
never become live markup by accident.

`dangerouslySetInnerHTML` is the explicit escape hatch that says
"I really do want this string interpreted as HTML." Its API shape is
intentionally awkward:

- It takes an **object** with a single key: `{ __html: html }`.
- The key is the deliberately ugly `__html`.

React designed it to look scary so you can't reach for it without
noticing. It is the React equivalent of the DOM's
`element.innerHTML = ...`.

### Why is it safe *here*?

The cardinal rule: **never pass untrusted input to
`dangerouslySetInnerHTML`.** If `html` could contain attacker-controlled
content (e.g. a user comment), an attacker could inject
`<script>` / `onerror=` payloads — that's the classic XSS attack.

In *this* codebase it is safe because of a specific, documented chain of
trust spelled out in the comment:

1. The HTML originates from `*.md` files the project authors commit to
   the repo (`src/content/marginalia/`) — first-party content, not user
   input.
2. It is converted to HTML **at build time** by the project's own
   `renderMarkdown.ts`, not at runtime from arbitrary data.
3. There is no path by which an end user can inject markdown/HTML into
   this string.

So the threat model that makes `dangerouslySetInnerHTML` "dangerous"
(untrusted input) simply doesn't apply. The comment exists precisely so
a future maintainer doesn't repurpose this component for user content
without re-examining that assumption.

### `className={styles.body}` and CSS scoping

The injected HTML is plain `<h2>`, `<p>`, `<pre>` etc. — it has **no
CSS-module hashed classes**, because the markdown renderer emits generic
tags, and CSS Modules can't hash class names inside a raw string. So how
do we style it without those styles leaking site-wide?

The answer: the wrapper `<div>` gets the `styles.body` class, and
[`ArticleBody.module.css`](./ArticleBody.module.css.md) writes every
rule as a *descendant of* `.body` (e.g. `.body h2`, `.body p`). That
keeps the typography confined to this subtree even though the inner
elements are un-hashed. This is the standard, safe way to style injected
HTML with CSS Modules.

### Self-closing element

`<div ... />` is self-closing because all its content comes from the
`dangerouslySetInnerHTML` prop — it has no JSX children. You **cannot**
pass both `dangerouslySetInnerHTML` and children; React forbids it
(ambiguous which wins).

## Libraries & APIs used

- **React** — function component, props, `dangerouslySetInnerHTML`.
- **CSS Modules** — `styles.body` for scoped typography.
- (Indirectly) the project's markdown pipeline produced the `html`
  string: `src/lib/marginalia/renderMarkdown.ts` and
  `loadArticles.ts` (cross-referenced; not owned by this doc).

## Concepts to learn here

- **React auto-escaping** as XSS defence, and why
  `dangerouslySetInnerHTML` is the explicit, intentionally-ugly opt-out.
- **The `{ __html: ... }` object shape** of the prop.
- **Trust model thinking**: injecting HTML is safe *iff* the source is
  trusted and rendered at build time from first-party content. Always
  ask "could an end user influence this string?"
- **Styling injected/un-hashed HTML** by scoping all rules under one
  CSS-module wrapper class (`.body h2`, `.body p`, …).
- **Can't mix `dangerouslySetInnerHTML` with children.**

## How to edit it safely

- **Changing how markdown is converted** (add tables, change syntax
  highlighting, sanitisation): that is **not this file** — edit
  `src/lib/marginalia/renderMarkdown.ts` (cross-referenced). This
  component only displays the finished string.
- **Changing body typography** (paragraph size, code-block colours,
  blockquote style): edit the paired
  [`ArticleBody.module.css`](./ArticleBody.module.css.md). Keep new
  rules nested under `.body` so they stay scoped.
- **Big gotcha — do NOT reuse this component for user-supplied
  content** (comments, search input, anything an end user can author)
  without first running the HTML through a sanitiser (e.g. DOMPurify).
  The current safety argument rests entirely on the content being
  first-party and build-time rendered. If that ever changes, this is
  an XSS hole.
- **Gotcha**: don't switch to `<div>{html}</div>` to "fix" raw-looking
  output — that would *correctly* escape and show literal tags. The
  whole point of this component is the controlled, intentional opt-out.
- Paired files: [`MarginaliaArticle.tsx`](./MarginaliaArticle.tsx.md)
  (the consumer) and
  [`ArticleBody.module.css`](./ArticleBody.module.css.md) (the styles).
