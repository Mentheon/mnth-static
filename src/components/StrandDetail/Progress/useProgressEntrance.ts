import { useEffect, useRef } from 'react'
import { createTimeline, stagger, utils } from 'animejs'
import useReducedMotion from '../hooks/useReducedMotion'

// One-shot entrance timeline for the expanded progress diagram.
// Triggered the FIRST time `expanded` becomes true; subsequent
// re-expands snap straight to the final state. Tracks the "have we
// played?" bit with a ref (NOT state) — playing the timeline is a
// side effect on the DOM, not React-visible state.
//
// `rootRef` should point at the <svg> (or any common ancestor of all
// the targets). Selectors are scoped via `rootRef.current.querySelector`
// equivalent: anime.js v4 accepts an Element[] / NodeList, so we pass
// resolved DOM nodes into each step rather than global CSS selectors —
// this keeps the hook safe to mount more than once on a page.
export default function useProgressEntrance(
  rootRef: React.RefObject<SVGSVGElement | null>,
  expanded: boolean,
): void {
  const hasAnimatedRef = useRef<boolean>(false)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (!expanded) return
    if (hasAnimatedRef.current) return
    const root = rootRef.current
    if (!root) return
    hasAnimatedRef.current = true

    // Reduced motion: snap everything to its final visible state and bail.
    if (reduced) {
      root.querySelectorAll<SVGElement>(
        '.branch-line, .branch-node, .branch-terminus-cap, .phase--projected, .spine-future',
      ).forEach(el => { el.style.opacity = '1' })
      root.querySelectorAll<SVGElement>('.branch-return').forEach(el => {
        el.style.opacity = '0.7'
      })
      return
    }

    const tl = createTimeline({ defaults: { ease: 'outQuad' } })

    // 1. Spine strokes in via strokeDashoffset.
    const spinePath = root.querySelector<SVGPathElement>('.spine-active')
    if (spinePath) {
      const spineLen = spinePath.getTotalLength()
      spinePath.style.strokeDasharray  = String(spineLen)
      spinePath.style.strokeDashoffset = String(spineLen)
      tl.add(spinePath, {
        strokeDashoffset: [spineLen, 0],
        duration: 1100,
        ease: 'inOutQuad',
      })
    }

    // 2. Phase nodes scale-in stagger (past + current).
    const phaseEls = root.querySelectorAll<SVGElement>(
      '.phase--past circle, .phase--past text, .phase--current circle, .phase--current text',
    )
    if (phaseEls.length) {
      utils.set(phaseEls, { opacity: 0, scale: 0.6 })
      tl.add(phaseEls, {
        opacity: 1,
        scale: 1,
        duration: 380,
        delay: stagger(70),
        ease: 'outBack(1.6)',
      }, '-=600')
    }

    // 3. Each branch in canonical render order.
    const branchOrder: ReadonlyArray<string> = ['paper', 'prototype', 'artefact']
    branchOrder.forEach((branchType, i) => {
      const branch = root.querySelector<SVGGElement>(`[data-branch="${branchType}"]`)
      if (!branch) return
      const line = branch.querySelector<SVGPathElement>('.branch-line')
      const node = branch.querySelector<SVGGElement>('.branch-node')
      const ret  = branch.querySelector<SVGPathElement>('.branch-return')
      const caps = branch.querySelectorAll<SVGLineElement>('.branch-terminus-cap')

      if (line) {
        const lineLen = line.getTotalLength()
        line.style.strokeDasharray  = String(lineLen)
        line.style.strokeDashoffset = String(lineLen)
        line.style.opacity = '1'
        tl.add(line, {
          strokeDashoffset: [lineLen, 0],
          duration: 380,
          ease: 'inOutQuad',
        }, i === 0 ? '-=200' : '-=240')
      }
      if (node) {
        tl.add(node, {
          opacity: [0, 1],
          translateY: [-8, 0],
          duration: 280,
          ease: 'outBack(1.8)',
        }, '-=140')
      }
      if (ret) {
        tl.add(ret, { opacity: [0, 0.7], duration: 320 }, '-=150')
      }
      if (caps.length) {
        tl.add(caps, {
          opacity: [0, 1],
          scaleX: [0.4, 1],
          duration: 260,
          delay: stagger(60),
        }, '-=200')
      }
    })

    // 4 + 5. Future spine + projected phase fade in.
    const future = root.querySelector<SVGPathElement>('.spine-future')
    if (future) tl.add(future, { opacity: [0, 1], duration: 420 }, '-=100')
    const projected = root.querySelectorAll<SVGElement>('.phase--projected')
    if (projected.length) {
      tl.add(projected, { opacity: [0, 1], duration: 420 }, '-=320')
    }
    // Step 6 (current-phase pulse) is owned by usePulse on the
    // <ProgressPhaseNode> for the current phase.
  }, [expanded, reduced, rootRef])
}
