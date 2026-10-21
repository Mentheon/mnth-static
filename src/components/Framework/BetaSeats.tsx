import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { pad2, type Output } from '../../data/framework'
import { useSwipeDown } from '../../lib/useSwipeDown'
import s from './BetaSeats.module.css'

/* Beta testers: a row of seats (abstract figures), some taken. Pick an
   open seat, then "Request seat" opens a short form (name, platform,
   bio) that builds a summary to email the author or copy. Static site:
   nothing is stored; seats are confirmed by hand and `beta.taken` in
   data/framework is bumped when one is. */

const PLATFORMS = ['Linux', 'macOS', 'Windows', 'Web only'] as const
const BIO_MAX = 280

type SeatState = 'taken' | 'open' | 'mine'

function Figure({ state }: { state: SeatState }) {
  return (
    <svg className={s.figure} data-state={state} viewBox="0 0 48 56" aria-hidden="true">
      <circle cx="24" cy="15" r="9" />
      <path d="M7 53 C7 39 15 31 24 31 C33 31 41 39 41 53 Z" />
    </svg>
  )
}

export default function BetaSeats({ o, author }: { o: Output; author?: string }) {
  const { seats, taken, email } = o.beta!
  const [picked, setPicked] = useState<number | null>(null)
  const [asking, setAsking] = useState(false)
  const open = seats - taken - (picked === null ? 0 : 1)

  return (
    <div className={s.beta}>
      <p className={s.count}>
        <b>{pad2(open)}</b>
        <span>of {pad2(seats)} seats open · {pad2(taken)} taken</span>
      </p>
      <div className={s.meter} aria-hidden="true">
        {Array.from({ length: seats }, (_, i) => (
          <i key={i} data-state={i < taken ? 'taken' : i === picked ? 'mine' : 'open'} />
        ))}
      </div>

      <div className={s.seats} role="group" aria-label={`Beta seats, ${taken} of ${seats} taken`}>
        {Array.from({ length: seats }, (_, i) => {
          const state: SeatState = i < taken ? 'taken' : i === picked ? 'mine' : 'open'
          return (
            <button key={i} type="button" className={s.seat} data-state={state}
              disabled={state === 'taken'} aria-pressed={state === 'mine'}
              aria-label={`Seat ${pad2(i + 1)}, ${state === 'taken' ? 'taken' : state === 'mine' ? 'selected' : 'open'}`}
              onClick={() => setPicked(state === 'mine' ? null : i)}>
              <Figure state={state} />
              <span>{pad2(i + 1)} · {state === 'mine' ? 'yours' : state}</span>
            </button>
          )
        })}
      </div>

      <div className={s.legend} aria-hidden="true">
        <span><Figure state="taken" />taken</span>
        <span><Figure state="open" />open</span>
        <span><Figure state="mine" />yours</span>
      </div>

      <button type="button" className={s.cta} disabled={picked === null} onClick={() => setAsking(true)}>
        {picked === null ? 'Pick an open seat' : `Request seat ${pad2(picked + 1)}`} <span aria-hidden="true">↦</span>
      </button>

      {asking && picked !== null && (
        <RequestDialog o={o} seat={picked + 1} seats={seats} email={email} author={author}
          onClose={() => setAsking(false)} />
      )}
    </div>
  )
}

function RequestDialog({ o, seat, seats, email, author, onClose }: {
  o: Output; seat: number; seats: number; email?: string; author?: string; onClose: () => void
}) {
  const [name, setName] = useState('')
  const [platform, setPlatform] = useState<string | null>(null)
  const [bio, setBio] = useState('')
  const [copied, setCopied] = useState<'no' | 'yes' | 'failed'>('no')
  const nameRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const swipe = useSwipeDown(onClose)                // phones: drag the bar down to close

  // Esc closes the dialog (capture phase, so PageShell's Esc-back
  // doesn't also leave the page). Focus the first field only with a
  // mouse/trackpad: on phones that would throw the keyboard up at once.
  useEffect(() => {
    if (window.matchMedia('(pointer: fine)').matches) nameRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopImmediatePropagation()
      closeRef.current()
    }
    window.addEventListener('keydown', onKey, { capture: true })
    return () => window.removeEventListener('keydown', onKey, { capture: true })
  }, [])

  /* Phones: hold the page still under the sheet (fixed body, scroll
     position restored on close) and keep the sheet above the on-screen
     keyboard. The keyboard shrinks the *visual* viewport only, so a
     fixed bottom:0 sheet would sit behind it: track the gap as --kb and
     the visible height as --vvh (used by the ≤720px styles). */
  useEffect(() => {
    const b = document.body, y = window.scrollY
    const prev = [b.style.position, b.style.top, b.style.width, b.style.overflow]
    Object.assign(b.style, { position: 'fixed', top: `-${y}px`, width: '100%', overflow: 'hidden' })
    const vv = window.visualViewport, el = dialogRef.current
    const sync = () => {
      if (!vv || !el) return
      const kb = Math.max(0, window.innerHeight - (vv.height + vv.offsetTop))
      el.style.setProperty('--kb', `${kb}px`)
      el.style.setProperty('--vvh', `${vv.height}px`)
    }
    sync()
    vv?.addEventListener('resize', sync)
    vv?.addEventListener('scroll', sync)
    return () => {
      vv?.removeEventListener('resize', sync)
      vv?.removeEventListener('scroll', sync)
      ;[b.style.position, b.style.top, b.style.width, b.style.overflow] = prev
      window.scrollTo(0, y)
    }
  }, [])
  // Once the keyboard has slid up, keep the focused field in view.
  const reveal = (e: { currentTarget: HTMLElement }) => {
    const t = e.currentTarget
    window.setTimeout(() => t.scrollIntoView({ block: 'nearest' }), 320)
  }

  const ready = !!(name.trim() && platform && bio.trim())
  const summary = [
    `Beta seat request · ${o.title}`,
    `Seat: ${pad2(seat)} of ${pad2(seats)}`,
    `Name: ${name.trim() || '—'}`,
    `Platform: ${platform ?? '—'}`,
    `Bio: ${bio.trim() || '—'}`,
  ].join('\n')
  const first = author?.split(' ')[0]
  // "Nicholas Quentin Smith (nicholas@mentheon.com)": the lead author named in the note.
  const recipient = `${author ?? 'the lead author'}${email ? ` (${email})` : ''}`
  const mailHref = email && ready
    ? `mailto:${email}?subject=${encodeURIComponent(`Beta seat request · ${o.title} · seat ${pad2(seat)}`)}`
      + `&body=${encodeURIComponent(`Hello${first ? ' ' + first : ''},\n\n${summary}\n\nThanks,`)}`
    : undefined
  const edit = <T,>(set: (v: T) => void) => (v: T) => { set(v); setCopied('no') }

  const copy = () => {
    if (!navigator.clipboard) { setCopied('failed'); return }
    navigator.clipboard.writeText(summary).then(() => setCopied('yes'), () => setCopied('failed'))
  }

  return createPortal(
    <>
      <div className={s.scrim} onClick={onClose} />
      <section ref={dialogRef} className={s.dialog} style={swipe.style} role="dialog" aria-modal="true" aria-labelledby="beta-req-title">
        <span className={s.crop} aria-hidden="true" />
        <div className={s.bar} {...swipe.handlers}>
          <span className={s.grab} aria-hidden="true" />
          <span>beta · {o.title.toLowerCase()} · request a seat</span>
          <button type="button" className={s.close} onClick={onClose} aria-label="Close (esc)">×</button>
        </div>
        <div className={s.body}>
          <div>
            <h2 className={s.title} id="beta-req-title">Request a seat</h2>
            <span className={s.seatPill}><Figure state="mine" />seat {pad2(seat)} of {pad2(seats)}</span>

            <label className={s.label} htmlFor="beta-req-name">Name <span>required</span></label>
            <input ref={nameRef} id="beta-req-name" className={s.input} type="text" autoComplete="name"
              placeholder="Your name" value={name} onFocus={reveal} onChange={(e) => edit(setName)(e.target.value)} />

            <div className={s.label} id="beta-req-platform">Platform <span>pick one</span></div>
            <div className={s.platforms} role="radiogroup" aria-labelledby="beta-req-platform">
              {PLATFORMS.map((p) => (
                <button key={p} type="button" role="radio" aria-checked={platform === p}
                  className={s.platform} onClick={() => edit(setPlatform)(p)}>{p}</button>
              ))}
            </div>

            <label className={s.label} htmlFor="beta-req-bio">Quick bio <span>{pad2(bio.length)} / {BIO_MAX}</span></label>
            <textarea id="beta-req-bio" className={s.input} maxLength={BIO_MAX} rows={4}
              placeholder={`Who you are, and what you'd use ${o.title} for.`}
              value={bio} onFocus={reveal} onChange={(e) => edit(setBio)(e.target.value)} />
          </div>

          <div className={s.side}>
            <div className={s.summary} aria-live="polite">
              <p>your request · summary</p>
              <pre>{summary}</pre>
            </div>
            <div className={s.actions}>
              {email && (
                <a className={s.primary} href={mailHref} aria-disabled={!ready}
                  onClick={(e) => { if (!ready) e.preventDefault() }}>Open email</a>
              )}
              <button type="button" className={email ? s.secondary : s.primary} disabled={!ready} onClick={copy}>
                {copied === 'yes' ? 'Copied ✓' : 'Copy summary'}
              </button>
            </div>
            <p className={s.note}>
              {!ready
                ? 'Fill in your name, platform and a quick bio to continue.'
                : copied === 'failed'
                  ? "Couldn't copy automatically. Select the summary above and copy it."
                  : copied === 'yes'
                    ? `Copied. Now send it to ${recipient}.`
                    : `Copy this summary and send to ${recipient}${email ? ', or use Open email to draft it in your mail app' : ''}.`}
            </p>
          </div>
        </div>
      </section>
    </>,
    document.body,
  )
}
