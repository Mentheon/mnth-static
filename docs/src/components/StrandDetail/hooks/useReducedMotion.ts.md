# `src/components/StrandDetail/hooks/useReducedMotion.ts`

## What this file is

A **custom hook** that reports whether the user has asked the operating system
to **reduce motion** (an accessibility preference for people who get dizzy or
distracted by animation). It returns a live boolean and keeps it in sync if the
preference changes while the page is open.

It is consumed by the two animation hooks
([`Progress/usePulse.ts`](../Progress/usePulse.ts.md) and
[`Progress/useProgressEntrance.ts`](../Progress/useProgressEntrance.ts.md)),
which skip or short-circuit their animations when it returns `true`. The header
CSS also respects the same preference via a `@media (prefers-reduced-motion)`
rule — so the app honours it from both CSS and JS.

## Line-by-line / block walkthrough

```ts
import { useEffect, useState } from 'react'
```

- `useState` — holds the current "reduced?" boolean.
- `useEffect` — runs side effects (here: subscribing to a media-query change
  event) after render, with cleanup.

```ts
export default function useReducedMotion(): boolean {
```

Returns a plain `boolean`. Simple, composable contract.

```ts
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })
```

This is **lazy initial state**: passing a *function* to `useState` means React
calls it only once, on first render, to compute the initial value. We use it
because reading `window.matchMedia` is slightly expensive and must not run on
every render.

- `typeof window === 'undefined'` is the standard **SSR guard**: during
  server-side rendering there is no `window`. If absent (or `matchMedia`
  unsupported), default to `false` (animate normally).
- `window.matchMedia('(prefers-reduced-motion: reduce)')` returns a
  `MediaQueryList`. Its `.matches` property is `true` when the OS preference is
  "reduce." This is the **same media-feature** CSS uses in
  `@media (prefers-reduced-motion: reduce)` — here read from JavaScript.

```ts
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
```

`useEffect(fn, [])` runs `fn` after the first render (the `[]` deps below mean
"once, on mount"). The early `return` again guards SSR. `mq` is the same
`MediaQueryList`. `handler` is the listener: when the preference flips, it
receives a `MediaQueryListEvent` whose `.matches` we push into state — which
re-renders any component using the hook so the UI reacts immediately.

```ts
    if (mq.addEventListener) mq.addEventListener('change', handler)
    else mq.addListener(handler) // older Safari fallback
```

Modern browsers expose the standard `addEventListener('change', …)` on a
`MediaQueryList`. Very old Safari only had the deprecated `addListener(fn)`.
This **feature-detects** which API exists and uses the right one — a real-world
robustness pattern.

```ts
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', handler)
      else mq.removeListener(handler)
    }
  }, [])
```

A `useEffect` callback may return a **cleanup function**, which React runs when
the component unmounts (or before the effect re-runs). Here it **unsubscribes**
the listener so it does not leak after the component is gone — the symmetric
counterpart of the subscription, again feature-detected. The empty `[]`
dependency array means the effect subscribes once and cleans up once.

```ts
  return reduced
}
```

The component using this hook simply gets `true`/`false` and re-renders
automatically whenever the OS preference changes.

## Libraries & APIs used

- **React**: `useState` with **lazy initializer**, `useEffect` with a **cleanup
  function** and empty deps.
- **Web platform**: `window.matchMedia`, `MediaQueryList`,
  `MediaQueryListEvent`, `addEventListener`/`addListener` (legacy).
- The `prefers-reduced-motion` media feature (the JS twin of the CSS `@media`).

## Concepts to learn here

- **Accessibility: honouring `prefers-reduced-motion`.** Animations should be
  opt-out for users who request reduced motion; this hook is how the JS
  animations check that.
- **Lazy `useState` initializer** for expensive first-render computation.
- **Subscribe in `useEffect`, unsubscribe in the cleanup** — the canonical
  effect lifecycle, here over a media query rather than the more familiar DOM
  event.
- **SSR guards** (`typeof window === 'undefined'`) and **feature detection** for
  cross-browser robustness.

## How to edit it safely

- Keep both the lazy initializer **and** the effect in sync: the initializer
  gives a correct first value; the effect keeps it live. Removing the effect
  would freeze the value at mount time.
- Always pair every `add*Listener` with the matching `remove*Listener` in
  cleanup, or you create a memory leak / stale `setState` after unmount.
- Do not remove the SSR guards even if this app is currently client-only —
  they are cheap insurance and document intent.
- This hook is intentionally generic. To gate an animation on it, do it in the
  *animation* hook (see [`usePulse.ts`](../Progress/usePulse.ts.md) and
  [`useProgressEntrance.ts`](../Progress/useProgressEntrance.ts.md)), not here.
