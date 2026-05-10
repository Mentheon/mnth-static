import { STRANDS } from '../../../data/strands'
import styles from './StrandTags.module.css'

interface StrandTagsProps {
  /** Strand IDs to render. Empty array → component renders nothing. */
  strands: string[]
  /**
   * `card`: passive small grape pills (whole card is the link).
   * `detail`: anchor pills that filter the marginalia list when clicked.
   */
  variant?: 'card' | 'detail'
}

/* Tiny strand-tag pill row. Resolves IDs to display labels via STRANDS;
   silently drops unknown IDs so a typo in frontmatter doesn't break
   rendering. */
export default function StrandTags({ strands, variant = 'card' }: StrandTagsProps) {
  if (!strands.length) return null
  const resolved = strands
    .map((id) => STRANDS.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => s != null)
  if (!resolved.length) return null

  return (
    <span className={styles.row}>
      {resolved.map((s) => {
        const tagClass = `${styles.tag} ${variant === 'detail' ? styles.tagDetail : ''}`
        if (variant === 'detail') {
          const href = `#marginalia?strand=${s.id}`
          return (
            <a
              key={s.id}
              href={href}
              className={tagClass}
              onClick={(e) => {
                e.preventDefault()
                window.location.hash = href
              }}
            >
              {s.label}
            </a>
          )
        }
        return (
          <span key={s.id} className={tagClass}>
            {s.label}
          </span>
        )
      })}
    </span>
  )
}
