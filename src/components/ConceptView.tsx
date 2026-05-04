import { useEffect, useRef, useState } from 'react'
import { animate, createTimeline, stagger, utils } from 'animejs'
import RDStrands from './RDStrands'
import StrandPanel from './StrandPanel'
import Helix from './Helix'
import HomeMashup from './HomeMashup'
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

  // Which carousel section is currently in view — drives the side-pill
  // active-state indicator.
  const [currentSection, setCurrentSection] = useState<'a' | 'b' | 'c'>('a')

  /* IntersectionObserver — fires entrance when a section is mostly
     in view inside the snap scroller, AND tracks which section is
     active for the pill nav. */
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
          // Pill state — fires whenever a section becomes the dominant one.
          if (id === 'a' || id === 'b' || id === 'c') setCurrentSection(id)
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

  /* ---------- Section A: counter rollover + ECG ----- */
  function playSectionA() {
    const root = sectionARef.current
    if (!root) return
    const words   = Array.from(root.querySelectorAll<HTMLSpanElement>('[data-word]'))
    const letters = Array.from(root.querySelectorAll<HTMLSpanElement>('[data-letter]'))
    const ecgRoot = root.querySelector<HTMLSpanElement>('.concept-a-ecg')
    const ecgPath = root.querySelector<SVGPathElement>('.concept-a-ecg-trace')
    if (!words.length || !letters.length || !ecgPath) return

    // 1. Lead-up words fade in with stagger.
    utils.set(words,   { opacity: 0, translateY: 28 })
    utils.set(letters, { opacity: 0 })
    const tl = createTimeline({ defaults: { ease: 'outQuad' } })
    tl.add(words, {
      opacity: [0, 1],
      translateY: [28, 0],
      duration: 460,
      delay: stagger(110),
    })
    // 2. Letters fade in shortly after the words land — they appear
    //    immediately so the rollover has glyphs to scramble.
    tl.add(letters, { opacity: [0, 1], duration: 100, delay: stagger(100) }, '-=80')

    // 3. Counter rollover — each letter cycles through random
    //    lowercase glyphs before settling on its final character.
    const finals = ['f', 'a', 's', 't']
    const wordsTotal = words.length * 110 + 460
    letters.forEach((letter, i) => {
      const startDelay     = wordsTotal + i * 100
      const rollDurationMs = 600 + i * 200
      const startedAt      = performance.now()
      const handle = window.setInterval(() => {
        const elapsed = performance.now() - startedAt - startDelay
        if (elapsed < 0) return
        if (elapsed < rollDurationMs) {
          letter.textContent = String.fromCharCode(97 + Math.floor(Math.random() * 26))
        } else {
          letter.textContent = finals[i]
          window.clearInterval(handle)
        }
      }, 50)
    })

    // 4. ECG controller — fades in shortly after the punchline lands.
    startEcg(ecgPath, ecgRoot)
  }

  /* ---------- ECG: scrolling PQRST trace, amplitude = mouse velocity --
     The trace is a single SVG path composed from a queue of fixed-
     width "segments". Each frame:
       1. translate the whole path leftward at constant speed
       2. drop segments that have scrolled fully off-screen
       3. append fresh segments at the right edge to keep the buffer full
     Each appended segment is a heartbeat (PQRST) whose amplitude is
     determined by the CURRENT smoothed mouse velocity:
       cursor still       → tiny baseline ripples (amp ≈ 0.3)
       cursor moving fast → tall R-wave spikes  (amp ≈ 1.6)
     A separate mousemove listener computes pixels-per-ms velocity and
     feeds it into an EMA so the amplitude doesn't twitch frame-to-frame. */
  function startEcg(tracePath: SVGPathElement, root: HTMLSpanElement | null) {
    const VIEW_W       = 1600
    const VIEW_H       = 120
    const BASELINE_Y   = VIEW_H / 2
    const BEAT_W       = 86      // width of a single PQRST segment
    const PIXEL_SPEED  = 240     // viewBox units per second (faster scroll
                                 // = newly-amplified beats reach the eye sooner)
    const BUFFER_AHEAD = 0.4     // < 1 beat queued past the right edge,
                                 // so the live-amplitude rebake (below)
                                 // affects the very next beat to appear
    // Vertical scale — multiplies all Y-offsets so the heartbeat fills
    // the taller viewBox without having to retune every coefficient.
    const Y_SCALE      = 2.1

    type Pt = [number, number]
    interface Segment {
      pts: Pt[]
      startX: number
      width: number
      isBeat: boolean
    }

    const queue: Segment[] = []
    let pathOffset    = 0
    let segmentCursor = 0
    let amplitude     = 0           // smoothed amp; 0 = totally flat trace
    let displacement  = 0           // accumulated px moved, decays over time

    /* Flat-segment width is INVERSELY proportional to amplitude — this
       is what gives the trace a higher beat frequency when the cursor
       moves a lot. amp 0   → flat 260 (long inter-beat gap, but the
       beats themselves are flat too so it doesn't matter visually);
       amp 1.6 → flat 12   (rapid rhythm, beats almost back-to-back). */
    function currentFlatWidth(): number {
      return Math.max(12, 260 - amplitude * 155)
    }

    function pqrstSegment(amp: number): Pt[] {
      const padLeft = 6
      const x0 = padLeft
      const A = amp * Y_SCALE
      return [
        [0,           BASELINE_Y],
        [padLeft,     BASELINE_Y],
        // P wave
        [x0 + 4,      BASELINE_Y - 2 * A],
        [x0 + 8,      BASELINE_Y - 3 * A],
        [x0 + 12,     BASELINE_Y],
        // PR
        [x0 + 16,     BASELINE_Y],
        // Q
        [x0 + 20,     BASELINE_Y + 3 * A],
        // R (signature spike) — at x0 + 22 = 28 from segment start
        [x0 + 22,     BASELINE_Y - 22 * A],
        // S
        [x0 + 26,     BASELINE_Y + 6 * A],
        // ST
        [x0 + 32,     BASELINE_Y],
        // T wave
        [x0 + 40,     BASELINE_Y - 4 * A],
        [x0 + 50,     BASELINE_Y - 5 * A],
        [x0 + 60,     BASELINE_Y - 2 * A],
        [x0 + 70,     BASELINE_Y],
        [BEAT_W,      BASELINE_Y],
      ]
    }

    function flatSegment(width: number): Pt[] {
      const pts: Pt[] = []
      const steps = Math.max(4, Math.round(width / 14))
      // Baseline jitter scales with amplitude — at rest (amp 0) the line
      // is dead flat; only when the cursor is moving do we get any noise.
      const jitter = 1.2 * amplitude
      for (let i = 0; i <= steps; i++) {
        const x = (i / steps) * width
        const y = BASELINE_Y + (Math.random() - 0.5) * jitter
        pts.push([x, y])
      }
      return pts
    }

    function appendSegment() {
      const isBeat = (queue.length % 2) === 0
      if (isBeat) {
        queue.push({
          pts: pqrstSegment(amplitude),
          startX: segmentCursor,
          width: BEAT_W,
          isBeat: true,
        })
        segmentCursor += BEAT_W
      } else {
        const fw = currentFlatWidth()
        queue.push({
          pts: flatSegment(fw),
          startX: segmentCursor,
          width: fw,
          isBeat: false,
        })
        segmentCursor += fw
      }
    }

    function rebuildPath(): string {
      let d = ''
      for (const seg of queue) {
        for (let i = 0; i < seg.pts.length; i++) {
          const x = seg.startX + seg.pts[i][0] - pathOffset
          const y = seg.pts[i][1]
          d += (d === '' ? `M${x.toFixed(2)},${y.toFixed(2)}` : ` L${x.toFixed(2)},${y.toFixed(2)}`)
        }
      }
      return d
    }

    function tick(dtMs: number) {
      pathOffset += (PIXEL_SPEED * dtMs) / 1000

      // Map accumulated cursor displacement → target amplitude.
      //   no movement       → 0   (trace is dead flat — no pulses)
      //   ~45 px accumulated → ~1.0
      //   ~70 px accumulated → clamped at 1.6 (tall R-spikes)
      const targetAmp = Math.min(1.6, displacement * 0.022)
      // Snap fast — the user is looking for a 1:1 cursor-to-trace feel,
      // so don't over-smooth.
      amplitude += (targetAmp - amplitude) * Math.min(1, dtMs / 35)
      // Bleed off accumulated displacement so the trace settles back to
      // flat once the cursor stops moving (~350 ms half-life).
      displacement *= Math.max(0, 1 - dtMs / 350)
      // Snap to dead-flat once we're below a perceptible threshold —
      // prevents a long tail of micro-ripples after motion stops.
      if (displacement < 0.5) displacement = 0
      if (amplitude   < 0.02) amplitude   = 0

      // Drop segments that have scrolled fully off-screen on the left.
      while (queue.length > 0 && queue[0].startX + queue[0].width - pathOffset < -20) {
        queue.shift()
      }
      // Append new segments to keep the right-edge buffer full.
      while (segmentCursor - pathOffset < VIEW_W + BUFFER_AHEAD * BEAT_W) {
        appendSegment()
      }
      // Re-bake the most recent un-revealed beat AND flat with the
      // current live amplitude — moving the cursor immediately reshapes
      // the next beat to enter view (and the gap before it), instead of
      // having to wait for the next append cycle.
      for (let i = queue.length - 1; i >= 0; i--) {
        const seg = queue[i]
        // Only rebake segments still entirely off-screen (right of view).
        if (seg.startX - pathOffset < VIEW_W) break
        if (seg.isBeat) {
          seg.pts = pqrstSegment(amplitude)
        } else {
          const fw = currentFlatWidth()
          // Width changed → shift any later segments by the delta.
          const delta = fw - seg.width
          seg.pts = flatSegment(fw)
          seg.width = fw
          if (delta !== 0) {
            for (let j = i + 1; j < queue.length; j++) queue[j].startX += delta
            segmentCursor += delta
          }
        }
      }
      tracePath.setAttribute('d', rebuildPath())
    }

    let lastFrame = 0
    function loop(ts: number) {
      if (!lastFrame) lastFrame = ts
      const dt = ts - lastFrame
      lastFrame = ts
      tick(dt)
      requestAnimationFrame(loop)
    }

    // Pre-fill the queue so the trace appears already-running, not
    // crawling in from the right edge.
    while (segmentCursor < VIEW_W + BUFFER_AHEAD * BEAT_W) appendSegment()
    tracePath.setAttribute('d', rebuildPath())
    requestAnimationFrame(loop)

    // Cursor displacement tracking — accumulate raw px moved between
    // mousemove events (no time normalization). The tick loop bleeds
    // this off, so amplitude reflects HOW FAR the cursor has recently
    // travelled rather than how fast.
    let lastMouse: { x: number; y: number; seen: boolean } = { x: 0, y: 0, seen: false }
    window.addEventListener('mousemove', (e) => {
      if (lastMouse.seen) {
        const dx = e.clientX - lastMouse.x
        const dy = e.clientY - lastMouse.y
        displacement += Math.hypot(dx, dy)
      }
      lastMouse = { x: e.clientX, y: e.clientY, seen: true }
    }, { passive: true })

    // Fade the strip in once the punchline has settled.
    setTimeout(() => root?.classList.add('is-visible'), 1500)
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
        // travelling blob along the timeline. Two loops run in parallel:
        //   1. Traversal — translates cx between the three node x's
        //      with brief pauses at each, then warps back to start.
        //      Arrive/depart fire the bubble "join" effects below.
        //   2. Breath — gently pulses the blob's r on its own
        //      inOutSine loop, independent of position.
        const dot = root.querySelector('.timeline-pulse-dot') as SVGCircleElement | null
        if (!dot) return

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
          animate(dot, {
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
          // Blob re-emerges from inside the bubble, with a small
          // delay so it appears around the moment the bubble peaks.
          animate(dot, {
            opacity: [0, 1],
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

        // Initial state: blob is INVISIBLE (assimilated into Research)
        // and Research is already coloured crimson + slightly swollen.
        utils.set(dot, { opacity: 0 })
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
        traverse.add(dot, { cx: 130, duration: 1400 })
        traverse.add(dot, makeTransit(researchCircle, 130, designCircle,      400, 5500))
        traverse.add(dot, { cx: 400, duration: 1400 })  // hold at Design
        traverse.add(dot, makeTransit(designCircle,   400, developmentCircle, 670, 5500))
        traverse.add(dot, { cx: 670, duration: 1400 })  // hold at Development
        traverse.add(dot, makeTransit(developmentCircle, 670, researchCircle, 130, 1800))  // warp back

        // Breathing pulse — independent infinite loop on r only. The
        // blob gently swells then settles, like a soft heartbeat.
        // Opacity is NOT touched by the breath; arriveAt / releaseFrom
        // own opacity so the assimilation transitions stay clean.
        animate(dot, {
          r: [7, 10, 7],
          duration: 2400,
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

  /* Smooth-scroll the snap container to a specific section (used by
     the side pill nav). */
  function jumpTo(id: 'a' | 'b' | 'c') {
    const map = { a: sectionARef, b: sectionBRef, c: sectionCRef }
    map[id].current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Pills metadata — kept in render order top→bottom.
  const PILLS: Array<{ id: 'a' | 'b' | 'c'; label: string }> = [
    { id: 'a', label: 'Fast' },
    { id: 'b', label: 'We get it' },
    { id: 'c', label: 'R&D strands' },
  ]

  return (
    <div className="concept-scroller" ref={scrollerRef}>
      {/* Side pill nav — vertically centred against the viewport, shows
          which section is currently in view; click to jump there. Just a
          small dot per section; the active one fills crimson. */}
      <nav className="concept-pillnav" aria-label="Section navigation">
        {PILLS.map(p => (
          <button
            key={p.id}
            type="button"
            className={`concept-pill ${currentSection === p.id ? 'concept-pill--active' : ''}`}
            onClick={() => jumpTo(p.id)}
            aria-current={currentSection === p.id ? 'true' : undefined}
            aria-label={`Jump to ${p.label}`}
          >
            <span className="concept-pill-dot" aria-hidden="true" />
          </button>
        ))}
      </nav>

      {/* ============= a) Healthtech mashup carousel — main view of the
                          concepts page. The "Digital health is moving…
                          fast" headline overlays the rolling scenes. ============= */}
      <section
        className="concept-section concept-a concept-a--mashup"
        ref={sectionARef}
        data-section="a"
      >
        <HomeMashup showHeadline />
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
          <svg viewBox="0 -30 800 470" className="roadmap-svg" aria-label="Service roadmap">
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

            {/* Solid breathing blob that traverses the timeline.
                Single filled circle — gently pulses its radius for
                the "alive" feel. No outer halo / flicker. */}
            <circle cx={130} cy={310} r={8} className="timeline-pulse-dot" />

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
            <text x={400} y={-10} className="roadmap-node-label-above">Consultancy</text>

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
        <p className="concept-c-eyebrow">Some work of our own...</p>
        <div className="concept-c-host">
          {/* Single centred column: strand picker on top, helix in the
              middle, info panel below. While a strand is open the entire
              picker row collapses out of view (the panel header itself
              identifies the active strand), giving the slightly-shorter
              helix and the info panel enough room to sit together below. */}
          <div className={`concept-c-strands-area ${openStrand ? 'concept-c-strands-area--hidden' : ''}`}>
            <RDStrands openId={openStrandId} onSelect={setOpenStrandId} />
          </div>
          <div className="concept-c-helix-area">
            <Helix selectedStrandId={openStrandId} onSelect={setOpenStrandId} />
          </div>
          {openStrand && (
            <div className="concept-c-panel-area">
              <StrandPanel
                key={openStrand.id}
                strand={openStrand}
                isOpen={openStrandId !== null}
                onClose={() => setOpenStrandId(null)}
              />
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
