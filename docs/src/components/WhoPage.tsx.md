# `src/components/WhoPage.tsx`

## What this file is

The **"Who?" route**: a picker row of people discs (each a `PersonIcon`) with an expandable `PersonPanel` below. It is structurally a clone of `RDStrands` + `StrandPanel`, but it **owns its own selection state** (unlike `RDStrands`, which is controlled by `ConceptView`). It also reuses two existing CSS modules (`RDStrands.module.css` for the picker layout, plus a one-class `WhoPage.module.css`) and demonstrates **combining two CSS Modules in one component**.

Pairs with `RDStrands.module.css` (reused), `WhoPage.module.css`, renders `PersonIcon` + `PersonPanel`, reads the `PEOPLE` data.

## Line-by-line / block walkthrough

```tsx
import { useState } from 'react'
import { PEOPLE } from '../data/people'
import PersonIcon from './PersonIcon'
import PersonPanel from './PersonPanel'
import styles from './RDStrands.module.css'
import whoStyles from './WhoPage.module.css'
```

**Two CSS Module imports**, given distinct names: `styles` (the reused strand-picker layout) and `whoStyles` (a tiny who-specific module with one class). Because each module is its own namespace object, combining them in one component is just using `styles.x` and `whoStyles.y` where appropriate — a clean way to reuse a layout module and layer on a small override. Aliasing the import (`whoStyles`) avoids a name clash with `styles`.

```tsx
export default function WhoPage() {
  const [openId, setOpenId] = useState<string | null>(null)
  function toggle(id: string) {
    setOpenId((prev) => (prev === id ? null : id))
  }
  const openPerson = PEOPLE.find((p) => p.id === openId) ?? null
```

**The key difference from `RDStrands`: `WhoPage` is *stateful/uncontrolled at the app level*** — it owns `openId` via `useState`. `RDStrands` had selection lifted to `ConceptView` because the helix and panel needed to share it; `WhoPage` has no such sibling to coordinate with, so keeping the state local is the simpler, correct choice. **Lesson: lift state up only as far as it actually needs to be shared — not higher.**

`toggle` uses the **functional updater** `setOpenId(prev => prev === id ? null : id)` (next state depends on previous → use the function form). `openPerson` is a **derived value** looked up from data each render (not stored as separate state — derive, don't duplicate).

```tsx
return (
  <section className={styles.rd} id="who">
    <h2 className={styles.rdTitle}>
      <span className={styles.thin}>Our</span> people
      <span className={styles.thin}>…</span>
    </h2>
    <div className={`${styles.rdRow} ${openId ? styles.collapsed : ''}`}>
      {PEOPLE.map((person) => {
        const isSelected = openId === person.id
        const isDimmed = openId !== null && !isSelected
        return (
          <div
            key={person.id}
            className={[styles.rdGroup, isSelected ? styles.selected : '', isDimmed ? styles.dimmed : '']
              .filter(Boolean).join(' ')}
          >
```

This is essentially `RDStrands`'s markup, reusing the very same `RDStrands.module.css` classes (`styles.rd`, `styles.rdRow`, `styles.collapsed`, `styles.rdGroup`, `styles.selected`, `styles.dimmed`). Same derived `isSelected`/`isDimmed` booleans, same `[...].filter(Boolean).join(' ')` conditional class-list idiom (see the `RDStrands.tsx` doc for that pattern). Reusing a layout module across two pages keeps the picker visually consistent for free — the cost is that `RDStrands.module.css` now has two consumers (a documented gotcha).

```tsx
<button
  type="button"
  className={styles.rdLink}
  onClick={() => toggle(person.id)}
  aria-expanded={isSelected}
  aria-controls="people-panel"
  aria-label={person.name}
>
  <PersonIcon color={isSelected ? 'var(--strand-selected, #A30B37)' : 'var(--strand-default, #9C528B)'} className={styles.svgDisc} />
</button>
<span className={styles.label}>
  {person.name.split(' ').slice(0, -1).join(' ')}<br />
  {person.name.split(' ').slice(-1)[0]}
</span>
<span className={whoStyles.credentials}>({person.credentials})</span>
```

- Same accessible button pattern as `RDStrands` (`type="button"`, `aria-expanded`, `aria-controls`, `aria-label`). Note `aria-controls="people-panel"` (people-specific id). It does **not** dispatch the `mentheon:strand-hover` event — there is no helix here to react.
- `PersonIcon` (not `StrandIcon`) — one silhouette for everyone, given the same colour-prop pattern and the **reused `styles.svgDisc` sizing class** from `RDStrands.module.css`.
- **Name splitting**: `person.name.split(' ').slice(0, -1).join(' ')` = all words except the last (first/middle names), then a `<br />`, then `person.name.split(' ').slice(-1)[0]` = the last word (surname). This renders the name on two lines (given names / surname) without storing them separately — pure string manipulation: `split` → array, `slice(0,-1)` drops the last, `slice(-1)[0]` takes the last. A neat data-shaping-in-the-view example (acceptable for display; for anything logic-bearing you would model the data properly).
- `<span className={whoStyles.credentials}>` — **the one place the second module is used**: a who-specific credentials line styled by `WhoPage.module.css`. Combining `styles.*` (reused) and `whoStyles.*` (specific) in the same JSX is the multi-module pattern.

```tsx
{openPerson && (
  <PersonPanel
    key={openPerson.id}
    person={openPerson}
    isOpen={openId !== null}
    onClose={() => setOpenId(null)}
  />
)}
```

**Conditional mount** of the panel only when someone is selected. `key={openPerson.id}` forces React to **remount** the panel when a different person is picked, so its CSS entrance animation replays from scratch (changing `key` to force remount — the same deliberate technique as `ConceptView`'s `StrandPanel`). `isOpen` drives the panel's open class; `onClose` clears `openId` (closing unmounts the panel). The state flows: this component owns `openId` → passes derived `openPerson`/`isOpen` down → `onClose` writes back here.

## Libraries & APIs used

- **React 18** — `useState` (functional updater), conditional rendering/mount, `key` to force remount. <https://react.dev/reference/react/useState>
- **CSS Modules** (Vite) — *two* modules combined (`RDStrands.module.css` reused + `WhoPage.module.css`). <https://vitejs.dev/guide/features#css-modules>
- **DOM** — `aria-*` attributes.
- **JS** — `String.prototype.split` / `Array.prototype.slice`/`join`.
- Local: `PEOPLE` data, `PersonIcon`, `PersonPanel`.

## Concepts to learn here

- Owning state locally when nothing else needs it (vs lifting it up like `RDStrands`) — keep state at the lowest level that works.
- Functional state updater for previous-dependent updates; deriving `openPerson` instead of storing it.
- Reusing an existing CSS Module across pages, and combining a reused module with a page-specific one (aliased imports).
- The `[...].filter(Boolean).join(' ')` conditional class-list idiom.
- Accessible toggle buttons (`aria-expanded`/`aria-controls`/`aria-label`); omitting behaviours (hover event) that do not apply on this page.
- String-shaping in the view (`split`/`slice`/`join`) for a two-line name.
- Conditional mount + `key` to force a fresh panel instance (replay entrance animation).

## How to edit it safely

- **Change people**: edit `src/data/people.ts` (`PEOPLE`). The picker, names, and `PersonPanel` all read it.
- **Change picker look**: it shares `RDStrands.module.css` — editing that affects **both `WhoPage` and `RDStrands`**. For who-only tweaks, add classes to `WhoPage.module.css` and apply via `whoStyles.*`.
- **Gotcha — shared `RDStrands.module.css`.** Renaming a class there breaks both `RDStrands.tsx` and this file; check both.
- **Gotcha — keep state local here.** Do not "lift it up" to match `RDStrands` — there is no sibling needing it; lifting would add needless prop-drilling.
- **Gotcha — `key={openPerson.id}`** is intentional (remount per person for a fresh animation); removing it makes the panel reuse the instance and skip its entrance.
- **Gotcha — the name-splitting assumes ≥1 space**; a single-word name would put the whole name on the second line with an empty first line. Guard if your data can have mononyms.
- Paired/related: **`RDStrands.module.css`** (reused picker styles), **`WhoPage.module.css`** (`.credentials`), **`PersonIcon.tsx`** (disc), **`PersonPanel.tsx`** (detail card), **`RDStrands.tsx`** (the controlled twin — compare to see local-vs-lifted state).
