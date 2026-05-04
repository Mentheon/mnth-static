import { useEffect, useRef } from 'react'
import { animate } from 'animejs'
import type { SceneProps } from '../types'
import { buildEcgPath } from '../utils/buildEcgPath'
import styles from './Scene.module.css'

/* ============================================================
   EcgScene — heartbeat trace draws on, speeds up, then flatlines
   and drops off the bottom of the canvas. Final scene before the
   carousel loops back to scene 0 (helix).
   ============================================================ */
export default function EcgScene({ onReadoutChange }: SceneProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    onReadoutChange('Lead II · cardiac monitor', 'HR 142')
    const svg = svgRef.current
    if (!svg) return

    const SVG_NS = 'http://www.w3.org/2000/svg'
    const ecgY = 360
    const trace = document.createElementNS(SVG_NS, 'path')
    trace.setAttribute('d', buildEcgPath(1.5, 6, 800, ecgY))
    trace.setAttribute('fill', 'none')
    trace.setAttribute('stroke', 'var(--crimson)')
    trace.setAttribute('stroke-width', '2.4')
    trace.setAttribute('stroke-linecap', 'round')
    trace.setAttribute('stroke-linejoin', 'round')
    svg.appendChild(trace)

    const len = trace.getTotalLength()
    trace.style.strokeDasharray = String(len)
    trace.style.strokeDashoffset = String(len)

    const animations: ReturnType<typeof animate>[] = [
      animate(trace, {
        strokeDashoffset: [len, 0],
        duration: 1100,
        ease: 'outSine',
      }),
    ]

    const speedUpTimer = window.setTimeout(() => {
      // anime v4: tween `d` between two strings via inline interpolation.
      // The path morph easing matches the original's intent.
      animations.push(
        animate(trace, {
          d: buildEcgPath(1.8, 9, 800, ecgY),
          duration: 700,
          ease: 'inOutQuad',
        }),
      )
    }, 1100)

    const flatlineTimer = window.setTimeout(() => {
      animations.push(
        animate(trace, {
          d: `M 0 ${ecgY} L 800 ${ecgY}`,
          duration: 500,
          ease: 'inQuad',
        }),
      )
      onReadoutChange('Lead II · cardiac monitor', 'HR 0')
    }, 2100)

    /* Drop-off — translateY on an SVG path doesn't reliably take in
       anime v4 (the CSS transform doesn't always apply to <path>
       elements), which left the flatlined trace stuck as a horizontal
       red bar at y=360 for the rest of the scene. Fade-only + a hard
       DOM removal once the fade settles guarantees the trace is gone. */
    const dropTimer = window.setTimeout(() => {
      animations.push(
        animate(trace, {
          opacity: [1, 0],
          duration: 700,
          ease: 'inCubic',
          onComplete: () => {
            if (trace.parentNode) trace.parentNode.removeChild(trace)
          },
        }),
      )
    }, 2600)

    return () => {
      clearTimeout(speedUpTimer)
      clearTimeout(flatlineTimer)
      clearTimeout(dropTimer)
      animations.forEach(a => a.pause())
      while (svg.firstChild) svg.removeChild(svg.firstChild)
    }
  }, [onReadoutChange])

  return (
    <svg
      ref={svgRef}
      className={styles.canvas}
      viewBox="0 0 800 520"
      preserveAspectRatio="xMidYMid meet"
    />
  )
}
