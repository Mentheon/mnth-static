import { useEffect, useRef } from 'react'
import { mountHelix, type HelixHandle } from './helixScene'
import './Helix.css'

interface HelixProps {
  /** R&D Strands id ('kindred' / 'vitalis' / 'vitrix') currently selected. */
  selectedStrandId: string | null
  /** Called when scroll-snap picks a project, OR when the user clears. */
  onSelect: (id: string | null) => void
}

export default function Helix({ selectedStrandId, onSelect }: HelixProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const legendRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const panelIconRef = useRef<HTMLDivElement>(null)
  const panelNameRef = useRef<HTMLHeadingElement>(null)
  const panelTaglineRef = useRef<HTMLParagraphElement>(null)
  const panelThemesRef = useRef<HTMLDivElement>(null)
  const panelCtaRowRef = useRef<HTMLDivElement>(null)
  const panelCtaRef = useRef<HTMLAnchorElement>(null)
  const panelCloseRef = useRef<HTMLButtonElement>(null)

  const handleRef = useRef<HelixHandle | null>(null)
  // While > Date.now(), scroll events ignore snap-to-nearest. Used so a
  // programmatic scrollTo (driven by an external selectedStrandId change)
  // doesn't immediately re-fire the snap callback and form a feedback loop.
  const programmaticScrollUntil = useRef(0)
  // Last id we passed up via onSelect — avoids re-firing when scroll
  // settles on the same project we already reported.
  const lastReportedRdId = useRef<string | null>(null)

  // Helix-project-id ↔ R&D-Strands-id maps (the R&D Strands data uses
  // legacy ids 'kindred'/'vitalis'/'vitrix'; the helix uses
  // 'kindreon'/'aevorix'/'acumentra'). The mapping is mirrored on
  // PROJECTS in helixScene.ts via the rdStrandsId field.
  const HELIX_TO_RD: Record<string, string> = {
    kindreon: 'kindred',
    aevorix:  'vitalis',
    acumentra: 'vitrix',
  }
  const RD_TO_HELIX: Record<string, string> = {
    kindred:  'kindreon',
    vitalis:  'aevorix',
    vitrix:   'acumentra',
  }

  /* ----------------------------------------------------------------
     Mount the helix scene + wire scroll-snap. Run ONCE on mount.
     ---------------------------------------------------------------- */
  useEffect(() => {
    if (
      !stageRef.current || !legendRef.current || !panelRef.current ||
      !tooltipRef.current || !panelIconRef.current || !panelNameRef.current ||
      !panelTaglineRef.current || !panelThemesRef.current ||
      !panelCtaRowRef.current || !panelCtaRef.current ||
      !panelCloseRef.current
    ) return

    const handle = mountHelix({
      stageEl: stageRef.current,
      legendEl: legendRef.current,
      panelEl: panelRef.current,
      tooltipEl: tooltipRef.current,
      panelIconEl: panelIconRef.current,
      panelNameEl: panelNameRef.current,
      panelTaglineEl: panelTaglineRef.current,
      panelThemesEl: panelThemesRef.current,
      panelCtaRow: panelCtaRowRef.current,
      panelCta: panelCtaRef.current,
      panelCloseBtn: panelCloseRef.current,
    })
    handleRef.current = handle

    const stage = stageRef.current
    let snapTimer: number | null = null

    function snapToNearest() {
      const h = handleRef.current
      if (!h || !stage) return
      const ys = h.getProjectViewboxYs()
      const ids = Object.keys(ys)
      if (ids.length === 0) return
      const svg = stage.querySelector('.helix-svg') as SVGSVGElement | null
      if (!svg) return
      const svgPxH = svg.getBoundingClientRect().height
      if (svgPxH <= 0) return
      const scale = svgPxH / h.viewBoxHeight
      const stageH = stage.getBoundingClientRect().height
      const centerScroll = stage.scrollTop + stageH / 2

      let bestHelixId: string | null = null
      let bestDist = Infinity
      for (const pid of ids) {
        const pxY = ys[pid] * scale
        const dist = Math.abs(pxY - centerScroll)
        if (dist < bestDist) { bestDist = dist; bestHelixId = pid }
      }
      if (!bestHelixId) return

      // Smooth-scroll the chosen project to the selector center.
      const targetScroll = ys[bestHelixId] * scale - stageH / 2
      programmaticScrollUntil.current = Date.now() + 700
      stage.scrollTo({ top: targetScroll, behavior: 'smooth' })

      const rdId = HELIX_TO_RD[bestHelixId] ?? bestHelixId
      if (rdId !== lastReportedRdId.current) {
        lastReportedRdId.current = rdId
        onSelect(rdId)
      }
    }

    function onScroll() {
      if (Date.now() < programmaticScrollUntil.current) return
      if (snapTimer) window.clearTimeout(snapTimer)
      // Wait until scroll has been idle for ~150 ms before snapping.
      snapTimer = window.setTimeout(snapToNearest, 150)
    }

    stage.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      stage.removeEventListener('scroll', onScroll)
      if (snapTimer) window.clearTimeout(snapTimer)
      handle.cleanup()
      handleRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ----------------------------------------------------------------
     Two-way binding: when an R&D Strands button is clicked elsewhere,
     selectedStrandId flips. Scroll the helix so that project lines
     up under the selector AND mirror the selection into the helix's
     own appearance (dim/highlight).
     ---------------------------------------------------------------- */
  useEffect(() => {
    const h = handleRef.current
    const stage = stageRef.current
    if (!h || !stage) return

    // Mirror selection state into helix appearance.
    h.setSelected(selectedStrandId)

    // If the selection came from this helix's own snap, we already
    // scrolled — skip the (redundant) programmatic scroll.
    if (selectedStrandId !== null && selectedStrandId === lastReportedRdId.current) return

    if (selectedStrandId == null) return  // closing the panel doesn't move the helix
    const helixId = RD_TO_HELIX[selectedStrandId]
    if (!helixId) return
    const ys = h.getProjectViewboxYs()
    const vbY = ys[helixId]
    if (vbY == null) return
    const svg = stage.querySelector('.helix-svg') as SVGSVGElement | null
    if (!svg) return
    const svgPxH = svg.getBoundingClientRect().height
    if (svgPxH <= 0) return
    const scale = svgPxH / h.viewBoxHeight
    const stageH = stage.getBoundingClientRect().height
    const targetScroll = vbY * scale - stageH / 2

    programmaticScrollUntil.current = Date.now() + 700
    lastReportedRdId.current = selectedStrandId
    stage.scrollTo({ top: targetScroll, behavior: 'smooth' })
  }, [selectedStrandId])

  return (
    <section className="helix" id="helix">
      <div className="helix-key">
        <div className="helix-key-item">
          <span className="helix-key-glyph">
            <svg width="30" height="14"><line x1="0" y1="7" x2="30" y2="7" stroke="#A30B37" strokeWidth="3.5" strokeLinecap="round" /></svg>
          </span>
          <span><strong>Strand</strong> = research domain</span>
        </div>
        <div className="helix-key-item">
          <span className="helix-key-glyph">
            <svg width="30" height="14"><circle cx="15" cy="7" r="5" fill="#3F0247" stroke="#2F0147" strokeWidth="2" /></svg>
          </span>
          <span><strong>Bead</strong> = project on one domain</span>
        </div>
        <div className="helix-key-item">
          <span className="helix-key-glyph">
            <svg width="30" height="14">
              <line x1="4" y1="7" x2="26" y2="7" stroke="#2F0147" strokeWidth="6" strokeLinecap="round" />
              <circle cx="4" cy="7" r="4" fill="#A30B37" stroke="#2F0147" strokeWidth="2" />
              <circle cx="26" cy="7" r="4" fill="#9C528B" stroke="#2F0147" strokeWidth="2" />
            </svg>
          </span>
          <span><strong>Capsule</strong> = project bridging two or more domains</span>
        </div>
      </div>

      <div className="helix-viewport">
        <div className="helix-selector" aria-hidden="true">
          <span className="helix-selector-chev">&rsaquo;</span>
          <span className="helix-selector-line" />
          <span className="helix-selector-chev">&lsaquo;</span>
        </div>
        <div className="helix-stage" ref={stageRef} data-orientation="vertical"></div>
      </div>

      <div className="helix-legend" ref={legendRef}></div>

      <div className="panel" ref={panelRef} aria-hidden="true">
        <div className="panelInner">
          <div className="cornerCropPanel" aria-hidden="true"></div>
          <button className="closeButton" ref={panelCloseRef} aria-label="Close">&times;</button>
          <div className="panelHeader">
            <div className="headerIconCircle" ref={panelIconRef}></div>
            <div className="headerText">
              <h2 className="strandName" ref={panelNameRef}></h2>
              <p className="tagline" ref={panelTaglineRef}></p>
            </div>
          </div>
          <div className="themeGrid" ref={panelThemesRef}></div>
          <div className="ctaRow" ref={panelCtaRowRef} style={{ display: 'none' }}>
            <a href="#" className="ctaLink" ref={panelCtaRef}>
              See full work strand
              <span className="ctaArrow" aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>
      </div>

      <div className="helix-tooltip" ref={tooltipRef}></div>
    </section>
  )
}
