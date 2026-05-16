/**
 * LoaderWave — Mentheon loader, faithful wave-fill mechanic.
 *
 * The mark fills from the bottom in the chosen mode's mark colour, with
 * a tide of ~2.4s. In light mode the rising tide is plum over cream; in
 * dark mode it is cream over plum. Same mechanic, mirrored palette.
 *
 * Animation: anime.js v4. Cleanup follows the design-system pattern
 * (pause animations + clear timers on unmount or replay).
 */

import { useEffect, useRef, useState } from 'react';
import { animate } from 'animejs';
import { TOKENS, MarkPaths, Stage, type LoaderMode } from './LoaderShared';

export interface LoaderWaveProps {
  /** Light: plum-on-cream. Dark: cream-on-plum. */
  mode: LoaderMode;
  /** SVG width/height in px. Defaults to 180. */
  size?: number;
  /** Fires once, ~1.1s after the fill completes (lets the final
   *  flourish read). Used by Helix3D to advance the boot sequence;
   *  optional, so the standalone gallery use is unaffected. */
  onDone?: () => void;
}

export const LoaderWave = ({ mode, size = 180, onDone }: LoaderWaveProps) => {
  const t = TOKENS[mode];
  const welcomeRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const waveRectRef = useRef<SVGRectElement>(null);
  const logoRef = useRef<SVGSVGElement>(null);
  const [captionText, setCaptionText] = useState('filling · 0%');
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const wr = waveRectRef.current;
    const welcome = welcomeRef.current;
    const caption = captionRef.current;
    const logo = logoRef.current;
    if (!wr || !welcome || !caption || !logo) return;

    const animations: ReturnType<typeof animate>[] = [];
    const timers: ReturnType<typeof setTimeout>[] = [];

    welcome.style.opacity = '0';
    caption.style.opacity = '0';
    wr.setAttribute('y', '195');
    wr.setAttribute('height', '0');
    logo.style.transform = 'scale(1)';

    animations.push(animate(welcome, {
      opacity: [0, 1], translateY: [-8, 0], duration: 500, ease: 'outQuad',
    }));
    animations.push(animate(caption, {
      opacity: [0, 0.7], duration: 400, delay: 200,
    }));

    const state = { y: 195 };
    animations.push(animate(state, {
      y: -5,
      duration: 2400, ease: 'inOutQuad', delay: 250,
      onUpdate: () => {
        const h = 195 - state.y;
        wr.setAttribute('y', String(state.y));
        wr.setAttribute('height', String(h + 10));
        setCaptionText(`filling · ${Math.round(Math.min(100, (h / 195) * 100))}%`);
      },
      onComplete: () => {
        animations.push(animate(logo, { scale: [1, 1.04, 1], duration: 600, ease: 'inOutQuad' }));
        animations.push(animate(caption, { opacity: [0.7, 0], duration: 400, delay: 400 }));
        if (onDone) timers.push(setTimeout(onDone, 1100));
      },
    }));

    return () => {
      timers.forEach(clearTimeout);
      animations.forEach(a => a.pause());
    };
  }, [nonce, mode]);

  const clipId = `mentheon-wave-clip-${mode}-${nonce}`;
  return (
    <Stage
      mode={mode}
      welcomeRef={welcomeRef}
      captionRef={captionRef}
      captionText={captionText}
      onReplay={() => setNonce(n => n + 1)}>
      <svg ref={logoRef} viewBox="0 0 195 195" width={size} height={size} style={{ overflow: 'visible' }}>
        <defs>
          <clipPath id={clipId}>
            <rect ref={waveRectRef} x="0" y="195" width="195" height="195" />
          </clipPath>
        </defs>
        <rect x="0" y="0" width="195" height="195" fill="none" stroke={t.mark} strokeOpacity={0.18} strokeWidth={1} />
        <g clipPath={`url(#${clipId})`}>
          <rect width="195" height="195" fill={t.mark} />
          <g fill={t.surface}><MarkPaths /></g>
        </g>
      </svg>
    </Stage>
  );
};
