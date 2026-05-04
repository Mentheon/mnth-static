import styles from './MetaItem.module.css'

export interface MetaItemProps {
  label: string
  value: string
}

export default function MetaItem({ label, value }: MetaItemProps) {
  return (
    <div className={styles.item}>
      {label}
      <strong className={styles.value}>{value}</strong>
    </div>
  )
}
