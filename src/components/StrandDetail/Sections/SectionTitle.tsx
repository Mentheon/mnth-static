import styles from './SectionTitle.module.css'

export interface SectionTitleProps {
  text: string
  number?: string
}

export default function SectionTitle({ text, number }: SectionTitleProps) {
  return (
    <h2 className={styles.title}>
      {text}
      {number && <span className={styles.num}>{`§ ${number}`}</span>}
    </h2>
  )
}
