import { useMemo } from 'react'
import IconCircle from './IconCircle'
import { useTypewriter } from '../hooks/useTypewriter'
import styles from './HeroIconsWithContent.module.css'

const HERO_ITEMS = [
  { id: 'research',    label: 'Research',    emoji: '🔬' },
  { id: 'development', label: 'Development', emoji: '💻' },
  { id: 'consultancy', label: 'Consultancy', emoji: '📋' },
]

const TYPED_CONTENT: Record<string, string[]> = {
  research: [
    'Our research pushes the boundaries of digital health.',
    'Cutting-edge methods and pioneering discoveries.',
  ],
  development: [
    'Our development team builds robust, scalable solutions.',
    'Innovation in software for healthcare.',
  ],
  consultancy: [
    'Expert consultancy to guide your digital transformation.',
    'We bring expertise and strategy to your projects.',
  ],
}

interface Props {
  selected: string
  onSelect: (id: string) => void
}

export default function HeroIconsWithContent({ selected, onSelect }: Props) {
  const strings = useMemo(() => TYPED_CONTENT[selected] ?? [], [selected])
  const typedText = useTypewriter(strings, { speed: 35, eraseDelay: 1800 })

  return (
    <div>
      <div className={styles.iconsRow}>
        {HERO_ITEMS.map((item) => (
          <div key={item.id} className={styles.iconGroup}>
            <a
              href="#"
              className={`${styles.iconLink} ${selected === item.id ? styles.selected : ''}`}
              onClick={(e) => { e.preventDefault(); onSelect(item.id) }}
              aria-pressed={selected === item.id}
            >
              <div className={styles.iconWrapper}>
                <IconCircle emoji={item.emoji} size={120} isSelected={selected === item.id} />
              </div>
            </a>
            <span className={styles.label}>{item.label}</span>
          </div>
        ))}
      </div>

      <div className={styles.typedContent}>
        {typedText}
        <span className={styles.caret} aria-hidden="true" />
      </div>

      <div className={styles.statusIndicators}>
        {HERO_ITEMS.map((item) => (
          <div
            key={item.id}
            className={`${styles.indicator} ${selected === item.id ? styles.activeIndicator : ''}`}
          />
        ))}
      </div>
    </div>
  )
}
