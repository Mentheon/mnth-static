import type { ObjectiveItem } from '../../../data/strands'
import styles from './ObjectiveCard.module.css'

export interface ObjectiveCardProps {
  item: ObjectiveItem
  index: number
}

export default function ObjectiveCard({ item, index }: ObjectiveCardProps) {
  // The card's numeric prefix (01, 02 …) is rendered via a CSS
  // pseudo-element pulling from the data-num attribute, mirroring the
  // reference HTML's CSS counter — but explicit so the order doesn't
  // depend on DOM placement.
  const num = String(index + 1).padStart(2, '0')
  return (
    <div className={styles.card} data-num={num}>
      <p className={styles.verb}>{item.verb}</p>
      <p className={styles.text}>{item.text}</p>
    </div>
  )
}
