// Tiny YAML-ish frontmatter parser.
//
// Recognises the conventional `---\n...\n---\n` opening fence + closing
// fence, parses single-line `key: value` pairs in between, and returns
// the body verbatim after the closing fence. Multi-line values, lists,
// and nested structures are intentionally not supported — this is just
// enough to drive the Marginalia article metadata.

export interface ParsedFrontmatter {
  frontmatter: Record<string, string>
  body: string
}

const FENCE = '---'

export function parseFrontmatter(source: string): ParsedFrontmatter {
  // Normalise line endings so the closing-fence search behaves
  // identically across files saved on Windows or macOS.
  const text = source.replace(/\r\n/g, '\n')

  // No opening fence → there's no frontmatter; the entire string is body.
  if (!text.startsWith(`${FENCE}\n`)) {
    return { frontmatter: {}, body: text }
  }

  // Find the closing fence. It must sit on its own line, hence the
  // surrounding newlines.
  const afterOpen = text.slice(FENCE.length + 1) // skip "---\n"
  const closeIdx = afterOpen.indexOf(`\n${FENCE}\n`)
  if (closeIdx === -1) {
    // Malformed: no closing fence. Treat the whole thing as body so we
    // never silently drop content.
    return { frontmatter: {}, body: text }
  }

  const fmBlock = afterOpen.slice(0, closeIdx)
  const body = afterOpen.slice(closeIdx + `\n${FENCE}\n`.length)

  const frontmatter: Record<string, string> = {}
  for (const rawLine of fmBlock.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    let value = line.slice(colonIdx + 1).trim()
    // Strip wrapping quotes if present — supports `title: "Foo: bar"`.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (key) frontmatter[key] = value
  }

  return { frontmatter, body }
}
