import type { ReactNode } from 'react'
import type { StrandMeta } from '../../../data/strands'
import MetaItem from './MetaItem'
import styles from './StrandMetaRow.module.css'

export interface StrandMetaRowProps {
  meta?: StrandMeta
  // The beacon (or any other inline disclosure trigger) is composed in
  // as a child so this row stays presentational.
  children?: ReactNode
}

export default function StrandMetaRow({ meta, children }: StrandMetaRowProps) {
  return (
    <div className={styles.row}>
      {meta?.since         && <MetaItem label="since"         value={meta.since}         />}
      {meta?.collaborators && <MetaItem label="collaborators" value={meta.collaborators} />}
      {meta?.phase         && <MetaItem label="phase"         value={meta.phase}         />}
      {children}
    </div>
  )
}
