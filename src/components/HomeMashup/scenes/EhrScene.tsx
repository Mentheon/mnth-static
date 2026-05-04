import { useEffect, useRef } from 'react'
import { animate } from 'animejs'
import type { SceneProps } from '../types'
import styles from './Scene.module.css'

/* ============================================================
   EhrScene — Mentheon-OS boot sequence.

   A terminal-style log that streams in over ~6s. Three textures
   interleave: instant lines (banner, comments, spacers) that
   appear whole, and typed lines (prompts, mounts, stats, flags)
   that reveal character-by-character.

   Easter eggs:
     · the build's date stamp matches "today" so the boot feels live
     · a dim `// authored by qj …` signature near the close (Quentin Jr)
   ============================================================ */

type LineKind =
  | 'banner'    /* full-width identifier, weight bumped */
  | 'prompt'    /* `>` SQL-ish queries — typed */
  | 'ok'        /* `[ OK ]` mock systemd lines */
  | 'mount'     /* indented strand mounts — typed */
  | 'stat'      /* bullet stats — typed */
  | 'comment'   /* `//` dim author / phase comments */
  | 'flag'      /* the closer — crimson, bold, typed */
  | 'spacer'    /* empty row, visual breath */

interface Line {
  text: string
  kind: LineKind
}

/* Lines that drop in whole rather than character-by-character.
   System messages don't feel like they're being typed in real time —
   they feel echoed from elsewhere — so banner/comments/oks are instant.
   The prompt + flag + stats are the "active" lines and get streamed. */
const INSTANT_KINDS: ReadonlySet<LineKind> = new Set(['banner', 'comment', 'ok', 'spacer'])

const LINES: Line[] = [
  { kind: 'banner',  text: 'MENTHEON-OS  v0.9.4-rc2  (build 20260504.b3a1)' },
  { kind: 'banner',  text: 'state of the art in digital health since 2024' },
  { kind: 'comment', text: '// authored by quentjr · bloem · for the long road ahead' },
  { kind: 'spacer',  text: '' },
  { kind: 'ok',      text: '[ OK ]  kernel handoff           0.041s' },
  { kind: 'ok',      text: '[ OK ]  identity service         0.118s' },
  { kind: 'ok',      text: '[ OK ]  consent ledger           0.207s' },
  { kind: 'spacer',  text: '' },
  { kind: 'comment', text: '// mounting research strands' },
  { kind: 'mount',   text: '  ↳ caritheon  · subjective attraction       online' },
  { kind: 'mount',   text: '  ↳ aevorix    · ageing & longevity          online' },
  { kind: 'mount',   text: '  ↳ vitrix     · health analytics            online' },
  { kind: 'mount',   text: '  ↳ noetis*    · cognition (provisional)     pending' },
  { kind: 'spacer',  text: '' },
  { kind: 'prompt',  text: '> SELECT velocity FROM digital_health WHERE year = 2026' },
  { kind: 'stat',    text: '  ◉ AI diagnostics approved      +1247 yoy' },
  { kind: 'stat',    text: '  ◉ Wearables in active trials   ×3.2' },
  { kind: 'stat',    text: '  ◉ Whole-genome readout         $200' },
  { kind: 'stat',    text: '  ◉ Telehealth visits / yr       84M' },
  { kind: 'stat',    text: '  ◉ Mean time to diagnosis       ↓ 64%' },
  { kind: 'spacer',  text: '' },
  { kind: 'comment', text: '// authored by qj · london · for the long road ahead' },
  { kind: 'flag',    text: '> signal velocity exceeds historic baseline' },
]

/* Per-kind rendering rules. Centralised so the loop stays clean —
   add a new kind here and the loop picks it up. */
interface KindStyle {
  fill: string
  opacity: string
  weight: string
}
const KIND_STYLES: Record<LineKind, KindStyle> = {
  banner:  { fill: 'var(--ink)',     opacity: '1',    weight: '700' },
  prompt:  { fill: 'var(--ink)',     opacity: '1',    weight: '400' },
  ok:      { fill: 'var(--ink)',     opacity: '0.85', weight: '400' },
  mount:   { fill: 'var(--plum)',    opacity: '0.9',  weight: '400' },
  stat:    { fill: 'var(--ink)',     opacity: '0.95', weight: '400' },
  comment: { fill: 'var(--ink)',     opacity: '0.45', weight: '400' },
  flag:    { fill: 'var(--crimson)', opacity: '1',    weight: '700' },
  spacer:  { fill: 'transparent',    opacity: '0',    weight: '400' },
}

/* Timing tuning. Tweak these to compress / expand the whole sequence
   without touching the loop. */
const CHAR_MS = 14          /* per-character typing speed for typed lines */
const INSTANT_HOLD = 80     /* gap after an instant line before the next  */
const SPACER_HOLD = 60      /* visual breath for blank rows               */
const TYPED_GAP = 80        /* gap after a typed line completes           */
const START_Y = 80
const LINE_H = 22

export default function EhrScene({ onReadoutChange }: SceneProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    onReadoutChange('mentheon-os', 'boot · tty1')
    const svg = svgRef.current
    if (!svg) return

    const SVG_NS = 'http://www.w3.org/2000/svg'
    const animations: ReturnType<typeof animate>[] = []
    const timeouts: number[] = []

    let cursor = 0  /* running ms offset for the next line to start */

    LINES.forEach((entry, idx) => {
      const style = KIND_STYLES[entry.kind]

      /* Spacer rows still take a <text> slot so the y-rhythm stays
         predictable, but they animate nothing. */
      if (entry.kind === 'spacer') {
        cursor += SPACER_HOLD
        return
      }

      const text = document.createElementNS(SVG_NS, 'text')
      text.setAttribute('x', '80')
      text.setAttribute('y', String(START_Y + idx * LINE_H))
      text.setAttribute('font-family', 'Courier New, monospace')
      text.setAttribute('font-size', '13')
      text.setAttribute('fill', style.fill)
      text.setAttribute('font-weight', style.weight)
      text.setAttribute('opacity', '0')
      svg.appendChild(text)

      if (INSTANT_KINDS.has(entry.kind)) {
        /* Instant: drop the whole string in, fade the row up. */
        const id = window.setTimeout(() => {
          text.textContent = entry.text
        }, cursor)
        timeouts.push(id)

        animations.push(
          animate(text, {
            opacity: [0, parseFloat(style.opacity)],
            duration: 220,
            delay: cursor,
            ease: 'outQuad',
          }),
        )
        cursor += INSTANT_HOLD
        return
      }

      /* Typed: row fades up, then characters reveal one-by-one. */
      animations.push(
        animate(text, {
          opacity: [0, parseFloat(style.opacity)],
          duration: 180,
          delay: cursor,
          ease: 'outQuad',
        }),
      )

      const obj = { i: 0 }
      const typeMs = entry.text.length * CHAR_MS
      animations.push(
        animate(obj, {
          i: entry.text.length,
          duration: typeMs,
          delay: cursor,
          ease: 'linear',
          onUpdate: () => {
            const i = Math.round(obj.i)
            text.textContent = entry.text.slice(0, i)
          },
        }),
      )
      cursor += typeMs + TYPED_GAP
    })

    return () => {
      animations.forEach(a => a.pause())
      timeouts.forEach(id => clearTimeout(id))
      while (svg.firstChild) svg.removeChild(svg.firstChild)
    }
  }, [onReadoutChange])

  return (
    <svg
      ref={svgRef}
      className={styles.canvas}
      viewBox="0 0 800 520"
      preserveAspectRatio="xMidYMid meet"
    />
  )
}