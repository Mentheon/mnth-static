# `src/lib/marginalia/parseFrontmatter.ts`

## What this file is

A **tiny, hand-written frontmatter parser**. "Frontmatter" is the
metadata block at the top of a Markdown file, fenced by `---` lines:

```markdown
---
title: April dispatch
date: 2026-04-30
---
The actual article body goes here.
```

This function takes the whole file as a string and splits it into:
- `frontmatter`: an object of `key → value` strings (`{ title: 'April
  dispatch', date: '2026-04-30' }`), and
- `body`: everything after the closing `---` (the raw Markdown prose).

It is deliberately *not* a full YAML parser. It only understands
single-line `key: value` pairs — no lists, no nesting, no multi-line
values. That's all the Marginalia pipeline needs, and a 40-line parser
with no dependencies is easier to trust than a full YAML library.

This is step 2 of the content pipeline; see
[`loadArticles.ts`](./loadArticles.ts.md) for the full picture.

## Line-by-line / block walkthrough

```ts
export interface ParsedFrontmatter {
  frontmatter: Record<string, string>
  body: string
}
```

The **return shape**, declared as an interface. `Record<string, string>`
is a built-in TypeScript **utility type** meaning "an object whose keys
are strings and whose values are strings" — i.e. an arbitrary string
map. `body` is the leftover Markdown.

```ts
const FENCE = '---'
```

A named constant for the fence delimiter. Naming "magic strings" makes
the intent obvious and the value editable in one place.

```ts
export function parseFrontmatter(source: string): ParsedFrontmatter {
  const text = source.replace(/\r\n/g, '\n')
```

`source` is the whole file. The first step **normalises line endings**:
`/\r\n/g` is a regex matching a Windows carriage-return + line-feed
(`\r\n`); the `g` (global) flag replaces *all* occurrences with a plain
`\n`. Without this, a file saved on Windows would have `\r\n` and the
later `\n---\n` search would fail. Always normalise newlines before
doing line-based string parsing.

```ts
  if (!text.startsWith(`${FENCE}\n`)) {
    return { frontmatter: {}, body: text }
  }
```

If the file doesn't *start* with `---\n` there is no frontmatter at all,
so the entire file is the body and the metadata object is empty. Note
the early `return` — a **guard clause**, a common pattern: handle the
trivial/edge case immediately and return, keeping the main logic
un-nested below.

```ts
  const afterOpen = text.slice(FENCE.length + 1) // skip "---\n"
```

`slice(FENCE.length + 1)` chops off the opening `---` (3 chars) plus its
newline (1 char) = 4 characters, leaving everything after the opening
fence.

```ts
  const closeIdx = afterOpen.indexOf(`\n${FENCE}\n`)
  if (closeIdx === -1) {
    return { frontmatter: {}, body: text }
  }
```

`indexOf` searches for the **closing fence**, which must be on its own
line — hence searching for `\n---\n` (newline, dashes, newline) rather
than just `---`. `indexOf` returns `-1` when not found. A missing
closing fence means the file is malformed; rather than crash or silently
eat content, it treats the *whole original `text`* as the body. The
guiding principle (echoed across this pipeline): never silently drop
content.

```ts
  const fmBlock = afterOpen.slice(0, closeIdx)
  const body = afterOpen.slice(closeIdx + `\n${FENCE}\n`.length)
```

`closeIdx` is where `\n---\n` starts. So:
- `afterOpen.slice(0, closeIdx)` is the raw frontmatter block (the lines
  between the fences).
- `afterOpen.slice(closeIdx + length-of-"\n---\n")` skips past the
  closing fence to give the body.

```ts
  const frontmatter: Record<string, string> = {}
  for (const rawLine of fmBlock.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue
```

Build the result object. `fmBlock.split('\n')` yields the individual
lines; `for...of` iterates them. `.trim()` removes surrounding
whitespace. `if (!line) continue` skips **blank lines** (`continue`
jumps to the next loop iteration).

```ts
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    let value = line.slice(colonIdx + 1).trim()
```

Split each line at the **first** colon (`indexOf(':')` finds the first
one — important so a value like `Foo: bar` keeps `bar` as part of the
value, not as a new key). Lines with no colon are skipped. `key` is
everything before the colon; `value` everything after, both trimmed.
`value` is `let` (reassignable) because the next step may modify it.

```ts
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
```

**Quote stripping.** If the value is wrapped in matching double or
single quotes, remove them with `slice(1, -1)` (drop first and last
char). This supports values that contain a colon, e.g.
`title: "Foo: bar"` — the quotes let the author include characters that
would otherwise be ambiguous.

```ts
    if (key) frontmatter[key] = value
  }

  return { frontmatter, body }
}
```

Store the pair (ignoring lines whose key ended up empty), then return
the assembled object plus the body. The result feeds straight into
`loadArticles.ts`, which reads `frontmatter.title`, `frontmatter.date`,
etc.

## Libraries & APIs used

No external libraries — pure JavaScript string methods:

- `String.prototype.replace` with a regex + `g` flag (global replace).
- `String.prototype.startsWith` / `endsWith` / `slice` / `indexOf` /
  `split` / `trim`.
- `for...of` and `continue`.
- TypeScript `interface` and the `Record<K, V>` utility type.

MDN string reference:
<https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String>

## Concepts to learn here

- What frontmatter is and the `---` fence convention.
- **Guard clauses / early returns** for edge cases (no fence, malformed
  fence) keep the happy path flat.
- Normalising `\r\n` → `\n` before line parsing — a perennial
  cross-platform gotcha.
- Splitting on the **first** delimiter (`indexOf(':')`) vs. all.
- Defensive parsing: degrade to "all body" rather than throw.
- `Record<string, string>` for a typed string map.
- Building a small, dependency-free parser instead of pulling in a heavy
  library when the input is constrained.

## How to edit it safely

- **This parser only handles `key: value` on one line.** If you write
  YAML lists or multi-line values in an article's frontmatter, they will
  *not* parse the way you expect (a `- item` line has no colon → it's
  skipped). Keep frontmatter to single-line scalars. The `strands`
  field, for instance, is one comma-separated line on purpose.
- **Values needing a colon or leading/trailing spaces must be quoted**
  (`title: "Foo: bar"`); the parser only strips a *matching* pair of
  surrounding quotes.
- If you ever need richer frontmatter, the safe move is to swap this for
  a real YAML parser (e.g. `js-yaml`) *inside this function*, keeping the
  `ParsedFrontmatter` return shape so `loadArticles.ts` is unaffected.
- Don't remove the `\r\n` normalisation or the malformed-fence
  fallbacks — both prevent real-world breakage (Windows editors,
  half-written drafts).
