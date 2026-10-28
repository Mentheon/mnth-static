import { STRAND, type CategoryId } from '../data/framework'
import './product-mark.css'

/* Strand logo tile as DOM — the same mark as the Helix3D section-cube
   faces: ink ground (cream in dark), cream emblem, the strand name split
   over two lines in Lato 900, bottom-left. Crimson when selected.
   Size it with width/height on .smark. */
export default function StrandMark({ cat, selected = false, className }: {
  cat: CategoryId
  selected?: boolean
  className?: string
}) {
  const [a, b] = STRAND[cat].split
  const mask = `url(${import.meta.env.BASE_URL}emblem-cream.svg)`
  return (
    <span className={`smark${selected ? ' is-selected' : ''}${cat === 'advisory' ? ' is-advisory' : ''}${className ? ' ' + className : ''}`}
      role="img" aria-label={`${STRAND[cat].name} logo`}>
      <span className="ptile-emblem" style={{ WebkitMaskImage: mask, maskImage: mask }} />
      <svg viewBox="0 0 195 195" aria-hidden="true">
        <text x="12" y="143.6" fontSize="40" letterSpacing="-0.6">{a}</text>
        <text x="12" y="178" fontSize="40" letterSpacing="-0.6">{b}</text>
      </svg>
    </span>
  )
}
