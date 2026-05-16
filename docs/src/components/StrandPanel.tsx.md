# `src/components/StrandPanel.tsx`

## What this file is

The **detail card** for a selected strand: a header (icon + name + tagline), a grid of numbered "theme" cards, and a CTA link to the full strand page. It is a pure presentational component — given a `strand` data object and an `isOpen` flag, it renders. The open/close *animation* is handled entirely in CSS via the `open` class. `PersonPanel` is its near-identical twin (same CSS module).

Pairs with `StrandPanel.module.css`, renders `StrandIcon`, consumes the `Strand` type.

## Line-by-line / block walkthrough

```tsx
import StrandIcon from './StrandIcon'
import type { Strand } from '../data/strands'
import styles from './StrandPanel.module.css'

interface StrandPanelProps {
  strand: Strand
  isOpen: boolean
  onClose: () => void
}
```

`import type { Strand }` is a **type-only import** (erased at build; types do not exist at runtime). The props: the data object, an `isOpen` flag, and an `onClose` callback. No state, no effects — output is a function of props (and the CSS reacts to `isOpen`).

```tsx
export default function StrandPanel({ strand, isOpen, onClose }: StrandPanelProps) {
  return (
    <div className={`${styles.panel} ${isOpen ? styles.open : ''}`} aria-hidden={!isOpen}>
```

- Conditional className: `${styles.panel} ${isOpen ? styles.open : ''}` — the `open` modifier is added when open. **All the open/close animation lives in `StrandPanel.module.css`** (`.panel` is `max-height: 0; opacity: 0`; `.panel.open` is `max-height: 1500px; opacity: 1`, with a `transition`). React just toggles the class; CSS animates the reveal. The recurring "JS flips a class, CSS does the motion" separation.
- `aria-hidden={!isOpen}` — when closed (collapsed to 0 height) the panel and its content are removed from the accessibility tree so screen readers do not announce hidden content. Passing a boolean to `aria-hidden` is correct.

```tsx
<div className={styles.panelInner}>
  <div className={styles.cornerCrop} aria-hidden="true" />
  <button className={styles.closeButton} onClick={onClose} aria-label="Close strand panel">
    ×
  </button>
  <div className={styles.panelHeader}>
    <div className={styles.headerIconCircle}>
      <StrandIcon strandId={strand.id} color="var(--strand-selected, #A30B37)" style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
    <div className={styles.headerText}>
      <h2 className={styles.strandName}>{strand.label}</h2>
      <p className={styles.tagline}>{strand.tagline}</p>
    </div>
  </div>
```

- `.cornerCrop` is the decorative L-bracket (`aria-hidden` — purely visual).
- The close `<button>` calls `onClose` (parent clears the selection — controlled pattern). `aria-label="Close strand panel"` gives the `×` glyph an accessible name (a bare `×` is meaningless to a screen reader).
- `<StrandIcon ... color="var(--strand-selected, #A30B37)" style={{ width:'100%', height:'100%', display:'block' }} />` — the reused icon, told to fill its 125px circular container (`.headerIconCircle` in the CSS). The colour is a CSS `var(name, fallback)` string passed as a prop. `display: 'block'` removes the inline-SVG whitespace gap.
- `{strand.label}` / `{strand.tagline}` — JSX text interpolation from the data object.

```tsx
<div className={styles.themeGrid}>
  {strand.themes.map((theme, idx) => (
    <div key={idx} className={styles.themeCard}>
      <div className={styles.themeNumber}>{String(idx + 1).padStart(2, '0')}</div>
      <h3 className={styles.themeTitle}>{theme.title}</h3>
      <p className={styles.themeDescription}>{theme.description}</p>
    </div>
  ))}
</div>
```

- `.map` over `strand.themes` to render a card each. `key={idx}` — here the index is acceptable as the key because the themes list is static for a given strand and never reorders (the general rule is *prefer a stable id*; index is a known-safe exception only for static lists).
- `{String(idx + 1).padStart(2, '0')}` — formats the 1-based index as a zero-padded two-digit label (`01`, `02`, …). `padStart(2,'0')` is the standard zero-pad idiom. The staggered rise-in of these cards is a pure-CSS `@keyframes` + `:nth-child` animation in the module.

```tsx
<div className={styles.ctaRow}>
  <a
    href={`#strand/${strand.id}`}
    className={styles.ctaLink}
    onClick={(e) => { e.preventDefault(); window.location.hash = `#strand/${strand.id}` }}
  >
    See full work strand
    <span className={styles.ctaArrow} aria-hidden="true">→</span>
  </a>
</div>
```

The CTA. `href={`#strand/${strand.id}`}` is a hash route. The `onClick` does `e.preventDefault()` then sets `window.location.hash` **manually** — the comment explains why: ConceptView's scroll-snap parent can swallow the default hash navigation in some browsers, so the hash is driven imperatively to make the route fire reliably from any context. A real-world lesson: when a container can intercept default navigation, take control of `location.hash` yourself. The `→` arrow is `aria-hidden` (decorative; it animates on hover via CSS).

## Libraries & APIs used

- **React 18** — function component, conditional className, `.map`. <https://react.dev/>
- **CSS Modules** (Vite). <https://vitejs.dev/guide/features#css-modules>
- **DOM** — `Event.preventDefault()`, `window.location.hash`, `aria-hidden`/`aria-label`.
- **JS** — `String.prototype.padStart`.
- Local: `StrandIcon`, `Strand` type.

## Concepts to learn here

- Pure presentational component; open/close handled by a CSS class toggle, not JS animation.
- Type-only imports (`import type`).
- `aria-hidden` driven by `isOpen` so collapsed content is removed from the a11y tree; `aria-label` for glyph-only buttons.
- Controlled close (`onClose` lifts the action to the parent).
- Passing a CSS `var(name, fallback)` colour string and `width/height:100%` into a reusable inline-SVG component.
- `.map` with index keys (acceptable only for static, non-reordering lists) and `padStart` index formatting.
- Imperatively driving `window.location.hash` when a scroll-snap container would otherwise swallow anchor navigation.

## How to edit it safely

- **Change panel content**: comes from the `strand` prop (`src/data/strands.ts`). Add/remove themes there; the grid + numbering adapt automatically.
- **Change open/close feel**: edit `StrandPanel.module.css` (`.panel` / `.panel.open` `max-height`/`opacity`/`transition`) — not here. This file only toggles `styles.open`.
- **Gotcha — `.panel.open { max-height: 1500px }`** is a fixed ceiling; an unusually tall strand (many themes) clipped beyond 1500px would be cut off. If you add many themes, raise that ceiling in the CSS.
- **Gotcha — the manual `window.location.hash` in the CTA `onClick` is intentional** (scroll-snap parents can eat the default). Do not "simplify" it back to a plain link without testing inside ConceptView.
- **Gotcha — keep `aria-hidden={!isOpen}`** so the collapsed panel is not announced.
- Paired/related: **`StrandPanel.module.css`** (the collapse animation + theme-card keyframes — shared with `PersonPanel`), **`StrandIcon.tsx`** (the header icon), **`PersonPanel.tsx`** (near-identical twin using the same module), **`ConceptView.tsx`** (renders this with `key={openStrand.id}` to remount per strand).
