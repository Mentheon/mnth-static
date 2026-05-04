import type { ReactNode } from 'react'
import type { Strand } from '../../../data/strands'
import StrandIcon from '../../StrandIcon'
import styles from './StrandDetailHeader.module.css'

export interface StrandDetailHeaderProps {
  strand: Strand
  // The meta-row + expanded progress timeline are composed in as
  // children so the header itself stays purely presentational.
  children?: ReactNode
}

export default function StrandDetailHeader({ strand, children }: StrandDetailHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.iconWrap} aria-hidden="true">
        <StrandIcon strandId={strand.id} color="#FFECE1" />
      </div>
      <div className={styles.text}>
        {strand.kicker && (
          <div className={styles.kicker}>
            <span className={styles.kickerDot} aria-hidden="true" />
            {strand.kicker}
          </div>
        )}
        <h1 className={styles.name}>{strand.label}</h1>
        <p className={styles.tagline}>{strand.tagline}</p>
        {children}
      </div>
    </header>
  )
}
