import { useRef } from 'react'
import type { Phase } from './types'
import usePulse from './usePulse'
import styles from './ProgressPhaseNode.module.css'

export interface ProgressPhaseNodeProps {
  phase: Phase
  x: number
  y: number
}

// One phase node along the spine. Past, current, and projected each
// render slightly different SVG geometry. The current-phase pulse loop
// is owned here via usePulse — when the entrance timeline reaches its
// final beat, this circle starts pulsing. We don't try to "delay" the
// start with a setTimeout: we just hand a 1200ms delay to anime.js, so
// it lines up with the entrance no matter when the user expands.
export default function ProgressPhaseNode({ phase, x, y }: ProgressPhaseNodeProps) {
  const pulseRef = useRef<SVGCircleElement | null>(null)

  // The pulse loop is enabled only for the current phase. When phase
  // status changes (won't, in practice, but the contract allows it)
  // the hook's `enabled` flag flips and the loop pauses.
  usePulse(
    pulseRef,
    {
      rFrom: 18,
      rTo: 28,
      opacityFrom: 0.18,
      opacityTo: 0,
      duration: 1700,
      delay: 1200,
    },
    phase.status === 'current',
  )

  if (phase.status === 'current') {
    return (
      <g
        className={`${styles.node} ${styles.current} phase phase--current`}
        transform={`translate(${x}, ${y})`}
      >
        <circle ref={pulseRef} r={18} fill="#A30B37" opacity={0.18} />
        <circle r={14} fill="#A30B37" />
        <text
          y={-32}
          textAnchor="middle"
          fontFamily="Lato, sans-serif"
          fontSize={16}
          fontWeight={900}
          fill="#A30B37"
        >
          {phase.label}
        </text>
        {phase.date && (
          <text
            y={46}
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize={11}
            fill="#A30B37"
            fontWeight={700}
            letterSpacing={0.5}
          >
            {phase.date}
          </text>
        )}
      </g>
    )
  }

  if (phase.status === 'projected') {
    return (
      <g
        className={`${styles.node} ${styles.projected} phase phase--projected`}
        transform={`translate(${x}, ${y})`}
        opacity={0}
      >
        <circle r={13} fill="#FFECE1" stroke="#2F0147" strokeWidth={2.5} strokeDasharray="4 4" />
        <text
          y={-30}
          textAnchor="middle"
          fontFamily="Lato, sans-serif"
          fontSize={15}
          fontWeight={700}
          fill="#2F0147"
          opacity={0.7}
        >
          {phase.label}
        </text>
        {phase.date && (
          <text
            y={44}
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize={11}
            fill="#2F0147"
            opacity={0.4}
            letterSpacing={0.5}
          >
            {phase.date}
          </text>
        )}
      </g>
    )
  }

  // past
  return (
    <g
      className={`${styles.node} ${styles.past} phase phase--past`}
      transform={`translate(${x}, ${y})`}
    >
      <circle r={13} fill="#2F0147" />
      <text
        y={-30}
        textAnchor="middle"
        fontFamily="Lato, sans-serif"
        fontSize={15}
        fontWeight={700}
        fill="#2F0147"
      >
        {phase.label}
      </text>
      {phase.date && (
        <text
          y={44}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize={11}
          fill="#2F0147"
          opacity={0.55}
          letterSpacing={0.5}
        >
          {phase.date}
        </text>
      )}
    </g>
  )
}
