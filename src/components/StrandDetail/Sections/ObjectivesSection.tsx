import type { ObjectiveItem } from '../../../data/strands'
import SectionTitle from './SectionTitle'
import ObjectiveCard from './ObjectiveCard'
import styles from './ObjectivesSection.module.css'

export interface ObjectivesSectionProps {
  items: ObjectiveItem[]
  sectionNumber?: string
}

export default function ObjectivesSection({ items, sectionNumber }: ObjectivesSectionProps) {
  if (items.length === 0) return null
  return (
    <section className={styles.section}>
      <SectionTitle text="Objectives" number={sectionNumber} />
      <div className={styles.grid}>
        {items.map((item, idx) => (
          <ObjectiveCard key={idx} item={item} index={idx} />
        ))}
      </div>
    </section>
  )
}
