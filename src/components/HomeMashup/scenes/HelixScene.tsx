import { useEffect, useRef } from 'react'
import { animate, stagger } from 'animejs'
import type { SceneProps } from '../types'
import styles from './Scene.module.css'

/* ============================================================
   HelixScene — DNA strand assembles, base-pair counter ticks up
   to 3,200 bp, then the rungs unzip and dissolve outward.
   ============================================================ */
export default function HelixScene({ onReadoutChange }: SceneProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    onReadoutChange('Sequencing', '0 / 3,200 bp')
    const svg = svgRef.current
    if (!svg) return

    const SVG_NS = 'http://www.w3.org/2000/svg'
    const N = 50
    const cx = 400, midY = 260, span = 720, ampX = 80
    type Rung = { rung: SVGLineElement; c1: SVGCircleElement; c2: SVGCircleElement; y1: number; y2: number }
    const rungs: Rung[] = []

    for (let i = 0; i < N; i++) {
      const t = i / (N - 1)
      const x = (cx - span / 2) + t * span
      const phase = t * Math.PI * 6
      const y1 = midY + Math.sin(phase) * ampX * 0.55
      const y2 = midY - Math.sin(phase) * ampX * 0.55

      const rung = document.createElementNS(SVG_NS, 'line')
      rung.setAttribute('x1', String(x))
      rung.setAttribute('y1', String(y1))
      rung.setAttribute('x2', String(x))
      rung.setAttribute('y2', String(y2))
      rung.setAttribute('stroke', i % 2 ? 'var(--crimson)' : 'var(--ink)')
      rung.setAttribute('stroke-width', '2')
      rung.setAttribute('opacity', '0')
      svg.appendChild(rung)

      const c1 = document.createElementNS(SVG_NS, 'circle')
      c1.setAttribute('cx', String(x))
      c1.setAttribute('cy', String(y1))
      c1.setAttribute('r', '3.5')
      c1.setAttribute('fill', 'var(--ink)')
      c1.setAttribute('opacity', '0')
      svg.appendChild(c1)

      const c2 = document.createElementNS(SVG_NS, 'circle')
      c2.setAttribute('cx', String(x))
      c2.setAttribute('cy', String(y2))
      c2.setAttribute('r', '3.5')
      c2.setAttribute('fill', 'var(--crimson)')
      c2.setAttribute('opacity', '0')
      svg.appendChild(c2)

      rungs.push({ rung, c1, c2, y1, y2 })
    }

    const animations = [
      animate(rungs.flatMap(r => [r.rung, r.c1, r.c2]), {
        opacity: [0, 0.7],
        duration: 400,
        delay: stagger(8),
        ease: 'outQuad',
      }),
      animate({ v: 0 }, {
        v: 3200,
        duration: 1100,
        delay: 200,
        ease: 'outQuad',
        onUpdate: (anim) => {
          const v = Math.round((anim.targets[0] as { v: number }).v)
          onReadoutChange('Sequencing', `${v.toLocaleString()} / 3,200 bp`)
        },
      }),
    ]

    rungs.forEach((r, i) => {
      animations.push(
        animate(r.rung, { opacity: [0.7, 0], duration: 300, delay: 1500 + i * 12, ease: 'inQuad' }),
        animate(r.c1, { cy: r.y1 - 60, opacity: [1, 0], duration: 600, delay: 1500 + i * 12, ease: 'inQuad' }),
        animate(r.c2, { cy: r.y2 + 60, opacity: [1, 0], duration: 600, delay: 1500 + i * 12, ease: 'inQuad' }),
      )
    })

    return () => {
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
