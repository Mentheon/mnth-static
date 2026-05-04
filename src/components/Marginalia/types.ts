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
  body: string // raw markdown (post-frontmatter)
  bodyHtml: string // rendered html (memoised at module load)
}

export interface MarginaliaProps {
  // null → list view; otherwise → detail view of that slug.
  slug: string | null
}
