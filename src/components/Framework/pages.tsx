import { useMemo, useState } from 'react'
import { productTileHTML, AUF_ID, essenIcon } from '../ProductMark'
import {
  PageShell, Section, Fields, Pathway, StageLine, BranchTrack, OutputRows, Pager, styles as s, cx,
  HOME_HREF, catHref, outHref, TRACK_COLS,
} from './shared'
import {
  CATEGORIES, HELIX_CATEGORIES, OUTPUT_TYPES, OUTPUTS, BOUNDARIES, PLASMID_METAPHOR, TRACK_NOTES,
  FIELDS, INFRASTRUCTURE, REG_CLASSES, categoryById, outputById, outputsIn, categoryStatus, typeById,
  stageLabel, outputName, affiliationLabel, pad2, isSoftware, LINK_LABEL,
  type CategoryId, type OutputTypeId, type Output,
} from '../../data/framework'

const star = <span className={s.star} aria-hidden="true">✲</span>
const pathwayCrumb = { label: 'pathway', href: HOME_HREF }

/* ======== #framework ======== */
export function FrameworkPage() {
  return (
    <PageShell
      back={{ label: 'pathway', href: HOME_HREF }}
      crumbs={[pathwayCrumb, { label: 'framework' }]}
      kicker={<>framework {star} structure v3</>}
      title="How the work is organised."
      tagline="All Mentheon work is organised by category, output type and stage."
    >
      <Section num="01" title="The pathway">
        <p className={s.prose}>
          The helix is the care pathway. Clinical categories are named by intended purpose, taken from the EU MDR
          definition of a medical device, and ordered along it. Perception sits at the free end, outside the clinical
          pathway.
        </p>
        <Pathway />
        <p className={s.prose}>
          At the head of the staff: <a href="#plasmids">Plasmids</a>, standalone software that fits no category.
          Beside the categories: <a href="#infrastructure">research infrastructure</a>, the shared foundations every
          category draws on, and <a href="#services">research as a service</a>, an external offer.
        </p>
      </Section>

      <Section num="02" title="Categories">
        <p className={s.prose}>Each category is defined by the verb it performs, so any piece of work belongs to exactly one.</p>
        <div className={s.cards}>
          {CATEGORIES.map((c) => (
            <a key={c.id} className={s.card} href={catHref(c.id)}>
              <span className={s.cardNum}>{c.onHelix ? `${c.num} · care pathway` : `${c.num} · head of the staff`}</span>
              <span className={s.cardVerb}>{c.verb}</span>
              <span className={s.cardTitle}>{c.label}</span>
              <span className={s.cardText}>{c.purpose}.</span>
              <span className={s.cardMeta}>
                <span className={s.cardMetaRow}><span>outputs</span><span>{c.typicalOutputs}</span></span>
                <span className={s.cardMetaRow}><span>regulatory</span><span>{c.typicalRegClass}</span></span>
              </span>
            </a>
          ))}
        </div>
      </Section>

      <Section num="03" title="Boundaries">
        <ul className={s.rules}>
          {BOUNDARIES.map((b) => (
            <li key={b.label} className={s.rule}><span className={s.ruleLabel}>{b.label}</span><span className={s.ruleText}>{b.text}</span></li>
          ))}
          <li className={s.rule}><span className={s.ruleLabel}>Plasmid metaphor</span><span className={s.ruleText}>{PLASMID_METAPHOR}</span></li>
        </ul>
      </Section>

      <Section num="04" title="Output types and stage tracks">
        <p className={s.prose}>Four output types, each with its own stages; stages doing a similar job line up across tracks.</p>
        <div className={s.trackCols} aria-hidden="true">
          <span>output type</span><span>start</span><span>shape</span><span>gate</span><span>study · release</span><span>insights</span><span>end</span>
        </div>
        <div className={s.tracks}>
          {OUTPUT_TYPES.map((t) => (
            <div key={t.id} className={s.track}>
              <div>
                <div className={s.trackLabel}>{t.label}</div>
                <p className={s.trackDef}>{t.definition}.</p>
                <div className={s.trackMeta}>{t.direction.toLowerCase()}<br />category · {t.categoryRule.toLowerCase()}</div>
              </div>
              <StageLine type={t.id} aligned />
            </div>
          ))}
        </div>
        <ul className={s.rules} style={{ marginTop: '1.5rem' }}>
          {TRACK_NOTES.map((n) => <li key={n} className={s.rule}><span className={s.ruleText}>{n}</span></li>)}
        </ul>
      </Section>

      <Section num="05" title="Classification">
        <p className={s.prose}>Every output carries five fields. The <a href="#register">register</a> filters by them.</p>
        <Fields items={FIELDS.map((f) => ({ label: f.label, value: <span style={{ fontWeight: 400, fontSize: '0.9rem' }}>{f.values}</span> }))} />
      </Section>
    </PageShell>
  )
}

/* ======== #category/<id> ======== */
export function CategoryPage({ id }: { id: CategoryId }) {
  const c = categoryById(id)!
  const items = outputsIn(id)
  const i = HELIX_CATEGORIES.findIndex((x) => x.id === id)
  const prev = HELIX_CATEGORIES[i - 1], next = HELIX_CATEGORIES[i + 1]
  const bounds = BOUNDARIES.filter((b) => b.pair.includes(id) && b.pair[0] !== b.pair[1])
  return (
    <PageShell
      back={{ label: 'pathway', href: `${HOME_HREF}&focus=${id}` }}
      crumbs={[pathwayCrumb, { label: 'framework', href: '#framework' }, { label: c.label.toLowerCase() }]}
      kicker={<>§ {c.num} {star} {c.clinical ? 'on the pathway' : 'free end · non-clinical'} {star} {categoryStatus(id)}</>}
      title={c.label}
      tagline={`${c.purpose}.`}
      aside={<><span className={s.verb}>{c.verb}.</span><span className={s.verbLabel}>the verb it performs</span></>}
    >
      <Pathway active={id} />
      <Fields items={[
        { label: 'outputs', value: pad2(items.length) },
        { label: 'status', value: categoryStatus(id) },
        { label: 'typical outputs', value: c.typicalOutputs },
        { label: 'typical regulatory class', value: c.typicalRegClass },
      ]} />
      <Section num="01" title="Outputs">
        <OutputRows items={items} showCategory={false} />
      </Section>
      {bounds.length > 0 && (
        <Section num="02" title="Boundaries">
          <ul className={s.rules}>
            {bounds.map((b) => <li key={b.label} className={s.rule}><span className={s.ruleLabel}>{b.label}</span><span className={s.ruleText}>{b.text}</span></li>)}
          </ul>
        </Section>
      )}
      <Pager
        prev={prev ? { label: `${prev.num} · ${prev.label}`, href: catHref(prev.id) } : { label: '00 · Plasmids', href: '#plasmids' }}
        next={next && { label: `${next.num} · ${next.label}`, href: catHref(next.id) }}
      />
    </PageShell>
  )
}

/* ======== #plasmids ======== */
export function PlasmidsPage() {
  const c = categoryById('plasmids')!
  const items = outputsIn('plasmids')
  return (
    <PageShell
      back={{ label: 'pathway', href: `${HOME_HREF}&focus=plasmids` }}
      crumbs={[pathwayCrumb, { label: 'framework', href: '#framework' }, { label: 'plasmids' }]}
      kicker={<>§ 00 {star} head of the staff · software {star} {categoryStatus('plasmids')}</>}
      title="Plasmids"
      tagline={`${c.purpose}.`}
      aside={<><span className={s.verb}>{c.verb}.</span><span className={s.verbLabel}>the verb it performs</span></>}
    >
      <Pathway active="plasmids" />
      <p className={s.abstract}>{PLASMID_METAPHOR}</p>
      <Fields items={[
        { label: 'outputs', value: pad2(items.length) },
        { label: 'output type', value: 'Software project' },
        { label: 'regulatory class', value: 'None' },
        { label: 'rule', value: 'Only for work that fits no other category' },
      ]} />
      <Section num="01" title="Outputs">
        <OutputRows items={items} showCategory={false} />
      </Section>
      <Pager next={{ label: '01 · Detection', href: '#category/detection' }} />
    </PageShell>
  )
}

/* ======== #register ======== */
type FilterKey = 'category' | 'type' | 'regClass' | 'affiliation'
export function RegisterPage({ query }: { query: URLSearchParams }) {
  const init = (k: string) => new Set((query.get(k) || '').split(',').filter(Boolean))
  const [f, setF] = useState<Record<FilterKey, Set<string>>>(() => ({
    category: init('category'), type: init('type'), regClass: init('regClass'), affiliation: init('affiliation'),
  }))
  const toggle = (k: FilterKey, v: string) => setF((p) => {
    const n = new Set(p[k]); n.has(v) ? n.delete(v) : n.add(v)
    return { ...p, [k]: n }
  })
  const affKey = (o: Output) => o.affiliation.kind
  const match = (o: Output, skip?: FilterKey) =>
    (skip === 'category' || !f.category.size || f.category.has(o.category)) &&
    (skip === 'type' || !f.type.size || f.type.has(o.type)) &&
    (skip === 'regClass' || !f.regClass.size || f.regClass.has(o.regClass)) &&
    (skip === 'affiliation' || !f.affiliation.size || f.affiliation.has(affKey(o)))
  const rows = useMemo(() => OUTPUTS.filter((o) => match(o)), [f])
  const any = Object.values(f).some((x) => x.size)
  const count = (k: FilterKey, v: string) => OUTPUTS.filter((o) => match(o, k) && (
    k === 'category' ? o.category === v : k === 'type' ? o.type === v : k === 'regClass' ? o.regClass === v : affKey(o) === v)).length
  const group = (k: FilterKey, label: string, opts: { v: string; label: string }[]) => (
    <div className={s.filterGroup} role="group" aria-label={label}>
      <span className={s.filterLabel}>{label}</span>
      <span className={s.chips}>
        {opts.map((o) => (
          <button key={o.v} type="button" className={cx(s.chip, f[k].has(o.v) && s.isOn)} aria-pressed={f[k].has(o.v)} onClick={() => toggle(k, o.v)}>
            {o.label}<span className={s.chipCount}>{pad2(count(k, o.v))}</span>
          </button>
        ))}
      </span>
    </div>
  )
  return (
    <PageShell
      back={{ label: 'pathway', href: HOME_HREF }}
      crumbs={[pathwayCrumb, { label: 'register' }]}
      kicker={<>register {star} {pad2(OUTPUTS.length)} outputs {star} {pad2(CATEGORIES.length)} categories</>}
      title="All outputs."
      tagline="Every output, filterable by the five classification fields."
    >
      <div className={s.filters}>
        {group('category', 'category', CATEGORIES.map((c) => ({ v: c.id, label: c.label })))}
        {group('type', 'output type', OUTPUT_TYPES.map((t) => ({ v: t.id, label: t.label })))}
        {group('regClass', 'regulatory class', REG_CLASSES.map((r) => ({ v: r, label: r })))}
        {group('affiliation', 'affiliation', [{ v: 'owned', label: 'Mentheon-owned' }, { v: 'affiliated', label: 'Affiliated' }])}
      </div>
      <div className={s.filterBar}>
        <span aria-live="polite">showing {pad2(rows.length)} of {pad2(OUTPUTS.length)}</span>
        <button type="button" className={s.clear} disabled={!any}
          onClick={() => setF({ category: new Set(), type: new Set(), regClass: new Set(), affiliation: new Set() })}>clear filters</button>
      </div>
      <OutputRows items={rows} />
      <p className={s.note}>stage <strong>·</strong> current stage on that output type's track</p>
    </PageShell>
  )
}

/* ======== #output/<id> — the project summary page ========
   One page per output, research or software: stage at the top, then
   a single Overview (the five fields + provenance), then Abstract,
   Objectives, Research questions, Contact, and (software) Beta. A
   finalised output with a DOI / URL / repo gets a View publication /
   artefact / code button under the header. */
/* Header marks: the product mark (code tile for placeholders); for
   Aufdröselung, its mark + Essen side by side, plum / cream by theme. */
function OutputMarks({ o }: { o: Output }) {
  const pair = o.id === AUF_ID
  const html = productTileHTML(o).replace('class="ptile', `class="ptile${pair ? ' is-pair' : ''}`)
  return (
    <div className={s.marks}>
      <span className={s.mark} dangerouslySetInnerHTML={{ __html: html }} />
      {pair && (
        <span className={s.mark}>
          <img className={cx(s.essen, s.essenLight)} src={essenIcon(false)} alt="Essen" />
          <img className={cx(s.essen, s.essenDark)} src={essenIcon(true)} alt="Essen" />
        </span>
      )}
    </div>
  )
}
const pending = (what: string) => <p className={s.empty}>{what} · to be written</p>

export function OutputPage({ o }: { o: Output }) {
  const c = categoryById(o.category)!
  const t = typeById(o.type)
  const src = o.source ? outputById(o.source) : undefined
  const derived = OUTPUTS.filter((x) => x.source === o.id)
  const idx = OUTPUTS.indexOf(o)
  const prev = OUTPUTS[idx - 1], next = OUTPUTS[idx + 1]
  const backHref = catHref(o.category)
  const sw = isSoftware(o)
  let n = 0
  const num = () => pad2(++n)
  return (
    <PageShell
      back={{ label: c.label.toLowerCase(), href: backHref }}
      crumbs={[pathwayCrumb, { label: c.label.toLowerCase(), href: backHref }, { label: o.code.toLowerCase() }]}
      kicker={<>{o.code.toLowerCase()} {star} {c.label.toLowerCase()} {star} {t.label.toLowerCase()} {star} {stageLabel(o).toLowerCase()}</>}
      title={o.title}
      placeholder={o.placeholder}
      tagline={o.synopsis}
      aside={<OutputMarks o={o} />}
    >
      {o.link && (
        <div className={s.ctaRow}>
          <a className={s.cta} href={o.link.href} target="_blank" rel="noreferrer">{LINK_LABEL[o.link.kind]} <span aria-hidden="true">→</span></a>
        </div>
      )}

      <Section num={num()} title={sw ? "Contact · authors" : "Contact · researchers and affiliates"}>
        {o.contacts?.length ? (
          <div className={s.people}>
            {o.contacts.map((p) => (
              <div key={p.name + p.email} className={s.card}>
                <span className={s.personName}>{p.name}</span>
                <span className={s.personRole}>{p.role}</span>
                <span className={s.personInst}>{p.institution}</span>
                <a className={s.personMail} href={`mailto:${p.email}?subject=${encodeURIComponent(o.code + ' · ' + o.title)}`}>email →</a>
              </div>
            ))}
          </div>
        ) : pending('contacts')}
      </Section>

      {sw && (
        <Section num={num()} title="Beta testers">
          <div className={s.intake}>
            {stageLabel(o) === 'Beta testing' ? (
              <>
                <span className={s.intakeState}>beta testing · in progress</span>
                <p className={s.intakeText}>Public sign-up for this software will open here.</p>
              </>
            ) : (
              <>
                <span className={s.intakeState}>beta testing · not yet open</span>
                <p className={s.intakeText}>Sign-up for this software will open here.</p>
              </>
            )}
          </div>
        </Section>
      )}

      <Section num={num()} title="Stage">
        <BranchTrack o={o} />
        <div className={s.trackLegend}>
          <span><i className={s.legSolid} />recorded exit</span>
          <span><i className={s.legSw} />software project</span>
          <span><i className={s.legDash} />possible exit</span>
        </div>
      </Section>

      <Section num={num()} title="Overview">
        <Fields items={[
          { label: 'category', value: <a href={backHref}>{c.label}</a> },
          { label: 'output type', value: t.label },
          { label: 'stage', value: `${pad2(o.stage + 1)} · ${stageLabel(o)}` },
          { label: 'regulatory class', value: o.samdClass ? `${o.regClass} · SaMD ${o.samdClass}` : o.regClass },
          { label: 'affiliation', value: affiliationLabel(o) },
        ]} />
        {src && <p className={s.note}>source <strong>·</strong> <a className={s.link} href={outHref(src)}>{src.code} · {outputName(src)}</a> <strong>·</strong> category inherited</p>}
        {derived.map((d) => <p key={d.id} className={s.note}>released as <strong>·</strong> <a className={s.link} href={outHref(d)}>{d.code} · {outputName(d)}</a></p>)}
        {o.affiliation.kind === 'affiliated' && (
          <p className={s.prose} style={{ marginTop: '1.25rem' }}>IP or authorship for this work sits with {o.affiliation.partner}. It is presented within what that agreement allows.</p>
        )}
      </Section>

      <Section num={num()} title="Abstract">
        {o.abstract ? <p className={s.abstract}>{o.abstract}</p> : pending('abstract')}
      </Section>

      <Section num={num()} title="Objectives">
        {o.objectives?.length ? (
          <div className={s.objectives}>
            {o.objectives.map((ob) => (
              <div key={ob.verb + ob.text} className={cx(s.card, s.objective)}>
                <span className={s.objectiveVerb}>{ob.verb}</span>
                <span className={s.cardText}>{ob.text}</span>
              </div>
            ))}
          </div>
        ) : pending('objectives')}
      </Section>

      <Section num={num()} title="Research questions">
        {o.researchQuestions?.length ? (
          <ol className={s.rqs}>
            {o.researchQuestions.map((q, i) => (
              <li key={i} className={s.rq}><span className={s.rqNum}>RQ{i + 1}</span><span className={s.rqText}>{q}</span></li>
            ))}
          </ol>
        ) : pending('research questions')}
      </Section>

      <Section num={num()} title={`Also in ${c.label.toLowerCase()}`}>
        <OutputRows items={outputsIn(o.category).filter((x) => x.id !== o.id)} showCategory={false} />
      </Section>
      <Pager
        prev={prev && { label: `${prev.code} · ${outputName(prev)}`, href: outHref(prev) }}
        next={next && { label: `${next.code} · ${outputName(next)}`, href: outHref(next) }}
      />
    </PageShell>
  )
}

/* ======== #infrastructure ======== */
export function InfrastructurePage() {
  return (
    <PageShell
      back={{ label: 'pathway', href: HOME_HREF }}
      crumbs={[pathwayCrumb, { label: 'research infrastructure' }]}
      kicker={<>supporting {star} research infrastructure {star} {pad2(INFRASTRUCTURE.length)} components</>}
      title="Research infrastructure"
      tagline="The shared foundations every category draws on."
    >
      <div className={s.cards}>
        {INFRASTRUCTURE.map((x, i) => (
          <div key={x.label} className={s.card}>
            <span className={s.cardNum}>{pad2(i + 1)}</span>
            <span className={s.cardTitle}>{x.label}</span>
            <span className={s.cardText}>{x.covers}.</span>
          </div>
        ))}
      </div>
      <p className={s.note}>regulatory pathway <strong>·</strong> designed with a SaMD pathway in mind</p>
      <Pager prev={{ label: 'Plasmids', href: '#plasmids' }} next={{ label: 'Research as a service', href: '#services' }} />
    </PageShell>
  )
}

/* ======== #services ======== */
export function ServicesPage() {
  return (
    <PageShell
      back={{ label: 'pathway', href: HOME_HREF }}
      crumbs={[pathwayCrumb, { label: 'services' }]}
      kicker={<>services</>}
      title="Services"
      tagline=""
    >
      {null}
    </PageShell>
  )
}

export function NotFoundPage({ what }: { what: string }) {
  return (
    <PageShell back={{ label: 'pathway', href: HOME_HREF }} crumbs={[pathwayCrumb, { label: 'not found' }]}
      kicker={<>not found</>} title="Nothing here." tagline={`No ${what} with that id.`}>
      <p className={s.prose}>Try the <a href="#register">register</a>.</p>
    </PageShell>
  )
}

export type { OutputTypeId }
export { TRACK_COLS }
