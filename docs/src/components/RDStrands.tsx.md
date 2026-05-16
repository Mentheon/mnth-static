# `src/components/RDStrands.tsx`

## What this file is

The **strand picker**: a row of three clickable strand "discs" (rendered by `StrandIcon`) above the helix in ConceptView's section C. Clicking a disc selects/deselects that strand. It is a controlled component (state lives in `ConceptView`) and it also broadcasts hover events so the `Helix` can react. A clean example of controlled selection + decoupled custom-event signalling.

Pairs with `RDStrands.module.css`, renders `StrandIcon`, reads the `STRANDS` data, and is also reused (with the same CSS module) by `WhoPage`.

## Line-by-line / block walkthrough

```tsx
import { STRANDS } from '../data/strands'
import StrandIcon from './StrandIcon'
import styles from './RDStrands.module.css'

interface RDStrandsProps {
  openId: string | null
  onSelect: (id: string | null) => void
}
```

No hooks — purely a function of props. `STRANDS` is the shared data source (so the picker, helix, and panel all describe the same strands). The prop interface is the controlled-component contract: `openId` (which strand is open, or `null`) in, `onSelect` (request a change, `null` = clear) out. The parent (`ConceptView`) owns the state.

```tsx
export default function RDStrands({ openId, onSelect }: RDStrandsProps) {
  function toggle(id: string) {
    onSelect(openId === id ? null : id)
  }
```

`toggle` is the **toggle pattern**: clicking the already-open strand passes `null` (close); clicking a different one passes its id (switch). The component computes the *next* value and asks the parent to apply it — it never holds the state itself.

```tsx
return (
  <section className={styles.rd} id="rd">
    <h2 className={styles.rdTitle}>
      <span className={styles.thin}>Our ongoing</span> R&amp;D strands
      <span className={styles.thin}>…</span>
    </h2>
    <div className={`${styles.rdRow} ${openId ? styles.collapsed : ''}`}>
```

- `id="rd"` is an in-page anchor target.
- `&amp;` is the HTML entity for `&` (needed because `&` can be ambiguous in markup; in JSX text it is good practice).
- The `.thin` spans apply a lighter font weight to part of the heading — mixed-weight typography by wrapping fragments.
- `` `${styles.rdRow} ${openId ? styles.collapsed : ''}` `` — conditional className: the row gets a `collapsed` modifier when *any* strand is open (the CSS tightens spacing in that state). Truthiness of `openId` (a string or `null`) is used directly.

```tsx
{STRANDS.map((strand) => {
  const isSelected = openId === strand.id
  const isDimmed = openId !== null && !isSelected
  return (
    <div
      key={strand.id}
      className={[styles.rdGroup, isSelected ? styles.selected : '', isDimmed ? styles.dimmed : '']
        .filter(Boolean)
        .join(' ')}
    >
```

- `.map` over the data with `key={strand.id}` (stable unique key — required for lists).
- Two derived booleans per item: `isSelected` (this is the open one) and `isDimmed` (something else is open, so fade this one). Deriving from props each render keeps it consistent.
- **The class-list builder idiom**: `[base, condA ? a : '', condB ? b : ''].filter(Boolean).join(' ')`. `filter(Boolean)` drops the empty strings (falsy), `join(' ')` makes the final `className`. This is a clean, dependency-free alternative to a `clsx`/`classnames` library when combining several conditional classes — worth memorising.

```tsx
<button
  type="button"
  className={styles.rdLink}
  onClick={() => toggle(strand.id)}
  aria-expanded={isSelected}
  aria-controls="strand-panel"
  aria-label={strand.label}
  onMouseEnter={() => document.dispatchEvent(
    new CustomEvent('mentheon:strand-hover', { detail: { hovering: true } }))}
  onMouseLeave={() => document.dispatchEvent(
    new CustomEvent('mentheon:strand-hover', { detail: { hovering: false } }))}
>
  <StrandIcon
    strandId={strand.id}
    color={isSelected ? 'var(--strand-selected, #A30B37)' : 'var(--strand-default, #9C528B)'}
    className={styles.svgDisc}
  />
</button>
<span className={styles.label}>{strand.label}</span>
```

- `type="button"` — explicit so the button does not act as a form submit (default `type` inside a form is `submit`). Always set this on non-submit buttons.
- **Accessibility cluster**: `aria-expanded={isSelected}` (announces open/closed state), `aria-controls="strand-panel"` (links the button to the panel it toggles), `aria-label={strand.label}` (accessible name since the visible content is an icon). Using a real `<button>` (not a clickable `<div>`) makes it keyboard- and screen-reader-friendly for free.
- **`onMouseEnter`/`onMouseLeave` dispatch a `CustomEvent`** (`mentheon:strand-hover`) on `document`. `Helix.tsx` listens for this and shrinks its logo to anticipate the selection. This is decoupled cross-component communication — `RDStrands` does not import or know about `Helix`; it just broadcasts. Trade-off: the wire is invisible (you must grep for the event name to find the listener).
- `color={isSelected ? 'var(--strand-selected, #A30B37)' : 'var(--strand-default, #9C528B)'}` — passes a CSS `var(name, fallback)` *string* down to `StrandIcon`, which uses it as an SVG `fill`. The selected disc is crimson, others grape; `var(--x, fallback)` means a theme can override the colour but there is a hard default. Passing the colour as a prop keeps the SVG component dumb/reusable.

## Libraries & APIs used

- **React 18** — function component, no hooks; conditional className; `.map`. <https://react.dev/>
- **CSS Modules** (Vite). <https://vitejs.dev/guide/features#css-modules>
- **DOM** — `document.dispatchEvent(new CustomEvent(...))`, `aria-*` attributes.
- Local: `STRANDS` data, `StrandIcon` component.

## Concepts to learn here

- Controlled selection: parent owns state; this component computes the next value and calls `onSelect` (toggle pattern, `null` = clear).
- Deriving per-item booleans (`isSelected`/`isDimmed`) from props instead of storing them.
- The `[...].filter(Boolean).join(' ')` conditional class-list idiom (a no-dependency `classnames`).
- Custom events for decoupled cross-component signalling (hover → Helix).
- Accessibility: real `<button type="button">`, `aria-expanded`/`aria-controls`/`aria-label`.
- Passing a CSS `var(name, fallback)` string down as a prop for themeable SVG fill.
- A CSS Module reused by two components (`RDStrands` and `WhoPage`).

## How to edit it safely

- **Change strands**: edit `src/data/strands.ts` (the `STRANDS` array). The picker, `Helix` (via id bridging), and `StrandPanel` all read it — keep ids consistent across them and `Helix.tsx`'s lookup maps.
- **Change colours**: the `var(--strand-selected, …)` / `var(--strand-default, …)` strings (override the variables in CSS for theming, or change the hex fallbacks here).
- **Change the hover event contract**: if you rename `mentheon:strand-hover` or its `detail.hovering` shape, update the listener in `Helix.tsx` (and `MobileStrandList` does *not* dispatch it — be aware the mobile fork behaves differently).
- **Gotcha — the parent must own selection.** Do not add `useState` here for `openId`; that would create two sources of truth and desync the helix/panel.
- **Gotcha — `key={strand.id}`** must be stable/unique.
- **Gotcha — keep `aria-controls="strand-panel"`** pointing at the actual panel's id, or the relationship is announced incorrectly.
- Paired files: **`RDStrands.module.css`** (the `.rd*` classes incl. `.selected`/`.dimmed`/`.collapsed` states), **`StrandIcon.tsx`** (the SVG disc, receives `strandId`/`color`), **`ConceptView.tsx`** (owns `openId`/`onSelect`), **`Helix.tsx`** (listens for the hover event), **`WhoPage.tsx`** (reuses this CSS module).
