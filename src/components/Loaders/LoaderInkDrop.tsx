/**
 * LoaderInkDrop — Mentheon loader, "ink drop" mechanic.
 *
 * A single drop falls from the top, lands at the centre of the mark,
 * and dissolves into a growing disc that floods outward, revealing the
 * filled mark beneath. Caption ticks "dispersing · 0% → 100%".
 *
 * Reads as a research workbook moment — a pipette has just released a
 * sample onto a surface.
 */

import { useEffect, useRef, useState } from 'react';
import { animate } from 'animejs';
import { TOKENS, MarkPaths, Stage, type LoaderMode } from './LoaderShared';

export interface LoaderInkDropProps {
  mode: LoaderMode;
  size?: number;
}

export const LoaderInkDrop = ({ mode, size = 180 }: LoaderInkDropProps) => {
  const t = TOKENS[mode];
  const welcomeRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const dropRef = useRef<SVGEllipseElement>(null);
  const floodRef = useRef<SVGCircleElement>(null);
  const [captionText, setCaptionText] = useState('falling');
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const welcome = welcomeRef.current;
    const caption = captionRef.current;
    const drop = dropRef.current;
    const flood = floodRef.current;
    if (!welcome || !caption || !drop || !flood) return;

    const animations: ReturnType<typeof animate>[] = [];

    welcome.style.opacity = '0';
    caption.style.opacity = '0';
    drop.setAttribute('cy', '-10');
    drop.setAttribute('opacity', '1');
    drop.setAttribute('rx', '4');
    drop.setAttribute('ry', '6');
    flood.setAttribute('r', '0');

    animations.push(animate(welcome, { opacity: [0, 1], translateY: [-8, 0], duration: 500, ease: 'outQuad' }));
    animations.push(animate(caption, { opacity: [0, 0.7], duration: 400, delay: 200 }));

    const dropState = { cy: -10, stretch: 1 };
    animations.push(animate(dropState, {
      cy: 97.5, stretch: 1.6,
      duration: 700, delay: 350, ease: 'inQuad',
      onUpdate: () => {
        drop.setAttribute('cy', String(dropState.cy));
        drop.setAttribute('rx', String(4 / dropState.stretch));
        drop.setAttribute('ry', String(6 * dropState.stretch));
      },
      onComplete: () => {
        drop.setAttribute('opacity', '0');
        const floodState = { r: 0 };
        animations.push(animate(floodState, {
          r: 145,
          duration: 1700, ease: 'outQuart',
          onUpdate: () => {
            flood.setAttribute('r', String(floodState.r));
            const pct = Math.round(Math.min(100, (floodState.r / 110) * 100));
            setCaptionText(`dispersing · ${pct}%`);
          },
          onComplete: () => {
            animations.push(animate(caption, { opacity: [0.7, 0], duration: 400, delay: 300 }));
          },
        }));
      },
    }));

    return () => { animations.forEach(a => a.pause()); };
  }, [nonce, mode]);

  const clipId = `mentheon-flood-clip-${mode}-${nonce}`;
  return (
    <Stage
      mode={mode}
      welcomeRef={welcomeRef}
      captionRef={captionRef}
      captionText={captionText}
      onReplay={() => setNonce(n => n + 1)}>
      <svg viewBox="0 0 195 195" width={size} height={size} style={{ overflow: 'visible' }}>
        <defs>
          <clipPath id={clipId}>
            <circle ref={floodRef} cx="97.5" cy="97.5" r="0" />
          </clipPath>
        </defs>
        <rect x="0" y="0" width="195" height="195" fill="none" stroke={t.mark} strokeOpacity={0.12} strokeWidth={1} />
        <ellipse ref={dropRef} cx="97.5" cy="-10" rx="4" ry="6" fill={t.mark} />
        <g clipPath={`url(#${clipId})`}>
          <rect width="195" height="195" fill={t.mark} />
          <g fill={t.surface}><MarkPaths /></g>
        </g>
      </svg>
    </Stage>
  );
};
