import { useEffect, useRef } from 'react'
import { animate } from 'animejs'
import type { SceneProps } from '../types'
import styles from './Scene.module.css'

/* ============================================================
   RingsScene — three concentric activity rings fill in via
   stroke-dashoffset. Three stat readouts (steps / kcal / HRV)
   tick up beside them.
   ============================================================ */
export default function RingsScene({ onReadoutChange }: SceneProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    onReadoutChange('Daily activity', '04 May 2026')
    const svg = svgRef.current
    if (!svg) return

    const SVG_NS = 'http://www.w3.org/2000/svg'

    const ringDefs = [
      { r: 80, color: 'var(--crimson)', target: 502.6 - 0,  base: 502.6 },
      { r: 60, color: 'var(--plum)',    target: 376.99 - 30, base: 376.99 },
      { r: 40, color: 'var(--ink)',     target: 251.32 - 60, base: 251.32 },
    ]

    const group = document.createElementNS(SVG_NS, 'g')
    group.setAttribute('transform', 'translate(280 260)')
    svg.appendChild(group)

    const animations: ReturnType<typeof animate>[] = []

    ringDefs.forEach(def => {
      const track = document.createElementNS(SVG_NS, 'circle')
      track.setAttribute('r', String(def.r))
      track.setAttribute('fill', 'none')
      track.setAttribute('stroke', 'rgba(47,1,71,0.1)')
      track.setAttribute('stroke-width', '14')
      group.appendChild(track)

      const ring = document.createElementNS(SVG_NS, 'circle')
      ring.setAttribute('r', String(def.r))
      ring.setAttribute('fill', 'none')
      ring.setAttribute('stroke', def.color)
      ring.setAttribute('stroke-width', '14')
      ring.setAttribute('stroke-linecap', 'round')
      ring.setAttribute('stroke-dasharray', String(def.base))
      ring.setAttribute('stroke-dashoffset', String(def.base))
      ring.setAttribute('transform', 'rotate(-90)')
      group.appendChild(ring)

      animations.push(
        animate(ring, {
          strokeDashoffset: [def.base, def.target],
          duration: 1500,
          delay: 100,
          ease: 'outQuart',
        }),
      )
    })

    const stats = [
      { label: 'Steps',       target: 12847, format: (v: number) => v.toLocaleString(), color: 'var(--crimson)', y: 180 },
      { label: 'Active kcal', target: 642,   format: (v: number) => String(v),          color: 'var(--plum)',    y: 260 },
      { label: 'HRV (ms)',    target: 78,    format: (v: number) => String(v),          color: 'var(--ink)',     y: 340 },
    ]

    stats.forEach((s, i) => {
      const lbl = document.createElementNS(SVG_NS, 'text')
      lbl.setAttribute('x', '480')
      lbl.setAttribute('y', String(s.y - 14))
      lbl.setAttribute('font-family', 'Lato, sans-serif')
      lbl.setAttribute('font-size', '11')
      lbl.setAttribute('letter-spacing', '0.16em')
      lbl.setAttribute('fill', 'var(--ink)')
      lbl.setAttribute('opacity', '0.6')
      lbl.textContent = s.label.toUpperCase()
      svg.appendChild(lbl)

      const val = document.createElementNS(SVG_NS, 'text')
      val.setAttribute('x', '480')
      val.setAttribute('y', String(s.y + 18))
      val.setAttribute('font-family', 'Lato, sans-serif')
      val.setAttribute('font-size', '32')
      val.setAttribute('font-weight', '900')
      val.setAttribute('fill', s.color)
      val.textContent = '0'
      svg.appendChild(val)

      animations.push(
        animate({ v: 0 }, {
          v: s.target,
          duration: 1500,
          delay: i * 150,
          ease: 'outQuart',
          onUpdate: (anim) => {
            const v = Math.round((anim.targets[0] as { v: number }).v)
            val.textContent = s.format(v)
          },
        }),
      )
    })

    return () => {
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
