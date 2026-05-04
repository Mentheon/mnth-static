import { useEffect, useRef } from 'react'
import { animate } from 'animejs'
import type { SceneProps } from '../types'
import styles from './Scene.module.css'

/* ============================================================
   MoleculeScene — atoms drift in from random positions, snap
   into a benzene-ring layout with H + N substituents, bonds
   draw between them, and a binding-energy readout ticks down.
   ============================================================ */
export default function MoleculeScene({ onReadoutChange }: SceneProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    onReadoutChange('Docking ligand', 'ΔG -- kcal/mol')
    const svg = svgRef.current
    if (!svg) return

    const SVG_NS = 'http://www.w3.org/2000/svg'
    const cx = 400, cy = 260
    type Kind = 'C' | 'H' | 'N' | 'O'
    const targets: { x: number; y: number; kind: Kind }[] = []
    const ringR = 70
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2
      targets.push({ x: cx + Math.cos(a) * ringR, y: cy + Math.sin(a) * ringR, kind: 'C' })
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6
      targets.push({ x: cx + Math.cos(a) * (ringR + 42), y: cy + Math.sin(a) * (ringR + 42), kind: 'H' })
    }
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.4
      targets.push({ x: cx + Math.cos(a) * (ringR + 85), y: cy + Math.sin(a) * (ringR + 85), kind: 'N' })
    }

    const bonds = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0],
                   [0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11]]
    const colors: Record<Kind, string> = { C: 'var(--ink)', H: 'var(--plum)', N: 'var(--crimson)', O: 'var(--crimson)' }
    const radii: Record<Kind, number> = { C: 8, H: 4.5, N: 7, O: 7 }

    const atoms = targets.map(t => {
      const startX = Math.random() * 800
      const startY = Math.random() * 520
      const c = document.createElementNS(SVG_NS, 'circle')
      c.setAttribute('cx', String(startX))
      c.setAttribute('cy', String(startY))
      c.setAttribute('r', String(radii[t.kind]))
      c.setAttribute('fill', colors[t.kind])
      c.setAttribute('stroke', 'var(--bg)')
      c.setAttribute('stroke-width', '1.5')
      c.setAttribute('opacity', '0')
      svg.appendChild(c)
      return { el: c, target: t }
    })

    const animations = atoms.map((a, i) =>
      animate(a.el, {
        cx: a.target.x,
        cy: a.target.y,
        opacity: [0, 1],
        duration: 800,
        delay: i * 40,
        ease: 'inOutCubic',
      }),
    )

    const bondTimer = window.setTimeout(() => {
      bonds.forEach((pair, i) => {
        const a = atoms[pair[0]].target
        const b = atoms[pair[1]].target
        const line = document.createElementNS(SVG_NS, 'line')
        line.setAttribute('x1', String(a.x))
        line.setAttribute('y1', String(a.y))
        line.setAttribute('x2', String(a.x))
        line.setAttribute('y2', String(a.y))
        line.setAttribute('stroke', 'var(--ink)')
        line.setAttribute('stroke-width', '1.5')
        line.setAttribute('opacity', '0.7')
        svg.insertBefore(line, svg.firstChild)
        animations.push(
          animate(line, {
            x2: b.x,
            y2: b.y,
            duration: 300,
            delay: i * 30,
            ease: 'outQuad',
          }),
        )
      })
    }, 900)

    animations.push(
      animate({ v: 0 }, {
        v: -42.7,
        duration: 900,
        delay: 700,
        ease: 'outQuad',
        onUpdate: (anim) => {
          const v = (anim.targets[0] as { v: number }).v
          onReadoutChange('Docking ligand', `ΔG ${v.toFixed(1)} kcal/mol`)
        },
      }),
    )

    return () => {
      clearTimeout(bondTimer)
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
