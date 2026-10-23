import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  STAFF_ORDER, STRAND, categoryById, outputsIn, categoryStatus, outputName, typeById, stageLabel,
  isOpen, pad2, OUTPUTS, isAdvisory, advisoryFor, type CategoryId, type Output,
} from '../../data/framework'
import { productTileHTML, productMarksReady } from '../ProductMark'
import StrandMark from '../StrandMark'
import Padlock from '../Padlock'
import { CONTACT_EMAIL } from '../../data/people'
import { useSwipeDown } from '../../lib/useSwipeDown'
import s from './MobileHome.module.css'

/* Phone home (≤720px): the helix as a condensed list. Each strand shows
   its logo tile, name, category subtitle and its projects as rows (only
   open projects link on; the rest are padlocked). Tapping a strand opens
   its bottom sheet. "Open the 3D helix" loads the full scene. */

const catHref = (c: CategoryId) => (c === 'plasmids' ? '#plasmids' : `#category/${c}`)

function subtitle(cat: CategoryId) {
  const c = categoryById(cat)!
  if (cat === 'advisory') return '§ AD · head of the staff · consultancy'
  if (cat === 'plasmids') return '§ 00 · experimental software'
  return `§ ${c.num} · ${c.label.toLowerCase()} · ${c.clinical ? c.verb.toLowerCase() : 'free end'}`
}

/* Product tiles are built from fonts + Aufdröselung's glyph path, which
   load async — re-render once they're ready. */
function useMarksReady() {
  const [, setReady] = useState(false)
  useEffect(() => { let live = true; productMarksReady.then(() => { if (live) setReady(true) }); return () => { live = false } }, [])
}

const advisoryMail = (topic?: string) =>
  `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(topic ? `Advisory enquiry: ${topic}` : 'Advisory enquiry')}`

/* Advisory service: no page — the row expands in place to its write-up
   and an email link (everything else stays locked). */
function ServiceRow({ o }: { o: Output }) {
  const a = advisoryFor(o)!
  return (
    <details className={s.service}>
      <summary className={`${s.row} ${s.rowOpen}`}>
        <span className={s.tile} aria-hidden="true" dangerouslySetInnerHTML={{ __html: productTileHTML(o) }} />
        <span className={s.rowText}>
          <span className={s.rowName}>{a.label}</span>
          <span className={s.rowSub}>{a.lede}</span>
        </span>
        <span className={s.chev} aria-hidden="true">+</span>
      </summary>
      <div className={s.serviceBody}>
        {a.body.map((p, i) => <p key={i}>{p}</p>)}
        <ul className={s.covers}>{a.covers.map((c) => <li key={c}>{c}</li>)}</ul>
        <p className={s.more}>For more details, email <a href={advisoryMail(a.label)}>{CONTACT_EMAIL}</a></p>
      </div>
    </details>
  )
}

function ProjectRow({ o }: { o: Output }) {
  if (isAdvisory(o)) return <ServiceRow o={o} />
  const body = (
    <>
      <span className={s.tile} aria-hidden="true" dangerouslySetInnerHTML={{ __html: productTileHTML(o) }} />
      <span className={s.rowText}>
        <span className={s.rowName}>{outputName(o)}</span>
        <span className={s.rowSub}>{typeById(o.type).label.toLowerCase()} · {stageLabel(o).toLowerCase()}</span>
        {o.inflow && isOpen(o) && <span className={s.live}><i />{o.inflow}</span>}
      </span>
    </>
  )
  return isOpen(o) ? (
    <a className={`${s.row} ${s.rowOpen}`} href={`#output/${o.id}`}>
      {body}<span className={s.arrow} aria-hidden="true">→</span>
    </a>
  ) : (
    <div className={`${s.row} ${s.rowLocked}`} title="Details coming soon">
      {body}<span className={s.lock}><Padlock />soon</span>
    </div>
  )
}

export default function MobileHome() {
  useMarksReady()
  const [openCat, setOpenCat] = useState<CategoryId | null>(null)

  return (
    <main className={s.home}>
      <h1 className={s.head}><b>{pad2(STAFF_ORDER.length)}</b>strands<i /><span>{pad2(OUTPUTS.length)} outputs</span></h1>

      <nav className={s.staff} aria-label="Strands">
        {STAFF_ORDER.map((cat) => (
          <section key={cat} className={s.strand}>
            <button type="button" className={s.markBtn} onClick={() => setOpenCat(cat)}
              aria-label={`Open ${STRAND[cat].name}`} aria-haspopup="dialog">
              <StrandMark cat={cat} selected={openCat === cat} className={s.mark} />
            </button>
            <div className={s.strandBody}>
              <button type="button" className={s.strandHead} onClick={() => setOpenCat(cat)} aria-haspopup="dialog">
                <span>
                  <span className={s.name}>{STRAND[cat].name}</span>
                  <span className={s.sub}>{subtitle(cat)}</span>
                  <span className={s.purpose}>{categoryById(cat)!.purpose}.</span>
                </span>
                <span className={s.arrow} aria-hidden="true">→</span>
              </button>
              <div className={s.rows}>
                {outputsIn(cat).map((o) => <ProjectRow key={o.id} o={o} />)}
              </div>
            </div>
          </section>
        ))}
      </nav>

      <a className={s.ghost} href="#helix3d?skipIntro=true">Open the 3D helix <span aria-hidden="true">↦</span></a>

      <footer className={s.foot}>
        <span>mentheon ltd · companies house 15974246</span>
        <a href={`mailto:${CONTACT_EMAIL}`}>contact</a>
      </footer>

      {openCat && (
        <StrandSheet cat={openCat} onClose={() => setOpenCat(null)}
          onStep={(d) => {
            const i = STAFF_ORDER.indexOf(openCat) + d
            if (i >= 0 && i < STAFF_ORDER.length) setOpenCat(STAFF_ORDER[i])
          }} />
      )}
    </main>
  )
}

/* Bottom sheet for one strand: the desktop strand window's content.
   ‹ › step strands; × / scrim / Esc / swipe down close. */
function StrandSheet({ cat, onClose, onStep }: { cat: CategoryId; onClose: () => void; onStep: (d: number) => void }) {
  const c = categoryById(cat)!
  const os = outputsIn(cat)
  const idx = STAFF_ORDER.indexOf(cat)
  const swipe = useSwipeDown(onClose)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopImmediatePropagation()
      closeRef.current()
    }
    window.addEventListener('keydown', onKey, { capture: true })
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'          // page doesn't scroll under the sheet
    return () => {
      window.removeEventListener('keydown', onKey, { capture: true })
      document.body.style.overflow = overflow
    }
  }, [])

  return createPortal(
    <>
      <div className={s.scrim} onClick={onClose} />
      <section className={s.sheet} role="dialog" aria-modal="true" aria-label={STRAND[cat].name}
        style={swipe.style}>
        <span className={s.crop} aria-hidden="true" />
        <div className={s.bar} {...swipe.handlers}>
          <span className={s.grab} aria-hidden="true" />
          <span>{c.num} · {STRAND[cat].name.toLowerCase()}</span>
          <span className={s.ctrls}>
            <button type="button" disabled={idx === 0} onClick={() => onStep(-1)} aria-label="Previous strand">‹</button>
            <button type="button" disabled={idx === STAFF_ORDER.length - 1} onClick={() => onStep(1)} aria-label="Next strand">›</button>
            <button type="button" className={s.x} onClick={onClose} aria-label="Close">×</button>
          </span>
        </div>
        <div className={s.sheetBody}>
          <p className={s.kick}>{subtitle(cat).replace('§ ', '')} ✲ {categoryStatus(cat)}</p>
          <div className={s.sheetHead}>
            <StrandMark cat={cat} selected className={s.sheetMark} />
            <div>
              <h2 className={s.sheetName}>{STRAND[cat].name}</h2>
              <span className={s.verb}>{c.verb}.</span>
            </div>
          </div>
          <p className={s.sheetPurpose}>{c.purpose}.</p>
          <dl className={s.fields}>
            <div><dt>{cat === 'advisory' ? 'services' : 'projects'}</dt><dd>{pad2(os.length)}</dd></div>
            <div><dt>{cat === 'advisory' ? 'covers' : 'typical outputs'}</dt><dd>{c.typicalOutputs}</dd></div>
            {cat !== 'advisory' && <div><dt>regulatory class</dt><dd>{c.typicalRegClass}</dd></div>}
          </dl>
          <div className={s.rows}>
            {os.length ? os.map((o) => <ProjectRow key={o.id} o={o} />) : <p className={s.empty}>no projects yet</p>}
          </div>
          {cat === 'advisory'
            ? <a className={s.cta} href={advisoryMail()}>Email {CONTACT_EMAIL} <span aria-hidden="true">↦</span></a>
            : <a className={s.cta} href={catHref(cat)}>View {c.label.toLowerCase()} <span aria-hidden="true">→</span></a>}
        </div>
      </section>
    </>,
    document.body,
  )
}
