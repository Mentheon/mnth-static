/**
 * LoaderTypeOn — Mentheon loader, "type-on" mechanic.
 *
 * The symbol portion of the mark flashes up (a flashbulb), then the
 * wordmark "MENTHEON" types itself out letter-by-letter beneath it
 * with a blinking cursor — like a terminal startup. On commit, the
 * typed text is replaced by the faithful filled-path wordmark to land
 * cleanly on the same final frame as the other variants.
 *
 * Hooks into the JetBrains Mono "system voice" the design system
 * establishes — this is the most explicitly instrumented variant.
 */

import { useEffect, useRef, useState } from 'react';
import { animate } from 'animejs';
import { TOKENS, MarkPaths, Stage, type LoaderMode } from './LoaderShared';

export interface LoaderTypeOnProps {
  mode: LoaderMode;
  size?: number;
}

const WORD = 'MENTHEON';

export const LoaderTypeOn = ({ mode, size = 180 }: LoaderTypeOnProps) => {
  const t = TOKENS[mode];
  const welcomeRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const glyphRef = useRef<SVGGElement>(null);
  const [captionText, setCaptionText] = useState('> _');
  const [typed, setTyped] = useState('');
  const [cursorOn, setCursorOn] = useState(true);
  const [showWordmark, setShowWordmark] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const welcome = welcomeRef.current;
    const caption = captionRef.current;
    const glyph = glyphRef.current;
    if (!welcome || !caption || !glyph) return;

    const animations: ReturnType<typeof animate>[] = [];
    const timers: ReturnType<typeof setTimeout>[] = [];
    let blink: ReturnType<typeof setInterval> | null = null;

    welcome.style.opacity = '0';
    caption.style.opacity = '0';
    setTyped('');
    setShowWordmark(false);
    setCaptionText('> _');
    setCursorOn(true);
    glyph.setAttribute('opacity', '0');

    animations.push(animate(welcome, { opacity: [0, 1], translateY: [-8, 0], duration: 500, ease: 'outQuad' }));
    animations.push(animate(caption, { opacity: [0, 0.7], duration: 400, delay: 200 }));

    // flashbulb in
    animations.push(animate(glyph, {
      opacity: [0, 1, 0.4, 1], duration: 700, delay: 400, ease: 'outQuad',
    }));

    // start typing after the flash
    const typeStart = 1200;
    for (let i = 1; i <= WORD.length; i += 1) {
      timers.push(setTimeout(() => {
        const slice = WORD.slice(0, i);
        setTyped(slice);
        setCaptionText(`> ${slice.toLowerCase()}_`);
      }, typeStart + i * 130));
    }

    // cursor blink
    let on = true;
    blink = setInterval(() => { on = !on; setCursorOn(on); }, 480);

    // commit: swap typed text for the faithful wordmark glyph
    const commitAt = typeStart + WORD.length * 130 + 400;
    timers.push(setTimeout(() => {
      setShowWordmark(true);
      setCursorOn(false);
      animations.push(animate(caption, { opacity: [0.7, 0], duration: 400, delay: 200 }));
    }, commitAt));

    return () => {
      timers.forEach(clearTimeout);
      if (blink) clearInterval(blink);
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        {/* symbol portion (clipped above the wordmark line by viewBox crop) */}
        <svg viewBox="0 0 195 100" width={size * 0.9} height={size * 0.46}>
          <g ref={glyphRef}>
            <rect x="0" y="0" width="195" height="195" fill={t.mark} />
            <g fill={t.surface}><MarkPaths /></g>
          </g>
        </svg>
        {/* typed or final wordmark */}
        <div style={{ height: size * 0.18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {showWordmark ? (
            <svg viewBox="0 95 195 45" width={size * 0.9} height={size * 0.21}>
              <g fill={t.mark}><MarkPaths /></g>
            </svg>
          ) : (
            <span style={{
              fontFamily: "'Lato', sans-serif",
              fontWeight: 900, fontSize: size * 0.16,
              letterSpacing: '0.04em', color: t.mark, lineHeight: 1,
            }}>
              {typed}
              <span style={{
                display: 'inline-block', width: '0.5em',
                color: t.mark, opacity: cursorOn ? 1 : 0,
                transition: 'opacity 80ms linear',
              }}>▮</span>
            </span>
          )}
        </div>
      </div>
    </Stage>
  );
};
