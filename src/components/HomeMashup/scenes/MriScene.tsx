import { useEffect, useRef } from 'react'
import { animate } from 'animejs'
import type { SceneProps } from '../types'
import styles from './Scene.module.css'

/* ============================================================
   MriScene — pixel-grid MRI slice with a left-to-right sweep
   line revealing each column. Slice counter ticks 0 → 240.
   ============================================================ */
export default function MriScene({ onReadoutChange }: SceneProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    onReadoutChange('MRI · T1', 'Slice 000 / 240')
    const svg = svgRef.current
    if (!svg) return

    const SVG_NS = 'http://www.w3.org/2000/svg'
    const COLS = 28, ROWS = 14
    const W = 800
    const cw = W / COLS
    const ch = (440 - 80) / ROWS
    const cells: SVGRectElement[] = []

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = c * cw
        const y = 80 + r * ch
        const dx = (c - COLS / 2) / (COLS / 2)
        const dy = (r - ROWS / 2) / (ROWS / 2)
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > 1.05) continue
        const intensity = Math.max(0, 1 - dist) * (0.4 + Math.random() * 0.6)
        const rect = document.createElementNS(SVG_NS, 'rect')
        rect.setAttribute('x', String(x))
        rect.setAttribute('y', String(y))
        rect.setAttribute('width', String(cw + 0.5))
        rect.setAttribute('height', String(ch + 0.5))
        const purple = [47, 1, 71]
        const cream = [255, 236, 225]
        const rr = Math.round(cream[0] * (1 - intensity) + purple[0] * intensity)
        const gg = Math.round(cream[1] * (1 - intensity) + purple[1] * intensity)
        const bb = Math.round(cream[2] * (1 - intensity) + purple[2] * intensity)
        rect.setAttribute('fill', `rgb(${rr},${gg},${bb})`)
        rect.setAttribute('opacity', '0')
        svg.appendChild(rect)
        cells.push(rect)
      }
    }

    const sweep = document.createElementNS(SVG_NS, 'line')
    sweep.setAttribute('y1', '60')
    sweep.setAttribute('y2', '460')
    sweep.setAttribute('stroke', 'var(--crimson)')
    sweep.setAttribute('stroke-width', '2')
    sweep.setAttribute('opacity', '0.8')
    sweep.setAttribute('x1', '0')
    sweep.setAttribute('x2', '0')
    svg.appendChild(sweep)

    const animations = [
      animate(sweep, {
        x1: [0, 800],
        x2: [0, 800],
        duration: 1500,
        ease: 'inOutQuad',
      }),
      animate(sweep, {
        opacity: [0.8, 0],
        duration: 300,
        delay: 1500,
        ease: 'outQuad',
      }),
    ]

    cells.forEach(rect => {
      const x = parseFloat(rect.getAttribute('x') || '0')
      const delay = (x / 800) * 1400
      animations.push(
        animate(rect, {
          opacity: [0, 1],
          duration: 200,
          delay: delay + Math.random() * 80,
          ease: 'outQuad',
        }),
      )
    })

    animations.push(
      animate({ v: 0 }, {
        v: 240,
        duration: 1500,
        ease: 'inOutQuad',
        onUpdate: (anim) => {
          const v = Math.round((anim.targets[0] as { v: number }).v)
          onReadoutChange('MRI · T1', `Slice ${String(v).padStart(3, '0')} / 240`)
        },
      }),
    )

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
