import type { MarginaliaProps } from './types'
import { loadArticles, findArticle } from '../../lib/marginalia/loadArticles'
import MarginaliaList from './List/MarginaliaList'
import MarginaliaArticle from './Detail/MarginaliaArticle'
import styles from './Marginalia.module.css'
import MarginaliaTab from '../MarginaliaTab'
import { BackRow, useEscBack, HOME_HREF } from '../Framework/shared'

/* Esc steps out one level: article → list → helix. */
function MarginaliaChrome({ slug, title }: { slug: string | null; title?: string }) {
  const back = slug === null ? { label: 'helix', href: HOME_HREF } : { label: 'marginalia', href: '#marginalia' }
  useEscBack(back.href)
  const crumbs = slug === null
    ? [{ label: 'pathway', href: HOME_HREF }, { label: 'marginalia' }]
    : [{ label: 'pathway', href: HOME_HREF }, { label: 'marginalia', href: '#marginalia' }, { label: title ?? slug }]
  return (
    <>
      <BackRow back={back} crumbs={crumbs} className={styles.backRow} />
      <MarginaliaTab href={HOME_HREF} label="Back to helix" ariaLabel="Back to the helix" />
    </>
  )
}

// Router-aware shell: a `null` slug renders the index/list view; any
// other value tries to find a matching article and renders its detail.
// An unknown slug falls through to a small "not found" stub so a stale
// deep-link doesn't crash the app.
export default function Marginalia({ slug, strandFilter = null }: MarginaliaProps) {
  const articles = loadArticles()

  if (slug === null) {
    return (
      <>
        <MarginaliaChrome slug={null} />
        <MarginaliaList articles={articles} activeStrand={strandFilter} />
      </>
    )
  }

  const article = findArticle(slug)
  if (!article) {
    return (
      <>
      <MarginaliaChrome slug={slug} />
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
      </>
    )
  }

  return (
    <>
      <MarginaliaChrome slug={slug} title={article.title} />
      <MarginaliaArticle article={article} />
    </>
  )
}
