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

    const tl = createTimeline({
      defaults: { ease: 'outQuad' },
      onComplete: () => {
        // Once the static layout has settled, kick off the slow
        // travelling pulse along the timeline. Two looping animations
        // run in parallel:
        //   1. Traversal — translates cx between the three node x's
        //      with brief pauses at each, then warps back to start.
        //      The arrive/depart of each bubble fires "join" effects
        //      below so the bubble distorts + recolours organically.
        //   2. Breath — pulses the dot's r and the aura's r/opacity
        //      on a separate inOutSine loop, independent of position.
        const dot  = root.querySelector('.timeline-pulse-dot')  as SVGCircleElement | null
        const aura = root.querySelector('.timeline-pulse-aura') as SVGCircleElement | null
        if (!dot || !aura) return

        // Bubble (circle) refs for the three primary nodes.
        const researchCircle    = root.querySelector('.roadmap-node[data-node="research"] .roadmap-node-circle')    as SVGCircleElement | null
        const designCircle      = root.querySelector('.roadmap-node[data-node="design"] .roadmap-node-circle')      as SVGCircleElement | null
        const developmentCircle = root.querySelector('.roadmap-node[data-node="development"] .roadmap-node-circle') as SVGCircleElement | null

        // Geometry constants — match the SVG markup above.
        const NODE_R    = 50          // primary node radius
        const DOT_R_MAX = 9           // upper bound on the breathing dot's r
        const BOUND     = NODE_R + DOT_R_MAX   // dot is fully outside / first touches at this distance

        /* arriveAt — the dot first touches this bubble. The dot
           ASSIMILATES into the bubble (fade to 0). The bubble does a
           small absorption swell + recolours crimson. While the dot
           sits inside (the "hold" phase), it stays invisible — the
           bubble itself is the active visual. */
        function arriveAt(circle: SVGCircleElement | null) {
          if (!circle) return
          circle.style.fill = '#A30B37'
          animate(circle, {
            scale: [1, 1.12, 1.04],
            duration: 600,
            ease: 'outElastic(1.2, 0.5)',
          })
          animate([dot, aura], {
            opacity: 0,
            duration: 280,
            ease: 'inQuad',
          })
        }

        /* releaseFrom — fired at the START of the next transit step,
           BEFORE the dot has cleared the bubble's bounds. The bubble
           "bubbles up" — inflates well beyond its resting size — and
           the dot re-emerges (fades back in) inside the bubble. Once
           the dot crosses the bound, departFrom() shrinks the bubble
           the rest of the way back to normal. */
        function releaseFrom(circle: SVGCircleElement | null) {
          if (!circle) return
          // Inflate the bubble (the "bubbling" phase). Doesn't settle
          // here — departFrom() runs the second half once the dot has
          // physically left.
          animate(circle, {
            scale: [1.04, 1.32],
            duration: 700,
            ease: 'outQuad',
          })
          // Dot + aura emerge from inside the bubble, with a small
          // delay so they appear around the moment the bubble peaks.
          animate(dot, {
            opacity: [0, 1],
            duration: 420,
            delay: 220,
            ease: 'outQuad',
          })
          animate(aura, {
            opacity: [0, 0.35],
            duration: 420,
            delay: 220,
            ease: 'outQuad',
          })
        }

        /* departFrom — dot has fully cleared this bubble's bounds.
           Bubble deflates back to scale 1 with an elastic recoil; fill
           reverts to grape (CSS transition fades it). onComplete
           clears inline transform so the CSS :hover scale(1.12)
           keeps working between traversal events. */
        function departFrom(circle: SVGCircleElement | null) {
          if (!circle) return
          circle.style.fill = ''
          animate(circle, {
            scale: [1.32, 1],
            duration: 550,
            ease: 'outElastic(1.2, 0.5)',
            onComplete: () => { circle.style.transform = '' },
          })
        }

        // Initial state: dot is INVISIBLE (assimilated into Research)
        // and Research is already coloured crimson + slightly swollen.
        utils.set([dot, aura], { opacity: 0 })
        arriveAt(researchCircle)

        /* Build a transit step:
            onBegin   — bubble that we're leaving "bubbles up" and the
                        dot re-emerges from inside it (releaseFrom).
            onUpdate  — when the dot's cx clears the source bubble's
                        bounds, departFrom() shrinks the bubble back
                        to normal and reverts its colour. When cx
                        first touches the target bubble's bounds,
                        arriveAt() assimilates the dot into it. */
        function makeTransit(
          fromCircle: SVGCircleElement | null, fromX: number,
          toCircle:   SVGCircleElement | null, toX:   number,
          duration: number,
        ) {
          let departed = false
          let arrived  = false
          return {
            cx: toX,
            duration,
            onBegin: () => {
              departed = false
              arrived  = false
              releaseFrom(fromCircle)
            },
            onUpdate: () => {
              const cx = parseFloat(dot.getAttribute('cx') || '0')
              if (!departed && Math.abs(cx - fromX) > BOUND) {
                departed = true
                departFrom(fromCircle)
              }
              if (!arrived && Math.abs(cx - toX) < BOUND) {
                arrived = true
                arriveAt(toCircle)
              }
            },
          }
        }

        const traverse = createTimeline({
          loop: true,
          defaults: { ease: 'inOutQuad' },
        })
        // Hold at Research (also fires once per loop iteration).
        traverse.add([dot, aura], { cx: 130, duration: 1400 })
        traverse.add([dot, aura], makeTransit(researchCircle, 130, designCircle,      400, 5500))
        traverse.add([dot, aura], { cx: 400, duration: 1400 })  // hold at Design
        traverse.add([dot, aura], makeTransit(designCircle,   400, developmentCircle, 670, 5500))
        traverse.add([dot, aura], { cx: 670, duration: 1400 })  // hold at Development
        traverse.add([dot, aura], makeTransit(developmentCircle, 670, researchCircle, 130, 1800))  // warp back

        // Breathing pulse — independent loops. Dot subtly grows; aura
        // grows further. Opacity is NO LONGER driven by the breath
        // (arriveAt / releaseFrom now own it) so the assimilation /
        // re-emergence transitions don't fight the breath cycle.
        animate(dot, {
          r: [6, 8.5, 6],
          duration: 2200,
          ease: 'inOutSine',
          loop: true,
        })
        animate(aura, {
          r: [12, 22, 12],
          duration: 2200,
          ease: 'inOutSine',
          loop: true,
        })
      },
    })
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

            {/* Pulsing traveller — slow loop along the timeline,
                breathing as it goes. Two circles: a soft outer aura
                that grows/shrinks with opacity flicker, and a sharp
                ink/crimson dot at the centre. Both share cx so they
                move together. */}
            <circle cx={130} cy={310} r={14} className="timeline-pulse-aura" />
            <circle cx={130} cy={310} r={6}  className="timeline-pulse-dot"  />

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
              <text x={400} y={50} className="roadmap-node-emoji">📋</text>
            </g>
            <text x={400} y={120} className="roadmap-node-label-above">Consultancy</text>

            {/* Three primary nodes along the timeline */}
            <g
              className="roadmap-node"
              data-node="research"
              onClick={() => onRoadmapNodeClick('research')}
            >
              <circle cx={130} cy={310} r={50} className="roadmap-node-circle" />
              <text x={130} y={310} className="roadmap-node-emoji">🔬</text>
            </g>
            <text x={130} y={400} className="roadmap-node-label">Research</text>

            <g
              className="roadmap-node"
              data-node="design"
              onClick={() => onRoadmapNodeClick('design')}
            >
              <circle cx={400} cy={310} r={50} className="roadmap-node-circle" />
              <text x={400} y={310} className="roadmap-node-emoji">🎨</text>
            </g>
            <text x={400} y={400} className="roadmap-node-label">Design</text>

            <g
              className="roadmap-node"
              data-node="development"
              onClick={() => onRoadmapNodeClick('development')}
            >
              <circle cx={670} cy={310} r={50} className="roadmap-node-circle" />
              <text x={670} y={310} className="roadmap-node-emoji">💻</text>
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
