import { useEffect, useRef } from 'react'
import { animate } from 'animejs'
import type { SceneProps } from '../types'
import styles from './Scene.module.css'

/* ============================================================
   EhrScene — terminal-style log types out one line at a time
   with the final "velocity exceeds baseline" highlighted crimson.
   ============================================================ */
export default function EhrScene({ onReadoutChange }: SceneProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    onReadoutChange('Clinical workspace', '09:14 · session 9F-7741')
    const svg = svgRef.current
    if (!svg) return

    const SVG_NS = 'http://www.w3.org/2000/svg'
    const lines: { text: string; flag?: boolean }[] = [
      { text: '> SELECT * FROM trends WHERE year = 2026' },
      { text: '  ◉ AI diagnostics approved      +1247' },
      { text: '  ◉ Wearables in trials          ×3.2' },
      { text: '  ◉ Whole-genome cost            $200' },
      { text: '  ◉ Telehealth visits / yr       84M' },
      { text: '> velocity exceeds baseline', flag: true },
    ]

    const startY = 100
    const lineH = 26

    const animations: ReturnType<typeof animate>[] = []
    lines.forEach((entry, idx) => {
      const text = document.createElementNS(SVG_NS, 'text')
      text.setAttribute('x', '80')
      text.setAttribute('y', String(startY + idx * lineH))
      text.setAttribute('font-family', 'Courier New, monospace')
      text.setAttribute('font-size', '14')
      text.setAttribute('fill', entry.flag ? 'var(--crimson)' : 'var(--ink)')
      if (entry.flag) text.setAttribute('font-weight', '700')
      svg.appendChild(text)

      animations.push(
        animate({ i: 0 }, {
          i: entry.text.length,
          duration: entry.text.length * 18,
          delay: idx * 280,
          ease: 'linear',
          onUpdate: (anim) => {
            const i = Math.round((anim.targets[0] as { i: number }).i)
            text.textContent = entry.text.slice(0, i)
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
