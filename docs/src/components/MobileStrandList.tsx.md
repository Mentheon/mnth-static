# `src/components/MobileStrandList.tsx`

## What this file is

The **phone-class substitute** for the helix + `RDStrands` picker in ConceptView's section C. The spiral helix does not compress gracefully into a narrow column, so on mobile the structural fork swaps to a **stacked vertical list of tappable strand cards**. Crucially it keeps the *exact same `openId` / `onSelect` contract*, so `ConceptView`'s state and the rest of the section are unaffected by the swap. This is a textbook "same data + same prop contract, different presentation per device" pattern.

Pairs with `MobileStrandList.module.css`, renders `StrandIcon`, reads `STRANDS`.

## Line-by-line / block walkthrough

```tsx
import { STRANDS } from '../data/strands'
import StrandIcon from './StrandIcon'
import styles from './MobileStrandList.module.css'

interface MobileStrandListProps {
  openId: string | null
  onSelect: (id: string | null) => void
}
```

Same prop interface as `RDStrands` — that is the whole point: the parent can render either component depending on viewport with no other changes. Sharing a prop contract between alternative presentations is what makes a device fork clean rather than invasive.

```tsx
export default function MobileStrandList({ openId, onSelect }: MobileStrandListProps) {
  return (
    <div className={styles.list} role="list" aria-label="R&D strands">
      <h2 className={styles.heading}>
        <span className={styles.thin}>Our ongoing</span> R&amp;D strands
      </h2>
      {STRANDS.map(strand => {
        const isActive = openId === strand.id
        return (
          <button
            key={strand.id}
            type="button"
            role="listitem"
            className={`${styles.card} ${isActive ? styles.cardActive : ''}`}
            onClick={() => onSelect(isActive ? null : strand.id)}
            aria-expanded={isActive}
            aria-controls="strand-panel"
          >
```

- `role="list"` / `role="listitem"` — ARIA roles making a `<div>` of `<button>`s announce as a list to assistive tech (a plain `<div>` has no list semantics; you either use `<ul>/<li>` or add these roles). Used here because the items must be `<button>`s for tap behaviour.
- `isActive` is derived from `openId` each render.
- Conditional className `${styles.card} ${isActive ? styles.cardActive : ''}` (CSS Modules idiom).
- `onClick={() => onSelect(isActive ? null : strand.id)}` — the same **toggle** logic as `RDStrands.toggle`: tap the open card → `null` (close); tap another → its id. Controlled component; parent owns state.
- `aria-expanded`/`aria-controls="strand-panel"` mirror `RDStrands` so the accessibility story is consistent regardless of which presentation is rendered.
- Note: unlike `RDStrands`, this does **not** dispatch the `mentheon:strand-hover` custom event — hover is meaningless on touch, so the mobile fork legitimately drops that behaviour.

```tsx
<span className={styles.iconWrap} aria-hidden="true">
  <StrandIcon strandId={strand.id} color={isActive ? 'var(--strand-selected, #A30B37)' : 'var(--strand-default, #9C528B)'} className={styles.icon} />
</span>
<span className={styles.copy}>
  <span className={styles.label}>{strand.label}</span>
  <span className={styles.tagline}>{strand.tagline}</span>
  <span className={styles.meta}>
    <span className={styles.metaPill}>
      {strand.themes.length} {strand.themes.length === 1 ? 'theme' : 'themes'}
    </span>
    {strand.meta?.phase && <span className={styles.metaDot} aria-hidden="true">·</span>}
    {strand.meta?.phase && <span className={styles.metaPhase}>{strand.meta.phase}</span>}
  </span>
</span>
<span className={styles.chev} aria-hidden="true">{isActive ? '↓' : '›'}</span>
```

- `StrandIcon` is reused (same component as desktop) with the same colour-prop pattern; `aria-hidden="true"` on its wrapper because the icon is decorative (the label conveys meaning).
- **Pluralisation**: `{strand.themes.length} {strand.themes.length === 1 ? 'theme' : 'themes'}` — inline conditional for correct singular/plural. A small but common UI correctness detail.
- **Optional-chaining conditional render**: `{strand.meta?.phase && <span>…}` — `strand.meta?.phase` safely reads `phase` only if `meta` exists (the `?.` short-circuits to `undefined` otherwise), and `&&` renders the element only when that is truthy. Two guarded fragments (a separator dot and the phase text) appear only when the data has a phase. This optional-chaining + `&&` guard is the safe way to render data-dependent UI.
- The chevron glyph swaps `↓` (active) vs `›` (inactive) to signal expandability — a tiny stateful affordance, `aria-hidden` because it is decorative.

## Libraries & APIs used

- **React 18** — function component, conditional rendering, `.map`. <https://react.dev/>
- **CSS Modules** (Vite). <https://vitejs.dev/guide/features#css-modules>
- **JS** — optional chaining `?.`.
- **ARIA** — `role="list"`/`"listitem"`, `aria-expanded`/`aria-controls`/`aria-hidden`.
- Local: `STRANDS`, `StrandIcon`.

## Concepts to learn here

- Device fork via a shared prop contract: same `openId`/`onSelect`, different presentation, zero parent changes.
- Controlled toggle selection (parent owns state).
- Deriving `isActive` from props; conditional className.
- ARIA roles to give a non-semantic container list semantics; consistent `aria-*` across presentations.
- Inline pluralisation.
- Optional chaining `?.` + `&&` for safe data-dependent conditional rendering.
- Dropping a behaviour (hover events) that does not apply on the target device.

## How to edit it safely

- **Keep the prop contract identical to `RDStrands`** (`openId: string | null`, `onSelect: (id: string | null) => void`). If you change it here, change it there and at the `ConceptView` call sites — they must be interchangeable.
- **Change card content**: edit `STRANDS` in `src/data/strands.ts`. New fields like `meta.phase` are read defensively with `?.` — keep that guarding if a field is optional.
- **Change colours**: the `var(--strand-selected/default, …)` strings (same as `RDStrands`).
- **Gotcha — do not add `useState` for selection**; it must stay controlled by the parent or it desyncs from the panel/section.
- **Gotcha — `key={strand.id}`** stable/unique.
- **Gotcha — if you add a behaviour, decide if it makes sense on touch** (this fork intentionally omits the hover custom event).
- Paired files: **`MobileStrandList.module.css`** (its own module — *not* shared with `RDStrands`), **`StrandIcon.tsx`**, the data in **`src/data/strands.ts`**, and the desktop counterpart **`RDStrands.tsx`** (same contract).
