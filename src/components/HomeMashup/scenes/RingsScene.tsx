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

    /* Each ring's fill represents its stat's progress against a
       sensible daily goal:
         · Steps        12,847 / 10,000 = 128% → fully filled
         · Active kcal     642 /    500 = 128% → fully filled
         · HRV (ms)         78 / typical-100  ≈ 78% → ~3/4 filled
       Previously the targets were placeholder offsets (`base - 0`,
       `base - 30`, `base - 60`) that bore no relation to the
       displayed numbers; in particular Steps animated `base → base`
       and so the outer ring never filled at all. */
    const ringDefs = [
      { r: 80, color: 'var(--crimson)', base: 502.65, fillPct: 1.00 },
      { r: 60, color: 'var(--plum)',    base: 376.99, fillPct: 0.95 },
      { r: 40, color: 'var(--ink)',     base: 251.33, fillPct: 0.78 },
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
          strokeDashoffset: [def.base, def.base * (1 - def.fillPct)],
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
      // Wipe any element we appended directly to the SVG. React
      // StrictMode (dev) re-invokes the effect after first cleanup;
      // without this the second run stacks fresh text/ring nodes on
      // top of the first run's leftovers — visible as a "0" overlaid
      // on the already-final "12,847".
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
