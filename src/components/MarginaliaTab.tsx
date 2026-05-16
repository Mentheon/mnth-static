import styles from './MarginaliaTab.module.css'

/* A fixed tab pinned to the right margin of the site — vertical
   reading text linking to the Marginalia section. The "notes in the
   margin" placement is the point: it lives in the page's margin,
   mirroring what marginalia is. Rendered site-wide by App (not on
   the 3D takeover routes, and hidden when already on Marginalia). */
export default function MarginaliaTab() {
  return (
    <a className={styles.tab} href="#marginalia" aria-label="Open Marginalia">
      <span className={styles.star} aria-hidden="true">✲</span>
      <span className={styles.text}>Marginalia</span>
    </a>
  )
}
