import { useEffect, useMemo, useRef, useState } from 'react'
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

/* Every term must appear somewhere in title, summary, type, strands
   or body (case- and accent-insensitive). */
const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
function haystack(a: Article) {
  const strandLabels = a.strands.map((id) => STRANDS.find((s) => s.id === id)?.label ?? id).join(' ')
  return fold([a.title, a.summary, a.type, strandLabels, a.body].join(' '))
}

export default function MarginaliaList({ articles, activeStrand }: MarginaliaListProps) {
  const counts = buildCounts(articles)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const index = useMemo(() => new Map(articles.map((a) => [a.slug, haystack(a)])), [articles])
  // "/" focuses search from anywhere on the page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (e.key === '/' && !(t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) { e.preventDefault(); inputRef.current?.focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  const terms = fold(query).split(/\s+/).filter(Boolean)
  const filtered = articles
    .filter((a) => !activeStrand || a.strands.includes(activeStrand))
    .filter((a) => terms.every((t) => index.get(a.slug)!.includes(t)))

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

        {articles.length === 0 ? (
          // Nothing published yet — skip search + strand chips, which
          // would only show zeros. Drop a .md into src/content/marginalia/
          // and the full list view comes back.
          <p className={styles.empty}>
            Nothing here yet &mdash; the first pieces are being written.
          </p>
        ) : (<>
        <div className={styles.search} role="search">
          <label className={styles.searchLabel} htmlFor="marginalia-search">
            <span className={styles.searchStar} aria-hidden="true">✲</span>search
          </label>
          <input
            ref={inputRef}
            id="marginalia-search"
            className={styles.searchInput}
            type="search"
            value={query}
            placeholder="titles, notes, strands…"
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') { e.stopPropagation(); if (query) setQuery(''); else inputRef.current?.blur() }
            }}
          />
          {query ? (
            <button type="button" className={styles.searchClear} onClick={() => { setQuery(''); inputRef.current?.focus() }} aria-label="Clear search">×</button>
          ) : (
            <span className={styles.searchKbd} aria-hidden="true">/</span>
          )}
          <span className={styles.searchCount} aria-live="polite">
            {String(filtered.length).padStart(2, '0')} / {String(articles.length).padStart(2, '0')}
          </span>
        </div>

        <StrandFilter activeStrand={activeStrand} counts={counts} />

        {filtered.length === 0 ? (
          <p className={styles.empty}>
            {terms.length
              ? `No articles match “${query.trim()}”${activeStrandLabel ? ` in ${activeStrandLabel}` : ''}.`
              : activeStrandLabel
              ? `No articles tagged with ${activeStrandLabel} yet.`
              : 'No articles yet.'}
          </p>
        ) : (
          <div className={styles.grid}>
            {filtered.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        )}
        </>)}
      </article>
    </main>
  )
}
