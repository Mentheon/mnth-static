import type { Article } from '../types'
import ArticleMeta from '../shared/ArticleMeta'
import styles from './ArticleCard.module.css'

interface ArticleCardProps {
  article: Article
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const href = `#marginalia/${article.slug}`
  // Same belt-and-braces pattern StrandPanel uses: drive the hash
  // change ourselves so any scroll-snap parent / overlay / preventDefault
  // upstream can't swallow the navigation.
  const onClick = (e: React.MouseEvent) => {
    e.preventDefault()
    window.location.hash = href
  }
  return (
    <a className={styles.card} href={href} onClick={onClick}>
      <span className={styles.cornerTick} aria-hidden="true" />
      <ArticleMeta article={article} variant="card" />
      <h3 className={styles.title}>{article.title}</h3>
      <p className={styles.summary}>{article.summary}</p>
      <span className={styles.cta} aria-hidden="true">
        Read <span className={styles.arrow}>&rarr;</span>
      </span>
    </a>
  )
}
