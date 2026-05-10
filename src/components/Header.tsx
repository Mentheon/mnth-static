import { useEffect, useRef, useState } from 'react'
import GridNav from './GridNav'
import styles from './Header.module.css'

interface HeaderProps {
  currentHash: string
}

export default function Header({ currentHash }: HeaderProps) {
  const headerRef = useRef<HTMLElement>(null)

  /* Compact state has two triggers, depending on the active route:
     1. ConceptView publishes its current section via the
        `mentheon:section` custom event. The header folds compact
        once the user has moved PAST the first segment (section
        'a'); on 'a' it stays full size.
     2. On non-ConceptView routes (Marginalia, Strand detail), there
        is no section signal — fall back to a window-scroll
        threshold sized to roughly one viewport so the header only
        compacts after the user has actually scrolled meaningfully. */
  const [isScrolledPast, setIsScrolledPast] = useState(false)
  const [isPastFirstSection, setIsPastFirstSection] = useState(false)
  const isCompact = isScrolledPast || isPastFirstSection

  /* ResizeObserver — publishes the header's *layout-reserved* height
     to `--header-h`. Because hover only changes .siteOverlay (which
     is absolutely positioned inside .site), .site's height stays put
     while expanded, so the variable doesn't flap on hover and the
     ConceptView scroll math stays steady. */
  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    const update = () => {
      const h = el.getBoundingClientRect().height
      if (h > 0) document.documentElement.style.setProperty('--header-h', `${h}px`)
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    window.addEventListener('resize', update)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  /* Window-scroll fallback for routes WITHOUT ConceptView's section
     event — Marginalia article reads, Strand detail. Threshold is a
     full viewport so the header doesn't compact in the first inch
     of scroll. ConceptView's own scroller is internal to the page
     and won't trigger window scroll, so this never fires there. */
  /* Scroll-distance triggered collapse. Fires at half a viewport so
     the header DOES resize on the user's first meaningful downward
     gesture (matching the "more screen real estate" intent), but the
     companion re-snap effect below catches the side-effect — section
     min-height grows when --header-h shrinks, so snap points shift
     mid-scroll and could leave the user parked between segments.
     We re-snap to the nearest section once the header height
     transition (~300 ms) settles, so segment 2 lands centred even
     when the resize fires mid-traversal. */
  useEffect(() => {
    const scroller = document.querySelector('.concept-scroller') as HTMLElement | null
    const check = () => {
      const y = scroller
        ? scroller.scrollTop
        : (window.scrollY || document.documentElement.scrollTop || 0)
      setIsScrolledPast(y > window.innerHeight * 0.5)
    }
    const target: EventTarget = scroller ?? window
    target.addEventListener('scroll', check, { passive: true })
    check()
    return () => target.removeEventListener('scroll', check)
  }, [currentHash])
  useEffect(() => {
    setIsPastFirstSection(isScrolledPast)
  }, [isScrolledPast])

  /* When isCompact flips (in either direction), the header animates
     its height over ~300 ms, --header-h updates via ResizeObserver,
     and every .concept-section's min-height recalculates. Their
     snap points (= offsetTop in the scroller) shift accordingly. If
     the user was mid-scroll, scrollTop no longer corresponds to
     either A's or B's new snap point — feels stuck. Solution:
     ~380 ms after isCompact changes (header has settled), find the
     section whose offsetTop is closest to the current scrollTop and
     scroll to it. The 8-px epsilon prevents a no-op scroll triggering
     a snap-event feedback loop. */
  useEffect(() => {
    const scroller = document.querySelector('.concept-scroller') as HTMLElement | null
    if (!scroller || scroller.scrollTop < 10) return
    const id = window.setTimeout(() => {
      const sections = Array.from(scroller.querySelectorAll('.concept-section')) as HTMLElement[]
      if (!sections.length) return
      const currentY = scroller.scrollTop
      let closest = sections[0]
      let bestDist = Infinity
      for (const s of sections) {
        const dist = Math.abs(s.offsetTop - currentY)
        if (dist < bestDist) { bestDist = dist; closest = s }
      }
      if (Math.abs(closest.offsetTop - currentY) > 8) {
        scroller.scrollTo({ top: closest.offsetTop, behavior: 'smooth' })
      }
    }, 380)
    return () => window.clearTimeout(id)
  }, [isCompact])

  return (
    <header
      ref={headerRef}
      className={`${styles.site} ${isCompact ? styles.siteCompact : ''}`}
    >
      <div className={styles.siteOverlay}>
        <div className={styles.logoWrap}>
          <img
            src={`${import.meta.env.BASE_URL}web-svg.svg`}
            alt="Mentheon Logo"
            width={518}
            height={170}
          />
        </div>
        <GridNav currentHash={currentHash} />
      </div>
    </header>
  )
}
