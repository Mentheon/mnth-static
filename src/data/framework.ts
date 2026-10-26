/* Mentheon structure v3 — the abstract framework as data.
   Categories, output types + stage tracks, the five classification
   fields, supporting sections. Names no brands or projects; OUTPUTS
   at the bottom are LABELLED PLACEHOLDERS until real work is assigned
   (set placeholder:false and fill title/synopsis when it is). */

import { CONTACT_EMAIL } from './people'
import { ADVISORY } from './advisory'

export type CategoryId = 'detection' | 'monitoring' | 'forecasting' | 'therapeutics' | 'perception' | 'plasmids' | 'advisory'
export type OutputTypeId = 'programme' | 'artefact' | 'software' | 'product' | 'service'
export type RegClass = 'None' | 'Wellness' | 'Digital biomarker' | 'Diagnostic' | 'Prognostic' | 'Digital therapeutic'

export interface Category {
  id: CategoryId
  num: string            // staff position, zero-padded; Plasmids '00' at the head
  label: string
  verb: string
  purpose: string
  typicalOutputs: string
  typicalRegClass: string
  onHelix: boolean
  clinical: boolean
  code: string           // output code prefix
}

export const CATEGORIES: Category[] = [
  { id: 'detection',    num: '01', code: 'DET', label: 'Detection',    verb: 'Detect',     onHelix: true,  clinical: true,
    purpose: 'Early, ubiquitous signs of change', typicalOutputs: 'Passive-sensing studies, biomarker models', typicalRegClass: 'Digital biomarker, diagnostic' },
  { id: 'monitoring',   num: '02', code: 'MON', label: 'Monitoring',   verb: 'Measure',    onHelix: true,  clinical: true,
    purpose: 'Continuous real-world measurement', typicalOutputs: 'Multimodal signal analysis, longitudinal datasets', typicalRegClass: 'Monitoring device, wellness' },
  { id: 'forecasting',  num: '03', code: 'FOR', label: 'Forecasting',  verb: 'Forecast',   onHelix: true,  clinical: true,
    purpose: 'Prediction and prognosis, and disclosure of the result', typicalOutputs: 'Trajectory models, disclosure and ethics studies', typicalRegClass: 'Prognostic SaMD' },
  { id: 'therapeutics', num: '04', code: 'THE', label: 'Therapeutics', verb: 'Intervene',  onHelix: true,  clinical: true,
    purpose: 'Treatment and alleviation', typicalOutputs: 'Interventions, therapeutic environments, supporting artefacts', typicalRegClass: 'Digital therapeutic' },
  { id: 'perception',   num: '05', code: 'PER', label: 'Perception',   verb: 'Understand', onHelix: true,  clinical: false,
    purpose: 'How people perceive one another, outside the clinical pathway', typicalOutputs: 'Perception studies, co-designed artefacts', typicalRegClass: 'Usually none' },
  { id: 'plasmids',     num: '00', code: 'PLA', label: 'Plasmids',     verb: 'Experiment', onHelix: false, clinical: false,
    purpose: 'Standalone experimental software with no clinical purpose', typicalOutputs: 'Software projects', typicalRegClass: 'None' },
]
export const HELIX_CATEGORIES = CATEGORIES.filter((c) => c.onHelix)
/* Advisory: the node at the very head of the staff, above Plasmids —
   consultancy services, not research. Kept out of CATEGORIES so the
   framework / register pages don't list it; categoryById still finds it. */
export const ADVISORY_CATEGORY: Category = {
  id: 'advisory', num: 'AD', code: 'ADV', label: 'Advisory', verb: 'Advise', onHelix: false, clinical: false,
  purpose: 'Consultancy and advisory services across research, design and development, in digital health and every other domain',
  typicalOutputs: 'Research, design, development and consultancy engagements', typicalRegClass: 'Not applicable',
}
export const isAdvisory = (o: { category: CategoryId }) => o.category === 'advisory'
/* Each category is presented as a strand. `split` is the two-line break
   on its logo tile (Helix3D cube faces, the mobile list). */
export const STRAND: Record<CategoryId, { name: string; split: [string, string] }> = {
  advisory:     { name: 'Advisory',  split: ['ADVI', 'SORY'] },
  plasmids:     { name: 'Plasmids',  split: ['PLAS', 'MIDS'] },
  detection:    { name: 'Aevorix',   split: ['AEV', 'ORIX'] },
  monitoring:   { name: 'Vitrix',    split: ['VIT', 'RIX'] },
  forecasting:  { name: 'Acumentra', split: ['ACU', 'MENTRA'] },
  therapeutics: { name: 'Lenitudo',  split: ['LENI', 'TUDO'] },
  perception:   { name: 'Kindreon',  split: ['KIND', 'REON'] },
}
/* Staff order: Advisory at the head, then Plasmids, the pathway, Perception last. */
export const STAFF_ORDER: CategoryId[] = ['advisory', 'plasmids', 'detection', 'monitoring', 'forecasting', 'therapeutics', 'perception']
export const categoryById = (id: string) => (id === 'advisory' ? ADVISORY_CATEGORY : CATEGORIES.find((c) => c.id === id))

export const BOUNDARIES: { pair: [CategoryId, CategoryId]; label: string; text: string }[] = [
  { pair: ['detection', 'forecasting'], label: 'Detection vs Forecasting',
    text: 'Detection establishes that change has begun; forecasting models where it goes next. Detection outputs feed forecasting.' },
  { pair: ['forecasting', 'therapeutics'], label: 'Forecasting vs Therapeutics',
    text: 'Forecasting describes the trajectory; therapeutics sets out to change it.' },
  { pair: ['monitoring', 'detection'], label: 'Monitoring vs Detection',
    text: 'Monitoring is ongoing measurement; detection looks for the first meaningful change within it.' },
  { pair: ['plasmids', 'plasmids'], label: 'Plasmids',
    text: 'Only for work that fits no other category. Software with a clinical purpose goes in that category.' },
]

export const PLASMID_METAPHOR =
  'Plasmids are self-contained loops of DNA outside the main chromosome that replicate independently and can transfer. A Plasmid can later transfer onto the helix if it gains a clinical purpose or produces research questions.'

/* Exits: parallel tracks that branch off the main stage line. A
   research programme has two standing exit slots (Early insights,
   Pre-print); any output can also branch into a software project
   from any stage. Each exit either rejoins the main track or ends. */
export type ExitKind = 'insights' | 'preprint' | 'software'
export interface ExitSlot { kind: ExitKind; after: number; label: string }
export interface Exit {
  kind: ExitKind
  after: number                    // stage index it branches from
  behaviour: 'rejoin' | 'end'
  title?: string
  outputId?: string                // software exits: the software project's output id
  href?: string                    // insights / preprint: external link (doi, url)
  date?: string
}
export const EXIT_LABEL: Record<ExitKind, string> = { insights: 'Early insights', preprint: 'Pre-print', software: 'Software project' }

export interface OutputType {
  id: OutputTypeId
  label: string
  definition: string
  direction: string
  categoryRule: string
  stages: string[]
  repeats?: number       // index of a stage that repeats (RtD loop)
  exitSlots?: ExitSlot[]
}

export const OUTPUT_TYPES: OutputType[] = [
  { id: 'programme', label: 'Research programme',
    definition: 'Mentheon-led research aiming at empirical insights for a paper, usually with a minimum-viable software product',
    direction: 'Bottom-up, theory-led', categoryRule: 'Required',
    stages: ['Nascent', 'Protocol', 'Ongoing study', 'Near concluded', 'Published'],
    exitSlots: [{ kind: 'insights', after: 2, label: 'Early insights' }, { kind: 'preprint', after: 3, label: 'Pre-print' }] },
  { id: 'artefact', label: 'Prospective artefact',
    definition: 'An artefact developed through Research through Design',
    direction: 'Artefact-led, iterative', categoryRule: 'Required',
    stages: ['Nascent', 'Concept artefact', 'RtD iteration', 'Early insights / preprint', 'Published'], repeats: 2 },
  { id: 'software', label: 'Software project',
    definition: 'Experimental software built to gain empirical insight into its field',
    direction: 'Top-down, never without rationale', categoryRule: 'Optional (Plasmids if none fits)',
    stages: ['Nascent', 'Concept & rationale', 'Prototype', 'Beta testing', 'Insights', 'Product or retired'] },
  { id: 'product', label: 'Software product',
    definition: 'Finalised software derived from one of the above, refined for release',
    direction: 'Derived', categoryRule: 'Inherited from its source',
    stages: ['Release candidate', 'Released', 'Maintained', 'Sunset'] },
]
/* Advisory services' type. Not in OUTPUT_TYPES (no stage track on the
   framework page / register filters). */
export const SERVICE_TYPE: OutputType = {
  id: 'service', label: 'Advisory service', definition: 'Consultancy and advisory engagements', direction: 'By enquiry',
  categoryRule: 'Advisory', stages: ['By enquiry'],
}
export const typeById = (id: string) => (id === 'service' ? SERVICE_TYPE : OUTPUT_TYPES.find((t) => t.id === id)!)

export const TRACK_NOTES = [
'Stage 3 splits them: an ongoing study, an open iteration loop, or a prototype.',
  'Research programmes have two parallel exits: Early insights from the ongoing study, and a pre-print once the study is near concluded. Each exit either rejoins the main track or ends there.',
  'Any output can branch into a software project at any stage; the exit links to that project.',
  'Endings differ: research tracks end in publication; software projects end in a decision.',
  'Products never start at Nascent: they always record their source.',
]

export const REG_CLASSES: RegClass[] = ['None', 'Wellness', 'Digital biomarker', 'Diagnostic', 'Prognostic', 'Digital therapeutic']

export const FIELDS: { label: string; values: string }[] = [
  { label: 'Category', values: 'Detection, Monitoring, Forecasting, Therapeutics, Perception, or Plasmids' },
  { label: 'Output type', values: 'Research programme, Prospective artefact, Software project, Software product' },
  { label: 'Stage', values: "From that output type's track" },
  { label: 'Regulatory class', values: 'None, Wellness, Digital biomarker, Diagnostic, Prognostic, Digital therapeutic; plus SaMD class where relevant' },
  { label: 'Affiliation', values: 'Mentheon-owned, or affiliated (with the partner institution named)' },
]

export const INFRASTRUCTURE: { label: string; covers: string }[] = [
  { label: 'Participants',    covers: 'Recruitment, patient and public involvement, co-design' },
  { label: 'Instrumentation', covers: 'Physiological sensing, telemetry, interaction logging' },
  { label: 'Data',            covers: 'Pipelines, storage, pseudonymisation, data-protection practice' },
  { label: 'Governance',      covers: 'Ethics templates, consent processes, regulatory pathway' },
  { label: 'Build',           covers: 'Shared software foundations and deployment' },
]

/* ---- Outputs ---- */
export type Affiliation = { kind: 'owned' } | { kind: 'affiliated'; partner: string }
export interface Output {
  id: string             // slug, used in #output/<id>
  code: string
  placeholder: boolean
  title: string
  synopsis: string
  category: CategoryId
  type: OutputTypeId
  stage: number          // index into that type's stages
  regClass: RegClass
  samdClass?: string
  affiliation: Affiliation
  source?: string        // products: id of the output it derives from
  exits?: Exit[]
  /* Set → data is live: the track animates it flowing from the current
     stage into the next one, captioned with this text. */
  inflow?: string
  /* Product mark (lettered tile: emblem + lowercase initial + mono
     name plate). Set → the output shows its product logo. */
  product?: string
  abstract?: string
  objectives?: { verb: string; text: string }[]
  researchQuestions?: string[]
  contacts?: Contact[]
  /* Set once the work is finalised and there is a DOI / URL / repo. */
  link?: { kind: 'publication' | 'artefact' | 'code'; href: string }
  /* Set → the project page is public. Unset outputs still show in their
     strand (list, window, register) but stop there, with a padlock. */
  open?: boolean
  /* Beta seats (software). Static: bump `taken` by hand as requests are
     confirmed. `email` is where "Open email" sends a request; without it
     the dialog offers Copy summary only. */
  beta?: { seats: number; taken: number; email?: string }
}
export interface Contact {
  name: string; role: string; institution: string
  email?: string
  /* Id in data/people → the card links to their profile window on #who. */
  person?: string
}
export const LINK_LABEL = { publication: 'View publication', artefact: 'View artefact', code: 'View code' } as const
export const isSoftware = (o: { type: OutputTypeId }) => o.type === 'software' || o.type === 'product'

/* Exits shown on an output's track: its recorded exits, plus any of
   its type's standing slots it hasn't recorded (as possible exits). */
export function exitsFor(o: Output): (Exit & { possible?: boolean })[] {
  const rec = o.exits ?? []
  const slots = (typeById(o.type).exitSlots ?? [])
    .filter((s) => !rec.some((e) => e.kind === s.kind && e.after === s.after))
    .map((s) => ({ kind: s.kind, after: s.after, behaviour: 'rejoin' as const, possible: true }))
  return [...rec, ...slots].sort((a, b) => a.after - b.after)
}

const PH = 'Placeholder. Title and description to be assigned.'
const PH_CONTACT: Contact[] = [{ name: 'Name to be assigned', role: 'Lead researcher', institution: 'Mentheon', email: 'research@mentheon.example' }]
const ph = (code: string, o: Omit<Output, 'id' | 'code' | 'placeholder' | 'title' | 'synopsis'> & Partial<Pick<Output, 'placeholder' | 'title' | 'synopsis'>>): Output => ({
  id: code.toLowerCase(), code, placeholder: true, title: 'Untitled output', synopsis: PH, contacts: PH_CONTACT, ...o,
})

/* Public stages are held at Nascent for every output except
   Aufdröselung (in beta testing, insights flowing in). Advance a
   stage here only once that work is cleared to be shown publicly. */
export const OUTPUTS: Output[] = [
  ph('DET-01', { product: 'Frühspur', title: 'Frühspur', placeholder: false, synopsis: 'Behavioural biomarkers.', category: 'detection',    type: 'programme', stage: 0, regClass: 'Digital biomarker', affiliation: { kind: 'owned' } }),
  ph('DET-02', { category: 'detection',    type: 'software',  stage: 0, regClass: 'Digital biomarker', affiliation: { kind: 'owned' } }),
  ph('MON-01', { product: 'Stetwacht', title: 'Stetwacht', placeholder: false, synopsis: 'Health analytics.', category: 'monitoring',   type: 'programme', stage: 0, regClass: 'Wellness',          affiliation: { kind: 'affiliated', partner: 'Partner institution' } }),
  ph('MON-02', { category: 'monitoring',   type: 'software',  stage: 0, regClass: 'Wellness',          affiliation: { kind: 'owned' } }),
  ph('FOR-01', { product: 'Vorbahn', title: 'Vorbahn', placeholder: false, synopsis: 'Trajectory forecasting.', category: 'forecasting',  type: 'programme', stage: 0, regClass: 'Prognostic',        affiliation: { kind: 'owned' } }),
  ph('FOR-02', { product: 'Offenwort', title: 'Offenwort', placeholder: false, synopsis: 'Disclosure ethics.', category: 'forecasting',  type: 'artefact',  stage: 0, regClass: 'None',              affiliation: { kind: 'owned' } }),
  ph('THE-01', { product: 'Erinnerstube', title: 'Erinnerstube', placeholder: false, synopsis: 'VR reminiscence therapy.', category: 'therapeutics', type: 'programme', stage: 0, regClass: 'Digital therapeutic', affiliation: { kind: 'owned' } }),
  ph('THE-02', { category: 'therapeutics', type: 'artefact',  stage: 0, regClass: 'Wellness',          affiliation: { kind: 'owned' } }),
  ph('PER-01', { product: 'Sphekia', title: 'Sphekia', placeholder: false, synopsis: 'Description to be assigned.', category: 'perception',   type: 'artefact',  stage: 0, regClass: 'None',              affiliation: { kind: 'owned' } }),
  ph('PER-02', { product: 'Fernfenster', title: 'Fernfenster', placeholder: false, synopsis: 'LDR diorama portal.', category: 'perception',   type: 'artefact',  stage: 0, regClass: 'None',              affiliation: { kind: 'owned' } }),
  ph('PLA-01', { product: 'Aufdröselung', title: 'Aufdröselung', placeholder: false, synopsis: 'Description to be assigned.', category: 'plasmids',     type: 'software',  stage: 3, regClass: 'None',              affiliation: { kind: 'owned' }, inflow: 'Insights flowing in', open: true,
    beta: { seats: 10, taken: 3, email: CONTACT_EMAIL },
    contacts: [{ name: 'Nicholas Quentin Smith', role: 'Founder & Director of Research', institution: 'Mentheon', person: 'nicholas', email: CONTACT_EMAIL }] }),
  ph('PLA-02', { product: 'Rostrella', title: 'Rostrella', placeholder: false, synopsis: 'Description to be assigned.', category: 'plasmids',     type: 'software',  stage: 0, regClass: 'None',              affiliation: { kind: 'owned' } }),
]

/* Advisory's four services as outputs, so the staff shows them as cubes.
   Never open (no pages): their window is the write-up + an email link.
   Not in OUTPUTS, so the register and output counts leave them out. */
export const ADVISORY_OUTPUTS: Output[] = ADVISORY.map((a) => ({
  id: `adv-${a.id}`, code: `ADV-${a.num}`, placeholder: false, title: a.label, product: a.short,
  synopsis: a.lede, abstract: a.body.join(' '), category: 'advisory', type: 'service', stage: 0, regClass: 'None',
  affiliation: { kind: 'owned' },
}))
export const advisoryFor = (o: Output) => ADVISORY.find((a) => `adv-${a.id}` === o.id)

export const outputById = (id: string) => OUTPUTS.find((o) => o.id === id) ?? ADVISORY_OUTPUTS.find((o) => o.id === id)
export const outputsIn = (c: CategoryId) => (c === 'advisory' ? ADVISORY_OUTPUTS : OUTPUTS.filter((o) => o.category === c))
export const isOpen = (o: Output) => !!o.open
export const stageLabel = (o: Output) => typeById(o.type).stages[o.stage]
export const outputName = (o: Output) => (o.placeholder ? `${o.title} · ${o.code}` : o.title)
export const affiliationLabel = (o: Output) =>
  o.affiliation.kind === 'owned' ? 'Mentheon-owned' : `Affiliated · ${o.affiliation.partner}`

/* Category status is derived from its outputs, never set by hand. */
export type CategoryStatus = 'no outputs' | 'nascent' | 'active' | 'by enquiry'
export function categoryStatus(c: CategoryId): CategoryStatus {
  if (c === 'advisory') return 'by enquiry'
  const os = outputsIn(c)
  if (!os.length) return 'no outputs'
  return os.some((o) => o.type === 'product' || o.stage > 0) ? 'active' : 'nascent'
}

export const pad2 = (n: number) => String(n).padStart(2, '0')
