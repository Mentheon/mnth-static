# `src/components/Header.tsx`

## What this file is

The site header: the logo + `GridNav`, which **collapses to a compact strip once the user has scrolled past the first section** and re-expands on hover. It is the most logic-heavy of the "chrome" components — it juggles two independent collapse triggers (a ConceptView section event vs a window-scroll fallback), publishes its own height to the rest of the app via a CSS variable + `ResizeObserver`, and uses hysteresis to avoid flicker. A great study of multiple coordinated `useEffect`s.

Pairs with `Header.module.css` (the compact/expand mechanics) and renders `GridNav`.

## Line-by-line / block walkthrough

```tsx
import { useEffect, useRef, useState } from 'react'
import GridNav from './GridNav'
import styles from './Header.module.css'

interface HeaderProps { currentHash: string }
export default function Header({ currentHash }: HeaderProps) {
  const headerRef = useRef<HTMLElement>(null)
```

`currentHash` flows in from the app router (passed through to `GridNav`). `headerRef` is a DOM ref to the `<header>` element, needed for `ResizeObserver` and to read its rendered height.

```tsx
  const [isScrolledPast, setIsScrolledPast] = useState(false)
  const [isPastFirstSection, setIsPastFirstSection] = useState(false)
  const isCompact = isScrolledPast || isPastFirstSection
```

Two boolean states feeding one **derived** value, `isCompact`. `isCompact` is computed during render from state — *not* its own `useState` — the "derive, don't duplicate state" principle. The header is compact if *either* trigger says so.

### Effect 1 — publish header height via ResizeObserver

```tsx
useEffect(() => {
  const el = headerRef.current
  if (!el) return
  const update = () => {
    const h = el.getBoundingClientRect().height
    if (h > 0) document.documentElement.style.setProperty('--header-h', `${h}px`)
  }
  update()
  const observer = new ResizeObserver(update)
  observer.observe(el)
  window.addEventListener('resize', update)
  return () => {
    observer.disconnect()
    window.removeEventListener('resize', update)
  }
}, [])
```

The header writes its measured height onto the document root as the CSS custom property **`--header-h`**. `ConceptView.css` reads it (`height: calc(100dvh - var(--header-h, 170px))`) so the scroll-snap sections are exactly viewport-minus-header tall. **`ResizeObserver`** is the modern API for "run a callback whenever this element's box size changes" — far better than polling. Teaching points:

- `[]` deps → set up once on mount.
- Cleanup `observer.disconnect()` + `removeEventListener` — every subscription is torn down. Without `disconnect()` you leak an observer per mount (and double-fire under StrictMode).
- This is a **CSS-variable side-channel**: instead of prop-drilling the header height into the scroller, the header publishes it to `:root` and any stylesheet can consume it. (The comment notes hover only changes the absolutely-positioned `.siteOverlay`, so `.site`'s reserved height — what is measured here — stays stable and the variable does not flap on hover.)

### Effect 2 — the collapse/expand scroll trigger with hysteresis

```tsx
useEffect(() => {
  const scroller = document.querySelector('.concept-scroller') as HTMLElement | null
  const COLLAPSE_AT = 0.5
  const EXPAND_AT   = 0.2
  const check = () => {
    const y = scroller ? scroller.scrollTop : (window.scrollY || ... )
    const segmentH = scroller ? scroller.clientHeight : window.innerHeight
    setIsScrolledPast(prev => {
      if (prev && y < segmentH * EXPAND_AT) return false
      if (!prev && y > segmentH * COLLAPSE_AT) return true
      return prev
    })
  }
  const target: EventTarget = scroller ?? window
  target.addEventListener('scroll', check, { passive: true })
  check()
  return () => target.removeEventListener('scroll', check)
}, [currentHash])
```

This decides the scroll-based collapse. Key ideas:

- **Two scroll sources**: ConceptView has its own internal scroll container (`.concept-scroller`); other routes scroll the window. The effect finds whichever exists and listens on the right one (`scroller ?? window`). `??` is nullish-coalescing.
- **Hysteresis** (the heart of this effect): separate thresholds for collapsing (`> 50%` of a segment) and expanding (`< 20%`). With a single 50% threshold, tiny scroll jitter around that point would rapidly toggle the header (flicker). Two thresholds with a dead band between them mean the state only flips when you clearly cross in one direction. **Hysteresis is the standard fix for "my boolean keeps flapping around a threshold"** — remember this pattern.
- `setIsScrolledPast(prev => ...)` uses the **functional updater form** of a state setter: it receives the previous value and returns the next. Use this whenever the next state depends on the previous one (here the threshold differs based on whether we are currently compact).
- `[currentHash]` deps — the effect re-runs on route change, because the relevant scroll container (and whether `.concept-scroller` exists) changes per route. It tears down the old listener and attaches the right new one.
- `check()` is called once immediately so the initial state is correct without waiting for a scroll.
- `{ passive: true }` for scroll-listener performance.

### Effect 3 — mirror state

```tsx
useEffect(() => {
  setIsPastFirstSection(isScrolledPast)
}, [isScrolledPast])
```

A small effect syncing `isPastFirstSection` to `isScrolledPast`. (Historically these had separate sources — a `mentheon:section` custom event vs scroll — and `isCompact` ORs them; this keeps the second in lockstep with the first now.) Generally, an effect that just copies one state into another is a smell — but it is documented here as a deliberate compatibility shim.

### Render

```tsx
return (
  <header ref={headerRef} className={`${styles.site} ${isCompact ? styles.siteCompact : ''}`}>
    <div className={styles.siteOverlay}>
      <div className={styles.logoWrap}>
        <img src={`${import.meta.env.BASE_URL}web-svg.svg`} alt="Mentheon Logo" width={518} height={170} />
      </div>
      <GridNav currentHash={currentHash} />
    </div>
  </header>
)
```

- `className={`${styles.site} ${isCompact ? styles.siteCompact : ''}`}` — toggles the `siteCompact` modifier class based on derived state. *All the actual collapse animation lives in `Header.module.css`* (height transitions + the `--header-scale`/`--nav-opacity` variables it publishes to the logo and `GridNav`). React just flips one class; CSS does the morph. This JS-flips-a-class / CSS-animates separation recurs throughout the codebase.
- `import.meta.env.BASE_URL` — Vite base path so the logo URL is correct under sub-path deploys.
- `width={518} height={170}` on the `<img>` reserves intrinsic size to avoid layout shift while the SVG loads.
- `<GridNav currentHash={currentHash} />` — passes the hash straight through (prop drilling one level).

## Libraries & APIs used

- **React 18** — `useState`, `useEffect`, `useRef`. <https://react.dev/reference/react>
- **`ResizeObserver`** — <https://developer.mozilla.org/docs/Web/API/ResizeObserver>
- **DOM** — `getBoundingClientRect`, `element.style.setProperty` (writing a CSS custom property), `querySelector`, `addEventListener`/`removeEventListener` with `{ passive: true }`, `window.scrollY`/`element.scrollTop`/`clientHeight`.
- **Vite** — `import.meta.env.BASE_URL`. <https://vitejs.dev/guide/env-and-mode>

## Concepts to learn here

- Deriving `isCompact` from two states instead of storing a third.
- `ResizeObserver` to react to element size changes (with mandatory `disconnect()` cleanup).
- Publishing a value to the rest of the app via a CSS custom property on `:root` (`--header-h`) — a CSS side-channel instead of prop drilling.
- **Hysteresis**: two thresholds + dead band to stop a boolean flickering near a single threshold.
- Functional state-updater form `setX(prev => …)` when next state depends on previous.
- Effects whose deps include a prop (`[currentHash]`) so they re-subscribe on route change.
- Listening on different scroll roots depending on the route.
- JS toggles a modifier class; CSS owns the transition/animation.
- Cleanup symmetry for every subscription (observer + listeners).

## How to edit it safely

- **Change when the header collapses**: `COLLAPSE_AT` / `EXPAND_AT` (fractions of a segment). Keep `EXPAND_AT < COLLAPSE_AT` — the gap *is* the anti-flicker dead band; collapsing it reintroduces flicker.
- **Change collapsed vs expanded sizing/scale**: that is in `Header.module.css` (`.site`/`.siteCompact` heights, `--header-scale`, `--nav-opacity`) — not here. This file only flips `styles.siteCompact`.
- **Change the published height variable name**: if you rename `--header-h`, update every consumer (`ConceptView.css`, anything reading `var(--header-h)`).
- **Gotcha — never remove `observer.disconnect()` / `removeEventListener`**; you leak observers/listeners per mount and they double-fire under StrictMode.
- **Gotcha — Effect 2's `[currentHash]` dep is required**: without it, after a route change the header would still be listening on the previous route's scroll container (or none) and the collapse would silently stop working.
- **Gotcha — read the comments before "simplifying" Effect 3**; the mirror is intentional, not accidental dead code.
- Paired files: **`Header.module.css`** (the actual collapse animation + the variables consumed by the logo and `GridNav`), **`GridNav.tsx`** / **`GridNav.module.css`** (the nav, which scales/fades from the variables this header's CSS publishes), **`ConceptView.css`** (consumes `--header-h`).
