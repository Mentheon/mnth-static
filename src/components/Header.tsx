import { useEffect, useRef, useState } from 'react'
import GridNav from './GridNav'
import styles from './Header.module.css'

interface HeaderProps {
  currentHash: string
}

export default function Header({ currentHash }: HeaderProps) {
  const headerRef = useRef<HTMLElement>(null)

  /* When the user scrolls past a small threshold inside the embedded
     .concept-scroller (or the page itself, on routes without one),
     the header collapses to a compact strip. Hovering the strip
     re-expands the visible content via CSS — section snap layout
     stays anchored to the COMPACT height (the .site element keeps
     its 70 px box; the inner .siteOverlay grows on hover and
     overlays the page below without shifting layout). */
  const [isCompact, setIsCompact] = useState(false)

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

  /* Scroll detection — collapses the header once the user has moved
     past ~60 px in either the embedded carousel scroller or the
     window itself. Re-runs on route change in case the active page
     swaps between those (Marginalia / Strand detail use window
     scroll; ConceptView uses the .concept-scroller). */
  useEffect(() => {
    const SCROLL_THRESHOLD = 60
    const scroller = document.querySelector('.concept-scroller') as HTMLElement | null
    const check = () => {
      const y = scroller
        ? scroller.scrollTop
        : (window.scrollY || document.documentElement.scrollTop || 0)
      setIsCompact(y > SCROLL_THRESHOLD)
    }
    const target: EventTarget = scroller ?? window
    target.addEventListener('scroll', check, { passive: true })
    check()
    return () => target.removeEventListener('scroll', check)
  }, [currentHash])

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
