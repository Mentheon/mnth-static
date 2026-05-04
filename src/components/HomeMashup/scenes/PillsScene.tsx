import { useEffect, useRef } from 'react'
import { animate } from 'animejs'
import type { SceneProps } from '../types'
import styles from './Scene.module.css'

/* ============================================================
   PillsScene — capsules cascade down through the canvas with
   varied rotation. Dispensed counter ticks 0 → 12.
   ============================================================ */
export default function PillsScene({ onReadoutChange }: SceneProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    onReadoutChange('Rx', 'Dispensed 0')
    const svg = svgRef.current
    if (!svg) return

    const SVG_NS = 'http://www.w3.org/2000/svg'
    const N = 12
    const colors: [string, string][] = [
      ['var(--ink)', 'var(--crimson)'],
      ['var(--crimson)', 'var(--bg)'],
      ['var(--plum)', 'var(--ink)'],
      ['var(--ink)', 'var(--plum)'],
    ]
    type Pill = { el: SVGGElement; x: number; y: number; rot: number; endY: number; endRot: number }
    const pills: Pill[] = []

    for (let i = 0; i < N; i++) {
      const x = 80 + Math.random() * 640
      const startY = -60 - Math.random() * 200
      const endY = 460 + Math.random() * 40
      const rot0 = Math.random() * 360
      const rot1 = rot0 + (Math.random() * 720 - 360)
      const c = colors[i % colors.length]

      const g = document.createElementNS(SVG_NS, 'g')
      g.setAttribute('transform', `translate(${x} ${startY}) rotate(${rot0})`)
      const w = 50, h = 20
      const r1 = document.createElementNS(SVG_NS, 'rect')
      r1.setAttribute('x', String(-w / 2))
      r1.setAttribute('y', String(-h / 2))
      r1.setAttribute('width', String(w / 2))
      r1.setAttribute('height', String(h))
      r1.setAttribute('rx', String(h / 2))
      r1.setAttribute('fill', c[0])
      const r2 = document.createElementNS(SVG_NS, 'rect')
      r2.setAttribute('x', '0')
      r2.setAttribute('y', String(-h / 2))
      r2.setAttribute('width', String(w / 2))
      r2.setAttribute('height', String(h))
      r2.setAttribute('rx', String(h / 2))
      r2.setAttribute('fill', c[1])
      g.appendChild(r1)
      g.appendChild(r2)
      svg.appendChild(g)

      pills.push({ el: g, x, y: startY, rot: rot0, endY, endRot: rot1 })
    }

    const animations: ReturnType<typeof animate>[] = []
    pills.forEach((p, i) => {
      animations.push(
        animate(p, {
          y: p.endY,
          rot: p.endRot,
          duration: 900 + Math.random() * 300,
          delay: i * 60,
          ease: 'inQuad',
          onUpdate: () => {
            p.el.setAttribute('transform', `translate(${p.x} ${p.y}) rotate(${p.rot})`)
          },
        }),
      )
    })

    animations.push(
      animate({ v: 0 }, {
        v: N,
        duration: 1500,
        ease: 'linear',
        onUpdate: (anim) => {
          const v = Math.round((anim.targets[0] as { v: number }).v)
          onReadoutChange('Rx', `Dispensed ${v}`)
        },
      }),
    )

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
