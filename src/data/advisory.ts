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

export const ADVISORY: AdvisoryService[] = [
  {
    id: 'research',
    num: '01',
    label: 'Research',
    short: 'Research',
    lede: 'Evidence that stands up to clinical scrutiny.',
    body: [
      'We advise on research strategy for digital-health and clinical-technology projects: framing the right questions, choosing study designs that fit the evidence you need, and planning analyses before data collection begins.',
      'Whether you are scoping a new idea or preparing for evaluation, we help you build a research programme that is rigorous, ethical and proportionate to the decision it supports.',
    ],
    covers: ['Study & protocol design', 'Literature & evidence reviews', 'Ethics & governance', 'Analysis planning'],
  },
  {
    id: 'design',
    num: '02',
    label: 'Design',
    short: 'Design',
    lede: 'Products shaped around patients and clinicians.',
    body: [
      'We help teams design clinically grounded products and services: understanding users and care pathways, mapping where a tool fits into real practice, and turning that insight into accessible, usable interfaces.',
      'Safety, usability and inclusion are considered from the first sketch, so designs are ready for clinical settings rather than retrofitted for them.',
    ],
    covers: ['User & clinician research', 'Pathway & service mapping', 'Interface design & prototyping', 'Usability & accessibility review'],
  },
  {
    id: 'development',
    num: '03',
    label: 'Development',
    short: 'Development',
    lede: 'Sound technical choices, from prototype to deployment.',
    body: [
      'We provide technical guidance across the build: system architecture, data pipelines, machine-learning approaches, interoperability and secure deployment.',
      'We can review an existing codebase or technical plan, advise on build-versus-buy decisions, or partner with your team on delivery of critical components.',
    ],
    covers: ['Architecture & technical review', 'Data & ML approaches', 'Interoperability & standards', 'Security & deployment'],
  },
  {
    id: 'advisory',
    num: '04',
    label: 'Consultancy / Advisory',
    short: 'Consultancy',
    lede: 'Independent advice at the meeting of health and technology.',
    body: [
      'We offer strategic consultancy and advisory support to organisations working in health and technology: feasibility and roadmap reviews, regulatory and assurance pathways, and funding or partnership strategy.',
      'Engagements range from a single expert review to ongoing advisory roles, always independent and grounded in research and clinical practice.',
    ],
    covers: ['Strategy & feasibility', 'Regulatory & assurance pathways', 'Funding & bid support', 'Expert & board advisory'],
  },
]
