import { useEffect, type ReactNode } from 'react'
import s from './framework.module.css'
import {
  CATEGORIES, HELIX_CATEGORIES, typeById, outputsIn, categoryStatus, stageLabel, outputName,
  affiliationLabel, categoryById, pad2, exitsFor, outputById, EXIT_LABEL,
  type Output, type CategoryId, type OutputTypeId,
} from '../../data/framework'

export const HOME_HREF = '#helix3d?skipIntro=true'
export const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ')
export const catHref = (id: CategoryId) => (id === 'plasmids' ? '#plasmids' : `#category/${id}`)
export const outHref = (o: Output) => `#output/${o.id}`

/* Esc → back.href. Ignored while the NavBar menu is open or while
   typing in a field (a focused field handles its own Esc). */
export function useEscBack(href: string) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (document.querySelector('[class*="menuOverlay"][aria-hidden="false"]')) return
      const t = e.target as HTMLElement | null
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return
      window.location.hash = href
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [href])
}

/* Back chip (esc) + breadcrumb — the top row of every detail page. */
export function BackRow({ back, crumbs, className }: {
  back: { label: string; href: string }
  crumbs: { label: string; href?: string }[]
  className?: string
}) {
  return (
    <div className={cx(s.topRow, className)}>
      <a className={s.back} href={back.href} aria-label={`Back to ${back.label} (Esc)`}>
        <span className={s.backArrow} aria-hidden="true">←</span>
        {back.label}
        <span className={s.kbd} aria-hidden="true">esc</span>
      </a>
      <nav className={s.crumbs} aria-label="Breadcrumb">
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: 'contents' }}>
            {i > 0 && <span className={s.sep}>/</span>}
            {c.href ? <a href={c.href}>{c.label}</a> : <span aria-current="page">{c.label}</span>}
          </span>
        ))}
      </nav>
    </div>
  )
}

/* Shared page shell: back chip (also bound to Esc), breadcrumb,
   framed plate with crimson crops, header. Esc is ignored while the
   NavBar menu overlay is open (it closes the menu instead). */
export function PageShell({
  back, crumbs, kicker, title, tagline, aside, placeholder, children,
}: {
  back: { label: string; href: string }
  crumbs: { label: string; href?: string }[]
  kicker: ReactNode
  title: ReactNode
  tagline?: ReactNode
  aside?: ReactNode
  placeholder?: boolean
  children: ReactNode
}) {
  useEffect(() => { window.scrollTo(0, 0) }, [back.href, String(title)])
  useEscBack(back.href)
  return (
    <div className={s.shell}>
      <BackRow back={back} crumbs={crumbs} />
      <article className={s.frame}>
        <span className={cx(s.crop, s.cropTL)} /><span className={cx(s.crop, s.cropTR)} />
        <span className={cx(s.crop, s.cropBL)} /><span className={cx(s.crop, s.cropBR)} />
        <header className={s.head}>
          <div>
            <p className={s.kicker}>{kicker}</p>
            <h1 className={s.title}>
              {title}
              {placeholder && <span className={s.placeholderTag}>placeholder</span>}
            </h1>
            {tagline && <p className={s.tagline}>{tagline}</p>}
          </div>
          {aside && <div className={s.headAside}>{aside}</div>}
        </header>
        {children}
      </article>
    </div>
  )
}

export function Section({ num, title, children }: { num?: string; title: string; children: ReactNode }) {
  return (
    <section className={s.section}>
      <h2 className={s.sectionTitle}>{num && <span className={s.sectionNum}>§ {num}</span>}{title}</h2>
      {children}
    </section>
  )
}

export function Fields({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className={s.fields}>
      {items.map((f) => (
        <div key={f.label} className={s.field}>
          <dt className={s.fieldLabel}>{f.label}</dt>
          <dd className={s.fieldValue} style={{ margin: 0 }}>{f.value}</dd>
        </div>
      ))}
    </dl>
  )
}

/* The care pathway: five on-helix categories in order, then the
   off-helix Plasmids. Each step shows its verb + derived status. */
export function Pathway({ active }: { active?: CategoryId }) {
  const step = (id: CategoryId) => {
    const c = categoryById(id)!
    const n = outputsIn(id).length
    return (
      <a key={id} href={catHref(id)} className={cx(s.pathStep, !c.onHelix && s.pathOff, active === id && s.isActive)}
        aria-current={active === id ? 'page' : undefined}>
        <span className={s.pathNum}>{c.onHelix ? c.num : `${c.num} · head of the staff`}</span>
        <span className={s.pathLabel}>{c.label}</span>
        <span className={s.pathVerb}>{c.verb}</span>
        <span className={s.pathCount}>{pad2(n)} output{n === 1 ? '' : 's'} · {categoryStatus(id)}</span>
      </a>
    )
  }
  return (
    <nav className={s.pathway} aria-label="Care pathway">
      {step('plasmids')}
      <span className={s.pathGap} aria-hidden="true" />
      {HELIX_CATEGORIES.map((c) => step(c.id))}
    </nav>
  )
}

/* Track columns: stages doing a similar job line up across tracks. */
export const TRACK_COLS: Record<OutputTypeId, number[]> = {
  programme: [1, 2, 3, 4, 5, 6],
  artefact: [1, 2, 3, 5, 6],
  software: [1, 2, 3, 4, 5, 6],
  product: [3, 4, 5, 6],
}

/* Full stage line for one output type; `current` highlights a stage.
   `aligned` places stages in the shared 6-column grid. */
export function StageLine({ type, current, aligned = false }: { type: OutputTypeId; current?: number; aligned?: boolean }) {
  const t = typeById(type)
  const cols = TRACK_COLS[type]
  return (
    <ol className={s.stages} style={{ ['--cols' as string]: aligned ? 6 : t.stages.length, listStyle: 'none', margin: 0, padding: 0 }}>
      {t.stages.map((name, i) => {
        const past = current !== undefined && i < current
        const cur = current === i
        const span = aligned ? (cols[i + 1] ?? 7) - cols[i] : 1
        return (
          <li key={name}
            className={cx(s.stage, past && s.isPast, cur && s.isCurrent)}
            style={aligned ? { gridColumn: `${cols[i]} / span ${span}` } : undefined}
            aria-current={cur ? 'step' : undefined}>
            <span className={s.dot}>{t.repeats === i && <span className={s.loop} title="repeats" />}</span>
            <span className={s.stageName}>{name}{t.repeats === i ? ' · repeats' : ''}</span>
          </li>
        )
      })}
    </ol>
  )
}

/* Branching stage track for one output. The main track runs left →
   right; exits drop below from the stage they branch after, then
   either curve back up into the next stage (rejoin) or stop at a bar
   (end). Recorded exits are solid (software exits crimson); standing
   slots not yet recorded are dashed "possible exits". Lines are SVG
   (non-scaling strokes); dots and labels are HTML so they stay crisp. */
export function BranchTrack({ o }: { o: Output }) {
  const t = typeById(o.type)
  const N = t.stages.length
  const PAD = 5
  const X = (i: number) => PAD + (i * (100 - 2 * PAD)) / Math.max(1, N - 1)
  const step = (100 - 2 * PAD) / Math.max(1, N - 1)
  const SPINE = 60, LANE0 = 132, LANE_H = 58
  const exits = exitsFor(o)
  const laneOf = new Map<number, number>()
  const placed = exits.map((e) => {
    const lane = laneOf.get(e.after) ?? 0
    laneOf.set(e.after, lane + 1)
    return { e, lane, x: X(e.after) + step * 0.5, y: LANE0 + lane * LANE_H }
  })
  const lanes = Math.max(1, ...[...laneOf.values()])
  const H = LANE0 + (lanes - 1) * LANE_H + 64
  const px = (p: number) => p * 10       // % → viewBox units (0..1000)
  return (
    <div className={s.btrack} style={{ height: H, ['--step' as string]: `${step}%` }}>
      <svg className={s.btrackSvg} viewBox={`0 0 1000 ${H}`} preserveAspectRatio="none" aria-hidden="true">
        {t.stages.slice(1).map((_, k) => {
          const i = k + 1
          const past = i <= o.stage
          return <line key={i} x1={px(X(i - 1))} y1={SPINE} x2={px(X(i))} y2={SPINE}
            className={past ? s.bLinePast : s.bLineFuture} vectorEffect="non-scaling-stroke" />
        })}
        {placed.map(({ e, x, y }, k) => {
          const xs = px(X(e.after)), xn = px(x)
          const cls = e.possible ? s.bExitPossible : e.kind === 'software' ? s.bExitSoftware : s.bExitTaken
          const down = `M${xs},${SPINE} C${xs},${(SPINE + y) / 2 + 10} ${xn - 40},${y} ${xn},${y}`
          const xr = px(X(Math.min(N - 1, e.after + 1)))
          const tail = e.behaviour === 'rejoin' && e.after < N - 1
            ? `M${xn},${y} C${xn + 40},${y} ${xr},${(SPINE + y) / 2 + 10} ${xr},${SPINE}`
            : `M${xn},${y} L${xn + 36},${y} M${xn + 36},${y - 7} L${xn + 36},${y + 7}`
          return <g key={k} className={cls}><path d={down} vectorEffect="non-scaling-stroke" /><path d={tail} vectorEffect="non-scaling-stroke" /></g>
        })}
      </svg>
      {t.stages.map((name, i) => (
        <div key={name} className={cx(s.bStage, i < o.stage && s.isPast, i === o.stage && s.isCurrent, i === 0 && s.bFirst, i === N - 1 && s.bLast)}
          style={{ left: `${X(i)}%`, top: SPINE }} aria-current={i === o.stage ? 'step' : undefined}>
          <span className={s.bLabel}>{name}{t.repeats === i ? ' · repeats' : ''}</span>
          <span className={s.bDot} />
        </div>
      ))}
      {placed.map(({ e, x, y }, k) => {
        const sw = e.kind === 'software' && e.outputId ? outputById(e.outputId) : undefined
        const href = sw ? `#output/${sw.id}` : e.href
        const title = sw ? `${sw.code} · ${outputName(sw)}` : e.title
        return (
          <div key={k} className={cx(s.bExit, e.possible && s.isPossible, e.kind === 'software' && s.isSoftware)} style={{ left: `${x}%`, top: y }}>
            <span className={s.bExitNode} />
            <span className={s.bExitText}>
              <span className={s.bExitKind}>{EXIT_LABEL[e.kind]}</span>
              <span className={s.bExitState}>{e.possible ? 'possible exit' : e.behaviour === 'end' ? 'ends here' : 'rejoins'}</span>
              {title && (href ? <a className={s.bExitTitle} href={href}>{title} →</a> : <span className={s.bExitTitle}>{title}</span>)}
              {e.date && <span className={s.bExitKind}>{e.date}</span>}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function MiniStage({ o }: { o: Output }) {
  const t = typeById(o.type)
  return (
    <span className={s.mini}>
      <span className={s.miniDots} aria-hidden="true">
        {t.stages.map((_, i) => (
          <span key={i} style={{ display: 'contents' }}>
            {i > 0 && <span className={cx(s.miniBar, i <= o.stage && s.isPast)} />}
            <span className={cx(s.miniDot, i < o.stage && s.isPast, i === o.stage && s.isCurrent)} />
          </span>
        ))}
      </span>
      <span className={s.miniLabel}>{pad2(o.stage + 1)} · {stageLabel(o)}</span>
    </span>
  )
}

export function OutputRows({ items, showCategory = true }: { items: Output[]; showCategory?: boolean }) {
  if (!items.length) return <p className={s.empty}>no outputs yet</p>
  return (
    <>
      <div className={s.rowHead} aria-hidden="true">
        <span>code</span><span>output</span><span>stage</span>
        <span>{showCategory ? 'category' : 'regulatory class'}</span><span>affiliation</span><span />
      </div>
      <div className={s.rows} role="list">
        {items.map((o) => (
          <a key={o.id} href={outHref(o)} className={s.row} role="listitem">
            <span className={s.rowCode}>{o.code}</span>
            <span>
              <span className={s.rowTitle}>{outputName(o)}</span>
              <span className={s.rowSub}>{typeById(o.type).label}</span>
            </span>
            <span className={s.rowCell}><MiniStage o={o} /></span>
            <span className={s.rowCell}>{showCategory ? categoryById(o.category)!.label : o.regClass}</span>
            <span className={s.rowCell}>{o.affiliation.kind === 'owned' ? 'Mentheon-owned' : 'Affiliated'}</span>
            <span className={s.rowArrow} aria-hidden="true">→</span>
          </a>
        ))}
      </div>
    </>
  )
}

export function Pager({ prev, next }: { prev?: { label: string; href: string }; next?: { label: string; href: string } }) {
  return (
    <nav className={s.pager} aria-label="Previous and next">
      {prev ? <a className={s.pagerLink} href={prev.href}><span className={s.pagerDir}>← previous</span><span className={s.pagerName}>{prev.label}</span></a> : <span />}
      {next ? <a className={s.pagerLink} href={next.href}><span className={s.pagerDir}>next →</span><span className={s.pagerName}>{next.label}</span></a> : <span />}
    </nav>
  )
}

export { s as styles, CATEGORIES, affiliationLabel }
