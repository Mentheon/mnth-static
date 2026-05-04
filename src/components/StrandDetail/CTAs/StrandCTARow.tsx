import type { CTA } from '../../../data/strands'
import CTAButton from './CTAButton'
import styles from './StrandCTARow.module.css'

export interface StrandCTARowProps {
  ctas: CTA[]
}

export default function StrandCTARow({ ctas }: StrandCTARowProps) {
  if (ctas.length === 0) return null
  return (
    <div className={styles.row}>
      {ctas.map((cta, i) => (
        <CTAButton key={i} cta={cta} />
      ))}
    </div>
  )
}
