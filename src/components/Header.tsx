/* ARCHIVED — disused. Superseded by the global NavBar
   (src/components/NavBar.tsx). Kept for reference; no longer
   imported anywhere. Pair: GridNav.tsx. */
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
  /* Header collapses when scrollTop crosses 50 % of the FIRST
     segment's height. For ConceptView that's the scroller's own
     clientHeight (= viewport − header, matching section A's
     min-height). For routes without the scroller, fall back to
     window.innerHeight. Picking the segment-relative midpoint
     (vs a flat 50 % of the viewport) makes the resize fire at
     the exact point where section A's snap is still in force but
     forward momentum is locked in — the collapse rides the
     existing motion instead of competing with it. The
     post-transition re-snap below cleans up any snap-point drift
     so segment 2 lands centred. */
  useEffect(() => {
    const scroller = document.querySelector('.concept-scroller') as HTMLElement | null
    /* Hysteresis — separate thresholds for COLLAPSE vs EXPAND so
       the scroller wobbling around a single midpoint can't make
       the header flash. Once compact, the user has to scroll back
       to ~20 % of a segment to expand again; once expanded, they
       have to push to 50 % to collapse. The 0.3-segment dead band
       in between absorbs the re-snap / sub-pixel jitter that was
       cycling the state. */
    const COLLAPSE_AT = 0.5
    const EXPAND_AT   = 0.2
    const check = () => {
      const y = scroller
        ? scroller.scrollTop
        : (window.scrollY || document.documentElement.scrollTop || 0)
      const segmentH = scroller ? scroller.clientHeight : window.innerHeight
      setIsScrolledPast(prev => {
        if (prev && y < segmentH * EXPAND_AT) return false
        if (!prev && y > segmentH * COLLAPSE_AT) return true
        return prev
      })
    }
    const target: EventTarget = scroller ?? window
    target.addEventListener('scroll', check, { passive: true })
    check()
    return () => target.removeEventListener('scroll', check)
  }, [currentHash])
  useEffect(() => {
    setIsPastFirstSection(isScrolledPast)
  }, [isScrolledPast])

  /* Re-snap after the header transition is intentionally NOT done
     here any more. The browser's native scroll-snap-type:y mandatory
     already lands the user on the nearest section once they release
     the scroll gesture; a JS-driven scrollTo on top of that produced
     a visible "double scroll" — the user would feel the browser
     snap to B, then ~380 ms later the JS would fire scrollTo and
     scroll again. The hysteresis in the collapse-trigger effect
     above prevents the threshold thrash that originally motivated
     this re-snap; we let the browser do its job. */

  return (
    <header
      ref={headerRef}
      className={`${styles.site} ${isCompact ? styles.siteCompact : ''}`}
    >
      <div className={styles.siteOverlay}>
        <div className={styles.logoWrap}>
          <a href="#helix3d" aria-label="Mentheon — home">
            <img
              src={`${import.meta.env.BASE_URL}web-svg.svg`}
              alt="Mentheon Logo"
              width={518}
              height={170}
            />
          </a>
        </div>
        <GridNav currentHash={currentHash} />
      </div>
    </header>
  )
}
