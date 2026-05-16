# `src/components/GridNav.tsx`

## What this file is

The primary site navigation rendered as a **3×2 grid of link tiles** (Home, News, About, Who?, What?, Why?). It is a small, *stateless* presentational component: it receives the current URL hash via props, derives which tile is "active", and renders. It uses a hash-based routing convention (`#who`, `#marginalia`, …) common in static SPAs.

Pairs with `GridNav.module.css` (styles) and is rendered by `Header.tsx`.

## Line-by-line / block walkthrough

```tsx
import styles from './GridNav.module.css'
```

Only a CSS Module import — no React hooks. This component has no state and no effects; it is a pure function of its props. The simplest, most testable kind of component.

```tsx
const NAV_ITEMS = [
  { label: 'Home',  href: '#home'       },
  { label: 'News',  href: '#marginalia' },
  { label: 'About', href: '#about'      },
  { label: 'Who?',  href: '#who'        },
  { label: 'What?', href: '#what'       },
  { label: 'Why?',  href: '#why'        },
]
```

Module-scope data: the nav model as a list of `{ label, href }`. The `href`s are **hash fragments** — clicking them changes `window.location.hash` without a full page load, which an app-level router listens to. Driving nav from a data array (rather than hand-writing six `<a>`s) means the markup is one `.map` and adding an item is a one-line data change.

```tsx
function getActive(hash: string): string {
  if (hash === '#who') return 'Who?'
  if (hash === '#marginalia' || hash.startsWith('#marginalia/')) return 'News'
  return 'Home'
}
```

A pure helper mapping the current hash to the label of the tile that should be highlighted. Note `hash.startsWith('#marginalia/')` — sub-routes like `#marginalia/some-article` still highlight "News". Everything not explicitly matched falls back to "Home". Keeping this as a standalone pure function (not inline JSX logic) makes the active-state rule readable and unit-testable.

```tsx
interface GridNavProps {
  currentHash: string
}
export default function GridNav({ currentHash }: GridNavProps) {
  const active = getActive(currentHash)
```

The prop interface declares the single input. `currentHash` is passed down from a parent that owns the hash (lift-state-up again). `active` is a **derived value** computed during render — not state. The rule "if it can be computed from props, don't store it in state" is important: deriving avoids a whole class of out-of-sync bugs.

```tsx
return (
  <nav className={styles.gridContainer} aria-label="Primary">
    {NAV_ITEMS.map((item) => {
      const isActive = active === item.label
      return (
        <a
          key={item.label}
          href={item.href}
          className={`${styles.navItem} ${isActive ? styles.active : ''}`}
        >
          {item.label}
          {isActive && <span className={styles.cornerCrop} aria-hidden="true" />}
        </a>
      )
    })}
  </nav>
)
```

- `<nav aria-label="Primary">` — semantic landmark element with an accessible name so screen-reader users can jump to it.
- `.map(...)` renders the six tiles; **`key={item.label}`** gives React a stable identity per item (labels are unique here).
- Conditional className `` `${styles.navItem} ${isActive ? styles.active : ''}` `` — the base tile class plus the `active` modifier only on the current tile (CSS Modules conditional-styling idiom).
- `{isActive && <span className={styles.cornerCrop} aria-hidden="true" />}` — **conditional rendering with `&&`**: if `isActive` is true, render the corner-crop decoration; if false, `false` is rendered (React renders nothing for `false`/`null`). This is the standard "render X only when condition" pattern. `aria-hidden="true"` because the crop mark is purely decorative.
- `<a href={item.href}>` — a real anchor; clicking changes the hash and the app router reacts. Using genuine anchors (not click-handler divs) keeps the nav keyboard-accessible and right-click-openable for free.

## Libraries & APIs used

- **React 18** — function component, no hooks. <https://react.dev/>
- **CSS Modules** (Vite). <https://vitejs.dev/guide/features#css-modules>
- DOM: hash-fragment `href`s, `<nav aria-label>`, `aria-hidden`.

## Concepts to learn here

- Pure stateless presentational component: output is a function of props only.
- Deriving values during render (`active`) instead of storing redundant state.
- Hash-based routing convention with real `<a href="#...">` anchors.
- A standalone pure helper for routing logic (`getActive`) — readable and testable.
- Rendering a list from data with `.map` + stable `key`.
- Conditional className (CSS Modules) and conditional rendering with `&&`.
- Accessible nav landmark (`<nav aria-label>`) and decorative `aria-hidden`.

## How to edit it safely

- **Add/remove a nav item**: edit `NAV_ITEMS`. If the new item should highlight on a particular hash, add a case to `getActive`. Note the layout is a fixed 3×2 grid in the CSS — adding a 7th item will not fit cleanly without changing `GridNav.module.css`'s `grid-template-rows/columns`.
- **Change active-highlight rules**: edit `getActive` only — it is the single place that decides highlighting.
- **Change a destination**: edit the item's `href`; ensure the app-level hash router knows that route.
- **Gotcha — `key={item.label}`** assumes labels are unique; if you add a duplicate label, switch the key to a dedicated unique id.
- **Gotcha — CSS Modules conditional class**: the falsy branch must be `''`.
- **Gotcha — the grid is fixed 3 columns × 2 rows**; the component does not adapt the grid to item count — that lives in `GridNav.module.css`.
- Paired files: **`GridNav.module.css`** (the grid + active styles incl. the `cornerCrop`), **`Header.tsx`** (renders this and supplies `currentHash`; also scales/fades it via CSS custom properties).
