import type { MarginaliaProps } from './types'
import { loadArticles, findArticle } from '../../lib/marginalia/loadArticles'
import MarginaliaList from './List/MarginaliaList'
import MarginaliaArticle from './Detail/MarginaliaArticle'
import styles from './Marginalia.module.css'

// Router-aware shell: a `null` slug renders the index/list view; any
// other value tries to find a matching article and renders its detail.
// An unknown slug falls through to a small "not found" stub so a stale
// deep-link doesn't crash the app.
export default function Marginalia({ slug }: MarginaliaProps) {
  const articles = loadArticles()

  if (slug === null) {
    return <MarginaliaList articles={articles} />
  }

  const article = findArticle(slug)
  if (!article) {
    return (
      <main className={styles.notFoundPage}>
        <div className={styles.notFoundFrame}>
          <p className={styles.notFoundKicker}>404 &middot; marginalia</p>
          <h1 className={styles.notFoundTitle}>No such article.</h1>
          <p className={styles.notFoundBody}>
            Couldn&rsquo;t find an article with the slug{' '}
            <code className={styles.code}>{slug}</code>. It may have been
            renamed or removed.
          </p>
          <a
            href="#marginalia"
            className={styles.notFoundCta}
            onClick={(e) => {
              e.preventDefault()
              window.location.hash = '#marginalia'
            }}
          >
            <span aria-hidden="true">&larr;</span> Back to marginalia
          </a>
        </div>
      </main>
    )
  }

  return <MarginaliaArticle article={article} />
}
