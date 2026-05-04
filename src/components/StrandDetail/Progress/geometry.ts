import type { Phase, PhaseId, ProgressOutput } from './types'

// Pure functions that compute SVG x-coordinates for the progress
// timeline. Components NEVER hardcode coordinates — they ask these
// functions for them. The reference HTML hardcodes coords because it
// was a static demo.

// Evenly distribute phases across [margin, viewBoxWidth - margin].
export function phasePositions(
  phases: Phase[],
  viewBoxWidth: number,
  margin: number,
): Map<PhaseId, number> {
  const result = new Map<PhaseId, number>()
  if (phases.length === 0) return result
  if (phases.length === 1) {
    result.set(phases[0].id, viewBoxWidth / 2)
    return result
  }
  const span = viewBoxWidth - margin * 2
  const step = span / (phases.length - 1)
  phases.forEach((p, i) => {
    result.set(p.id, margin + step * i)
  })
  return result
}

// Branch x — midpoint between the phase the output is attached after
// and the next phase in the sequence. If there is no next phase, the
// branch falls back to the attachment phase's x.
export function branchX(
  output: ProgressOutput,
  positions: Map<PhaseId, number>,
  phases: Phase[],
): number {
  const idx = phases.findIndex(p => p.id === output.attachedAfterPhase)
  if (idx === -1) return positions.values().next().value ?? 0
  const here = positions.get(output.attachedAfterPhase) ?? 0
  const next = idx + 1 < phases.length
    ? positions.get(phases[idx + 1].id)
    : undefined
  if (next === undefined) return here
  return (here + next) / 2
}

// Where a returning branch line rejoins the spine. For 'output'
// behaviour this is the next phase's x; for 'terminus' it's undefined
// (the caller should render terminus caps instead of a return curve).
export function returnTargetX(
  output: ProgressOutput,
  positions: Map<PhaseId, number>,
  phases: Phase[],
): number | undefined {
  if (output.behaviour !== 'output') return undefined
  const idx = phases.findIndex(p => p.id === output.attachedAfterPhase)
  if (idx === -1 || idx + 1 >= phases.length) return undefined
  return positions.get(phases[idx + 1].id)
}
