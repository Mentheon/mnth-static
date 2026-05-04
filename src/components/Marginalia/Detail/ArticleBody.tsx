import styles from './ArticleBody.module.css'

interface ArticleBodyProps {
  html: string
}

// The rendered HTML is trusted (it comes from our own markdown files
// at build time), so dangerouslySetInnerHTML is fine here. All body
// typography lives in ArticleBody.module.css; selectors are scoped to
// `.body` so they cannot leak into the rest of the app.
export default function ArticleBody({ html }: ArticleBodyProps) {
  return <div className={styles.body} dangerouslySetInnerHTML={{ __html: html }} />
}
