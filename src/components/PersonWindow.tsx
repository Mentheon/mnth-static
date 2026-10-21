import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import type { Person } from '../data/people'
import PersonAvatar from './PersonAvatar'
import { useSwipeDown } from '../lib/useSwipeDown'
import styles from './PersonWindow.module.css'

/* Person window — the Helix3D strand window's behaviour, for the
   People page. 'dock' = default: drawn out just under the disc it was
   opened from, re-placed on resize/scroll. 'free' = the user has
   moved/resized it (viewport px). 'max' = fills the page inside the
   chrome. Title-bar drag moves, double-click maximises, corner grip
   resizes (min 380 × 260). Scrim click / × / Esc close (Esc is
   handled by WhoPage, so it can step out of the page when closed).
   Portalled to <body> so no ancestor (the page frame) can become the
   containing block for its fixed positioning. */

type WinMode = 'dock' | 'free' | 'max'
type Rect = { x: number; y: number; w: number; h: number | null }

const pad2 = (n: number) => String(n).padStart(2, '0')

export default function PersonWindow({ person, index, total, title, anchor, onClose }: {
  person: Person
  index: number
  total: number
  /** Title-bar text; defaults to "who · 01 of 03". */
  title?: string
  /** The profile it opened from — docked placement hangs off this. */
  anchor: HTMLElement | null
  onClose: () => void
}) {
  const winRef = useRef<HTMLDivElement>(null)
  const [mode, setModeState] = useState<WinMode>('dock')
  const modeRef = useRef<WinMode>('dock')
  const preMaxRef = useRef<WinMode>('dock')
  const [rect, setRect] = useState<Rect>({ x: 0, y: 0, w: 720, h: null })
  const [dock, setDock] = useState<{ x: number; y: number } | null>(null)
  const setMode = (m: WinMode) => { modeRef.current = m; setModeState(m) }

  /* Docked placement: centred under the anchor, clamped on-screen. */
  useLayoutEffect(() => {
    if (mode !== 'dock') return
    const place = () => {
      const el = winRef.current
      if (!el) return
      const vw = window.innerWidth, vh = window.innerHeight
      const w = el.offsetWidth, h = el.offsetHeight
      // Opened from a link (no profile rendered yet to hang off): centre it.
      if (!anchor) {
        setDock({ x: Math.round(Math.max(16, (vw - w) / 2)), y: Math.round(Math.max(56, (vh - h) / 2)) })
        return
      }
      const a = anchor.getBoundingClientRect()
      const x = Math.max(16, Math.min(a.left + a.width / 2 - w / 2, vw - w - 16))
      const y = Math.max(56, Math.min(a.bottom + 16, vh - h - 16))
      setDock({ x: Math.round(x), y: Math.round(y) })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, { passive: true })
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place)
    }
  }, [mode, anchor, person.id])

  const winRect = () => winRef.current?.getBoundingClientRect() ?? null

  /* Title-bar drag → move. Starts from the window's current on-screen
     rect so a docked window lifts off exactly where it is. */
  const onDragStart = (e: ReactPointerEvent) => {
    if (e.button !== 0 || modeRef.current === 'max') return
    if (window.matchMedia('(max-width: 720px)').matches) return   // phones: a fixed bottom sheet
    if ((e.target as HTMLElement).closest('button')) return
    const r = winRect(); if (!r) return
    e.preventDefault()
    const sx = e.clientX, sy = e.clientY
    const h0 = modeRef.current === 'free' ? rect.h : null
    setRect({ x: r.left, y: r.top, w: r.width, h: h0 })
    setMode('free')
    const move = (ev: PointerEvent) => {
      const vw = window.innerWidth, vh = window.innerHeight
      const x = Math.max(16 - r.width + 120, Math.min(vw - 120, r.left + ev.clientX - sx))
      const y = Math.max(40, Math.min(vh - 48, r.top + ev.clientY - sy))
      setRect((p) => ({ ...p, x, y }))
    }
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }
  /* Corner grip → resize (min 380 × 260). */
  const onResizeStart = (e: ReactPointerEvent) => {
    if (e.button !== 0) return
    const r = winRect(); if (!r) return
    e.preventDefault(); e.stopPropagation()
    const sx = e.clientX, sy = e.clientY
    setRect({ x: r.left, y: r.top, w: r.width, h: r.height })
    setMode('free')
    const move = (ev: PointerEvent) => {
      const w = Math.max(380, Math.min(window.innerWidth - r.left - 8, r.width + ev.clientX - sx))
      const h = Math.max(260, Math.min(window.innerHeight - r.top - 8, r.height + ev.clientY - sy))
      setRect((p) => ({ ...p, w, h }))
    }
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }
  const onMin = () => setMode('dock')
  const onMax = () => {
    if (modeRef.current === 'max') setMode(preMaxRef.current)
    else { preMaxRef.current = modeRef.current; setMode('max') }
  }

  /* Move focus into the window on open (keyboard users land on ×). */
  useEffect(() => {
    winRef.current?.querySelector<HTMLButtonElement>(`.${styles.close}`)?.focus({ preventScroll: true })
  }, [person.id])

  const style = mode === 'free'
    ? { transform: `translate(${rect.x}px, ${rect.y}px)`, width: rect.w, height: rect.h ?? undefined }
    : mode === 'dock'
      ? { transform: dock ? `translate(${dock.x}px, ${dock.y}px)` : 'translate(-9999px, -9999px)', maxHeight: 'calc(100dvh - 72px)' }
      : undefined
  const role = person.role
  const swipe = useSwipeDown(onClose)                // phones (bottom sheet): drag the bar down to close

  return createPortal(
    <>
      <div className={styles.scrim} onClick={onClose} />
      <div
        ref={winRef}
        className={`${styles.win} ${mode === 'max' ? styles.max : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={person.name}
        style={{ ...style, ...swipe.style }}
      >
        <div className={styles.crop} aria-hidden="true" />
        <div className={styles.bar} onPointerDown={onDragStart} onDoubleClick={onMax} {...swipe.handlers}>
          <span className={styles.grab} aria-hidden="true" />
          <span className={styles.title}>{title ?? `who · ${pad2(index + 1)} of ${pad2(total)}`}</span>
          <span className={styles.ctrls}>
            <button type="button" onClick={onMin} disabled={mode === 'dock'} title="Return to profile" aria-label="Minimise — return to default size under the profile">min</button>
            <button type="button" onClick={onMax} className={mode === 'max' ? styles.on : ''} title={mode === 'max' ? 'Restore' : 'Maximise'} aria-label={mode === 'max' ? 'Restore window' : 'Maximise window'}>max</button>
            <button type="button" onClick={onClose} className={styles.close} title="Close (esc)" aria-label="Close person window">×</button>
          </span>
        </div>
        <div className={styles.body}>
          <p className={styles.kicker}>mentheon <span className={styles.star}>✲</span> people</p>
          <div className={styles.head}>
            <PersonAvatar person={person} color="var(--crimson)" className={styles.avatar} />
            <div>
              <h2 className={styles.name}>{person.name}</h2>
              <p className={styles.role}>{role}</p>
              <p className={styles.creds}>{person.credentials}</p>
              {(person.linkedin || person.email) && (
                <div className={styles.links}>
                  {person.linkedin && (
                    <a className={styles.linkedin} href={person.linkedin} target="_blank" rel="noreferrer">
                      <img src={`${import.meta.env.BASE_URL}people/linkedin.png`} alt="" width={18} height={18} />
                      linkedin <span aria-hidden="true">↦</span>
                    </a>
                  )}
                  {person.email && (
                    <a className={`${styles.linkedin} ${styles.email}`} href={`mailto:${person.email}`}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
                        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="3" y="5" width="18" height="14" rx="1.5" /><path d="m3 7 9 6 9-6" />
                      </svg>
                      {person.email} <span aria-hidden="true">↦</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
          <dl className={styles.fields}>
            {person.themes.map((t, i) => (
              <div key={i}>
                <dt>{pad2(i + 1)} · focus</dt>
                <dd>
                  <span className={styles.themeTitle}>{t.title}</span>
                  <span className={styles.themeDesc}>{t.description}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
        {mode !== 'max' && (
          <div className={styles.grip} onPointerDown={onResizeStart} aria-hidden="true" />
        )}
      </div>
    </>,
    document.body,
  )
}
