import { useEffect, useState } from 'react'

/**
 * Reactive media-query hook — `true` when the viewport is at or below
 * the breakpoint. Defaults to 720 px, the cutoff where the helix /
 * carousel layouts stop being usable and the page forks to a
 * stacked-list mobile presentation.
 *
 * SSR-safe: the initial state assumes desktop until the effect runs,
 * which avoids `window`-not-defined crashes during server render.
 * The first paint may flash desktop layout for one frame on a phone;
 * a `useLayoutEffect` would be tighter but isn't worth the SSR risk
 * for a Vite client-side app.
 */
export function useIsMobile(breakpoint: number = 720): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(`(max-width: ${breakpoint}px)`).matches
  })

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    // `addEventListener` is preferred over the older `addListener`
    // (deprecated in Safari ≥ 14 / Chrome ≥ 78). Safari 13 etc. would
    // need a fallback, but the target audience here is modern browsers.
    mql.addEventListener('change', handler)
    // Sync once in case the initial state evaluated before window was
    // available, or in case the breakpoint changes between renders.
    setIsMobile(mql.matches)
    return () => mql.removeEventListener('change', handler)
  }, [breakpoint])

  return isMobile
}
