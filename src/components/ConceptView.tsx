import { useEffect, useRef, useState } from 'react'
import { animate, createTimeline, stagger, utils } from 'animejs'
import RDStrands from './RDStrands'
import StrandPanel from './StrandPanel'
import Helix from './Helix'
import { STRANDS } from '../data/strands'
import './ConceptView.css'

/* ============================================================
   ConceptView — WIP "Apple-esque" scroll-snap carousel.
   Three full-viewport sections, each snapping into place:
     a)  "Digital health is moving... fast" + speed-line animation
     b)  "We get it" + clickable Research / Design / Development
         roadmap with Consultancy as a satellite node off to the side
     c)  Existing R&D strand experience (the helix + bubbles + panel)
   anime.js drives both the section A entrance and the section B
   roadmap reveal; section C reuses the existing Helix's own
   entrance timeline.
   ============================================================ */
export default function ConceptView() {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const sectionARef = useRef<HTMLElement>(null)
  const sectionBRef = useRef<HTMLElement>(null)
  const sectionCRef = useRef<HTMLElement>(null)

  // Tracks which sections have already played their entrance once,
  // so re-entering a section doesn't restart its animation jarringly.
  const playedRef = useRef<Set<string>>(new Set())

  // Selection state for the embedded Helix + RDStrands in section C.
  const [openStrandId, setOpenStrandId] = useState<string | null>(null)
  const openStrand = STRANDS.find(s => s.id === openStrandId) ?? null

  /* IntersectionObserver — fires entrance when a section is mostly
     in view inside the snap scroller. */
  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    const observed: HTMLElement[] = []
    if (sectionARef.current) observed.push(sectionARef.current)
    if (sectionBRef.current) observed.push(sectionBRef.current)
    if (sectionCRef.current) observed.push(sectionCRef.current)

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return
          const id = (entry.target as HTMLElement).dataset.section
          if (!id) return
          if (playedRef.current.has(id)) return
          playedRef.current.add(id)
          if (id === 'a') playSectionA()
          else if (id === 'b') playSectionB()
          // section c relies on the embedded Helix's own entrance.
        })
      },
      { root: scroller, threshold: 0.55 },
    )
    observed.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  /* ---------- Section A: word-stagger reveal + speed streaks ----- */
  function playSectionA() {
    const root = sectionARef.current
    if (!root) return
    const words = root.querySelectorAll<HTMLSpanElement>('.concept-a-word')
    const fast = root.querySelector<HTMLSpanElement>('.concept-a-word--fast')
    const streaks = root.querySelectorAll<HTMLSpanElement>('.concept-a-streak')
    if (!words.length) return

    const tl = createTimeline({ defaults: { ease: 'outQuad' } })
    tl.add(words, {
      opacity: [0, 1],
      translateY: [28, 0],
      duration: 600,
      delay: stagger(90),
    })
    if (fast) {
      tl.add(fast, {
        scale: [1, 1.18, 1],
        color: ['#A30B37', '#A30B37'],
        duration: 720,
        ease: 'outElastic(1, .5)',
      }, '-=200')
    }
    if (streaks.length) {
      tl.add(streaks, {
        opacity: [0, 0.85, 0],
        translateX: [() => -200, () => 600],
        duration: 700,
        delay: stagger(60, { from: 'first' }),
        ease: 'inOutQuad',
      }, '-=500')
    }
  }

  /* ---------- Section B: roadmap reveal ----- */
  function playSectionB() {
    const root = sectionBRef.current
    if (!root) return
    const line     = root.querySelector('.roadmap-line') as SVGGeometryElement | null
    const brace    = root.querySelector('.roadmap-brace') as SVGGeometryElement | null
    const connector= root.querySelector('.roadmap-brace-connector') as SVGGeometryElement | null
    const nodes    = root.querySelectorAll('.roadmap-node')
    const ticks    = root.querySelectorAll('.roadmap-tick')
    const chevrons = root.querySelectorAll('.roadmap-chevron')
    const labels   = root.querySelectorAll('.roadmap-node-label, .roadmap-node-label-above')
    if (!nodes.length) return

    // Pre-stage stroke-dasharray for the draw-on lines (anime sets
    // strokeDashoffset → 0 to reveal them). Skip if the path has no
    // measurable length yet (off-screen / not laid out).
    const drawOn: SVGGeometryElement[] = []
    if (line)      drawOn.push(line)
    if (brace)     drawOn.push(brace)
    if (connector) drawOn.push(connector)
    drawOn.forEach(el => {
      try {
        const len = el.getTotalLength()
        utils.set(el, { strokeDasharray: len, strokeDashoffset: len })
      } catch (_) { /* zero-length — skip */ }
    })

    const tl = createTimeline({ defaults: { ease: 'outQuad' } })
    // 1. Main timeline draws on first
    if (line) {
      tl.add(line, { strokeDashoffset: 0, duration: 900, ease: 'inOutQuad' })
    }
    // 2. Direction chevrons + tick marks fade in along the line
    if (ticks.length) {
      tl.add(ticks, { opacity: [0, 0.7], duration: 400, delay: stagger(80) }, '-=500')
    }
    if (chevrons.length) {
      tl.add(chevrons, { opacity: [0, 0.6], duration: 400, delay: stagger(120) }, '-=400')
    }
    // 3. Three primary nodes pop in (Research → Design → Development)
    const primaryNodes = root.querySelectorAll('.roadmap-node:not(.roadmap-node--satellite)')
    tl.add(primaryNodes, {
      opacity: [0, 1],
      scale: [0.6, 1],
      duration: 550,
      delay: stagger(120),
      ease: 'outBack',
    }, '-=300')
    // 4. The `}` brace draws on, indicating Consultancy covers all
    if (brace) {
      tl.add(brace, { strokeDashoffset: 0, duration: 800, ease: 'inOutQuad' }, '-=200')
    }
    // 5. Connector line + Consultancy node appear at the top
    if (connector) {
      tl.add(connector, { strokeDashoffset: 0, duration: 350 }, '-=300')
    }
    const satellite = root.querySelector('.roadmap-node--satellite')
    if (satellite) {
      tl.add(satellite, {
        opacity: [0, 1],
        scale: [0.6, 1],
        duration: 600,
        ease: 'outBack',
      }, '-=200')
    }
    // 6. Text labels last
    if (labels.length) {
      tl.add(labels, { opacity: [0, 1], duration: 400, delay: stagger(60) }, '-=400')
    }
  }

  function onRoadmapNodeClick(node: string) {
    // WIP: route to a per-domain view later. Log for now.
    // eslint-disable-next-line no-console
    console.log('roadmap node clicked:', node)
  }

  /* Snap to next/previous section helpers (button / keyboard) */
  function snapToSection(idx: number) {
    const scroller = scrollerRef.current
    if (!scroller) return
    const sections = [sectionARef, sectionBRef, sectionCRef]
    const target = sections[idx]?.current
    if (!target) return
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="concept-scroller" ref={scrollerRef}>
      {/* ============= a) Digital health is moving... fast ============= */}
      <section
        className="concept-section concept-a"
        ref={sectionARef}
        data-section="a"
      >
        <h1 className="concept-a-headline">
          {/* Each word as its own span so anime can stagger reveal */}
          <span className="concept-a-word">Digital&nbsp;</span>
          <span className="concept-a-word">health&nbsp;</span>
          <span className="concept-a-word">is&nbsp;</span>
          <span className="concept-a-word">moving</span>
          <span className="concept-a-word">…&nbsp;</span>
          <span className="concept-a-word concept-a-word--fast">fast</span>
          <span className="concept-a-streaks" aria-hidden="true">
            <span className="concept-a-streak" style={{ width: 280, top: -28 }} />
            <span className="concept-a-streak" style={{ width: 220, top: 0 }} />
            <span className="concept-a-streak" style={{ width: 320, top: 28 }} />
          </span>
        </h1>
      </section>

      {/* ============= b) We get it + roadmap ============= */}
      <section
        className="concept-section concept-b"
        ref={sectionBRef}
        data-section="b"
      >
        <p className="concept-b-eyebrow">We get it</p>
        <h2 className="concept-b-tagline">
          From insight to product, we cover the full arc.
        </h2>
        <div className="roadmap">
          <svg viewBox="0 0 800 440" className="roadmap-svg" aria-label="Service roadmap">
            {/* Main line: Research → Design → Development */}
            <line
              x1={130} y1={310} x2={670} y2={310}
              className="roadmap-line"
            />
            {/* Progress tick marks along the timeline (between nodes) */}
            <line x1={265} y1={300} x2={265} y2={320} className="roadmap-tick" />
            <line x1={400} y1={298} x2={400} y2={322} className="roadmap-tick roadmap-tick--major" />
            <line x1={535} y1={300} x2={535} y2={320} className="roadmap-tick" />

            {/* Direction chevrons — flow indicators along the timeline */}
            <path d="M 200 304 L 212 310 L 200 316" className="roadmap-chevron" />
            <path d="M 470 304 L 482 310 L 470 316" className="roadmap-chevron" />

            {/* `}` brace above the three primary nodes, indicating that
                Consultancy COVERS all of them. Two smooth quadratic
                curves meeting at a peak in the centre. */}
            <path
              d="M 130 248 Q 130 188 280 188 Q 400 188 400 138 Q 400 188 520 188 Q 670 188 670 248"
              className="roadmap-brace"
            />
            {/* Vertical connector from brace peak up to Consultancy */}
            <line
              x1={400} y1={138} x2={400} y2={92}
              className="roadmap-brace-connector"
            />

            {/* Consultancy — sits ABOVE the brace, covering everything */}
            <g
              className="roadmap-node roadmap-node--satellite"
              data-node="consultancy"
              onClick={() => onRoadmapNodeClick('consultancy')}
            >
              <circle cx={400} cy={50} r={42} className="roadmap-node-circle" />
              <text x={400} y={64} className="roadmap-node-emoji">📋</text>
            </g>
            <text x={400} y={120} className="roadmap-node-label-above">Consultancy</text>

            {/* Three primary nodes along the timeline */}
            <g
              className="roadmap-node"
              data-node="research"
              onClick={() => onRoadmapNodeClick('research')}
            >
              <circle cx={130} cy={310} r={50} className="roadmap-node-circle" />
              <text x={130} y={326} className="roadmap-node-emoji">🔬</text>
            </g>
            <text x={130} y={400} className="roadmap-node-label">Research</text>

            <g
              className="roadmap-node"
              data-node="design"
              onClick={() => onRoadmapNodeClick('design')}
            >
              <circle cx={400} cy={310} r={50} className="roadmap-node-circle" />
              <text x={400} y={326} className="roadmap-node-emoji">🎨</text>
            </g>
            <text x={400} y={400} className="roadmap-node-label">Design</text>

            <g
              className="roadmap-node"
              data-node="development"
              onClick={() => onRoadmapNodeClick('development')}
            >
              <circle cx={670} cy={310} r={50} className="roadmap-node-circle" />
              <text x={670} y={326} className="roadmap-node-emoji">💻</text>
            </g>
            <text x={670} y={400} className="roadmap-node-label">Development</text>
          </svg>
        </div>
      </section>

      {/* ============= c) Our ongoing R&D strands (DNA / helix) ============= */}
      <section
        className="concept-section concept-c"
        ref={sectionCRef}
        data-section="c"
      >
        <p className="concept-c-eyebrow">Our ongoing R&amp;D strands</p>
        <div className="concept-c-host">
          <RDStrands openId={openStrandId} onSelect={setOpenStrandId} />
          <Helix selectedStrandId={openStrandId} onSelect={setOpenStrandId} />
          {openStrand && (
            <StrandPanel
              key={openStrand.id}
              strand={openStrand}
              isOpen={openStrandId !== null}
              onClose={() => setOpenStrandId(null)}
            />
          )}
        </div>
      </section>
    </div>
  )
}
