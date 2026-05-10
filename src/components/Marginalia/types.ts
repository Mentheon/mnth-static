// Shared types for the Marginalia section.

export type ArticleType =
  | 'essay'
  | 'note'
  | 'dispatch'
  | 'paper-summary'
  | 'link-roundup'

export interface Article {
  slug: string
  title: string
  date: string // ISO yyyy-mm-dd
  type: ArticleType
  author: string
  summary: string
  // Optional cross-link to one or more R&D strands (kindred / vitalis
  // / vitrix). Empty / missing means the article is general — it
  // appears in the unfiltered list but is excluded from any active
  // strand filter.
  strands: string[]
  body: string // raw markdown (post-frontmatter)
  bodyHtml: string // rendered html (memoised at module load)
}

export interface MarginaliaProps {
  // null → list view; otherwise → detail view of that slug.
  slug: string | null
  // Active strand filter for the list view. null = no filter.
  // Ignored on the detail view.
  strandFilter?: string | null
}
