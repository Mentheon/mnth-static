import styles from './ResearchQuestionItem.module.css'

export interface ResearchQuestionItemProps {
  text: string
  index: number
}

export default function ResearchQuestionItem({ text, index }: ResearchQuestionItemProps) {
  return (
    <li className={styles.item}>
      <span className={styles.num}>{`RQ${index + 1}`}</span>
      <p className={styles.text}>{text}</p>
    </li>
  )
}
