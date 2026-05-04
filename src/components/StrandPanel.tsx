import StrandIcon from './StrandIcon'
import type { Strand } from '../data/strands'
import styles from './StrandPanel.module.css'

interface StrandPanelProps {
  strand: Strand
  isOpen: boolean
  onClose: () => void
}

export default function StrandPanel({ strand, isOpen, onClose }: StrandPanelProps) {
  return (
    <div
      className={`${styles.panel} ${isOpen ? styles.open : ''}`}
      aria-hidden={!isOpen}
    >
      <div className={styles.panelInner}>
        <div className={styles.cornerCrop} aria-hidden="true" />

        <button className={styles.closeButton} onClick={onClose} aria-label="Close strand panel">
          ×
        </button>

        <div className={styles.panelHeader}>
          <div className={styles.headerIconCircle}>
            <StrandIcon
              strandId={strand.id}
              color="var(--strand-selected, #A30B37)"
              style={{ width: '100%', height: '100%', display: 'block' }}
            />
          </div>
          <div className={styles.headerText}>
            <h2 className={styles.strandName}>{strand.label}</h2>
            <p className={styles.tagline}>{strand.tagline}</p>
          </div>
        </div>

        <div className={styles.themeGrid}>
          {strand.themes.map((theme, idx) => (
            <div key={idx} className={styles.themeCard}>
              <div className={styles.themeNumber}>{String(idx + 1).padStart(2, '0')}</div>
              <h3 className={styles.themeTitle}>{theme.title}</h3>
              <p className={styles.themeDescription}>{theme.description}</p>
            </div>
          ))}
        </div>

        <div className={styles.ctaRow}>
          <a
            href={`#strand/${strand.id}`}
            className={styles.ctaLink}
            onClick={(e) => {
              // Belt-and-braces: scroll-snap parents in ConceptView can
              // swallow the default hash navigation in some browsers.
              // Drive the hash change ourselves so the route fires
              // reliably from any context.
              e.preventDefault()
              window.location.hash = `#strand/${strand.id}`
            }}
          >
            See full work strand
            <span className={styles.ctaArrow} aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </div>
  )
}
