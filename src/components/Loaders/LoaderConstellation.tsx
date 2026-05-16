/**
 * LoaderConstellation — Mentheon loader, "constellation" mechanic.
 *
 * Twenty-four dots fly in from random offscreen positions to settle at
 * hand-picked points within the symbol — the mark assembling itself
 * from scattered stars finding their constellation. Once all are placed
 * the full filled mark fades in over the top and the loose stars fade
 * out. Caption ticks "stars · 0 of 24 → 24 of 24".
 *
 * The most overtly playful of the five; reads as a research-instrument
 * tracking points coming into focus.
 */

import { useEffect, useRef, useState } from 'react';
import { animate } from 'animejs';
import { TOKENS, MarkPaths, Stage, type LoaderMode } from './LoaderShared';

export interface LoaderConstellationProps {
  mode: LoaderMode;
  size?: number;
}

// 24 hand-picked targets within the symbol portion of the mark.
const TARGETS = [
  { x: 122, y: 56 }, { x: 116, y: 65 }, { x: 113, y: 75 }, { x: 115, y: 86 },
  { x: 122, y: 94 }, { x: 132, y: 96 }, { x: 142, y: 94 }, { x: 149, y: 88 },
  { x: 153, y: 78 }, { x: 152, y: 67 }, { x: 145, y: 58 }, { x: 138, y: 53 },
  { x: 130, y: 65 }, { x: 140, y: 70 }, { x: 145, y: 78 }, { x: 138, y: 85 },
  { x: 132, y: 78 }, { x: 138, y: 72 },
  { x: 123, y: 68 }, { x: 158, y: 68 },
  { x: 140, y: 105 }, { x: 140, y: 100 },
  { x: 156, y: 49 }, { x: 121, y: 49 },
];

export const LoaderConstellation = ({ mode, size = 180 }: LoaderConstellationProps) => {
  const t = TOKENS[mode];
  const welcomeRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(SVGCircleElement | null)[]>([]);
  const commitRef = useRef<SVGGElement>(null);
  const [captionText, setCaptionText] = useState(`stars · 0 of ${TARGETS.length}`);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const welcome = welcomeRef.current;
    const caption = captionRef.current;
    const commit = commitRef.current;
    if (!welcome || !caption || !commit) return;

    const animations: ReturnType<typeof animate>[] = [];
    const timers: ReturnType<typeof setTimeout>[] = [];

    welcome.style.opacity = '0';
    caption.style.opacity = '0';
    commit.setAttribute('opacity', '0');

    animations.push(animate(welcome, { opacity: [0, 1], translateY: [-8, 0], duration: 500, ease: 'outQuad' }));
    animations.push(animate(caption, { opacity: [0, 0.7], duration: 400, delay: 200 }));

    let landed = 0;
    TARGETS.forEach((tgt, i) => {
      const dot = dotRefs.current[i];
      if (!dot) return;
      const angle = Math.random() * Math.PI * 2;
      const dist = 180 + Math.random() * 80;
      const ox = 97.5 + Math.cos(angle) * dist;
      const oy = 97.5 + Math.sin(angle) * dist;
      dot.setAttribute('cx', String(ox));
      dot.setAttribute('cy', String(oy));
      dot.setAttribute('opacity', '0');

      const state = { cx: ox, cy: oy, op: 0 };
      animations.push(animate(state, {
        cx: tgt.x, cy: tgt.y, op: 1,
        duration: 900 + Math.random() * 300,
        ease: 'outCubic',
        delay: 350 + i * 55,
        onUpdate: () => {
          dot.setAttribute('cx', String(state.cx));
          dot.setAttribute('cy', String(state.cy));
          dot.setAttribute('opacity', String(state.op));
        },
        onComplete: () => {
          landed += 1;
          setCaptionText(`stars · ${landed} of ${TARGETS.length}`);
        },
      }));
    });

    const settleAt = 350 + TARGETS.length * 55 + 1100;
    timers.push(setTimeout(() => {
      animations.push(animate(commit, { opacity: [0, 1], duration: 700, ease: 'inOutQuad' }));
      dotRefs.current.forEach(d => {
        if (!d) return;
        animations.push(animate(d, {
          opacity: [parseFloat(d.getAttribute('opacity') || '1'), 0],
          duration: 600, ease: 'outQuad',
        }));
      });
      animations.push(animate(caption, { opacity: [0.7, 0], duration: 400, delay: 400 }));
    }, settleAt));

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
      <svg viewBox="0 0 195 195" width={size} height={size}>
        <rect x="0" y="0" width="195" height="195" fill="none" stroke={t.mark} strokeOpacity={0.12} strokeWidth={1} />
        {TARGETS.map((_, i) => (
          <circle
            key={`${nonce}-${i}`}
            ref={(el) => { dotRefs.current[i] = el; }}
            cx="0" cy="0" r="1.6" fill={t.mark} opacity="0"
          />
        ))}
        <g ref={commitRef} opacity="0">
          <rect width="195" height="195" fill={t.mark} />
          <g fill={t.surface}><MarkPaths /></g>
        </g>
      </svg>
    </Stage>
  );
};
