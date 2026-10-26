/* Consultancy & advisory services: the Advisory node at the head of
   the staff (above Plasmids) and its four orbiting cubes. Copy is
   boilerplate: edit freely; order sets the orbit order. Everything past
   the write-up is locked: the only action is emailing (CONTACT_EMAIL).
   framework.ts turns these into the node's outputs (ADVISORY_OUTPUTS). */

/* The Advisory node and its cubes stand out in gold (both themes), with
   plum ink on it. Selected/hovered still turns crimson like the rest. */
export const ADVISORY_GOLD = '#E0A526'
export const ADVISORY_INK = '#2F0147'

export type AdvisoryId = 'research' | 'design' | 'development' | 'advisory'

export interface AdvisoryService {
  id: AdvisoryId
  num: string
  label: string
  /** Name on its cube (the product-mark plate) and caption. */
  short: string
  /** Short line under the name in the detail panel. */
  lede: string
  body: string[]
  /** What an engagement typically covers. */
  covers: string[]
}

/* Shared framing: digital health is the focus, not the limit. */
export const ADVISORY_SCOPE =
  'Digital health is our focus, not our limit: we take on software in every domain, always bottom-up and evidence-based, and we stay engaged across the whole research, design and development pipeline.'

export const ADVISORY: AdvisoryService[] = [
  {
    id: 'research',
    num: '01',
    label: 'Research',
    short: 'Research',
    lede: 'Evidence first, in digital health and beyond.',
    body: [
      'We advise on research strategy for software projects in any domain, with particular depth in digital health and clinical technology: framing the right questions, choosing study designs that fit the evidence you need, and planning analyses before data collection begins.',
      'Our approach is bottom-up and evidence-based. Research is the first stage of a pipeline we stay engaged in through design and development, so findings carry directly into what gets built.',
    ],
    covers: ['Study & protocol design', 'Literature & evidence reviews', 'Ethics & governance', 'Analysis planning'],
  },
  {
    id: 'design',
    num: '02',
    label: 'Design',
    short: 'Design',
    lede: 'Products shaped around the people who use them.',
    body: [
      'We help teams in every sector design products and services grounded in evidence about their users: understanding people and the workflows they rely on, mapping where a tool fits into real practice, and turning that insight into accessible, usable interfaces.',
      'In health settings that means patients, clinicians and care pathways; elsewhere it means the same rigour applied to your users. Design follows directly from the research and leads straight into development.',
    ],
    covers: ['User research', 'Pathway & service mapping', 'Interface design & prototyping', 'Usability & accessibility review'],
  },
  {
    id: 'development',
    num: '03',
    label: 'Development',
    short: 'Development',
    lede: 'Sound technical choices, from prototype to deployment.',
    body: [
      'We build and guide software across domains: system architecture, data pipelines, machine-learning approaches, interoperability and secure deployment, for health and non-health products alike.',
      'Every technical decision traces back to evidence gathered earlier in the pipeline. We can review an existing codebase or plan, advise on build-versus-buy decisions, or partner with your team on delivery.',
    ],
    covers: ['Architecture & technical review', 'Data & ML approaches', 'Interoperability & standards', 'Security & deployment'],
  },
  {
    id: 'advisory',
    num: '04',
    label: 'Consultancy / Advisory',
    short: 'Consultancy',
    lede: 'Independent advice, with a digital health focus but not a digital health limit.',
    body: [
      'We offer strategic consultancy and advisory support to organisations building software in any domain: feasibility and roadmap reviews, regulatory and assurance pathways, and funding or partnership strategy. Digital health is where we have the deepest expertise, but it is not the only work we take on.',
      'Engagements range from a single expert review to ongoing advisory roles. They are always independent and evidence-based, and we stay fully engaged across the research, design and development pipeline.',
    ],
    covers: ['Strategy & feasibility', 'Regulatory & assurance pathways', 'Funding & bid support', 'Expert & board advisory'],
  },
]
