import type { ArticleType } from '../types'
import styles from './TypeChip.module.css'

interface TypeChipProps {
  type: ArticleType
}

const LABELS: Record<ArticleType, string> = {
  essay: 'Essay',
  note: 'Note',
  dispatch: 'Dispatch',
  'paper-summary': 'Paper summary',
  'link-roundup': 'Link roundup',
}

// Map article-type → variant CSS class. Unknown types fall through to
// the ink default in the consumer; see `chipClass()` below.
const VARIANT: Record<ArticleType, string> = {
  essay: 'chipCrimson',
  note: 'chipPlum',
  dispatch: 'chipInk',
  'paper-summary': 'chipGrape',
  'link-roundup': 'chipGrape',
}

function chipClass(type: ArticleType): string {
  const key = VARIANT[type] ?? 'chipInk'
  return styles[key]
}

export default function TypeChip({ type }: TypeChipProps) {
  const label = LABELS[type] ?? 'Note'
  return <span className={`${styles.chip} ${chipClass(type)}`}>{label}</span>
}
