import type { Article } from '../types'
import TypeChip from './TypeChip'
import styles from './ArticleMeta.module.css'

interface ArticleMetaProps {
  article: Article
  // The list card needs date in the corner and chip in the opposite
  // corner — the detail header wants them all on one mono row. Letting
  // the consumer pick the layout keeps both visually distinct.
  variant?: 'card' | 'detail'
}

function formatDate(iso: string): string {
  if (!iso) return ''
  // Render as "12 Apr 2026" — short, mono-friendly, language-neutral.
  // Parse into UTC explicitly so we don't trip on timezone-induced
  // off-by-one-day surprises.
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export default function ArticleMeta({ article, variant = 'detail' }: ArticleMetaProps) {
  const dateLabel = formatDate(article.date)
  if (variant === 'card') {
    return (
      <div className={styles.cardRow}>
        <span className={styles.date}>{dateLabel}</span>
        <TypeChip type={article.type} />
      </div>
    )
  }
  return (
    <div className={styles.detailRow}>
      <TypeChip type={article.type} />
      <span className={styles.dot} aria-hidden="true">·</span>
      <span className={styles.date}>{dateLabel}</span>
      <span className={styles.dot} aria-hidden="true">·</span>
      <span className={styles.author}>{article.author}</span>
    </div>
  )
}
