// Eager glob-load every Markdown file in src/content/marginalia/, parse
// its frontmatter, render the body to HTML once, and expose a single
// sorted (newest-first) Article array.
//
// Done at module-load time (not on every render) so navigating between
// list and detail views — and switching slugs — never re-runs the
// markdown pipeline.

import type { Article, ArticleType } from '../../components/Marginalia/types'
import { parseFrontmatter } from './parseFrontmatter'
import { renderMarkdown } from './renderMarkdown'

const KNOWN_TYPES: readonly ArticleType[] = [
  'essay',
  'note',
  'dispatch',
  'paper-summary',
  'link-roundup',
]

function coerceType(raw: string | undefined): ArticleType {
  // Default to 'note' if frontmatter is missing or unrecognised — we
  // never throw, since dropping a piece of editorial would be worse
  // than displaying it under a fallback tag.
  if (!raw) return 'note'
  return (KNOWN_TYPES as readonly string[]).includes(raw)
    ? (raw as ArticleType)
    : 'note'
}

function slugFromPath(filePath: string): string {
  // e.g. "../content/marginalia/pose-tracking-politics.md"
  const file = filePath.split('/').pop() ?? filePath
  return file.replace(/\.md$/i, '')
}

const files = import.meta.glob('../../content/marginalia/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

// Strand frontmatter is single-line, comma-separated:
//   strands: kindred, vitalis
// Trim each, drop blanks, lowercase to match the canonical IDs in
// data/strands.ts. Missing / empty field → empty array (general article).
function parseStrands(raw: string | undefined): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

const articles: Article[] = Object.entries(files).map(([path, raw]) => {
  const { frontmatter, body } = parseFrontmatter(raw)
  return {
    slug: slugFromPath(path),
    title: frontmatter.title ?? '(untitled)',
    date: frontmatter.date ?? '',
    type: coerceType(frontmatter.type),
    author: frontmatter.author ?? 'NQ Smith',
    summary: frontmatter.summary ?? '',
    strands: parseStrands(frontmatter.strands),
    body,
    bodyHtml: renderMarkdown(body),
  }
})

// Newest first. ISO yyyy-mm-dd sorts lexicographically, so a string
// compare is correct without parsing into Date objects.
articles.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

export function loadArticles(): Article[] {
  return articles
}

export function findArticle(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug)
}
