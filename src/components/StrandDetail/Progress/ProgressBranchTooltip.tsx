import { useLayoutEffect, useRef, useState } from 'react'
import type { ProgressOutput } from './types'
import styles from './ProgressBranchTooltip.module.css'

export interface ProgressBranchTooltipProps {
  output: ProgressOutput | null
  containerRef: React.RefObject<HTMLDivElement | null>
  // The branch node element to anchor against. The parent passes
  // whichever SVG node it tracks via the branch's onHoverChange — we
  // never reach into the DOM ourselves.
  anchorEl: SVGElement | null
}

interface Position { left: number; top: number }

// Tooltip positioned relative to a containerRef using
// getBoundingClientRect on the anchor (a branch's <rect>). All sibling
// access happens through React props — no DOM queries by id.
export default function ProgressBranchTooltip({
  output,
  containerRef,
  anchorEl,
}: ProgressBranchTooltipProps) {
  const tipRef = useRef<HTMLDivElement | null>(null)
  const [pos, setPos] = useState<Position | null>(null)

  useLayoutEffect(() => {
    if (!output || !anchorEl || !containerRef.current) {
      setPos(null)
      return
    }
    const a = anchorEl.getBoundingClientRect()
    const c = containerRef.current.getBoundingClientRect()
    setPos({
      left: a.left + a.width / 2 - c.left,
      top:  a.top - c.top,
    })
  }, [output, anchorEl, containerRef])

  const visible = output !== null && pos !== null

  return (
    <div
      ref={tipRef}
      className={`${styles.tip} ${visible ? styles.visible : ''}`}
      role="tooltip"
      aria-hidden={!visible}
      style={pos ? { left: pos.left, top: pos.top } : undefined}
    >
      {output && (
        <>
          <div className={styles.meta}>{output.tooltipMeta}</div>
          <strong className={styles.title}>{output.title}</strong>
          {output.tooltipDesc}
        </>
      )}
    </div>
  )
}
