import { useEffect, useRef, useState } from 'react'
import { mountHelix, type HelixHandle } from './helixScene'
import './Helix.css'

interface HelixProps {
  /** R&D Strands id ('kindred' / 'vitalis' / 'vitrix') currently selected. */
  selectedStrandId: string | null
  /** Called when scroll-snap picks a project, OR when the user clears. */
  onSelect: (id: string | null) => void
}

// Rod logo size — discrete (NOT a proportional lerp on scroll). The
// rod sits at exactly one of two sizes: large (when the helix section
// has just entered the viewport) or small (once the user has page-
// scrolled past the trigger threshold). CSS transition handles the
// visible morph between the two snapshots.
// Large default rod size restored — the previous 120 was too small,
// the brand mark didn't read at the top of the helix viewport. Small
// (used after the user has page-scrolled past the trigger threshold)
// kept compact so the rod doesn't cover too much of the helix scroll
// content as a sticky overlay.
const LARGE_ROD = 180
const SMALL_ROD = 56
// Page-scroll progress at which the rod flips from large → small.
// progress 0 = section just entering view; 1 = section's top has
// reached viewport top. ~0.45 means the rod minimises about halfway
// into the scroll-in.
const ROD_SHRINK_AT = 0.45

export default function Helix({ selectedStrandId, onSelect }: HelixProps) {
  const sectionRef = useRef<HTMLElement>(null)
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
  // Visible position of the selector line within the stage, expressed
  // as a fraction of stage height. Keep in sync with .helix-selector
  // `top: 60%` in Helix.css. 60% places the selector below the static
  // header overlay so it lands inside the visible scroll area.
  const SELECTOR_FRAC = 0.6

  // Rod logo size, driven by PAGE scroll (window.scrollY) — see effect
  // below. Initial state assumes the section hasn't entered view yet,
  // so logo starts large; it'll be set correctly on first scroll fire.
  const [rodSize, setRodSize] = useState(LARGE_ROD)

  // True while the user's cursor is hovering ANY strand button in the
  // RDStrands picker — also folds the rod compact (anticipates the
  // selection that's about to happen, signals which screen real
  // estate is about to matter).
  const [isStrandHovered, setIsStrandHovered] = useState(false)
  useEffect(() => {
    const handler = (e: Event) => {
      const hovering = !!(e as CustomEvent<{ hovering: boolean }>).detail?.hovering
      setIsStrandHovered(hovering)
    }
    document.addEventListener('mentheon:strand-hover', handler as EventListener)
    return () => document.removeEventListener('mentheon:strand-hover', handler as EventListener)
  }, [])

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

    function getProjectPxY(h: HelixHandle, vbY: number): number | null {
      const svg = stage.querySelector('.helix-svg') as SVGSVGElement | null
      if (!svg) return null
      const r = svg.getBoundingClientRect()
      if (r.width <= 0 || r.height <= 0) return null
      // preserveAspectRatio="xMidYMid meet" → uniform scale = min of the
      // two fits. The unused dimension gets centred bands. Account for
      // the top band offset so projects map to the right pixel Y.
      const scale = Math.min(r.width / h.viewBoxWidth, r.height / h.viewBoxHeight)
      const contentH = h.viewBoxHeight * scale
      const bandY = (r.height - contentH) / 2
      return bandY + vbY * scale
    }

    /** Selector line's actual top-of-line distance from the stage's top
     *  edge, in pixels. Reading this from the DOM (instead of trusting
     *  `stageH * SELECTOR_FRAC`) makes the snap pixel-perfect even when
     *  the selector's CSS positioning, the chevron line-height, or
     *  sub-pixel rendering nudges its true centre off the assumed mark. */
    function measuredSelectorOffset(): number {
      const sel = stage.parentElement?.querySelector('.helix-selector-line') as HTMLElement | null
      if (!sel) return stage.getBoundingClientRect().height * SELECTOR_FRAC
      const r = sel.getBoundingClientRect()
      const stageRect = stage.getBoundingClientRect()
      return (r.top + r.height / 2) - stageRect.top
    }

    function snapToNearest() {
      const h = handleRef.current
      if (!h || !stage) return
      const ys = h.getProjectViewboxYs()
      const ids = Object.keys(ys)
      if (ids.length === 0) return
      const selectorOffset = measuredSelectorOffset()
      const maxScroll = Math.max(0, stage.scrollHeight - stage.clientHeight)

      // For each project, compute the scrollTop that aligns its bead
      // with the selector line. CLAMP to the achievable [0, maxScroll]
      // window — projects whose natural ideal sits outside that window
      // (e.g. the topmost project on a compact SVG, whose ideal would
      // be negative) still get a usable snap point at the boundary.
      // Without clamping, the topmost project never wins the
      // distance-to-selector contest because its target is unreachable.
      const projects = ids
        .map(pid => {
          const pxY = getProjectPxY(h, ys[pid])
          if (pxY == null) return null
          const idealScroll = Math.max(0, Math.min(maxScroll, pxY - selectorOffset))
          return { id: pid, vbY: ys[pid], pxY, idealScroll }
        })
        .filter((p): p is NonNullable<typeof p> => p != null)
      if (!projects.length) return
      projects.sort((a, b) => a.idealScroll - b.idealScroll)

      // Partition [0, maxScroll] at midpoints between adjacent ideal
      // scrolls, so each project owns the range of scroll positions
      // that are closer to its ideal than to its neighbours'. Using
      // clamped ideals here guarantees each project — including any
      // topmost one whose natural ideal is negative — owns a non-empty
      // zone at one of the boundaries.
      let chosen = projects[0]
      for (let i = 0; i < projects.length; i++) {
        const start = i === 0
          ? 0
          : (projects[i - 1].idealScroll + projects[i].idealScroll) / 2
        const end = i === projects.length - 1
          ? Number.POSITIVE_INFINITY
          : (projects[i].idealScroll + projects[i + 1].idealScroll) / 2
        if (stage.scrollTop >= start && stage.scrollTop < end) {
          chosen = projects[i]
          break
        }
      }

      const rdId = HELIX_TO_RD[chosen.id] ?? chosen.id
      // Tightened deadzone — was 10 px which let the topmost (Kindreon)
      // and bottom-most (Acumentra) bubbles drift visibly off the
      // selector line because the snap wouldn't pull back when the
      // user's idle-scroll position fell anywhere within that band. 3
      // px is small enough to hide subpixel rendering jitter but big
      // enough that the snap still doesn't fight an exact landing.
      const SNAP_DEADZONE = 3
      if (Math.abs(stage.scrollTop - chosen.idealScroll) < SNAP_DEADZONE) {
        if (rdId !== lastReportedRdId.current) {
          lastReportedRdId.current = rdId
          onSelect(rdId)
        }
        return
      }

      programmaticScrollUntil.current = Date.now() + 700
      // Pass the fractional `idealScroll` straight through — modern
      // browsers honour sub-pixel scrollTop and will land the bead
      // exactly on the selector line. Rounding to integer here was the
      // last source of "almost-but-not-quite" misalignment for projects
      // whose pxY (= viewBox-Y × non-integer scale) fell on a fraction.
      stage.scrollTo({ top: chosen.idealScroll, behavior: 'smooth' })

      if (rdId !== lastReportedRdId.current) {
        lastReportedRdId.current = rdId
        onSelect(rdId)
      }
    }

    function onScroll() {
      // No upper-bound clamp on scrolling above the topmost project:
      // the snap-zoning algorithm in snapToNearest already pulls the
      // user back to whichever project owns the current scroll
      // position, including Kindreon when scrollTop is at 0. The old
      // clamp here forced scrollTop back UP to Kindreon's snap target
      // and early-returned without scheduling a snap, which on narrow
      // viewports (where the stage height shrinks below the assumed
      // 400 px and Kindreon's snap target becomes positive) silently
      // blocked Kindreon from ever being selected.
      if (Date.now() < programmaticScrollUntil.current) return
      if (snapTimer) window.clearTimeout(snapTimer)
      // Wait until scroll has been idle for ~150 ms before snapping.
      snapTimer = window.setTimeout(snapToNearest, 150)
    }

    stage.addEventListener('scroll', onScroll, { passive: true })

    // Initial scrollTop: position the FIRST project (kindreon) at the
    // selector line. Two reasons:
    //   1. Lets the user see the helix's primary project the moment
    //      the section comes into view (before they scroll inside).
    //   2. Pushes the SVG's own rod-icon (which still lives at the top
    //      of the viewBox) above the visible scroll area, so only the
    //      static header rod is visible — no duplicate rod glyph.
    requestAnimationFrame(() => {
      const ys = handle.getProjectViewboxYs()
      const firstY = ys.kindreon ?? Object.values(ys)[0]
      if (firstY == null) return
      const pxY = getProjectPxY(handle, firstY)
      if (pxY == null) return
      programmaticScrollUntil.current = Date.now() + 700
      // Sub-pixel scrollTop preserves perfect Kindreon alignment.
      stage.scrollTop = pxY - measuredSelectorOffset()
    })

    return () => {
      stage.removeEventListener('scroll', onScroll)
      if (snapTimer) window.clearTimeout(snapTimer)
      handle.cleanup()
      handleRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ----------------------------------------------------------------
     Page-scroll-driven rod size. Independent of the helix's own
     internal scroll: this is THE PAGE'S scrollY position.

     Progress = 0   when the section's top edge is at viewport bottom
                    (just entering view) → rod at LARGE_ROD.
     Progress = 1   when the section's top edge has reached viewport
                    top (section fully scrolled into / past view)
                    → rod at SMALL_ROD.
     Linear lerp in between, clamped at both ends so further scrolling
     past doesn't keep shrinking.
     ---------------------------------------------------------------- */
  useEffect(() => {
    function onWindowScroll() {
      // While a strand is open OR the cursor is hovering one of the
      // RDStrands buttons, force the rod to its small size — the
      // brand mark steps out of the way so the panel and helix get
      // the screen real estate. Wins over the page-scroll lerp
      // below regardless of where the section sits in the viewport.
      if (selectedStrandId !== null || isStrandHovered) {
        setRodSize(SMALL_ROD)
        return
      }
      const section = sectionRef.current
      if (!section) return
      const rect = section.getBoundingClientRect()
      const vh = window.innerHeight || document.documentElement.clientHeight
      // Progress: how far the section has scrolled UP relative to viewport.
      // rect.top = vh   → progress 0 (just entering)
      // rect.top = 0    → progress 1 (top hit viewport top)
      // rect.top < 0    → progress 1 (clamped; we're past the trigger zone)
      const raw = (vh - rect.top) / vh
      const progress = Math.max(0, Math.min(1, raw))
      // BINARY size — flip from large to small once we cross the
      // shrink threshold. CSS transition smooths the visible morph.
      setRodSize(progress < ROD_SHRINK_AT ? LARGE_ROD : SMALL_ROD)
    }
    window.addEventListener('scroll', onWindowScroll, { passive: true })
    window.addEventListener('resize', onWindowScroll)
    onWindowScroll()
    return () => {
      window.removeEventListener('scroll', onWindowScroll)
      window.removeEventListener('resize', onWindowScroll)
    }
  }, [selectedStrandId, isStrandHovered])

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
    const r = svg.getBoundingClientRect()
    if (r.width <= 0 || r.height <= 0) return
    const scale = Math.min(r.width / h.viewBoxWidth, r.height / h.viewBoxHeight)
    const contentH = h.viewBoxHeight * scale
    const bandY = (r.height - contentH) / 2
    const pxY = bandY + vbY * scale
    // Measure the actual selector-line position rather than assuming
    // stageH * SELECTOR_FRAC, so a click on a strand button lands the
    // bead exactly on the line (not 0.5–2 px off due to subpixel
    // rendering or selector flex-container sizing).
    const sel = stage.parentElement?.querySelector('.helix-selector-line') as HTMLElement | null
    const stageRect = stage.getBoundingClientRect()
    const selectorOffset = sel
      ? (sel.getBoundingClientRect().top + sel.getBoundingClientRect().height / 2) - stageRect.top
      : stageRect.height * SELECTOR_FRAC
    // Fractional scrollTop on purpose — see snapToNearest.
    const targetScroll = pxY - selectorOffset

    programmaticScrollUntil.current = Date.now() + 700
    lastReportedRdId.current = selectedStrandId
    stage.scrollTo({ top: targetScroll, behavior: 'smooth' })
  }, [selectedStrandId])

  return (
    <section className="helix" id="helix" ref={sectionRef}>
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
        {/* Static header overlay — rod logo + the protruding line.
            The line sits INSIDE the header so it shares the header's
            stacking context (z above bg, below rod img), letting the
            line pass through the rod's transparent pixels and continue
            unbroken below the header. The rod stays an OVERLAY (outside
            the scrollable stage); the line just visually overlaps it. */}
        <div className="helix-header" aria-hidden="true">
          <div className="helix-line" />
          <img
            className="helix-header-rod"
            src={`${import.meta.env.BASE_URL}rod-only.svg`}
            alt=""
            style={{ width: rodSize, height: rodSize }}
          />
        </div>
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
