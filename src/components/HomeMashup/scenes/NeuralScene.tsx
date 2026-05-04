import { useEffect, useRef } from 'react'
import { animate, stagger } from 'animejs'
import type { SceneProps } from '../types'
import styles from './Scene.module.css'

/* ============================================================
   NeuralScene — five-layer feed-forward network with all-pairs
   edges. Layers light up in waves L→R; pulses recolour edges
   crimson; epoch counter ticks 0 → 4096.
   ============================================================ */
export default function NeuralScene({ onReadoutChange }: SceneProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    onReadoutChange('Forward pass', 'epoch 0000')
    const svg = svgRef.current
    if (!svg) return

    const SVG_NS = 'http://www.w3.org/2000/svg'
    const layers = [5, 8, 8, 6, 3]
    const startX = 130, endX = 670
    const layerSpacing = (endX - startX) / (layers.length - 1)
    const nodes: { el: SVGCircleElement; x: number; y: number }[][] = []

    layers.forEach((count, li) => {
      const x = startX + li * layerSpacing
      const totalH = 320
      const gap = totalH / (count + 1)
      const layerNodes: { el: SVGCircleElement; x: number; y: number }[] = []
      for (let i = 0; i < count; i++) {
        const y = 100 + gap * (i + 1)
        const c = document.createElementNS(SVG_NS, 'circle')
        c.setAttribute('cx', String(x))
        c.setAttribute('cy', String(y))
        c.setAttribute('r', '6')
        c.setAttribute('fill', 'var(--bg)')
        c.setAttribute('stroke', 'var(--ink)')
        c.setAttribute('stroke-width', '1.5')
        c.setAttribute('opacity', '0')
        svg.appendChild(c)
        layerNodes.push({ el: c, x, y })
      }
      nodes.push(layerNodes)
    })

    const edges: { line: SVGLineElement; layer: number }[] = []
    for (let li = 0; li < layers.length - 1; li++) {
      nodes[li].forEach(a => {
        nodes[li + 1].forEach(b => {
          const line = document.createElementNS(SVG_NS, 'line')
          line.setAttribute('x1', String(a.x))
          line.setAttribute('y1', String(a.y))
          line.setAttribute('x2', String(b.x))
          line.setAttribute('y2', String(b.y))
          line.setAttribute('stroke', 'var(--ink)')
          line.setAttribute('stroke-width', '0.5')
          line.setAttribute('opacity', '0')
          svg.insertBefore(line, svg.firstChild)
          edges.push({ line, layer: li })
        })
      })
    }

    const animations = [
      animate(edges.map(e => e.line), {
        opacity: [0, 0.18],
        duration: 400,
        delay: stagger(2),
        ease: 'outQuad',
      }),
    ]
    nodes.forEach((layer, li) => {
      animations.push(
        animate(layer.map(n => n.el), {
          opacity: [0, 1],
          duration: 300,
          delay: 200 + li * 100,
          ease: 'outQuad',
        }),
      )
    })

    const timers: number[] = []
    const firePulse = () => {
      layers.forEach((_, li) => {
        if (li === 0) return
        const t = window.setTimeout(() => {
          const subset = edges.filter(e => e.layer === li - 1)
          const sample = [...subset].sort(() => Math.random() - 0.5).slice(0, Math.floor(subset.length * 0.4))
          sample.forEach(e => {
            animations.push(
              animate(e.line, {
                opacity: [0.18, 0.85, 0.18],
                stroke: ['var(--ink)', 'var(--crimson)', 'var(--ink)'],
                strokeWidth: [0.5, 1.6, 0.5],
                duration: 300,
                ease: 'inOutQuad',
              }),
            )
          })
          nodes[li].forEach(n => {
            animations.push(
              animate(n.el, {
                fill: ['var(--bg)', 'var(--crimson)', 'var(--bg)'],
                r: [6, 9, 6],
                duration: 300,
                ease: 'inOutQuad',
              }),
            )
          })
        }, li * 90)
        timers.push(t)
      })
    }
    timers.push(window.setTimeout(firePulse, 800))
    timers.push(window.setTimeout(firePulse, 1500))

    animations.push(
      animate({ v: 0 }, {
        v: 4096,
        duration: 2200,
        ease: 'inQuad',
        onUpdate: (anim) => {
          const v = Math.round((anim.targets[0] as { v: number }).v)
          onReadoutChange('Forward pass', `epoch ${String(v).padStart(4, '0')}`)
        },
      }),
    )

    return () => {
      timers.forEach(id => clearTimeout(id))
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
