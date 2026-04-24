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
