import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import * as THREE from 'three'
import StrandPanel from '../StrandPanel'
import MarginaliaTab from '../MarginaliaTab'
import SerpentIntro from './SerpentIntro'
import type { LoaderMode } from '../Loaders/LoaderShared'
import { adjustTextScale, applyTextScale, TEXT_STEP } from '../../lib/textScale'
import type { Strand as DataStrand } from '../../data/strands'
import {
  OUTPUTS, CATEGORIES, HELIX_CATEGORIES, categoryById, typeById, stageLabel, outputName, affiliationLabel,
  categoryStatus, outputsIn, pad2, LINK_LABEL, isOpen, STRAND, type Output,
  outputById, isAdvisory, advisoryFor,
} from '../../data/framework'
import { ADVISORY_GOLD, ADVISORY_INK } from '../../data/advisory'
import Padlock, { LOCK_SVG } from '../Padlock'
import './helix3d.css'
import { PT, aufPath, emblemImg, productMarksReady, layout3b, productTileHTML, AUF_ID, markWord, WORD } from '../ProductMark'
import { markIntroDone, skipIntroAlways } from '../../lib/introGate'
import { useSwipeDown } from '../../lib/useSwipeDown'
import { CONTACT_EMAIL } from '../../data/people'

/* =================================================================
   Mentheon — Helix3D · click-to-panel variant (Rod of Asclepius)

   IN-BETWEEN VARIANT. Scroll/swipe traverses the spiral node by
   node (snap + camera dolly in) WITHOUT opening anything; the
   focused (or hovered) node shows a "view more" bubble. Clicking
   the bubble or the node opens the real StrandPanel as a centre
   modal (concept data adapted via toDataStrand). Scrolling past
   the first node (up) or last node (down) returns to the DEFAULT
   view: wide camera, gentle idle spin, nothing selected. The
   scroll-LOCKED variant (auto-opens, clamps at ends) is the frozen
   sibling ScrollLockView.tsx — change behaviour here, not there.

   Faithful React port of the standalone v5 WebGL prototype. The
   imperative scene/loader logic lives in a single mount effect and
   is scoped to this component's root element (not `document` /
   `:root`) so it can live on its own route without taking over the
   rest of the site. Everything is torn down on unmount.

   ── FILE MAP (where to change things) ───────────────────────────
     • STRANDS / ICONS .......... the six research strands + list
                                  glyphs. Edit these for content.
     • ./HelixIntro ............. loader splash + sound/silent gate
                                  (markup, SVG, runLoader/runGate).
     • useEffect(() => {...}) ... ALL behaviour, in one mount block:
         - cssVar / themeColours .. bridge CSS tokens → 3D colours
         - HelixCurve ............. the spiral the coil follows
         - ROD / SERPENT / NODE ... geometry tuning dials
         - initThree + build* ..... scene construction
         - render / loop .......... the per-frame animation
         - BOOT ................... awaits ./HelixIntro then starts
         - return () => {...} ..... teardown (dispose + listeners)
     • return ( <div .../> ) .... the DOM/markup + all static text.

   Styling lives entirely in ./helix3d.css (scoped under
   `.helix3d-root`). This file owns structure + behaviour only.
   ================================================================= */

/* One research strand. Every field is surfaced in the UI:
     id        — internal handle (raycast hits, label data-id);
                 currently NOT used for navigation, just identity.
     name      — bold label by the orb + list-view title.
     subsidiary/tag — combined into the peek card kicker and the
                 list-view sub-line ("Aevorix · ageing technology").
     synopsis  — body copy shown in the peek card on hover.
     icon      — key into ICONS, drawn in the list view. */
/* Structure v3 (staff v3): six CATEGORY nodes down the coil —
   Plasmids (software) first at the head, then the five care-pathway
   categories in order, Perception at the free end. Each category's
   projects orbit its node as logo tiles. Content: src/data/framework.ts. */
interface Strand {
  id: string             // category id
  name: string
  subsidiary: string     // node-label sub line
  tag: string
  synopsis: string
  icon: string
  accent: string         // centre-headline accent
  category: string
  band: number           // position on the staff, 0 = head (Advisory), 1 = Plasmids
  outputs: Output[]
}
const ICON_BY_CAT: Record<string, string> = {
  detection: 'pulse', monitoring: 'wave', forecasting: 'trend', therapeutics: 'rings', perception: 'spark', plasmids: 'loop', advisory: 'grid',
}
/* Advisory (gold, consultancy services) heads the staff, above Plasmids. */
const STAFF_CATS = [categoryById('advisory')!, categoryById('plasmids')!, ...HELIX_CATEGORIES]
const STRANDS: Strand[] = STAFF_CATS.map((c, i) => {
  const os = outputsIn(c.id)
  return {
    id: c.id, name: c.label,
    subsidiary: c.id === 'advisory' ? `consultancy · ${pad2(os.length)} services`
      : `${c.id === 'plasmids' ? 'software' : c.verb.toLowerCase()} · ${pad2(os.length)} project${os.length === 1 ? '' : 's'}`,
    tag: c.purpose, synopsis: c.purpose, icon: ICON_BY_CAT[c.id], category: c.id, band: i, outputs: os,
    // Headline reads "A new era of <accent>"; Plasmids gets its own phrase.
    accent: c.id === 'plasmids' ? 'Novel Software' : c.id === 'advisory' ? 'Expert Advisory' : c.label,
  }
})
const PROJECT_PREFIX = 'out:'

/* Raw inner-SVG markup for each list-view glyph, keyed by the
   strand's `icon` field. To add a new glyph, add a key here and
   reference it from a strand; viewBox is fixed at 0 0 100 100. */
const ICONS: Record<string, string> = {
  rings: '<circle cx="50" cy="50" r="28" /><circle cx="35" cy="50" r="14"/><circle cx="65" cy="50" r="14"/>',
  spark: '<path d="M50 20 L55 45 L80 50 L55 55 L50 80 L45 55 L20 50 L45 45 Z"/>',
  wave:  '<path d="M15 50 L30 50 L36 30 L44 70 L52 25 L60 65 L66 50 L85 50"/>',
  brain: '<path d="M35 30 Q22 35 25 50 Q20 65 35 70 Q40 80 50 75"/><path d="M65 30 Q78 35 75 50 Q80 65 65 70 Q60 80 50 75"/><path d="M50 30 V 75"/>',
  pulse: '<circle cx="50" cy="50" r="8"/><circle cx="50" cy="50" r="18" stroke-dasharray="4 4"/><circle cx="50" cy="50" r="30" stroke-dasharray="2 8"/>',
  trend: '<path d="M18 72 L38 58 L52 64 L82 30"/><path d="M68 30 H82 V44"/>',
  loop:  '<circle cx="50" cy="50" r="24"/><circle cx="50" cy="50" r="33" stroke-dasharray="3 6"/>',
  grid:  '<rect x="25" y="25" width="20" height="20"/><rect x="55" y="25" width="20" height="20"/><rect x="25" y="55" width="20" height="20"/><rect x="55" y="55" width="20" height="20"/>',
}
/* Wrap an ICONS entry in an <svg>; falls back to the grid glyph
   for an unknown key. Used by buildList(). */
function iconSVG(key: string) { return `<svg viewBox="0 0 100 100">${ICONS[key] || ICONS.grid}</svg>` }

/* Adapt a concept Strand into the shape the pre-existing
   StrandPanel expects (src/data/strands `Strand`). StrandPanel only
   renders id/label/tagline/themes, so we map: name→label,
   subsidiary·tag→tagline, and surface the synopsis as a single
   theme card. Concept nodes deliberately don't carry the real
   strands' progress/objectives — this keeps all six nodes with
   their concept copy rather than collapsing to the 3 real strands. */
function toDataStrand(s: Strand): DataStrand {
  return {
    id: s.id,
    label: s.name,
    tagline: `${s.subsidiary} · ${s.tag}`,
    href: '#',
    themes: [{ title: s.tag, description: s.synopsis }],
  }
}

/* Window body for a focused output: kicker, title, synopsis, the
   classification fields, a compact stage line and links out. */
function OutputPeek({ o }: { o: Output }) {
  if (isAdvisory(o)) return <ServicePeek o={o} />
  const c = categoryById(o.category)!
  const t = typeById(o.type)
  return (
    <div className="output-peek">
      <p className="op-kicker">{`${c.num} · ${c.label.toLowerCase()}`} <span className="op-star">✲</span> {o.code.toLowerCase()}</p>
      <div className="op-title-row">
        <div className={`op-marks${o.id === AUF_ID ? ' op-marks--pair' : ''}`}>
          {/* Aufdröselung: its mark + Essen, side by side, no captions;
              plum in light mode, cream (white) in dark. Other products:
              their mark, crimson while the window is open. */}
          <figure className="op-mark"><LogoTile o={o} selected={o.id !== AUF_ID} /></figure>
          {o.id === AUF_ID && (
            <figure className="op-mark">
              <img className="op-mark-img op-mark-essen op-essen-light" src={`${import.meta.env.BASE_URL}essen-icon-plum.png`} alt="Essen" />
              <img className="op-mark-img op-mark-essen op-essen-dark" src={`${import.meta.env.BASE_URL}essen-icon-cream.png`} alt="Essen" />
            </figure>
          )}
        </div>
        <h2 className="op-title">{o.title}{o.placeholder && <span className="op-ph">placeholder</span>}</h2>
      </div>
      <p className="op-synopsis">{o.synopsis}</p>
      <dl className="op-fields">
        <div><dt>output type</dt><dd>{t.label}</dd></div>
        <div><dt>regulatory class</dt><dd>{o.regClass}</dd></div>
        <div><dt>affiliation</dt><dd>{affiliationLabel(o)}</dd></div>
      </dl>
      <div className="op-stage" aria-label={`Stage ${o.stage + 1} of ${t.stages.length}: ${stageLabel(o)}`}>
        <span className="op-stage-label">stage</span>
        <span className="op-dots" aria-hidden="true">
          {t.stages.map((_, i) => <span key={i} className={i < o.stage ? 'is-past' : i === o.stage ? 'is-current' : ''} />)}
        </span>
        <span className="op-stage-name">{pad2(o.stage + 1)} · {stageLabel(o)}</span>
      </div>
      <div className="op-actions">
        {isOpen(o) && <a className="op-cta" href={`#output/${o.id}`}>view details <span aria-hidden="true">→</span></a>}
        {o.link && <a className="op-link" href={o.link.href} target="_blank" rel="noreferrer">{LINK_LABEL[o.link.kind].toLowerCase()} <span aria-hidden="true">↦</span></a>}
        <a className="op-link" href={c.id === 'plasmids' ? '#plasmids' : `#category/${c.id}`}>{c.label.toLowerCase()} <span aria-hidden="true">→</span></a>
      </div>
    </div>
  )
}

/* Small DOM version of the orbiting logo tile (placeholder in the
   Mentheon tile format: ink square, stacked cream code). */
function LogoTile({ o, selected = false }: { o: Output; selected?: boolean }) {
  return <span style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: productTileHTML(o, selected) }} />
}
/* Project hovered in a window row → its 3D cube turns crimson too. */
const peekHover: { id: string | null } = { id: null }
/* Aufdröselung (PLA-01): its software logo + Essen, its character. */

/* Calls into the imperative scene from window content (set in the
   scene effect): open a project's / service's window in place. */
const sceneApi = { openProject: (_id: string) => {} }
const advisoryMail = (topic?: string) =>
  `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(topic ? `Advisory enquiry: ${topic}` : 'Advisory enquiry')}`

/* Advisory service window (one of the gold cubes): its boilerplate,
   what it covers, and the only action — email. No page behind it. */
function ServicePeek({ o }: { o: Output }) {
  const a = advisoryFor(o)!
  return (
    <div className="output-peek adv-peek">
      <p className="op-kicker">ad · advisory <span className="op-star">✲</span> {a.num} of {pad2(outputsIn('advisory').length)}</p>
      <div className="op-title-row">
        <div className="op-marks"><figure className="op-mark"><LogoTile o={o} /></figure></div>
        <h2 className="op-title">{a.label}</h2>
      </div>
      <p className="op-synopsis">{a.lede}</p>
      {a.body.map((p, i) => <p key={i} className="adv-text">{p}</p>)}
      <ul className="adv-covers">{a.covers.map((c) => <li key={c}>{c}</li>)}</ul>
      <p className="adv-more">For more details, email <a href={advisoryMail(a.label)}>{CONTACT_EMAIL}</a></p>
      <div className="op-actions">
        <a className="op-cta" href={advisoryMail(a.label)}>email about {a.short.toLowerCase()} <span aria-hidden="true">↦</span></a>
      </div>
    </div>
  )
}

/* Advisory node window: what it is, its four services (each opens its
   service window in place), and email. */
function AdvisoryPeek({ s }: { s: Strand }) {
  return (
    <div className="output-peek adv-peek">
      <p className="op-kicker">ad · head of the staff · consultancy <span className="op-star">✲</span> by enquiry</p>
      <div className="cp-head">
        <h2 className="op-title">Advisory</h2>
        <span className="cp-verb adv-verb">Advise.</span>
      </div>
      <p className="op-synopsis">Consultancy and advisory services across research, design and development. Choose a field for details.</p>
      <div className="cp-projects">
        {s.outputs.map((o) => (
          <button key={o.id} type="button" className="cp-project" onClick={() => sceneApi.openProject(o.id)}
            onPointerEnter={(e) => { if (e.pointerType === 'mouse') peekHover.id = o.id }}
            onPointerLeave={() => { peekHover.id = null }}
            onFocus={() => { peekHover.id = o.id }} onBlur={() => { peekHover.id = null }}>
            <LogoTile o={o} />
            <span className="cp-project-text">
              <span className="cp-project-name">{o.title}</span>
              <span className="cp-project-sub">{o.synopsis}</span>
            </span>
            <span className="cp-arrow" aria-hidden="true">→</span>
          </button>
        ))}
      </div>
      <p className="adv-more">For more details, email <a href={advisoryMail()}>{CONTACT_EMAIL}</a></p>
      <div className="op-actions">
        <a className="op-cta" href={advisoryMail()}>email nicholas <span aria-hidden="true">↦</span></a>
      </div>
    </div>
  )
}

/* Window body for a focused category: verb, purpose, derived status
   and its projects (each opens its summary page). */
function CategoryPeek({ s }: { s: Strand }) {
  if (s.category === 'advisory') return <AdvisoryPeek s={s} />
  const c = categoryById(s.category)!
  return (
    <div className="output-peek">
      <p className="op-kicker">{c.num} · {c.id === 'plasmids' ? 'experimental software' : 'care pathway'} <span className="op-star">✲</span> {categoryStatus(c.id)}</p>
      <div className="cp-head">
        <h2 className="op-title">{c.label}</h2>
        <span className="cp-verb">{c.verb}.</span>
      </div>
      <p className="op-synopsis">{c.purpose}.</p>
      <dl className="op-fields">
        <div><dt>projects</dt><dd>{pad2(s.outputs.length)}</dd></div>
        <div><dt>typical outputs</dt><dd>{c.typicalOutputs}</dd></div>
        <div><dt>typical regulatory class</dt><dd>{c.typicalRegClass}</dd></div>
      </dl>
      {s.outputs.length ? (
        <div className="cp-projects">
          {s.outputs.map((o) => {
            const body = (
              <>
                <LogoTile o={o} />
                <span className="cp-project-text">
                  <span className="cp-project-name">{outputName(o)}</span>
                  <span className="cp-project-sub">{typeById(o.type).label.toLowerCase()} · {stageLabel(o).toLowerCase()}</span>
                </span>
              </>
            )
            // No public page yet: listed in its strand, padlocked, not linked.
            return isOpen(o) ? (
              <a key={o.id} className="cp-project" href={`#output/${o.id}`}
                onPointerEnter={(e) => { if (e.pointerType === 'mouse') peekHover.id = o.id }}
                onPointerLeave={() => { peekHover.id = null }}
                onFocus={() => { peekHover.id = o.id }} onBlur={() => { peekHover.id = null }}>
                {body}
                <span className="cp-arrow" aria-hidden="true">→</span>
              </a>
            ) : (
              <div key={o.id} className="cp-project is-locked" title="Details coming soon">
                {body}
                <span className="cp-lock"><Padlock /><span className="sr-only">details coming soon</span></span>
              </div>
            )
          })}
        </div>
      ) : <p className="list-empty" style={{ paddingLeft: 0 }}>no projects yet</p>}
      <div className="op-actions" style={{ marginTop: '1.3rem' }}>
        <a className="op-cta" href={c.id === 'plasmids' ? '#plasmids' : `#category/${c.id}`}>view category <span aria-hidden="true">→</span></a>
      </div>
    </div>
  )
}

/* nodeStyle: 'classic' = grape orbs sitting proud of the coil (default);
   'embedded' = solid crimson beads centred inside the serpent's body. */
/* cubeMomentum: when the staff is spun and then stops, the cubes keep
   turning on their own axis with the spin's momentum, decaying, until a
   node/cube is hovered or a key is pressed (then all settle face-on). */
/* cubeLook (comparison): how the cubes show they're 3D.
   'lit' = scene-lit sides · 'gradient' = sides fade dark toward the back
   · 'outline' = lit sides + contrasting edge lines · 'shadow' = gradient
   sides + soft drop shadow behind. */
type CubeLook = 'lit' | 'gradient' | 'outline' | 'shadow'
/* cubeReturn: seconds the cubes coast after a fast spin before turning
   back to face front. */
export default function Helix3D({ skipIntro = false, nodeStyle = 'embedded', cubeMomentum = true, cubeLook = 'outline', cubeReturn = 1.5, alwaysIntro = false }: { skipIntro?: boolean; nodeStyle?: 'classic' | 'embedded'; cubeMomentum?: boolean; cubeLook?: CubeLook; cubeReturn?: number; alwaysIntro?: boolean } = {}) {
  /* The single React-managed DOM node. All imperative DOM access
     and the Three.js canvas live inside it; nothing escapes it. */
  const rootRef = useRef<HTMLDivElement>(null)

  /* Boot-splash palette. Resolved from the shared per-session theme
     key (`mnth:theme`, also used by the Marginalia page) so light/
     dark carries across pages; defaults dark here when unset. Read
     before first paint so data-theme matches with no flash. */
  const [introMode] = useState<LoaderMode>(() => {
    try {
      const s = sessionStorage.getItem('mnth:theme')
      return s === 'light' || s === 'dark' ? s : 'dark'
    } catch {
      return 'dark'
    }
  })

  /* SERPENT INTRO (logo sketch → ink → 3D serpent → staff). Shown on
     the first view of the session unless skipIntro; BOOT awaits
     introDoneRef before starting the scene. */
  const [introOn, setIntroOn] = useState(() => {
    if (skipIntro) return false
    if (alwaysIntro) return true             // preview pages: replay every load
    if (skipIntroAlways()) return false      // "skip always" ticked on the intro
    try { return sessionStorage.getItem('mnth:helixIntroSeen') !== '1' } catch { return true }
  })
  const introDoneRef = useRef<() => void>(() => {})

  /* StrandPanel modal lives in React state (the imperative scene
     can't render JSX). The effect opens it via setPanelStrand;
     `closePanelRef` lets the React close handler call back into the
     effect (resume spin, pull the camera out). */
  const [panelStrand, setPanelStrand] = useState<DataStrand | null>(null)
  const closePanelRef = useRef<() => void>(() => {})
  const handlePanelClose = () => {
    setPanelStrand(null)
    closePanelRef.current()
  }
  // A row's cube highlight (peekHover) must not outlive the window:
  // taps never send a "leave", and rows unmount without blurring.
  useEffect(() => { if (!panelStrand) peekHover.id = null }, [panelStrand])
  // Phones: the window is a bottom sheet — swipe its bar down to close.
  const winSwipe = useSwipeDown(handlePanelClose)

  /* Strand WINDOW state. 'dock' = default: tethered beside the
     focused node, positioned per frame by updateLabels(). 'free' =
     user has moved/resized it (winRect, viewport px). 'max' = fills
     the stage inside the chrome. The scene reads winModeRef so it
     only tethers while docked. Closing always resets to 'dock'. */
  type WinMode = 'dock' | 'free' | 'max'
  const [winMode, setWinModeState] = useState<WinMode>('dock')
  const [winRect, setWinRect] = useState<{ x: number; y: number; w: number; h: number | null }>({ x: 0, y: 0, w: 720, h: null })
  const winModeRef = useRef<WinMode>('dock')
  const preMaxRef = useRef<WinMode>('dock')
  const setWinMode = (m: WinMode) => { winModeRef.current = m; setWinModeState(m) }
  useEffect(() => { if (!panelStrand) setWinMode('dock') }, [panelStrand])

  const drawerRect = () => {
    const el = rootRef.current?.querySelector('#strand-drawer') as HTMLElement | null
    return el ? el.getBoundingClientRect() : null
  }
  /* Title-bar drag → move. Starts from the window's current on-screen
     rect so a docked window lifts off exactly where it is. */
  const onWinDragStart = (e: ReactPointerEvent) => {
    if (e.button !== 0 || winModeRef.current === 'max') return
    if (window.matchMedia('(max-width: 720px)').matches) return   // phones: fixed bottom sheet
    if ((e.target as HTMLElement).closest('button')) return
    const r = drawerRect(); if (!r) return
    e.preventDefault()
    const sx = e.clientX, sy = e.clientY
    const h0 = winModeRef.current === 'free' ? winRect.h : null
    setWinRect({ x: r.left, y: r.top, w: r.width, h: h0 })
    setWinMode('free')
    const move = (ev: PointerEvent) => {
      const vw = window.innerWidth, vh = window.innerHeight
      const x = Math.max(16 - r.width + 120, Math.min(vw - 120, r.left + ev.clientX - sx))
      const y = Math.max(40, Math.min(vh - 48, r.top + ev.clientY - sy))
      setWinRect((p) => ({ ...p, x, y }))
    }
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }
  /* Corner grip → resize (min 380 × 260). */
  const onWinResizeStart = (e: ReactPointerEvent) => {
    if (e.button !== 0) return
    const r = drawerRect(); if (!r) return
    e.preventDefault(); e.stopPropagation()
    const sx = e.clientX, sy = e.clientY
    setWinRect({ x: r.left, y: r.top, w: r.width, h: r.height })
    setWinMode('free')
    const move = (ev: PointerEvent) => {
      const w = Math.max(380, Math.min(window.innerWidth - r.left - 8, r.width + ev.clientX - sx))
      const h = Math.max(260, Math.min(window.innerHeight - r.top - 8, r.height + ev.clientY - sy))
      setWinRect((p) => ({ ...p, w, h }))
    }
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }
  const onWinMin = () => setWinMode('dock')
  const onWinMax = () => {
    if (winModeRef.current === 'max') setWinMode(preMaxRef.current)
    else { preMaxRef.current = winModeRef.current; setWinMode('max') }
  }
  const panelIdx = panelStrand ? STRANDS.findIndex((x) => x.id === panelStrand.id) : -1
  const panelOut = panelStrand?.id.startsWith(PROJECT_PREFIX) ? outputById(panelStrand.id.slice(PROJECT_PREFIX.length)) ?? null : null
  const panelS = panelOut ? STRANDS.find((x) => x.category === panelOut.category) ?? null : panelIdx >= 0 ? STRANDS[panelIdx] : null
  const panelCat = panelS ? categoryById(panelS.category)! : null
  const panelIdRef = useRef<string | null>(null)
  panelIdRef.current = panelStrand?.id ?? null

  /* Navigation pop-out (top right). Shown once the scene starts,
     unless dismissed this session; '?' toggles it. */
  const HELP_KEY = 'mnth:helix-help'
  const [helpOpen, setHelpOpen] = useState(false)

  /* Phone dock (≤720px, CSS-only visibility): ‹ strand · n of 06 ›.
     dockIdx mirrors the scene's focusIndex (polled in the render loop);
     the refs call back into the scene. */
  const [dockIdx, setDockIdx] = useState(-1)
  const dockStepRef = useRef<(dir: number) => void>(() => {})
  const dockOpenRef = useRef<() => void>(() => {})

  /* The scene fills the screen: no page scroll, rubber-band or
     pull-to-refresh behind it (matters on phones). */
  useEffect(() => {
    const h = document.documentElement, b = document.body
    const prev = [h.style.overflow, b.style.overflow, h.style.overscrollBehavior, b.style.overscrollBehavior]
    h.style.overflow = 'hidden'; b.style.overflow = 'hidden'
    h.style.overscrollBehavior = 'none'; b.style.overscrollBehavior = 'none'
    return () => { [h.style.overflow, b.style.overflow, h.style.overscrollBehavior, b.style.overscrollBehavior] = prev }
  }, [])
  const showHelpRef = useRef<(force?: boolean) => void>(() => {})
  showHelpRef.current = (force = false) => {
    if (force) { setHelpOpen((o) => !o); return }
    try { if (sessionStorage.getItem(HELP_KEY) === 'dismissed') return } catch { /* noop */ }
    setHelpOpen(true)
  }
  const dismissHelp = () => {
    setHelpOpen(false)
    try { sessionStorage.setItem(HELP_KEY, 'dismissed') } catch { /* noop */ }
  }

  /* One mount effect owns the entire lifecycle. Empty dep array =>
     runs once after first paint (twice in StrictMode dev, but the
     teardown below makes that safe). All scene/loader state is
     declared as closures here so it's GC'd on unmount. */
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    /* Scoped DOM helpers — everything queries within this component's
       root rather than `document`, so a second instance / StrictMode
       remount can't cross-talk and nothing leaks to the wider site. */
    const $ = <T extends Element = HTMLElement>(sel: string) =>
      root.querySelector(sel) as T | null
    const $$ = (sel: string) =>
      Array.from(root.querySelectorAll(sel)) as HTMLElement[]

    /* `destroyed` is checked by async continuations and the RAF loop
       so a fast unmount (or StrictMode's immediate re-run) can't keep
       animating a dead scene. `cleanups` collects teardown closures
       (timeouts, listeners) flushed by the effect's return fn. */
    let destroyed = false
    const cleanups: Array<() => void> = []

    /* ---- THEME-AWARE COLOUR HELPERS (read from root, not :root) ----
       The 3D materials don't know about CSS. This bridge reads the
       resolved CSS custom properties off the root element (which
       carries data-theme), so editing a colour token in helix3d.css
       — or toggling the theme — re-tints the whole scene via
       refreshSceneColours(). Read on the root, never document, so
       light/dark stays scoped to this route. */
    function cssVar(name: string) {
      return getComputedStyle(root!).getPropertyValue(name).trim()
    }
    /* Snapshot the current palette as THREE.Color instances.
       Called any time geometry is (re)coloured. */
    function themeColours() {
      return {
        ink:     new THREE.Color(cssVar('--ink')),
        crimson: new THREE.Color(cssVar('--crimson')),
        grape:   new THREE.Color(cssVar('--grape')),
        plum:    new THREE.Color(cssVar('--plum')),
        bg:      new THREE.Color(cssVar('--bg')),
      }
    }

    /* Rod material colour. Solid: --ink (its normal colour). Trace:
       the INVERSE of the background so it stays visible — the cream
       --white in dark mode, and dark (--ink, i.e. plum) only when
       light mode is on. */
    function rodColour() {
      if (!rodTrace) return new THREE.Color(cssVar('--ink'))
      const isLight = root!.getAttribute('data-theme') !== 'dark'
      return new THREE.Color(isLight ? cssVar('--ink') : (cssVar('--white') || '#FFECE1'))
    }

    /* ---- HELIX CURVE — single serpent winding around the rod ----
       The single source of truth for the spiral's shape. Both the
       TubeGeometry (the serpent body) and the node placement sample
       this curve, so changing getPoint() reshapes everything
       consistently. */
    class HelixCurve extends THREE.Curve<THREE.Vector3> {
      radius: number
      height: number
      turns: number
      constructor(radius: number, height: number, turns: number) {
        super()
        this.radius = radius
        this.height = height
        this.turns = turns
      }
      /* t ∈ [0,1] → world point. y descends from +height/2 (top,
         t=0, where the head sits) to -height/2 (bottom). The angle
         sweeps `turns` full revolutions; x/z trace the circle of
         radius r. Make r a function of t here for a cone/taper. */
      getPoint(t: number, target = new THREE.Vector3()) {
        const r = this.radius
        const y = this.height / 2 - this.height * t
        const angle = t * this.turns * Math.PI * 2
        const x = r * Math.cos(angle)
        const z = r * Math.sin(angle)
        return target.set(x, y, z)
      }
    }

    /* ---- SCENE CONFIG — the main tuning dials ----
       All units are Three.js world units. The camera (see initThree)
       shows roughly ±2.44 vertically at the default distance, so keep
       geometry inside that to avoid clipping at narrow aspect ratios. */

    /* The central staff. `height` deliberately exceeds the visible
       frame so the rod runs off top & bottom; `knobR` is the crimson
       sphere capping the top. */
    /* Experiment levers (URL, e.g. #helix3d?skipIntro=true&coilR=1.1&pitch=1.3):
       coilR = coil radius (default 0.8); pitch = coil height × (default 1,
       more vertical room between neighbouring nodes). Not shown in the UI;
       the intro still lands on the default coil. */
    const coilQ = new URLSearchParams(window.location.hash.split('?')[1] || '')
    const COIL_R = THREE.MathUtils.clamp(Number(coilQ.get('coilR')) || 0.8, 0.5, 2)
    const PITCH = THREE.MathUtils.clamp(Number(coilQ.get('pitch')) || 1, 0.6, 2)
    const ROD = { radius: 0.05, height: 5.2 * PITCH, knobR: 0.10 }

    /* The coil. radius = how far it wraps out from the rod;
       turns = revolutions over its height (more turns / less height
       = tighter pitch); bodyR = tube thickness; tubeSegs/radialSegs =
       mesh smoothness vs. cost. Kept tight (0.8 × 3.6) so all six
       nodes stay on-screen across aspect ratios. */
    const SERPENT = {
      radius: COIL_R, height: 3.6 * PITCH, turns: 3,
      bodyR: 0.085, tubeSegs: 220, radialSegs: 14,
    }

    /* The glowing strand markers. count MUST equal STRANDS.length;
       orbR = orb size; ringR1/ringR2 = the two pulse-ring radii;
       pulseSpeed = pulses per second. */
    const NODE = {
      count: STRANDS.length, orbR: 0.16, ringR1: 0.22, ringR2: 0.30, pulseSpeed: 0.25,
    }

    /* Project logo tiles orbiting each category node. orbitR = world
       radius of the orbit; speed = rad/s; size = screen fraction of the
       viewport height (sizeAttenuation off) at far / near camera
       distance, so tiles stay legible zoomed out and grow on approach. */
    /* Project tiles are small CUBES: front face = the project's logo
       tile, back face = the Mentheon logo, sides = theme ink. Edge
       length is set per frame as a fraction of the visible frustum
       height at the cube's distance (sizeFar → sizeNear), so they keep
       a steady on-screen size zoomed out and grow on approach. */
    /* v5: cubes are PARKED beside their node, facing the viewer:
       [item 1] — (node) — [item 2], then above / below for more
       (SLOTS, in screen-space units). A small fixed tilt keeps the
       side faces visible so they read as cubes. gap = node-centre to
       cube-centre distance in cube widths. */
    const LOGO = { sizeFar: 0.02625, sizeNear: 0.0525, gap: 1.55, tiltX: -0.32, tiltY: 0.5,
      /* Up close (node focused) the cubes ease into square SELECTION
         TILES set right against the node's outer ring, facing the camera
         square-on: tileFrac = edge as a fraction of viewport height;
         tileDepth = thickness relative to edge (1 = full cube, so the
         side cubes show their sides in perspective while flipping
         strands); tileGap = world clearance from the ring. Coil + node
         stay clear in the middle. */
      tileFrac: 0.17, tileDepth: 1, tileGap: 0.03, ease: 6 }
    const tileMix: number[] = []
    /* Slot order: 9, 3, 12 and 6 o'clock first (so four cubes, e.g.
       Advisory's services, sit in a fixed cross around their node). */
    const SLOTS: [number, number][] = [[-1, 0], [1, 0], [0, 1], [0, -1], [-1, 1], [1, 1], [-1, -1], [1, -1]]
    /* Plasmids node: a closed loop instead of a sphere. */
    const PLASMID = { loopR: 0.15, tubeR: 0.032 }

    /* ---- Scene-graph handles & interaction state ----
       `rotor` is the spinning group that holds the serpent + nodes;
       the rod is added to the scene directly so it stays still.
       `nodes` pairs each strand with its meshes + rotor-local
       position; `nodePickables` is the raycast target list. */
    const container = $('#helix3d') as HTMLDivElement
    let renderer: THREE.WebGLRenderer
    let scene: THREE.Scene
    let camera: THREE.PerspectiveCamera
    let rotor: THREE.Group
    let rod: THREE.Group
    let serpentMesh: THREE.Mesh & { userData: { head?: THREE.Group } }
    /* Sketch-mode alternative for the coil: the external sketch of
       the tube — only longitudinal lines along the helix (no cross
       rings), LineSegments, theme --ink. Built next to serpentMesh;
       exactly one of the two is visible — see applySketchMode. */
    let serpentLine: THREE.Line
    /* Second sketch style: the tube's triangulated edges
       (WireframeGeometry) — a faceted "polygon trace". */
    let serpentPoly: THREE.Line
    /* Render style is FIXED (the nav debug toggles were removed):
       the site always shows a poly-sketch. */
    let sketchMode = true
    /* Sketch style while sketchMode: false = longitudinal line
       trace (serpentLine), true = polygon wireframe (serpentPoly).
       Default true → faceted polygon trace. */
    let polyMode = true
    /* Render the central rod as a --bg-coloured wireframe trace so
       it reads as a faint outline. Default true → sketched rod. */
    let rodTrace = true
    /* When true the node orbs render solid & opaque even in sketch
       mode. Default false → non-solid (wireframe) nodes. */
    let nodeSolid = false
    let serpentCurve: HelixCurve
    interface NodeRec {
      strand: Strand
      t: number
      orb: THREE.Mesh
      ring1: THREE.Mesh
      ring2: THREE.Mesh
      orbPos: THREE.Vector3     // rest position (rotor-local)
      hit?: THREE.Mesh          // invisible pick sphere, follows the orb
      tOff?: number             // collision-avoidance slide along the coil (t units)
      avoidDir?: number         // its committed slide direction while threatened (±1, 0 = none)
    }
    const nodes: NodeRec[] = []
    const nodePickables: THREE.Object3D[] = []
    /* Orbiting logo sprites: parent node index + phase. */
    const logos: { sprite: THREE.Mesh; node: number; phase: number; o: Output }[] = []
    let mentheonLogoTex: THREE.Texture | null = null
    /* Essen (Aufdröselung's character) bobs and drifts around the
       Aufdröselung cube. Pixel art: nearest-neighbour filtering, drawn
       on top like the cubes, screen-steady size (sizeFar → sizeNear). */
    /* Essen is small (well under the cube), and every few seconds plays
       a short action: a little hop with a squash, then swaps through
       his poses (hungry → eating → full) before returning to idle. */
    const ESSEN = { sizeFar: 0.014, sizeNear: 0.028, drift: 0.9, bob: 2.2, every: 6.5, actLen: 1.6 }
    let essen: THREE.Sprite | null = null
    const essenTex: Record<string, THREE.Texture> = {}
    let hoveredOutput: string | null = null
    let pointerSection: string | null = null   // section cube under the cursor
    let activeNodePointLight: THREE.PointLight

    let raycaster: THREE.Raycaster
    const pointer = new THREE.Vector2(-9999, -9999)
    let hoveredId: string | null = null
    let animationActive = false
    let rafId = 0

    /* Rotation model: scroll-driven, no auto-spin. `rotorAngle` is
       the live Y rotation; `rotorTarget` (when non-null) is the
       angle being eased toward — set by focusByIndex() when a
       scroll/swipe steps to a node, and by the click snap. The coil
       rests on the focused node when idle. */
    let rotorAngle = 0
    let rotorTarget: number | null = null

    /* Drag-to-spin + inertia. While `dragging`, horizontal pointer
       motion rotates the rotor directly (DRAG_SENS rad/px). On
       release the last velocity becomes `spinVel` (rad/s) and
       decays each frame (SPIN_DECAY retained per second) until it
       drops below SPIN_STOP, then idle behaviour resumes.
       `dragMoved` flags a genuine drag so the trailing click
       doesn't also focus/open a node; `suppressClick` carries that
       to the click handler. */
    let dragging = false
    let dragMoved = false
    let dragStartX = 0
    let dragLastX = 0
    let dragLastT = 0
    let spinVel = 0
    const SPIN_MAX = 14            // rad/s cap for flings and swipe coasts
    /* Two-finger halt: freezes the staff completely — fling, idle
       auto-rotation and cube momentum while the fingers are on the
       trackpad (incl. a sideways swipe placing it by hand); released
       when the fingers lift (see STALL_RELEASE), a drag or exitToDefault. */
    let stallHold = false
    /* Fingers lifted = the trackpad stops sending wheel events. Once
       none have arrived for STALL_RELEASE ms the hold lifts and the idle
       turn resumes (browsers can't see resting fingers, only movement). */
    let lastWheelT = 0
    let gAxis: 'x' | 'y' | null = null, gX = 0, gY = 0, swVel = 0
    /* Swipe end: when sideways events stop, decide once (swPending).
       If they'd been shrinking steadily (OS inertia, swDecayN ≥ 4) and
       cut off, two fingers touched down → halt. Otherwise the fingers
       lifted with no OS inertia → fling on at the swipe's speed. */
    let swPending = false, swDecayN = 0, swPrevDx = 0
    const STALL_RELEASE = 900
    let suppressClick = false
    const DRAG_SENS = 0.006        // rotor radians per px — trackpad sideways swipe
    /* Click-and-drag has its own, gentler gain: 0.006 made a drag feel
       twitchy. Lower = more px of drag per turn (0.003 ≈ 2090px/turn). */
    const DRAG_SENS_POINTER = 0.003
    /* Drag release speed is measured over this window (not from the last
       pointer event, whose tiny dt read as 20–40 rad/s flings), then
       capped at SPIN_MAX like the swipe coast. */
    const FLING_WINDOW_MS = 100
    /* The rotor follows the drag target with this time constant, once
       per frame: smooths pointer events that don't line up with frames
       without a perceptible delay. */
    const DRAG_FOLLOW_S = 0.03
    let dragTarget = 0
    const dragHist: { t: number; a: number }[] = []
    const DRAG_CLICK_PX = 5        // under this travel = a click, not a drag
    const SPIN_DECAY = 0.22        // fraction of velocity kept per second
    const SPIN_STOP = 0.02         // rad/s below which inertia ends

    /* Scroll navigation + camera dolly. `focusIndex` is the node the
       coil is parked on. Each frame the camera eases toward
       camPosTarget while looking at camLookCurrent (itself eased
       toward camLookTarget); a focused node is framed CAM_DOLLY
       units away (vs the ~8.5 resting distance). */
    /* focusIndex tracks scroll traversal across the range
       -1 .. NODE.count. The two extremes (-1 and NODE.count) are the
       DEFAULT view (wide camera, gentle idle spin, nothing
       selected). 0..count-1 mean the coil is parked + zoomed on
       that node, showing its "view more" bubble. Starts default. */
    let focusIndex = -1
    const isFocused = () => focusIndex >= 0 && focusIndex < NODE.count
    /* Gentle idle auto-spin (rad/sec) — default view only (not while
       focused, hovering, or paneled). */
    const ROTOR_FREE_SPEED = 0.05
    /* True while the StrandPanel modal is open: freezes the spin. */
    let panelOpen = false
    const CAM_DOLLY = 3.2
    /* Resting frame. The view is raised by REST.y (camera + target
       move up together, so the staff sits lower on screen) and pulled
       back slightly, so the head node and its label clear the fixed
       nav chrome (≈120px) on short viewports. */
    const REST = { y: 0.32, z: 9.1 }
    /* Fit the resting frame to the free band between the fixed chrome:
       nav bottom (measured) and footer top (measured), with margins.
       The staff's content span — head node label/cubes to the free-end
       label — is mapped onto that band: distance from the span/band
       ratio, height so the span's midpoint lands on the band's. */
    /* The snake (rotor: coil, head, nodes, cubes) is dropped by
       SNAKE.drop so the head sits well inside the frame and the tail
       trails off the bottom; nodes ride higher on the coil (tStart →
       tEnd) so the last category stays in view above the trailing tail. */
    const SNAKE = { drop: 0.5, tStart: 0.03, tEnd: 0.84 }
    const yOnCoil = (t: number) => SERPENT.height / 2 - SERPENT.height * t - SNAKE.drop
    const CONTENT = { top: SERPENT.height / 2 + 0.34 - SNAKE.drop, bottom: yOnCoil(SNAKE.tEnd) - 0.42 }
    function fitRest() {
      const box = container.getBoundingClientRect()
      const hpx = box.height || window.innerHeight
      const navEl = $('.nav'), footEl = $('.footer-strip')
      const top = (navEl ? navEl.getBoundingClientRect().bottom - box.top : 120) + 18
      const bottom = (footEl ? footEl.getBoundingClientRect().top - box.top : hpx - 70) - 18
      const band = Math.max(120, bottom - top)
      const span = CONTENT.top - CONTENT.bottom
      const tanH = Math.tan(THREE.MathUtils.degToRad((camera?.fov ?? 32) / 2))
      const Hw = (span * hpx) / band                     // world height the viewport must show
      REST.z = THREE.MathUtils.clamp(Hw / (2 * tanH), 8.0, 16)
      const HwReal = 2 * REST.z * tanH
      const mid = (CONTENT.top + CONTENT.bottom) / 2
      const bandMidPx = (top + bottom) / 2
      REST.y = mid + ((bandMidPx - hpx / 2) * HwReal) / hpx
      if (!isFocused() && !panelOpen) { camPosTarget.set(0, REST.y, REST.z); camLookTarget.set(0, REST.y, 0) }
    }
    const camPosTarget   = new THREE.Vector3(0, REST.y, REST.z)
    const camLookTarget  = new THREE.Vector3(0, REST.y, 0)
    const camLookCurrent = new THREE.Vector3(0, REST.y, 0)

    /* Build the renderer, camera, lights and all geometry, and wire
       canvas pointer/resize listeners. Called once from BOOT. */
    function initThree() {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      // DPR: 1.5× cap on desktop, full density on phones (pixelRatio()).
      renderer.setPixelRatio(pixelRatio())
      renderer.setSize(container.clientWidth, container.clientHeight)
      renderer.setClearColor(0x000000, 0)
      container.appendChild(renderer.domElement)

      scene = new THREE.Scene()
      /* FOV 32° + z=8.5 frames the staff. Lower FOV or larger z to
         "zoom out"; this pair is the easiest reframing knob. */
      camera = new THREE.PerspectiveCamera(32, container.clientWidth / container.clientHeight, 0.1, 100)
      fitRest()
      camera.position.set(0, REST.y, REST.z)
      camera.lookAt(0, REST.y, 0)
      camLookCurrent.set(0, REST.y, 0)

      /* Three-point-ish rig: soft ambient base, a strong key from
         front-right, a gentler fill from the left, and a warm rim
         from below-behind for edge separation. */
      scene.add(new THREE.AmbientLight(0xffffff, 0.35))

      const key = new THREE.DirectionalLight(0xffffff, 1.1)
      key.position.set(3, 4, 5)
      scene.add(key)

      const fill = new THREE.DirectionalLight(0xffffff, 0.5)
      fill.position.set(-4, 1, 3)
      scene.add(fill)

      const rim = new THREE.DirectionalLight(0xffd4b8, 0.4)
      rim.position.set(0, -2, -4)
      scene.add(rim)

      /* Crimson point light that fades in and tracks the hovered orb
         (see render()) — gives the active node a local glow. Starts
         at intensity 0. */
      const C = themeColours()
      activeNodePointLight = new THREE.PointLight(C.crimson, 0, 1.8, 2)
      scene.add(activeNodePointLight)

      /* Everything that rotates goes in `rotor`; the rod is added to
         `scene` separately so it stays fixed. */
      rotor = new THREE.Group()
      rotor.position.y = -SNAKE.drop
      scene.add(rotor)

      raycaster = new THREE.Raycaster()

      buildRod()
      buildSerpent()
      buildNodes()
      buildLogos()
      buildLabels()

      window.addEventListener('resize', onResize)
      const dom = renderer.domElement
      const onLeave = () => { pointer.x = -9999; pointer.y = -9999; setLabelHover(null) }
      dom.addEventListener('pointermove', onPointerMove)
      dom.addEventListener('pointerleave', onLeave)
      dom.addEventListener('click', onClick)
      dom.addEventListener('pointerdown', onDragDown)
      dom.addEventListener('pointermove', onDragMove)
      dom.addEventListener('pointerup', onDragUp)
      dom.addEventListener('pointercancel', onDragCancel)
      /* WebGL context loss (phones under GPU-memory pressure, e.g. while
         the intro's own canvas is alive) blanks the canvas for good if
         the browser never restores it. Three restores what it can; if
         nothing comes back within 1.2s, App remounts the scene. */
      let lostTimer = 0
      const onLost = () => {
        window.clearTimeout(lostTimer)
        lostTimer = window.setTimeout(() => {
          if (!destroyed) window.dispatchEvent(new CustomEvent('mnth:helix-reset'))
        }, 1200)
      }
      const onRestored = () => { window.clearTimeout(lostTimer); onResize() }
      dom.addEventListener('webglcontextlost', onLost)
      dom.addEventListener('webglcontextrestored', onRestored)
      cleanups.push(() => {
        window.clearTimeout(lostTimer)
        dom.removeEventListener('webglcontextlost', onLost)
        dom.removeEventListener('webglcontextrestored', onRestored)
        window.removeEventListener('resize', onResize)
        dom.removeEventListener('pointermove', onPointerMove)
        dom.removeEventListener('pointerleave', onLeave)
        dom.removeEventListener('click', onClick)
        dom.removeEventListener('pointerdown', onDragDown)
        dom.removeEventListener('pointermove', onDragMove)
        dom.removeEventListener('pointerup', onDragUp)
        dom.removeEventListener('pointercancel', onDragCancel)
      })
    }

    /* Central staff: a thin cylinder shaft, two slightly fatter
       "knot" bands near each end, and a crimson sphere knob on top.
       Mesh refs are stashed on userData so refreshSceneColours()
       can recolour them on theme change. */
    function buildRod() {
      const C = themeColours()
      const group = new THREE.Group()
      // Rod is built in wireframe-trace mode by default (rodTrace).
      // rodColour() returns the theme-correct trace colour when
      // rodTrace is on; refreshSceneColours() reuses it on theme flip.
      const rodCol = rodColour()
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(ROD.radius, ROD.radius, ROD.height, 24),
        new THREE.MeshStandardMaterial({ color: rodCol, roughness: 0.55, metalness: 0.25, wireframe: rodTrace }),
      )
      const bandTop = new THREE.Mesh(
        new THREE.CylinderGeometry(ROD.radius * 1.25, ROD.radius * 1.25, 0.04, 24),
        new THREE.MeshStandardMaterial({ color: rodCol, roughness: 0.55, metalness: 0.3, wireframe: rodTrace }),
      )
      bandTop.position.y = ROD.height / 2 - 0.15
      const bandBot = bandTop.clone()
      bandBot.position.y = -ROD.height / 2 + 0.15

      const knob = new THREE.Mesh(
        new THREE.SphereGeometry(ROD.knobR, 24, 16),
        new THREE.MeshStandardMaterial({
          color: C.crimson, roughness: 0.4, metalness: 0.25,
          emissive: C.crimson, emissiveIntensity: 0.18,
        }),
      )
      knob.position.y = ROD.height / 2 + ROD.knobR * 0.6

      group.add(shaft, bandTop, bandBot, knob)
      rod = group
      rod.userData.knob = knob
      rod.userData.shaft = shaft
      rod.userData.bands = [bandTop, bandBot]
      scene.add(rod)
    }

    /* ---- SERPENT BODY — head (neck) → coil → tail ----
       The body follows a composite path sampled into a CatmullRom:
       a short raised NECK above the top of the coil (so the head
       lifts clear of the spiral, as on the Rod of Asclepius), the
       unchanged HelixCurve (nodes still sit on serpentCurve), then a
       TAIL that keeps descending while pulling in to hug the staff.
       The tube radius varies along it (TAPER below): slim neck, a
       slight belly mid-coil, and a long taper to a fine tail tip. */
    /* Neck anchors (head → coil), cylindrical about the rod relative
       to the top of the coil (angle 0, y = +height/2): the neck climbs
       back round and IN toward the staff so the head rises beside the
       rod's crown in profile, as on the Rod of Asclepius. */
    const NECK = [
      { a: -1.60, r: 0.36, dy: 0.34 },
      { a: -1.20, r: 0.44, dy: 0.33 },
      { a: -0.80, r: 0.58, dy: 0.25 },
      { a: -0.42, r: 0.74, dy: 0.13 },
    ]
    const TAIL = { span: 0.17, hugR: ROD.radius + 0.07, pts: 30 }
    const TAPER = { neck: 0.78, belly: 0.07, tip: 0.05, len: 0.13 }
    const smooth = (x: number) => { const c = Math.min(1, Math.max(0, x)); return c * c * (3 - 2 * c) }

    function buildBodyPath() {
      const pts: THREE.Vector3[] = []
      const hp = (t: number) => serpentCurve.getPoint(t)
      const top = SERPENT.height / 2
      NECK.forEach((n) => pts.push(new THREE.Vector3(n.r * Math.cos(n.a), top + n.dy, n.r * Math.sin(n.a))))
      // Lead-in so the head joint reads level rather than following the climb.
      const lead = pts[0].clone().sub(pts[1]); lead.y *= 0.25; lead.normalize()
      pts.unshift(pts[0].clone().add(lead.multiplyScalar(0.06)))
      const iCoil = pts.length
      for (let k = 0; k <= 150; k++) pts.push(hp(k / 150))
      const iTail = pts.length - 1
      // Tail: same pitch, radius eases in to wrap tight round the rod.
      for (let k = 1; k <= TAIL.pts; k++) {
        const f = k / TAIL.pts
        const p = hp(1 + TAIL.span * f)
        const r = THREE.MathUtils.lerp(SERPENT.radius, TAIL.hugR, smooth(f))
        const k2 = r / SERPENT.radius
        p.x *= k2; p.z *= k2
        pts.push(p)
      }
      // Arc-length fractions of the coil start/end, for the taper profile.
      let total = 0; const acc = [0]
      for (let i = 1; i < pts.length; i++) { total += pts[i].distanceTo(pts[i - 1]); acc.push(total) }
      const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal')
      return { curve, uCoil: acc[iCoil] / total, uTail: acc[iTail] / total }
    }

    /* Radius at arc-length fraction u (0 = head joint, 1 = tail tip). */
    function bodyRadius(u: number, uCoil: number, uTail: number) {
      const R = SERPENT.bodyR
      if (u < uCoil) return R * (TAPER.neck + (1 - TAPER.neck) * smooth(u / uCoil))
      const tStart = uTail - TAPER.len
      const belly = 1 + TAPER.belly * Math.sin(Math.PI * Math.min(1, (u - uCoil) / (tStart - uCoil)))
      if (u < tStart) return R * belly
      const f = (u - tStart) / (1 - tStart)
      return R * THREE.MathUtils.lerp(1, TAPER.tip, Math.pow(smooth(f), 0.85))
    }

    /* TubeGeometry with a per-ring radius. Same vertex layout as
       THREE.TubeGeometry (index = i*(radial+1)+j) so the sketch
       extraction below works unchanged. */
    function taperedTube(curve: THREE.Curve<THREE.Vector3>, segs: number, radial: number, rAt: (u: number) => number) {
      const frames = curve.computeFrenetFrames(segs, false)
      const pos: number[] = [], nor: number[] = [], uv: number[] = [], idx: number[] = []
      const P = new THREE.Vector3(), N = new THREE.Vector3()
      for (let i = 0; i <= segs; i++) {
        const u = i / segs
        curve.getPointAt(u, P)
        const r = rAt(u)
        for (let j = 0; j <= radial; j++) {
          const v = (j / radial) * Math.PI * 2
          const sin = Math.sin(v), cos = -Math.cos(v)
          N.set(0, 0, 0).addScaledVector(frames.normals[i], cos).addScaledVector(frames.binormals[i], sin).normalize()
          nor.push(N.x, N.y, N.z)
          pos.push(P.x + r * N.x, P.y + r * N.y, P.z + r * N.z)
          uv.push(u, j / radial)
        }
      }
      for (let i = 1; i <= segs; i++) for (let j = 1; j <= radial; j++) {
        const a = (radial + 1) * (i - 1) + (j - 1), b = (radial + 1) * i + (j - 1)
        const c = (radial + 1) * i + j, d = (radial + 1) * (i - 1) + j
        idx.push(a, b, d, b, c, d)
      }
      const g = new THREE.BufferGeometry()
      g.setIndex(idx)
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
      g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
      return g
    }

    function buildSerpent() {
      const C = themeColours()
      serpentCurve = new HelixCurve(SERPENT.radius, SERPENT.height, SERPENT.turns)
      const body = buildBodyPath()
      const rAt = (u: number) => bodyRadius(u, body.uCoil, body.uTail)
      const SEGS = Math.round(SERPENT.tubeSegs * 1.25)

      const geo = taperedTube(body.curve, SEGS, SERPENT.radialSegs, rAt)
      const mat = new THREE.MeshStandardMaterial({ color: C.ink, roughness: 0.42, metalness: 0.32 })
      serpentMesh = new THREE.Mesh(geo, mat) as typeof serpentMesh
      rotor.add(serpentMesh)

      // Sketch alternative: longitudinal lines only (see original note).
      const WIRE_RADIAL = 8
      const wireTube = taperedTube(body.curve, SEGS, WIRE_RADIAL, rAt)
      const wp = wireTube.attributes.position
      const vIdx = (i: number, j: number) => i * (WIRE_RADIAL + 1) + j
      const segPts: number[] = []
      const pushV = (k: number) => segPts.push(wp.getX(k), wp.getY(k), wp.getZ(k))
      for (let j = 0; j <= WIRE_RADIAL; j++) {
        for (let i = 0; i < SEGS; i++) { pushV(vIdx(i, j)); pushV(vIdx(i + 1, j)) }
      }
      wireTube.dispose()
      const lineGeo = new THREE.BufferGeometry()
      lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(segPts, 3))
      const lineMat = new THREE.LineBasicMaterial({ color: C.ink })
      serpentLine = new THREE.LineSegments(lineGeo, lineMat)
      rotor.add(serpentLine)

      // Polygon trace — the faceted default look, now tapered.
      const polySrc = taperedTube(body.curve, 200, 8, rAt)
      const polyMat = new THREE.LineBasicMaterial({ color: C.ink })
      serpentPoly = new THREE.LineSegments(new THREE.WireframeGeometry(polySrc), polyMat)
      polySrc.dispose()
      rotor.add(serpentPoly)

      applyStrandRender()

      // Head: sits on the neck end, looking outward and roughly level
      // (snout pitched slightly down), eyes on the sides.
      const head = buildSerpentHead(C)
      const at = body.curve.getPointAt(0)
      const fwd = body.curve.getTangentAt(0).negate()
      fwd.y = fwd.y * 0.2 - 0.12
      fwd.normalize()
      const xAxis = new THREE.Vector3(0, 1, 0).cross(fwd).normalize()
      const yAxis = fwd.clone().cross(xAxis)
      head.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAxis, yAxis, fwd))
      head.position.copy(at)
      rotor.add(head)
      serpentMesh.userData.head = head
    }

    /* Serpent head, built in the same faceted "prototype" register as
       the poly-trace body: a low-poly skull (child 0, wire in sketch
       mode) shaped like the non-venomous Aesculapian snake — oval,
       slightly flattened, blunt rounded snout, narrower than a viper.
       Children 1.. are crimson (eyes + forked tongue); the order
       matters — refreshSceneColours() recolours idx 0 ink, rest crimson.
       Local axes: +Z = snout, +Y = up, +X = right. */
    function buildSerpentHead(C: ReturnType<typeof themeColours>) {
      const group = new THREE.Group()
      const R = SERPENT.bodyR
      const L = R * 3.9, W = R * 1.45, H = R * 1.0

      const skull = new THREE.SphereGeometry(1, 12, 8)
      const p = skull.attributes.position
      for (let i = 0; i < p.count; i++) {
        let x = p.getX(i), y = p.getY(i), z = p.getZ(i)
        const f = z > 0 ? 1 - 0.34 * z * z : 1 - 0.12 * z * z   // snout narrows, cheeks full
        x *= W * f
        y *= H * f * (y > 0 ? 1 : 0.62)                        // flat jaw underside
        if (y > 0 && z > 0.2) y *= 1 - 0.18 * (z - 0.2)          // brow slopes to snout
        z *= L * 0.5
        p.setXYZ(i, x, y, z)
      }
      skull.computeVertexNormals()
      const headMat = new THREE.MeshStandardMaterial({
        color: C.ink, roughness: 0.4, metalness: 0.35, wireframe: sketchMode,
      })
      const skullMesh = new THREE.Mesh(skull, headMat)
      skullMesh.position.z = L * 0.32
      group.add(skullMesh)

      const accent = new THREE.MeshStandardMaterial({
        color: C.crimson, emissive: C.crimson, emissiveIntensity: 0.5,
        roughness: 0.3, metalness: 0.4,
      })
      const eyeR = R * 0.2
      const e1 = new THREE.Mesh(new THREE.SphereGeometry(eyeR, 10, 8), accent)
      e1.position.set(W * 0.72, H * 0.42, L * 0.32 + L * 0.2)
      const e2 = e1.clone()
      e2.position.x = -W * 0.72
      group.add(e1, e2)

      // Forked tongue: a stem out of the snout and two splayed tines.
      const tR = R * 0.05
      const tip = L * 0.32 + L * 0.48
      const stemLen = R * 1.3, tineLen = R * 0.7
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(tR, tR, stemLen, 5), accent)
      stem.rotation.x = Math.PI / 2
      stem.position.set(0, -H * 0.25, tip + stemLen / 2)
      group.add(stem)
      ;[-1, 1].forEach((side) => {
        const tine = new THREE.Mesh(new THREE.CylinderGeometry(tR * 0.8, tR * 0.4, tineLen, 5), accent)
        const a = side * 0.45
        tine.rotation.set(Math.PI / 2, 0, -a)
        tine.position.set(Math.sin(a) * tineLen / 2, -H * 0.25, tip + stemLen + Math.cos(a) * tineLen / 2)
        group.add(tine)
      })

      return group
    }

    /* One orb + two pulse rings per strand, evenly spaced along the
       coil at t = i/(count-1) (so the first and last sit exactly at
       the curve ends). Orbs are nudged radially outward off the tube
       surface so they read as sitting on the coil, not buried in it. */
    function buildNodes() {
      const C = themeColours()
      for (let i = 0; i < NODE.count; i++) {
        const S = STRANDS[i]
        const isPlasmid = S.category === 'plasmids'
        const t = SNAKE.tStart + (SNAKE.tEnd - SNAKE.tStart) * (i / (NODE.count - 1))
        const pos = serpentCurve.getPoint(t)
        const radialDir = new THREE.Vector3(pos.x, 0, pos.z).normalize()
        const embedded = nodeStyle === 'embedded'
        const orbPos = embedded ? pos.clone() : pos.clone().add(radialDir.clone().multiplyScalar(SERPENT.bodyR * 1.1))
        const nodeBase = embedded ? C.crimson : C.grape

        // Nodes: grape (the lighter purple accent). `wireframe`
        // tracks sketch mode (set here + in applySketchMode), so
        // solid mode = solid grape orbs, sketch mode = grape wire
        // spheres. Opaque either way (no transparency). Hover/focus
        // still flips them crimson via activate/deactivate.
        const orbMat = new THREE.MeshStandardMaterial({
          color: nodeBase, roughness: embedded ? 0.55 : 0.35, metalness: embedded ? 0 : 0.45,
          emissive: new THREE.Color(0x000000), emissiveIntensity: 0,
          wireframe: embedded ? false : sketchMode && !nodeSolid,
        })
        // Embedded: a solid bead centred on the body's centre-line (its
        // epicentre), larger than the body so it swells through the
        // wire skin evenly on all sides (plasmid loop dropped).
        // Embedded: a box centred on the body's centre-line carrying the
        // section's strand logo (Strand Logos: ink tile, cream emblem,
        // stacked brand name). Sized per frame in updateLogos, a little
        // larger than its project sub-cubes.
        const orb = embedded
          ? new THREE.Mesh(cubeGeo(), nodeCubeMaterials(S.category || S.id, false))
          : new THREE.Mesh(isPlasmid
            ? new THREE.TorusGeometry(PLASMID.loopR, PLASMID.tubeR, 8, 36)
            : new THREE.SphereGeometry(NODE.orbR, 32, 24), orbMat)
        if (embedded) {
          // Depth cues: crimson lines tracing the four receding edges and
          // the back face, stopping short of the front face so its logo
          // edge stays clean. Drawn after the cube with depth testing, so
          // the cube's front face (which writes depth) hides the far ones.
          // (Depth now comes from lit side faces — see nodeCubeMaterials.)
        }
        if (embedded) decorateCube(orb)
        if (embedded) { orb.renderOrder = 9; orb.userData.cube = true; orb.userData.cat = S.category || S.id; orb.scale.setScalar(SERPENT.bodyR * 2.6) }
        orb.position.copy(orbPos)
        if (isPlasmid && !embedded) { orb.rotation.set(0.9, 0.4 * i, 0.3); orb.userData.plasmid = true }
        orb.userData.strandId = STRANDS[i].id
        orb.userData.baseColor = nodeBase.clone()
        orb.userData.t = t

        const ringMat1 = new THREE.MeshBasicMaterial({
          color: C.crimson, transparent: true, opacity: 0,
          side: THREE.DoubleSide, depthWrite: false,
        })
        const ringMat2 = ringMat1.clone()

        // Two thin rings; their scale/opacity are animated each frame
        // in render(). baseR is stored for that pulse maths.
        const ring1 = new THREE.Mesh(new THREE.RingGeometry(NODE.ringR1 * 0.92, NODE.ringR1, 48), ringMat1)
        const ring2 = new THREE.Mesh(new THREE.RingGeometry(NODE.ringR2 * 0.94, NODE.ringR2, 48), ringMat2)
        ring1.position.copy(orbPos)
        ring2.position.copy(orbPos)
        ring1.userData.baseR = NODE.ringR1
        ring2.userData.baseR = NODE.ringR2

        rotor.add(orb, ring1, ring2)
        if (embedded) {
          // Pulse rings: behind the cube (drawn before it, no depth test so
          // the coil doesn't cut them), shown only on hover — see render().
          ;[ring1, ring2].forEach((rg) => {
            const rm = rg.material as THREE.MeshBasicMaterial
            rm.depthTest = false; rg.renderOrder = 5
          })
        }

        const rec: NodeRec = { strand: STRANDS[i], t, orb, ring1, ring2, orbPos: orbPos.clone(), tOff: 0 }
        nodes.push(rec)
        nodePickables.push(orb)
        // Invisible hit sphere spanning the pulse rings, so a click
        // anywhere on the node (orb, rings, halo) registers.
        const hit = new THREE.Mesh(
          new THREE.SphereGeometry(NODE.ringR2 * 1.1, 12, 8),
          new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }),
        )
        hit.position.copy(orbPos)
        hit.userData.strandId = STRANDS[i].id
        rec.hit = hit
        rotor.add(hit)
        nodePickables.push(hit)
      }
    }

    /* Logo tile texture — placeholder in the Mentheon tile format: a
       square in the theme ink (cream on dark), stacked Lato 900 code
       (e.g. DET / 01) in the page colour, crimson ✲ bottom right. */
    function logoTexture(o: Output, accent = false) {
      if (o.product) return productTexture(o, accent)
      const S = 512
      const cv = document.createElement('canvas'); cv.width = cv.height = S
      const g0 = cv.getContext('2d')!; g0.scale(2, 2)
      const g = g0
      const dark = root!.getAttribute('data-theme') === 'dark'
      const crim = cssVar('--crimson') || '#A30B37'
      const tile = accent ? crim : dark ? '#FFECE1' : '#2F0147'
      const mark = accent ? '#FFECE1' : dark ? '#1A0226' : '#FFECE1'
      g.fillStyle = tile; g.fillRect(0, 0, 256, 256)
      const [a, b] = o.code.split('-')
      g.fillStyle = mark
      g.font = '900 86px Lato, sans-serif'; g.textBaseline = 'alphabetic'
      g.fillText(a, 22, 104)
      g.fillText(b, 22, 186)
      g.font = '500 17px "JetBrains Mono", monospace'
      g.globalAlpha = 0.75
      g.fillText(typeById(o.type).label.split(' ')[0].toUpperCase(), 24, 222)
      g.globalAlpha = 1
      g.fillStyle = accent ? '#FFECE1' : crim
      g.font = '700 46px "JetBrains Mono", monospace'
      g.fillText('✲', 256 - 56, 256 - 20)
      const tex = new THREE.CanvasTexture(cv)
      tex.colorSpace = THREE.SRGBColorSpace
      tex.anisotropy = 4
      return tex
    }
    /* Canvas version of the product mark for the cube face. */
    function productTexture(o: Output, accent: boolean) {
      const S = 512, k = S / 195
      const cv = document.createElement('canvas'); cv.width = cv.height = S
      const g = cv.getContext('2d')!
      const dark = root!.getAttribute('data-theme') === 'dark'
      const crim = cssVar('--crimson') || '#A30B37'
      const adv = isAdvisory(o)          // gold in both themes
      const ground = accent ? crim : adv ? ADVISORY_GOLD : dark ? '#FFECE1' : PT.GRAPE
      const ink = accent ? '#FFECE1' : adv ? ADVISORY_INK : dark ? PT.GRAPE : '#FFECE1'
      g.fillStyle = ground; g.fillRect(0, 0, S, S)
      if (emblemImg.complete && emblemImg.naturalWidth) {
        const t = document.createElement('canvas'); t.width = t.height = S
        const tg = t.getContext('2d')!
        tg.drawImage(emblemImg, 0, 0, S, S)
        tg.globalCompositeOperation = 'source-in'; tg.fillStyle = ink; tg.fillRect(0, 0, S, S)
        g.drawImage(t, 0, 0)
      }
      const L = layout3b(o.product!)
      g.save(); g.scale(k, k); g.fillStyle = ink
      const word = markWord(o)
      if (word) {
        // Advisory services: three-letter word (res / des / dev / con).
        g.font = `900 ${WORD.size}px Lato, sans-serif`
        ;(g as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${WORD.track}px`
        g.fillText(word, WORD.x, 178)
      } else {
        if (L.isA) {
          g.save(); g.translate(12.35 + PT.INSET - L.k * 12.35, 178 - L.k * 178); g.scale(L.k, L.k)
          g.fill(new Path2D(aufPath)); g.restore()
        } else { g.font = `900 ${PT.BIG}px Lato, sans-serif`; g.fillText(L.l, L.x0, 178) }
        g.font = `900 ${PT.SUB}px Lato, sans-serif`; g.fillText(L.s, L.right + PT.GAP, 178)
      }
      g.font = `500 ${L.hdr}px "JetBrains Mono", monospace`
      ;(g as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${PT.HDR_TRACK * L.hdr}px`
      g.fillText(o.product!.toUpperCase(), 12, 12 + L.hdr * 0.74)
      g.restore()
      const tex = new THREE.CanvasTexture(cv)
      tex.colorSpace = THREE.SRGBColorSpace
      tex.anisotropy = 4
      return tex
    }
    /* ---- Section (strand) logo cubes — embedded node style ----
       Strand Logos tile: ink ground (cream in dark), cream emblem, the
       brand name split over two lines in Lato 900, bottom-left.
       Selected/hovered: crimson ground. */
    const STRAND_SPLITS: Record<string, [string, string]> =
      Object.fromEntries(Object.entries(STRAND).map(([cat, v]) => [cat, v.split]))
    let _sctx: CanvasRenderingContext2D | null = null
    const latoW = (s: string) => {
      if (!_sctx) _sctx = document.createElement('canvas').getContext('2d')
      _sctx!.font = '900 100px Lato, sans-serif'
      return _sctx!.measureText(s).width / 100
    }
    function strandTexture(cat: string, accent: boolean, darkOverride: boolean | null = null) {
      const S = 512, k = S / 195
      const cv = document.createElement('canvas'); cv.width = cv.height = S
      const g = cv.getContext('2d')!
      const dark = darkOverride ?? root!.getAttribute('data-theme') === 'dark'
      const crim = accent && darkOverride !== null ? '#A30B37' : cssVar('--crimson') || '#A30B37'
      const adv = cat === 'advisory'      // gold in both themes
      const ground = accent ? crim : adv ? ADVISORY_GOLD : dark ? '#FFECE1' : '#2F0147'
      const ink = accent ? '#FFECE1' : adv ? ADVISORY_INK : dark ? '#2F0147' : '#FFECE1'
      g.fillStyle = ground; g.fillRect(0, 0, S, S)
      if (emblemImg.complete && emblemImg.naturalWidth) {
        const t = document.createElement('canvas'); t.width = t.height = S
        const tg = t.getContext('2d')!
        tg.drawImage(emblemImg, 0, 0, S, S)
        tg.globalCompositeOperation = 'source-in'; tg.fillStyle = ink; tg.fillRect(0, 0, S, S)
        g.drawImage(t, 0, 0)
      }
      const split = STRAND_SPLITS[cat] || [cat.slice(0, 4).toUpperCase(), cat.slice(4).toUpperCase()]
      const size = Math.min(46, ...Object.values(STRAND_SPLITS).map(([a, b]) => Math.min(171 / (latoW(b) * 0.985), 120 / (latoW(a) * 0.985))))
      g.save(); g.scale(k, k); g.fillStyle = ink
      g.font = `900 ${size}px Lato, sans-serif`
      ;(g as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${-0.015 * size}px`
      g.fillText(split[0], 12, 178 - size * 0.86)
      g.fillText(split[1], 12, 178)
      g.restore()
      const tex = new THREE.CanvasTexture(cv)
      tex.colorSpace = THREE.SRGBColorSpace
      tex.anisotropy = 8
      return tex
    }
    /* Lit side material shared by section + project cubes: Lambert with
       a low emissive floor so the face turned from the lights never goes
       black, and the lit faces read near the brand colour. */
    function litSide(hex: number | THREE.Color) {
      const base = new THREE.Color(hex as THREE.ColorRepresentation)
      // gradient / shadow looks: unlit, darkened toward the back by the
      // cube geometry's vertex colours (see cubeGeo()).
      const m = cubeLook === 'gradient' || cubeLook === 'shadow'
        ? new THREE.MeshBasicMaterial({ color: base, vertexColors: true })
        : new THREE.MeshLambertMaterial({ color: base })
      m.userData.base = base.clone()
      setLitSide(m as THREE.MeshLambertMaterial, base)
      return m as unknown as THREE.MeshBasicMaterial
    }
    function setLitSide(m: THREE.MeshLambertMaterial, c: THREE.Color) {
      if (!(m as THREE.MeshLambertMaterial).emissive) { (m as unknown as THREE.MeshBasicMaterial).color.copy(c); return }
      m.color.copy(c).multiplyScalar(1.15)
      m.emissive.copy(c).multiplyScalar(0.28)
    }
    /* One box geometry for every cube; carries a vertex-colour ramp
       (1 at the front face's plane → 0.42 at the back) used by the
       gradient/shadow side materials. Face materials ignore it. */
    let _cubeGeo: THREE.BoxGeometry | null = null
    function cubeGeo() {
      if (_cubeGeo) return _cubeGeo
      const g = new THREE.BoxGeometry(1, 1, 1)
      const p = g.attributes.position, col: number[] = []
      for (let i = 0; i < p.count; i++) { const k = THREE.MathUtils.lerp(0.42, 1, p.getZ(i) + 0.5); col.push(k, k, k) }
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
      _cubeGeo = g
      return g
    }
    const _camL = new THREE.Vector3()
    function updateOutline(mesh: THREE.Object3D) {
      if (!mesh.userData.hasOutline) return
      mesh.updateMatrixWorld(true)
      _camL.copy(camera.position); mesh.worldToLocal(_camL)
      const cl = [_camL.x, _camL.y, _camL.z]
      mesh.children.forEach((c) => {
        const f = c.userData.faces as [number, number][] | undefined
        if (!f) return
        const v1 = f[0][1] * cl[f[0][0]] > 0.5, v2 = f[1][1] * cl[f[1][0]] > 0.5
        c.visible = v1 !== v2
      })
    }
    /* Look-specific extras parented to a cube: edge lines or a soft
       drop shadow. */
    let _shadowTex: THREE.Texture | null = null
    function decorateCube(mesh: THREE.Mesh) {
      if (cubeLook === 'outline') {
        const dark = root!.getAttribute('data-theme') === 'dark'
        // Silhouette only: 12 edges, each tagged with its two faces; per
        // frame (updateOutline) an edge shows only when exactly one of
        // those faces is turned to the camera — the cube's outer contour.
        const lm = new THREE.LineBasicMaterial({ color: dark ? 0x2F0147 : 0xFFECE1, depthTest: false, transparent: true, opacity: 0.95 })
        const H = 0.5005
        const edges: { p: number[]; f: [number, number][] }[] = []
        // axis a runs the edge; the other two axes sit at ±H
        ;[0, 1, 2].forEach((a) => {
          const [b, c] = [0, 1, 2].filter((k) => k !== a)
          ;[-1, 1].forEach((sb) => [-1, 1].forEach((sc) => {
            const p1 = [0, 0, 0], p2 = [0, 0, 0]
            p1[a] = -H; p2[a] = H; p1[b] = p2[b] = sb * H; p1[c] = p2[c] = sc * H
            edges.push({ p: [...p1, ...p2], f: [[b, sb], [c, sc]] })
          }))
        })
        edges.forEach((ed) => {
          const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(ed.p, 3))
          const l = new THREE.LineSegments(g, lm)
          l.renderOrder = (mesh.renderOrder || 10) + 1
          l.userData.cubeOutline = true
          l.userData.faces = ed.f
          mesh.add(l)
        })
        mesh.userData.hasOutline = true
      } else if (cubeLook === 'shadow') {
        if (!_shadowTex) {
          const c = document.createElement('canvas'); c.width = c.height = 128
          const g = c.getContext('2d')!
          const gr = g.createRadialGradient(64, 64, 10, 64, 64, 62)
          gr.addColorStop(0, 'rgba(47,1,71,0.55)'); gr.addColorStop(1, 'rgba(47,1,71,0)')
          g.fillStyle = gr; g.fillRect(0, 0, 128, 128)
          _shadowTex = new THREE.CanvasTexture(c)
        }
        const s = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: _shadowTex, transparent: true, depthTest: false, depthWrite: false }))
        s.position.set(0.14, -0.2, -0.55); s.scale.setScalar(1.9)
        s.renderOrder = 6
        mesh.add(s)
      }
    }
    function nodeCubeMaterials(cat: string, accent: boolean) {
      const dark = root!.getAttribute('data-theme') === 'dark'
      // Sides are LIT (scene key/fill/rim lights) so each plane takes a
      // different value as the cube turns; the logo faces stay unlit.
      const sideMat = litSide(cat === 'advisory' ? new THREE.Color(ADVISORY_GOLD) : dark ? 0xFFECE1 : 0x6A2A7E)
      const sides = [sideMat, sideMat, sideMat, sideMat] as THREE.MeshBasicMaterial[]
      const face = new THREE.MeshBasicMaterial({ map: strandTexture(cat, false) })
      face.userData.normal = face.map
      face.userData.accent = strandTexture(cat, true)
      // Back: the Mentheon tile (same as the project cubes).
      const back = new THREE.MeshBasicMaterial({ map: mentheonLogoTex || face.map, color: 0xffffff })
      const mats = [...sides, face, back]
      // Always on top of the coil/rod (like the project cubes): no depth
      // test, FrontSide culling hides the cube's own far faces.
      mats.forEach((m) => { m.userData.isNodeCube = true; m.depthTest = false; m.depthWrite = true; m.transparent = true })
      if (accent) applyNodeCubeAccent(mats, true)
      return mats
    }
    function applyNodeCubeAccent(mats: THREE.MeshBasicMaterial[], on: boolean) {
      ;[4].forEach((i) => {
        const want = (on ? mats[i].userData.accent : mats[i].userData.normal) as THREE.Texture
        if (mats[i].map !== want) { mats[i].map = want; mats[i].needsUpdate = true }
      })
      const crim = new THREE.Color(cssVar('--crimson') || '#A30B37')
      const dark = root!.getAttribute('data-theme') === 'dark'
      void dark
      setLitSide(mats[0] as unknown as THREE.MeshLambertMaterial, on ? crim : (mats[0].userData.base as THREE.Color))
    }
    function setNodeCubeAccent(orb: THREE.Mesh, on: boolean) {
      orb.userData.accentOn = on
      applyNodeCubeAccent(orb.material as THREE.MeshBasicMaterial[], on)
      // Edge lines: crimson on the ink box; ink (cream in dark) on the crimson box.
      const em = orb.userData.edgeMat as THREE.LineBasicMaterial | undefined
      if (em) {
        const dark = root!.getAttribute('data-theme') === 'dark'
        void dark; void on
        em.color.set(cssVar('--crimson') || '#A30B37')
      }
    }
    function regenNodeCubes() {
      nodes.forEach((n) => {
        if (!n.orb.userData.cube) return
        const old = n.orb.material as THREE.MeshBasicMaterial[]
        ;(old[4].userData.normal as THREE.Texture | undefined)?.dispose()
        ;(old[4].userData.accent as THREE.Texture | undefined)?.dispose()
        new Set(old).forEach((m) => m.dispose())
        n.orb.material = nodeCubeMaterials(n.orb.userData.cat, !!n.orb.userData.accentOn)
        setNodeCubeAccent(n.orb, !!n.orb.userData.accentOn)
      })
    }

    /* Rebuild every cube's materials (theme change, marks loaded). */
    function regenLogos() {
      regenNodeCubes()
      const dark = root!.getAttribute('data-theme') === 'dark'
      rotor.traverse((o) => { if (o.userData.cubeOutline) ((o as THREE.LineSegments).material as THREE.LineBasicMaterial).color.set(dark ? 0x2F0147 : 0xFFECE1) })
      logos.forEach((l) => {
        const old = l.sprite.material as THREE.MeshBasicMaterial[]
        ;(old[4].userData.normal as THREE.Texture | undefined)?.dispose()
        ;(old[4].userData.accent as THREE.Texture | undefined)?.dispose()
        old.forEach((m, i) => { if (i === 0 || i >= 4) m.dispose() })
        l.sprite.material = cubeMaterials(l.o)
      })
    }

    function cubeMaterials(o: Output) {
      /* depthTest is off (see below), so each cube relies on FrontSide
         culling to keep its far faces hidden. */
      const dark = root!.getAttribute('data-theme') === 'dark'
      // Sides match the front face's ground: grape for product marks,
      // ink for placeholder code tiles (cream for both in dark).
      const side = litSide(new THREE.Color(isAdvisory(o) ? ADVISORY_GOLD : dark ? 0xFFECE1 : o.product ? PT.GRAPE : 0x5A2370))
      const front = new THREE.MeshBasicMaterial({ map: logoTexture(o) })
      front.userData.normal = front.map
      front.userData.accent = logoTexture(o, true)
      const back = new THREE.MeshBasicMaterial({ map: mentheonLogoTex, color: 0xffffff })
      // Always in front: no depth test against the coil / rod / nodes.
      // transparent (opacity 1): keeps cubes in the same render pass as the
      // pulse rings so renderOrder puts the rings behind them.
      ;[side, front, back].forEach((m) => { m.depthTest = false; m.depthWrite = cubeLook === 'outline'; m.transparent = true })
      // BoxGeometry face order: +x, -x, +y, -y, +z (front), -z (back)
      return [side, side, side, side, front, back]
    }
    /* ---- 3D Essen (cube-momentum page) ----
       Each pose SVG (32×32 pixel art) is voxelised: one cube per pixel,
       extruded front/back by its distance from the silhouette edge so
       the body reads round. Lit, so the voxels shade as he turns.
       Scared: when the staff spins fast / the cubes are coasting he
       shivers, leans away from the spin, squashes, swaps to his
       open-mouthed pose and a crimson "!" pops above him. */
    let essen3d: THREE.Group | null = null
    const essen3dPose: Record<string, THREE.Object3D> = {}
    let essenBang: THREE.Group | null = null
    let essenFear = 0
    let essenLight: THREE.DirectionalLight | null = null
    let essenFill: THREE.AmbientLight | null = null
    let essenTurn = 0          // extra yaw from spinning (decays back to face-on)
    async function buildEssen3D() {
      const g = new THREE.Group()
      const box = new THREE.BoxGeometry(1, 1, 1)
      // Lit from the viewer: a dedicated light rides with the camera (see
      // below) so his face is always bright; sides still shade.
      const mat = new THREE.MeshLambertMaterial({ color: 0xffffff })
      mat.emissive.set(0x000000)
      // Always in front of the Aufdröselung cube (and everything else):
      // drawn last; the depth buffer is cleared just before him (see
      // essenClear) so only his own voxels occlude each other.
      mat.transparent = true
      for (const p of ['idle', 'hungry', 'eating', 'full']) {
        let txt = ''
        try { txt = await (await fetch(`${import.meta.env.BASE_URL}essen-${p}.svg`)).text() } catch { continue }
        if (destroyed) return
        const px = [...txt.matchAll(/<rect x="(\d+)" y="(\d+)"[^>]*fill="(#[0-9A-Fa-f]{6})"/g)].map((m) => ({ x: +m[1], y: +m[2], c: m[3] }))
        const on = new Map<string, number>()
        px.forEach((q) => on.set(q.x + ',' + q.y, 0))
        // multi-source BFS from empty cells → distance to the silhouette edge
        const dist = new Map<string, number>()
        let frontier: [number, number][] = []
        px.forEach((q) => {
          const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !on.has((q.x + dx) + ',' + (q.y + dy)))
          if (edge) { dist.set(q.x + ',' + q.y, 1); frontier.push([q.x, q.y]) }
        })
        while (frontier.length) {
          const next: [number, number][] = []
          frontier.forEach(([x, y]) => {
            const d0 = dist.get(x + ',' + y)!
            ;[[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
              const k = (x + dx) + ',' + (y + dy)
              if (on.has(k) && !dist.has(k)) { dist.set(k, d0 + 1); next.push([x + dx, y + dy]) }
            })
          })
          frontier = next
        }
        const cells: { x: number; y: number; z: number; c: string }[] = []
        px.forEach((q) => {
          const t = Math.min(4, Math.ceil((dist.get(q.x + ',' + q.y) ?? 1) / 2))
          for (let z = -t + 1; z <= t - 1; z++) cells.push({ x: q.x, y: q.y, z, c: q.c })
        })
        const im = new THREE.InstancedMesh(box, mat, cells.length)
        const m4 = new THREE.Matrix4(), col = new THREE.Color()
        cells.forEach((v, i) => {
          m4.makeTranslation(v.x - 15.5, 15.5 - v.y, v.z)
          im.setMatrixAt(i, m4); im.setColorAt(i, col.set(v.c))
        })
        im.instanceMatrix.needsUpdate = true
        if (im.instanceColor) im.instanceColor.needsUpdate = true
        im.renderOrder = 30
        im.visible = p === 'idle'
        g.add(im); essen3dPose[p] = im
      }
      // "!" — crimson voxels above the head
      const bang = new THREE.Group()
      const bm = new THREE.MeshLambertMaterial({ color: 0xA30B37, emissive: 0x3a0412 })
      ;[[0, 0], [0, 2], [0, 3], [0, 4], [0, 5]].forEach(([x, y]) => {
        const v = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 1.6), bm); v.position.set(x, y * 1.6, 0); bang.add(v)
      })
      bang.children.forEach((c) => { c.renderOrder = 30; ((c as THREE.Mesh).material as THREE.Material).transparent = true })
      bang.position.set(12, 20, 0)
      bang.visible = false
      g.add(bang); essenBang = bang
      // Depth clear right before Essen draws (renderOrder 29, transparent pass).
      const clr = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ transparent: true }))
      clr.frustumCulled = false
      clr.renderOrder = 29
      clr.onBeforeRender = (rnd) => { rnd.clearDepth() }
      g.add(clr)
      rotor.add(g)
      essen3d = g
      // Face light: follows the camera so Essen's front is always lit.
      essenLight = new THREE.DirectionalLight(0xffffff, 1.6)
      essenFill = new THREE.AmbientLight(0xffffff, 0.15)
      scene.add(essenLight, essenLight.target, essenFill)
    }

    function buildLogos() {
      mentheonLogoTex = new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}favvectorprint.svg`)
      mentheonLogoTex.colorSpace = THREE.SRGBColorSpace
      const geo = cubeGeo()
      nodes.forEach((n, ni) => {
        n.strand.outputs.forEach((o, k) => {
          const sprite = new THREE.Mesh(geo, cubeMaterials(o))
          sprite.renderOrder = 10            // after the scene, so nothing paints over it
          decorateCube(sprite)
          sprite.userData.strandId = n.strand.id
          sprite.userData.outputId = o.id
          rotor.add(sprite)
          nodePickables.push(sprite)
          logos.push({ sprite, node: ni, phase: (k / Math.max(1, n.strand.outputs.length)) * Math.PI * 2 + ni * 0.7, o })
        })
      })
      // Essen
      ;['idle', 'hungry', 'eating', 'full'].forEach((p) => {
        const t = new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}essen-${p}.svg`)
        t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace
        essenTex[p] = t
      })
      essen = new THREE.Sprite(new THREE.SpriteMaterial({ map: essenTex.idle, sizeAttenuation: false, depthTest: false, depthWrite: false, transparent: true }))
      essen.renderOrder = 11
      essen.visible = logos.some((l) => l.o.id === AUF_ID)
      rotor.add(essen)
      if (cubeMomentum && essen.visible) buildEssen3D()
      // Emblem image + Aufdröselung glyph load async: once ready, rebuild
      // the cube faces and the list rows (both exist by now).
      productMarksReady.then(() => {
        if (destroyed) return
        regenLogos()
        $$('.list-item').forEach((a) => {
          const o = outputById((a as HTMLElement).dataset.out || '')
          const cell = a.querySelector('.list-mark')
          if (o && cell) cell.innerHTML = productTileHTML(o)
        })
        // Section marks need the emblem + Lato: redraw once both are in.
        document.fonts.load('900 40px Lato').catch(() => {}).then(() => {
          if (destroyed) return
          catMarkCache.clear()
          $$('.list-band').forEach((b, i) => {
            const cell = b.querySelector('.list-band-mark')
            if (cell && STAFF_CATS[i]) cell.innerHTML = catMarkImgs(STAFF_CATS[i].id)
          })
        })
      })
    }
    /* Per-frame: place each cube in its slot beside the node in
       camera space (right/up vectors), size it to a steady on-screen
       fraction, and face it to the camera with a fixed tilt. Also
       publishes, per node, how far its side cubes reach in px so the
       HTML label text can sit beyond them (see updateLabels). */
    const _wp = new THREE.Vector3(), _np = new THREE.Vector3(), _right = new THREE.Vector3(), _camUp = new THREE.Vector3()
    const _q = new THREE.Quaternion(), _tilt = new THREE.Quaternion(), _inv = new THREE.Quaternion(), _e = new THREE.Euler()
    /* Per node, how far its side cubes reach in px — kept PER SIDE so a
       label only ever moves for the cube on its own text side (and so
       only grows when that cube is selected); the opposite cube never
       shifts it. */
    const reachL: number[] = [], reachR: number[] = []
    /* Section cube edge relative to a project sub-cube (embedded style). */
    const NODE_CUBE_K = 1.55
    /* ---- Cube momentum (cubeMomentum prop) ----
       spinV follows the staff's angular velocity while it turns; once
       the staff stops it coasts down (FRICTION per second). spinA[] is
       each cube's own yaw, with a small per-cube ratio so they don't
       move in lockstep. Hover or any key → halt: velocity 0 and every
       cube eases back to the nearest face-on turn. */
    /* Inertia model: cubes ride WITH the staff (no own spin) while it
       turns. Only a sudden stop after a FAST spin kicks them: the speed
       the staff sheds faster than `brake` rad/s² is handed to the cubes
       (× gain), which then coast down. Gentle spins never trigger it. */
    /* Threshold model: the staff's angular speed is smoothed (so pointer
       jitter can't trip it). Normal drags (~1–5 rad/s) do nothing. Only
       speed ABOVE `fast` charges the cubes' spin (× gain, capped); below
       it they just coast down with friction. */
    const MOM = { fast: 4.5, smooth: 4, gain: 0.9, cap: 12, friction: 0.45, settle: 6 }
    let momV = 0, momHalt = false, prevRotor = NaN, smV = 0, coastT = 0
    const momA = new Map<THREE.Object3D, number>()
    const _spinQ = new THREE.Quaternion(), _Y = new THREE.Vector3(0, 1, 0)
    function momStep(dt: number) {
      if (!cubeMomentum) return
      // The staff's ACTUAL rotation speed: frame-to-frame change of the
      // rendered rotor angle (unwrapped), however it got there — drag,
      // fling or snap. Pointer events play no part, so uneven drags and
      // event bursts can't charge it.
      const ra = rotorAngle
      const rv = Number.isFinite(prevRotor) && dt > 0.001 ? (ra - prevRotor) / dt : 0
      prevRotor = ra
      smV += (rv - smV) * Math.min(1, dt * MOM.smooth)
      const over = Math.abs(smV) - MOM.fast
      // A fast spin re-arms; hover only halts once the staff is no longer
      // being spun (the pointer sweeps over nodes mid-drag otherwise).
      // Coast timer: counts while the cubes spin on after the fast spin
      // ends; at cubeReturn seconds they turn back to the front.
      if (over > 0) coastT = 0
      else if (momV !== 0) { coastT += dt; if (coastT >= cubeReturn) momHalt = true }
      if (over > 0) momHalt = false
      else if (!dragging && (hoveredId || hoveredOutput)) momHalt = true
      if (momHalt) { momV = 0; return }
      if (over > 0) {
        const target = Math.sign(smV) * Math.min(MOM.cap, over * MOM.gain * 3)
        // Charge toward target in the drag's direction (either way); a
        // reversal flips the cubes' spin to follow.
        if (momV === 0 || Math.sign(target) !== Math.sign(momV) || Math.abs(target) > Math.abs(momV)) momV += (target - momV) * Math.min(1, dt * 4)
      } else momV *= Math.exp(-dt * MOM.friction)
    }
    function momSpin(o: THREE.Object3D, ratio: number, dt: number) {
      if (!cubeMomentum) return 0
      let a = momA.get(o) ?? 0
      if (momHalt || Math.abs(momV) < 0.02) {
        const home = Math.round(a / (Math.PI * 2)) * Math.PI * 2
        a += (home - a) * Math.min(1, dt * MOM.settle)
      } else a += momV * ratio * dt
      momA.set(o, a)
      return a
    }
    const haltMomentum = () => { momHalt = true }
    if (cubeMomentum) {
      window.addEventListener('keydown', haltMomentum)
      cleanups.push(() => window.removeEventListener('keydown', haltMomentum))
    }
    const _lift = new THREE.Vector3()
    const _inv2 = new THREE.Quaternion()
    const logoFade = new Map<THREE.Object3D, number>()   // phones: per-cube fade (see updateLogos)
    function updateLogos(dt: number) {
      nodes.forEach((_, i) => {
        const target = isFocused() && focusIndex === i ? 1 : 0
        tileMix[i] = (tileMix[i] ?? 0) + (target - (tileMix[i] ?? 0)) * Math.min(1, dt * LOGO.ease)
      })
      _right.setFromMatrixColumn(camera.matrixWorld, 0)
      _camUp.setFromMatrixColumn(camera.matrixWorld, 1)
      rotor.getWorldQuaternion(_inv).invert()
      const tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
      const hpx = container.clientHeight || 1
      const slotOf = new Map<number, number>()
      const nodeEdge: number[] = []
      momStep(dt)
      // Cube sizes are fractions of viewport HEIGHT; on a tall phone the
      // focused row (side cube · strand cube · side cube) would overflow
      // the width, so scale everything to fit it (1 on landscape).
      const portraitFit = Math.min(1, camera.aspect * 1.3)
      const portrait = camera.aspect < 1
      nodes.forEach((n, i) => {
        if (!n.orb.userData.cube) return
        n.orb.getWorldPosition(_np)
        const d = camera.position.distanceTo(_np)
        const f = THREE.MathUtils.clamp((d - 2.2) / 6, 0, 1)
        const m = THREE.MathUtils.smoothstep(tileMix[i] ?? 0, 0, 1)
        const frac = THREE.MathUtils.lerp(THREE.MathUtils.lerp(LOGO.sizeNear, LOGO.sizeFar, f), LOGO.tileFrac, m) * portraitFit
        const s = frac * 2 * d * tanH * NODE_CUBE_K
        nodeEdge[i] = s
        n.orb.scale.setScalar(s)
        // Centred on the body; drawn on top of it (see nodeCubeMaterials)
        // so the coil never obscures it as the staff turns.
        // Live position: the rest point, slid along the coil while it
        // steps aside from a neighbour (avoidClusters → tOff).
        if (n.tOff) serpentCurve.getPoint(THREE.MathUtils.clamp(n.t + n.tOff, AVOID.tMin, AVOID.tMax), n.orb.position)
        else n.orb.position.copy(n.orbPos)
        n.hit?.position.copy(n.orb.position)
        n.ring1.position.copy(n.orb.position)
        n.ring2.position.copy(n.orb.position)
        _q.copy(camera.quaternion)
        // Default: square-on to the camera (front face toward the viewer).
        // Only the momentum spin after a fast drag turns it away.
        _tilt.identity()
        _q.multiply(_tilt)
        _q.multiply(_spinQ.setFromAxisAngle(_Y, momSpin(n.orb, 1, dt)))
        n.orb.quaternion.copy(_inv).multiply(_q)
        n.orb.updateMatrixWorld(true)
        _lift.copy(camera.position); n.orb.worldToLocal(_lift)
        n.orb.children.forEach((c) => { if (c.userData.vis) c.visible = m < 0.5 && c.userData.vis(_lift) })
        updateOutline(n.orb)
      })
      logos.forEach((l) => {
        const n = nodes[l.node]
        const k = slotOf.get(l.node) ?? 0
        slotOf.set(l.node, k + 1)
        n.orb.getWorldPosition(_np)
        const d = camera.position.distanceTo(_np)
        const f = THREE.MathUtils.clamp((d - 2.2) / 6, 0, 1)
        const m = THREE.MathUtils.smoothstep(tileMix[l.node] ?? 0, 0, 1)
        const hov = hoveredOutput === l.o.id ? (m > 0.5 ? 1.06 : 1.2) : 1
        const frac = THREE.MathUtils.lerp(THREE.MathUtils.lerp(LOGO.sizeNear, LOGO.sizeFar, f), LOGO.tileFrac, m) * hov * portraitFit
        let s = frac * 2 * d * tanH                          // edge, world units
        const [sx, sy] = SLOTS[k % SLOTS.length]
        const ring = k >= SLOTS.length ? 1 + Math.floor(k / SLOTS.length) : 1
        const ne = nodeEdge[l.node] ?? 0          // section cube edge (embedded style)
        // Portrait phones: all three (cube · strand · cube) must fit the
        // width. Cap a side cube's edge to the room left beside the strand
        // cube (6% margin); spacing below ignores the outer ring there.
        if (portrait && sx !== 0) s = Math.min(s, Math.max(0.01, d * tanH * camera.aspect * 0.94 - ne * 0.5 - LOGO.tileGap))
        // Phones (locked on one strand): only the focused strand and its
        // neighbours above/below keep their project cubes (a preview of
        // the next swipe); the rest ease out so nothing lingers.
        const fadeWant = portrait && isFocused() && Math.abs(l.node - focusIndex) > 1 ? 0 : 1
        const fade = (logoFade.get(l.sprite) ?? 1) + (fadeWant - (logoFade.get(l.sprite) ?? 1)) * Math.min(1, dt * 9)
        logoFade.set(l.sprite, fade)
        l.sprite.visible = fade > 0.03
        s *= fade
        // Phones: neighbour strands' cubes hug their strand cube (not the ring).
        // Cubes above/below a node (Advisory's 12 and 6 o'clock) hug it
        // instead of clearing the pulse ring, so they stay out of the
        // neighbouring strands' rows.
        const offCube = portrait ? ne * 0.5 + s * 0.95
          : sx === 0 ? ne * 0.5 + s * 0.7
          : Math.max(NODE.ringR2 + s * 0.7, s * LOGO.gap, ne * 0.5 + s * 0.75)
        const offTile = (portrait ? ne * 0.5 : Math.max(NODE.ringR2 * 1.1, ne * 0.5)) + LOGO.tileGap + s / 2
        const off = THREE.MathUtils.lerp(offCube, offTile, m) * ring
        _wp.copy(_np).addScaledVector(_right, sx * off).addScaledVector(_camUp, sy * off)
        rotor.worldToLocal(_wp)
        l.sprite.position.copy(_wp)
        l.sprite.scale.set(s, s, s * THREE.MathUtils.lerp(1, LOGO.tileDepth, m))
        const sel = hoveredOutput === l.o.id || peekHover.id === l.o.id || panelIdRef.current === PROJECT_PREFIX + l.o.id
        const mats = l.sprite.material as THREE.MeshBasicMaterial[]
        const want = (sel ? mats[4].userData.accent : mats[4].userData.normal) as THREE.Texture
        if (mats[4].map !== want) {
          mats[4].map = want; mats[4].needsUpdate = true
          setLitSide(mats[0] as unknown as THREE.MeshLambertMaterial, sel ? new THREE.Color(cssVar('--crimson') || '#A30B37') : (mats[0].userData.base as THREE.Color))
        }
        if (essen && l.o.id === AUF_ID) {
          // Essen goes wherever its cube goes (hidden with it on phones).
          essen.visible = l.sprite.visible
          if (essen3d) essen3d.visible = l.sprite.visible
          // Essen: a slow loop around the cube's edge plus a quick bob.
          const t = performance.now() / 1000
          const ef = THREE.MathUtils.lerp(ESSEN.sizeNear, ESSEN.sizeFar, f) * (1 + 0.4 * m)
          const es = ef * 2 * d * tanH
          const R = s * 0.6 + es * 0.7
          const a = t * ESSEN.drift
          // Occasional action: phase p ∈ [0,1) over actLen, once per `every` s.
          const cyc = t % ESSEN.every
          const acting = cyc < ESSEN.actLen
          const p = acting ? cyc / ESSEN.actLen : 0
          const hop = acting ? Math.sin(Math.min(1, p / 0.35) * Math.PI) * es * 0.55 : 0
          const squash = acting && p > 0.3 && p < 0.42 ? 0.82 : 1
          const pose = !acting ? 'idle' : p < 0.4 ? 'hungry' : p < 0.8 ? 'eating' : 'full'
          const em = essen.material as THREE.SpriteMaterial
          if (essenTex[pose] && em.map !== essenTex[pose]) { em.map = essenTex[pose]; em.needsUpdate = true }
          const bob = Math.sin(t * ESSEN.bob) * es * 0.12 + hop
          const ep = l.sprite.getWorldPosition(new THREE.Vector3())
            .addScaledVector(_right, Math.cos(a) * R).addScaledVector(_camUp, Math.sin(a) * R * 0.75 + bob)
          rotor.worldToLocal(ep)
          essen.position.copy(ep)
          essen.scale.set(ef * (2 - squash), ef * squash, 1)
          ;(essen.material as THREE.SpriteMaterial).rotation = Math.sin(t * 1.7) * 0.12
          if (essen3d) {
            essen.visible = false
            // Fear from the staff's spin speed and the cubes' coasting spin.
            const fearT = THREE.MathUtils.clamp(Math.max((Math.abs(smV) - 2) / 3, Math.abs(momV) / 5), 0, 1)
            essenFear += (fearT - essenFear) * Math.min(1, dt * (fearT > essenFear ? 8 : 1.5))
            const F = essenFear
            const scared = F > 0.15
            const showPose = scared ? 'hungry' : pose
            Object.entries(essen3dPose).forEach(([k, o]) => { o.visible = k === showPose })
            if (essenBang) {
              essenBang.visible = F > 0.35
              essenBang.scale.setScalar(1 + 0.25 * Math.sin(t * 18))
            }
            const vs = (es * 1.6) / 32                                       // voxel → world
            const jx = (Math.sin(t * 61) + Math.sin(t * 37)) * 0.5 * es * 0.05 * F
            const jy = Math.sin(t * 47) * es * 0.04 * F
            essen3d.position.copy(essen.position)
            _lift.copy(_right).multiplyScalar(jx).addScaledVector(_camUp, jy + F * es * 0.12)
            _inv2.copy(_inv); essen3d.position.add(_lift.applyQuaternion(_inv2))
            const sq = scared ? 0.88 + 0.06 * Math.sin(t * 30) : squash
            essen3d.scale.set(vs * (2 - sq), vs * sq, vs)
            // ¾ turn so his depth shows; scared: lean away from the spin + shiver.
            // Faces the viewer. Spinning (staff or cube momentum) spins him
            // too; once it stops he turns back to face us.
            const spinNow = momV !== 0 ? momV : (Math.abs(smV) > 1 ? smV : 0)
            if (Math.abs(spinNow) > 0.05 && !momHalt) essenTurn += spinNow * dt
            else essenTurn += (Math.round(essenTurn / (Math.PI * 2)) * Math.PI * 2 - essenTurn) * Math.min(1, dt * 5)
            const lean = -Math.sign(momV || smV) * 0.45 * F
            _q.copy(camera.quaternion)
              .multiply(_tilt.setFromEuler(_e.set(0, essenTurn, lean + Math.sin(t * 43) * 0.12 * F + Math.sin(t * 1.7) * 0.06 * (1 - F))))
            essen3d.quaternion.copy(_inv).multiply(_q)
            if (essenLight) {
              essen3d.getWorldPosition(_lift)
              essenLight.position.copy(camera.position).addScaledVector(_camUp, 0.6).addScaledVector(_right, -0.4)
              essenLight.target.position.copy(_lift)
              essenLight.target.updateMatrixWorld()
            }
          }
        }
        // Face the camera (world), then express in rotor-local space.
        _q.copy(camera.quaternion)
        _tilt.setFromEuler(_e.set(LOGO.tiltX * (1 - m), (sx === 0 ? 1 : -sx) * LOGO.tiltY * (1 - m), 0))
        _q.multiply(_tilt)
        _q.multiply(_spinQ.setFromAxisAngle(_Y, momSpin(l.sprite, 0.8 + 0.4 * ((l.node * 7 + (slotOf.get(l.node) ?? 0) * 3) % 5) / 4, dt)))
        l.sprite.quaternion.copy(_inv).multiply(_q)
        updateOutline(l.sprite)
        if (sy === 0) {
          const px = ((off + s * 0.75) / (2 * d * tanH)) * hpx
          const arr = sx < 0 ? reachL : reachR
          arr[l.node] = Math.max(arr[l.node] ?? 0, px)
        }
      })
    }

    /* HTML labels (not 3D text) — one per node, absolutely
       positioned every frame by updateLabels() to track its orb.
       Hover/click on the label mirrors hover/click on the orb. */
    function buildLabels() {
      const labelsEl = $('#node-labels')!
      nodes.forEach((n) => {
        const label = document.createElement('div')
        label.className = n.strand.category === 'plasmids' ? 'node-label is-plasmid' : n.strand.category === 'advisory' ? 'node-label is-advisory' : 'node-label'
        label.dataset.id = n.strand.id
        label.innerHTML = `
          <div class="node-label-pip"></div>
          <div class="node-label-text">
            <span class="node-label-name">${n.strand.name}</span>
            <span class="node-label-sub">${n.strand.subsidiary.split(' · ').map((p) => `<span class="node-label-sub-line">${p}</span>`).join('')}</span>
          </div>
        `
        label.addEventListener('mouseenter', () => { activate(n.strand.id); setLabelHover(n.strand.id) })
        label.addEventListener('mouseleave', () => { deactivate(); setLabelHover(null) })
        // A strand's label (its title bar) opens its window straight
        // away, as clicking the focused section cube does.
        label.addEventListener('click', (e) => {
          e.preventDefault()
          const idx = nodes.indexOf(n)
          if (idx >= 0) openPanel(idx)
        })
        labelsEl.appendChild(label)
      })
    }

    /* Keep renderer + camera in sync with the container size. */
    function onResize() {
      if (!renderer) return
      const w = container.clientWidth
      const h = container.clientHeight
      renderer.setPixelRatio(pixelRatio())
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      fitRest()
    }

    /* Convert mouse position to normalised device coords (-1..1)
       for the raycaster. Off-canvas is parked at -9999 (see onLeave)
       so render() can cheaply skip raycasting. */
    function aimAt(e: { clientX: number; clientY: number }) {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    }
    /* Hover tracks mice/pens only: a finger sliding over the scene
       (holding, swiping) must not light cubes up. Taps aim via onClick. */
    function onPointerMove(e: PointerEvent) {
      if (e.pointerType === 'touch') return
      aimAt(e)
    }

    /* Render resolution: desktop canvases are big, so cap at 1.5× for
       speed; phones are small but 3× dense, and at 1.5× the cube edges
       render soft (upscaled), so let them use their full density. */
    function pixelRatio() {
      const phone = Math.min(window.innerWidth, window.innerHeight) <= 720
      return Math.min(window.devicePixelRatio || 1, phone ? 3 : 1.5)
    }

    /* Phone layout (matches the ≤720px CSS): the view locks onto one
       strand (cube + its two project cubes) and swipes step strands. */
    const isPhone = () => window.matchMedia('(max-width: 720px)').matches
    const _tapV = new THREE.Vector3()

    /* ---- DRAG-TO-SPIN ---- grab the canvas and fling the coil;
       it keeps spinning with decaying momentum. Grabbing drops you
       into the free wide view (clears focus + camera) so the whole
       spiral is visible while it spins. */
    function onDragDown(e: PointerEvent) {
      if (e.button !== 0 || panelOpen) return
      // Phones: the view is locked on a strand; vertical swipes step
      // strands (initScrollNav). A drag-spin would hijack every swipe.
      if (isPhone()) return
      dragging = true
      dragMoved = false
      dragStartX = dragLastX = e.clientX
      dragLastT = performance.now()
      dragTarget = rotorAngle
      dragHist.length = 0
      // A press alone must not leave the focused node — a second click
      // on it OPENS the panel. Focus is only dropped once the press
      // becomes a genuine drag (see onDragMove).
      try { renderer.domElement.setPointerCapture(e.pointerId) } catch { /* noop */ }
    }
    function onDragMove(e: PointerEvent) {
      if (!dragging) return
      const now = performance.now()
      const dx = e.clientX - dragLastX
      // Below DRAG_CLICK_PX it's still a click: leave the staff alone, so
      // hand jitter can't nudge a focused section off-centre. dragLastX
      // stays at the press point, so the first real move carries the
      // whole travel since then.
      if (!dragMoved && Math.abs(e.clientX - dragStartX) <= DRAG_CLICK_PX) return
      if (!dragMoved) {
        dragMoved = true
        stallHold = false
        momHalt = false
        spinVel = 0
        rotorTarget = null              // cancel any snap/ease
        dragTarget = rotorAngle
        focusIndex = -1                 // dragging = exploratory default
        resetCamera()
        deactivate()
        typeAccent(DEFAULT_ACCENT)      // wide view → headline back to default
      }
      // Move the TARGET; render() eases the rotor onto it once per frame.
      dragTarget += dx * DRAG_SENS_POINTER
      dragHist.push({ t: now, a: dragTarget })
      while (dragHist.length > 2 && now - dragHist[0].t > FLING_WINDOW_MS) dragHist.shift()
      dragLastX = e.clientX
      dragLastT = now
    }
    function onDragUp(e: PointerEvent) {
      if (!dragging) return
      dragging = false
      try { renderer.domElement.releasePointerCapture(e.pointerId) } catch { /* noop */ }
      if (!dragMoved) { spinVel = 0; return }    // it was a click
      suppressClick = true                       // swallow the trailing click
      rotorAngle = dragTarget                    // land exactly where the hand left it
      // Fling speed: angle travelled over the last FLING_WINDOW_MS, capped.
      const now = performance.now()
      const first = dragHist.find((h) => now - h.t <= FLING_WINDOW_MS)
      const span = first ? (now - first.t) / 1000 : 0
      spinVel = first && span > 0.016 ? THREE.MathUtils.clamp((dragTarget - first.a) / span, -SPIN_MAX, SPIN_MAX) : 0
      // If the pointer paused before release, don't fling stale velocity.
      if (now - dragLastT > 90) spinVel = 0
    }
    function onDragCancel() {
      dragging = false
      spinVel = 0
    }

    /* Two-step: a first click only FOCUSES the node (zoom/snap +
       bubble, like scrolling to it). Clicking the already-focused
       node again opens the StrandPanel. (The "view more" bubble is
       the explicit one-click shortcut to open.) */
    function onNodeClick(idx: number) {
      if (focusIndex === idx) openPanel(idx)
      else focusByIndex(idx)
    }

    /* Canvas click → focus / open the hovered node (see onNodeClick).
       Skipped if this "click" was actually the end of a drag-spin. */
    function onClick(e: MouseEvent) {
      if (suppressClick) { suppressClick = false; return }
      // Aim at the click/tap point itself: a tap has no hover beforehand,
      // so hoveredOutput would be empty on touch screens.
      aimAt(e)
      raycaster.setFromCamera(pointer, camera)
      // Touch: aim for this tap only, then park the pointer so the tapped
      // cube isn't left highlighted (there's no hover to clear it).
      const touchTap = (e as PointerEvent).pointerType === 'touch' || isPhone()
      if (touchTap) requestAnimationFrame(() => { pointer.x = -9999; pointer.y = -9999 })
      // A project cube anywhere along the ray wins over the strand's hit
      // sphere (on phones the side cubes sit inside that sphere).
      let tapped = raycaster.intersectObjects(nodePickables, false)
        .find((h) => h.object.userData.outputId)?.object.userData.outputId as string | undefined
      // Phones: forgiving taps — the focused strand's nearest project cube
      // within ~70px of the tap counts.
      if (!tapped && isPhone() && isFocused()) {
        const r = renderer.domElement.getBoundingClientRect()
        const tx = e.clientX - r.left, ty = e.clientY - r.top
        let best = 70
        logos.forEach((l) => {
          if (l.node !== focusIndex) return
          const p = l.sprite.getWorldPosition(_tapV).project(camera)
          const dpx = Math.hypot((p.x * 0.5 + 0.5) * r.width - tx, (-p.y * 0.5 + 0.5) * r.height - ty)
          if (dpx < best) { best = dpx; tapped = l.o.id }
        })
      }
      if (tapped ?? hoveredOutput) { openProject((tapped ?? hoveredOutput)!); return }
      // Hit-test the actual click point: while focused, hoveredId falls
      // back to the focused node, so it can't tell a click on the node
      // from a click on open space. Open space → leave the focus.
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObjects(nodePickables, false)[0]
      const hitId = hit ? (hit.object.userData.strandId as string | undefined) : undefined
      if (!hitId) {
        if (isFocused() && !isPhone()) exitToDefault()   // phones stay locked on the strand
        return
      }
      const idx = nodes.findIndex((x) => x.strand.id === hitId)
      if (idx >= 0) onNodeClick(idx)
    }

    /* Compute the rotor Y-rotation that brings node `id` to front.
       alpha is the node's angle around the rod; subtracting π/2
       rotates it to face +Z (the camera). The while-loops pick the
       shortest signed path so the snap never spins the long way. */
    function snapRotorTo(id: string) {
      const n = nodes.find((x) => x.strand.id === id)
      if (!n) return
      const alpha = Math.atan2(n.orbPos.z, n.orbPos.x)
      rotorTarget = alpha - Math.PI / 2
      if (!Number.isFinite(rotorAngle)) rotorAngle = 0
      const TAU = Math.PI * 2
      let d = (rotorTarget - rotorAngle) % TAU
      if (d > Math.PI) d -= TAU
      else if (d < -Math.PI) d += TAU
      rotorTarget = rotorAngle + d
    }

    /* Park the coil on node `i` (clamped). Eases the rotor so the
       node faces the camera AND dollies the camera in: after the
       snap the node sits at world ≈ (0, y, rHoriz), so we look
       there and pull back CAM_DOLLY units. `instant` jumps with no
       animation (unused now, kept for flexibility). Also lights the
       node. Called by traverse() (scroll) and openPanel() (click). */
    /* Centre-headline accent: console typewriter. Cancels any
       in-flight type, then types `text` char-by-char; the CSS caret
       blinks forever right after it. No-ops if already showing
       `text` (so repeated focus/scroll on the same strand doesn't
       re-animate). DEFAULT shows when nothing is selected. */
    const DEFAULT_ACCENT = 'Digital Health'
    let accentTarget = ''
    let accentTimer = 0
    function typeAccent(text: string) {
      if (text === accentTarget) return
      accentTarget = text
      const el = $('#helix-accent')
      if (!el) return
      window.clearTimeout(accentTimer)
      el.textContent = ''
      let i = 0
      const step = () => {
        if (destroyed || accentTarget !== text) return
        i++
        el.textContent = text.slice(0, i)
        if (i < text.length) accentTimer = window.setTimeout(step, 48)
      }
      step()
    }
    cleanups.push(() => window.clearTimeout(accentTimer))

    function focusByIndex(i: number, instant = false) {
      focusIndex = THREE.MathUtils.clamp(i, 0, NODE.count - 1)
      const n = nodes[focusIndex]
      if (!n) return
      spinVel = 0                                    // cancel any fling so the snap wins
      typeAccent(n.strand.accent)                    // retype the headline accent
      snapRotorTo(n.strand.id)                       // sets rotorTarget
      const rHoriz = Math.hypot(n.orbPos.x, n.orbPos.z)
      camLookTarget.set(0, n.orbPos.y - SNAKE.drop, rHoriz)
      camPosTarget.set(0, n.orbPos.y - SNAKE.drop, rHoriz + CAM_DOLLY)
      if (instant) {
        if (rotorTarget !== null) { rotorAngle = rotorTarget; rotorTarget = null }
        camera.position.copy(camPosTarget)
        camLookCurrent.copy(camLookTarget)
        camera.lookAt(camLookCurrent)
      }
      activate(n.strand.id)
    }

    /* Reset the camera framing to the wide resting view (used when
       the panel closes). The render loop eases back to it. */
    function resetCamera() {
      camPosTarget.set(0, REST.y, REST.z)
      camLookTarget.set(0, REST.y, 0)
    }

    /* Open the StrandPanel for node `i`: zoom in (focusByIndex) and
       hand the adapted strand to React state. `panelOpen` freezes
       the idle spin while the card is up. */
    function openPanel(i: number) {
      focusByIndex(i)
      panelOpen = true
      const n = nodes[focusIndex]
      if (n) setPanelStrand(toDataStrand(n.strand))
    }
    /* Open a project's window: park on its category node first. */
    function openProject(outputId: string) {
      const o = outputById(outputId)
      if (!o) return
      const i = nodes.findIndex((x) => x.strand.category === o.category)
      if (i < 0) return
      // No public page yet → show its strand's window instead. Advisory
      // services always open their own window (write-up + email only).
      if (!isOpen(o) && !isAdvisory(o)) { openPanel(i); return }
      focusByIndex(i)
      panelOpen = true
      setPanelStrand({ id: PROJECT_PREFIX + o.id, label: o.title, tagline: '', href: isAdvisory(o) ? '#' : '#output/' + o.id, themes: [] })
    }
    sceneApi.openProject = openProject

    /* Invoked from the React close handler via closePanelRef (close
       button / backdrop / Esc). Returns to wherever you were: the
       focused node (re-framed) if one is selected, else the wide
       default. The React side clears panelStrand itself. */
    function closePanel() {
      panelOpen = false
      if (isFocused()) focusByIndex(focusIndex)   // keep the camera framed on the focused orb
      else resetCamera()
      // ...but always reset the headline to the default (B): focusByIndex
      // re-types the strand's accent at line ~764, so this must run AFTER
      // it to win. typeAccent() cancels that in-flight type same-tick.
      typeAccent(DEFAULT_ACCENT)
    }
    closePanelRef.current = closePanel

    /* Esc → fully zoom back OUT to the default wide view (closing
       the panel too if it's open). Distinct from the panel's × /
       backdrop, which return to the focused node; Esc always exits
       all the way to default. */
    function exitToDefault() {
      stallHold = false
      if (panelOpen) { panelOpen = false; setPanelStrand(null) }
      spinVel = 0
      focusIndex = -1
      resetCamera()
      setLabelHover(null)
      deactivate()        // focusIndex is -1 → clears the lit orb
      typeAccent(DEFAULT_ACCENT)
    }
    /* Keyboard model:
         Esc ....... step back one level — panel → focused node → staff.
         ↑ / ↓ ..... traverse nodes (same as scroll). With the panel
                     open, steps to the neighbouring node and swaps
                     the panel's content (window keeps its layout).
         Enter ..... open the focused (or hovered) node; from the
                     default view, enters the spiral at the first node.
         ? ......... toggle the navigation pop-out. */
    let lastKeyT = 0
    function stepPanel(dir: number) {
      const next = focusIndex + dir
      if (next < 0 || next >= NODE.count) return
      focusByIndex(next)
      setPanelStrand(toDataStrand(nodes[next].strand))
    }
    const onKey = (e: KeyboardEvent) => {
      if (!animationActive) return
      // Menu open: Esc closes it; every other key is ignored.
      if ($('#menu-overlay')?.classList.contains('is-open')) {
        if (e.key === 'Escape') { e.preventDefault(); onMenuClose() }
        return
      }
      const tgt = e.target instanceof Element ? (e.target as HTMLElement) : null
      if (tgt && /^(INPUT|TEXTAREA|SELECT)$/.test(tgt.tagName)) return
      const listUp = listview.classList.contains('is-visible')
      if (e.key === 'Escape') {
        e.preventDefault()
        if (panelOpen) { setPanelStrand(null); closePanel() }
        else exitToDefault()
        return
      }
      if (e.key === '?') { showHelpRef.current(true); return }
      if (listUp) return
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const now = performance.now()
        if (e.repeat && now - lastKeyT < 260) return
        lastKeyT = now
        const dir = e.key === 'ArrowDown' ? 1 : -1
        if (panelOpen) stepPanel(dir)
        else traverse(dir)
        return
      }
      if (e.key === 'Enter') {
        if (tgt && tgt.closest('button, a')) return   // let focused controls handle Enter
        e.preventDefault()
        if (panelOpen) return
        if (isFocused()) openPanel(focusIndex)
        else if (hoveredId) openPanel(nodes.findIndex((x) => x.strand.id === hoveredId))
        else focusByIndex(0)
      }
    }
    window.addEventListener('keydown', onKey)
    cleanups.push(() => window.removeEventListener('keydown', onKey))

    /* Step the traversal by `dir` (±1). focusIndex is either -1
       (DEFAULT view) or 0..count-1 (a node).
       • From default: scroll DOWN enters the spiral at the FIRST
         node, scroll UP enters at the LAST node — symmetric, just
         from opposite ends.
       • On the spiral: step ±1; stepping off either end returns to
         the default view. */
    function traverse(dir: number) {
      if (!isFocused()) {
        focusByIndex(dir > 0 ? 0 : NODE.count - 1)
        return
      }
      const next = focusIndex + dir
      // Phones: locked on a strand — the ends stop rather than zoom out.
      if (isPhone() && (next < 0 || next >= NODE.count)) return
      if (next < 0 || next >= NODE.count) {
        focusIndex = -1            // off either end → default
        resetCamera()
        deactivate()
        typeAccent(DEFAULT_ACCENT)
        return
      }
      focusByIndex(next)           // snap + dolly + light + bubble
    }

    /* Wheel / swipe drives traverse(), one node per gesture, with a
       cooldown so a trackpad flick can't skip several. Ignored
       while the panel is open or the list view is up. */
    function initScrollNav() {
      let locked = false
      const step = (dir: number) => {
        if (locked || panelOpen) return
        const prev = focusIndex
        traverse(dir)
        if (focusIndex === prev) return        // safety: no state change
        locked = true
        const tm = setTimeout(() => { locked = false }, 700)
        cleanups.push(() => clearTimeout(tm))
      }
      /* Sideways scroll (trackpad swipe, tilt wheel, or shift+wheel)
         spins the coil. Each event adds an impulse to spinVel sized so
         its total coast equals the same distance dragged (DRAG_SENS ×
         decay constant) — so scrolling builds and carries momentum
         exactly like a fling, and the cube momentum follows the
         resulting rotation speed. Vertical scroll is ignored for a
         beat after a sideways gesture so a diagonal swipe doesn't
         also traverse nodes. */
      const WHEEL_IMPULSE = DRAG_SENS * -Math.log(SPIN_DECAY)
      let lastSideT = 0
      const onWheel = (e: WheelEvent) => {
        if (panelOpen || listview.classList.contains('is-visible')) return
        e.preventDefault()
        const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerWidth : 1
        const now = performance.now()
        const dx = (e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX) * unit
        const dy = e.shiftKey ? 0 : e.deltaY * unit
        /* Axis lock: a gesture (events < 160ms apart) commits to ONE
           axis once its accumulated motion is clear (12px, 2:1). A
           vertical rung-scroll can then never drift sideways and pull
           the focused node off-centre; tail-end inertia jitter is
           ignored. */
        const wdt = Math.max((now - lastWheelT) / 1000, 0.008)
        if (now - lastWheelT > 160) { gAxis = null; gX = 0; gY = 0; swVel = 0; swDecayN = 0; swPrevDx = 0 }
        lastWheelT = now
        if (!gAxis) {
          gX += Math.abs(dx); gY += Math.abs(dy)
          if (gX > 12 && gX > gY * 2) gAxis = 'x'
          else if (gY > 12 && gY > gX * 2) gAxis = 'y'
        }
        // Two fingers down on the trackpad while the staff is coasting
        // (from a drag fling) stalls it: the first wheel event of the
        // touch stops the spin and is swallowed (no node step).
        const freeTurning = !isFocused() && !panelOpen && !stallHold && rotorTarget === null
        const moving = Math.abs(spinVel) > SPIN_STOP || freeTurning || (cubeMomentum && momV !== 0)
        // Never while focused: a snap between sections turns the staff fast
        // enough to charge momV, and the trackpad's small inertia tail would
        // then cancel the snap part-way, parking the section off-centre.
        if (!isFocused() && moving && Math.abs(dx) + Math.abs(dy) < 10 && performance.now() - lastSideT > 120) {
          spinVel = 0
          rotorTarget = null
          stallHold = true
          momHalt = true
          momV = 0
          lastSideT = performance.now()
          return
        }
        if (gAxis === null) return
        if (gAxis === 'x') {
          if (Math.abs(dx) < 1) return
          lastSideT = performance.now()
          if (rotorTarget !== null || isFocused()) {
            momHalt = false
            rotorTarget = null
            focusIndex = -1
            resetCamera()
            deactivate()
            typeAccent(DEFAULT_ACCENT)
          }
          // Direct: the swipe turns the staff 1:1 (same px→rad as a drag).
          // Coasting comes from the trackpad's own inertia, so resting two
          // fingers on it — which ends that inertia — stalls the spin.
          // …and its speed is tracked, so once the events stop (fingers
          // lifted, no OS inertia) the staff flings on like a drag — the
          // render loop holds the coast while events are still arriving.
          rotorAngle -= dx * DRAG_SENS
          swVel = swVel * 0.6 + ((-dx * DRAG_SENS) / wdt) * 0.4
          swDecayN = swPrevDx && Math.abs(dx) < Math.abs(swPrevDx) * 0.97 ? swDecayN + 1 : 0
          swPrevDx = dx
          swPending = true
          spinVel = 0
          return
        }
        if (performance.now() - lastSideT < 350) return
        if (Math.abs(dy) < 6) return
        step(dy > 0 ? 1 : -1)
      }
      let touchY = 0
      const onTouchStart = (e: TouchEvent) => { touchY = e.touches[0]?.clientY ?? 0 }
      const onTouchEnd = (e: TouchEvent) => {
        if (panelOpen || listview.classList.contains('is-visible')) return
        if ($('#menu-overlay')?.classList.contains('is-open')) return   // menu's own swipe
        const dy = (e.changedTouches[0]?.clientY ?? touchY) - touchY
        if (Math.abs(dy) < 40) return
        step(dy < 0 ? 1 : -1)                  // swipe up → next
      }
      root!.addEventListener('wheel', onWheel, { passive: false })
      root!.addEventListener('touchstart', onTouchStart, { passive: true })
      root!.addEventListener('touchend', onTouchEnd, { passive: true })
      cleanups.push(() => {
        root!.removeEventListener('wheel', onWheel)
        root!.removeEventListener('touchstart', onTouchStart)
        root!.removeEventListener('touchend', onTouchEnd)
      })
    }

    /* Light up a strand's ORB (crimson + emissive) + drive the
       bubble. Called by both pointer hover and scroll-focus. NOTE:
       the HTML label highlight is deliberately NOT done here — see
       setLabelHover (pointer-hover only). */
    function activate(id: string) {
      if (hoveredId === id) return
      hoveredId = id
      const C = themeColours()
      nodes.forEach((n) => {
        const isActive = n.strand.id === id
        if (n.orb.userData.cube) return            // section cubes: crimson only under the pointer (render loop)
        const m = n.orb.material as THREE.MeshStandardMaterial
        m.color.copy(isActive ? C.crimson : (n.orb.userData.baseColor as THREE.Color))
        m.emissive.copy(isActive ? C.crimson : new THREE.Color(0x000000))
        m.emissiveIntensity = isActive ? 0.55 : 0
      })
    }
    /* Hover-off: if a node is scroll-focused, keep its orb lit (fall
       back to it so its bubble stays). Otherwise reset every orb. */
    function deactivate() {
      const fid = isFocused() ? nodes[focusIndex]?.strand.id : undefined
      if (fid) {
        if (hoveredId !== fid) { hoveredId = null; activate(fid) }
        return
      }
      if (hoveredId === null) return
      hoveredId = null
      nodes.forEach((n) => {
        if (n.orb.userData.cube) { setNodeCubeAccent(n.orb, false); return }
        const m = n.orb.material as THREE.MeshStandardMaterial
        m.color.copy(n.orb.userData.baseColor as THREE.Color)
        m.emissive.set(0x000000)
        m.emissiveIntensity = 0
      })
    }

    /* HTML-label highlight = genuine pointer hover ONLY (never
       scroll-focus). Pass the hovered node id, or null to clear.
       Every tag stays visible + neutral; only the node the cursor
       is actually over gets the red pip/name. */
    function setLabelHover(id: string | null) {
      $$('.node-label').forEach((l) => {
        l.classList.toggle('is-active', id !== null && l.dataset.id === id)
      })
    }

    /* The per-frame heartbeat. dt = seconds since last frame (for
       framerate-independent motion); elapsed = seconds since start
       (for the pulse phase). Order: spin → pulse rings → glow light
       → raycast hover → reposition labels → draw. */
    function render(dt: number, elapsed: number) {
      // 1. Rotor priority: active drag (angle set in onDragMove) →
      //    decaying fling momentum → snap/ease to target → gentle
      //    idle auto-spin (default view only).
      if (swPending && performance.now() - lastWheelT > 50) {
        swPending = false
        if (swDecayN >= 4) { spinVel = 0; stallHold = true; momHalt = true; momV = 0 }
        else if (!isFocused()) spinVel = THREE.MathUtils.clamp(swVel, -SPIN_MAX, SPIN_MAX)
      }
      // Focused ⇒ dead centre. Whatever left the staff idle off its snap
      // angle (an interrupted snap, a stray nudge), ease it back.
      if (isFocused() && !dragging && rotorTarget === null && Math.abs(spinVel) <= SPIN_STOP) {
        snapRotorTo(nodes[focusIndex].strand.id)
        if (rotorTarget !== null && Math.abs(rotorTarget - rotorAngle) < 1e-4) rotorTarget = null
      }
      if (!Number.isFinite(rotorAngle)) rotorAngle = 0
      if (!Number.isFinite(spinVel)) spinVel = 0
      if (!Number.isFinite(swVel)) swVel = 0
      if (dragging) {
        // Ease onto the drag target (set by onDragMove), frame-rate safe.
        if (dragMoved) rotorAngle += (dragTarget - rotorAngle) * (1 - Math.exp(-dt / DRAG_FOLLOW_S))
      } else if (Math.abs(spinVel) > SPIN_STOP) {
        // While swipe events are still arriving they move the rotor
        // directly; the coast takes over once they stop.
        if (performance.now() - lastWheelT > 50) {
          rotorAngle += spinVel * dt
          spinVel *= Math.pow(SPIN_DECAY, dt)   // frame-rate-independent decay
        }
      } else if (rotorTarget !== null) {
        spinVel = 0
        const diff = rotorTarget - rotorAngle
        if (Math.abs(diff) < 0.005) {
          rotorAngle = rotorTarget
          rotorTarget = null
        } else {
          rotorAngle += diff * Math.min(1, dt * 6)
        }
      } else if (stallHold && performance.now() - lastWheelT > STALL_RELEASE) {
        stallHold = false
      } else if (!panelOpen && !isFocused() && !hoveredId && !stallHold) {
        rotorAngle += ROTOR_FREE_SPEED * dt
      }
      rotor.rotation.y = rotorAngle

      // 1b. Camera dolly: glide position + lookAt toward the framing
      //     focusByIndex picked for the focused node (exp. smoothing,
      //     frame-rate safe). Done before the rings billboard so they
      //     face the updated camera.
      camera.position.lerp(camPosTarget, Math.min(1, dt * 4))
      camLookCurrent.lerp(camLookTarget, Math.min(1, dt * 4))
      camera.lookAt(camLookCurrent)

      // 2. Pulse rings: two offset sawtooth phases drive an
      //    expanding-and-fading ring; inactive nodes pulse faintly
      //    (activeMul 0.18), the hovered one fully. Rings billboard
      //    to face the camera each frame.
      const phase = (elapsed * NODE.pulseSpeed) % 1
      const phase2 = ((elapsed * NODE.pulseSpeed) + 0.35) % 1
      nodes.forEach((n) => {
        const isActive = hoveredId === n.strand.id
        const activeMul = isActive ? 1 : n.orb.userData.cube ? 0 : 0.18
        n.ring1.scale.setScalar(1 + phase * 0.6)
        n.ring2.scale.setScalar(1 + phase2 * 0.6)
        ;(n.ring1.material as THREE.MeshBasicMaterial).opacity = (0.7 * (1 - phase)) * activeMul
        ;(n.ring2.material as THREE.MeshBasicMaterial).opacity = (0.55 * (1 - phase2)) * activeMul

        n.ring1.lookAt(camera.position)
        n.ring2.lookAt(camera.position)
        if (n.orb.userData.plasmid) { n.orb.rotation.y += dt * 0.7; n.orb.rotation.x += dt * 0.25 }
      })

      // 3. Glow light: park it on the hovered orb's world position
      //    and ease intensity toward 1.8; ease back to 0 otherwise.
      //    (Lerp factor dt*k = exponential smoothing, frame-rate safe.)
      if (hoveredId) {
        const n = nodes.find((x) => x.strand.id === hoveredId)
        if (n) {
          activeNodePointLight.position.copy(n.orb.getWorldPosition(_lp))
          activeNodePointLight.intensity += (1.8 - activeNodePointLight.intensity) * Math.min(1, dt * 8)
        }
      } else {
        activeNodePointLight.intensity += (0 - activeNodePointLight.intensity) * Math.min(1, dt * 6)
      }

      // 4. Hover detection: raycast the orbs unless the pointer is
      //    parked off-canvas (x left at -9999) or the list view hides
      //    the canvas.
      const sceneHidden = listview.classList.contains('is-visible')
      // No hover highlights while the staff is being dragged or is still
      // coasting from a fling: cubes flashing crimson under a sweeping
      // cursor looks clunky. Clear any highlight and resume once settled.
      const spinning = (dragging && dragMoved) || Math.abs(spinVel) > SPIN_STOP
      if (spinning) {
        hoveredOutput = null
        pointerSection = null
        if (hoveredId !== null && !isFocused()) deactivate()
        setLabelHover(null)
      } else if (pointer.x > -2 && !sceneHidden) {
        raycaster.setFromCamera(pointer, camera)
        const hits = raycaster.intersectObjects(nodePickables, false)
        if (hits.length) {
          const top = hits.find((h) => h.object.userData.outputId) ?? hits[0]   // project cubes first
          const id = top.object.userData.strandId as string
          hoveredOutput = (top.object.userData.outputId as string | undefined) ?? null
          pointerSection = top.object.userData.outputId ? null : id   // the cube or its hit area
          if (id !== hoveredId) activate(id)
          setLabelHover(id)
        } else {
          hoveredOutput = null
          pointerSection = null
          if (hoveredId !== null) deactivate()
          setLabelHover(null)
        }
      }

      // Pointer parked (left the canvas, or a touch tap finished): nothing
      // is hovered any more — clear it, or a tapped cube stays crimson.
      if (pointer.x <= -2) {
        pointerSection = null
        if (hoveredOutput !== null) { hoveredOutput = null; setLabelHover(null) }
      }
      // Section cubes: plum by default (focused included); crimson only
      // while the cursor is actually on that cube.
      nodes.forEach((n) => {
        if (!n.orb.userData.cube) return
        const want = pointerSection === n.strand.id
        if (!!n.orb.userData.accentOn !== want) setNodeCubeAccent(n.orb, want)
      })
      reachL.length = 0; reachR.length = 0
      updateLogos(dt)
      avoidClusters(dt)
      // 5 & 6. Sync the HTML labels (this also places a window opened in
      // list view), then draw the frame — skipped while the list view
      // hides the canvas, which is the bulk of the per-frame cost.
      updateLabels()
      if (!sceneHidden) renderer.render(scene, camera)
    }

    /* Project each orb's 3D world position to screen pixels and
       place its HTML label there, flipped to the orb's outward
       side. Tags are CONSTANTLY visible — no depth/behind fade,
       opacity is always 1 — so every strand is readable at all
       times; only positioning tracks the 3D motion. */
    /* One gap (px) between any focused cube's lower edge and its caption. */
    const CAP_GAP = 14
    const capEls = new Map<string, HTMLDivElement>()
    /* Per-frame scratch + caches: the label elements are looked up once,
       the layout size is read once per frame (re-reading it after style
       writes forces a synchronous reflow), and vectors are reused. */
    const labelEls = new Map<string, HTMLElement>()
    let labelsElCached: HTMLElement | null = null
    const _lp = new THREE.Vector3(), _lo = new THREE.Vector3()
    /* Labels never sit on top of one another, nor over the focused
       strand's cube row (e.g. Plasmids' name over Advisory's cubes).
       Priority: focused, then hovered, then nearest the camera; a label
       that would overlap one already placed fades out until it's clear. */
    const _dv = new THREE.Vector3()
    function screenBox(o: THREE.Object3D, w: number, h: number) {
      const half = o.scale.y * 0.5
      const c = o.getWorldPosition(_dv).project(camera)
      const cx = (c.x * 0.5 + 0.5) * w, cy = (-c.y * 0.5 + 0.5) * h
      const e = o.getWorldPosition(_dv).addScaledVector(_camUp, half).project(camera)
      const r = Math.abs((-e.y * 0.5 + 0.5) * h - cy)
      return { l: cx - r, t: cy - r, r: cx + r, b: cy + r }
    }
    /* Collision avoidance: before two strands' clusters meet on screen,
       the lower-priority one (not focused / hovered, farther away) slides
       along the coil — clockwise or anticlockwise round the staff,
       whichever opens the gap — and eases back to its place once its rest
       spot is clear again. Nothing is ever hidden for it. */
    /* margin/back = px sideways clearance to start sliding / to return;
       my = px vertical clearance that counts as touching; look = s
       of look-ahead at the staff's spin; rate = t/s slide speed (≈ 3 turns
       × 360° per t, so 0.45 ≈ 490°/s); max = furthest slide (≈ 130°). */
    const AVOID = { margin: 70, back: 96, my: 6, look: 0.6, rate: 0.45, max: 0.12, ease: 2, tMin: 0.015, tMax: 0.88 }
    const _av = new THREE.Vector3()
    const screenX = (t: number, w: number) => {
      serpentCurve.getPoint(THREE.MathUtils.clamp(t, AVOID.tMin, AVOID.tMax), _av)
      rotor.localToWorld(_av).project(camera)
      return (_av.x * 0.5 + 0.5) * w
    }
    type Box = { l: number; t: number; r: number; b: number }
    const shiftBox = (b: Box, dx: number): Box => ({ l: b.l + dx, r: b.r + dx, t: b.t, b: b.b })
    // Early warning is horizontal (the spin brings strands together
    // sideways); vertically only a near-touch counts, or every pair of
    // neighbours on the coil would always look threatened.
    const nearBox = (a: Box, p: Box, m: number) => a.l < p.r + m && a.r > p.l - m && a.t < p.b + AVOID.my && a.b > p.t - AVOID.my
    function avoidClusters(dt: number) {
      const w = container.clientWidth, h = container.clientHeight
      const hovered = hoveredId ? nodes.findIndex((x) => x.strand.id === hoveredId) : -1
      // Every cube on its own (the section cube AND each project sub-cube),
      // so the check reacts as soon as any sub-cube nears another strand's.
      const cubes: Box[][] = nodes.map((n, ni) => {
        if (!n.orb.userData.cube) return []
        const list = [screenBox(n.orb, w, h)]
        logos.forEach((l) => { if (l.node === ni && l.sprite.visible) list.push(screenBox(l.sprite, w, h)) })
        return list
      })
      // Look ahead: where each strand will be in AVOID.look seconds at the
      // staff's current turning speed (smV), as a screen-x shift.
      const a = THREE.MathUtils.clamp(smV * AVOID.look, -1.4, 1.4), ca = Math.cos(a), sa = Math.sin(a)
      const ahead = nodes.map((n) => {
        n.orb.getWorldPosition(_dv)
        const x0 = (_dv.clone().project(camera).x * 0.5 + 0.5) * w
        _av.set(_dv.x * ca + _dv.z * sa, _dv.y, -_dv.x * sa + _dv.z * ca).project(camera)
        return (_av.x * 0.5 + 0.5) * w - x0
      })
      const z = nodes.map((n) => n.orb.getWorldPosition(_dv).project(camera).z)
      const rank = (i: number) => (i === focusIndex && isFocused() ? 0 : i === hovered ? 1 : 2)
      const order = nodes.map((_, ni) => ni).filter((ni) => cubes[ni].length).sort((x, y) => rank(x) - rank(y) || z[x] - z[y])
      // Any cube of `ni` (optionally moved by dx) within `m` of any cube of
      // `pi`, now or at the look-ahead.
      const clash = (ni: number, pi: number, m: number, dx = 0) =>
        cubes[ni].some((c) => cubes[pi].some((p) =>
          nearBox(shiftBox(c, dx), p, m) || nearBox(shiftBox(c, dx + ahead[ni]), shiftBox(p, ahead[pi]), m)))
      const placed: number[] = []
      order.forEach((ni) => {
        const n = nodes[ni]
        const off = n.tOff ?? 0
        // The focused / hovered strand never moves (it's being looked at).
        if (rank(ni) < 2) { n.tOff = off + (0 - off) * Math.min(1, dt * AVOID.ease * 3); n.avoidDir = 0; placed.push(ni); return }
        const threat = placed.find((pi) => clash(ni, pi, AVOID.margin))
        if (threat !== undefined) {
          // Pick a way once (whichever widens the gap to the other strand),
          // then keep it until clear, so it never dithers.
          if (!n.avoidDir) {
            const pc = (cubes[threat][0].l + cubes[threat][0].r) / 2 + ahead[threat]
            const t0 = n.t + off, eps = 0.012
            n.avoidDir = Math.abs(screenX(t0 + eps, w) - pc) >= Math.abs(screenX(t0 - eps, w) - pc) ? 1 : -1
          }
          let next = off + n.avoidDir * AVOID.rate * dt
          // Hit the end of its travel: try the other way instead.
          if (Math.abs(next) > AVOID.max) { n.avoidDir = -n.avoidDir; next = THREE.MathUtils.clamp(next, -AVOID.max, AVOID.max) }
          n.tOff = next
        } else {
          n.avoidDir = 0
          if (off !== 0) {
            // Clear: head home once the rest spot itself is clear, with a
            // wider margin (now and ahead), so it doesn't bounce back.
            const dx = screenX(n.t, w) - screenX(n.t + off, w)
            if (!placed.some((pi) => clash(ni, pi, AVOID.back, dx))) {
              let nOff = off + (0 - off) * Math.min(1, dt * AVOID.ease)
              if (Math.abs(nOff) < 0.0008) nOff = 0
              n.tOff = nOff
            }
          }
        }
        placed.push(ni)
      })
    }
    function declutterLabels(depth: number[], shown: boolean[], w: number, h: number) {
      const PAD = 6
      const host = labelsElCached!.getBoundingClientRect()
      const hovered = hoveredId ? nodes.findIndex((x) => x.strand.id === hoveredId) : -1
      const order = nodes.map((_, ni) => ni).filter((ni) => shown[ni]).sort((a, b) => {
        const pa = a === focusIndex && isFocused() ? 0 : a === hovered ? 1 : 2
        const pb = b === focusIndex && isFocused() ? 0 : b === hovered ? 1 : 2
        return pa - pb || depth[a] - depth[b]
      })
      const placed: { l: number; t: number; r: number; b: number }[] = []
      const hits = (bx: { l: number; t: number; r: number; b: number }) =>
        placed.some((p) => bx.l < p.r + PAD && bx.r > p.l - PAD && bx.t < p.b + PAD && bx.b > p.t - PAD)
      order.forEach((ni, k) => {
        const label = labelEls.get(nodes[ni].strand.id)
        const text = label?.querySelector('.node-label-text') as HTMLElement | null
        if (!label || !text) return
        const r = text.getBoundingClientRect()
        const box = { l: r.left - host.left, t: r.top - host.top, r: r.right - host.left, b: r.bottom - host.top }
        const clash = k > 0 && hits(box)
        label.classList.toggle('is-occluded', clash)
        if (!clash) placed.push(box)
        // The focused strand's cubes + their captions are obstacles too.
        if (k === 0 && ni === focusIndex && isFocused()) {
          placed.push(screenBox(nodes[ni].orb, w, h))
          logos.forEach((l) => { if (l.node === ni && l.sprite.visible) { const b = screenBox(l.sprite, w, h); b.b += CAP_GAP + 48; placed.push(b) } })
        }
      })
      nodes.forEach((n, ni) => { if (!shown[ni]) labelEls.get(n.strand.id)?.classList.remove('is-occluded') })
    }

    function updateLabels() {
      const labelsEl = labelsElCached ?? (labelsElCached = $('#node-labels')!)
      const w = labelsEl.clientWidth
      const h = labelsEl.clientHeight
      const phone = isPhone()
      _camUp.setFromMatrixColumn(camera.matrixWorld, 1)
      const depth: number[] = [], shown: boolean[] = []

      nodes.forEach((n, ni) => {
        // project() → normalised device coords (-1..1); remap to px.
        const projP = n.orb.getWorldPosition(_lp).project(camera)
        depth[ni] = projP.z
        const px = (projP.x * 0.5 + 0.5) * w
        const py = (-projP.y * 0.5 + 0.5) * h
        let label = labelEls.get(n.strand.id)
        if (!label || !label.isConnected) {
          label = $(`.node-label[data-id="${n.strand.id}"]`) ?? undefined
          if (!label) return
          labelEls.set(n.strand.id, label)
        }
        // Anchor the label exactly on the orb so the pip stays
        // centred inside it at all times; only the text block flips
        // to the inboard side via .is-left, so the text never
        // crosses the rod as the orb passes screen centre.
        //
        // While zoomed/focused on a node, FREEZE each label's side:
        // the camera dolly would otherwise drag orbs across screen
        // centre and flip the text mid-zoom. Position still tracks
        // the orb every frame; only the L/R latch is held until the
        // view returns to the default (un-focused) state.
        if (!isFocused()) {
          label.classList.toggle('is-left', px <= w / 2)
        }
        label.style.transform = `translate(${px}px, ${py}px) translate(-50%, -50%)`
        const topMode = (tileMix[ni] ?? 0) > 0.5
        label.classList.toggle('is-top', topMode)
        // Section cubes (embedded): when focused, the name goes BELOW the
        // cube and its "view more" button instead of on top of the cube.
        const below = topMode && !!n.orb.userData.cube
        label.classList.toggle('is-below', below)
        if (below) {
          const half = n.orb.scale.y * 0.5
          const lo = n.orb.getWorldPosition(_lo).addScaledVector(_camUp, -half).project(camera)
          const cubeBottom = (-lo.y * 0.5 + 0.5) * h - py
          label.style.setProperty('--below', `${Math.round(cubeBottom + CAP_GAP)}px`)
        }
        const ownSide = label.classList.contains('is-left') ? reachL[ni] : reachR[ni]
        label.style.setProperty('--side-gap', topMode ? '0px' : `${Math.round(ownSide ?? 0)}px`)
        // Phones, focused: only the focused strand's label; the others
        // would float over the locked three-cube view.
        const hideHere = phone && isFocused() && ni !== focusIndex
        label.style.opacity = hideHere ? '0' : '1'
        label.style.visibility = hideHere ? 'hidden' : ''          // no fade-out ghost mid-swipe
        shown[ni] = !hideHere
      })
      declutterLabels(depth, shown, w, h)


      // Project captions — focused section only: a boxed name + type
      // under each project cube, at the same CAP_GAP as the section's.
      const capsEl = labelsEl
      logos.forEach((l) => {
        let cap = capEls.get(l.o.id)
        if (!cap) {
          cap = document.createElement('div')
          cap.className = 'cube-cap'
          const oid = l.o.id
          cap.addEventListener('click', () => openProject(oid))   // phones: the caption is a tap target too
          cap.innerHTML = `<span class="cube-cap-name">${l.o.product || outputName(l.o)}</span><span class="cube-cap-sub">${typeById(l.o.type).label.toLowerCase()}</span><span class="cube-cap-sub">${String(stageLabel(l.o) || '').toLowerCase()}</span>`
          capsEl.appendChild(cap)
          capEls.set(l.o.id, cap)
        }
        const on = !!nodes[l.node]?.orb.userData.cube && (tileMix[l.node] ?? 0) > 0.6 && !panelOpen
          && (!phone || l.node === focusIndex)                       // phones: the focused strand's only, at once
        cap.classList.toggle('is-visible', on)
        // Keep tracking the cube even while hidden: a caption that stopped
        // being positioned froze in place for its 0.25s fade-out, so it
        // hung behind as its cube moved on (the "lingering" labels).
        // Desktop: under the cube. Phones: ABOVE it, no wider than the
        // cube — the strand's own label owns the band below the row.
        const half = l.sprite.scale.y * 0.5
        const lo = l.sprite.getWorldPosition(_lo).addScaledVector(_camUp, phone ? half : -half).project(camera)
        const cx = (lo.x * 0.5 + 0.5) * w
        const cy = (-lo.y * 0.5 + 0.5) * h
        if (phone) {
          const edge = l.sprite.getWorldPosition(_lp).addScaledVector(_camUp, -half).project(camera)
          const cubePx = Math.abs(((-edge.y * 0.5 + 0.5) * h) - cy)       // on-screen edge length
          cap.style.maxWidth = `${Math.round(cubePx + 8)}px`
          cap.style.transform = `translate(${Math.round(cx)}px, ${Math.round(cy - CAP_GAP * 0.6)}px) translate(-50%, -100%)`
        } else {
          cap.style.maxWidth = ''
          cap.style.transform = `translate(${Math.round(cx)}px, ${Math.round(cy + CAP_GAP)}px) translate(-50%, 0)`
        }
      })

      // "view more" bubble — pinned just below the active (focused
      // or hovered) node; hidden in the default view / when paneled.
      const bubbleNode = hoveredId && !panelOpen ? nodes.find((x) => x.strand.id === hoveredId) : undefined
      if (bubbleNode?.orb.userData.cube) {
        bubbleEl.classList.remove('is-visible')     // section cubes: click the cube to open
      } else if (hoveredId && !panelOpen) {
        const n = nodes.find((x) => x.strand.id === hoveredId)
        if (n) {
          const bp = n.orb.getWorldPosition(_lp).project(camera)
          const bx = (bp.x * 0.5 + 0.5) * w
          const by = (-bp.y * 0.5 + 0.5) * h
          // Section cubes: drop the bubble below the cube's lower edge.
          let dy = 28
          if (n.orb.userData.cube) {
            const half = n.orb.scale.y * 0.5
            const lo = n.orb.getWorldPosition(_lo).addScaledVector(_camUp, -half).project(camera)
            dy = Math.max(28, (-lo.y * 0.5 + 0.5) * h - by + 30)
          }
          bubbleEl.style.transform = `translate(${bx}px, ${by}px) translate(-50%, ${dy}px)`
          bubbleEl.classList.add('is-visible')
        }
      } else {
        bubbleEl.classList.remove('is-visible')
      }

      // Strand drawer — tethered just under the focused node, so it
      // reads as "drawn out" from there. Clamped to stay on-screen;
      // max-height capped to the viewport (it scrolls internally).
      // No focused node to hang it on → centre it (it used to stay parked
      // off-screen, leaving only the dim scrim).
      if (panelOpen && winModeRef.current === 'dock') {
        const drawer = $('#strand-drawer') as HTMLDivElement | null
        const n = isFocused() ? nodes[focusIndex] : null
        if (drawer) {
          const dp = n ? n.orb.getWorldPosition(_lp).project(camera) : _lp.set(0, 0, 0)
          const dx = (dp.x * 0.5 + 0.5) * w
          const dy = (-dp.y * 0.5 + 0.5) * h
          // Pinned to the RIGHT of the node (its left edge sits just
          // right of the node), vertically lifted so it reads as
          // beside it. Clamped to stay on-screen; no max-height
          // (not scrollable).
          const dw = drawer.offsetWidth || 720
          // List view: dead centre of the page, independent of the coil.
          const centred = listview.classList.contains('is-visible') || !n
          const dh = drawer.offsetHeight || 400
          const left = centred ? Math.max(16, (w - dw) / 2) : Math.max(16, Math.min(dx + 32, w - dw - 16))
          const top = centred ? Math.max(56, (h - dh) / 2) : Math.max(56, Math.min(dy - 80, h - 220))
          drawer.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`
        }
      }
    }

    /* RAF driver. dt is clamped to 50ms so a backgrounded tab that
       resumes doesn't jump the animation. `destroyed` stops the
       loop dead on unmount; `animationActive` gates rendering until
       the loader+gate finish (startScene flips it on). */
    let lastT = performance.now()
    let startT = lastT
    let dockSeen = -2
    function loop(t: number) {
      if (destroyed) return
      const dt = Math.min(0.05, (t - lastT) / 1000)
      const elapsed = (t - startT) / 1000
      lastT = t
      if (animationActive) render(dt, elapsed)
      if (focusIndex !== dockSeen) { dockSeen = focusIndex; setDockIdx(focusIndex) }
      rafId = requestAnimationFrame(loop)
    }

    /* Called after the intro finishes — resets the clocks (so the
       pulse phase starts at 0) and begins rendering. */
    function startScene() {
      if (destroyed) return
      // The viewport may have changed under the intro (iOS toolbar
      // collapse, rotation): resync the canvas before the first frame.
      onResize()
      animationActive = true
      lastT = performance.now()
      startT = lastT
      rafId = requestAnimationFrame(loop)
      typeAccent(DEFAULT_ACCENT)   // type out the headline on entry
      const ht = window.setTimeout(() => { if (!destroyed) showHelpRef.current() }, 900)
      // `#helix3d?…&focus=<category|output>` (category/output back
      // links) parks the coil on that band / node on arrival.
      const fq = new URLSearchParams(window.location.hash.split('?')[1] || '').get('focus')
      if (fq) {
        const fi = nodes.findIndex((x) => x.strand.id === fq || x.strand.category === fq)
        if (fi >= 0) { const ft = window.setTimeout(() => { if (!destroyed) focusByIndex(fi) }, 500); cleanups.push(() => window.clearTimeout(ft)) }
      }
      cleanups.push(() => window.clearTimeout(ht))
    }
    /* Same `focus=` link while already here (e.g. the menu's "advisory"):
       close the menu and park on that node. */
    const onFocusHash = () => {
      const fq = new URLSearchParams(window.location.hash.split('?')[1] || '').get('focus')
      if (!fq || !animationActive) return
      const fi = nodes.findIndex((x) => x.strand.id === fq || x.strand.category === fq)
      if (fi < 0) return
      if ($('#menu-overlay')?.classList.contains('is-open')) onMenuClose()
      if (panelOpen) { panelOpen = false; setPanelStrand(null) }
      focusByIndex(fi)
    }
    window.addEventListener('hashchange', onFocusHash)
    cleanups.push(() => window.removeEventListener('hashchange', onFocusHash))

    /* Re-apply the current palette to every material. Called after
       the theme toggle flips data-theme on the root (which changes
       what cssVar() resolves). Note the head children are recoloured
       by index — keep buildSerpentHead's add order (body, eye, eye). */
    function refreshSceneColours() {
      const C = themeColours()
      const rodCol = rodColour()
      ;(rod.userData.shaft.material as THREE.MeshStandardMaterial).color.copy(rodCol)
      ;(rod.userData.bands as THREE.Mesh[]).forEach((b) =>
        (b.material as THREE.MeshStandardMaterial).color.copy(rodCol))
      ;(rod.userData.knob.material as THREE.MeshStandardMaterial).color.copy(C.crimson)
      ;(rod.userData.knob.material as THREE.MeshStandardMaterial).emissive.copy(C.crimson)
      ;(serpentMesh.material as THREE.MeshStandardMaterial).color.copy(C.ink)
      ;(serpentLine.material as THREE.LineBasicMaterial).color.copy(C.ink)
      ;(serpentPoly.material as THREE.LineBasicMaterial).color.copy(C.ink)
      serpentMesh.userData.head!.children.forEach((child, idx) => {
        const mesh = child as THREE.Mesh
        const m = mesh.material as THREE.MeshStandardMaterial
        if (idx === 0) m.color.copy(C.ink)
        else { m.color.copy(C.crimson); m.emissive.copy(C.crimson) }
      })
      regenLogos()
      nodes.forEach((n) => {
        const nb = nodeStyle === 'embedded' ? C.crimson : C.grape
        n.orb.userData.baseColor = nb.clone()
        if (n.orb.userData.cube) {
          ;(n.ring1.material as THREE.MeshBasicMaterial).color.copy(C.crimson)
          ;(n.ring2.material as THREE.MeshBasicMaterial).color.copy(C.crimson)
          return
        }
        const m = n.orb.material as THREE.MeshStandardMaterial
        if (n.strand.id !== hoveredId) {
          m.color.copy(nb)
        } else {
          m.color.copy(C.crimson)
          m.emissive.copy(C.crimson)
        }
        ;(n.ring1.material as THREE.MeshBasicMaterial).color.copy(C.crimson)
        ;(n.ring2.material as THREE.MeshBasicMaterial).color.copy(C.crimson)
      })
      activeNodePointLight.color.copy(C.crimson)
    }

    /* ---- (PEEK removed) ----
       The lightweight hover synopsis card is gone in this variant;
       the full StrandPanel modal (opened on click) replaces it. */

    /* ---- LIST VIEW — the "list" toggle's alternate layout ----
       Built once from STRANDS as innerHTML. Clicks just play the
       transition sweep (same placeholder behaviour as the orbs).
       Generated inside .helix3d-root, so the scoped CSS still
       applies even though these classes are plain strings. */
    /* Section mark for the list bands: the same canvas tile as the
       staff's section cubes, rendered as images for light, dark and
       hover (crimson); CSS shows the right one. */
    const catMarkCache = new Map<string, string>()
    function catMarkImgs(cat: string) {
      const url = (accent: boolean, dark: boolean) => {
        const k = cat + accent + dark
        if (!catMarkCache.has(k)) {
          const t = strandTexture(cat, accent, dark)
          catMarkCache.set(k, (t.image as HTMLCanvasElement).toDataURL('image/png'))
          t.dispose()
        }
        return catMarkCache.get(k)!
      }
      return `<img class="lbm-light" src="${url(false, false)}" alt=""><img class="lbm-dark" src="${url(false, true)}" alt=""><img class="lbm-hot" src="${url(true, false)}" alt="">`
    }
    function buildList() {
      const inner = $('#listview-inner')!
      inner.innerHTML = STAFF_CATS.map((c) => {
        const items = outputsIn(c.id)
        return `
        <div class="list-band">
          <span class="list-band-mark" aria-hidden="true">${catMarkImgs(c.id)}</span>
          <span class="list-band-num">${c.num}</span>
          <span class="list-band-name">${c.label}</span>
          <span class="list-band-verb">${c.verb}</span>
          <span class="list-band-status">${pad2(items.length)} · ${categoryStatus(c.id)}</span>
          ${c.id === 'advisory'
            ? `<a class="list-band-link" href="mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Advisory enquiry')}">email ↦</a>`
            : `<a class="list-band-link" href="${c.id === 'plasmids' ? '#plasmids' : '#category/' + c.id}">category →</a>`}
        </div>
        ${items.length ? items.map((o) => {
          const body = `
          <span class="list-num">${o.code}</span>
          <div class="list-mark">${productTileHTML(o)}</div>
          <div class="list-meta">
            <div class="list-title">${outputName(o)}</div>
            <div class="list-tag">${typeById(o.type).label.toLowerCase()} · ${stageLabel(o).toLowerCase()}</div>
          </div>`
          // No public page yet: listed, padlocked, not linked. Advisory
          // services open their window (write-up + email) in place.
          return isOpen(o) || isAdvisory(o)
            ? `<a class="list-item" href="${isAdvisory(o) ? '#' : '#output/' + o.id}" data-out="${o.id}">${body}<span class="list-arrow">→</span></a>`
            : `<div class="list-item is-locked" title="Details coming soon">${body}<span class="list-arrow">${LOCK_SVG}<span class="sr-only">details coming soon</span></span></div>`
        }).join('') : '<p class="list-empty">no projects yet</p>'}`
      }).join('')
      inner.querySelectorAll<HTMLElement>('.list-item[data-out]').forEach((a) => {
        a.addEventListener('click', (e) => {
          e.preventDefault()
          if (a.dataset.out) openProject(a.dataset.out)
        })
      })
    }

    /* ---- VIEW TOGGLE — "staff" (3D) vs "list" ----
       setView() shows/hides the canvas + its overlays vs. the list
       by toggling CSS classes/inline styles. The 3D loop keeps
       running underneath; it's just visually hidden in list mode. */
    const helix3dEl   = $('#helix3d')!
    const helixFog    = $('#helix-fog')!
    const helixCenter = $('#helix-center-label')!
    const nodeLabelsEl = $('#node-labels')!
    const bubbleEl    = $('#node-bubble') as HTMLButtonElement
    const listview    = $('#listview')!
    const toggle      = $('#view-toggle')!

    /* "view more" bubble → open the active node's StrandPanel.
       Positioned each frame in updateLabels(). */
    const onBubbleClick = () => {
      if (!hoveredId) return
      const idx = nodes.findIndex((x) => x.strand.id === hoveredId)
      if (idx >= 0) openPanel(idx)
    }
    bubbleEl.addEventListener('click', onBubbleClick)
    cleanups.push(() => bubbleEl.removeEventListener('click', onBubbleClick))

    const onToggleClick = (e: Event) => {
      const btn = (e.target as HTMLElement).closest('button')
      if (!btn) return
      setView(btn.dataset.view as string)
    }
    toggle.addEventListener('click', onToggleClick)
    function setView(view: string) {
      toggle.querySelectorAll('button').forEach((b) => {
        const active = (b as HTMLElement).dataset.view === view
        b.classList.toggle('is-active', active)
        b.setAttribute('aria-selected', String(active))
      })
      const isHelix = view === 'helix'
      ;[helix3dEl, helixFog, helixCenter, nodeLabelsEl].forEach((el) => {
        el.classList.toggle('is-hidden', !isHelix)
        el.style.opacity = isHelix ? '' : '0'
        el.style.pointerEvents = isHelix ? '' : 'none'
      })
      listview.classList.toggle('is-visible', !isHelix)
    }

    /* ---- THEME (scoped to root element) ----
       data-theme is set on THIS root, never document, so the rest of
       the site is unaffected. Defaults DARK here, but the choice is
       stored under the SHARED key `mnth:theme` (also read/written by
       the Marginalia page) so light/dark is preserved when moving
       between the two. The button flips it, persists it, and triggers
       a one-shot scene recolour. Set before initThree() runs in BOOT,
       so the scene is built in the right palette. */
    const THEME_KEY = 'mnth:theme'
    const themeBtn = $('#theme-switch')!
    let savedTheme: string | null = null
    try { savedTheme = sessionStorage.getItem(THEME_KEY) } catch { /* storage unavailable (private mode) */ }
    const initialTheme = savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'dark'
    root.setAttribute('data-theme', initialTheme)
    const onThemeClick = () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
      root.setAttribute('data-theme', next)
      try { sessionStorage.setItem(THEME_KEY, next) } catch { /* storage unavailable */ }
      requestAnimationFrame(() => refreshSceneColours())
    }
    themeBtn.addEventListener('click', onThemeClick)
    // Phones use the site NavBar over the scene; it broadcasts its theme.
    const onSiteTheme = (e: Event) => {
      const next = (e as CustomEvent<string>).detail
      if ((next !== 'light' && next !== 'dark') || next === root.getAttribute('data-theme')) return
      root.setAttribute('data-theme', next)
      requestAnimationFrame(() => refreshSceneColours())
    }
    window.addEventListener('mnth:theme', onSiteTheme)
    cleanups.push(() => window.removeEventListener('mnth:theme', onSiteTheme))

    /* ---- TEXT SIZE — global rem scale (whole site, persisted).
       Lives next to the theme switch; see ../../lib/textScale. */
    const onTextDec = () => adjustTextScale(-TEXT_STEP)
    const onTextInc = () => adjustTextScale(TEXT_STEP)
    const onTextReset = () => applyTextScale(1)
    const textReset = $('#text-reset')!
    textReset.addEventListener('click', onTextReset)
    cleanups.push(() => textReset.removeEventListener('click', onTextReset))
    /* Press-and-hold repeats A− / A+ (after 350ms, every 110ms). The
       row's sizes are pixel-locked in CSS, so the buttons never move
       under the cursor as the text scale changes — rapid clicks land. */
    const holdRepeat = (el: HTMLElement, fn: () => void) => {
      let t0 = 0, iv = 0
      const stop = () => { window.clearTimeout(t0); window.clearInterval(iv) }
      const down = (e: PointerEvent) => {
        if (e.button !== 0) return
        try { el.setPointerCapture(e.pointerId) } catch { /* noop */ }
        t0 = window.setTimeout(() => { iv = window.setInterval(fn, 110) }, 350)
      }
      el.addEventListener('pointerdown', down)
      el.addEventListener('pointerup', stop); el.addEventListener('pointercancel', stop); el.addEventListener('lostpointercapture', stop)
      cleanups.push(() => { stop(); el.removeEventListener('pointerdown', down) })
    }
    holdRepeat($('#text-dec')!, onTextDec)
    holdRepeat($('#text-inc')!, onTextInc)
    const textDec = $('#text-dec')!
    const textInc = $('#text-inc')!
    textDec.addEventListener('click', onTextDec)
    textInc.addEventListener('click', onTextInc)
    cleanups.push(() => {
      textDec.removeEventListener('click', onTextDec)
      textInc.removeEventListener('click', onTextInc)
    })

    /* ---- RENDER STYLE (fixed: poly-sketch) ----
       The coil renders as a faceted polygon wireframe, the rod as a
       wireframe trace, and the orbs as wireframe nodes. These used
       to be debug toggles in the nav (#render/#poly/#rod/#node);
       the buttons were removed and the modes are now the baked-in
       default — see the sketchMode/polyMode/rodTrace declarations
       (all default true) and buildRod (rod built in trace mode).
       Node wireframe is set at build via `sketchMode && !nodeSolid`
       (see buildSerpent), so no runtime node toggle is needed. */

    /* Exactly one strand representation visible: solid mesh (not
       sketch), else line trace or polygon wireframe per polyMode.
       Called once from buildSerpent(). */
    function applyStrandRender() {
      serpentMesh.visible = !sketchMode
      serpentLine.visible = sketchMode && !polyMode
      serpentPoly.visible = sketchMode && polyMode
    }


    /* ---- CURSOR — native dot + trailing ring ----
       The dot is the OS cursor itself (--cursor-dot in helix3d.css), so
       it never lags. The ring eases toward it for a trailing effect,
       and grows (.is-active) over interactive elements. The easing is
       time-based (RING_FOLLOW of the gap per frame at 60fps; 0.18 felt
       laggy; 0.6 closes half the gap in ~13ms) so the ring keeps
       up when frames drop, and the RAF idles once it has caught up.
       Its own RAF is cancelled in cleanup. */
    function initCursor() {
      const ring = $('#cursor-ring')
      if (!ring) return
      let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0
      let cursorRaf = 0, lastT = 0
      const RING_FOLLOW = 0.6
      function lerp(t: number) {
        const dt = lastT ? Math.min(0.1, (t - lastT) / 1000) : 1 / 60
        lastT = t
        const k = 1 - Math.pow(1 - RING_FOLLOW, dt * 60)
        ringX += (mouseX - ringX) * k
        ringY += (mouseY - ringY) * k
        if (Math.abs(mouseX - ringX) < 0.1 && Math.abs(mouseY - ringY) < 0.1) { ringX = mouseX; ringY = mouseY }
        ring!.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`
        cursorRaf = ringX === mouseX && ringY === mouseY ? 0 : requestAnimationFrame(lerp)
      }
      const onMove = (e: MouseEvent) => {
        mouseX = e.clientX; mouseY = e.clientY
        if (!cursorRaf) { lastT = 0; cursorRaf = requestAnimationFrame(lerp) }
      }
      window.addEventListener('mousemove', onMove, { passive: true })

      const interactiveSel = 'a, button, .node-label, .list-item, canvas, .strand-win-bar, .strand-win-grip'
      const onOver = (e: Event) => {
        if ((e.target as HTMLElement).closest(interactiveSel)) ring.classList.add('is-active')
      }
      const onOut = (e: Event) => {
        if ((e.target as HTMLElement).closest(interactiveSel)) ring.classList.remove('is-active')
      }
      root!.addEventListener('mouseover', onOver)
      root!.addEventListener('mouseout', onOut)
      cleanups.push(() => {
        window.removeEventListener('mousemove', onMove)
        cancelAnimationFrame(cursorRaf)
        root!.removeEventListener('mouseover', onOver)
        root!.removeEventListener('mouseout', onOut)
      })
    }

    /* ---- MENU ----
       Full-screen overlay toggled by .is-open. (The old page-sweep
       transition was dropped in this variant — clicking a node
       opens the StrandPanel modal instead.) */
    const menuOverlay = $('#menu-overlay')!
    const onMenuOpen = () => {
      menuOverlay.classList.add('is-open')
      menuOverlay.setAttribute('aria-hidden', 'false')
    }
    const onMenuClose = () => {
      menuOverlay.classList.remove('is-open')
      menuOverlay.setAttribute('aria-hidden', 'true')
    }
    $('#menu-open')!.addEventListener('click', onMenuOpen)
    $('#menu-close')!.addEventListener('click', onMenuClose)
    // Swipe down from the menu's top row to close it (same feel as the
    // sheets' useSwipeDown: follows the finger, closes past 90px).
    const menuTopEl = menuOverlay.querySelector('.menu-top') as HTMLElement | null
    let mY: number | null = null, mDy = 0
    const mStart = (e: TouchEvent) => { mY = e.touches[0].clientY; mDy = 0 }
    const mMove = (e: TouchEvent) => {
      if (mY === null) return
      mDy = Math.max(0, e.touches[0].clientY - mY)
      menuOverlay.style.translate = `0 ${mDy}px`
      menuOverlay.style.transition = 'none'
    }
    const mEnd = () => {
      menuOverlay.style.translate = ''
      menuOverlay.style.transition = ''
      if (mDy > 90) onMenuClose()
      mY = null; mDy = 0
    }
    menuTopEl?.addEventListener('touchstart', mStart, { passive: true })
    menuTopEl?.addEventListener('touchmove', mMove, { passive: true })
    menuTopEl?.addEventListener('touchend', mEnd)
    menuTopEl?.addEventListener('touchcancel', mEnd)
    cleanups.push(() => {
      menuTopEl?.removeEventListener('touchstart', mStart)
      menuTopEl?.removeEventListener('touchmove', mMove)
      menuTopEl?.removeEventListener('touchend', mEnd)
      menuTopEl?.removeEventListener('touchcancel', mEnd)
    })

    /* ---- LOADER + GATE — the intro sequence ----
       Implementation lives in ./HelixIntro (HelixIntroMarkup +
       runLoader / runGate). BOOT below awaits them, passing the
       scoped query `$`, a cleanup registrar and a destroyed-flag
       getter so the intro hooks into this effect's teardown. To
       skip the intro, see the `skipIntro` branch in entry(). */

    /* ---- BOOT ----
       Build the static bits and the scene immediately (so it's ready
       behind the loader), then run the intro gates in sequence before
       starting the render loop. The `destroyed` guards bail if the
       component unmounts mid-intro. */
    buildList()
    initThree()
    initCursor()
    initScrollNav()   // wheel/swipe traversal; starts in default view
    // Phone dock: ‹ › step strands (or the open window); the name opens it.
    dockStepRef.current = (dir) => { if (panelOpen) stepPanel(dir); else traverse(dir) }
    dockOpenRef.current = () => { if (isFocused()) openPanel(focusIndex); else focusByIndex(0) }

    // The intro loader plays ONCE per browser session — only on the
    // first view of the site. Returning to #helix3d later (or a dev
    // re-render) skips straight to the scene.
    const INTRO_KEY = 'mnth:helixIntroSeen'
    let introSeen = false
    try { introSeen = sessionStorage.getItem(INTRO_KEY) === '1' } catch { /* storage unavailable */ }

    ;(async function entry() {
      if (skipIntro || ((introSeen || skipIntroAlways()) && !alwaysIntro)) {
        // Already seen this session (or dev re-render): jump straight
        // to the scene — hide the loader and start rendering now.
        $('#loader')?.classList.add('is-hidden')
        startScene()
        if (isPhone()) focusByIndex(0, true)
        markIntroDone()
        return
      }
      // Serpent intro plays (or is skipped); its onDone resolves this
      // and the scene starts underneath the intro's fade-out.
      await new Promise<void>((res) => { introDoneRef.current = res })
      if (destroyed) return
      try { sessionStorage.setItem(INTRO_KEY, '1') } catch { /* storage unavailable */ }
      startScene()
      if (isPhone()) focusByIndex(0)
      markIntroDone()
    })()

    /* ---- TEARDOWN ----
       Effect cleanup: stop the loop, flush every collected cleanup
       (timeouts + listeners), remove the directly-bound listeners,
       and dispose all GPU resources so navigating away doesn't leak
       a WebGL context. Runs on unmount AND between StrictMode's
       double-invoke in dev. */
    return () => {
      destroyed = true
      animationActive = false
      cancelAnimationFrame(rafId)
      cleanups.forEach((fn) => { try { fn() } catch { /* noop */ } })
      toggle.removeEventListener('click', onToggleClick)
      themeBtn.removeEventListener('click', onThemeClick)
      $('#menu-open')?.removeEventListener('click', onMenuOpen)
      $('#menu-close')?.removeEventListener('click', onMenuClose)
      try {
        scene?.traverse((obj) => {
          const mesh = obj as THREE.Mesh
          if (mesh.geometry) mesh.geometry.dispose()
          const mat = mesh.material as THREE.Material | THREE.Material[] | undefined
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
          else mat?.dispose()
        })
        renderer?.dispose()
        renderer?.domElement?.remove()
      } catch { /* noop */ }
    }
  }, [])

  /* (Esc handling lives in the scene effect — exitToDefault — so it
     works whether or not the panel is open: it always zooms out.) */

  /* ---- MARKUP ----
     Full-viewport takeover (no shared site Header on this route).
     Every element is fixed/absolute and stacked by z-index in
     helix3d.css — back→front: canvas → fog → labels → headline →
     readout → list → footer → corners → nav → marquee → menu →
     gate → loader, with the StrandPanel modal (z 600) above all.

     EDITING TEXT: all static copy is literal here, EXCEPT the
     list view (buildList
     from STRANDS). The clicked card is the real StrandPanel, fed
     adapted concept data via toDataStrand.
     MOVING THINGS: change the element's rule in helix3d.css — don't
     reorder JSX (positioning is absolute, not flow).
     The id="…" hooks are a contract with the effect's $('#…')
     queries; rename in both places or neither. */
  return (
    <div className={`helix3d-root${helpOpen ? ' help-open' : ''}`} data-theme={introMode} data-node-style={nodeStyle} ref={rootRef}>
      {/* INTRO — the serpent logo intro (z 2000), ./SerpentIntro.
          Replaces the old looping loader splash (./HelixIntro, kept
          in the repo, now unused). */}
      {introOn && (
        <SerpentIntro
          theme={introMode === 'light' ? 'light' : 'dark'}
          nodeStyle={nodeStyle}
          onDone={() => introDoneRef.current()}
          onGone={() => setIntroOn(false)}
        />
      )}

      {/* CURSOR — custom pointer (hidden ≤720px); driven by initCursor */}
      <div className="cursor-ring" id="cursor-ring" />

      {/* CORNER CROPS — decorative crimson L-marks framing the scene.
          Their offsets clear the marquee (top) and footer (bottom);
          tweak in helix3d.css `.corner-crop--*`. */}
      <span className="corner-crop corner-crop--tl" />
      <span className="corner-crop corner-crop--tr" />
      <span className="corner-crop corner-crop--bl" />
      <span className="corner-crop corner-crop--br" />


      {/* NAV — wordmark + view toggle (#view-toggle) + theme button
          (#theme-switch) + menu button (#menu-open). All wired in the
          effect by id. */}
      <nav className="nav">
        {/* Nav brand mark — light/dark variants in public/. Both
            are rendered; helix3d.css shows the right one for the
            current data-theme (no JS needed). Swap those files to
            change the logo. */}
        <a href="#helix3d?skipIntro=true" className="nav-mark" aria-label="Mentheon — home">
          <img
            className="nav-mark-logo nav-mark-logo--light"
            src={`${import.meta.env.BASE_URL}favvectorprintlight.svg`}
            alt="Mentheon"
          />
          <img
            className="nav-mark-logo nav-mark-logo--dark"
            src={`${import.meta.env.BASE_URL}favvectorprintdark.svg`}
            alt="Mentheon"
          />
        </a>
        <div className="nav-controls">
          <div className="view-toggle" id="view-toggle" role="tablist" aria-label="View mode">
            <button className="is-active" data-view="helix" role="tab" aria-selected="true">staff</button>
            <button data-view="list" role="tab" aria-selected="false">list</button>
          </div>
          {/* Global text size — scales rem across the whole site */}
          <div className="text-size" role="group" aria-label="Text size">
            <button id="text-dec" type="button" aria-label="Decrease text size">A−</button>
            <button id="text-reset" type="button" aria-label="Default text size" title="Default size">A</button>
            <button id="text-inc" type="button" aria-label="Increase text size">A+</button>
          </div>
          <button
            type="button"
            className={`help-btn${helpOpen ? ' is-on' : ''}`}
            onClick={() => showHelpRef.current(true)}
            aria-label="Show navigation help"
            aria-pressed={helpOpen}
            title="Navigation help (?)"
          >?</button>
          <button className="theme-switch" id="theme-switch" aria-label="Toggle theme">
            <svg className="icon-moon" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" /></svg>
            <svg className="icon-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>
          </button>
          <button className="menu-btn" id="menu-open" aria-label="Open menu">
            menu
            <span className="menu-btn-lines"><span /><span /></span>
          </button>
        </div>
      </nav>

      {/* STAGE — the scene area. #helix3d is where the WebGL canvas
          is appended; the rest are HTML overlays on top of it.
          #node-labels is populated by buildLabels(); #listview-inner
          by buildList(). Clicking a node opens the StrandPanel
          modal (rendered below, outside .stage). */}
      <main className="stage">

        <div className="helix3d" id="helix3d" />{/* ← WebGL canvas mounts here */}
        <div className="helix-fog" id="helix-fog" />{/* edge vignette over canvas */}

        {/* The big editorial headline. `.accent` is the crimson word. */}
        <div className="helix-center-label" id="helix-center-label">
          <p className="kicker">research programme · 2024–26</p>
          <h1 className="title">A new era of <br/><span className="accent" id="helix-accent">Digital Health</span><span className="helix-caret" id="helix-caret" aria-hidden="true" /></h1>
          {/* Ledger tile row (was the top-centre readout, which sat on the
              snake): strands in ink, projects in grape, services in the
              Advisory gold, est outlined. The programme line is the kicker
              above, so it isn't repeated. */}
          <dl className="helix-ledger">
            <div className="hl-strands"><dt>strands</dt><dd>{pad2(STRANDS.length)}</dd></div>
            <div className="hl-projects"><dt>projects</dt><dd>{pad2(OUTPUTS.length)}</dd></div>
            <div className="hl-services"><dt>services</dt><dd>{pad2(outputsIn('advisory').length)}</dd></div>
            <div className="hl-est"><dt>est</dt><dd>09.2024</dd></div>
          </dl>
        </div>

        <div className="node-labels" id="node-labels" />

        {/* "view more" bubble — shown for the active node (scroll-
            focused or hovered), positioned every frame by
            updateLabels(); click opens its StrandPanel. */}
        <button className="node-bubble" id="node-bubble" type="button">
          view more <span aria-hidden="true">→</span>
        </button>

        {/* (Peek card removed — the StrandPanel modal below replaces
            it; opened via the bubble, the node, or a list row.) */}

        {/* List view — inner is filled by buildList(); shown when the
            nav toggle switches to "list". */}
        <div className="listview" id="listview">
          <div className="listview-inner" id="listview-inner" />
        </div>
      </main>

      {/* FOOTER — static company strip (z 20) */}
      <nav className="mobile-dock" aria-label="Strands">
        <button type="button" className="md-arrow" onClick={() => dockStepRef.current(-1)}
          disabled={dockIdx === 0} aria-label="Previous strand">‹</button>
        <button type="button" className="md-mid" onClick={() => dockOpenRef.current()}>
          <b>{dockIdx >= 0 ? STRAND[STRANDS[dockIdx].category as keyof typeof STRAND].name : 'Strands'}</b>
          <span>{dockIdx >= 0 ? `${pad2(dockIdx + 1)} of ${pad2(STRANDS.length)} · view more` : `${pad2(STRANDS.length)} strands · swipe ↕`}</span>
        </button>
        <button type="button" className="md-arrow" onClick={() => dockStepRef.current(1)}
          disabled={dockIdx === STRANDS.length - 1} aria-label="Next strand">›</button>
      </nav>

      <div className="footer-strip">
        <span>mentheon ltd · <strong>15974246</strong></span>
        <span><strong>est 09.2024 · </strong> bloemfontein · newcastle · london</span>
        <span><strong>mnth ✲</strong></span>
      </div>

      {/* MENU — full-screen overlay (z 200), toggled via .is-open by
          #menu-open / #menu-close. Links are placeholders. */}
      <div className="menu-overlay" id="menu-overlay" aria-hidden="true">
        {/* Phones: theme + text size live here (the nav is slimmed). */}
        <div className="menu-mobile-ctrls">
          <button type="button" onClick={() => adjustTextScale(-TEXT_STEP)} aria-label="Decrease text size">A−</button>
          <button type="button" onClick={() => applyTextScale(1)} aria-label="Default text size">A</button>
          <button type="button" onClick={() => adjustTextScale(TEXT_STEP)} aria-label="Increase text size">A+</button>
          <button type="button" onClick={() => (rootRef.current?.querySelector('#theme-switch') as HTMLButtonElement | null)?.click()}>light / dark</button>
        </div>
        <div className="menu-top">
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.7rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gate-fg-quiet)' }}>index ✲ mentheon</span>
          <button className="menu-close" id="menu-close" title="Close (esc)" aria-label="Close menu (Esc)">close <span className="menu-close-x" /></button>
        </div>
        <div className="menu-items">
          {[['marginalia', '#marginalia'], ['people', '#who'], ['services', '#services'], ['advisory', '#helix3d?skipIntro=true&focus=advisory']].map(([label, href], i) => (
            <a key={href} className="menu-item" href={href}><span className="menu-item-num">{pad2(i + 1)}</span>{label}</a>
          ))}
        </div>
        <div className="menu-bottom">
          <span>mentheon ltd · companies house 15974246</span>
          <span><a href="#">linkedin</a><a href="#">github</a><a href={`mailto:${CONTACT_EMAIL}`}>contact</a></span>
        </div>
      </div>

      {/* STRAND PANEL drawer (z 600) — tethered under the node and
          drawn out (StrandPanel's own max-height open animation).
          .strand-drawer is positioned every frame by updateLabels()
          to the focused node's projected point. The faint .strand-
          scrim (no blur) catches backdrop clicks to close; scene
          stays visible. × / scrim / Esc → handlePanelClose, which
          clears React state and calls closePanelRef into the scene. */}
      {panelStrand && (
        <>
          <div className="strand-scrim" onClick={handlePanelClose} />
          <div
            className={`strand-drawer strand-win is-${winMode}`}
            id="strand-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={panelStrand.label}
            onClick={(e) => e.stopPropagation()}
            style={{
              ...(winMode === 'free'
                ? { transform: `translate(${winRect.x}px, ${winRect.y}px)`, width: winRect.w, height: winRect.h ?? undefined }
                : {}),
              ...winSwipe.style,
            }}
          >
            <div className="strand-win-crop" aria-hidden="true" />
            <div className="strand-win-bar" onPointerDown={onWinDragStart} onDoubleClick={onWinMax} {...winSwipe.handlers}>
              <span className="strand-win-grab" aria-hidden="true" />
              <span className="strand-win-title">
                {panelOut && panelCat ? <>{panelOut.code.toLowerCase()} · {panelCat.label.toLowerCase()} · {isAdvisory(panelOut) ? 'service' : 'project'}</>
                  : panelS && panelCat ? <>{panelCat.num} · {panelCat.label.toLowerCase()} · {pad2(panelS.band + 1)} of {pad2(STRANDS.length)}</> : null}
              </span>
              <span className="strand-win-ctrls">
                <button type="button" onClick={onWinMin} disabled={winMode === 'dock'} title="Return to node" aria-label="Minimise — return to default size beside the node">min</button>
                <button type="button" onClick={onWinMax} className={winMode === 'max' ? 'is-on' : ''} title={winMode === 'max' ? 'Restore' : 'Maximise'} aria-label={winMode === 'max' ? 'Restore window' : 'Maximise window'}>max</button>
                <button type="button" onClick={handlePanelClose} className="strand-win-close" title="Close (esc)" aria-label="Close strand window">×</button>
              </span>
            </div>
            <div className="strand-win-body">
              {panelOut ? <OutputPeek o={panelOut} /> : panelS ? <CategoryPeek s={panelS} /> : null}
            </div>
            {winMode !== 'max' && (
              <div className="strand-win-grip" onPointerDown={onWinResizeStart} aria-hidden="true" />
            )}
          </div>
        </>
      )}

      {/* NAVIGATION pop-out — top right, under the readout. Shown on
          scene start (once per session unless re-opened with '?'). */}
      {helpOpen && (
        <aside className="helix-help" role="note" aria-label="Navigation">
          <div className="helix-help-crop" aria-hidden="true" />
          <div className="helix-help-head">
            <span>navigation <span className="star">✲</span> staff</span>
            <button type="button" className="helix-help-close" onClick={dismissHelp} aria-label="Dismiss navigation help">×</button>
          </div>
          <dl className="helix-help-rows">
            <div><dt><kbd>scroll</kbd><kbd>↑</kbd><kbd>↓</kbd></dt><dd>Traverse the staff, node by node.</dd></div>
            <div><dt><kbd>enter</kbd><kbd>click</kbd></dt><dd>Open the focused strand.</dd></div>
            <div><dt><kbd>esc</kbd></dt><dd>Step back: strand, node, staff.</dd></div>
            <div><dt><kbd>drag</kbd><kbd>scroll ←→</kbd></dt><dd>Spin the staff.</dd></div>
          </dl>
          <p className="helix-help-foot">press <kbd>?</kbd> to show again</p>
        </aside>
      )}

      {/* Marginalia right-margin tab — only on this view. Child of
          .helix3d-root so it themes with data-theme and stacks
          correctly among the scene layers (above nav/marquee,
          below the modal/gate/loader). */}
      <div className="marginalia-tab-wrap"><MarginaliaTab /></div>
    </div>
  )
}
