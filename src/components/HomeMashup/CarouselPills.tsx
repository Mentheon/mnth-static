import type { SceneDescriptor } from './types'
import styles from './CarouselPills.module.css'

interface CarouselPillsProps {
  scenes: SceneDescriptor[]
  activeIndex: number
  onSelect: (index: number) => void
}

/* ============================================================
   CarouselPills — horizontal row of small dots beneath the
   carousel canvas. Active pill = crimson + larger; click to
   jump to that scene. Mirrors .concept-pillnav from
   ConceptView.css but flows horizontally and is part of the
   stage layout (not fixed-position).
   ============================================================ */
export default function CarouselPills({ scenes, activeIndex, onSelect }: CarouselPillsProps) {
  return (
    <nav className={styles.pillnav} aria-label="Carousel scene navigation">
      {scenes.map((scene, idx) => {
        const isActive = idx === activeIndex
        return (
          <button
            key={scene.id}
            type="button"
            className={`${styles.pill} ${isActive ? styles.pillActive : ''}`}
            onClick={() => onSelect(idx)}
            aria-current={isActive ? 'true' : undefined}
            aria-label={`Jump to ${scene.label}`}
          >
            <span className={styles.pillDot} aria-hidden="true" />
          </button>
        )
      })}
    </nav>
  )
}
