import { useEffect, useRef, useState } from 'react'
import { ADVISORY, type AdvisoryId } from '../../data/advisory'
import { CONTACT_EMAIL } from '../../data/people'
import { useSwipeDown } from '../../lib/useSwipeDown'
import s from './AdvisoryOrbit.module.css'

/* Consultancy & advisory window over the strand view. The four
   services orbit a Mentheon emblem hub (CSS rotation; nodes counter-
   rotate to stay upright; paused on hover/focus or when one is picked,
   static under reduced motion). Picking one shows its write-up and the
   email CTA beside (desktop) or below (phone sheet) the orbit.
   Rendered inside .helix3d-root so it takes the scene's theme tokens;
   carries data-scene-ignore so the scene's wheel/swipe/keys skip it.
   × / scrim / Esc / swipe-down (phones) close. */

export default function AdvisoryOrbit({ onClose }: { onClose: () => void }) {
  const [sel, setSel] = useState<AdvisoryId | null>(null)
  const [picked, setPicked] = useState(false)       // pause the orbit once the user has chosen
  const swipe = useSwipeDown(onClose)
  const closeRef = useRef<HTMLButtonElement>(null)
  const service = ADVISORY.find((a) => a.id === (sel ?? ADVISORY[0].id))!

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); onClose() } }
    window.addEventListener('keydown', onKey)
    if (window.matchMedia('(pointer: fine)').matches) closeRef.current?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const pick = (id: AdvisoryId) => { setSel(id); setPicked(true) }
  const mail = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Advisory enquiry: ${service.label}`)}`
  const mark = `url(${import.meta.env.BASE_URL}emblem-cream.svg)`

  return (
    <div className={s.layer} data-scene-ignore>
      <div className={s.scrim} onClick={onClose} />
      <section className={s.win} role="dialog" aria-modal="true" aria-labelledby="advisory-title" style={swipe.style}>
        <span className={s.crop} aria-hidden="true" />
        <header className={s.bar} {...swipe.handlers}>
          <span className={s.grab} aria-hidden="true" />
          <span>consultancy ✲ advisory</span>
          <button ref={closeRef} type="button" className={s.x} onClick={onClose} aria-label="Close (Esc)" title="Close (esc)">×</button>
        </header>

        <div className={s.body}>
          <div className={s.intro}>
            <p className={s.kick}>services · {String(ADVISORY.length).padStart(2, '0')} fields</p>
            <h2 id="advisory-title" className={s.title}>Consultancy &amp; <span>Advisory</span></h2>
            <p className={s.tagline}>Independent expertise across the life of a digital-health project, from the first question to deployment.</p>
          </div>

          <div className={s.grid}>
            <div className={`${s.orbit}${picked ? ` ${s.paused}` : ''}`} role="tablist" aria-label="Advisory fields">
              <span className={s.track} aria-hidden="true" />
              <span className={s.hub} aria-hidden="true">
                <span className={s.hubMark} style={{ WebkitMaskImage: mark, maskImage: mark }} />
              </span>
              <div className={s.ring}>
                {ADVISORY.map((a, i) => (
                  <div key={a.id} className={s.slot} style={{ ['--a' as string]: `${i * 90 - 90}deg` }}>
                    <button type="button" role="tab" aria-selected={service.id === a.id}
                      className={`${s.node}${service.id === a.id ? ` ${s.isSel}` : ''}`}
                      onClick={() => pick(a.id)}>
                      <span className={s.tile}><b>{a.num}</b></span>
                      <span className={s.nodeLabel}>{a.label}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <article className={s.detail} role="tabpanel" aria-live="polite" key={service.id}>
              <p className={s.dNum}>§ {service.num} · {service.label}</p>
              <h3 className={s.dLede}>{service.lede}</h3>
              {service.body.map((p, i) => <p key={i} className={s.dText}>{p}</p>)}
              <ul className={s.covers}>
                {service.covers.map((c) => <li key={c}>{c}</li>)}
              </ul>
              <p className={s.more}>
                For more details, email <a href={mail}>{CONTACT_EMAIL}</a>
              </p>
              <a className={s.cta} href={mail}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="1.5" /><path d="M3.5 6l8.5 7 8.5-7" />
                </svg>
                email about {service.label.toLowerCase()}
              </a>
            </article>
          </div>
        </div>
      </section>
    </div>
  )
}
