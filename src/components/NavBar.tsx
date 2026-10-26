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
import { adjustTextScale, applyTextScale, TEXT_STEP } from '../lib/textScale';
import styles from './NavBar.module.css';
import { CONTACT_EMAIL } from '../data/people';
import { SITE_MENU } from '../data/menu';
import CopyEmail from './CopyEmail';
import { useSwipeDown } from '../lib/useSwipeDown';
import { isIntroDone, onIntroDone } from '../lib/introGate';

type Theme = 'light' | 'dark';
const THEME_KEY = 'mnth:theme';


function readTheme(): Theme {
  try {
    const s = sessionStorage.getItem(THEME_KEY);
    return s === 'dark' || s === 'light' ? s : 'light';
  } catch {
    return 'light';
  }
}

/* Phones: 3d | list switch on a row just below the bar. `view` says
   which is showing; 3d (the staff) is the default home, list is the
   condensed strand list. No intro replay either way. On `3d` bar + row
   are fixed over the scene. */
const VIEW_HREF = { '3d': '#helix3d?skipIntro=true', list: '#helix3d?view=list&skipIntro=true' } as const;

export default function NavBar({ view }: { view?: '3d' | 'list' } = {}) {
  const [theme, setTheme] = useState<Theme>(readTheme);
  const [menuOpen, setMenuOpen] = useState(false);
  const barRef = useRef<HTMLElement>(null);
  const menuSwipe = useSwipeDown(() => setMenuOpen(false)); // swipe the top row down to close
  // 3d view: the switch waits for the intro to finish (it sat over it).
  const [introDone, setIntroDone] = useState(isIntroDone);
  useEffect(() => onIntroDone(() => setIntroDone(true)), []);

  // Apply the theme globally (on <html>) so every token-driven page
  // flips, and persist it to the shared key.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      sessionStorage.setItem(THEME_KEY, theme);
    } catch {
      /* storage unavailable (private mode) — theme still applies */
    }
    // The 3D scene keeps its own theme on its root: tell it.
    window.dispatchEvent(new CustomEvent('mnth:theme', { detail: theme }));
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
      <header className={`${styles.bar}${view === '3d' ? ` ${styles.barOver}` : ''}`} ref={barRef}>
        <a href="#helix3d?skipIntro=true" className={styles.mark} aria-label="Mentheon — home">
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
            <button type="button" aria-label="Default text size" title="Default size" onClick={() => applyTextScale(1)}>
              A
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

      {/* Phones: 3d | list, centred on its own row just below the bar
          (fixed with it over the 3D view). */}
      {view && (view !== '3d' || introDone) && (
        <div className={`${styles.viewRow}${view === '3d' ? ` ${styles.viewRowOver}` : ''}`}>
          <nav className={styles.viewSwitch} aria-label="View">
            <a href={VIEW_HREF['3d']} aria-current={view === '3d' ? 'page' : undefined}>3d</a>
            <a href={VIEW_HREF.list} aria-current={view === 'list' ? 'page' : undefined}>list</a>
          </nav>
        </div>
      )}

      <div
        className={`${styles.menuOverlay}${menuOpen ? ` ${styles.isOpen}` : ''}`}
        aria-hidden={!menuOpen}
        style={menuSwipe.style}
      >
        <div className={styles.menuTop} {...menuSwipe.handlers}>
          <span className={styles.menuKicker}>index &#10034; mentheon</span>
          <button type="button" className={styles.menuClose} onClick={() => setMenuOpen(false)}>
            close <span className={styles.menuCloseX} />
          </button>
        </div>

        <nav className={styles.menuItems} aria-label="Site">
          {SITE_MENU.map((m, i) => (
            <a
              key={m.href}
              className={styles.menuItem}
              href={m.href}
              onClick={() => setMenuOpen(false)}
            >
              <span className={styles.menuItemNum}>{String(i + 1).padStart(2, '0')}</span>
              {m.label}
            </a>
          ))}
        </nav>

        <div className={styles.menuBottom}>
          <span>mentheon ltd &middot; companies house 15974246</span>
          <span>
            <a href="#">linkedin</a>
            <a href="#">github</a>
            <a href={`mailto:${CONTACT_EMAIL}`}>contact</a>
            <CopyEmail />
          </span>
        </div>
      </div>
    </>
  );
}
