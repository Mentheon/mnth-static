import { useMemo, useRef, useState } from 'react'
import type { StrandProgress, ProgressOutput } from './types'
import { phasePositions, branchX, returnTargetX } from './geometry'
import ProgressPhaseNode from './ProgressPhaseNode'
import ProgressBranch from './ProgressBranch'
import ProgressBranchTooltip from './ProgressBranchTooltip'
import useProgressEntrance from './useProgressEntrance'
import styles from './ProgressTimeline.module.css'

export interface ProgressTimelineProps {
  id: string
  progress: StrandProgress
  expanded: boolean
}

const VBW    = 1400
const VBH    = 460
const SPINE_Y = 140
const NODE_Y  = 310
const MARGIN  = 120

interface HoverState {
  output: ProgressOutput | null
  anchor: SVGElement | null
}

// Owns the entrance animation and the hover state for tooltip
// rendering. Geometry is memoised so it stays stable across re-renders
// caused by hover.
export default function ProgressTimeline({ id, progress, expanded }: ProgressTimelineProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [hover, setHover] = useState<HoverState>({ output: null, anchor: null })

  useProgressEntrance(svgRef, expanded)

  const positions = useMemo(
    () => phasePositions(progress.phases, VBW, MARGIN),
    [progress],
  )

  // Split the spine into "active" (past + current) and "future"
  // (anything projected). The entrance hook strokes the active path,
  // then fades the future path in.
  const activePathD = useMemo(() => {
    const xs: number[] = []
    progress.phases.forEach(p => {
      if (p.status !== 'projected') {
        const x = positions.get(p.id)
        if (x !== undefined) xs.push(x)
      }
    })
    if (xs.length === 0) return ''
    return xs.map((x, i) => (i === 0 ? `M${x},${SPINE_Y}` : `L${x},${SPINE_Y}`)).join(' ')
  }, [progress, positions])

  const futurePathD = useMemo(() => {
    const lastActive  = [...progress.phases].reverse().find(p => p.status !== 'projected')
    const firstFuture = progress.phases.find(p => p.status === 'projected')
    if (!lastActive || !firstFuture) return ''
    const a = positions.get(lastActive.id)
    const b = positions.get(firstFuture.id)
    if (a === undefined || b === undefined) return ''
    return `M${a},${SPINE_Y} L${b + 220},${SPINE_Y}`
  }, [progress, positions])

  const handleHoverChange = (output: ProgressOutput | null, anchor: SVGElement | null) => {
    setHover({ output, anchor })
  }

  return (
    <div
      ref={containerRef}
      id={id}
      className={`${styles.panel} ${expanded ? styles.open : ''}`}
      aria-hidden={!expanded}
    >
      <div className={styles.inner}>
        <h2 className={styles.title}>Progress · expanded</h2>
        <svg
          ref={svgRef}
          className={styles.svg}
          viewBox={`0 0 ${VBW} ${VBH}`}
          preserveAspectRatio="xMidYMid meet"
          aria-label="Strand progression timeline"
        >
          <defs>
            <marker id="arrowFull" viewBox="0 0 10 10" refX={9} refY={5} markerWidth={7} markerHeight={7} orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="#2F0147" />
            </marker>
          </defs>

          <g>
            <path
              className="spine-active"
              d={activePathD}
              stroke="#2F0147"
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
            />
            {futurePathD && (
              <path
                className="spine-future"
                d={futurePathD}
                stroke="#2F0147"
                strokeWidth={2}
                fill="none"
                strokeDasharray="7 9"
                strokeLinecap="round"
                opacity={0}
                markerEnd="url(#arrowFull)"
              />
            )}
          </g>

          {progress.outputs.map(o => (
            <ProgressBranch
              key={o.id}
              output={o}
              startX={branchX(o, positions, progress.phases)}
              spineY={SPINE_Y}
              nodeY={NODE_Y}
              returnToX={returnTargetX(o, positions, progress.phases)}
              onHoverChange={handleHoverChange}
            />
          ))}

          <g>
            {progress.phases.map(p => (
              <ProgressPhaseNode
                key={p.id}
                phase={p}
                x={positions.get(p.id) ?? 0}
                y={SPINE_Y}
              />
            ))}
          </g>
        </svg>
        <ProgressBranchTooltip
          output={hover.output}
          containerRef={containerRef}
          anchorEl={hover.anchor}
        />
      </div>
    </div>
  )
}
