/**
 * NavBar — the global site control bar.
 *
 * Replaces the old Header/GridNav (kept, disused, for archive) on
 * every non-Helix3D route. Encapsulates: small corner logo (→ home),
 * text-size A−/A+ (global persisted textScale lib), a GLOBAL
 * light/dark brightness toggle, and a hamburger menu whose items are
 * kept consistent with the Helix3D in-scene menu.
 *
 * Theme: sets data-theme on <html> and persists to the SHARED key
 * `mnth:theme` (also used by Helix3D), so light/dark applies across
 * the whole token-driven site and is preserved when moving between
 * pages. Dark token overrides live in index.css (:root[data-theme]).
 *
 * Also republishes --header-h (its own height) on <html> so the
 * ConceptView / HomeMashup `calc(100dvh - var(--header-h))` layout
 * keeps working, exactly as the old Header did.
 */
import { useState, useEffect, useRef } from 'react';
import { adjustTextScale, TEXT_STEP } from '../lib/textScale';
import styles from './NavBar.module.css';

type Theme = 'light' | 'dark';
const THEME_KEY = 'mnth:theme';

// Keep this list identical to the Helix3D in-scene menu overlay.
const MENU = [
  { num: '01', label: 'home', href: '#helix3d' },
  { num: '02', label: 'marginalia', href: '#marginalia' },
  { num: '03', label: 'who', href: '#who' },
  { num: '04', label: 'concept', href: '#concept' },
];

function readTheme(): Theme {
  try {
    const s = sessionStorage.getItem(THEME_KEY);
    return s === 'dark' || s === 'light' ? s : 'light';
  } catch {
    return 'light';
  }
}

export default function NavBar() {
  const [theme, setTheme] = useState<Theme>(readTheme);
  const [menuOpen, setMenuOpen] = useState(false);
  const barRef = useRef<HTMLElement>(null);

  // Apply the theme globally (on <html>) so every token-driven page
  // flips, and persist it to the shared key.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      sessionStorage.setItem(THEME_KEY, theme);
    } catch {
      /* storage unavailable (private mode) — theme still applies */
    }
  }, [theme]);

  // Republish the bar's height as --header-h (ConceptView/HomeMashup
  // size themselves with calc(100dvh - var(--header-h))).
  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const publish = () =>
      document.documentElement.style.setProperty('--header-h', `${el.offsetHeight}px`);
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Esc closes the menu while it's open.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  const BASE = import.meta.env.BASE_URL;

  return (
    <>
      <header className={styles.bar} ref={barRef}>
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
    </>
  );
}
