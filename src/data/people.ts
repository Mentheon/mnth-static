export interface PersonTheme {
  title: string
  description: string
}

export interface Person {
  id: string
  name: string
  credentials: string
  /** Job title — shown as the role tag on the page and in the window. */
  role: string
  tagline: string
  href: string
  /** Headshot under public/ (e.g. 'people/rhys.jpeg'). Missing → the
      generic PersonIcon silhouette is shown instead. */
  photo?: string
  /** LinkedIn profile URL — shown as a link in the person window. */
  linkedin?: string
  /** Email address — shown as a link in the person window. */
  email?: string
  themes: PersonTheme[]
}

/* Site-wide contact address: footer / menu "contact" links, project
   contact cards and beta seat requests all point here. */
export const CONTACT_EMAIL = 'nicholas@mentheon.com'

export const PEOPLE: Person[] = [
  {
    id: 'nicholas',
    name: 'Nicholas Quentin Smith',
    credentials: 'PhD (Candidate), MSc, BSc · Newcastle',
    role: 'Founder & Director of Research',
    tagline: '(PhD (Candidate), MSc, BSc · Newcastle) · Founder & Director of Research',
    href: '#/people/nicholas',
    linkedin: 'https://www.linkedin.com/in/nicholas-quentin-smith/',
    email: CONTACT_EMAIL,
    photo: 'people/nicholas.jpeg',
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
    credentials: 'BDS · Liverpool',
    role: 'Chief Visionary Officer',
    tagline: '(BDS · Liverpool) · Chief Visionary Officer',
    href: '#/people/toby',
    linkedin: 'https://www.linkedin.com/in/toby-laycock/',
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
    credentials: 'MSc, BSc · Durham',
    role: 'Chief Financial Officer',
    tagline: '(MSc, BSc · Durham) · Chief Financial Officer',
    href: '#/people/rhys',
    linkedin: 'https://www.linkedin.com/in/rhys-hook-3874a9193/',
    photo: 'people/rhys.jpeg',
    themes: [
      {
        title: 'Finance & funding',
        description:
          "Oversees Mentheon's finances, budgeting and funding strategy, so every work strand is costed and sustainable.",
      },
      {
        title: 'Market research',
        description:
          'Researches the markets, users and competitive landscape around each project, so what we build answers a real need.',
      },
      {
        title: 'Feasibility across the pipeline',
        description:
          'Runs commercial, financial and operational feasibility studies at each stage of the pipeline, informing what moves forward.',
      },
    ],
  },
]
