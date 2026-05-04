import { useEffect, useRef } from 'react'
import { animate } from 'animejs'
import type { SceneProps } from '../types'
import { buildEcgPath } from '../utils/buildEcgPath'
import styles from './Scene.module.css'

/* ============================================================
   EcgScene — heartbeat trace draws on twice (cycle 1: normal
   beats; cycle 2: speed-up). A monitor-style vital-stats strip
   sits above the trace and adds clinical context. After the
   second cycle the trace flatlines, the vitals collapse to
   alarm values, and everything fades out cleanly.
   ============================================================ */

const SVG_NS = 'http://www.w3.org/2000/svg'
const ECG_Y = 360

/* Stylish vital-stats strip — sits ABOVE the ECG trace at y≈90–170.
   Each entry renders as label + big value + small unit, evenly
   distributed across the 800-wide viewBox. The crimson HR is the
   "lead" stat — flatlines visibly first when the trace dies. */
interface Vital {
  label: string
  value: string
  unit: string
  color: string
  x: number
  flatline: string
}
const VITALS: Vital[] = [
  { label: 'HR',    value: '142',     unit: 'bpm',   color: 'var(--crimson)', x: 130, flatline: '0'     },
  { label: 'BP',    value: '138/89',  unit: 'mmHg',  color: 'var(--ink)',     x: 320, flatline: '--/--' },
  { label: 'SpO₂',  value: '96',      unit: '%',     color: 'var(--plum)',    x: 510, flatline: '--'    },
  { label: 'RESP',  value: '18',      unit: '/min',  color: 'var(--ink)',     x: 670, flatline: '0'     },
]

export default function EcgScene({ onReadoutChange }: SceneProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    onReadoutChange('Lead II · cardiac monitor', 'HR 142')
    const svg = svgRef.current
    if (!svg) return

    const animations: ReturnType<typeof animate>[] = []
    const timers: number[] = []

    /* ----- Vital-stats strip ----- */
    const valueRefs: SVGTextElement[] = []
    VITALS.forEach((v, i) => {
      const g = document.createElementNS(SVG_NS, 'g')
      g.setAttribute('opacity', '0')

      const label = document.createElementNS(SVG_NS, 'text')
      label.setAttribute('x', String(v.x)); label.setAttribute('y', '108')
      label.setAttribute('font-family', 'Lato, sans-serif')
      label.setAttribute('font-size', '11')
      label.setAttribute('letter-spacing', '0.2em')
      label.setAttribute('fill', 'var(--ink)')
      label.setAttribute('opacity', '0.55')
      label.textContent = v.label.toUpperCase()
      g.appendChild(label)

      const value = document.createElementNS(SVG_NS, 'text')
      value.setAttribute('x', String(v.x)); value.setAttribute('y', '150')
      value.setAttribute('font-family', 'Lato, sans-serif')
      value.setAttribute('font-size', '34')
      value.setAttribute('font-weight', '900')
      value.setAttribute('fill', v.color)
      value.textContent = v.value
      g.appendChild(value)

      const unit = document.createElementNS(SVG_NS, 'text')
      unit.setAttribute('x', String(v.x)); unit.setAttribute('y', '172')
      unit.setAttribute('font-family', 'Lato, sans-serif')
      unit.setAttribute('font-size', '10')
      unit.setAttribute('letter-spacing', '0.14em')
      unit.setAttribute('fill', 'var(--ink)')
      unit.setAttribute('opacity', '0.55')
      unit.textContent = v.unit
      g.appendChild(unit)

      svg.appendChild(g)
      valueRefs.push(value)

      animations.push(
        animate(g, {
          opacity: [0, 1],
          duration: 500,
          delay: 200 + i * 120,
          ease: 'outQuad',
        }),
      )
    })

    /* ----- ECG trace ----- */
    const trace = document.createElementNS(SVG_NS, 'path')
    trace.setAttribute('d', buildEcgPath(1.5, 6, 800, ECG_Y))
    trace.setAttribute('fill', 'none')
    trace.setAttribute('stroke', 'var(--crimson)')
    trace.setAttribute('stroke-width', '2.4')
    trace.setAttribute('stroke-linecap', 'round')
    trace.setAttribute('stroke-linejoin', 'round')
    svg.appendChild(trace)

    const len = trace.getTotalLength()
    trace.style.strokeDasharray = String(len)
    trace.style.strokeDashoffset = String(len)

    /* Cycle 1: trace draws on, normal-amp 6 beats. */
    animations.push(
      animate(trace, {
        strokeDashoffset: [len, 0],
        duration: 1100,
        ease: 'outSine',
      }),
    )

    /* Cycle 2: morph to a faster, taller waveform AND wipe + redraw
       so the heartbeat "plays through" a second time. */
    const cycle2Timer = window.setTimeout(() => {
      // Snap d to the speed-up waveform; recompute its length so the
      // wipe/redraw operates on the new path.
      trace.setAttribute('d', buildEcgPath(1.8, 9, 800, ECG_Y))
      const len2 = trace.getTotalLength()
      trace.style.strokeDasharray = String(len2)
      trace.style.strokeDashoffset = String(len2)
      animations.push(
        animate(trace, {
          strokeDashoffset: [len2, 0],
          duration: 1100,
          ease: 'outSine',
        }),
      )
    }, 1100)
    timers.push(cycle2Timer)

    /* Flatline + collapse vitals to alarm values. */
    const flatlineTimer = window.setTimeout(() => {
      // Reset stroke-dasharray so the flat line renders as a solid stroke
      // rather than as the residual dash pattern of the previous waveform.
      trace.style.strokeDasharray = 'none'
      trace.style.strokeDashoffset = '0'
      animations.push(
        animate(trace, {
          d: `M 0 ${ECG_Y} L 800 ${ECG_Y}`,
          duration: 500,
          ease: 'inQuad',
        }),
      )
      onReadoutChange('Lead II · cardiac monitor', 'HR 0')

      // Vitals collapse — values flip to flatline strings, opacity dimmed.
      VITALS.forEach((v, i) => {
        valueRefs[i].textContent = v.flatline
        animations.push(
          animate(valueRefs[i], {
            opacity: [1, 0.35],
            duration: 400,
            ease: 'outQuad',
          }),
        )
      })
    }, 2400)
    timers.push(flatlineTimer)

    /* Fade trace + remove from DOM so nothing lingers into the next scene. */
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
    }, 3000)
    timers.push(dropTimer)

    return () => {
      timers.forEach(id => clearTimeout(id))
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
