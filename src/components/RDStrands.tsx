import { STRANDS } from '../data/strands'
import StrandIcon from './StrandIcon'
import StrandPanel from './StrandPanel'
import styles from './RDStrands.module.css'

interface RDStrandsProps {
  openId: string | null
  onSelect: (id: string | null) => void
}

export default function RDStrands({ openId, onSelect }: RDStrandsProps) {
  function toggle(id: string) {
    onSelect(openId === id ? null : id)
  }

  const openStrand = STRANDS.find((s) => s.id === openId) ?? null

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

      {openStrand && (
        <StrandPanel
          key={openStrand.id}
          strand={openStrand}
          isOpen={openId !== null}
          onClose={() => onSelect(null)}
        />
      )}
    </section>
  )
}
