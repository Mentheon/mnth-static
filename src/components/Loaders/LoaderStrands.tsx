/**
 * LoaderStrands — Mentheon loader, "conveyor strands" mechanic.
 *
 * Five horizontal strips of the mark slide in from alternating edges
 * (left, right, left, right, left) on an outQuart, then a crimson
 * commit-line draws outward from the centre at the base. Each landing
 * ticks the caption "strand · n of 5".
 *
 * Echoes the strand motif from § 12 of the design system: the mark
 * literally assembles from its own research threads.
 */

import { useEffect, useRef, useState } from 'react';
import { animate } from 'animejs';
import { TOKENS, MarkPaths, Stage, type LoaderMode } from './LoaderShared';

export interface LoaderStrandsProps {
  mode: LoaderMode;
  size?: number;
}

const STRIPS = [
  { y: 0,   from: -200 },
  { y: 39,  from:  200 },
  { y: 78,  from: -200 },
  { y: 117, from:  200 },
  { y: 156, from: -200 },
];

export const LoaderStrands = ({ mode, size = 180 }: LoaderStrandsProps) => {
  const t = TOKENS[mode];
  const welcomeRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const stripRefs = useRef<(SVGRectElement | null)[]>([null, null, null, null, null]);
  const tickRef = useRef<SVGLineElement>(null);
  const [captionText, setCaptionText] = useState('strand · 0 of 5');
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const welcome = welcomeRef.current;
    const caption = captionRef.current;
    const tick = tickRef.current;
    if (!welcome || !caption || !tick) return;

    const animations: ReturnType<typeof animate>[] = [];
    const timers: ReturnType<typeof setTimeout>[] = [];

    welcome.style.opacity = '0';
    caption.style.opacity = '0';
    stripRefs.current.forEach((r, i) => r && r.setAttribute('x', String(STRIPS[i].from)));
    tick.setAttribute('x1', '97.5');
    tick.setAttribute('x2', '97.5');

    animations.push(animate(welcome, { opacity: [0, 1], translateY: [-8, 0], duration: 500, ease: 'outQuad' }));
    animations.push(animate(caption, { opacity: [0, 0.7], duration: 400, delay: 200 }));

    let landed = 0;
    STRIPS.forEach((s, i) => {
      const rect = stripRefs.current[i];
      const state = { x: s.from };
      animations.push(animate(state, {
        x: 0,
        duration: 720, ease: 'outQuart',
        delay: 350 + i * 140,
        onUpdate: () => rect && rect.setAttribute('x', String(state.x)),
        onComplete: () => {
          landed += 1;
          setCaptionText(`strand · ${landed} of ${STRIPS.length}`);
        },
      }));
    });

    const totalDelay = 350 + (STRIPS.length - 1) * 140 + 720;
    const tickState = { half: 0 };
    animations.push(animate(tickState, {
      half: 90,
      duration: 600, ease: 'outQuart', delay: totalDelay + 100,
      onUpdate: () => {
        tick.setAttribute('x1', String(97.5 - tickState.half));
        tick.setAttribute('x2', String(97.5 + tickState.half));
      },
    }));

    timers.push(setTimeout(() => {
      animations.push(animate(caption, { opacity: [0.7, 0], duration: 400 }));
    }, totalDelay + 1000));

    return () => {
      timers.forEach(clearTimeout);
      animations.forEach(a => a.pause());
    };
  }, [nonce, mode]);

  return (
    <Stage
      mode={mode}
      welcomeRef={welcomeRef}
      captionRef={captionRef}
      captionText={captionText}
      onReplay={() => setNonce(n => n + 1)}>
      <svg viewBox="0 0 195 195" width={size} height={size} style={{ overflow: 'visible' }}>
        <defs>
          {STRIPS.map((s, i) => (
            <clipPath id={`mentheon-strand-clip-${mode}-${nonce}-${i}`} key={i}>
              <rect
                ref={(el) => { stripRefs.current[i] = el; }}
                x={s.from} y={s.y} width="195" height="39"
              />
            </clipPath>
          ))}
        </defs>
        {STRIPS.map((s, i) => (
          <g clipPath={`url(#mentheon-strand-clip-${mode}-${nonce}-${i})`} key={i}>
            <rect width="195" height="195" fill={t.mark} />
            <g fill={t.surface}><MarkPaths /></g>
          </g>
        ))}
        <line ref={tickRef} x1="97.5" y1="178" x2="97.5" y2="178" stroke="#A30B37" strokeWidth={2} />
      </svg>
    </Stage>
  );
};
