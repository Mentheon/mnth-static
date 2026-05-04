import SectionTitle from './SectionTitle'
import ResearchQuestionItem from './ResearchQuestionItem'
import styles from './ResearchQuestionsSection.module.css'

export interface ResearchQuestionsSectionProps {
  items: string[]
  sectionNumber?: string
}

export default function ResearchQuestionsSection({
  items,
  sectionNumber,
}: ResearchQuestionsSectionProps) {
  if (items.length === 0) return null
  return (
    <section className={styles.section}>
      <SectionTitle text="Research questions" number={sectionNumber} />
      <ol className={styles.list}>
        {items.map((q, i) => (
          <ResearchQuestionItem key={i} text={q} index={i} />
        ))}
      </ol>
    </section>
  )
}
