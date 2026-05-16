import { useEffect, useRef } from 'react'
import styles from './MarginaliaTab.module.css'

/* A fixed tab pinned to the right margin (helix3d view only) — the
   "notes in the margin" placement is the point. As the cursor nears,
   the tab magnetically slides inboard and a solid band in the
   OPPOSITE theme grows behind it from the screen edge, as if the
   margin is being peeled back to show the other mode. Purely
   decorative — it eases back when the cursor leaves; clicking still
   navigates to Marginalia. */

// helix3d theme --bg tokens — keep in sync with the
// `.helix3d-root[data-theme=...]` blocks in helix3d.css.
const LIGHT_BG = '#FFECE1'
const DARK_BG = '#1A0226'

const RANGE = 120      // px — proximity activation radius (close-range)
const MAX_PULL = 18    // px — tab travel toward the cursor
const MAX_REVEAL = 26  // px — exposed inverse-theme band width
const EASE = 0.2       // per-frame approach factor (exp smoothing)

export default function MarginaliaTab() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const tabRef = useRef<HTMLAnchorElement>(null)
  const bandRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const band = bandRef.current
    if (!wrap || !band) return

    const root = wrap.closest('.helix3d-root')
    let mx = -9999
    let my = -9999
    let pull = 0
    let reveal = 0
    let raf = 0

    const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY }
    window.addEventListener('mousemove', onMove)

    const tick = () => {
      // Measure against the wrap (never transformed) so the pulled
      // tab can't feed back into its own proximity reading.
      const r = wrap.getBoundingClientRect()
      const dx = mx < r.left ? r.left - mx : mx > r.right ? mx - r.right : 0
      const dy = my < r.top ? r.top - my : my > r.bottom ? my - r.bottom : 0
      const prox = Math.max(0, 1 - Math.hypot(dx, dy) / RANGE) // 0..1

      pull += (prox * MAX_PULL - pull) * EASE
      reveal += (prox * MAX_REVEAL - reveal) * EASE
      wrap.style.setProperty('--pull', `${pull.toFixed(2)}px`)
      wrap.style.setProperty('--reveal', `${reveal.toFixed(2)}px`)

      // Opposite of the current theme; recomputed each frame so it
      // tracks the theme-switch button at runtime.
      const dark = root?.getAttribute('data-theme') === 'dark'
      band.style.background = dark ? LIGHT_BG : DARK_BG

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
    }
  }, [])

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <span className={styles.band} ref={bandRef} aria-hidden="true" />
      <a
        className={styles.tab}
        href="#marginalia"
        aria-label="Open Marginalia"
        ref={tabRef}
      >
        <span className={styles.star} aria-hidden="true">✲</span>
        <span className={styles.text}>Marginalia</span>
      </a>
    </div>
  )
}
