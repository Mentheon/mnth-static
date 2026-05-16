# `src/lib/useIsMobile.ts`

## What this file is

A **custom React hook** that returns a boolean: `true` when the browser
viewport is narrow enough to be treated as "mobile", `false` otherwise.
It is **reactive** — if the user rotates their phone or resizes the
window across the breakpoint, the value flips and any component using it
re-renders. The site uses this to switch from the 3D-helix / carousel
desktop layouts to a simpler stacked list on small screens.

Usage in a component:

```ts
const isMobile = useIsMobile()        // default 720px cutoff
const isTiny  = useIsMobile(480)      // custom breakpoint
```

## Line-by-line / block walkthrough

```ts
import { useEffect, useState } from 'react'
```

`useState` for the boolean, `useEffect` to subscribe to viewport changes.

The long block comment above the function is worth reading — it explains
two real engineering trade-offs: **SSR safety** (the code might run where
`window` doesn't exist) and the choice not to use `useLayoutEffect`. Good
code comments document *why*, not *what*; this one is a model example.

```ts
export function useIsMobile(breakpoint: number = 720): boolean {
```

- `breakpoint: number = 720` — a typed parameter with a **default
  value**. Call `useIsMobile()` and you get 720; call `useIsMobile(900)`
  to override.
- `: boolean` after the parameter list is the **return type
  annotation**. TypeScript will enforce that this function returns a
  boolean.

```ts
const [isMobile, setIsMobile] = useState<boolean>(() => {
  if (typeof window === 'undefined') return false
  return window.matchMedia(`(max-width: ${breakpoint}px)`).matches
})
```

Several things here:

- `useState<boolean>(...)` — the `<boolean>` is a **generic type
  argument** telling TypeScript what kind of state this is. `useState`
  is a generic function: `useState<T>` produces state of type `T`.
- The argument is a **function**, not a value. This is *lazy initial
  state*: React calls it once on the first render to compute the initial
  value. Passing a function (rather than computing inline) means the
  potentially-costly `matchMedia` call isn't redone on every render.
- `typeof window === 'undefined'` — the **SSR guard**. During
  server-side rendering there is no browser `window` object; touching it
  would crash. So on the server we assume desktop (`false`). In a plain
  Vite client app this branch rarely triggers, but it's cheap insurance.
- `window.matchMedia('(max-width: 720px)')` — the browser **Media
  Queries API**. It evaluates a CSS media query string in JavaScript and
  returns a `MediaQueryList` object. Its `.matches` property is `true`
  when the query currently holds. Template literal
  `` `(max-width: ${breakpoint}px)` `` interpolates the numeric
  breakpoint into the query string.

```ts
useEffect(() => {
  const mql = window.matchMedia(`(max-width: ${breakpoint}px)`)
  const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
  mql.addEventListener('change', handler)
  setIsMobile(mql.matches)
  return () => mql.removeEventListener('change', handler)
}, [breakpoint])
```

- The effect runs after the first render (and again only if `breakpoint`
  changes — that's the `[breakpoint]` dependency array).
- `mql` is a fresh `MediaQueryList`. We attach a **change listener**:
  the browser fires a `change` event on the list whenever the query's
  match state flips (e.g. crossing 720px). `e: MediaQueryListEvent`
  types the event object; `e.matches` is the new boolean.
- `mql.addEventListener('change', handler)` — the modern way to
  subscribe. The comment notes the older `mql.addListener(...)` API is
  deprecated; this code targets modern browsers only.
- `setIsMobile(mql.matches)` — a one-time **re-sync**. Between the lazy
  initial state computation and this effect running, the viewport could
  have changed, or the initial computation ran during SSR and returned a
  placeholder. Reading `.matches` again here corrects any drift.
- The returned function is the **cleanup**: it removes the listener.
  Without this, every time the component using the hook unmounts you'd
  leak a listener and the handler would keep firing forever. Cleanup is
  mandatory whenever you subscribe to anything in `useEffect`.

```ts
  return isMobile
}
```

The hook hands back the current boolean. Components branch on it.

## Libraries & APIs used

- **React** `useState` / `useEffect` — state and subscription lifecycle.
  <https://react.dev/reference/react>
- **`window.matchMedia` / `MediaQueryList`** — a browser API that
  evaluates CSS media queries in JS and emits `change` events. This is
  the correct, event-driven alternative to listening to `window`'s
  `resize` event and re-parsing widths yourself.
  <https://developer.mozilla.org/docs/Web/API/Window/matchMedia>
- **Template literals** (`` `(max-width: ${x}px)` ``) — JS string
  interpolation with backticks.

## Concepts to learn here

- Lazy initial state: `useState(() => expensiveInit())` runs the
  initializer only once.
- SSR safety: guard `window`/`document` access with
  `typeof window === 'undefined'`.
- Generic type arguments: `useState<boolean>(...)`.
- Subscribing to a browser event source in `useEffect` and **always**
  unsubscribing in the cleanup return.
- Re-syncing state inside the effect to cover the gap between initial
  render and effect execution.
- Reactive media queries via `matchMedia` instead of manual resize
  handlers.

## How to edit it safely

- **Change the global cutoff:** edit the `= 720` default, or just call
  `useIsMobile(yourNumber)` at the call site without touching this file.
- **Keep the SSR guard** (`typeof window === 'undefined'`) in the lazy
  initializer if this code ever runs under a server renderer; deleting
  it can crash the build/render.
- **Never remove the cleanup `return () => mql.removeEventListener(...)`** —
  that's a listener leak.
- If you must support very old Safari (≤13), add a fallback to the
  deprecated `mql.addListener`/`removeListener` alongside the
  `addEventListener` calls — but the comment documents that modern
  browsers are the target, so this is usually unnecessary.
- Don't replace `matchMedia` with a `window.resize` listener "for
  simplicity" — `resize` fires far more often and you'd be re-parsing
  widths on every pixel; `matchMedia`'s `change` only fires when the
  breakpoint is actually crossed.
