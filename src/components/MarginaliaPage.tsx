/**
 * ARCHIVED — disused. The control-bar features here were generalised
 * into the global NavBar (src/components/NavBar.tsx); App no longer
 * imports this. Kept for reference.
 *
 * MarginaliaPage — wraps <Marginalia> with the Helix3D-style control
 * bar (small corner logo · text-size · brightness · menu) in place of
 * the shared Header, for the #marginalia route only.
 *
 * - Text size reuses the global, persisted textScale lib (same as
 *   Helix3D) so it stays in sync site-wide.
 * - Brightness toggles a page-scoped data-theme (persisted per
 *   session) — the dark token overrides live in the .module.css.
 * - Menu is a self-contained full-screen overlay (Esc / × / item
 *   click closes it).
 *
 * Deliberately scoped to this page; the global menubar may be
 * unified with this later.
 */
import { useState, useEffect } from 'react';
import Marginalia from './Marginalia';
import type { MarginaliaProps } from './Marginalia/types';
import { adjustTextScale, TEXT_STEP } from '../lib/textScale';
import styles from './MarginaliaPage.module.css';

type Theme = 'light' | 'dark';
// Shared with the Helix3D page so light/dark is preserved across
// both. Marginalia defaults light when unset; Helix3D defaults dark.
const THEME_KEY = 'mnth:theme';

const MENU = [
  { num: '01', label: 'home', href: '#helix3d' },
  { num: '02', label: 'marginalia', href: '#marginalia' },
  { num: '03', label: 'who', href: '#who' },
  { num: '04', label: 'concept', href: '#concept' },
];

export default function MarginaliaPage({ slug, strandFilter = null }: MarginaliaProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const s = sessionStorage.getItem(THEME_KEY);
      return s === 'dark' || s === 'light' ? s : 'light';
    } catch {
      return 'light';
    }
  });
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleTheme = () =>
    setTheme((t) => {
      const next: Theme = t === 'dark' ? 'light' : 'dark';
      try {
        sessionStorage.setItem(THEME_KEY, next);
      } catch {
        /* storage unavailable (private mode) — theme still applies */
      }
      return next;
    });

  // Esc closes the menu while it's open.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const BASE = import.meta.env.BASE_URL;

  return (
    <div className={styles.root} data-theme={theme}>
      <header className={styles.topbar}>
        <a href="#helix3d" className={styles.mark} aria-label="Mentheon — home">
          <img
            className={`${styles.markLogo} ${styles.markLogoLight}`}
            src={`${BASE}favvectorprintlight.svg`}
            alt="Mentheon"
          />
          <img
            className={`${styles.markLogo} ${styles.markLogoDark}`}
            src={`${BASE}favvectorprintdark.svg`}
            alt="Mentheon"
          />
        </a>

        <div className={styles.controls}>
          <div className={styles.textSize} role="group" aria-label="Text size">
            <button type="button" aria-label="Decrease text size" onClick={() => adjustTextScale(-TEXT_STEP)}>
              A&minus;
            </button>
            <button type="button" aria-label="Increase text size" onClick={() => adjustTextScale(TEXT_STEP)}>
              A+
            </button>
          </div>

          <button
            type="button"
            className={styles.brightness}
            aria-label="Toggle brightness"
            aria-pressed={theme === 'dark'}
            onClick={toggleTheme}
          >
            <svg className={styles.iconMoon} viewBox="0 0 24 24">
              <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
            </svg>
            <svg className={styles.iconSun} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>
          </button>

          <button
            type="button"
            className={styles.menuBtn}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            menu
            <span className={styles.menuBtnLines}>
              <span />
              <span />
            </span>
          </button>
        </div>
      </header>

      <Marginalia slug={slug} strandFilter={strandFilter} />

      <div
        className={`${styles.menuOverlay}${menuOpen ? ` ${styles.isOpen}` : ''}`}
        aria-hidden={!menuOpen}
      >
        <div className={styles.menuTop}>
          <span className={styles.menuKicker}>index &#10034; mentheon</span>
          <button type="button" className={styles.menuClose} onClick={() => setMenuOpen(false)}>
            close <span className={styles.menuCloseX} />
          </button>
        </div>

        <nav className={styles.menuItems} aria-label="Site">
          {MENU.map((m) => (
            <a
              key={m.num}
              className={styles.menuItem}
              href={m.href}
              onClick={() => setMenuOpen(false)}
            >
              <span className={styles.menuItemNum}>{m.num}</span>
              {m.label}
            </a>
          ))}
        </nav>

        <div className={styles.menuBottom}>
          <span>mentheon ltd &middot; companies house 15974246</span>
          <span>
            <a href="#">linkedin</a>
            <a href="#">github</a>
            <a href="#">contact</a>
          </span>
        </div>
      </div>
    </div>
  );
}
