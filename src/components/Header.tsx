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
  useEffect(() => {
    const check = () => {
      const y = window.scrollY || document.documentElement.scrollTop || 0
      setIsScrolledPast(y > window.innerHeight * 0.8)
    }
    window.addEventListener('scroll', check, { passive: true })
    check()
    return () => window.removeEventListener('scroll', check)
  }, [currentHash])

  /* ConceptView signal — dispatched as `mentheon:section` whenever
     the snap-scroller crosses a section boundary. We collapse only
     after the user has moved beyond section 'a' (the headline /
     mashup), so the first segment keeps the full brand mark. */
  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent<{ section: string | null }>).detail?.section
      setIsPastFirstSection(!!id && id !== 'a')
    }
    document.addEventListener('mentheon:section', handler as EventListener)
    return () => document.removeEventListener('mentheon:section', handler as EventListener)
  }, [])

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
