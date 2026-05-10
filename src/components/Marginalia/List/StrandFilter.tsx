import { STRANDS } from '../../../data/strands'
import styles from './StrandFilter.module.css'

interface StrandFilterProps {
  /** Currently-active strand id, or null for "All". */
  activeStrand: string | null
  /** Count of articles available under each strand id, plus 'all'. */
  counts: Record<string, number>
}

/* Filter chip strip rendered above the article grid. Each chip is an
   anchor whose href encodes the filter into the URL hash, so filtered
   views are deep-linkable + back-button-friendly. The "All" chip just
   navigates to bare `#marginalia` (no query). */
export default function StrandFilter({ activeStrand, counts }: StrandFilterProps) {
  const chips: Array<{ id: string | null; label: string; count: number }> = [
    { id: null, label: 'All', count: counts.all ?? 0 },
    ...STRANDS.map((s) => ({
      id: s.id,
      label: s.label,
      count: counts[s.id] ?? 0,
    })),
  ]

  return (
    <nav className={styles.strip} aria-label="Filter by strand">
      {chips.map((chip) => {
        const isActive =
          (chip.id === null && activeStrand === null) ||
          (chip.id !== null && chip.id === activeStrand)
        const href = chip.id === null ? '#marginalia' : `#marginalia?strand=${chip.id}`
        return (
          <a
            key={chip.id ?? '__all'}
            className={`${styles.chip} ${isActive ? styles.chipActive : ''}`}
            href={href}
            aria-current={isActive ? 'true' : undefined}
            onClick={(e) => {
              // Drive the hash directly so any scroll-snap parent can't
              // swallow the navigation (same defensive pattern used by
              // StrandPanel's CTA + the article cards).
              e.preventDefault()
              window.location.hash = href
            }}
          >
            <span className={styles.label}>{chip.label}</span>
            <span className={styles.count} aria-hidden="true">
              {chip.count}
            </span>
          </a>
        )
      })}
    </nav>
  )
}
