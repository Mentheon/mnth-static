export interface PersonTheme {
  title: string
  description: string
}

export interface Person {
  id: string
  name: string
  credentials: string
  tagline: string
  href: string
  themes: PersonTheme[]
}

export const PEOPLE: Person[] = [
  {
    id: 'nicholas',
    name: 'Nicholas Quentin Smith',
    credentials: 'MSc, BSc',
    tagline: '(MSc, BSc) · Founder & Director of Research',
    href: '#/people/nicholas',
    themes: [
      {
        title: 'Research leadership',
        description:
          "Directs the organisation's R&D programme and sets the scientific agenda across all work strands.",
      },
      {
        title: 'Digital health methods',
        description:
          'Designs rigorous, mixed-methods studies to evaluate software-driven interventions in real-world care settings.',
      },
      {
        title: 'Partnerships',
        description:
          'Builds collaborations with clinical, academic and industry partners to accelerate translation into practice.',
      },
    ],
  },
  {
    id: 'toby',
    name: 'Dr Toby Edward Laycock',
    credentials: 'BDS',
    tagline: '(BDS) · Chief Visionary Officer',
    href: '#/people/toby',
    themes: [
      {
        title: 'Clinical practice',
        description:
          'Grounds every product decision in hands-on clinical experience and patient-facing workflows.',
      },
      {
        title: 'Regulatory insight',
        description:
          'Translates Software-as-a-Medical-Device requirements into design constraints the team can build against.',
      },
      {
        title: 'Human factors',
        description:
          'Leads usability research with practitioners to make sure our tools fit into busy care environments.',
      },
    ],
  },
  {
    id: 'rhys',
    name: 'Rhys Jason Hook',
    credentials: 'MSc, BSc',
    tagline: '(MSc, BSc) · Head of Development',
    href: '#/people/rhys',
    themes: [
      {
        title: 'Market analysis & product strategy',
        description:
          'Analyzes market trends and customer needs to inform product development and go-to-market strategies.',
      },
      {
        title: 'Data & signal work',
        description:
          'Researches the market landscape for data-driven digital health products, identifying opportunities for innovation and differentiation.',
      },
      {
        title: 'Operations & quality management',
        description:
          'Oversees operational processes and quality management systems to ensure compliance with industry standards and regulatory requirements.',
      },
    ],
  },
]
