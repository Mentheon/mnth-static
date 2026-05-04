export interface ResearchTheme {
  title: string
  description: string
}

export type PhaseId = 'nascent' | 'research' | 'design' | 'development' | 'evaluation'
export type PhaseStatus = 'past' | 'current' | 'projected'

export interface Phase {
  id: PhaseId
  label: string
  status: PhaseStatus
  date?: string
}

export type OutputType = 'paper' | 'prototype' | 'artefact'
export type OutputBehaviour = 'output' | 'terminus'

export interface ProgressOutput {
  id: string
  type: OutputType
  title: string
  metaLabel: string             // 'PAPER · CHI \'25 LBW' for the SVG label under node
  tooltipMeta: string           // 'CHI \'25 · Late-breaking work'
  tooltipDesc: string
  attachedAfterPhase: PhaseId
  behaviour: OutputBehaviour
}

export interface StrandProgress {
  phases: Phase[]
  outputs: ProgressOutput[]
}

export interface ObjectiveItem {
  verb: string
  text: string
}

export interface CTA {
  label: string
  href: string
  variant: 'primary' | 'secondary'
  arrow?: boolean
}

export interface StrandMeta {
  since?: string
  collaborators?: string
  phase?: string
}

export interface Strand {
  id: string
  label: string
  tagline: string
  href: string
  themes: ResearchTheme[]
  // new optional fields used by StrandDetail:
  abstract?: string
  objectives?: ObjectiveItem[]
  researchQuestions?: string[]
  ctas?: CTA[]
  progress?: StrandProgress
  kicker?: string                 // 'strand · 03 of 06 · in progress'
  meta?: StrandMeta
}

export const STRANDS: Strand[] = [
  {
    id: 'kindred',
    label: 'Kindreon',
    tagline: 'Understanding subjective attraction.',
    href: '#/strands/kindred',
    themes: [
      {
        title: 'Perception of attractiveness',
        description:
          'Research into the psychological and social factors that influence how individuals perceive attractiveness.',
      },
      {
        title: 'Interpersonal dynamics',
        description:
          'Equality, power and social context in shaping attraction and relationship formation.',
      },
      {
        title: 'Clinical implications',
        description:
          'Maxillofacial aesthetics, reconstructive surgery and their impact on patient satisfaction and self-esteem.',
      },
    ],
    kicker: 'strand · 03 of 06 · in progress',
    meta: {
      since: 'oct 2024',
      collaborators: '03',
      phase: 'development',
    },
    abstract:
      'Reminiscence therapy is widely used in dementia care, but is constrained by the availability of personalised material and the cognitive demands of conventional media. This strand investigates how WebXR environments — paired with a dynamic media-asset backend — can serve individualised reminiscence content through interactive props (television sets, picture frames, windows onto familiar scenes) within a low-arousal virtual room. The work aims to characterise the design space at the intersection of personalisation, sensory load, and clinical safety, and to produce a deployable software artefact suitable for evaluation as Software as a Medical Device.',
    objectives: [
      {
        verb: 'Characterise',
        text: 'Map the design space of personalised WebXR reminiscence at the intersection of recall support, sensory load, and clinical safety.',
      },
      {
        verb: 'Design',
        text: 'Develop a prop vocabulary — windows, frames, period-appropriate televisions — that scaffolds engagement without overwhelming users with mild-to-moderate dementia.',
      },
      {
        verb: 'Build',
        text: 'Engineer a lightweight backend capable of per-participant media curation that meets the deployment constraints of Software as a Medical Device.',
      },
      {
        verb: 'Instrument',
        text: 'Integrate physiological signals (HR, HRV, GSR) with in-session interaction telemetry to detect overload states in real time.',
      },
      {
        verb: 'Evaluate',
        text: 'Compare interactive prop-based reminiscence with passive video reminiscence on engagement and recall, in a deployable clinical setting.',
      },
      {
        verb: 'Disseminate',
        text: 'Publish findings through CHI and adjacent HCI venues, with accompanying artefact releases that researchers and clinicians can adopt and extend.',
      },
    ],
    researchQuestions: [
      'How can personalised reminiscence content be delivered through WebXR props in a way that supports recall without inducing sensory overload in people with mild-to-moderate dementia?',
      'What backend architecture supports per-participant media curation while remaining lightweight enough for clinical deployment under SaMD constraints?',
      'Which physiological signals (HR, HRV, GSR) can be combined with in-session interaction data to detect emotional or cognitive overload in real time?',
      'How does interactive prop design — windows, frames, period-appropriate televisions — compare to passive video reminiscence on engagement and recall?',
    ],
    ctas: [
      { label: 'Read the paper', href: '#', variant: 'primary', arrow: true },
      { label: 'Open prototype build', href: '#', variant: 'secondary' },
      { label: 'View source artefact', href: '#', variant: 'secondary' },
    ],
    progress: {
      phases: [
        { id: 'nascent',     label: 'Nascent',     status: 'past',      date: "oct '24" },
        { id: 'research',    label: 'Research',    status: 'past',      date: "jan '25" },
        { id: 'design',      label: 'Design',      status: 'past',      date: "jul '25" },
        { id: 'development', label: 'Development', status: 'current',   date: "current · feb '26" },
        { id: 'evaluation',  label: 'Evaluation',  status: 'projected', date: 'projected' },
      ],
      outputs: [
        {
          id: 'paper',
          type: 'paper',
          title: 'Designing for restraint',
          metaLabel: "PAPER · CHI '25 LBW",
          tooltipMeta: "CHI '25 · Late-breaking work",
          tooltipDesc:
            'Co-authored. Returns to the main spine — the strand continued from this output.',
          attachedAfterPhase: 'research',
          behaviour: 'output',
        },
        {
          id: 'prototype',
          type: 'prototype',
          title: 'A-Frame prop sandbox',
          metaLabel: "PROTOTYPE · v0.2 · sept '25",
          tooltipMeta: 'v0.2 · sept 2025 · terminal',
          tooltipDesc: 'Branched off and was superseded by the v4 clinical build.',
          attachedAfterPhase: 'design',
          behaviour: 'terminus',
        },
        {
          id: 'artefact',
          type: 'artefact',
          title: 'VR-RT clinical build',
          metaLabel: 'ARTEFACT · v4 · in development',
          tooltipMeta: 'v4 · feb 2026 · in development',
          tooltipDesc: 'Targeting deployable evaluation under SaMD constraints.',
          attachedAfterPhase: 'development',
          behaviour: 'output',
        },
      ],
    },
  },
  {
    id: 'vitalis',
    label: 'Aevorix',
    tagline: 'Technology for enduring vitality',
    href: '#/strands/vitalis',
    themes: [
      {
        title: 'Longevity modelling',
        description:
          'Quantitative frameworks for healthspan, frailty trajectories and preventative intervention points.',
      },
      {
        title: 'Assistive innovation',
        description: 'Devices and software enabling independence and dignity in later life.',
      },
      {
        title: 'Cognitive preservation',
        description:
          'Research into sustained cognitive function through digital and behavioural tools.',
      },
    ],
  },
  {
    id: 'vitrix',
    label: 'Acumentra',
    tagline: 'Clarity from complex clinical data',
    href: '#/strands/vitrix',
    themes: [
      {
        title: 'Signal intelligence',
        description:
          'Extracting meaningful patterns from continuous physiological and behavioural data streams.',
      },
      {
        title: 'Predictive analytics',
        description: 'Risk stratification and outcome forecasting for clinical decision support.',
      },
      {
        title: 'Outcome measurement',
        description:
          'Quantifying real-world impact of digital health interventions at scale.',
      },
    ],
  },
]
