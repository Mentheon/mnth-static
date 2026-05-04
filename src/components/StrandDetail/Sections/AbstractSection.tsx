import SectionTitle from './SectionTitle'
import styles from './AbstractSection.module.css'

export interface AbstractSectionProps {
  text: string
  sectionNumber?: string
}

export default function AbstractSection({ text, sectionNumber }: AbstractSectionProps) {
  if (!text) return null
  return (
    <section className={styles.section}>
      <SectionTitle text="Abstract" number={sectionNumber} />
      <p className={styles.body}>{text}</p>
    </section>
  )
}
