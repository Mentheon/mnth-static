import { useRef, useState, type TouchEvent } from 'react'

/* Swipe-down-to-dismiss for bottom sheets. Bind `handlers` to the
   sheet's top bar (the drag mark lives there); `style` makes the sheet
   follow the finger. Past `threshold` px on release it dismisses,
   otherwise it springs back. Uses `translate` (not `transform`) so it
   composes with sheets whose transform is pinned by CSS. */
export function useSwipeDown(onDismiss: () => void, threshold = 90) {
  const start = useRef<number | null>(null)
  const [offset, setOffset] = useState(0)
  const handlers = {
    onTouchStart: (e: TouchEvent) => { start.current = e.touches[0].clientY },
    onTouchMove: (e: TouchEvent) => {
      if (start.current !== null) setOffset(Math.max(0, e.touches[0].clientY - start.current))
    },
    onTouchEnd: () => {
      const travelled = offset
      start.current = null
      setOffset(0)
      if (travelled > threshold) onDismiss()
    },
    onTouchCancel: () => { start.current = null; setOffset(0) },
  }
  const style = offset ? { translate: `0 ${offset}px`, transition: 'none' } : undefined
  return { handlers, style }
}
