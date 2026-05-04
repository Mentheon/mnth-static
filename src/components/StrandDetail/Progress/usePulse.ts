import { useEffect } from 'react'
import { animate } from 'animejs'
import useReducedMotion from '../hooks/useReducedMotion'

export interface UsePulseOptions {
  rFrom: number
  rTo: number
  opacityFrom: number
  opacityTo: number
  duration: number
  delay?: number
}

// Looping pulse on an SVG <circle>. Used by the beacon's small pulse
// and by the current-phase pulse inside the expanded timeline. Owns
// its own anime.js lifecycle and returns nothing — the component just
// passes a ref and the parameters and forgets about it.
export default function usePulse(
  targetRef: React.RefObject<SVGCircleElement | null>,
  options: UsePulseOptions,
  enabled: boolean = true,
): void {
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced || !enabled) return
    const el = targetRef.current
    if (!el) return

    const anim = animate(el, {
      r: [options.rFrom, options.rTo],
      opacity: [options.opacityFrom, options.opacityTo],
      duration: options.duration,
      delay: options.delay ?? 0,
      ease: 'outQuad',
      loop: true,
    })

    return () => {
      // anime.js v4 returns an animation handle with .pause(); guard in
      // case the API surface differs at runtime.
      try { (anim as { pause?: () => void }).pause?.() } catch { /* ignore */ }
    }
  }, [
    targetRef,
    enabled,
    reduced,
    options.rFrom,
    options.rTo,
    options.opacityFrom,
    options.opacityTo,
    options.duration,
    options.delay,
  ])
}
