import type { CTA } from '../../../data/strands'
import styles from './CTAButton.module.css'

export interface CTAButtonProps {
  cta: CTA
}

export default function CTAButton({ cta }: CTAButtonProps) {
  const variantClass = cta.variant === 'primary' ? styles.primary : styles.secondary
  return (
    <a href={cta.href} className={`${styles.cta} ${variantClass}`}>
      {cta.label}
      {cta.arrow && (
        <span className={styles.arrow} aria-hidden="true">→</span>
      )}
    </a>
  )
}
