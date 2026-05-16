# `src/components/IconCircle.tsx`

## What this file is

A small interactive component: a coloured circle holding an emoji that **grows as the mouse cursor approaches it** (a proximity/magnet hover effect). It demonstrates a global `mousemove` listener driving per-element state with distance math, plus inline dynamic styling. Used by `HeroIconsWithContent`.

Pairs with `IconCircle.module.css`.

## Line-by-line / block walkthrough

```tsx
import { useState, useEffect, useRef } from 'react'
import styles from './IconCircle.module.css'

interface IconCircleProps {
  emoji?: string
  size?: number
  isSelected?: boolean
}
const THRESHOLD = 210
const MAX_SCALE = 1.15
const DEAD_ZONE = 70
```

The prop interface uses **optional props** (the `?`): `emoji`, `size`, `isSelected` may all be omitted. Module-scope constants tune the effect: `THRESHOLD` (px distance at which the magnet effect starts), `MAX_SCALE` (biggest size, 1.15×), `DEAD_ZONE` (within 70px the effect is treated as "full strength"). Constants outside the component are defined once.

```tsx
export default function IconCircle({ emoji, size = 120, isSelected = false }: IconCircleProps) {
  const [scale, setScale] = useState(1)
  const ref = useRef<HTMLDivElement>(null)
```

**Default parameter values** in the destructuring (`size = 120`, `isSelected = false`) supply fallbacks when the prop is omitted — the idiomatic way to give React props defaults. `scale` is state (drives the visual size); `ref` is a DOM ref so the effect can measure the element's screen position.

```tsx
useEffect(() => {
  function handleMouseMove(e: MouseEvent) {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const d = Math.hypot(e.clientX - cx, e.clientY - cy)
    const eff = d < DEAD_ZONE ? 0 : d
    const s = eff < THRESHOLD ? 1 + (MAX_SCALE - 1) * (1 - eff / THRESHOLD) : 1
    setScale(s)
  }
  window.addEventListener('mousemove', handleMouseMove)
  return () => window.removeEventListener('mousemove', handleMouseMove)
}, [])
```

The proximity effect:

- A **`mousemove` listener on `window`** (not the element) — so it tracks the cursor everywhere, even before it reaches the circle. Per-element pointer events could not produce "grow as you approach".
- `getBoundingClientRect()` gives the circle's current viewport rectangle; `(cx, cy)` is its centre.
- `Math.hypot(dx, dy)` is the Euclidean distance from cursor to centre (`hypot` = √(dx²+dy²), the clean way).
- `eff = d < DEAD_ZONE ? 0 : d` — within 70px treat the distance as 0 so the circle stays at max size near/over it (no jitter right on top of it).
- `s = eff < THRESHOLD ? 1 + (MAX_SCALE - 1) * (1 - eff / THRESHOLD) : 1` — a **linear interpolation**: at `eff = 0` → scale `MAX_SCALE` (1.15); at `eff = THRESHOLD` → scale 1; beyond threshold → 1. This `1 + range * (1 - t)` shape is a reusable "ease toward a target as a parameter goes 0→1" formula.
- `setScale(s)` triggers a re-render with the new size.
- **Cleanup removes the listener.** This is critical: many `IconCircle`s mount at once (three in the hero); without cleanup every unmount would leak a global `mousemove` handler, and they fire on *every* mouse move. The `[]` deps mean "subscribe once, clean up on unmount".

Note: this updates React state on every mouse move, causing a re-render per move. For a few circles that is fine; at scale you would throttle or use a ref + direct style write. Worth knowing the trade-off.

```tsx
return (
  <div
    ref={ref}
    className={styles.circle}
    style={{
      backgroundColor: isSelected ? 'var(--crimson)' : 'var(--grape)',
      width: size,
      height: size,
      transform: `scale(${scale.toFixed(3)})`,
    }}
  >
    {emoji && (
      <span className={styles.emoji}>{emoji}</span>
    )}
  </div>
)
```

- `ref={ref}` binds the DOM node so the effect can measure it.
- **Inline `style` object**: dynamic values that change per render belong in `style`, static look in the CSS Module (`styles.circle` gives `border-radius: 50%`, the `transition`, shadow). `backgroundColor: isSelected ? 'var(--crimson)' : 'var(--grape)'` — you can put a CSS `var(...)` string as an inline style value. Numeric `width`/`height` become pixels. `transform: scale(${scale.toFixed(3)})` is the proximity result; `.toFixed(3)` avoids ultra-long float strings causing pointless DOM churn.
- `{emoji && <span>...}` — **conditional rendering**: render the emoji span only if `emoji` is truthy (handles the optional prop). The actual scale *transition* is in `IconCircle.module.css` (`transition: transform 0.1s ease-out`): React snaps `scale` state to a new value each move; CSS smooths the visible change over 100ms — the recurring "JS sets target, CSS animates" pattern.

## Libraries & APIs used

- **React 18** — `useState`, `useEffect`, `useRef`. <https://react.dev/reference/react>
- **DOM** — `window.addEventListener('mousemove')`, `Element.getBoundingClientRect()`, `MouseEvent.clientX/clientY`.
- **JS** — `Math.hypot`, `Number.prototype.toFixed`.
- **CSS Modules** (Vite). <https://vitejs.dev/guide/features#css-modules>

## Concepts to learn here

- Optional props + default parameter values in destructuring.
- A global `window` listener (not per-element) when you need to react to the cursor *before* it reaches the element; mandatory cleanup to avoid leaks across many instances.
- `getBoundingClientRect` to get an element's live screen position from inside an effect.
- Distance math (`Math.hypot`) + linear interpolation to map proximity → a scale value, with a dead zone to kill jitter.
- Inline `style` for per-render dynamic values (incl. CSS `var()` strings) vs CSS Module for static look.
- Conditional rendering with `&&`.
- JS sets the target value (`scale` state); CSS `transition` animates the journey.
- Performance trade-off: state-update-per-mousemove is fine for a few elements, not for many.

## How to edit it safely

- **Tune the magnet effect**: `THRESHOLD` (reach), `MAX_SCALE` (max growth), `DEAD_ZONE` (jitter-free radius around the circle).
- **Change the smoothing**: the `transition: transform 0.1s ease-out` in `IconCircle.module.css` — longer = laggier follow.
- **Change colours**: the `isSelected ? 'var(--crimson)' : 'var(--grape)'` inline style (prefer the global tokens).
- **Gotcha — never remove the `removeEventListener` cleanup**: with several circles, a leaked global `mousemove` listener per instance compounds quickly and they all keep firing forever.
- **Gotcha — `[]` deps are correct here** (subscribe once); the handler reads fresh layout via `getBoundingClientRect()` every call, so no stale-closure issue despite the empty deps.
- **Gotcha — performance**: if you ever render dozens of these, refactor to a throttled handler or write `transform` directly via the ref instead of setting state each move.
- Paired file: **`IconCircle.module.css`** — `styles.circle` (the round shape, shadow, and the `transform` transition that smooths the scale), `styles.emoji` (the emoji glyph sizing/font stack).
