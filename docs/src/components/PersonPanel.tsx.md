# `src/components/PersonPanel.tsx`

## What this file is

The detail card for a selected **person** on the `WhoPage` — the people equivalent of `StrandPanel`, and structurally near-identical to it. It renders a header (person silhouette + name + tagline), a grid of numbered "theme" cards, and a "Read full profile" CTA. It reuses **`StrandPanel.module.css`** for all styling (the two panels share one stylesheet) and renders `PersonIcon`. Pure presentational, controlled close.

Pairs with `StrandPanel.module.css` (shared), renders `PersonIcon`, consumes the `Person` type. Compare side-by-side with `StrandPanel.tsx` — the differences are instructive.

## Line-by-line / block walkthrough

```tsx
import PersonIcon from './PersonIcon'
import type { Person } from '../data/people'
import styles from './StrandPanel.module.css'
```

The notable line: it imports **`StrandPanel.module.css`**, not a `PersonPanel.module.css`. Because the visual design is identical, the two components deliberately **share one CSS Module** rather than duplicate it. This is a valid DRY choice for true visual twins (the trade-off: a change to that module affects both — see the shared-module gotchas). `import type { Person }` is a type-only import (erased at build).

```tsx
interface PersonPanelProps {
  person: Person
  isOpen: boolean
  onClose: () => void
}
export default function PersonPanel({ person, isOpen, onClose }: PersonPanelProps) {
  return (
    <div className={`${styles.panel} ${isOpen ? styles.open : ''}`} aria-hidden={!isOpen}>
      <div className={styles.panelInner}>
        <div className={styles.cornerCrop} aria-hidden="true" />
        <button className={styles.closeButton} onClick={onClose} aria-label="Close person panel">
          ×
        </button>
```

Identical structure and patterns to `StrandPanel` (see that doc for the full explanations): conditional `${styles.panel} ${isOpen ? styles.open : ''}` class that drives the **pure-CSS collapse/expand** animation, `aria-hidden={!isOpen}` to remove the collapsed panel from the accessibility tree, the decorative `.cornerCrop`, and a reset `<button>` with an `aria-label` (because `×` alone is not an accessible name) that calls the parent's `onClose` (controlled close).

```tsx
<div className={styles.panelHeader}>
  <div className={styles.headerIconCircle}>
    <PersonIcon
      color="var(--strand-selected, #A30B37)"
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  </div>
  <div className={styles.headerText}>
    <h2 className={styles.strandName}>{person.name}</h2>
    <p className={styles.tagline}>{person.tagline}</p>
  </div>
</div>
```

Here is the meaningful difference from `StrandPanel`: it renders **`PersonIcon`** (one fixed silhouette, no `strandId` because every person uses the same glyph) instead of `StrandIcon`. It still passes the same `color` (a CSS `var(name, fallback)` string) and `style={{ width:'100%', height:'100%', display:'block' }}` to make the SVG fill the shared `.headerIconCircle` frame. Reusing the *same CSS class names* (`styles.strandName`, `styles.tagline`) for people is why one module can serve both — the class names are generic enough.

```tsx
<div className={styles.themeGrid}>
  {person.themes.map((theme, idx) => (
    <div key={idx} className={styles.themeCard}>
      <div className={styles.themeNumber}>{String(idx + 1).padStart(2, '0')}</div>
      <h3 className={styles.themeTitle}>{theme.title}</h3>
      <p className={styles.themeDescription}>{theme.description}</p>
    </div>
  ))}
</div>

<div className={styles.ctaRow}>
  <a href={person.href} className={styles.ctaLink}>
    Read full profile
    <span className={styles.ctaArrow} aria-hidden="true">→</span>
  </a>
</div>
```

The themes grid is identical to `StrandPanel`'s (`.map` over `person.themes`, zero-padded `padStart(2,'0')` numbers, the CSS-only staggered card rise from the shared module). The CTA differs: it links straight to `person.href` and — unlike `StrandPanel` — does **not** intercept the click with `preventDefault`/manual `location.hash`. That is because `PersonPanel` is rendered inside `WhoPage` (a normal `<section>`), not inside ConceptView's scroll-snap container, so the default anchor navigation is not at risk of being swallowed. A nice illustration that the right pattern depends on the rendering context.

## Libraries & APIs used

- **React 18** — function component, conditional className, `.map`. <https://react.dev/>
- **CSS Modules** (Vite) — *shared* `StrandPanel.module.css`. <https://vitejs.dev/guide/features#css-modules>
- **DOM** — `aria-hidden`/`aria-label`.
- **JS** — `String.prototype.padStart`.
- Local: `PersonIcon`, `Person` type.

## Concepts to learn here

- Two visually-identical components sharing one CSS Module (DRY for true twins) — and why that is justified here vs duplicating.
- Pure presentational component; pure-CSS collapse via the `open` class toggle.
- Type-only import; controlled close (`onClose`).
- `aria-hidden` tied to `isOpen`; `aria-label` for glyph-only buttons.
- Same code, different child icon (`PersonIcon` vs `StrandIcon`) — composition swap.
- Context-dependent patterns: no `location.hash` interception here because it is *not* inside a scroll-snap container (contrast `StrandPanel`).

## How to edit it safely

- **Change content**: comes from the `person` prop (`src/data/people.ts`). Themes auto-render and auto-number.
- **Change look/animation**: edit **`StrandPanel.module.css`** — but remember **that change also affects `StrandPanel`**. If you need a person-only style, create a separate module and import it here instead (accepting the duplication).
- **Gotcha — shared stylesheet.** Always check `StrandPanel.tsx` too after editing the module, and renaming a class there means updating *both* components' `styles.x` references.
- **Gotcha — `.panel.open { max-height: 1500px }`** ceiling (in the shared module) clips very tall content; raise it there if a person has many themes.
- **Gotcha — keep `aria-hidden={!isOpen}`** so the collapsed panel is not announced.
- **Gotcha — the plain CTA link is correct here** (WhoPage is not a scroll-snap container); do not copy `StrandPanel`'s manual-hash workaround unless this is ever embedded in one.
- Paired/related: **`StrandPanel.module.css`** (shared styles + collapse/stagger animations), **`PersonIcon.tsx`** (header silhouette), **`StrandPanel.tsx`** (the twin — diff them to see the controlled-component pattern clearly), **`WhoPage.tsx`** (renders this with `key={openPerson.id}` and owns the open state).
