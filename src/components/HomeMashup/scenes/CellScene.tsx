import { useEffect, useRef } from 'react'
import { animate } from 'animejs'
import type { SceneProps } from '../types'
import styles from './Scene.module.css'

/* ============================================================
   CellScene — single cell exponentially divides for ~5 generations,
   readout ticks elapsed hours and population count.
   ============================================================ */
export default function CellScene({ onReadoutChange }: SceneProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    onReadoutChange('Cell culture · t = 0h', 'Pop. 1')
    const svg = svgRef.current
    if (!svg) return

    const SVG_NS = 'http://www.w3.org/2000/svg'
    type Cell = { el: SVGGElement; x: number; y: number; r: number }
    const makeCell = (x: number, y: number, r: number): Cell => {
      const g = document.createElementNS(SVG_NS, 'g')
      g.setAttribute('transform', `translate(${x} ${y})`)
      const outer = document.createElementNS(SVG_NS, 'circle')
      outer.setAttribute('r', String(r))
      outer.setAttribute('fill', 'rgba(163,11,55,0.18)')
      outer.setAttribute('stroke', 'var(--crimson)')
      outer.setAttribute('stroke-width', '1.5')
      const nuc = document.createElementNS(SVG_NS, 'circle')
      nuc.setAttribute('r', String(r * 0.45))
      nuc.setAttribute('fill', 'var(--ink)')
      g.appendChild(outer)
      g.appendChild(nuc)
      return { el: g, x, y, r }
    }

    let cells: Cell[] = []
    const initial = makeCell(400, 260, 30)
    svg.appendChild(initial.el)
    cells.push(initial)

    const generations = 7
    let elapsed = 0
    let step = 0
    const animations: ReturnType<typeof animate>[] = []
    const timers: number[] = []
    let alive = true

    const divideAll = () => {
      elapsed += 4
      const newCells: Cell[] = []

      cells.forEach(cell => {
        const { x, y, r } = cell
        const newR = Math.max(7, r * 0.78)
        const ang = Math.random() * Math.PI * 2
        const sep = r * 1.1
        const c1x = Math.max(60, Math.min(740, x + Math.cos(ang) * sep + (Math.random() * 30 - 15)))
        const c1y = Math.max(80, Math.min(440, y + Math.sin(ang) * sep + (Math.random() * 30 - 15)))
        const c2x = Math.max(60, Math.min(740, x - Math.cos(ang) * sep + (Math.random() * 30 - 15)))
        const c2y = Math.max(80, Math.min(440, y - Math.sin(ang) * sep + (Math.random() * 30 - 15)))

        const child1 = makeCell(x, y, newR)
        const child2 = makeCell(x, y, newR)
        svg.appendChild(child1.el)
        svg.appendChild(child2.el)
        cell.el.remove()

        animations.push(
          animate({ x, y }, {
            x: c1x,
            y: c1y,
            duration: 500,
            ease: 'outCubic',
            onUpdate: (anim) => {
              const obj = anim.targets[0] as { x: number; y: number }
              child1.el.setAttribute('transform', `translate(${obj.x} ${obj.y})`)
              child1.x = obj.x; child1.y = obj.y
            },
          }),
          animate({ x, y }, {
            x: c2x,
            y: c2y,
            duration: 500,
            ease: 'outCubic',
            onUpdate: (anim) => {
              const obj = anim.targets[0] as { x: number; y: number }
              child2.el.setAttribute('transform', `translate(${obj.x} ${obj.y})`)
              child2.x = obj.x; child2.y = obj.y
            },
          }),
        )

        newCells.push(child1, child2)
      })

      cells = newCells
      onReadoutChange(`Cell culture · t = ${elapsed}h`, `Pop. ${cells.length.toLocaleString()}`)
    }

    const tickDivision = () => {
      if (step < generations && alive) {
        divideAll()
        step++
        const id = window.setTimeout(tickDivision, 380)
        timers.push(id)
      }
    }
    timers.push(window.setTimeout(tickDivision, 200))

    return () => {
      alive = false
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
