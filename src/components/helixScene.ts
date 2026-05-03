// @ts-nocheck
/* ================================================================
   HELIX (Rod of Asclepius) — research domains weaving a central staff
   ================================================================

   WHAT THIS DRAWS
   ---------------
   A "Rod of Asclepius" diagram: four research domains (Research,
   Design, Development, Regulatory) drawn as coloured strands that
   spiral around a central vertical (or horizontal) staff. On top of
   the strands sit two more layers of meaning:

     - PROJECTS — the headline content. A "bead" if a project lives
       on a single domain; a "capsule" (gradient line spanning two or
       more strand points at the same height) for multi-domain ones.

   Click any strand or project → a panel opens below the helix with
   theme cards describing that thing.

   ARCHITECTURE
   ------------
   This file owns ALL the DOM/SVG manipulation. It exports a single
   `mountHelix(refs)` function that takes refs to pre-existing DOM
   nodes (created by the React shell in Helix.tsx) and returns a
   teardown function the React shell calls on unmount.

   The React component is a thin shell — it just creates the
   skeleton HTML and hands the refs over. Everything below this
   line is plain DOM imperative code.

   ANIME.JS v4 — A 60-SECOND PRIMER
   --------------------------------
   We use four named exports from anime.js v4. If you've seen anime.js
   v3 before, v4 dropped the `anime({ targets: ... })` form for
   smaller, named functions:

     animate(target, props)
       Like jQuery's .animate(). `target` is a DOM/SVG node or array
       of them. `props` is an object whose keys are CSS properties or
       SVG attributes (camelCase: 'strokeWidth' = stroke-width). Values:
         - a single number   → animate from current to that
         - [from, to]        → explicit start and end
         - [from, mid, to]   → 3-point keyframe
       Plus reserved keys: `duration` (ms), `ease` (name string OR
       an ease function), `delay` (ms or stagger fn), `loop: true` for
       infinite alternation, `onComplete: fn` for a callback.
       Returns an instance with .play() / .pause() / .restart().

     createTimeline({ defaults, onComplete })
       A sequencer. Call .add(target, props, position) for each step.
       `position` is either an absolute time ('500' = at 500ms) or a
       relative offset ('-=300' = start 300ms BEFORE the previous step
       ends; '+=200' = start 200ms after). This is how the entrance
       animation overlaps strand-draws with label fades for cohesion.

     stagger(amount, opts?)
       Returns a delay-generator. When you pass it as a `delay` value
       to animate() with N targets, target i gets delay = i * amount
       (in ms). `{ start: 0 }` skips an initial offset.

     createSpring({ stiffness, damping })
       Returns an ease FUNCTION (not a name) modelling a real spring.
       Pass it as `ease: spring`. Used here for hover bounciness.

     utils.set(target, props)
       Instantly set properties WITHOUT animating. Used at the start
       of the entrance to pre-stage every element to opacity 0 and
       prep stroke-dasharray on each strand segment for the draw-in.

   ANIMATION COORDINATION RULES
   ----------------------------
   Several behaviours run concurrently. They follow these rules so
   they don't fight each other:

     1. Entrance       — owns the first ~3s; idle drift/ambient
                          breath/project breath are all suppressed
                          until the timeline's onComplete fires.
     2. Selection      — pauses idle drift AND ambient breath; resumes
                          both on deselect.
     3. Hover on stage — pauses idle drift only (ambient breath keeps
                          going so the helix feels alive).
     4. Project breath — pulses ONLY the currently-selected bead's
                          radius; cleared the moment selection changes.
     5. Hover springs  — bouncy size-pop on project beads using
                          createSpring. Suppressed if the same bead is
                          already running its selection breath, so we
                          don't get conflicting `r` animations on the
                          same circle.
     6. Idle drift     — 60fps recompute that very slowly rotates each
                          strand's phase (one revolution ≈ 120s) and
                          subtly breathes the amplitude. Re-samples
                          every strand and re-positions every project
                          that depends on those strand points.

   WHY @ts-nocheck
   ---------------
   This is a near-verbatim port of well-tested DOM/SVG-imperative
   prototype code (mnth/newexp.html VIEW 3). The strict TS compiler
   would demand types for hundreds of `any`-shaped intermediate
   structs (svgEl attribute bags, scene record, project records with
   conditional fields) for no behavioural gain. Disabling type-check
   for this one file keeps the port faithful.
   ================================================================ */

import { animate, createTimeline, stagger, createSpring, utils } from 'animejs'

interface HelixRefs {
  stageEl: HTMLElement
  legendEl: HTMLElement
  panelEl: HTMLElement
  tooltipEl: HTMLElement
  panelIconEl: HTMLElement
  panelNameEl: HTMLElement
  panelTaglineEl: HTMLElement
  panelThemesEl: HTMLElement
  panelCtaRow: HTMLElement
  panelCta: HTMLAnchorElement
  panelCloseBtn: HTMLElement
  orientationButtons: HTMLButtonElement[]
}

export function mountHelix(refs: HelixRefs): () => void {
  /* ============================================================
     CONTENT DATA — three parallel lists describing what's drawn.

     DOMAINS      The 4 research domains. Each becomes a coloured
                  spiral strand. `themes` populate the panel when
                  the strand is selected.
     PROJECTS     Concrete projects placed at a `position` along the
                  spiral (0 = top, 1 = bottom in vertical mode).
                  `domainIds.length === 1` → renders as a bead on
                  that single strand. Two or more → renders as a
                  capsule (gradient line) bridging those strands at
                  the same height.

     `position` is a parameter t ∈ [0, 1] along the strand.
     ============================================================ */
  const DOMAINS = [
    { id: 'research', name: 'Research', shortName: 'Research',
      tagline: 'Study design, longitudinal cohorts, real-world evidence',
      color: '#A30B37',
      themes: [
        { n:'01', t:'Longitudinal cohort design', d:'Study architectures for following people over months and years — attrition, re-consent, and continuity of measurement.' },
        { n:'02', t:'Mixed-methods evaluation',   d:'Quantitative and qualitative inquiry combined to evaluate digital interventions in real-world care.' },
        { n:'03', t:'Real-world evidence',        d:'Frameworks for drawing reliable inferences from messy, opportunistic data outside controlled trials.' },
      ] },
    { id: 'design', name: 'Design', shortName: 'Design',
      tagline: 'Human factors and interaction patterns for clinical environments',
      color: '#9C528B',
      themes: [
        { n:'01', t:'Human factors',          d:'Usability research with clinicians and patients to make sure tools fit into busy care environments.' },
        { n:'02', t:'Interaction patterns',   d:'Reusable interaction patterns built around safety, recoverability, and clarity under cognitive load.' },
        { n:'03', t:'Service design',         d:'Designing for the unit of care — patient, family, clinician, system — not just the screen.' },
      ] },
    { id: 'development', name: 'Development', shortName: 'Development',
      tagline: 'Engineering, signal processing, and the platform underneath',
      color: '#3F0247',
      themes: [
        { n:'01', t:'Software engineering',  d:'Engineering standards, architecture and quality processes that underpin SaMD products.' },
        { n:'02', t:'Signal processing',     d:'Pipelines that turn continuous physiological and behavioural data into clinical signal.' },
        { n:'03', t:'Platform & ops',        d:'Robust, secure, auditable infrastructure — the foundation SaMD can be trusted on.' },
      ] },
    { id: 'regulatory', name: 'Regulatory', shortName: 'Regulatory',
      tagline: 'SaMD compliance, safety frameworks, and deployment ethics',
      color: '#6B1F4D',
      themes: [
        { n:'01', t:'SaMD pathway',          d:'Translating Software-as-a-Medical-Device requirements into design constraints the team can build against.' },
        { n:'02', t:'Safeguarding',          d:'Safety-first interaction patterns for vulnerable users — children, those in crisis, people in care.' },
        { n:'03', t:'Deployment ethics',     d:'When is a tool ready, and for whom? Standards for the leap from research artefact to clinical instrument.' },
      ] },
  ]

  const PROJECTS = [
    { id: 'kindreon',  name: 'Kindreon',
      tagline: 'Family-centred digital tools for paediatric care',
      summary: 'Family-centred digital tools for paediatric care, with safeguarding-by-design as a foundational constraint rather than an afterthought.',
      domainIds: ['research', 'design', 'development'], position: 0.2, status: 'active',
      themes: [
        { n:'01', t:'Family-centred care',     d:'Tools built for the unit of paediatric care \u2014 child, parent, clinician \u2014 not a single screen-based user.' },
        { n:'02', t:'Safeguarding by design',  d:'Vulnerability-aware interaction patterns, with safety treated as a foundational constraint rather than a feature added late.' },
        { n:'03', t:'Longitudinal continuity', d:'Tracking development through paediatric care with study architectures designed for re-consent, attrition, and continuity of measurement.' },
      ] },
    { id: 'aevorix',   name: 'Aevorix',
      tagline: 'Technology for enduring vitality',
      summary: 'Technology for enduring vitality \u2014 longitudinal modelling of healthspan and frailty, with cognitive preservation as the central question.',
      domainIds: ['research', 'design', 'development', 'regulatory'], position: 0.55, status: 'active',
      themes: [
        { n:'01', t:'Healthspan modelling',    d:'Quantitative frameworks for healthspan, frailty trajectories, and the points at which preventative intervention is most effective.' },
        { n:'02', t:'Cognitive preservation',  d:'Identifying and protecting the cognitive signal earliest \u2014 long before clinical thresholds are crossed.' },
        { n:'03', t:'Assistive innovation',    d:'Devices and software for independence and dignity in later life, regulated as SaMD where the clinical claim warrants it.' },
        { n:'04', t:'Deployment ethics',       d:'When is a longevity tool ready, and for whom? Standards for the leap from research artefact to clinical instrument.' },
      ] },
    { id: 'acumentra', name: 'Acumentra',
      tagline: 'Sharper signals from clinical noise',
      summary: 'Sharper signals from clinical noise. Decision-support models built with subgroup auditing as a first-class concern, not a compliance step.',
      domainIds: ['development'], position: 0.95, status: 'active',
      themes: [
        { n:'01', t:'Signal intelligence',  d:'Pipelines that turn continuous physiological and behavioural data into clinical signal a clinician can act on.' },
        { n:'02', t:'Predictive analytics', d:'Risk stratification and outcome forecasting for clinical decision support, validated on cohort data.' },
        { n:'03', t:'Subgroup auditing',    d:'A model that works on average can fail systematically for the people it was meant to help. Auditing is treated as a question, not a checkbox.' },
      ] },
  ]

  const domainById = (id) => DOMAINS.find(d => d.id === id)
  const projectById = (id) => PROJECTS.find(p => p.id === id)

  /* ============================================================
     GEOMETRY PRIMITIVES — the math for placing things on the spiral.

     The helix is parametrised in t ∈ [0, 1]. For each strand, a
     `cfg` holds:
        phase        Starting angular offset (radians). The 4 strands
                     are spaced evenly: 0, π/2, π, 3π/2 — so they
                     wrap around the staff like braid threads.
        amplitude    How far the strand swings sideways from the
                     central staff (px).
        length       Total length along the staff axis (px).
        axisOffset   Centreline of the staff in the SVG (px).
        turns        How many full revolutions the strand makes from
                     t=0 to t=1.
        basePhase    Immutable initial phase — used by idle drift to
                     compute the breathing offset deterministically.
        baseAmplitude Immutable initial amplitude — used by idle
                     drift breathing AND by label-column placement so
                     labels don't drift sideways with the strands.

     SEGMENTS_PER_STRAND          Sampling resolution when discretising
                                   the strand into a polyline. Higher =
                                   smoother curve, more SVG path data.
     LABEL_GUTTER                  Clearance between the spiral's reach
                                   and the outboard label column.
     ============================================================ */
  const SEGMENTS_PER_STRAND = 40
  // Pre-allocated slot pool per strand-side. The number of front/back
  // segments returned by sampleStrand() varies as the phase drifts (each
  // depth crossing splits or merges a segment). If we don't have enough
  // SVG path elements to hold every segment the sampler returns, the
  // overflow is silently dropped — that's exactly the "gaps appearing"
  // glitch. 12 covers any realistic configuration of 1.8 turns + drift.
  const SEGMENT_SLOTS_PER_SIDE = 12
  // Project beads (single-domain) and project labels (all kinds) sit in two
  // columns OUTSIDE the strand cluster, at the same row as the project's
  // strand intersection. LABEL_GUTTER is the clearance between the spiral's
  // outermost reach (axisOffset ± baseAmplitude) and that outboard column.
  const LABEL_GUTTER = 36

  /**
   * Sample a single point on a strand at parameter t.
   *
   *   angle  = phase + t * turns * 2π                       (how far around)
   *   across = sin(angle) * amplitude                       (sideways from staff)
   *   along  = t * length                                   (distance along staff)
   *   depth  = cos(angle)                                   (3D z-coordinate, ∈ [-1, 1])
   *
   * `depth` lets us decide whether a sample sits in FRONT of the staff
   * (depth ≥ 0) or BEHIND it (depth < 0). Behind segments are drawn
   * thinner and more transparent so the spiral reads as 3D even though
   * it's just a 2D SVG.
   */
  function strandPointAt(orientation, cfg, t) {
    const angle = cfg.phase + t * cfg.turns * Math.PI * 2
    const across = Math.sin(angle) * cfg.amplitude
    const along = t * cfg.length
    const depth = Math.cos(angle)
    let x, y
    if (orientation === 'vertical') { x = cfg.axisOffset + across; y = along }
    else                            { x = along; y = cfg.axisOffset + across }
    return { x, y, depth, t }
  }

  /** Convert a list of {x,y} points into an SVG path 'M..L..L..' string. */
  function pointsToPath(pts) {
    if (!pts.length) return ''
    return pts.map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ')
  }

  /**
   * Discretise one strand into a series of front-side and back-side
   * polyline segments, plus a single full-strand path used as a click
   * hitbox.
   *
   * As we walk samples along the strand, the depth (cos of angle) flips
   * sign whenever the strand crosses the staff in 3D. Each crossing
   * splits the strand into a new segment in the OTHER list (front ↔
   * back). At the crossing we linearly blend prev→curr to land exactly
   * on depth = 0 for the boundary point — this stops front/back segments
   * from appearing to disconnect at the seam.
   *
   * Returns:
   *   frontPaths  Array of path-d strings to render on top of the staff
   *   backPaths   Array of path-d strings to render behind the staff
   *   fullPath    A single contiguous path-d string (used for hitbox)
   */
  function sampleStrand(orientation, cfg) {
    const front = [], back = []
    let currentList = null, currentSide = null
    const totalSamples = SEGMENTS_PER_STRAND * 4
    const samples = []
    for (let i = 0; i <= totalSamples; i++) samples.push(strandPointAt(orientation, cfg, i / totalSamples))
    for (let i = 0; i < samples.length; i++) {
      const p = samples[i]
      const side = p.depth >= 0 ? 'front' : 'back'
      if (side !== currentSide) {
        // Side just flipped — start a new segment list on this side.
        currentList = []
        ;(side === 'front' ? front : back).push(currentList)
        if (i > 0) {
          // Linearly interpolate prev→curr to find the exact x,y where
          // depth crosses zero. Push it into BOTH the new segment AND the
          // tail of the previous segment so the curves visually meet.
          const prev = samples[i - 1]
          const denom = prev.depth - p.depth
          const tBlend = denom !== 0 ? prev.depth / denom : 0
          const blendX = prev.x + (p.x - prev.x) * tBlend
          const blendY = prev.y + (p.y - prev.y) * tBlend
          currentList.push({ x: blendX, y: blendY })
          const otherList = side === 'front' ? back : front
          const lastSeg = otherList[otherList.length - 1]
          if (lastSeg) lastSeg.push({ x: blendX, y: blendY })
        }
        currentSide = side
      }
      currentList.push({ x: p.x, y: p.y })
    }
    return {
      frontPaths: front.map(pointsToPath).filter(Boolean),
      backPaths:  back.map(pointsToPath).filter(Boolean),
      fullPath: pointsToPath(samples),
    }
  }

  /* ============================================================
     SCENE STATE — module-scope variables that survive across builds.

     `scene`  is the bag returned by buildScene(): every DOM ref the
     interaction handlers + animation loops need to reach. It's
     replaced wholesale on every orientation flip.

     `state` is the user-selection state: at most ONE of selectedDomain
     /selectedProject is non-null at a time. applyAppearance() reads
     it to decide what to dim/highlight.

     `currentOrientation` is the current layout mode ('vertical' or
     'horizontal'). Toolbar buttons in the React shell flip it.
     ============================================================ */
  const {
    stageEl, legendEl, panelEl, tooltipEl,
    panelIconEl, panelNameEl, panelTaglineEl, panelThemesEl,
    panelCtaRow, panelCta, panelCloseBtn, orientationButtons,
  } = refs

  let currentOrientation = 'vertical'
  let scene = null
  let state = { selectedDomain: null, selectedProject: null }

  /**
   * Where to anchor the small "Research / Design / Development /
   * Regulatory" label for each strand. In vertical mode, labels sit
   * along the top edge spread evenly across the width; in horizontal
   * mode, they sit along the left edge spread evenly down the height.
   * `i` is the label's position (sorted left-to-right or top-to-bottom),
   * `n` is the total number of strands.
   */
  function getStrandLabelAnchor(orientation, viewBox, i, n) {
    if (orientation === 'vertical') {
      const padding = 80
      const usable = viewBox.W - padding * 2
      return { x: padding + (usable * (i + 0.5) / n), y: 32 }
    } else {
      const padding = 60
      const usable = viewBox.H - padding * 2
      return { x: 30, y: padding + (usable * (i + 0.5) / n) }
    }
  }

  /**
   * Tiny helper to create an SVG element with attributes. SVG elements
   * MUST be created with createElementNS (not createElement) or the
   * browser treats them as unknown HTML and they don't render.
   */
  function svgEl(name, attrs?) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', name)
    if (attrs) for (const k in attrs) el.setAttribute(k, attrs[k])
    return el
  }

  /* ============================================================
     buildScene(orientation)
     ============================================================
     Wipes the stage, creates a fresh SVG root, and populates it with
     every visual layer (staff, strands, projects, labels) for
     the given orientation. Returns a "scene" record holding refs to
     all the things downstream code needs to update or query.

     This function is called:
       - once at initial mount
       - again every time the user flips Vertical ↔ Horizontal
     so it has to be self-contained — no leftovers from a prior build.
     ============================================================ */
  function buildScene(orientation) {
    // Wipe any leftover SVG from a previous build before we draw.
    stageEl.querySelectorAll('svg').forEach(s => s.remove())

    /* -------- Layout constants for THIS orientation -------- */
    const W = orientation === 'vertical' ? 820 : 1280  // SVG viewBox width
    const H = orientation === 'vertical' ? 880 : 540   // SVG viewBox height
    const labelGap   = orientation === 'vertical' ? 110 : 80   // Reserved for strand labels at the leading edge
    const tailMargin = 80                                       // Reserved at the trailing edge so strands don't touch it
    // Length of the staff axis (the "along" dimension).
    const lengthAxis = orientation === 'vertical' ? H - labelGap - tailMargin : W - labelGap - tailMargin
    // Centreline of the staff in the OFF-axis dimension.
    const axisOffset = orientation === 'vertical' ? W / 2 : H / 2
    const startOffset = labelGap     // How far down/right the helix proper begins
    const amplitude = orientation === 'vertical' ? 130 : 100   // Max sideways swing
    const turns = 1.8                // Spiral makes 1.8 full revolutions over its length

    // Top-level <svg>. preserveAspectRatio + max-width CSS makes it
    // scale responsively while keeping aspect.
    const root = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'helix-svg', preserveAspectRatio: 'xMidYMid meet' })
    stageEl.appendChild(root)

    /* -------- Layer groups (z-order top-to-bottom) -------- */
    /* The order we APPEND determines paint order: later = on top. So:
         strandBack (bottom) → staff → strandFront → projects → labels
         → hitboxes (invisible, picks up clicks).
       Projects sit above strand-front so beads never get hidden by a
       strand crossing over them. */
    function group(cls) {
      return svgEl('g', { class: 'layer-' + cls })
    }
    const layerStrandBack  = group('strand-back')
    const layerStaff       = group('staff')
    const layerStrandFront = group('strand-front')
    const layerProjects    = group('projects')
    const layerLabels      = group('labels')
    const layerHitboxes    = group('hitboxes')
    ;[layerStrandBack, layerStaff, layerStrandFront, layerProjects, layerLabels, layerHitboxes].forEach(g => root.appendChild(g))

    // Shift everything except the strand labels by `startOffset` along
    // the staff axis. That leaves the labelGap zone free at the top
    // (or left) for "Research / Design / ..." labels with their leaders.
    const transformAttr = orientation === 'vertical' ? 'translate(0,' + startOffset + ')' : 'translate(' + startOffset + ',0)'
    ;[layerStrandBack, layerStaff, layerStrandFront, layerProjects, layerHitboxes].forEach(g => g.setAttribute('transform', transformAttr))

    /* -------- Per-strand configs --------
       Each strand starts at a different phase so they brace the staff
       evenly. Idle drift mutates `phase` and `amplitude` over time;
       `basePhase`/`baseAmplitude` keep the originals for stable label
       columns and amplitude breathing math. */
    const strandConfigs = {}
    DOMAINS.forEach((d, i) => {
      const phase = (i / DOMAINS.length) * Math.PI * 2
      strandConfigs[d.id] = {
        phase,
        basePhase: phase,
        amplitude,
        baseAmplitude: amplitude,
        length: lengthAxis, axisOffset, turns,
      }
    })

    /* -------- The central staff -------- */
    // A faint vertical (or horizontal) line down the middle. Just a
    // single SVG <line>; styled in CSS as a thin, low-opacity ink stroke.
    const staff = svgEl('line', { class: 'staff' })
    if (orientation === 'vertical') {
      staff.setAttribute('x1', axisOffset); staff.setAttribute('y1', 0)
      staff.setAttribute('x2', axisOffset); staff.setAttribute('y2', lengthAxis)
    } else {
      staff.setAttribute('x1', 0); staff.setAttribute('y1', axisOffset)
      staff.setAttribute('x2', lengthAxis); staff.setAttribute('y2', axisOffset)
    }
    layerStaff.appendChild(staff)

    /* -------- Rod-of-Asclepius icon at the top of the staff --------
       /public/rod-only.svg is the brand mark (dark plum block + white
       snake/rod glyph). We embed it as an SVG <image> centred on the
       staff axis at the leading edge of the strand area. Front strands
       (depth ≥ 0) render in front of the rod, back strands behind it,
       so the spiral visually appears to wrap around the icon. */
    const ROD_SIZE = 100
    const rodIcon = svgEl('image', {
      href: import.meta.env.BASE_URL + 'rod-only.svg',
      width: ROD_SIZE,
      height: ROD_SIZE,
      x: orientation === 'vertical' ? axisOffset - ROD_SIZE / 2 : -ROD_SIZE / 2,
      y: orientation === 'vertical' ? -ROD_SIZE / 2 : axisOffset - ROD_SIZE / 2,
      preserveAspectRatio: 'xMidYMid meet',
      class: 'rod-icon',
    })
    layerStaff.appendChild(rodIcon)

    /* -------- Strands ----------------------------------------------
       For each domain, we ask sampleStrand() for three things:
         - frontPaths: the visible-from-front segments (drawn ON TOP
           of the staff)
         - backPaths:  the segments behind the staff (drawn UNDER it,
           with thinner / lower-opacity styling so they recede)
         - fullPath:   one continuous path for the invisible hitbox
           (using a 22px transparent stroke so clicks are easy)
       We keep refs to every path element (backEls, frontEls, hitbox)
       so applyAppearance() can push opacity + strokeWidth changes
       directly on selection / hover, and so idle drift can cheaply
       overwrite their `d` attribute every tick. */
    const strandObjects = {}
    DOMAINS.forEach((d) => {
      const cfg = strandConfigs[d.id]
      const { frontPaths, backPaths, fullPath } = sampleStrand(orientation, cfg)
      // Allocate a FIXED pool of SEGMENT_SLOTS_PER_SIDE path elements per
      // strand-side, even if the initial sample only fills a few. Empty
      // slots get d="" (renders nothing). Idle drift can then write into
      // any slot freely — no overflow drops, no DOM thrash from creating
      // / removing nodes mid-flight.
      const backEls = []
      for (let i = 0; i < SEGMENT_SLOTS_PER_SIDE; i++) {
        const el = svgEl('path', { d: backPaths[i] || '', class: 'strand-segment is-back', stroke: d.color })
        el.dataset.domainId = d.id
        layerStrandBack.appendChild(el)
        backEls.push(el)
      }
      const frontEls = []
      for (let i = 0; i < SEGMENT_SLOTS_PER_SIDE; i++) {
        const el = svgEl('path', { d: frontPaths[i] || '', class: 'strand-segment', stroke: d.color })
        el.dataset.domainId = d.id
        layerStrandFront.appendChild(el)
        frontEls.push(el)
      }
      const hit = svgEl('path', { d: fullPath, class: 'strand-hitbox' })
      hit.dataset.domainId = d.id
      layerHitboxes.appendChild(hit)
      strandObjects[d.id] = { backEls, frontEls, hitbox: hit }
    })

    /* -------- Strand labels with leaders -----------------------------
       Each strand gets a "Research", "Design", etc. label anchored in
       the leading-edge label gap, with a thin ink leader bending out
       to where the strand actually emerges from. Sorting by the
       starting point's x (or y in horizontal mode) keeps the labels
       in the same left-to-right order as the strands themselves —
       otherwise the leaders criss-cross. */
    const startSamples = DOMAINS.map(d => ({ d, pt: strandPointAt(orientation, strandConfigs[d.id], 0) }))
    startSamples.sort((a, b) => orientation === 'vertical' ? a.pt.x - b.pt.x : a.pt.y - b.pt.y)

    const strandLabels = {}
    startSamples.forEach((entry, idx) => {
      const d = entry.d, start = entry.pt
      const anchor = getStrandLabelAnchor(orientation, { W, H }, idx, startSamples.length)
      const g = svgEl('g', { class: 'strand-label-group' })
      g.dataset.domainId = d.id
      const startX = orientation === 'vertical' ? start.x : start.x + startOffset
      const startY = orientation === 'vertical' ? start.y + startOffset : start.y
      const leader = svgEl('path', { class: 'strand-leader' })
      let dPath
      if (orientation === 'vertical') {
        const midY = startOffset - 18
        dPath = 'M' + anchor.x + ',' + (anchor.y + 6) + ' L' + anchor.x + ',' + midY + ' L' + startX + ',' + midY + ' L' + startX + ',' + (startY - 4)
      } else {
        const midX = startOffset - 18
        dPath = 'M' + (anchor.x + 4) + ',' + anchor.y + ' L' + midX + ',' + anchor.y + ' L' + midX + ',' + startY + ' L' + (startX - 4) + ',' + startY
      }
      leader.setAttribute('d', dPath)
      g.appendChild(leader)
      const text = svgEl('text', { class: 'strand-label' })
      if (orientation === 'vertical') {
        text.setAttribute('x', anchor.x); text.setAttribute('y', anchor.y); text.setAttribute('text-anchor', 'middle')
      } else {
        text.setAttribute('x', anchor.x); text.setAttribute('y', anchor.y + 4); text.setAttribute('text-anchor', 'start')
      }
      text.textContent = d.shortName
      g.appendChild(text)
      layerLabels.appendChild(g)
      strandLabels[d.id] = g
    })

    /* -------- Projects -----------------------------------------------
       Two flavours, dispatched by the inner `if`:

         Single domain   → A bead in the OUTBOARD column at the strand
                            row, with a thin coloured leader back to
                            the actual strand point. Bead colour = the
                            domain colour.
         Multi-domain    → A capsule (gradient line) connecting the
                            strand points at the same height, with caps
                            at each strand. Label sits in the OUTBOARD
                            column with its own ink leader from the
                            capsule midpoint.
    */
    const projectEls = []

    PROJECTS.forEach(proj => {
      if (proj.domainIds.length === 1) {
        // Single-domain bead — bead and label both sit OUTSIDE the spiral
        // in the outboard column, at the same row as the strand intersection.
        // A thin horizontal leader connects the strand point to the bead.
        const cfg = strandConfigs[proj.domainIds[0]]
        const pt = strandPointAt(orientation, cfg, proj.position)
        const domain = domainById(proj.domainIds[0])
        const dxFromStaff = orientation === 'vertical' ? pt.x - axisOffset : pt.y - axisOffset
        const sideSign = dxFromStaff >= 0 ? 1 : -1
        const side = sideSign >= 0 ? 'right' : 'left'
        const outboard = axisOffset + sideSign * (amplitude + LABEL_GUTTER)
        const px = orientation === 'vertical' ? outboard : pt.x
        const py = orientation === 'vertical' ? pt.y : outboard

        const g = svgEl('g', { class: 'project-bead' })
        g.dataset.projectId = proj.id

        const leader = svgEl('line', {
          x1: pt.x, y1: pt.y, x2: px, y2: py,
          class: 'project-leader',
          stroke: domain.color,
        })
        g.appendChild(leader)

        const circle = svgEl('circle', {
          cx: px, cy: py, r: 13,
          class: 'project-bead-shape status-' + (proj.status || 'active'),
          fill: proj.status === 'exploratory' ? '#FFECE1' : domain.color,
          stroke: '#2F0147',
        })
        g.appendChild(circle)

        const label = svgEl('text', { class: 'project-label' })
        label.dataset.projectId = proj.id
        if (orientation === 'vertical') {
          label.setAttribute('x', side === 'right' ? px + 22 : px - 22)
          label.setAttribute('y', py + 0)
          label.setAttribute('text-anchor', side === 'right' ? 'start' : 'end')
        } else {
          label.setAttribute('x', px)
          label.setAttribute('y', side === 'right' ? py + 28 : py - 20)
          label.setAttribute('text-anchor', 'middle')
        }
        label.textContent = proj.name
        layerProjects.appendChild(g)
        layerLabels.appendChild(label)
        projectEls.push({ g, shape: circle, leader, label, project: proj, px, py, anchorPt: pt, sideSign })
      } else {
        // Multi-domain capsule (2 or more strands): a polyline through
        // the strand points at this height with a colour-stop linear
        // gradient running from the first domain's colour to the last.
        const pts = proj.domainIds.map(id => {
          const cfg = strandConfigs[id]
          const p = strandPointAt(orientation, cfg, proj.position)
          return { id, x: p.x, y: p.y, color: domainById(id).color }
        })
        // Sort so the polyline reads as one straight bridge, not a
        // zig-zag — left-to-right in vertical, top-to-bottom in horizontal.
        if (orientation === 'vertical') pts.sort((a, b) => a.x - b.x)
        else pts.sort((a, b) => a.y - b.y)

        const g = svgEl('g', { class: 'project-bridge' })
        g.dataset.projectId = proj.id

        // Build a per-orientation gradient in the SVG's <defs>. Note:
        // the gradient's coordinates are in USER SPACE (the SVG's own
        // coord system, NOT the parent group's). The strand layer is
        // translated by `startOffset` along the staff axis, but the
        // gradient lives at root-level outside that translation, so
        // we have to ADD startOffset back into the gradient endpoints
        // along whichever axis the helix is offset on.
        let defs = root.querySelector('defs')
        if (!defs) { defs = svgEl('defs'); root.insertBefore(defs, root.firstChild) }
        const gradId = 'bridge-grad-' + proj.id + '-' + orientation
        const grad = svgEl('linearGradient', {
          id: gradId,
          x1: pts[0].x + (orientation === 'horizontal' ? startOffset : 0),
          y1: pts[0].y + (orientation === 'vertical' ? startOffset : 0),
          x2: pts[pts.length-1].x + (orientation === 'horizontal' ? startOffset : 0),
          y2: pts[pts.length-1].y + (orientation === 'vertical' ? startOffset : 0),
          gradientUnits: 'userSpaceOnUse',
        })
        // Evenly-spaced colour stops (one per strand the project touches).
        pts.forEach((pt, i) => {
          const stop = svgEl('stop', {
            offset: (i / (pts.length - 1) * 100) + '%',
            'stop-color': pt.color,
          })
          grad.appendChild(stop)
        })
        defs.appendChild(grad)

        // The capsule line itself: M..L..L..L through every strand point.
        const dStr = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ')
        const line = svgEl('path', {
          d: dStr,
          class: 'project-bridge-line',
          stroke: 'url(#' + gradId + ')',
          fill: 'none',
        })
        if (proj.status === 'exploratory') line.setAttribute('opacity', '0.6')
        g.appendChild(line)

        // Cap circles at each strand crossing — coloured per-strand so
        // the capsule visually "lands" on each domain's strand.
        pts.forEach(pt => {
          const cap = svgEl('circle', {
            cx: pt.x, cy: pt.y, r: 9,
            class: 'project-bridge-cap',
            fill: pt.color,
            stroke: '#2F0147',
          })
          g.appendChild(cap)
        })

        // Multi-domain capsule label — capsule line stays on-strand, but the
        // label sits OUTSIDE the spiral in the outboard column at the capsule
        // row, with a horizontal leader from the capsule midpoint. Side is
        // geometric where the midpoint clearly leans one way; for capsules
        // whose midpoint sits on the staff (e.g. four symmetric strands), it
        // falls back to alternation by project order so labels don't stack.
        const midIdx = Math.floor(pts.length / 2)
        const mid = pts.length % 2 === 1
          ? pts[midIdx]
          : { x: (pts[midIdx-1].x + pts[midIdx].x) / 2, y: (pts[midIdx-1].y + pts[midIdx].y) / 2 }
        const dxFromStaff = orientation === 'vertical' ? mid.x - axisOffset : mid.y - axisOffset
        const projIdx = PROJECTS.findIndex(p => p.id === proj.id)
        const sideSign = Math.abs(dxFromStaff) > 16
          ? (dxFromStaff >= 0 ? 1 : -1)
          : (projIdx % 2 === 0 ? -1 : 1)
        const outboard = axisOffset + sideSign * (amplitude + LABEL_GUTTER)
        const labelX = orientation === 'vertical' ? outboard : mid.x
        const labelY = orientation === 'vertical' ? mid.y : outboard

        const labelLeader = svgEl('line', {
          x1: mid.x, y1: mid.y, x2: labelX, y2: labelY,
          class: 'project-leader',
          stroke: '#2F0147',
        })
        g.appendChild(labelLeader)

        const label = svgEl('text', { class: 'project-label' })
        label.dataset.projectId = proj.id
        if (orientation === 'vertical') {
          label.setAttribute('x', labelX + (sideSign > 0 ? 6 : -6))
          label.setAttribute('y', labelY + 0)
          label.setAttribute('text-anchor', sideSign > 0 ? 'start' : 'end')
        } else {
          label.setAttribute('x', labelX)
          label.setAttribute('y', labelY + (sideSign > 0 ? 16 : -8))
          label.setAttribute('text-anchor', 'middle')
        }
        label.textContent = proj.name
        layerProjects.appendChild(g)
        layerLabels.appendChild(label)
        projectEls.push({ g, line, labelLeader, label, project: proj, mx: mid.x, my: mid.y, sideSign })
      }
    })

    return { svgEl: root, strandObjects, strandLabels, projectEls, viewBox: { W, H }, startOffset, strandConfigs }
  }

  /* ============================================================
     SELECTION-STATE DERIVATIONS
     ============================================================
     These small helpers translate `state` (one of two IDs is set)
     into the question every renderer wants to ask:
        "Which domains should be highlighted right now?"
     A selected DOMAIN highlights itself.
     A selected PROJECT highlights all the domains it spans.
     Nothing selected → empty set (everything renders normally).
     ============================================================ */
  function highlightedDomainIds() {
    if (state.selectedDomain) return new Set([state.selectedDomain])
    if (state.selectedProject) {
      const p = projectById(state.selectedProject)
      return p ? new Set(p.domainIds) : new Set()
    }
    return new Set()
  }
  function isAnythingSelected() {
    return !!(state.selectedDomain || state.selectedProject)
  }
  /**
   * Push opacity/stroke-width directly onto a strand's path elements
   * so the dim/highlight states apply with no React re-render overhead.
   * `dim`        — fade everything else when something else is selected
   * `highlight`  — thicken + brighten the highlighted strand's segments
   *                (back segments slightly thinner than front ones to
   *                preserve the front/back depth feel).
   */
  function applyStrandStateClasses(strandObj, { dim, highlight }) {
    const apply = (el) => {
      el.classList.remove('is-dim', 'is-highlighted')
      if (dim)        { el.style.opacity = '0.18'; el.style.strokeWidth = '' }
      else if (highlight) {
        el.style.opacity = '1'
        el.style.strokeWidth = el.classList.contains('is-back') ? '5' : '5.5'
      } else { el.style.opacity = ''; el.style.strokeWidth = '' }
    }
    strandObj.frontEls.forEach(apply)
    strandObj.backEls.forEach(apply)
  }

  /* ============================================================
     applyAppearance() — the central renderer.
     ============================================================
     Called every time `state` changes. It:

       1. Walks every visual class of element (strands, projects)
          and toggles the dim/active CSS classes plus
          inline opacity/stroke-width to match the current selection.
       2. Re-renders the legend buttons (cheap — just a few buttons).
       3. Reconciles the project-breath animations: the SET of
          beads that should be pulsing equals "the selected project,
          if any". Anything currently breathing that shouldn't be →
          stop and restore radius to baseline. Anything that should
          be breathing but isn't yet → start it.
       4. Tells the idle-drift loop to pause/resume based on whether
          anything is selected, and pauses/resumes the ambient
          breath animation accordingly. (Hover-pause is handled
          separately on the stage's pointerenter/leave listeners.)
     ============================================================ */
  function applyAppearance() {
    const highlighted = highlightedDomainIds()
    const anySelected = isAnythingSelected()

    DOMAINS.forEach(d => {
      const so = scene.strandObjects[d.id]
      const lg = scene.strandLabels[d.id]
      const isH = anySelected && highlighted.has(d.id)
      const isD = anySelected && !highlighted.has(d.id)
      applyStrandStateClasses(so, { dim: isD, highlight: isH })
      lg.classList.toggle('is-dim', isD)
    })
    scene.projectEls.forEach(pe => {
      pe.g.classList.remove('is-active', 'is-dim')
      pe.label.classList.remove('is-dim')
      const proj = pe.project
      if (state.selectedProject === proj.id) pe.g.classList.add('is-active')
      if (anySelected && state.selectedProject !== proj.id) {
        const anyLit = proj.domainIds.some(id => highlighted.has(id))
        if (!anyLit) { pe.g.classList.add('is-dim'); pe.label.classList.add('is-dim') }
      }
    })
    renderLegend()

    // Project breathing: pulse the active project's bead.
    const shouldBreathe = new Set()
    if (state.selectedProject) shouldBreathe.add(state.selectedProject)
    Array.from(projectBreaths.keys()).forEach(id => {
      if (!shouldBreathe.has(id)) {
        stopProjectBreath(id)
        const pe = scene.projectEls.find(p => p.project.id === id)
        if (pe && pe.shape) animate(pe.shape, { r: 13, duration: 240, ease: 'outQuad' })
      }
    })
    shouldBreathe.forEach(id => {
      const pe = scene.projectEls.find(p => p.project.id === id)
      if (pe) startProjectBreath(pe)
    })

    // Idle drift coordination: pause when anything is selected.
    idleDriftPaused = anySelected
    if (anySelected) {
      if (ambientBreath) ambientBreath.pause()
    } else {
      if (ambientBreath && entranceFinishedAt > 0) ambientBreath.play()
    }
  }

  /* ============================================================
     PANEL OPEN / CLOSE — measured-height anime.js animation.
     ============================================================
     Why not pure CSS? CSS height transitions need a known target
     height, but the panel's content is dynamic (different strands
     have different numbers of theme cards). The classic hack
     `max-height: 1000px` would animate from/to that ceiling, not
     the actual content height — making the close animation lurch
     because it has to traverse "phantom" empty space first.

     The fix:
       1. Measure the real content height by removing the cap
          temporarily and reading scrollHeight.
       2. Reset max-height to 0, force a layout flush
          (`void panelEl.offsetHeight` reads layout to commit it).
       3. Hand anime.js the explicit [0, measuredHeight] range and
          let it animate honestly.
       4. On completion, drop max-height again (set to 'none') so
          the panel can grow naturally if content reflows later
          (e.g. on window resize, theme card hover).

     We keep `panelOpenAnim` as a module-scoped handle so that if
     the user clicks a different project mid-animation, we can
     pause the in-flight animation before starting the new one
     (otherwise both would fight over the same maxHeight property).
     ============================================================ */
  let panelOpenAnim = null
  function clearPanel() {
    if (!panelEl.classList.contains('open')) return
    panelEl.setAttribute('aria-hidden', 'true')
    if (panelOpenAnim) panelOpenAnim.pause()
    // Read CURRENT height (panel may not be fully open yet) so the
    // close animation starts from wherever we are now.
    const currentHeight = panelEl.scrollHeight
    panelOpenAnim = animate(panelEl, {
      maxHeight: [currentHeight, 0],
      opacity: [1, 0],
      duration: 380,
      ease: 'inOutQuad',
      onComplete: () => {
        panelEl.classList.remove('open')
        panelEl.style.maxHeight = ''
        panelEl.style.opacity = ''
      },
    })
  }
  // Build the theme cards from a themes array — each card gets a
  // 01/02/03 label and the title + description for the theme.
  function renderThemes(themes) {
    panelThemesEl.innerHTML = ''
    themes.forEach((t, i) => {
      const card = document.createElement('div')
      card.className = 'themeCard'
      card.innerHTML = '<div class="themeNumber">' + (t.n || String(i+1).padStart(2,'0')) +
                       '</div><h3 class="themeTitle"></h3><p class="themeDescription"></p>'
      card.querySelector('.themeTitle').textContent = t.t || t.title
      card.querySelector('.themeDescription').textContent = t.d || t.description
      panelThemesEl.appendChild(card)
    })
  }
  function showPanel({ name, tagline, themes, color, cta }) {
    // 1) Stuff the panel with content (header, theme cards, CTA)
    //    BEFORE measuring, so scrollHeight reflects the real height.
    panelNameEl.textContent = name
    panelTaglineEl.textContent = tagline
    panelIconEl.style.background = color || 'var(--strand-selected, #A30B37)'
    panelIconEl.style.borderRadius = '50%'
    renderThemes(themes)
    if (cta) {
      panelCtaRow.style.display = ''
      panelCta.href = cta.href || '#'
      panelCta.firstChild.textContent = cta.label || 'See full work strand'
    } else {
      panelCtaRow.style.display = 'none'
    }
    panelEl.setAttribute('aria-hidden', 'false')

    // 2) Measure-and-animate dance described in the block comment above.
    if (panelOpenAnim) panelOpenAnim.pause()
    panelEl.classList.add('open')
    panelEl.style.maxHeight = 'none'      // uncap so we can read true height
    panelEl.style.opacity = '0'
    const targetHeight = panelEl.scrollHeight
    panelEl.style.maxHeight = '0'         // reset for the animation start
    void panelEl.offsetHeight             // force reflow so the next animate() starts from height 0
    panelOpenAnim = animate(panelEl, {
      maxHeight: [0, targetHeight],
      opacity: [0, 1],
      duration: 480,
      ease: 'outQuad',
      onComplete: () => {
        // Release the cap so reflow can grow the panel naturally if
        // anything inside changes height later.
        panelEl.style.maxHeight = 'none'
      },
    })
  }

  /**
   * Single entry point for ALL selection changes. Pass exactly one
   * non-null id (the other null) to select that thing; pass two
   * nulls to clear. We then:
   *   - update state
   *   - either build + show the panel for the new selection, OR
   *     close the existing panel
   *   - call applyAppearance() to update every visual element +
   *     coordinate the animation behaviours.
   */
  function onSelect(domainId, projectId) {
    state.selectedDomain = domainId || null
    state.selectedProject = projectId || null

    if (domainId) {
      const d = domainById(domainId)
      showPanel({
        name: d.name, tagline: d.tagline, themes: d.themes, color: d.color,
        cta: { label: 'See full domain', href: '#/domains/' + d.id },
      })
    } else if (projectId) {
      const p = projectById(projectId)
      const projDomains = p.domainIds.map(domainById).filter(Boolean)
      showPanel({
        name: p.name,
        tagline: p.tagline || p.summary,
        themes: p.themes || [],
        color: projDomains[0] ? projDomains[0].color : null,
        cta: { label: 'See full project', href: '#/projects/' + p.id },
      })
    } else {
      clearPanel()
    }

    applyAppearance()
  }

  function renderLegend() {
    legendEl.innerHTML = ''
    DOMAINS.forEach(d => {
      const btn = document.createElement('button')
      btn.className = 'legend-button'
      const highlighted = highlightedDomainIds()
      const anySelected = isAnythingSelected()
      if (anySelected && !highlighted.has(d.id)) btn.classList.add('is-dim')
      if (state.selectedDomain === d.id) btn.classList.add('is-active')
      btn.innerHTML = '<span class="legend-swatch" style="background:' + d.color + ';"></span>' + d.shortName
      btn.addEventListener('click', () => onSelect(state.selectedDomain === d.id ? null : d.id, null))
      legendEl.appendChild(btn)
    })
  }

  /* ============================================================
     Stage-level pointer listeners — pause idle drift on hover so
     the spiral doesn't subtly wiggle while the user is reading or
     about to click something. (Ambient breath keeps going so the
     helix still feels alive.) Resume only if nothing's selected;
     if something IS selected, drift stays paused via applyAppearance.

     Added once at module scope so the cleanup function can remove
     them; the in-stage SVG listeners are recreated by attachInteractions
     every time the SVG is rebuilt and get GC'd along with it.
     ============================================================ */
  const onStageEnter = () => { idleDriftPaused = true }
  const onStageLeave = () => { if (!isAnythingSelected()) idleDriftPaused = false }
  stageEl.addEventListener('pointerenter', onStageEnter)
  stageEl.addEventListener('pointerleave', onStageLeave)

  /* ============================================================
     attachInteractions() — wire up clicks/hovers on the things
     INSIDE the SVG. Called fresh after every buildScene() because
     the previous listeners are GC'd along with the removed nodes.

     Behaviour summary:
       - Click a strand hitbox  → select that domain (toggle)
       - Hover a strand hitbox  → thicken its stroke (only if nothing
                                    else is selected; otherwise the
                                    selection state owns appearance)
       - Click a strand label   → same as clicking the strand
       - Click a project bead   → select that project (toggle)
       - Hover a project        → tooltip + spring grow (in attachSpringHovers)
     ============================================================ */
  function attachInteractions() {
    DOMAINS.forEach(d => {
      const so = scene.strandObjects[d.id]
      so.hitbox.addEventListener('click', () => onSelect(state.selectedDomain === d.id ? null : d.id, null))
      so.hitbox.addEventListener('pointerenter', () => {
        if (!isAnythingSelected()) {
          so.frontEls.forEach(el => el.style.strokeWidth = '4.8')
          so.backEls.forEach(el => el.style.strokeWidth = '4.3')
        }
      })
      so.hitbox.addEventListener('pointerleave', () => {
        if (!isAnythingSelected()) {
          so.frontEls.forEach(el => el.style.strokeWidth = '')
          so.backEls.forEach(el => el.style.strokeWidth = '')
        }
      })
    })
    DOMAINS.forEach(d => {
      const lg = scene.strandLabels[d.id]
      lg.style.cursor = 'pointer'
      lg.style.pointerEvents = 'auto'
      lg.addEventListener('click', () => onSelect(state.selectedDomain === d.id ? null : d.id, null))
    })
    scene.projectEls.forEach(pe => {
      pe.g.addEventListener('click', () => onSelect(null, state.selectedProject === pe.project.id ? null : pe.project.id))
      pe.g.addEventListener('pointerenter', () => {
        const rect = pe.g.getBoundingClientRect()
        showTooltip(pe.project.name, rect.left + rect.width/2 + window.scrollX, rect.top + window.scrollY)
      })
      pe.g.addEventListener('pointerleave', hideTooltip)
    })
  }

  function showTooltip(text, x, y) {
    tooltipEl.textContent = text
    tooltipEl.style.left = x + 'px'
    tooltipEl.style.top = y + 'px'
    tooltipEl.classList.add('is-visible')
  }
  function hideTooltip() { tooltipEl.classList.remove('is-visible') }

  /* ============================================================
     ANIMATION STATE — module-scoped handles so behaviours can
     pause/restart each other coherently.

       entranceFinishedAt   timestamp when the entrance timeline
                            settled. Idle behaviours check it's > 0
                            before resuming, so they don't restart
                            mid-entrance.
       idleDriftRAF         requestAnimationFrame handle for the
                            slow phase-shift loop. null = not running.
       idleDriftPaused      flag that the RAF tick respects: when
                            true, the tick skips the recompute. Set
                            to true on stage hover or any selection.
       ambientBreath        anime.js instance scaling the whole
                            stage by ±0.5% on a slow loop.
       projectBreaths       Map of projectId → anime.js instance for
                            the bead pulse on the currently-selected
                            project.
     ============================================================ */
  let entranceFinishedAt = 0
  let idleDriftRAF = null
  let idleDriftPaused = false
  let ambientBreath = null
  const projectBreaths = new Map()

  /* ============================================================
     playEntrance() — the orchestrated draw-in.
     ============================================================
     Sequence (durations approximate; timeline overlaps them):
       0ms     staff fades in (600ms)
       300ms   strand segments draw on, each delayed by 18ms via
               stagger() — produces a "pen-stroke" effect because
               we set strokeDasharray + strokeDashoffset to the
               total path length, then animate dashoffset to 0.
       1100ms  domain labels fade in (staggered)
       1500ms  project beads/capsules fade in (staggered)
       1600ms  project labels fade in (staggered)
       ~2200ms timeline.onComplete fires → ambient breath + idle
               drift can finally start.

     Position strings like '-=600' on .add() mean "start 600ms BEFORE
     the previous step's end" — that's what gives the orchestrated
     overlap feeling instead of a strict step-by-step march.

     We pause-and-clear all looping animations first so a re-entrance
     (e.g. orientation flip) doesn't leave zombies running.

     utils.set() is anime.js's "set without animating" — used to
     pre-stage the initial state (everything at opacity 0; every
     strand segment dasharray-prepped for the draw-on illusion).
     ============================================================ */
  function playEntrance() {
    // Cancel any in-flight loops/RAFs so the entrance starts clean.
    stopIdleDrift()
    if (ambientBreath) { ambientBreath.pause(); ambientBreath = null }
    projectBreaths.forEach(a => a.pause())
    projectBreaths.clear()

    // Collect the things we'll animate.
    const staff = scene.svgEl.querySelector('.staff')
    const rodIcon = scene.svgEl.querySelector('.rod-icon')
    const allFront = [], allBack = []
    DOMAINS.forEach(d => {
      const so = scene.strandObjects[d.id]
      allFront.push(...so.frontEls)
      allBack.push(...so.backEls)
    })
    // Back segments first, then front — this matches z-order (back drawn
    // first) and also makes the visual reveal start subtly behind the staff.
    const allSegs = [...allBack, ...allFront]

    // Pre-stage initial state with utils.set (no animation).
    if (staff) utils.set(staff, { opacity: 0 })
    if (rodIcon) utils.set(rodIcon, { opacity: 0 })
    allSegs.forEach(p => {
      try {
        // The "draw a path" trick: set dasharray = full length, dashoffset
        // = full length → the path is invisible (one big "gap"). Animate
        // dashoffset to 0 → the path appears to draw itself in.
        const len = p.getTotalLength()
        utils.set(p, { strokeDasharray: len, strokeDashoffset: len })
      } catch (e) { /* zero-length segment — skip */ }
    })
    const labels = Object.values(scene.strandLabels)
    const projGroups = scene.projectEls.map(p => p.g)
    const projLabels = scene.projectEls.map(p => p.label)
    utils.set([...labels, ...projGroups, ...projLabels], { opacity: 0 })

    // Build the timeline. `defaults` applies to every .add() unless
    // overridden. `onComplete` fires when the LAST step finishes —
    // that's where we hand control over to the ambient idle behaviours.
    const tl = createTimeline({
      defaults: { ease: 'inOutQuad' },
      onComplete: () => {
        entranceFinishedAt = performance.now()
        // Critical: the draw-on entrance set inline strokeDasharray =
        // initial-path-length on every segment. Once drift starts
        // mutating the path-d, segments that grow LONGER than that
        // initial length get clipped by the dasharray (the part beyond
        // initial length falls into a 0-length "dash" that renders
        // nothing). Result: random invisible gaps as drift goes on.
        // Clearing dasharray here lets segments render in full at
        // whatever length they happen to be, frame to frame.
        allSegs.forEach(p => {
          p.style.strokeDasharray = 'none'
          p.style.strokeDashoffset = ''
        })
        startAmbientBreath()
        startIdleDrift()
      },
    })

    // Step 1: staff fades up to full opacity to match the rod-icon's
    // solid ink fill — together they read as one continuous anchor.
    if (staff) {
      tl.add(staff, { opacity: [0, 1], duration: 600 })
    }
    if (rodIcon) {
      // Run in parallel with the staff fade: '-=600' starts this 600ms
      // before the previous step ends → same start time, same duration.
      tl.add(rodIcon, { opacity: [0, 1], duration: 600 }, '-=600')
    }
    // Step 2: all strand segments draw in. stagger(18, {start:0}) gives
    // each segment delay = i*18ms, starting at 0ms. '-=300' starts the
    // step 300ms before the staff fade ends → a slight overlap.
    tl.add(allSegs, {
      strokeDashoffset: 0,
      duration: 1100,
      delay: stagger(18, { start: 0 }),
    }, '-=300')
    // Steps 3–5: fades, each starting partway through the previous
    // step so the reveal flows smoothly instead of marching in beats.
    tl.add(labels,     { opacity: [0, 1], duration: 500, delay: stagger(80) }, '-=600')
    tl.add(projGroups, { opacity: [0, 1], duration: 500, delay: stagger(100) }, '-=300')
    tl.add(projLabels, { opacity: [0, 1], duration: 400, delay: stagger(80) }, '-=400')
  }

  /* ============================================================
     IDLE DRIFT — slow phase rotation when nothing is selected.
     ============================================================
     This is the "alive" feeling: when the user isn't interacting,
     each strand's phase very slowly increments and its amplitude
     subtly breathes. Combined, the spiral looks like it's gently
     turning.

     We don't use anime.js for this — we drive it with a manual
     requestAnimationFrame loop, because:
       1. anime.js is built for finite or per-target animations.
          Continuously regenerating SVG attribute strings on every
          frame doesn't fit its model.
       2. The recompute is a few hundred sin/cos calls + some short
          string concatenations. At 60fps that's well under 1ms per
          frame on modern hardware.

     Constants:
       PHASE_DRIFT_PER_MS  Radians the phase advances per millisecond.
                            0.00024 rad/ms × 1000 ms × 60 s × 2 = full
                            revolution in ~60s. Tweak smaller for
                            slower drift.
       DRIFT_TICK_MIN_MS   Min interval between recomputes (16ms ≈
                            60fps cap). The RAF still fires every
                            frame but we skip the work if it's too soon.
       DRIFT_AMP_HZ        How many full breath cycles per second
                            for the amplitude wobble.
       DRIFT_AMP_RANGE     Amplitude varies by ±2.5% of base.

     Each tick mutates the strand cfg's `phase` and `amplitude`,
     then calls rebuildStrandSegments() to overwrite every strand
     path's `d` attribute and re-position projects that depend
     on those points.
     ============================================================ */
  const PHASE_DRIFT_PER_MS = 0.00024
  // ~60fps cap. The per-frame work (re-sampling 4 strands × 160 points
  // and writing a few dozen short SVG path attributes) is well under 1ms
  // on modern hardware, so there's no real cost to running it every RAF.
  // The previous 80ms (~12fps) cap was the visible-stepping cause.
  const DRIFT_TICK_MIN_MS  = 16
  const DRIFT_AMP_HZ       = 0.05
  const DRIFT_AMP_RANGE    = 0.025

  function startIdleDrift() {
    stopIdleDrift()
    let lastTick = performance.now()
    // Drift clock — total UN-PAUSED elapsed ms. Used by the amplitude
    // breath so it stays in sync with the phase (both pause together
    // and resume together with no jump).
    let driftClock = 0
    // If anything pauses the loop for longer than this (hover, tab
    // backgrounded, GC stall, debugger break…) we cap dt so the strand
    // doesn't leap forward by all the skipped-frame motion in one go.
    // 50ms ≈ 3 frames worth — small enough that a brief stall isn't
    // visible, large enough that normal frame jitter doesn't get clipped.
    const MAX_DT = 50
    function tick(now) {
      // Always re-schedule first so a thrown error doesn't kill the loop.
      idleDriftRAF = requestAnimationFrame(tick)
      // Coordination guards: skip work if any selection or hover is active.
      // CRITICAL: keep `lastTick` fresh during the pause so the next live
      // tick doesn't compute a multi-second `dt` and warp the strands
      // forward by minutes of accumulated drift in a single frame.
      if (idleDriftPaused || isAnythingSelected()) {
        lastTick = now
        return
      }
      // Throttle: skip if we ticked recently (60fps cap).
      if (now - lastTick < DRIFT_TICK_MIN_MS) return
      const dt = Math.min(now - lastTick, MAX_DT)
      lastTick = now
      driftClock += dt
      // Mutate each strand's phase by the dt-scaled drift, and breathe
      // amplitude with a sine offset by the strand's basePhase so each
      // strand breathes in its own rhythm.
      DOMAINS.forEach(d => {
        const cfg = scene.strandConfigs[d.id]
        if (!cfg) return
        cfg.phase += PHASE_DRIFT_PER_MS * dt
        const tSec = driftClock / 1000
        cfg.amplitude = cfg.baseAmplitude * (1 + DRIFT_AMP_RANGE * Math.sin(2 * Math.PI * DRIFT_AMP_HZ * tSec + cfg.basePhase))
      })
      rebuildStrandSegments()
    }
    idleDriftRAF = requestAnimationFrame(tick)
  }
  function stopIdleDrift() {
    if (idleDriftRAF !== null) {
      cancelAnimationFrame(idleDriftRAF)
      idleDriftRAF = null
    }
  }

  /**
   * Re-sample every strand and overwrite its existing path elements'
   * `d` attributes in place. The segment count varies between ticks
   * (depth crossings shift, splitting/merging segments), so we work
   * against a fixed pool of SEGMENT_SLOTS_PER_SIDE pre-allocated path
   * nodes per strand-side: fill the first N with the live path-d
   * strings, blank the rest. No DOM node create/remove churn at 60fps.
   */
  function rebuildStrandSegments() {
    DOMAINS.forEach(d => {
      const so = scene.strandObjects[d.id]
      const cfg = scene.strandConfigs[d.id]
      if (!so || !cfg) return
      const { frontPaths, backPaths, fullPath } = sampleStrand(currentOrientation, cfg)
      function syncList(elements, paths) {
        for (let i = 0; i < elements.length; i++) {
          if (i < paths.length) elements[i].setAttribute('d', paths[i])
          else                  elements[i].setAttribute('d', '')
        }
      }
      syncList(so.frontEls, frontPaths)
      syncList(so.backEls,  backPaths)
      so.hitbox.setAttribute('d', fullPath)
    })
    rebuildProjects()
  }

  function rebuildProjects() {
    const orientation = currentOrientation
    scene.projectEls.forEach(pe => {
      const proj = pe.project
      if (proj.domainIds.length === 1) {
        const cfg = scene.strandConfigs[proj.domainIds[0]]
        const pt = strandPointAt(orientation, cfg, proj.position)
        // Side is locked at initial render so the bead never flips columns
        // as the strand drifts — the leader just lengthens or shortens.
        // baseAmplitude (not the live amplitude) keeps the column stable
        // through the idle-drift breathing.
        const sideSign = pe.sideSign != null ? pe.sideSign : 1
        const outboard = cfg.axisOffset + sideSign * (cfg.baseAmplitude + LABEL_GUTTER)
        const px = orientation === 'vertical' ? outboard : pt.x
        const py = orientation === 'vertical' ? pt.y : outboard
        pe.shape.setAttribute('cx', px)
        pe.shape.setAttribute('cy', py)
        pe.px = px; pe.py = py
        pe.anchorPt = pt
        if (pe.leader) {
          pe.leader.setAttribute('x1', pt.x)
          pe.leader.setAttribute('y1', pt.y)
          pe.leader.setAttribute('x2', px)
          pe.leader.setAttribute('y2', py)
        }
        if (pe.label) {
          if (orientation === 'vertical') {
            pe.label.setAttribute('x', sideSign >= 0 ? px + 22 : px - 22)
            pe.label.setAttribute('y', py + 115)
          } else {
            pe.label.setAttribute('x', px)
            pe.label.setAttribute('y', sideSign >= 0 ? py + 28 : py - 20)
          }
        }
      } else {
        const pts = proj.domainIds.map(id => {
          const cfg = scene.strandConfigs[id]
          const p = strandPointAt(orientation, cfg, proj.position)
          return { id, x: p.x, y: p.y }
        })
        if (orientation === 'vertical') pts.sort((a, b) => a.x - b.x)
        else pts.sort((a, b) => a.y - b.y)
        const dStr = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ')
        if (pe.line) pe.line.setAttribute('d', dStr)
        const caps = pe.g.querySelectorAll('.project-bridge-cap')
        caps.forEach((c, i) => {
          if (pts[i]) {
            c.setAttribute('cx', pts[i].x)
            c.setAttribute('cy', pts[i].y)
          }
        })
        // Recompute capsule midpoint, then re-anchor the label/leader to the
        // outboard column at the new midpoint y.
        const midIdx = Math.floor(pts.length / 2)
        const mid = pts.length % 2 === 1
          ? pts[midIdx]
          : { x: (pts[midIdx-1].x + pts[midIdx].x) / 2, y: (pts[midIdx-1].y + pts[midIdx].y) / 2 }
        pe.mx = mid.x; pe.my = mid.y
        const sideSign = pe.sideSign != null ? pe.sideSign : 1
        const cfg = scene.strandConfigs[proj.domainIds[0]]
        const outboard = cfg.axisOffset + sideSign * (cfg.baseAmplitude + LABEL_GUTTER)
        const labelX = orientation === 'vertical' ? outboard : mid.x
        const labelY = orientation === 'vertical' ? mid.y : outboard
        if (pe.labelLeader) {
          pe.labelLeader.setAttribute('x1', mid.x)
          pe.labelLeader.setAttribute('y1', mid.y)
          pe.labelLeader.setAttribute('x2', labelX)
          pe.labelLeader.setAttribute('y2', labelY)
        }
        if (pe.label) {
          if (orientation === 'vertical') {
            pe.label.setAttribute('x', labelX + (sideSign > 0 ? 6 : -6))
            pe.label.setAttribute('y', labelY + 115)
          } else {
            pe.label.setAttribute('x', labelX)
            pe.label.setAttribute('y', labelY + (sideSign > 0 ? 16 : -8))
          }
        }
      }
    })
  }

  /* ============================================================
     AMBIENT BREATH — a tiny scale loop on the stage as a whole.
     ============================================================
     animate() with a 3-stop array [1, 1.005, 1] tells anime.js to
     keyframe the property: scale 1 → 1.005 → 1 over `duration` ms.
     `loop: true` repeats forever. inOutSine gives a gentle in/out.

     We target the .helix-stage div (HTMLElement) rather than the
     SVG root, because <svg> elements have their own transform
     semantics that don't always cooperate with the browser's CSS
     transform matrix. The div has predictable transform-origin.
     ============================================================ */
  function startAmbientBreath() {
    if (ambientBreath) ambientBreath.pause()
    if (!stageEl) return
    stageEl.style.transformOrigin = 'center'
    ambientBreath = animate(stageEl, {
      scale: [1, 1.005, 1],
      duration: 8000,
      ease: 'inOutSine',
      loop: true,
    })
  }

  /* ============================================================
     PROJECT BREATHING — looped pulse on the currently-selected bead.
     ============================================================
     For single-domain beads we pulse the circle's `r` attribute (SVG
     attribute, not CSS — anime.js handles both transparently).
     For multi-domain capsules we pulse `strokeWidth` instead so the
     bridge "breathes" as a thicker line.

     The computed-property-name idiom
        [projectEl.shape ? 'r' : 'strokeWidth']
     picks the right key based on which sub-element is present.

     applyAppearance() is responsible for starting/stopping these:
       - Selection changes → it stops breaths for now-inactive
         projects (animating them back to baseline r=13) and starts a
         breath for the new selection.
       - Project-breath instances are tracked in `projectBreaths` so
         hover springs know to NOT compete (see attachSpringHovers).
     ============================================================ */
  function startProjectBreath(projectEl) {
    if (projectBreaths.has(projectEl.project.id)) return
    const target = projectEl.shape || projectEl.line
    if (!target) return
    const inst = animate(target, {
      [projectEl.shape ? 'r' : 'strokeWidth']: projectEl.shape ? [13, 16, 13] : [9, 12, 9],
      duration: 2400,
      ease: 'inOutSine',
      loop: true,
    })
    projectBreaths.set(projectEl.project.id, inst)
  }
  function stopProjectBreath(projectId) {
    const inst = projectBreaths.get(projectId)
    if (inst) {
      inst.pause()
      projectBreaths.delete(projectId)
    }
  }

  /* ============================================================
     HOVER SPRINGS — bouncy size-pop on project beads.
     ============================================================
     createSpring({ stiffness, damping }) returns an EASE FUNCTION
     modelling a spring. Higher stiffness → snappier; higher damping
     → less overshoot. The animation looks bouncier than any built-in
     ease curve because the spring overshoots and oscillates back.

     The `if (projectBreaths.has(...)) return` guard prevents the
     hover animation from clobbering an in-flight project-breath
     animation on the same `r` attribute. (Two animate() calls on
     the same property would race; the most recent wins, so the
     breath would visibly stutter on hover.)

     Hovering a project bead while NO selection is active just
     springs it bigger; hovering one that's already the selected
     bead does nothing extra (the breath continues).
     ============================================================ */
  function attachSpringHovers() {
    const spring = createSpring({ stiffness: 220, damping: 18 })
    scene.projectEls.forEach(pe => {
      const target = pe.shape
      if (!target) return  // multi-domain capsules don't have a circle to spring
      pe.g.addEventListener('pointerenter', () => {
        if (projectBreaths.has(pe.project.id)) return
        animate(target, { r: 16, duration: 500, ease: spring })
      })
      pe.g.addEventListener('pointerleave', () => {
        if (projectBreaths.has(pe.project.id)) return
        animate(target, { r: 13, duration: 500, ease: spring })
      })
    })
  }

  /* ============================================================
     setOrientation — flip Vertical ↔ Horizontal.
     ============================================================
     Tears down the current scene (clearPanel + buildScene wipes the
     SVG), rebuilds everything for the new orientation, and replays
     the entrance animation. State is reset because positions change
     and a stale selection might point at a now-misplaced element.
     ============================================================ */
  function setOrientation(orientation) {
    if (orientation === currentOrientation) return
    currentOrientation = orientation
    stageEl.dataset.orientation = orientation
    orientationButtons.forEach(b =>
      b.classList.toggle('is-active', b.dataset.orientation === orientation)
    )
    state = { selectedDomain: null, selectedProject: null }
    clearPanel()
    scene = buildScene(orientation)
    attachInteractions()
    attachSpringHovers()
    applyAppearance()
    playEntrance()
  }

  /* ============================================================
     Toolbar + panel-close listeners — added once at mount, tracked
     in `toggleListeners` so cleanup can remove them. (The cleanup
     symmetry matters because the React shell may unmount/remount
     under StrictMode in dev, and we don't want orphan listeners
     accumulating on the DOM nodes.)
     ============================================================ */
  const toggleListeners: Array<[HTMLButtonElement, () => void]> = []
  orientationButtons.forEach(b => {
    const handler = () => setOrientation(b.dataset.orientation)
    b.addEventListener('click', handler)
    toggleListeners.push([b, handler])
  })
  const onPanelClose = () => onSelect(null, null)
  panelCloseBtn.addEventListener('click', onPanelClose)

  /* ============================================================
     Initial mount sequence — same calls as setOrientation but
     without the teardown. After this returns, the helix is alive,
     interactive, and the entrance timeline is playing.
     ============================================================ */
  scene = buildScene(currentOrientation)
  attachInteractions()
  attachSpringHovers()
  applyAppearance()
  playEntrance()

  /* ============================================================
     CLEANUP — returned to the caller (Helix.tsx's useEffect).
     ============================================================
     Called on:
       - React unmount (e.g. user navigates to the Who? page)
       - React StrictMode dev double-invoke (the first mount's effect
         is immediately torn down before the second runs — without
         this teardown we'd accumulate duplicate animations)

     Order matters:
       1. Stop the RAF loop and pause every anime.js instance — we
          don't want them firing into a half-torn-down DOM.
       2. Remove the listeners we added at module scope (toolbar,
          panel close, stage hover). SVG-internal listeners are
          freed automatically when the SVG nodes are removed below.
       3. Wipe the DOM contents we created so the React shell sees
          clean refs if it re-mounts.
     ============================================================ */
  return () => {
    stopIdleDrift()
    if (ambientBreath) { ambientBreath.pause(); ambientBreath = null }
    projectBreaths.forEach(a => a.pause())
    projectBreaths.clear()
    if (panelOpenAnim) { panelOpenAnim.pause(); panelOpenAnim = null }

    stageEl.removeEventListener('pointerenter', onStageEnter)
    stageEl.removeEventListener('pointerleave', onStageLeave)
    panelCloseBtn.removeEventListener('click', onPanelClose)
    toggleListeners.forEach(([btn, handler]) => btn.removeEventListener('click', handler))

    // SVG-internal listeners are GC'd when nodes are removed.
    stageEl.querySelectorAll('svg').forEach(s => s.remove())
    legendEl.innerHTML = ''
    panelThemesEl.innerHTML = ''
    tooltipEl.classList.remove('is-visible')
    panelEl.classList.remove('open')
    panelEl.style.maxHeight = ''
    panelEl.style.opacity = ''
    panelEl.style.transform = ''
    stageEl.style.transform = ''
  }
}
