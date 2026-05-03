import { STRANDS } from '../data/strands'
import StrandIcon from './StrandIcon'
import styles from './RDStrands.module.css'

interface RDStrandsProps {
  openId: string | null
  onSelect: (id: string | null) => void
}

// StrandPanel is rendered in App.tsx — placed between the HeroSection
// and the Helix above this component, so the user sees a selected
// project's details right under the hero icons (above the scrollable
// helix and these buttons), keeping the panel + helix + buttons
// readable as one column.
export default function RDStrands({ openId, onSelect }: RDStrandsProps) {
  function toggle(id: string) {
    onSelect(openId === id ? null : id)
  }

  return (
    <section className={styles.rd} id="rd">
      <h2 className={styles.rdTitle}>
        <span className={styles.thin}>Our ongoing</span> R&amp;D strands
        <span className={styles.thin}>…</span>
      </h2>

      <div className={`${styles.rdRow} ${openId ? styles.collapsed : ''}`}>
        {STRANDS.map((strand) => {
          const isSelected = openId === strand.id
          const isDimmed = openId !== null && !isSelected
          return (
            <div
              key={strand.id}
              className={[
                styles.rdGroup,
                isSelected ? styles.selected : '',
                isDimmed ? styles.dimmed : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <button
                type="button"
                className={styles.rdLink}
                onClick={() => toggle(strand.id)}
                aria-expanded={isSelected}
                aria-controls="strand-panel"
                aria-label={strand.label}
              >
                <StrandIcon
                  strandId={strand.id}
                  color={isSelected ? 'var(--strand-selected, #A30B37)' : 'var(--strand-default, #9C528B)'}
                  className={styles.svgDisc}
                />
              </button>
              <span className={styles.label}>{strand.label}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
