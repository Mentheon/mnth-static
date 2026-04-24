import PersonIcon from './PersonIcon'
import type { Person } from '../data/people'
import styles from './StrandPanel.module.css'

interface PersonPanelProps {
  person: Person
  isOpen: boolean
  onClose: () => void
}

export default function PersonPanel({ person, isOpen, onClose }: PersonPanelProps) {
  return (
    <div
      className={`${styles.panel} ${isOpen ? styles.open : ''}`}
      aria-hidden={!isOpen}
    >
      <div className={styles.panelInner}>
        <div className={styles.cornerCrop} aria-hidden="true" />

        <button className={styles.closeButton} onClick={onClose} aria-label="Close person panel">
          ×
        </button>

        <div className={styles.panelHeader}>
          <div className={styles.headerIconCircle}>
            <PersonIcon
              color="var(--strand-selected, #A30B37)"
              style={{ width: '100%', height: '100%', display: 'block' }}
            />
          </div>
          <div className={styles.headerText}>
            <h2 className={styles.strandName}>{person.name}</h2>
            <p className={styles.tagline}>{person.tagline}</p>
          </div>
        </div>

        <div className={styles.themeGrid}>
          {person.themes.map((theme, idx) => (
            <div key={idx} className={styles.themeCard}>
              <div className={styles.themeNumber}>{String(idx + 1).padStart(2, '0')}</div>
              <h3 className={styles.themeTitle}>{theme.title}</h3>
              <p className={styles.themeDescription}>{theme.description}</p>
            </div>
          ))}
        </div>

        <div className={styles.ctaRow}>
          <a href={person.href} className={styles.ctaLink}>
            Read full profile
            <span className={styles.ctaArrow} aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </div>
  )
}
