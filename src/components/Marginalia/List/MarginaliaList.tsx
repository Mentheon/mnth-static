import type { Article } from '../types'
import ArticleCard from './ArticleCard'
import styles from './MarginaliaList.module.css'

interface MarginaliaListProps {
  articles: Article[]
}

export default function MarginaliaList({ articles }: MarginaliaListProps) {
  return (
    <main className={styles.page}>
      <article className={styles.frame}>
        <span className={`${styles.cornerCrop} ${styles.cornerTL}`} aria-hidden="true" />
        <span className={`${styles.cornerCrop} ${styles.cornerTR}`} aria-hidden="true" />
        <span className={`${styles.cornerCrop} ${styles.cornerBL}`} aria-hidden="true" />
        <span className={`${styles.cornerCrop} ${styles.cornerBR}`} aria-hidden="true" />

        <header className={styles.header}>
          <p className={styles.kicker}>
            Mentheon Marginalia &middot; field notes &amp; longer pieces
          </p>
          <h1 className={styles.title}>Marginalia</h1>
          <p className={styles.tagline}>
            Essays, dispatches, and reading notes from the studio &mdash;
            things that didn&rsquo;t want to be a paper or a project, but
            wanted to be written down anyway.
          </p>
        </header>

        {articles.length === 0 ? (
          <p className={styles.empty}>No articles yet. Check back soon.</p>
        ) : (
          <div className={styles.grid}>
            {articles.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        )}
      </article>
    </main>
  )
}
