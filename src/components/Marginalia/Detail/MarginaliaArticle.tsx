import type { Article } from '../types'
import ArticleBody from './ArticleBody'
import ArticleMeta from '../shared/ArticleMeta'
import styles from './MarginaliaArticle.module.css'

interface MarginaliaArticleProps {
  article: Article
}

function backToList(e: React.MouseEvent) {
  e.preventDefault()
  window.location.hash = '#marginalia'
}

export default function MarginaliaArticle({ article }: MarginaliaArticleProps) {
  return (
    <>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <a href="#marginalia" onClick={backToList}>marginalia</a>
        <span className={styles.sep}>/</span>
        <span>{article.slug}</span>
      </nav>

      <main className={styles.page}>
        <article className={styles.frame}>
          <span className={`${styles.cornerCrop} ${styles.cornerTL}`} aria-hidden="true" />
          <span className={`${styles.cornerCrop} ${styles.cornerTR}`} aria-hidden="true" />
          <span className={`${styles.cornerCrop} ${styles.cornerBL}`} aria-hidden="true" />
          <span className={`${styles.cornerCrop} ${styles.cornerBR}`} aria-hidden="true" />

          <header className={styles.header}>
            <ArticleMeta article={article} variant="detail" />
            <h1 className={styles.title}>{article.title}</h1>
            {article.summary && (
              <p className={styles.tagline}>{article.summary}</p>
            )}
          </header>

          <ArticleBody html={article.bodyHtml} />

          <div className={styles.backRow}>
            <a href="#marginalia" onClick={backToList} className={styles.backCta}>
              <span aria-hidden="true">&larr;</span> Back to marginalia
            </a>
          </div>
        </article>
      </main>
    </>
  )
}
