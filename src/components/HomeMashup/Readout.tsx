import styles from './Readout.module.css'

interface ReadoutProps {
  left: string
  right: string
}

/* ============================================================
   Readout — top-corner monitor-style text strip mimicking the
   "LEAD II" annotations on hospital cardiac monitors. The
   orchestrator drives both halves; each scene pushes its label
   via onReadoutChange.
   ============================================================ */
export default function Readout({ left, right }: ReadoutProps) {
  return (
    <div className={styles.readout} aria-hidden="true">
      <span className={styles.left}>{left}</span>
      <span className={styles.right}>{right}</span>
    </div>
  )
}
