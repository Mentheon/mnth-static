import { useRef } from 'react'
import type { StrandProgress } from './types'
import usePulse from './usePulse'
import { phasePositions, branchX, returnTargetX } from './geometry'
import styles from './ProgressBeacon.module.css'

export interface ProgressBeaconProps {
  progress: StrandProgress
  expanded: boolean
  onToggle: () => void
  ariaControls: string
}

const BEACON_VBW = 600
const BEACON_VBH = 56
const SPINE_Y    = 28
const MARGIN     = 20

// Inline glance — tiny fixed-height SVG that summarises the strand's
// progression. Acts as a disclosure trigger: clicking or pressing
// Enter/Space toggles the expanded timeline below.
export default function ProgressBeacon({
  progress,
  expanded,
  onToggle,
  ariaControls,
}: ProgressBeaconProps) {
  const pulseRef = useRef<SVGCircleElement | null>(null)
  // The tiny beacon pulse sits behind the current-phase dot.
  usePulse(
    pulseRef,
    { rFrom: 9, rTo: 16, opacityFrom: 0.18, opacityTo: 0, duration: 1600 },
    true,
  )

  // Geometry — derived once per render from the data.
  const positions = phasePositions(progress.phases, BEACON_VBW - 60, MARGIN)
  // Splice in a phantom margin so the spine stops short of the right
  // edge — the dashed "future" segment fills the gap.
  const lastPastIdx = progress.phases.findIndex(p => p.status === 'projected')
  const splitIdx = lastPastIdx === -1 ? progress.phases.length - 1 : lastPastIdx - 1
  const activeEnd = positions.get(progress.phases[splitIdx]?.id ?? progress.phases[0].id) ?? 0
  const futureEnd = BEACON_VBW - MARGIN

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onToggle()
    }
  }

  // Build active spine d as a horizontal polyline through past + current.
  const activePath = (() => {
    const xs: number[] = []
    progress.phases.forEach(p => {
      if (p.status === 'past' || p.status === 'current') {
        const x = positions.get(p.id)
        if (x !== undefined) xs.push(x)
      }
    })
    if (xs.length === 0) return ''
    return xs.map((x, i) => (i === 0 ? `M${x},${SPINE_Y}` : `L${x},${SPINE_Y}`)).join(' ')
  })()

  return (
    <button
      type="button"
      className={`${styles.beacon} ${expanded ? styles.expanded : ''}`}
      aria-expanded={expanded}
      aria-controls={ariaControls}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
    >
      <span className={styles.label}>
        <span>progression</span>
        <span className={styles.expand}>
          {expanded ? 'collapse' : 'expand'}
          <span className={styles.expandIcon} aria-hidden="true">▾</span>
        </span>
      </span>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${BEACON_VBW} ${BEACON_VBH}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <marker id="beaconArrow" viewBox="0 0 10 10" refX={9} refY={5} markerWidth={5} markerHeight={5} orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill="#2F0147" />
          </marker>
        </defs>
        <path d={activePath} stroke="#2F0147" strokeWidth={2} fill="none" strokeLinecap="round" />
        <path d={`M${activeEnd},${SPINE_Y} L${futureEnd},${SPINE_Y}`} stroke="#2F0147" strokeWidth={1.5} fill="none" strokeDasharray="4 5" strokeLinecap="round" markerEnd="url(#beaconArrow)" opacity={0.7} />
        {progress.phases.map(p => {
          const x = positions.get(p.id) ?? 0
          if (p.status === 'projected') {
            return <circle key={p.id} cx={x} cy={SPINE_Y} r={5} fill="none" stroke="#2F0147" strokeWidth={1.5} strokeDasharray="2 2" />
          }
          if (p.status === 'current') {
            return (
              <g key={p.id}>
                <circle ref={pulseRef} cx={x} cy={SPINE_Y} r={9} fill="#A30B37" opacity={0.18} />
                <circle cx={x} cy={SPINE_Y} r={7} fill="#A30B37" />
              </g>
            )
          }
          return <circle key={p.id} cx={x} cy={SPINE_Y} r={5} fill="#2F0147" />
        })}
        {progress.outputs.map(o => {
          const bx = branchX(o, positions, progress.phases)
          const ret = returnTargetX(o, positions, progress.phases)
          const stroke = o.type === 'paper' ? '#9C528B' : o.type === 'artefact' ? '#A30B37' : '#2F0147'
          return (
            <g key={o.id}>
              <line x1={bx} y1={SPINE_Y} x2={bx} y2={SPINE_Y + 16} stroke={stroke} strokeWidth={1.5} />
              {o.type === 'paper' && (
                <rect x={bx - 4.5} y={SPINE_Y + 16} width={9} height={9} transform={`rotate(45 ${bx} ${SPINE_Y + 20.5})`} fill={stroke} />
              )}
              {o.type === 'prototype' && (
                <rect x={bx - 4} y={SPINE_Y + 16} width={8} height={8} fill={stroke} />
              )}
              {o.type === 'artefact' && (
                <rect x={bx - 5} y={SPINE_Y + 16} width={10} height={10} rx={2} fill={stroke} />
              )}
              {ret !== undefined && (
                <line x1={bx} y1={SPINE_Y + 16} x2={ret} y2={SPINE_Y} stroke={stroke} strokeWidth={1} strokeDasharray="2 2" opacity={0} />
              )}
            </g>
          )
        })}
      </svg>
    </button>
  )
}
