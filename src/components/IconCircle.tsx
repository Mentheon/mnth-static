import { useState, useEffect, useRef } from 'react'
import styles from './IconCircle.module.css'

interface IconCircleProps {
  emoji?: string
  size?: number
  isSelected?: boolean
}

const THRESHOLD = 210
const MAX_SCALE = 1.15
const DEAD_ZONE = 70

export default function IconCircle({ emoji, size = 120, isSelected = false }: IconCircleProps) {
  const [scale, setScale] = useState(1)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!ref.current) return
      const r = ref.current.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const d = Math.hypot(e.clientX - cx, e.clientY - cy)
      const eff = d < DEAD_ZONE ? 0 : d
      const s = eff < THRESHOLD ? 1 + (MAX_SCALE - 1) * (1 - eff / THRESHOLD) : 1
      setScale(s)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div
      ref={ref}
      className={styles.circle}
      style={{
        backgroundColor: isSelected ? 'var(--crimson)' : 'var(--grape)',
        width: size,
        height: size,
        transform: `scale(${scale.toFixed(3)})`,
      }}
    >
      {emoji && (
        <span className={styles.emoji}>{emoji}</span>
      )}
    </div>
  )
}
