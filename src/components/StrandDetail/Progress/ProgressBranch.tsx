import type { ProgressOutput, OutputType } from './types'
import styles from './ProgressBranch.module.css'

export interface ProgressBranchProps {
  output: ProgressOutput
  startX: number             // x where the branch leaves the spine
  spineY: number             // y of the spine
  nodeY: number              // y at which the branch's node sits
  returnToX?: number         // x where the branch rejoins the spine, if any
  onHoverChange: (output: ProgressOutput | null, target: SVGElement | null) => void
}

interface BranchVisuals {
  stroke: string
  metaFill: string
  metaWeight: 'normal' | 'bold'
  metaOpacity: number
  // When true, the meta + title labels render ABOVE the node (used for
  // the prototype/terminus output to avoid colliding with the cap line).
  labelsAbove: boolean
}

function visualsFor(type: OutputType): BranchVisuals {
  switch (type) {
    case 'paper':
      return { stroke: '#9C528B', metaFill: '#2F0147', metaWeight: 'normal', metaOpacity: 0.6, labelsAbove: false }
    case 'prototype':
      return { stroke: '#2F0147', metaFill: '#2F0147', metaWeight: 'normal', metaOpacity: 0.6, labelsAbove: true }
    case 'artefact':
      return { stroke: '#A30B37', metaFill: '#A30B37', metaWeight: 'bold',   metaOpacity: 0.85, labelsAbove: false }
  }
}

// Pure presentation. Geometry is computed by the parent and handed
// in. Hover events are bubbled up via onHoverChange — we DO NOT query
// siblings or inspect the DOM tree.
export default function ProgressBranch({
  output,
  startX,
  spineY,
  nodeY,
  returnToX,
  onHoverChange,
}: ProgressBranchProps) {
  const v = visualsFor(output.type)

  // Branch line is a vertical Q-curve from spine down to the node.
  // We use a quadratic so the visual matches the reference HTML, even
  // though the path collapses to a straight vertical segment with
  // the control point on the line.
  const linePath = `M${startX},${spineY} Q ${startX},${(spineY + nodeY) / 2} ${startX},${nodeY}`

  // Return curve: when behaviour is 'output', sweep over to the next
  // phase. The control points are derived from the geometry passed in.
  let returnPath: string | null = null
  if (returnToX !== undefined) {
    const midY = nodeY - (nodeY - spineY) * 0.4
    returnPath = `M${startX},${nodeY} Q ${(startX + returnToX) / 2},${nodeY} ${(startX + returnToX) / 2 + (returnToX - startX) * 0.2},${midY} Q ${returnToX - 5},${spineY + 30} ${returnToX},${spineY}`
  }

  // Node geometry per type.
  const renderNode = () => {
    if (output.type === 'paper') {
      return <rect x={-13} y={-13} width={26} height={26} transform="rotate(45)" fill="#9C528B" />
    }
    if (output.type === 'prototype') {
      return <rect x={-13} y={-13} width={26} height={26} fill="#2F0147" />
    }
    return <rect x={-14} y={-14} width={28} height={28} rx={4} fill="#A30B37" />
  }

  // Labels positioned above or below the node depending on visual.
  const titleY = v.labelsAbove ? -26 : 50
  const metaY  = v.labelsAbove ? -44 : 68

  // Terminus caps — short horizontal strokes below the node, only for
  // 'terminus' behaviour.
  const renderTerminusCaps = () => {
    if (output.behaviour !== 'terminus') return null
    return (
      <>
        <line className="branch-terminus-cap" x1={startX - 15} y1={nodeY + 35} x2={startX + 15} y2={nodeY + 35} stroke={v.stroke} strokeWidth={2} opacity={0} />
        <line className="branch-terminus-cap" x1={startX - 20} y1={nodeY + 42} x2={startX + 20} y2={nodeY + 42} stroke={v.stroke} strokeWidth={1} opacity={0} />
      </>
    )
  }

  // Hover state is bubbled via onHoverChange. We pass the node group
  // element so the timeline can position the tooltip relative to it
  // without ever querying the DOM by id.
  const handleEnter = (e: React.MouseEvent<SVGGElement>) => {
    const target = e.currentTarget.querySelector<SVGRectElement>('rect')
    onHoverChange(output, target)
  }
  const handleLeave = () => onHoverChange(null, null)

  return (
    <g
      className={`${styles.branch} branch`}
      data-branch={output.type}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
      tabIndex={0}
      role="group"
      aria-label={`${output.title} — ${output.tooltipMeta}`}
    >
      <path
        className="branch-line"
        d={linePath}
        stroke={v.stroke}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        opacity={0}
      />
      {returnPath && (
        <path
          className="branch-return"
          d={returnPath}
          stroke={v.stroke}
          strokeWidth={1.25}
          fill="none"
          strokeDasharray="3 5"
          opacity={0}
        />
      )}
      {renderTerminusCaps()}
      <g className="branch-node" transform={`translate(${startX}, ${nodeY})`} opacity={0}>
        {renderNode()}
        <text
          x={0}
          y={titleY}
          textAnchor="middle"
          fontFamily="Lato, sans-serif"
          fontSize={14}
          fontWeight={700}
          fill="#2F0147"
        >
          {output.title}
        </text>
        <text
          x={0}
          y={metaY}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize={10}
          fill={v.metaFill}
          opacity={v.metaOpacity}
          fontWeight={v.metaWeight}
          letterSpacing={0.5}
        >
          {output.metaLabel}
        </text>
      </g>
    </g>
  )
}
