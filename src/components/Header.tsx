import { useEffect, useRef } from 'react'
import GridNav from './GridNav'
import styles from './Header.module.css'

interface HeaderProps {
  currentHash: string
}

export default function Header({ currentHash }: HeaderProps) {
  const headerRef = useRef<HTMLElement>(null)

  /* ----------------------------------------------------------------
     Publish the header's actual rendered height as a CSS custom
     property on <html>, so layout calcs further down can use
     `calc(100dvh - var(--header-h))` instead of guessing 170 px. The
     guess broke on narrower viewports where the header collapses to
     `height: auto` (see Header.module.css @media), cropping into the
     scrollable section below by whatever the difference came out to.
     ResizeObserver covers font-load reflows and orientation changes;
     the window resize listener catches in-place breakpoint flips.
     ---------------------------------------------------------------- */
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

  return (
    <header ref={headerRef} className={styles.site}>
      <div className={styles.logoWrap}>
        <img
          src={`${import.meta.env.BASE_URL}web-svg.svg`}
          alt="Mentheon Logo"
          width={518}
          height={170}
        />
      </div>
      <GridNav currentHash={currentHash} />
    </header>
  )
}
