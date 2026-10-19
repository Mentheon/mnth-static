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

/* ---------------------------------------------------------------------
   STRAND_PAGES — one full detail page per helix "rung".
   The Helix3D scene exposes six nodes (vr-rt, attraction, analytics,
   cognition, biomarkers, platform); each node's "See full work strand"
   CTA links to `#strand/<id>`. App.tsx resolves that id against this
   array so every rung opens its own StrandDetail. Kept SEPARATE from
   STRANDS above, which is the legacy 3-strand set still mapped over by
   RDStrands / MobileStrandList / the Marginalia StrandFilter — appending
   here would spawn extra bubbles/filter chips there.
   Every entry carries `progress`, which is what StrandDetail requires.
--------------------------------------------------------------------- */
export const STRAND_PAGES: Strand[] = [
  {
    id: 'vr-rt',
    label: 'Aevorix',
    tagline: 'Personalised virtual reminiscence for dementia care.',
    href: '#strand/vr-rt',
    themes: [
      { title: 'Reminiscence therapy & memory', description: 'Examination of how structured recall of autobiographical memory through immersive environments can attenuate neuropsychiatric symptoms in people living with dementia.' },
      { title: 'Physiological safety & arousal regulation', description: 'Real-time monitoring of heart rate, heart rate variability, and galvanic skin response to detect and prevent sensory overload during VR exposure.' },
      { title: 'Software as a Medical Device', description: 'Regulatory pathway, clinical evidence generation, and safety assurance for WebXR therapeutic applications within NHS and community-care deployment contexts.' },
    ],
    kicker: 'strand · 01 of 06 · in progress',
    meta: { since: 'mar 2024', collaborators: '05', phase: 'development' },
    abstract: 'Reminiscence therapy is a well-evidenced non-pharmacological intervention in dementia care, yet its reach is constrained by the availability of personalised, meaningful stimuli and the practical burden placed on care staff. Aevorix investigates the design, construction, and clinical evaluation of a WebXR platform that renders low-stimulation, autobiographically personalised virtual environments drawn from user-supplied photographic and audio assets. The system integrates continuous physiological monitoring — heart rate, heart rate variability, and galvanic skin response — to detect early indicators of sensory overload and adapt or suspend sessions accordingly. A staged clinical evaluation protocol, aligned with Software as a Medical Device guidance under the UK Medical Device Regulations, is being developed in partnership with memory-care clinicians and an NHS trust. The work aims to produce both a deployable therapeutic artefact and a transferable methodological framework for physiologically-adaptive immersive health interventions.',
    objectives: [
      { verb: 'Characterise', text: 'the sensory and cognitive load profiles that distinguish therapeutically beneficial VR reminiscence sessions from those precipitating distress in people living with mild-to-moderate dementia.' },
      { verb: 'Design', text: 'a low-stimulation WebXR environment construction pipeline that ingests user-supplied photographic, audio, and geospatial assets to generate personalised virtual scenes.' },
      { verb: 'Build', text: 'a cross-platform therapeutic application incorporating real-time HR, HRV, and GSR acquisition with an adaptive session-management layer that responds to physiological threshold violations.' },
      { verb: 'Instrument', text: 'a mixed-methods evaluation protocol — combining neuropsychiatric symptom scales, affect observation, and physiological telemetry — suitable for regulatory-grade evidence generation under UKCA SaMD guidance.' },
      { verb: 'Evaluate', text: 'the safety, acceptability, and preliminary efficacy of the platform through a feasibility study conducted within an NHS memory-care setting, benchmarking against standard reminiscence practice.' },
      { verb: 'Disseminate', text: 'findings through peer-reviewed publication, open-source release of the core rendering pipeline, and a replication package to support independent clinical adoption and further research.' },
    ],
    researchQuestions: [
      'What environmental and interaction parameters — visual complexity, scene familiarity, session duration — are predictive of physiological overload in VR reminiscence therapy for people living with dementia?',
      'To what extent does autobiographical personalisation of virtual environments, compared with generic historical scenes, improve affective outcomes and engagement as measured by validated neuropsychiatric scales?',
      'Can a real-time multimodal physiological monitoring layer (HR/HRV/GSR) reliably detect the onset of distress with sufficient lead time to permit safe automated session adaptation in a clinical setting?',
      'What regulatory and organisational barriers must be addressed for a WebXR reminiscence intervention to achieve feasible deployment as a Software as a Medical Device within NHS community-care pathways?',
    ],
    ctas: [
      { label: 'Read the paper', href: '#', variant: 'primary', arrow: true },
      { label: 'Open prototype build', href: '#', variant: 'secondary' },
      { label: 'View source artefact', href: '#', variant: 'secondary' },
    ],
    progress: {
      phases: [
        { id: 'nascent', label: 'Nascent', status: 'past', date: "mar '24" },
        { id: 'research', label: 'Research', status: 'past', date: "jun '24" },
        { id: 'design', label: 'Design', status: 'past', date: "nov '24" },
        { id: 'development', label: 'Development', status: 'current', date: "current · apr '26" },
        { id: 'evaluation', label: 'Evaluation', status: 'projected', date: 'projected' },
      ],
      outputs: [
        { id: 'paper', type: 'paper', title: 'Designing for Recall: Low-Stimulation WebXR Environments as a Non-Pharmacological Intervention in Dementia Care', metaLabel: "PAPER · CHI '25 LBW", tooltipMeta: "CHI '25 · Late-breaking work", tooltipDesc: 'A late-breaking work submission presenting the theoretical framing, environment design rationale, and preliminary user-enactment findings from the Aevorix design phase.', attachedAfterPhase: 'research', behaviour: 'output' },
        { id: 'prototype', type: 'prototype', title: 'Aevorix WebXR Prototype — Physiological Monitoring Integration (v0.3)', metaLabel: "PROTOTYPE · v0.3 · dec '25", tooltipMeta: 'v0.3 · dec 2025 · terminal', tooltipDesc: 'Terminal prototype demonstrating personalised asset ingestion, low-stimulation scene rendering, and a functional HR/HRV/GSR acquisition layer via BLE-connected wearables. Used as the basis for the feasibility study protocol.', attachedAfterPhase: 'design', behaviour: 'terminus' },
        { id: 'artefact', type: 'artefact', title: 'Aevorix Clinical Platform — SaMD-Aligned Build (v1 alpha)', metaLabel: 'ARTEFACT · v1 alpha · in development', tooltipMeta: 'v1 alpha · apr 2026 · in development', tooltipDesc: 'The primary therapeutic artefact: a UKCA SaMD-aligned WebXR application with adaptive session management, clinician dashboard, and exportable physiological telemetry. Currently in pre-feasibility refinement ahead of NHS site deployment.', attachedAfterPhase: 'development', behaviour: 'output' },
      ],
    },
  },
  {
    id: 'attraction',
    label: 'Kindreon',
    tagline: 'How attraction is perceived, formed, and reshaped.',
    href: '#strand/attraction',
    kicker: 'strand · 02 of 06 · in research',
    themes: [
      { title: 'Perceptual Psychology of Attractiveness', description: 'Examining how individuals form, weight, and revise attractiveness judgements — including the cognitive heuristics, affective priming, and contextual anchors that shape perception beyond physical morphology alone.' },
      { title: 'Social & Interpersonal Dynamics', description: 'Investigating how power asymmetry, social identity, group membership, and relational context modulate attractiveness perception — with particular attention to equality-relevant distortions and cross-cultural variance.' },
      { title: 'Clinical & Applied Aesthetics', description: 'Exploring translational implications for maxillofacial surgery planning, dermatological intervention, and digital-health tooling — where attractiveness judgements carry direct consequences for patient outcomes and informed consent.' },
    ],
    abstract: 'Attractiveness is among the most consequential yet least systematically understood dimensions of social perception. Kindreon investigates how subjective attractiveness is appraised, negotiated, and revised across people, relationships, and contexts — moving deliberately beyond the narrow framing imposed by dating-application datasets or single-domain aesthetic norms. Drawing on perceptual psychology, social cognition, and mixed-methods empirical design, the strand seeks to build a multi-contextual account of attractiveness that is ecologically valid, ethically grounded, and clinically actionable. Outputs span theoretical modelling, instrument development, and translational artefacts for use in health and design practice.',
    objectives: [
      { verb: 'Characterise', text: 'the cognitive and affective mechanisms by which attractiveness judgements are formed, weighted, and updated across varied interpersonal and social contexts.' },
      { verb: 'Identify', text: 'systematic variance in attractiveness perception attributable to power asymmetry, relational familiarity, cultural framing, and domain of encounter.' },
      { verb: 'Design', text: 'a validated, multi-contextual psychometric instrument capable of capturing the multidimensional structure of subjective attractiveness at individual and group levels.' },
      { verb: 'Build', text: 'a computational model of attractiveness perception dynamics, integrating stimulus-level, perceiver-level, and contextual covariates within a unified representational framework.' },
      { verb: 'Evaluate', text: 'the clinical utility of attractiveness-perception models in maxillofacial and aesthetic-surgery planning, assessing alignment between patient expectation and surgical outcome.' },
      { verb: 'Disseminate', text: 'findings and open instruments through peer-reviewed publication, practitioner guidance, and open-access tooling to support responsible application across health and design domains.' },
    ],
    researchQuestions: [
      'To what extent is subjective attractiveness a stable perceptual trait of the perceiver versus a dynamically constructed response to context, relationship, and social cue?',
      'How do power asymmetry, group identity, and relational familiarity modulate attractiveness judgements — and do these moderators operate through distinct or overlapping cognitive mechanisms?',
      'Can a domain-general psychometric instrument be constructed that captures the multidimensional, context-sensitive structure of attractiveness perception with adequate validity and cross-cultural reliability?',
      'In what ways do attractiveness-perception biases influence clinical decision-making and patient-reported outcomes in maxillofacial surgery and aesthetic medicine — and can computational modelling reduce that influence?',
    ],
    ctas: [
      { label: 'Read the paper', href: '#', variant: 'primary', arrow: true },
      { label: 'Explore the instrument', href: '#', variant: 'secondary' },
      { label: 'View research overview', href: '#', variant: 'secondary' },
    ],
    progress: {
      phases: [
        { id: 'nascent', label: 'Nascent', status: 'past', date: "sep '24" },
        { id: 'research', label: 'Research', status: 'current', date: "current · feb '25" },
        { id: 'design', label: 'Design', status: 'projected', date: 'projected' },
        { id: 'development', label: 'Development', status: 'projected', date: 'projected' },
        { id: 'evaluation', label: 'Evaluation', status: 'projected', date: 'projected' },
      ],
      outputs: [
        { id: 'attraction-lbw-chi25', type: 'paper', title: 'Towards a Multi-Contextual Account of Subjective Attractiveness', metaLabel: "PAPER · CHI '25 LBW", tooltipMeta: "Late-Breaking Work · CHI '25", tooltipDesc: 'A position paper scoping the limitations of single-domain attractiveness research and proposing a multi-contextual perceptual framework as the basis for future empirical work.', attachedAfterPhase: 'research', behaviour: 'output' },
        { id: 'attraction-instrument-prototype', type: 'prototype', title: 'Kindreon Perception Instrument — Alpha', metaLabel: 'PROTOTYPE · ALPHA BUILD', tooltipMeta: 'Internal Prototype · Late 2025', tooltipDesc: 'An interactive alpha of the multi-contextual psychometric instrument, enabling structured elicitation of attractiveness judgements across varied social and clinical scenarios for pilot validation.', attachedAfterPhase: 'design', behaviour: 'terminus' },
        { id: 'attraction-clinical-artefact', type: 'artefact', title: 'Clinical Decision-Support Reference: Attractiveness Perception in Aesthetic Surgery', metaLabel: 'ARTEFACT · CLINICAL GUIDANCE', tooltipMeta: 'Translational Artefact · 2026', tooltipDesc: 'A practitioner-facing reference document synthesising validated findings on attractiveness-perception bias for use in maxillofacial and aesthetic-surgery consultation and outcome evaluation.', attachedAfterPhase: 'evaluation', behaviour: 'output' },
      ],
    },
  },
  {
    id: 'analytics',
    label: 'Acumentra',
    tagline: 'Meaningful patterns from continuous physiological data.',
    href: '#strand/analytics',
    kicker: 'strand · 03 of 06 · in progress',
    abstract: 'Acumentra investigates multimodal physiological signal analysis — integrating ECG, accelerometry, and sleep architecture data — to characterise real-world health states at population scale. Where self-report measures are susceptible to recall bias and social desirability effects, continuous free-living instrumentation yields objective, temporally dense behavioural and physiological signatures. The strand develops signal-processing and machine-learning pipelines capable of translating raw sensor streams into clinically meaningful risk strata, enabling outcome measurement for digital health interventions that is both scalable and ecologically valid.',
    themes: [
      { title: 'Multimodal Signal Intelligence', description: 'Fusing ECG morphology, accelerometry-derived activity patterns, and polysomnographic proxies into unified representations of physiological state, surfacing structure that no single modality affords alone.' },
      { title: 'Free-Living Measurement', description: 'Moving outcome assessment from controlled clinic visits to the granular, unobserved rhythms of daily life — capturing what people actually do rather than what they recall or report.' },
      { title: 'Predictive Risk Stratification', description: 'Applying supervised and self-supervised learning to longitudinal sensor records to derive early-warning indicators and personalised risk trajectories that can inform timely clinical decision-making.' },
    ],
    objectives: [
      { verb: 'Characterise', text: 'the distributional properties and inter-individual variability of ECG, motion, and sleep signals collected under free-living conditions across a representative cohort.' },
      { verb: 'Design', text: 'a modular, schema-versioned data pipeline architecture capable of ingesting heterogeneous wearable streams, enforcing quality thresholds, and producing analysis-ready feature sets at scale.' },
      { verb: 'Build', text: 'a multimodal fusion model that learns joint latent representations from temporally aligned physiological channels and generalises across device generations and demographic strata.' },
      { verb: 'Instrument', text: 'a longitudinal free-living study protocol equipping participants with medical-grade and consumer wearables, capturing ground-truth clinical labels concurrent with continuous sensor recording.' },
      { verb: 'Evaluate', text: 'the predictive validity, calibration, and fairness of derived risk scores against adjudicated clinical outcomes, with pre-registered analysis plans and held-out test partitions.' },
      { verb: 'Disseminate', text: 'open-access model weights, anonymised benchmark datasets, and reproducible processing code to accelerate community replication and downstream adaptation in resource-constrained settings.' },
    ],
    researchQuestions: [
      'To what extent do multimodal free-living physiological signals — ECG, accelerometry, and sleep — provide incrementally valid predictors of adverse health outcomes beyond self-reported measures and single-modality baselines?',
      'Which signal-processing and representation-learning architectures best preserve clinically discriminative structure when applied to noisy, intermittently missing, real-world wearable data?',
      'How do model performance and risk-score calibration vary across demographic subgroups, and what pipeline or training interventions most effectively mitigate systematic disparities?',
      'Under what deployment conditions — sensor type, wear-compliance threshold, labelling cadence — does continuous physiological instrumentation remain cost-effective as an outcome-measurement strategy for digital health trials?',
    ],
    ctas: [
      { label: 'Read the technical overview', href: '#', variant: 'primary', arrow: true },
      { label: 'Explore the data pipeline', href: '#', variant: 'secondary' },
      { label: 'View related outputs', href: '#', variant: 'secondary' },
    ],
    progress: {
      phases: [
        { id: 'nascent', label: 'Nascent', status: 'past', date: "sep '23" },
        { id: 'research', label: 'Research', status: 'past', date: "feb '24" },
        { id: 'design', label: 'Design', status: 'past', date: "sep '24" },
        { id: 'development', label: 'Development', status: 'current', date: "current · mar '25" },
        { id: 'evaluation', label: 'Evaluation', status: 'projected', date: 'projected' },
      ],
      outputs: [
        { id: 'analytics-scoping-review', type: 'paper', title: 'Wearable Multimodal Sensing in Free-Living Cohorts: A Scoping Review', metaLabel: 'PAPER · SCOPING REVIEW', tooltipMeta: "Submitted · jan '25", tooltipDesc: 'A systematic scoping review mapping signal modalities, processing pipelines, and outcome validity evidence across 94 free-living wearable studies published 2018–2024.', attachedAfterPhase: 'research', behaviour: 'output' },
        { id: 'analytics-pipeline-prototype', type: 'prototype', title: 'Acumentra Signal Pipeline v0.4', metaLabel: 'PROTOTYPE · OPEN SOURCE', tooltipMeta: "Released · oct '25", tooltipDesc: 'A modular Python pipeline for ingesting, quality-gating, and featurising multimodal wearable streams; includes reference implementations for ECG R-peak detection, sleep staging, and activity segmentation.', attachedAfterPhase: 'development', behaviour: 'output' },
        { id: 'analytics-risk-model-artefact', type: 'artefact', title: 'Multimodal Risk Stratification Model & Benchmark', metaLabel: 'ARTEFACT · MODEL RELEASE', tooltipMeta: "Projected · dec '26", tooltipDesc: 'Open weights, anonymised benchmark partition, and a model card for the multimodal risk-stratification model evaluated against adjudicated clinical outcomes in the free-living instrumentation study.', attachedAfterPhase: 'evaluation', behaviour: 'terminus' },
      ],
    },
    meta: { since: "sep '23", collaborators: '07', phase: 'development' },
  },
  {
    id: 'cognition',
    label: 'Acumentra',
    tagline: 'Cognitive trajectories, modelled longitudinally.',
    href: '#strand/cognition',
    kicker: 'strand · 04 of 06 · in research',
    abstract: 'Acumentra investigates the longitudinal modelling of cognitive decline, moving beyond cross-sectional snapshots toward trajectory-based representations of ageing cognition. By capturing individual variability across time, the strand aims to develop statistical and machine-learning models that identify divergent decline trajectories, surface early indicators of pathological change, and ultimately support clinicians in making more timely, personalised decisions. The work foregrounds heterogeneity as a feature rather than noise — recognising that no two ageing minds follow the same path.',
    themes: [
      { title: 'Trajectory Modelling', description: 'Longitudinal statistical and machine-learning approaches to characterising how cognitive performance evolves over time, capturing non-linear dynamics and individual-level variation across multi-wave cohort data.' },
      { title: 'Heterogeneity in Ageing', description: 'Principled treatment of inter-individual variability in cognitive ageing, including latent subgroup identification and the development of models that resist spurious averaging across meaningfully distinct decline profiles.' },
      { title: 'Clinical Decision Support', description: 'Translation of trajectory-based insights into interpretable decision-support artefacts that assist clinicians in detecting early decline, stratifying risk, and communicating prognosis in ways that are actionable at the point of care.' },
    ],
    objectives: [
      { verb: 'Characterise', text: 'the landscape of longitudinal cognitive-decline trajectories across demographically diverse ageing cohorts using mixed-effects and latent-class growth models.' },
      { verb: 'Develop', text: 'machine-learning pipelines capable of inferring personalised trajectory forecasts from sparse, irregularly sampled clinical assessment data.' },
      { verb: 'Quantify', text: 'the contribution of cognitive reserve, lifestyle, and comorbidity covariates to trajectory divergence at the individual and subgroup levels.' },
      { verb: 'Evaluate', text: 'the sensitivity and specificity of trajectory-derived early-warning signals against established clinical diagnostic criteria for mild cognitive impairment.' },
      { verb: 'Construct', text: 'interpretable visualisation and reporting artefacts that communicate trajectory uncertainty to clinicians without sacrificing statistical rigour.' },
      { verb: 'Validate', text: 'model generalisability across independent longitudinal cohorts spanning distinct geographic, cultural, and healthcare-system contexts.' },
    ],
    researchQuestions: [
      'To what extent do latent subgroups of cognitive-decline trajectory exist within population-level ageing cohorts, and what demographic or biological variables reliably discriminate between them?',
      'How accurately can trajectory models trained on multi-wave cognitive assessments forecast individual-level decline over a five-year horizon when observations are sparse or missing at random?',
      'Which combination of cognitive-domain assessments, biomarkers, and contextual covariates yields the most stable early-warning signal for pathological decline distinct from normative ageing?',
      'In what ways do clinician interpretations and clinical decisions change when trajectory-based uncertainty visualisations are integrated into existing review workflows, compared with point-in-time score summaries?',
    ],
    ctas: [
      { label: 'Read the research brief', href: '#', variant: 'primary', arrow: true },
      { label: 'View the data protocol', href: '#', variant: 'secondary' },
      { label: 'Contact the lead researcher', href: '#', variant: 'secondary' },
    ],
    progress: {
      phases: [
        { id: 'nascent', label: 'Nascent', status: 'past', date: "sep '24" },
        { id: 'research', label: 'Research', status: 'current', date: "current · feb '25" },
        { id: 'design', label: 'Design', status: 'projected', date: 'projected' },
        { id: 'development', label: 'Development', status: 'projected', date: 'projected' },
        { id: 'evaluation', label: 'Evaluation', status: 'projected', date: 'projected' },
      ],
      outputs: [
        { id: 'cognition-scoping-review', type: 'paper', title: 'Scoping Review: Longitudinal Cognitive Trajectory Models', metaLabel: "PAPER · dec '24", tooltipMeta: "Published dec '24", tooltipDesc: 'A systematic scoping review mapping existing longitudinal modelling approaches to cognitive decline, identifying methodological gaps and heterogeneity-handling strategies across 120 included studies.', attachedAfterPhase: 'nascent', behaviour: 'output' },
        { id: 'cognition-trajectory-framework', type: 'artefact', title: 'Trajectory Modelling Framework v0.1', metaLabel: "ARTEFACT · mar '25", tooltipMeta: "Released mar '25", tooltipDesc: 'An internal modelling framework specifying the statistical architecture, covariate schema, and evaluation criteria to be applied across cohort datasets in subsequent research phases.', attachedAfterPhase: 'research', behaviour: 'output' },
        { id: 'cognition-chi25-position', type: 'paper', title: "Position Paper: Heterogeneity-Aware Cognitive Decision Support (CHI '25 Workshop)", metaLabel: "PAPER · CHI '25", tooltipMeta: "CHI '25 Workshop", tooltipDesc: "A position paper submitted to the CHI '25 Aging and Cognition workshop arguing for heterogeneity-first design principles in clinical decision-support tools for cognitive decline.", attachedAfterPhase: 'research', behaviour: 'terminus' },
      ],
    },
    meta: { since: 'sep 2024', collaborators: '06', phase: 'research' },
  },
  {
    id: 'biomarkers',
    label: 'Aevorix',
    tagline: 'Everyday behaviour as a continuous early-warning signal.',
    href: '#strand/biomarkers',
    kicker: 'strand · 05 of 06 · in design',
    abstract: 'Subtle, passively-collected interaction signatures — gait rhythm, keystroke cadence, and voice prosody — carry latent information about an individual\'s cognitive and physical state. Aevorix investigates whether these behavioural biomarkers can serve as reliable, non-invasive indicators of meaningful change over time, without disrupting daily life or requiring clinical instrumentation. By combining on-device inference with longitudinal validation against established clinical ground truth, the strand aims to establish the sensitivity, specificity, and ethical boundaries of continuous behavioural sensing in ageing populations.',
    themes: [
      { title: 'Passive Continuous Sensing', description: 'Capturing interaction signatures unobtrusively through ambient devices and everyday touchpoints, removing the burden of active self-reporting and reducing measurement artefact introduced by conscious monitoring.' },
      { title: 'Privacy-Preserving On-Device Inference', description: 'Processing raw behavioural streams locally to prevent personally identifiable data from leaving the individual\'s device, satisfying both regulatory requirements and the ethical expectations of an ageing user cohort.' },
      { title: 'Clinical Validation and Ground Truth', description: 'Anchoring derived biomarker signals to established neuropsychological and physiological assessments, ensuring that detected changes correspond to clinically meaningful transitions rather than algorithmic artefact.' },
    ],
    objectives: [
      { verb: 'Identify', text: 'a minimal, device-agnostic feature set that reliably encodes longitudinal change across gait, keystroke, and voice modalities.' },
      { verb: 'Design', text: 'a privacy-preserving on-device inference pipeline suitable for deployment on consumer-grade smartphones and wearables.' },
      { verb: 'Establish', text: 'concurrent validity between continuous behavioural biomarker indices and validated neuropsychological assessment instruments.' },
      { verb: 'Characterise', text: 'intra-individual variability profiles to distinguish authentic signal drift from transient fluctuation attributable to context or affect.' },
      { verb: 'Evaluate', text: 'the acceptability and perceived intrusiveness of passive sensing systems within community-dwelling adults aged 60 and over.' },
      { verb: 'Synthesise', text: 'evidence-based design guidelines for longitudinal behavioural biomarker studies conducted outside controlled laboratory settings.' },
    ],
    researchQuestions: [
      'To what extent do passively recorded gait, keystroke, and voice features predict clinician-rated cognitive status more reliably than cross-sectional snapshot assessments?',
      'Which on-device model architectures maintain acceptable classification performance under the computational and energy constraints of consumer wearable hardware?',
      'How do contextual covariates — including fatigue, emotional state, and environmental noise — confound behavioural biomarker signals, and how can their influence be statistically isolated?',
      'What disclosure and consent models are perceived as appropriate by older adults when continuous passive sensing is deployed in private domestic environments?',
    ],
    ctas: [
      { label: 'Read the design brief', href: '#', variant: 'primary', arrow: true },
      { label: 'View related outputs', href: '#', variant: 'secondary' },
      { label: 'Contact the team', href: '#', variant: 'secondary' },
    ],
    progress: {
      phases: [
        { id: 'nascent', label: 'Nascent', status: 'past', date: "sep '23" },
        { id: 'research', label: 'Research', status: 'past', date: "apr '24" },
        { id: 'design', label: 'Design', status: 'current', date: "current · feb '26" },
        { id: 'development', label: 'Development', status: 'projected', date: 'projected' },
        { id: 'evaluation', label: 'Evaluation', status: 'projected', date: 'projected' },
      ],
      outputs: [
        { id: 'biomarkers-scoping-review', type: 'paper', title: 'Behavioural Biomarkers in Ageing: A Scoping Review', metaLabel: "PAPER · apr '24", tooltipMeta: "Published apr '24", tooltipDesc: 'Systematic scoping review mapping the evidence base for passively sensed behavioural biomarkers as indicators of cognitive and physical change in older adults.', attachedAfterPhase: 'research', behaviour: 'output' },
        { id: 'biomarkers-feature-framework', type: 'artefact', title: 'Multimodal Feature Extraction Framework', metaLabel: "ARTEFACT · mar '26", tooltipMeta: "Released mar '26", tooltipDesc: 'Open specification defining canonical feature representations for gait, keystroke cadence, and voice prosody signals, intended to promote cross-study comparability.', attachedAfterPhase: 'design', behaviour: 'output' },
        { id: 'biomarkers-validation-protocol', type: 'prototype', title: 'Clinical Validation Study Protocol', metaLabel: "PROTOTYPE · jun '27", tooltipMeta: "Projected jun '27", tooltipDesc: 'Pre-registered longitudinal validation protocol pairing continuous passive sensing with quarterly neuropsychological assessment across a community cohort of 120 participants.', attachedAfterPhase: 'evaluation', behaviour: 'terminus' },
      ],
    },
    meta: { since: "sep '23", collaborators: '06', phase: 'design' },
  },
  {
    id: 'platform',
    label: 'Mentheon',
    tagline: 'The shared backbone every strand draws on.',
    href: '#strand/platform',
    kicker: 'strand · 06 of 06 · in progress',
    abstract: 'Mentheon is the common research infrastructure underpinning all six strands — spanning participant recruitment pipelines, device instrumentation, data ingestion and curation, information-security governance, and Software-as-a-Medical-Device-compliant deployment. Rather than treating infrastructure as a per-project concern, the platform consolidates shared capability into a single auditable backbone, reducing duplication, enforcing consistent data standards, and enabling reproducible cross-strand analyses. Continuous operation is treated as a research output in its own right, with platform reliability, latency, and compliance posture tracked alongside scientific deliverables.',
    themes: [
      { title: 'Instrumentation & Data Pipelines', description: 'Standardised device integration, sensor abstraction layers, and automated ingestion pipelines that transform raw participant data into analysis-ready artefacts with full provenance metadata preserved at every stage.' },
      { title: 'SaMD Governance & Compliance', description: 'Architecture and operational controls aligned with IEC 62304, UKCA/CE marking obligations, and NHS DSPT requirements — ensuring that every strand deploying algorithmic outputs to clinical settings operates within a pre-validated, auditable framework.' },
      { title: 'Reproducibility & Internal Tooling', description: 'Containerised execution environments, immutable artefact registries, and developer tooling that guarantee computational reproducibility across strand teams and cohort iterations, independent of individual researcher environments.' },
    ],
    objectives: [
      { verb: 'Architect', text: 'a modular, strand-agnostic platform layer that decouples shared infrastructure concerns from individual study logic, enabling independent deployment cycles for each strand.' },
      { verb: 'Standardise', text: 'data schemas, provenance conventions, and API contracts across all active strands so that cross-cohort analyses require no bespoke transformation effort.' },
      { verb: 'Instrument', text: 'participant-facing device integrations with fault-tolerant ingestion pipelines that maintain data completeness under intermittent connectivity and heterogeneous device firmware versions.' },
      { verb: 'Secure', text: 'the platform against applicable threat models by implementing role-based access control, end-to-end encryption at rest and in transit, and a continuous vulnerability management programme aligned with ISO 27001 controls.' },
      { verb: 'Operate', text: 'a SaMD-compliant continuous deployment pipeline with automated regression testing, post-market surveillance hooks, and incident-response runbooks reviewed quarterly against evolving MHRA guidance.' },
      { verb: 'Document', text: 'technical design decisions, compliance rationales, and operational procedures in a living design-history file that serves as the primary evidence base for regulatory submissions across all strands.' },
    ],
    researchQuestions: [
      'How should a shared research infrastructure be decomposed into independently deployable services such that each strand can adopt platform capabilities incrementally without introducing cross-strand coupling or compliance drift?',
      'What data-schema governance model best balances the standardisation necessary for cross-strand reproducibility against the flexibility required to accommodate rapidly evolving sensor modalities and study protocols?',
      'To what extent can a single SaMD-compliant deployment pipeline serve the diverse risk classifications of multiple concurrent strands, and what architectural accommodations are required where regulatory profiles diverge?',
      'How can continuous operational telemetry — covering pipeline latency, data-completeness rates, and security-posture metrics — be surfaced as first-class research outputs that inform platform evolution alongside scientific findings?',
    ],
    ctas: [
      { label: 'Platform documentation', href: '#', variant: 'primary', arrow: true },
      { label: 'Infrastructure overview', href: '#', variant: 'secondary' },
      { label: 'Compliance posture', href: '#', variant: 'secondary' },
    ],
    progress: {
      phases: [
        { id: 'nascent', label: 'Nascent', status: 'past', date: "sep '23" },
        { id: 'research', label: 'Research', status: 'past', date: "mar '24" },
        { id: 'design', label: 'Design', status: 'past', date: "oct '24" },
        { id: 'development', label: 'Development', status: 'current', date: "current · apr '25" },
        { id: 'evaluation', label: 'Evaluation', status: 'projected', date: 'projected' },
      ],
      outputs: [
        { id: 'platform-architecture-spec', type: 'artefact', title: 'Platform Architecture Specification', metaLabel: "ARTEFACT · oct '24", tooltipMeta: "Ratified oct '24", tooltipDesc: 'Formal specification of the modular platform architecture including service boundaries, API contracts, and compliance control mappings — the authoritative design reference for all strand integrations.', attachedAfterPhase: 'design', behaviour: 'output' },
        { id: 'ingestion-pipeline-prototype', type: 'prototype', title: 'Multi-Device Ingestion Pipeline', metaLabel: "PROTOTYPE · jan '26", tooltipMeta: "Deployed jan '26", tooltipDesc: 'Fault-tolerant ingestion pipeline supporting seven device modalities across three active strands, with automated provenance tagging, schema validation, and dead-letter queue recovery.', attachedAfterPhase: 'development', behaviour: 'output' },
        { id: 'samd-compliance-framework', type: 'artefact', title: 'SaMD Compliance Framework', metaLabel: 'ARTEFACT · REGULATORY', tooltipMeta: "Target dec '26", tooltipDesc: 'Consolidated design-history file, risk-management documentation, and post-market surveillance plan constituting the primary regulatory submission package for platform-dependent strand outputs.', attachedAfterPhase: 'evaluation', behaviour: 'terminus' },
      ],
    },
    meta: { since: "sep '23", collaborators: '09', phase: 'development' },
  },
]
