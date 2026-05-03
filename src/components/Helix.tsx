import { useEffect, useRef } from 'react'
import { mountHelix } from './helixScene'
import './Helix.css'

export default function Helix() {
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
  const toggleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (
      !stageRef.current || !legendRef.current || !panelRef.current ||
      !tooltipRef.current || !panelIconRef.current || !panelNameRef.current ||
      !panelTaglineRef.current || !panelThemesRef.current ||
      !panelCtaRowRef.current || !panelCtaRef.current ||
      !panelCloseRef.current || !toggleRef.current
    ) return

    const orientationButtons = Array.from(
      toggleRef.current.querySelectorAll<HTMLButtonElement>('button')
    )

    return mountHelix({
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
      orientationButtons,
    })
  }, [])

  return (
    <section className="helix" id="helix">
      <div className="helix-head">
        <div className="helix-head-text">
          <div className="helix-eyebrow">Research domains, woven around a single staff</div>
          <h2 className="helix-title"><span className="thin">A research practice,</span> entwined</h2>
          <p className="helix-blurb">
            The four disciplines we work in wrap around a central axis &mdash; alternating
            front and back as they descend, the way a single strand wraps a physician&rsquo;s
            staff. Where two disciplines share a research conversation, a small dashed rung
            marks it. Concrete projects sit on (and sometimes between) the strands.
          </p>
        </div>
        <div className="helix-toolbar">
          <div className="orientation-toggle" ref={toggleRef}>
            <button className="is-active" data-orientation="vertical">Vertical</button>
            <button data-orientation="horizontal">Horizontal</button>
          </div>
        </div>
      </div>

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
        <div className="helix-key-item">
          <span className="helix-key-glyph">
            <svg width="30" height="14">
              <line x1="0" y1="7" x2="30" y2="7" stroke="#2F0147" strokeWidth="1.25" strokeDasharray="2 4" />
              <circle cx="15" cy="7" r="3.5" fill="#FFECE1" stroke="#2F0147" strokeWidth="1.25" />
            </svg>
          </span>
          <span><strong>Rung</strong> = conceptual convergence</span>
        </div>
      </div>

      <div className="helix-stage" ref={stageRef} data-orientation="vertical"></div>
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
