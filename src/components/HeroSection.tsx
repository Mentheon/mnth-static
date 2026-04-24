import { useState } from 'react'
import HeroIconsWithContent from './HeroIconsWithContent'
import styles from './HeroSection.module.css'

const HERO_LINE2: Record<string, string> = {
  research:    'Digital Health Research',
  development: 'R&D of Software as a Medical Device (SaMD)',
  consultancy: 'Consultancy for your Digital Health needs',
}

export default function HeroSection() {
  const [selected, setSelected] = useState('research')

  return (
    <section className={styles.hero} id="home">
      <p className={styles.line1}>We undertake:</p>
      <p className={styles.line2}>{HERO_LINE2[selected]}</p>
      <HeroIconsWithContent selected={selected} onSelect={setSelected} />
      <div className={styles.scrollCue}>
        <span>scroll to see our latest work</span>
      </div>
    </section>
  )
}
