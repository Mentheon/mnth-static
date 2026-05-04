/* ============================================================
   SectionAMashup.tsx
   ============================================================
   A chained sequence of healthtech vignettes that play through
   in order, then resolve into the "Digital health is moving…fast"
   headline + scroll cue.

   Scene order (ten scenes, chained):
     1. helix       — DNA strand unzips & dissolves
     2. molecule    — atoms fly in & bond into a ring
     3. cell        — single cell divides exponentially
     4. neural      — network nodes light up in waves
     5. mri         — slice-by-slice scan sweep
     6. rings       — wearable activity rings fill
     7. pills       — capsules cascade & burst
     8. ehr         — terminal log types out trends
     9. defib       — paddles charge & shock the screen
    10. ecg         — flatline drops, scroll cue appears

   Each scene is a {key, duration, enter, exit} object on a single
   <svg> overlay. Edit the SCENES array to reorder or skip.

   Imports: anime.js (peer dep, already in this project's stack).
   Styling: relies on the same CSS variables ConceptView.css uses
     (--bg, --ink, --crimson, --grape, --plum). No new tokens.
   ============================================================ */

import { useEffect, useRef } from 'react';
import anime from 'animejs';
import styles from './SectionAMashup.module.css';

const SVG_NS = 'http://www.w3.org/2000/svg';

/* ECG path generator (reused by defib + ecg scenes). amp scales the
   complex height; beats sets how many PQRST cycles span the strip. */
function buildECGPath(amp: number, beats: number, w = 800, midY = 65): string {
  let d = `M 0 ${midY}`;
  const beatW = w / beats;
  for (let i = 0; i < beats; i++) {
    const x0 = i * beatW;
    d += ` L ${x0 + beatW * 0.10} ${midY}`;
    d += ` Q ${x0 + beatW * 0.14} ${midY + 6 * amp} ${x0 + beatW * 0.18} ${midY}`;
    d += ` L ${x0 + beatW * 0.32} ${midY}`;
    d += ` L ${x0 + beatW * 0.36} ${midY + 4 * amp}`;
    d += ` L ${x0 + beatW * 0.40} ${midY - 44 * amp}`;
    d += ` L ${x0 + beatW * 0.44} ${midY + 18 * amp}`;
    d += ` L ${x0 + beatW * 0.48} ${midY - 2 * amp}`;
    d += ` L ${x0 + beatW * 0.62} ${midY}`;
    d += ` Q ${x0 + beatW * 0.72} ${midY - 12 * amp} ${x0 + beatW * 0.82} ${midY}`;
    d += ` L ${x0 + beatW} ${midY}`;
  }
  return d;
}

interface Scene {
  key: string;
  label: string;          // shown in the corner readout while this scene plays
  duration: number;       // ms before next scene starts
  enter: (ctx: SceneContext) => void;
  exit?: (ctx: SceneContext) => void;
}

interface SceneContext {
  layer: SVGGElement;        // dedicated <g> for this scene's elements
  setReadout: (left: string, right: string) => void;
}

const SectionAMashup = () => {
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const fastWordRef = useRef<HTMLSpanElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const readoutLRef = useRef<HTMLSpanElement>(null);
  const readoutRRef = useRef<HTMLSpanElement>(null);

  const timeoutsRef = useRef<number[]>([]);
  /* Tracks whether the sequence is actively playing — read inside
     long-running scene callbacks (cell division's recursive setTimeout)
     so we can stop cleanly on reset. */
  const isPlayingRef = useRef(true);

  /* Clear any pending scene timeouts when we restart or unmount. */
  const clearAllTimers = () => {
    timeoutsRef.current.forEach(id => clearTimeout(id));
    timeoutsRef.current = [];
  };

  const setReadout = (left: string, right: string) => {
    if (readoutLRef.current) readoutLRef.current.textContent = left;
    if (readoutRRef.current) readoutRRef.current.textContent = right;
  };

  /* -------------------- scenes -------------------- */

  const sceneHelix = (ctx: SceneContext) => {
    ctx.setReadout('Sequencing', '0 / 3,200 bp');
    const N = 50;
    const cx = 400, midY = 260, span = 720, ampX = 80;
    const rungs: { rung: SVGLineElement; c1: SVGCircleElement; c2: SVGCircleElement; y1: number; y2: number }[] = [];

    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const x = (cx - span / 2) + t * span;
      const phase = t * Math.PI * 6;
      const y1 = midY + Math.sin(phase) * ampX * 0.55;
      const y2 = midY - Math.sin(phase) * ampX * 0.55;

      const rung = document.createElementNS(SVG_NS, 'line');
      rung.setAttribute('x1', String(x));
      rung.setAttribute('y1', String(y1));
      rung.setAttribute('x2', String(x));
      rung.setAttribute('y2', String(y2));
      rung.setAttribute('stroke', i % 2 ? 'var(--crimson)' : 'var(--ink)');
      rung.setAttribute('stroke-width', '2');
      rung.setAttribute('opacity', '0');
      ctx.layer.appendChild(rung);

      const c1 = document.createElementNS(SVG_NS, 'circle');
      c1.setAttribute('cx', String(x));
      c1.setAttribute('cy', String(y1));
      c1.setAttribute('r', '3.5');
      c1.setAttribute('fill', 'var(--ink)');
      c1.setAttribute('opacity', '0');
      ctx.layer.appendChild(c1);

      const c2 = document.createElementNS(SVG_NS, 'circle');
      c2.setAttribute('cx', String(x));
      c2.setAttribute('cy', String(y2));
      c2.setAttribute('r', '3.5');
      c2.setAttribute('fill', 'var(--crimson)');
      c2.setAttribute('opacity', '0');
      ctx.layer.appendChild(c2);

      rungs.push({ rung, c1, c2, y1, y2 });
    }

    anime({
      targets: rungs.flatMap(r => [r.rung, r.c1, r.c2]),
      opacity: [0, 0.7],
      duration: 400,
      delay: anime.stagger(8),
      easing: 'easeOutQuad'
    });

    /* Rung counter ticking up while strands assemble. */
    anime({
      targets: { v: 0 },
      v: 3200,
      round: 1,
      duration: 1100,
      delay: 200,
      easing: 'easeOutQuad',
      update: (a: any) => {
        if (readoutRRef.current) readoutRRef.current.textContent = `${a.animations[0].currentValue.toLocaleString()} / 3,200 bp`;
      }
    });

    /* Unzip and dissolve to make room for the next scene. */
    rungs.forEach((r, i) => {
      anime({
        targets: r.rung,
        opacity: [0.7, 0],
        duration: 300,
        delay: 1500 + i * 12,
        easing: 'easeInQuad'
      });
      anime({
        targets: r.c1,
        cy: r.y1 - 60,
        opacity: [1, 0],
        duration: 600,
        delay: 1500 + i * 12,
        easing: 'easeInQuad'
      });
      anime({
        targets: r.c2,
        cy: r.y2 + 60,
        opacity: [1, 0],
        duration: 600,
        delay: 1500 + i * 12,
        easing: 'easeInQuad'
      });
    });
  };

  const sceneMolecule = (ctx: SceneContext) => {
    ctx.setReadout('Docking ligand', 'ΔG -- kcal/mol');

    const cx = 400, cy = 260;
    const targets: { x: number; y: number; kind: 'C' | 'H' | 'N' | 'O' }[] = [];
    const ringR = 70;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      targets.push({ x: cx + Math.cos(a) * ringR, y: cy + Math.sin(a) * ringR, kind: 'C' });
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      targets.push({ x: cx + Math.cos(a) * (ringR + 42), y: cy + Math.sin(a) * (ringR + 42), kind: 'H' });
    }
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.4;
      targets.push({ x: cx + Math.cos(a) * (ringR + 85), y: cy + Math.sin(a) * (ringR + 85), kind: 'N' });
    }

    const bonds = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0],
                   [0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11]];
    const colors: Record<string, string> = { C: 'var(--ink)', H: 'var(--plum)', N: 'var(--crimson)', O: 'var(--crimson)' };
    const radii: Record<string, number> = { C: 8, H: 4.5, N: 7, O: 7 };

    const atoms = targets.map(t => {
      const startX = Math.random() * 800;
      const startY = Math.random() * 520;
      const c = document.createElementNS(SVG_NS, 'circle');
      c.setAttribute('cx', String(startX));
      c.setAttribute('cy', String(startY));
      c.setAttribute('r', String(radii[t.kind]));
      c.setAttribute('fill', colors[t.kind]);
      c.setAttribute('stroke', 'var(--bg)');
      c.setAttribute('stroke-width', '1.5');
      c.setAttribute('opacity', '0');
      ctx.layer.appendChild(c);
      return { el: c, target: t };
    });

    atoms.forEach((a, i) => {
      anime({
        targets: a.el,
        cx: a.target.x,
        cy: a.target.y,
        opacity: [0, 1],
        duration: 800,
        delay: i * 40,
        easing: 'easeInOutCubic'
      });
    });

    setTimeout(() => {
      bonds.forEach((pair, i) => {
        const a = atoms[pair[0]].target;
        const b = atoms[pair[1]].target;
        const line = document.createElementNS(SVG_NS, 'line');
        line.setAttribute('x1', String(a.x));
        line.setAttribute('y1', String(a.y));
        line.setAttribute('x2', String(a.x));
        line.setAttribute('y2', String(a.y));
        line.setAttribute('stroke', 'var(--ink)');
        line.setAttribute('stroke-width', '1.5');
        line.setAttribute('opacity', '0.7');
        /* Bonds render under atoms — insert at the start of the layer. */
        ctx.layer.insertBefore(line, ctx.layer.firstChild);
        anime({
          targets: line,
          x2: b.x,
          y2: b.y,
          duration: 300,
          delay: i * 30,
          easing: 'easeOutQuad'
        });
      });
    }, 900);

    anime({
      targets: { v: 0 },
      v: -42.7,
      duration: 900,
      delay: 700,
      easing: 'easeOutQuad',
      update: (a: any) => {
        if (readoutRRef.current) readoutRRef.current.textContent = `ΔG ${a.animations[0].currentValue.toFixed(1)} kcal/mol`;
      }
    });
  };

  const sceneCell = (ctx: SceneContext) => {
    ctx.setReadout('Cell culture · t = 0h', 'Pop. 1');

    type Cell = { el: SVGGElement; x: number; y: number; r: number };
    const makeCell = (x: number, y: number, r: number): Cell => {
      const g = document.createElementNS(SVG_NS, 'g');
      g.setAttribute('transform', `translate(${x} ${y})`);
      const outer = document.createElementNS(SVG_NS, 'circle');
      outer.setAttribute('r', String(r));
      outer.setAttribute('fill', 'rgba(163,11,55,0.18)');
      outer.setAttribute('stroke', 'var(--crimson)');
      outer.setAttribute('stroke-width', '1.5');
      const nuc = document.createElementNS(SVG_NS, 'circle');
      nuc.setAttribute('r', String(r * 0.45));
      nuc.setAttribute('fill', 'var(--ink)');
      g.appendChild(outer);
      g.appendChild(nuc);
      return { el: g, x, y, r };
    };

    let cells: Cell[] = [];
    const initial = makeCell(400, 260, 30);
    ctx.layer.appendChild(initial.el);
    cells.push(initial);

    const generations = 5;
    let elapsed = 0;
    let step = 0;

    const divideAll = () => {
      elapsed += 4;
      const newCells: Cell[] = [];

      cells.forEach(cell => {
        const { x, y, r } = cell;
        const newR = Math.max(7, r * 0.78);
        const ang = Math.random() * Math.PI * 2;
        const sep = r * 1.1;
        const c1x = Math.max(60, Math.min(740, x + Math.cos(ang) * sep + (Math.random() * 30 - 15)));
        const c1y = Math.max(80, Math.min(440, y + Math.sin(ang) * sep + (Math.random() * 30 - 15)));
        const c2x = Math.max(60, Math.min(740, x - Math.cos(ang) * sep + (Math.random() * 30 - 15)));
        const c2y = Math.max(80, Math.min(440, y - Math.sin(ang) * sep + (Math.random() * 30 - 15)));

        const child1 = makeCell(x, y, newR);
        const child2 = makeCell(x, y, newR);
        ctx.layer.appendChild(child1.el);
        ctx.layer.appendChild(child2.el);
        cell.el.remove();

        anime({
          targets: { x, y },
          x: c1x, y: c1y,
          duration: 500,
          easing: 'easeOutCubic',
          update: (a: any) => {
            const cx = a.animations[0].currentValue;
            const cy = a.animations[1].currentValue;
            child1.el.setAttribute('transform', `translate(${cx} ${cy})`);
            child1.x = cx; child1.y = cy;
          }
        });
        anime({
          targets: { x, y },
          x: c2x, y: c2y,
          duration: 500,
          easing: 'easeOutCubic',
          update: (a: any) => {
            const cx = a.animations[0].currentValue;
            const cy = a.animations[1].currentValue;
            child2.el.setAttribute('transform', `translate(${cx} ${cy})`);
            child2.x = cx; child2.y = cy;
          }
        });

        newCells.push(child1, child2);
      });

      cells = newCells;
      ctx.setReadout(`Cell culture · t = ${elapsed}h`, `Pop. ${cells.length.toLocaleString()}`);
    };

    const tickDivision = () => {
      if (step < generations && isPlayingRef.current) {
        divideAll();
        step++;
        const id = window.setTimeout(tickDivision, 380);
        timeoutsRef.current.push(id);
      }
    };
    const id = window.setTimeout(tickDivision, 200);
    timeoutsRef.current.push(id);
  };

  const sceneNeural = (ctx: SceneContext) => {
    ctx.setReadout('Forward pass', 'epoch 0000');

    const layers = [5, 8, 8, 6, 3];
    const startX = 130, endX = 670;
    const layerSpacing = (endX - startX) / (layers.length - 1);
    const nodes: { el: SVGCircleElement; x: number; y: number }[][] = [];

    layers.forEach((count, li) => {
      const x = startX + li * layerSpacing;
      const totalH = 320;
      const gap = totalH / (count + 1);
      const layerNodes: { el: SVGCircleElement; x: number; y: number }[] = [];
      for (let i = 0; i < count; i++) {
        const y = 100 + gap * (i + 1);
        const c = document.createElementNS(SVG_NS, 'circle');
        c.setAttribute('cx', String(x));
        c.setAttribute('cy', String(y));
        c.setAttribute('r', '6');
        c.setAttribute('fill', 'var(--bg)');
        c.setAttribute('stroke', 'var(--ink)');
        c.setAttribute('stroke-width', '1.5');
        c.setAttribute('opacity', '0');
        ctx.layer.appendChild(c);
        layerNodes.push({ el: c, x, y });
      }
      nodes.push(layerNodes);
    });

    /* Edges connect every node in layer N to every node in layer N+1. */
    const edges: { line: SVGLineElement; layer: number }[] = [];
    for (let li = 0; li < layers.length - 1; li++) {
      nodes[li].forEach(a => {
        nodes[li + 1].forEach(b => {
          const line = document.createElementNS(SVG_NS, 'line');
          line.setAttribute('x1', String(a.x));
          line.setAttribute('y1', String(a.y));
          line.setAttribute('x2', String(b.x));
          line.setAttribute('y2', String(b.y));
          line.setAttribute('stroke', 'var(--ink)');
          line.setAttribute('stroke-width', '0.5');
          line.setAttribute('opacity', '0');
          ctx.layer.insertBefore(line, ctx.layer.firstChild);
          edges.push({ line, layer: li });
        });
      });
    }

    anime({
      targets: edges.map(e => e.line),
      opacity: [0, 0.18],
      duration: 400,
      delay: anime.stagger(2),
      easing: 'easeOutQuad'
    });

    nodes.forEach((layer, li) => {
      anime({
        targets: layer.map(n => n.el),
        opacity: [0, 1],
        duration: 300,
        delay: 200 + li * 100,
        easing: 'easeOutQuad'
      });
    });

    /* Forward-pass pulses: each pulse propagates through layers L→R. */
    const firePulse = () => {
      layers.forEach((_, li) => {
        if (li === 0) return;
        setTimeout(() => {
          const subset = edges.filter(e => e.layer === li - 1);
          const sample = [...subset].sort(() => Math.random() - 0.5).slice(0, Math.floor(subset.length * 0.4));
          sample.forEach(e => {
            anime({
              targets: e.line,
              opacity: [0.18, 0.85, 0.18],
              stroke: ['var(--ink)', 'var(--crimson)', 'var(--ink)'],
              strokeWidth: [0.5, 1.6, 0.5],
              duration: 300,
              easing: 'easeInOutQuad'
            });
          });
          nodes[li].forEach(n => {
            anime({
              targets: n.el,
              fill: ['var(--bg)', 'var(--crimson)', 'var(--bg)'],
              r: [6, 9, 6],
              duration: 300,
              easing: 'easeInOutQuad'
            });
          });
        }, li * 90);
      });
    };
    timeoutsRef.current.push(window.setTimeout(firePulse, 800));
    timeoutsRef.current.push(window.setTimeout(firePulse, 1500));

    anime({
      targets: { v: 0 },
      v: 4096,
      round: 1,
      duration: 2200,
      easing: 'easeInQuad',
      update: (a: any) => {
        if (readoutRRef.current) readoutRRef.current.textContent = `epoch ${String(a.animations[0].currentValue).padStart(4, '0')}`;
      }
    });
  };

  const sceneMRI = (ctx: SceneContext) => {
    ctx.setReadout('MRI · T1', 'Slice 000 / 240');

    const COLS = 28, ROWS = 14;
    const W = 800;
    const cw = W / COLS;
    const ch = (440 - 80) / ROWS;
    const cells: SVGRectElement[] = [];

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = c * cw;
        const y = 80 + r * ch;
        const dx = (c - COLS / 2) / (COLS / 2);
        const dy = (r - ROWS / 2) / (ROWS / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 1.05) continue;
        const intensity = Math.max(0, 1 - dist) * (0.4 + Math.random() * 0.6);
        const rect = document.createElementNS(SVG_NS, 'rect');
        rect.setAttribute('x', String(x));
        rect.setAttribute('y', String(y));
        rect.setAttribute('width', String(cw + 0.5));
        rect.setAttribute('height', String(ch + 0.5));
        /* Mix cream → ink based on intensity, mimicking MRI grayscale. */
        const purple = [47, 1, 71];
        const cream = [255, 236, 225];
        const rr = Math.round(cream[0] * (1 - intensity) + purple[0] * intensity);
        const gg = Math.round(cream[1] * (1 - intensity) + purple[1] * intensity);
        const bb = Math.round(cream[2] * (1 - intensity) + purple[2] * intensity);
        rect.setAttribute('fill', `rgb(${rr},${gg},${bb})`);
        rect.setAttribute('opacity', '0');
        ctx.layer.appendChild(rect);
        cells.push(rect);
      }
    }

    /* Sweep line marker. */
    const sweep = document.createElementNS(SVG_NS, 'line');
    sweep.setAttribute('y1', '60');
    sweep.setAttribute('y2', '460');
    sweep.setAttribute('stroke', 'var(--crimson)');
    sweep.setAttribute('stroke-width', '2');
    sweep.setAttribute('opacity', '0.8');
    sweep.setAttribute('x1', '0');
    sweep.setAttribute('x2', '0');
    ctx.layer.appendChild(sweep);

    anime({
      targets: sweep,
      x1: [0, 800],
      x2: [0, 800],
      duration: 1500,
      easing: 'easeInOutQuad'
    });
    anime({
      targets: sweep,
      opacity: [0.8, 0],
      duration: 300,
      delay: 1500,
      easing: 'easeOutQuad'
    });

    cells.forEach(rect => {
      const x = parseFloat(rect.getAttribute('x') || '0');
      const delay = (x / 800) * 1400;
      anime({
        targets: rect,
        opacity: [0, 1],
        duration: 200,
        delay: delay + Math.random() * 80,
        easing: 'easeOutQuad'
      });
    });

    anime({
      targets: { v: 0 },
      v: 240,
      round: 1,
      duration: 1500,
      easing: 'easeInOutQuad',
      update: (a: any) => {
        if (readoutRRef.current) readoutRRef.current.textContent = `Slice ${String(a.animations[0].currentValue).padStart(3, '0')} / 240`;
      }
    });
  };

  const sceneRings = (ctx: SceneContext) => {
    ctx.setReadout('Daily activity', '04 May 2026');

    /* Three concentric rings (move/exercise/stand metaphor). */
    const ringDefs = [
      { r: 80, color: 'var(--crimson)', target: 502.6 - 0, base: 502.6 },
      { r: 60, color: 'var(--plum)', target: 376.99 - 30, base: 376.99 },
      { r: 40, color: 'var(--ink)', target: 251.32 - 60, base: 251.32 }
    ];

    const group = document.createElementNS(SVG_NS, 'g');
    group.setAttribute('transform', 'translate(280 260)');
    ctx.layer.appendChild(group);

    ringDefs.forEach((def) => {
      /* Background track. */
      const track = document.createElementNS(SVG_NS, 'circle');
      track.setAttribute('r', String(def.r));
      track.setAttribute('fill', 'none');
      track.setAttribute('stroke', 'rgba(47,1,71,0.1)');
      track.setAttribute('stroke-width', '14');
      group.appendChild(track);

      /* Active arc, drawn by animating stroke-dashoffset. */
      const ring = document.createElementNS(SVG_NS, 'circle');
      ring.setAttribute('r', String(def.r));
      ring.setAttribute('fill', 'none');
      ring.setAttribute('stroke', def.color);
      ring.setAttribute('stroke-width', '14');
      ring.setAttribute('stroke-linecap', 'round');
      ring.setAttribute('stroke-dasharray', String(def.base));
      ring.setAttribute('stroke-dashoffset', String(def.base));
      ring.setAttribute('transform', 'rotate(-90)');
      group.appendChild(ring);

      anime({
        targets: ring,
        strokeDashoffset: [def.base, def.target],
        duration: 1500,
        delay: 100,
        easing: 'easeOutQuart'
      });
    });

    /* Three stat readouts to the right of the rings. */
    const stats = [
      { label: 'Steps', target: 12847, format: (v: number) => v.toLocaleString(), color: 'var(--crimson)', y: 180 },
      { label: 'Active kcal', target: 642, format: (v: number) => String(v), color: 'var(--plum)', y: 260 },
      { label: 'HRV (ms)', target: 78, format: (v: number) => String(v), color: 'var(--ink)', y: 340 }
    ];

    stats.forEach((s, i) => {
      const lbl = document.createElementNS(SVG_NS, 'text');
      lbl.setAttribute('x', '480');
      lbl.setAttribute('y', String(s.y - 14));
      lbl.setAttribute('font-family', 'Lato, sans-serif');
      lbl.setAttribute('font-size', '11');
      lbl.setAttribute('letter-spacing', '0.16em');
      lbl.setAttribute('fill', 'var(--ink)');
      lbl.setAttribute('opacity', '0.6');
      lbl.textContent = s.label.toUpperCase();
      ctx.layer.appendChild(lbl);

      const val = document.createElementNS(SVG_NS, 'text');
      val.setAttribute('x', '480');
      val.setAttribute('y', String(s.y + 18));
      val.setAttribute('font-family', 'Lato, sans-serif');
      val.setAttribute('font-size', '32');
      val.setAttribute('font-weight', '900');
      val.setAttribute('fill', s.color);
      val.textContent = '0';
      ctx.layer.appendChild(val);

      anime({
        targets: { v: 0 },
        v: s.target,
        round: 1,
        duration: 1500,
        delay: i * 150,
        easing: 'easeOutQuart',
        update: (a: any) => {
          val.textContent = s.format(a.animations[0].currentValue);
        }
      });
    });
  };

  const scenePills = (ctx: SceneContext) => {
    ctx.setReadout('Rx', 'Dispensed 0');

    const N = 12;
    const colors: [string, string][] = [
      ['var(--ink)', 'var(--crimson)'],
      ['var(--crimson)', 'var(--bg)'],
      ['var(--plum)', 'var(--ink)'],
      ['var(--ink)', 'var(--plum)']
    ];
    const pills: { el: SVGGElement; x: number; y: number; rot: number; endY: number; endRot: number }[] = [];

    for (let i = 0; i < N; i++) {
      const x = 80 + Math.random() * 640;
      const startY = -60 - Math.random() * 200;
      const endY = 460 + Math.random() * 40;
      const rot0 = Math.random() * 360;
      const rot1 = rot0 + (Math.random() * 720 - 360);
      const c = colors[i % colors.length];

      const g = document.createElementNS(SVG_NS, 'g');
      g.setAttribute('transform', `translate(${x} ${startY}) rotate(${rot0})`);
      const w = 50, h = 20;
      const r1 = document.createElementNS(SVG_NS, 'rect');
      r1.setAttribute('x', String(-w / 2));
      r1.setAttribute('y', String(-h / 2));
      r1.setAttribute('width', String(w / 2));
      r1.setAttribute('height', String(h));
      r1.setAttribute('rx', String(h / 2));
      r1.setAttribute('fill', c[0]);
      const r2 = document.createElementNS(SVG_NS, 'rect');
      r2.setAttribute('x', '0');
      r2.setAttribute('y', String(-h / 2));
      r2.setAttribute('width', String(w / 2));
      r2.setAttribute('height', String(h));
      r2.setAttribute('rx', String(h / 2));
      r2.setAttribute('fill', c[1]);
      g.appendChild(r1);
      g.appendChild(r2);
      ctx.layer.appendChild(g);

      pills.push({ el: g, x, y: startY, rot: rot0, endY, endRot: rot1 });
    }

    pills.forEach((p, i) => {
      anime({
        targets: p,
        y: p.endY,
        rot: p.endRot,
        duration: 900 + Math.random() * 300,
        delay: i * 60,
        easing: 'easeInQuad',
        update: () => {
          p.el.setAttribute('transform', `translate(${p.x} ${p.y}) rotate(${p.rot})`);
        }
      });
    });

    anime({
      targets: { v: 0 },
      v: N,
      round: 1,
      duration: 1500,
      easing: 'linear',
      update: (a: any) => {
        if (readoutRRef.current) readoutRRef.current.textContent = `Dispensed ${a.animations[0].currentValue}`;
      }
    });
  };

  const sceneEHR = (ctx: SceneContext) => {
    ctx.setReadout('Clinical workspace', '09:14 · session 9F-7741');

    const lines: { text: string; flag?: boolean; dim?: boolean }[] = [
      { text: '> SELECT * FROM trends WHERE year = 2026' },
      { text: '  ◉ AI diagnostics approved      +1247' },
      { text: '  ◉ Wearables in trials          ×3.2' },
      { text: '  ◉ Whole-genome cost            $200' },
      { text: '  ◉ Telehealth visits / yr       84M' },
      { text: '> velocity exceeds baseline', flag: true }
    ];

    const startY = 100;
    const lineH = 26;

    lines.forEach((entry, idx) => {
      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', '80');
      text.setAttribute('y', String(startY + idx * lineH));
      text.setAttribute('font-family', 'Courier New, monospace');
      text.setAttribute('font-size', '14');
      text.setAttribute('fill', entry.flag ? 'var(--crimson)' : 'var(--ink)');
      if (entry.flag) text.setAttribute('font-weight', '700');
      if (entry.dim) text.setAttribute('opacity', '0.55');
      ctx.layer.appendChild(text);

      const obj = { i: 0 };
      anime({
        targets: obj,
        i: entry.text.length,
        round: 1,
        duration: entry.text.length * 18,
        delay: idx * 280,
        easing: 'linear',
        update: () => {
          text.textContent = entry.text.slice(0, obj.i);
        }
      });
    });
  };

  const sceneDefib = (ctx: SceneContext) => {
    ctx.setReadout('Defibrillator', 'Charging 0J');

    /* Charge bar — built as SVG rect for consistency with other scenes. */
    const trackW = 280;
    const barX = (800 - trackW) / 2;
    const barY = 240;

    const track = document.createElementNS(SVG_NS, 'rect');
    track.setAttribute('x', String(barX));
    track.setAttribute('y', String(barY));
    track.setAttribute('width', String(trackW));
    track.setAttribute('height', '6');
    track.setAttribute('rx', '3');
    track.setAttribute('fill', 'rgba(47,1,71,0.12)');
    ctx.layer.appendChild(track);

    const fill = document.createElementNS(SVG_NS, 'rect');
    fill.setAttribute('x', String(barX));
    fill.setAttribute('y', String(barY));
    fill.setAttribute('width', '0');
    fill.setAttribute('height', '6');
    fill.setAttribute('rx', '3');
    fill.setAttribute('fill', 'var(--crimson)');
    ctx.layer.appendChild(fill);

    const clearLbl = document.createElementNS(SVG_NS, 'text');
    clearLbl.setAttribute('x', '400');
    clearLbl.setAttribute('y', '290');
    clearLbl.setAttribute('text-anchor', 'middle');
    clearLbl.setAttribute('font-family', 'Lato, sans-serif');
    clearLbl.setAttribute('font-size', '64');
    clearLbl.setAttribute('font-weight', '900');
    clearLbl.setAttribute('letter-spacing', '4');
    clearLbl.setAttribute('fill', 'var(--crimson)');
    clearLbl.setAttribute('opacity', '0');
    clearLbl.textContent = 'CLEAR';
    ctx.layer.appendChild(clearLbl);

    anime({
      targets: fill,
      width: [0, trackW],
      duration: 1100,
      easing: 'easeInQuad'
    });
    anime({
      targets: { v: 0 },
      v: 200,
      round: 1,
      duration: 1100,
      easing: 'easeInQuad',
      update: (a: any) => {
        if (readoutRRef.current) readoutRRef.current.textContent = `Charging ${a.animations[0].currentValue}J`;
      }
    });

    setTimeout(() => {
      anime({
        targets: clearLbl,
        opacity: [0, 1, 1, 0],
        duration: 700,
        easing: 'easeOutQuad'
      });

      /* Triple shockwave radiating from the centre. */
      const waves = [
        { color: 'var(--crimson)', maxR: 600, delay: 0, opacity: 0.9 },
        { color: 'var(--crimson)', maxR: 500, delay: 100, opacity: 0.7 },
        { color: 'var(--ink)', maxR: 700, delay: 50, opacity: 0.5 }
      ];
      waves.forEach(w => {
        const c = document.createElementNS(SVG_NS, 'circle');
        c.setAttribute('cx', '400');
        c.setAttribute('cy', '260');
        c.setAttribute('r', '0');
        c.setAttribute('fill', 'none');
        c.setAttribute('stroke', w.color);
        c.setAttribute('stroke-width', '2');
        c.setAttribute('opacity', String(w.opacity));
        ctx.layer.appendChild(c);
        anime({
          targets: c,
          r: [0, w.maxR],
          opacity: [w.opacity, 0],
          duration: 800,
          delay: w.delay,
          easing: 'easeOutQuad'
        });
      });

      /* Stage shake. */
      anime({
        targets: stageRef.current,
        translateX: [0, 6, -6, 4, -4, 0],
        duration: 400,
        easing: 'easeInOutQuad'
      });
    }, 1100);
  };

  const sceneECG = (ctx: SceneContext) => {
    ctx.setReadout('Lead II · cardiac monitor', 'HR 142');

    /* ECG strip lives in the lower third so the headline can sit above. */
    const ecgY = 360;
    const trace = document.createElementNS(SVG_NS, 'path');
    trace.setAttribute('d', buildECGPath(1.5, 6, 800, ecgY));
    trace.setAttribute('fill', 'none');
    trace.setAttribute('stroke', 'var(--crimson)');
    trace.setAttribute('stroke-width', '2.4');
    trace.setAttribute('stroke-linecap', 'round');
    trace.setAttribute('stroke-linejoin', 'round');
    ctx.layer.appendChild(trace);

    /* Draw-on entrance. */
    const len = trace.getTotalLength();
    trace.style.strokeDasharray = String(len);
    trace.style.strokeDashoffset = String(len);
    anime({
      targets: trace,
      strokeDashoffset: [len, 0],
      duration: 1100,
      easing: 'easeOutSine'
    });

    /* Speed up: redraw with more beats and higher amplitude. */
    setTimeout(() => {
      anime({
        targets: trace,
        d: [{ value: buildECGPath(1.8, 9, 800, ecgY) }],
        duration: 700,
        easing: 'easeInOutQuad'
      });
    }, 1100);

    /* Flatline + drop. */
    setTimeout(() => {
      anime({
        targets: trace,
        d: [{ value: `M 0 ${ecgY} L 800 ${ecgY}` }],
        duration: 500,
        easing: 'easeInQuad'
      });
      ctx.setReadout('Lead II · cardiac monitor', 'HR 0');

      setTimeout(() => {
        anime({
          targets: trace,
          translateY: [0, 200],
          opacity: [1, 0],
          duration: 900,
          easing: 'easeInCubic'
        });
        revealHeadline();
      }, 500);
    }, 2100);
  };

  /* -------------------- finale -------------------- */

  const revealHeadline = () => {
    if (!headlineRef.current || !cueRef.current) return;
    anime({
      targets: headlineRef.current,
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 800,
      easing: 'easeOutCubic'
    });
    anime({
      targets: fastWordRef.current,
      scale: [{ value: 1.18, duration: 250, easing: 'easeOutQuad' }, { value: 1, duration: 300, easing: 'easeOutQuad' }],
      delay: 600
    });
    anime({
      targets: cueRef.current,
      opacity: [0, 1],
      translateY: [10, 0],
      duration: 600,
      delay: 1200,
      easing: 'easeOutQuad'
    });
    anime({
      targets: cueRef.current?.querySelector('svg'),
      translateY: [{ value: 4, duration: 600 }, { value: 0, duration: 600 }],
      loop: true,
      easing: 'easeInOutSine',
      delay: 1800
    });
  };

  /* -------------------- choreography -------------------- */

  /* Each scene's enter() runs at start; previous layer fades on exit. */
  const SCENES: Scene[] = [
    { key: 'helix',    label: 'Sequencing',         duration: 2400, enter: sceneHelix },
    { key: 'molecule', label: 'Molecular assembly', duration: 2400, enter: sceneMolecule },
    { key: 'cell',     label: 'Cell division',      duration: 2700, enter: sceneCell },
    { key: 'neural',   label: 'Neural network',     duration: 2800, enter: sceneNeural },
    { key: 'mri',      label: 'MRI sweep',          duration: 2200, enter: sceneMRI },
    { key: 'rings',    label: 'Wearable rings',     duration: 2200, enter: sceneRings },
    { key: 'pills',    label: 'Pill cascade',       duration: 1800, enter: scenePills },
    { key: 'ehr',      label: 'EHR terminal',       duration: 2400, enter: sceneEHR },
    { key: 'defib',    label: 'Defibrillator',      duration: 2200, enter: sceneDefib },
    { key: 'ecg',      label: 'Cardiac monitor',    duration: 3200, enter: sceneECG }
  ];

  const runSequence = () => {
    if (!svgRef.current) return;

    /* Reset everything. */
    clearAllTimers();
    svgRef.current.innerHTML = '';
    if (headlineRef.current) headlineRef.current.style.opacity = '0';
    if (cueRef.current) cueRef.current.style.opacity = '0';

    let cursor = 0;
    SCENES.forEach((scene) => {
      const id = window.setTimeout(() => {
        if (!svgRef.current || !isPlayingRef.current) return;

        /* Fade out all previous layers (start fade as new scene begins). */
        const allLayers = svgRef.current.querySelectorAll('g[data-scene]');
        allLayers.forEach(prev => {
          anime({
            targets: prev,
            opacity: [0.6, 0.12],
            duration: 600,
            easing: 'easeOutQuad'
          });
        });

        const layer = document.createElementNS(SVG_NS, 'g');
        layer.setAttribute('data-scene', scene.key);
        layer.setAttribute('opacity', '0');
        svgRef.current.appendChild(layer);

        anime({
          targets: layer,
          opacity: [0, 1],
          duration: 400,
          easing: 'easeOutQuad'
        });

        scene.enter({ layer, setReadout });
      }, cursor);
      timeoutsRef.current.push(id);
      cursor += scene.duration;
    });

    /* After the last scene, fade out residue layers and ensure headline
       is up (the ECG scene calls revealHeadline itself, but as a safety
       net we re-run it if some scene was skipped). */
    const finalId = window.setTimeout(() => {
      if (!svgRef.current) return;
      const allLayers = svgRef.current.querySelectorAll('g[data-scene]');
      anime({
        targets: allLayers,
        opacity: 0,
        duration: 800,
        easing: 'easeOutQuad'
      });
      if (headlineRef.current && parseFloat(getComputedStyle(headlineRef.current).opacity) < 0.5) {
        revealHeadline();
      }
    }, cursor);
    timeoutsRef.current.push(finalId);
  };

  const handleReplay = () => {
    isPlayingRef.current = false;
    clearAllTimers();
    setTimeout(() => {
      isPlayingRef.current = true;
      runSequence();
    }, 50);
  };

  const handleSkip = () => {
    clearAllTimers();
    if (svgRef.current) {
      anime({
        targets: svgRef.current.querySelectorAll('g[data-scene]'),
        opacity: 0,
        duration: 400,
        easing: 'easeOutQuad'
      });
    }
    revealHeadline();
  };

  useEffect(() => {
    runSequence();
    return () => {
      clearAllTimers();
      isPlayingRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.stage} ref={stageRef}>
      <div className={styles.controls}>
        <button className={styles.controlBtn} onClick={handleReplay}>↻ Replay</button>
        <button className={styles.controlBtn} onClick={handleSkip}>Skip →</button>
      </div>

      <div className={styles.readout}>
        <span ref={readoutLRef}>Mentheon</span>
        <span ref={readoutRRef}>--</span>
      </div>

      <svg
        ref={svgRef}
        className={styles.canvas}
        viewBox="0 0 800 520"
        preserveAspectRatio="xMidYMid meet"
      />

      <div className={styles.headline} ref={headlineRef}>
        <span className={styles.line}>Digital health is moving…</span>
        <span className={styles.fast} ref={fastWordRef}>fast</span>
      </div>

      <div className={styles.scrollCue} ref={cueRef}>
        <span>Scroll</span>
        <svg width="16" height="22" viewBox="0 0 16 22" fill="none">
          <path d="M8 2 V18 M2 12 L8 18 L14 12" stroke="var(--crimson)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
};

export default SectionAMashup;
