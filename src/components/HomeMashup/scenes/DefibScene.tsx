import { useEffect, useRef } from 'react'
import { animate } from 'animejs'
import type { SceneProps } from '../types'
import styles from './Scene.module.css'

/* ============================================================
   DefibScene — charge bar fills, "CLEAR" flashes, three concentric
   shockwaves radiate outward. Joule readout ticks 0 → 200J.
   ============================================================ */
export default function DefibScene({ onReadoutChange }: SceneProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    onReadoutChange('Defibrillator', 'Charging 0J')
    const svg = svgRef.current
    if (!svg) return

    const SVG_NS = 'http://www.w3.org/2000/svg'
    const trackW = 280
    const barX = (800 - trackW) / 2
    const barY = 240

    const track = document.createElementNS(SVG_NS, 'rect')
    track.setAttribute('x', String(barX))
    track.setAttribute('y', String(barY))
    track.setAttribute('width', String(trackW))
    track.setAttribute('height', '6')
    track.setAttribute('rx', '3')
    track.setAttribute('fill', 'rgba(47,1,71,0.12)')
    svg.appendChild(track)

    const fill = document.createElementNS(SVG_NS, 'rect')
    fill.setAttribute('x', String(barX))
    fill.setAttribute('y', String(barY))
    fill.setAttribute('width', '0')
    fill.setAttribute('height', '6')
    fill.setAttribute('rx', '3')
    fill.setAttribute('fill', 'var(--crimson)')
    svg.appendChild(fill)

    const clearLbl = document.createElementNS(SVG_NS, 'text')
    clearLbl.setAttribute('x', '400')
    clearLbl.setAttribute('y', '290')
    clearLbl.setAttribute('text-anchor', 'middle')
    clearLbl.setAttribute('font-family', 'Lato, sans-serif')
    clearLbl.setAttribute('font-size', '64')
    clearLbl.setAttribute('font-weight', '900')
    clearLbl.setAttribute('letter-spacing', '4')
    clearLbl.setAttribute('fill', 'var(--crimson)')
    clearLbl.setAttribute('opacity', '0')
    clearLbl.textContent = 'CLEAR'
    svg.appendChild(clearLbl)

    const animations: ReturnType<typeof animate>[] = [
      animate(fill, {
        width: [0, trackW],
        duration: 1100,
        ease: 'inQuad',
      }),
      animate({ v: 0 }, {
        v: 200,
        duration: 1100,
        ease: 'inQuad',
        onUpdate: (anim) => {
          const v = Math.round((anim.targets[0] as { v: number }).v)
          onReadoutChange('Defibrillator', `Charging ${v}J`)
        },
      }),
    ]

    const shockTimer = window.setTimeout(() => {
      animations.push(
        animate(clearLbl, {
          opacity: [0, 1, 1, 0],
          duration: 700,
          ease: 'outQuad',
        }),
      )

      const waves = [
        { color: 'var(--crimson)', maxR: 600, delay: 0,   opacity: 0.9 },
        { color: 'var(--crimson)', maxR: 500, delay: 100, opacity: 0.7 },
        { color: 'var(--ink)',     maxR: 700, delay: 50,  opacity: 0.5 },
      ]
      waves.forEach(w => {
        const c = document.createElementNS(SVG_NS, 'circle')
        c.setAttribute('cx', '400')
        c.setAttribute('cy', '260')
        c.setAttribute('r', '0')
        c.setAttribute('fill', 'none')
        c.setAttribute('stroke', w.color)
        c.setAttribute('stroke-width', '2')
        c.setAttribute('opacity', String(w.opacity))
        svg.appendChild(c)
        animations.push(
          animate(c, {
            r: [0, w.maxR],
            opacity: [w.opacity, 0],
            duration: 800,
            delay: w.delay,
            ease: 'outQuad',
          }),
        )
      })
    }, 1100)

    return () => {
      clearTimeout(shockTimer)
      animations.forEach(a => a.pause())
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
