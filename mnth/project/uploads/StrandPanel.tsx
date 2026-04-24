'use client';
import React from 'react';
import Link from 'next/link';
import styles from './StrandPanel.module.css';

export interface ResearchTheme {
  title: string;
  description: string;
}

export interface StrandPanelProps {
  strandId: string;
  strandName: string;
  tagline: string;
  emoji: string;
  themes: ResearchTheme[];
  fullStrandHref: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function StrandPanel({
  strandName,
  tagline,
  emoji,
  themes,
  fullStrandHref,
  isOpen,
  onClose,
}: StrandPanelProps) {
  return (
    <div
      className={`${styles.panel} ${isOpen ? styles.panelOpen : ''}`}
      aria-hidden={!isOpen}
    >
      <div className={styles.panelInner}>
        {/* Corner crop — echoes your GridNav active-state bracket */}
        <div className={styles.cornerCrop} />

        {/* Close button */}
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close strand panel"
        >
          ×
        </button>

        {/* Header — icon + name side by side */}
        <div className={styles.header}>
          <div className={styles.headerIconCircle}>
            <span className={styles.headerIconEmoji}>{emoji}</span>
          </div>
          <div className={styles.headerText}>
            <h2 className={styles.strandName}>{strandName}</h2>
            <p className={styles.tagline}>{tagline}</p>
          </div>
        </div>

        {/* Theme cards */}
        <div className={styles.themeGrid}>
          {themes.map((theme, idx) => (
            <div key={idx} className={styles.themeCard}>
              <div className={styles.themeNumber}>
                {String(idx + 1).padStart(2, '0')}
              </div>
              <h3 className={styles.themeTitle}>{theme.title}</h3>
              <p className={styles.themeDescription}>{theme.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className={styles.ctaRow}>
          <Link href={fullStrandHref} className={styles.ctaLink}>
            See full work strand
            <span className={styles.ctaArrow} aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
