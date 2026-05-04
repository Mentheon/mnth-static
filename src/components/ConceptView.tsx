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
    const line = root.querySelector('.roadmap-line:not(.roadmap-line--dashed)')
    const dashed = root.querySelector('.roadmap-line--dashed')
    const nodes = root.querySelectorAll('.roadmap-node')
    if (!nodes.length) return

    const tl = createTimeline({ defaults: { ease: 'outQuad' } })
    if (line) {
      tl.add(line, {
        strokeDashoffset: [1000, 0],
        duration: 1100,
        ease: 'inOutQuad',
      })
    }
    tl.add(nodes, {
      opacity: [0, 1],
      scale: [0.6, 1],
      duration: 600,
      delay: stagger(140),
      ease: 'outBack',
    }, '-=600')
    if (dashed) {
      tl.add(dashed, {
        opacity: [0, 0.5],
        duration: 500,
      }, '-=400')
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
          <svg viewBox="0 0 800 360" className="roadmap-svg" aria-label="Service roadmap">
            {/* Main line: Research → Design → Development */}
            <path
              d="M 100 260 Q 250 260 400 260 Q 550 260 700 260"
              className="roadmap-line"
            />
            {/* Dashed connector to the satellite Consultancy node */}
            <path
              d="M 550 260 Q 600 180 640 110"
              className="roadmap-line roadmap-line--dashed"
            />

            {/* Nodes — clickable */}
            <g
              className="roadmap-node"
              data-node="research"
              onClick={() => onRoadmapNodeClick('research')}
            >
              <circle cx={100} cy={260} r={50} className="roadmap-node-circle" />
              <text x={100} y={266} className="roadmap-node-label">Research</text>
            </g>
            <g
              className="roadmap-node"
              data-node="design"
              onClick={() => onRoadmapNodeClick('design')}
            >
              <circle cx={400} cy={260} r={50} className="roadmap-node-circle" />
              <text x={400} y={266} className="roadmap-node-label">Design</text>
            </g>
            <g
              className="roadmap-node"
              data-node="development"
              onClick={() => onRoadmapNodeClick('development')}
            >
              <circle cx={700} cy={260} r={50} className="roadmap-node-circle" />
              <text x={700} y={266} className="roadmap-node-label">Development</text>
            </g>
            {/* Consultancy — satellite (off the main path, dashed connector) */}
            <g
              className="roadmap-node roadmap-node--satellite"
              data-node="consultancy"
              onClick={() => onRoadmapNodeClick('consultancy')}
            >
              <circle cx={640} cy={90} r={42} className="roadmap-node-circle" />
              <text x={640} y={96} className="roadmap-node-label">Consultancy</text>
            </g>
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
