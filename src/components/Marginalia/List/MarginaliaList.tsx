import type { Article } from '../types'
import { STRANDS } from '../../../data/strands'
import ArticleCard from './ArticleCard'
import StrandFilter from './StrandFilter'
import styles from './MarginaliaList.module.css'

interface MarginaliaListProps {
  articles: Article[]
  /** Currently-active strand filter id, or null for "All". */
  activeStrand: string | null
}

/* Compute counts per strand id (plus 'all') so the filter chips can
   show how many articles each filter would yield. The 'all' bucket
   counts every article; per-strand counts only include articles
   tagged with that strand. */
function buildCounts(articles: Article[]): Record<string, number> {
  const counts: Record<string, number> = { all: articles.length }
  for (const s of STRANDS) counts[s.id] = 0
  for (const a of articles) {
    for (const id of a.strands) {
      if (id in counts) counts[id] += 1
    }
  }
  return counts
}

export default function MarginaliaList({ articles, activeStrand }: MarginaliaListProps) {
  const counts = buildCounts(articles)
  const filtered = activeStrand
    ? articles.filter((a) => a.strands.includes(activeStrand))
    : articles

  const activeStrandLabel = activeStrand
    ? STRANDS.find((s) => s.id === activeStrand)?.label ?? null
    : null

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

        <StrandFilter activeStrand={activeStrand} counts={counts} />

        {filtered.length === 0 ? (
          <p className={styles.empty}>
            {activeStrandLabel
              ? `No articles tagged with ${activeStrandLabel} yet.`
              : 'No articles yet. Check back soon.'}
          </p>
        ) : (
          <div className={styles.grid}>
            {filtered.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        )}
      </article>
    </main>
  )
}
