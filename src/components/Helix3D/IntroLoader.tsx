/**
 * IntroLoader — Mentheon first-paint splash.
 *
 * Renders ONE of five CSS-driven loader concepts, chosen at random
 * per mount: l1 ink-rise, l2 stroke-trace, l3 scatter-assembly,
 * l4 cascade+readout, l5 iris-reveal. The animation loops; there is
 * intentionally NO auto-advance to the sound/silent gate — the user
 * dismisses it with the temporary "enter" button (wired to onEnter,
 * which Helix3D bridges into the boot sequence). Further work on the
 * post-loader flow is deferred.
 *
 * The mechanic-specific CSS lives in helix3d.css under
 * `.helix3d-root .loader-art.<variant>`; this file only renders the
 * structure each concept expects. The mark itself is the shared
 * <MentheonMark> so all five use one artwork source.
 */
import { useEffect, useMemo, useRef } from 'react';
import MentheonMark from './MentheonMark';

const VARIANTS = ['l1', 'l2', 'l3', 'l4', 'l5'] as const;
type Variant = (typeof VARIANTS)[number];

// Loop length per concept (ms) — kept in step with the CSS keyframe
// durations so the % readout tracks the visible fill.
const DURATIONS: Record<Variant, number> = {
  l1: 3400, l2: 3600, l3: 3600, l4: 4200, l5: 3400,
};
const CAPTIONS: Record<Variant, string> = {
  l1: 'filling', l2: 'tracing', l3: 'assembling', l4: 'composing', l5: 'opening',
};

export default function IntroLoader({ onEnter }: { onEnter: () => void }) {
  // Random once per mount (a dev re-render / fresh boot re-rolls it).
  const variant = useMemo<Variant>(
    () => VARIANTS[Math.floor(Math.random() * VARIANTS.length)],
    [],
  );
  const pctRef = useRef<HTMLSpanElement>(null);

  // Drive the caption % in lockstep with the concept's loop.
  useEffect(() => {
    const dur = DURATIONS[variant];
    const t0 = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      const span = pctRef.current;
      if (span) {
        const p = ((now - t0) % dur) / dur;
        const v = Math.min(100, Math.round(p < 0.85 ? (p / 0.85) * 100 : 100));
        span.textContent = String(v).padStart(2, '0');
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [variant]);

  return (
    <>
      <span className="loader-corner loader-corner--tl" />
      <span className="loader-corner loader-corner--tr" />
      <span className="loader-corner loader-corner--bl" />
      <span className="loader-corner loader-corner--br" />
      <div className="loader-welcome"><span className="star">✲</span>welcome to mentheon</div>

      <div className={`loader-art ${variant}`}>
        <div
          className="loader-stage"
          style={variant === 'l4' ? { flexDirection: 'column', height: 'auto' } : undefined}
        >
          <div className="logo-tile">
            <span className="tile-bg" />
            {variant === 'l2' ? (
              <>
                <svg className="trace" viewBox="0 0 195 195" aria-hidden="true"><MentheonMark /></svg>
                <svg className="ink" viewBox="0 0 195 195" aria-hidden="true"><MentheonMark /></svg>
              </>
            ) : (
              <svg className="ink" viewBox="0 0 195 195" aria-hidden="true"><MentheonMark /></svg>
            )}
            {variant === 'l1' && <span className="tide-line" />}
            {variant === 'l5' && <span className="iris-ring" />}
          </div>

          {variant === 'l4' && (
            <div className="readout" aria-hidden="true">
              <div className="readout-row"><span className="readout-dot dot-1" /><b>emblem</b><span>set</span></div>
              <div className="readout-row"><span className="readout-dot dot-2" /><b>men</b><span>set</span></div>
              <div className="readout-row"><span className="readout-dot dot-3" /><b>theon</b><span>set</span></div>
            </div>
          )}
        </div>
      </div>

      <div className="loader-caption">
        {CAPTIONS[variant]} · <span className="pct" ref={pctRef}>00</span>%
      </div>

      {/* Temporary explicit advance — replaces the auto-handoff to the
          sound/silent gate (deferred work). */}
      <button type="button" className="loader-enter" onClick={onEnter}>enter ↦</button>
    </>
  );
}
