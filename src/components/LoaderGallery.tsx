/**
 * LoaderGallery — preview/cycler for the loader variants.
 *
 * Its own route: `#loaders` (see App.tsx). A centred panel with
 * ◀ / ▶ arrows to cycle through every loader in src/components/Loaders,
 * plus a centre chip that names the current one and doubles as a
 * light/dark mode toggle (the loaders are explicitly dual-mode).
 * Self-contained — remove the `#loaders` branch in App.tsx to drop it.
 *
 * Changing the index swaps loader components (fresh mount → the
 * mechanic plays); changing mode bumps the wrapper `key` so the same
 * loader replays in the new palette.
 */

import { useState, type CSSProperties } from 'react';
import { LoaderWave } from './Loaders/LoaderWave';
import { LoaderConstellation } from './Loaders/LoaderConstellation';
import { LoaderInkDrop } from './Loaders/LoaderInkDrop';
import { LoaderStrands } from './Loaders/LoaderStrands';
import { LoaderTypeOn } from './Loaders/LoaderTypeOn';
import type { LoaderMode } from './Loaders/LoaderShared';

interface LoaderEntry {
  name: string;
  Cmp: (props: { mode: LoaderMode; size?: number }) => JSX.Element;
}

// Wave first — it is the canonical / main loader.
const LOADERS: LoaderEntry[] = [
  { name: 'Wave', Cmp: LoaderWave },
  { name: 'Constellation', Cmp: LoaderConstellation },
  { name: 'Ink Drop', Cmp: LoaderInkDrop },
  { name: 'Strands', Cmp: LoaderStrands },
  { name: 'Type On', Cmp: LoaderTypeOn },
];

export default function LoaderGallery() {
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<LoaderMode>('light');

  const n = LOADERS.length;
  const { name, Cmp } = LOADERS[index];
  const step = (delta: number) => setIndex((p) => (p + delta + n) % n);

  return (
    <div style={panel} aria-label="Loader preview">
      <div key={`${index}-${mode}`}>
        <Cmp mode={mode} />
      </div>
      <div style={row}>
        <button type="button" style={arrow} aria-label="Previous loader" onClick={() => step(-1)}>
          ◀
        </button>
        <button
          type="button"
          style={chip}
          aria-label={`Loader ${index + 1} of ${n}: ${name}. Toggle light/dark.`}
          onClick={() => setMode((m) => (m === 'light' ? 'dark' : 'light'))}
        >
          {name} · {index + 1}/{n} · {mode}
        </button>
        <button type="button" style={arrow} aria-label="Next loader" onClick={() => step(1)}>
          ▶
        </button>
      </div>
    </div>
  );
}

const panel: CSSProperties = {
  width: 'min(520px, 92vw)',
  margin: '3.5rem auto 5rem',
  fontFamily: "'Lato', sans-serif",
};

const row: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  marginTop: 8,
};

const arrow: CSSProperties = {
  flex: '0 0 auto',
  width: 38,
  height: 32,
  background: '#FFECE1',
  color: '#2F0147',
  border: '1px solid rgba(47,1,71,0.4)',
  borderRadius: 2,
  cursor: 'pointer',
  fontSize: 13,
  lineHeight: 1,
};

const chip: CSSProperties = {
  flex: '1 1 auto',
  padding: '7px 10px',
  background: 'rgba(47,1,71,0.92)',
  color: '#FFECE1',
  border: '1px solid rgba(47,1,71,0.4)',
  borderRadius: 2,
  cursor: 'pointer',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 10,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
};
