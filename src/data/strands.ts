export interface ResearchTheme {
  title: string
  description: string
}

export interface Strand {
  id: string
  label: string
  tagline: string
  href: string
  themes: ResearchTheme[]
}

export const STRANDS: Strand[] = [
  {
    id: 'kindred',
    label: 'Kindreon',
    tagline: 'Understanding subjective attraction in caregiving contexts',
    href: '#/strands/kindred',
    themes: [
      {
        title: 'Perception of attractiveness',
        description:
          'How caregivers, clinicians and partners perceive and interpret cues of human attraction in care settings.',
      },
      {
        title: 'Interpersonal dynamics',
        description:
          'Mapping the subjective experience of connection, empathy and rapport across care relationships.',
      },
      {
        title: 'Clinical implications',
        description:
          'Translating insights into guidance for practitioners supporting vulnerable individuals.',
      },
    ],
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
