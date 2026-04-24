'use client';
import React, { useState } from 'react';
import styles from './HeroIcons.module.css';
import IconCircle from './IconCircle';
import StrandPanel, { ResearchTheme } from './StrandPanel';

interface Strand {
  id: string;
  label: string;
  emoji: string;
  tagline: string;
  themes: ResearchTheme[];
  href: string;
}

const STRANDS: Strand[] = [
  {
    id: 'kindred',
    label: 'Kindreon',
    emoji: '🤝',
    tagline: 'Understanding subjective attraction in caregiving contexts',
    href: '/strands/kindred',
    themes: [
      {
        title: 'Perception of attractiveness',
        description:
          'How caregivers, clinicians and partners perceive and interpret cues of human attraction in care settings.',
      },
      {
        title: 'Interpersonal dynamics',
        description:
          'Mapping the subjective experience of connection, empathy and rapport across care relationships.',
      },
      {
        title: 'Clinical implications',
        description:
          'Translating insights into guidance for practitioners supporting vulnerable individuals.',
      },
    ],
  },
  {
    id: 'vitalis',
    label: 'Aevorix',
    emoji: '🌿',
    tagline: 'Technology for enduring vitality',
    href: '/strands/vitalis',
    themes: [
      {
        title: 'Longevity modelling',
        description:
          'Quantitative frameworks for healthspan, frailty trajectories and preventative intervention points.',
      },
      {
        title: 'Assistive innovation',
        description:
          'Devices and software enabling independence and dignity in later life.',
      },
      {
        title: 'Cognitive preservation',
        description:
          'Research into sustained cognitive function through digital and behavioural tools.',
      },
    ],
  },
  {
    id: 'vitrix',
    label: 'Acumetra',
    emoji: '📊',
    tagline: 'Clarity from complex clinical data',
    href: '/strands/vitrix',
    themes: [
      {
        title: 'Signal intelligence',
        description:
          'Extracting meaningful patterns from continuous physiological and behavioural data streams.',
      },
      {
        title: 'Predictive analytics',
        description:
          'Risk stratification and outcome forecasting for clinical decision support.',
      },
      {
        title: 'Outcome measurement',
        description:
          'Quantifying real-world impact of digital health interventions at scale.',
      },
    ],
  },
];

export default function HeroIcons() {
  const [selected, setSelected] = useState<string | null>(null);
  const defaultSize = 120;

  const activeStrand = STRANDS.find((s) => s.id === selected) ?? null;

  return (
    <>
      <div
        className={`${styles.container} ${selected ? styles.containerCollapsed : ''}`}
      >
        {STRANDS.map((strand) => {
          const isSelected = selected === strand.id;
          const isDimmed = selected !== null && !isSelected;

          return (
            <div
              key={strand.id}
              className={`${styles.iconGroup} ${isSelected ? styles.iconGroupSelected : ''} ${isDimmed ? styles.iconGroupDimmed : ''}`}
            >
              <button
                type="button"
                className={styles.iconLink}
                onClick={() =>
                  setSelected((prev) => (prev === strand.id ? null : strand.id))
                }
                aria-expanded={isSelected}
                aria-controls="strand-panel"
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              >
                <div className={styles.iconWrapper}>
                  <IconCircle
                    emoji={strand.emoji}
                    size={defaultSize}
                    isSelected={isSelected}
                  />
                </div>
              </button>
              <span className={styles.label}>{strand.label}</span>
            </div>
          );
        })}
      </div>

      <div id="strand-panel">
        {activeStrand && (
          <StrandPanel
            strandId={activeStrand.id}
            strandName={activeStrand.label}
            tagline={activeStrand.tagline}
            emoji={activeStrand.emoji}
            themes={activeStrand.themes}
            fullStrandHref={activeStrand.href}
            isOpen={!!selected}
            onClose={() => setSelected(null)}
          />
        )}
      </div>
    </>
  );
}
