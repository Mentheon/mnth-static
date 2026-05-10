import { STRANDS } from '../data/strands'
import StrandIcon from './StrandIcon'
import styles from './MobileStrandList.module.css'

interface MobileStrandListProps {
  openId: string | null
  onSelect: (id: string | null) => void
}

/**
 * Section C's mobile substitute for the helix + RDStrands picker.
 * Renders a stacked vertical list of strand cards — each is the
 * tappable equivalent of a strand bubble on desktop, with the same
 * `openId / onSelect` contract so ConceptView's state stays
 * unchanged. The helix's spiral geometry simply doesn't compress
 * into a phone-width column gracefully, so the mobile fork swaps
 * to a list pattern that respects thumb-reach and legibility.
 */
export default function MobileStrandList({ openId, onSelect }: MobileStrandListProps) {
  return (
    <div className={styles.list} role="list" aria-label="R&D strands">
      <h2 className={styles.heading}>
        <span className={styles.thin}>Our ongoing</span> R&amp;D strands
      </h2>
      {STRANDS.map(strand => {
        const isActive = openId === strand.id
        return (
          <button
            key={strand.id}
            type="button"
            role="listitem"
            className={`${styles.card} ${isActive ? styles.cardActive : ''}`}
            onClick={() => onSelect(isActive ? null : strand.id)}
            aria-expanded={isActive}
            aria-controls="strand-panel"
          >
            <span className={styles.iconWrap} aria-hidden="true">
              <StrandIcon
                strandId={strand.id}
                color={isActive ? 'var(--strand-selected, #A30B37)' : 'var(--strand-default, #9C528B)'}
                className={styles.icon}
              />
            </span>
            <span className={styles.copy}>
              <span className={styles.label}>{strand.label}</span>
              <span className={styles.tagline}>{strand.tagline}</span>
              <span className={styles.meta}>
                <span className={styles.metaPill}>
                  {strand.themes.length} {strand.themes.length === 1 ? 'theme' : 'themes'}
                </span>
                {strand.meta?.phase && (
                  <span className={styles.metaDot} aria-hidden="true">·</span>
                )}
                {strand.meta?.phase && (
                  <span className={styles.metaPhase}>{strand.meta.phase}</span>
                )}
              </span>
            </span>
            <span className={styles.chev} aria-hidden="true">{isActive ? '↓' : '›'}</span>
          </button>
        )
      })}
    </div>
  )
}
