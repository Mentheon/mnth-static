# `src/components/StrandDetail/Progress/usePulse.ts`

## What this file is

A **reusable custom animation hook** that runs a never-ending "pulse" on a
single SVG `<circle>` — the radius grows and the opacity fades, on a loop, like
a radar ping. It is used in two places: the small pulse behind the current dot
in [`ProgressBeacon`](./ProgressBeacon.tsx.md), and the bigger pulse behind the
current phase in [`ProgressPhaseNode`](./ProgressPhaseNode.tsx.md). One hook,
two callers, different parameters — a clean reuse story.

It honours `prefers-reduced-motion` and owns its own anime.js lifecycle
(start + cleanup).

## Line-by-line / block walkthrough

```ts
import { useEffect } from 'react'
import { animate } from 'animejs'
import useReducedMotion from '../hooks/useReducedMotion'
```

- `useEffect` — start/stop the loop as a side effect.
- `animate` from **anime.js v4** — the single-target animation function (vs
  `createTimeline` in [`useProgressEntrance`](./useProgressEntrance.ts.md),
  which sequences many).
- `useReducedMotion` — gate the animation on the accessibility preference
  ([`../hooks/useReducedMotion.ts`](../hooks/useReducedMotion.ts.md)).

```ts
export interface UsePulseOptions {
  rFrom: number
  rTo: number
  opacityFrom: number
  opacityTo: number
  duration: number
  delay?: number
}
```

The hook's parameters as a typed object: animate the circle's radius
`rFrom → rTo`, its opacity `opacityFrom → opacityTo`, over `duration` ms, after
an optional `delay`. Bundling tuning knobs into one typed options object (rather
than 5+ positional args) is a readability/maintainability win.

```ts
export default function usePulse(
  targetRef: React.RefObject<SVGCircleElement | null>,
  options: UsePulseOptions,
  enabled: boolean = true,
): void {
```

Takes a **ref to the `<circle>`** to animate, the options, and an `enabled`
flag (default `true`). Returns `void` — pure side effect. `enabled` lets a
caller mount the hook unconditionally but only run it when appropriate
(e.g. only the *current* phase pulses).

> Why a ref + `enabled` rather than conditionally calling the hook?
> **Rules of Hooks**: hooks must be called the same way on every render — you
> cannot wrap `usePulse(...)` in an `if`. So the *caller* always calls it and
> passes `enabled`, and the hook itself decides whether to act. See
> [`ProgressPhaseNode`](./ProgressPhaseNode.tsx.md), which passes
> `phase.status === 'current'`.

```ts
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced || !enabled) return
    const el = targetRef.current
    if (!el) return
```

Guards: bail if the user wants reduced motion, if disabled, or if the ref is not
attached yet. Bailing on `reduced` means the pulse simply never runs for those
users (the static circle underneath remains, which is fine — no "invisible
element" problem here, unlike the entrance hook).

```ts
    const anim = animate(el, {
      r: [options.rFrom, options.rTo],
      opacity: [options.opacityFrom, options.opacityTo],
      duration: options.duration,
      delay: options.delay ?? 0,
      ease: 'outQuad',
      loop: true,
    })
```

`animate(element, props)` animates the circle's SVG attributes directly: `r`
(radius) from→to and `opacity` from→to, with `outQuad` easing (decelerating).
`loop: true` makes it repeat forever — the pulse. `delay: options.delay ?? 0`
uses the optional delay or 0. **Why a delay matters:**
[`ProgressPhaseNode`](./ProgressPhaseNode.tsx.md) passes `delay: 1200` so the
pulse starts ~1.2s in — roughly when
[`useProgressEntrance`](./useProgressEntrance.ts.md)'s one-shot timeline
finishes — *without* either hook coordinating the other via `setTimeout`. The
delay is handed to anime.js and "just lines up." The beacon passes no delay (its
pulse starts immediately).

```ts
    return () => {
      try { (anim as { pause?: () => void }).pause?.() } catch { /* ignore */ }
    }
  }, [
    targetRef,
    enabled,
    reduced,
    options.rFrom,
    options.rTo,
    options.opacityFrom,
    options.opacityTo,
    options.duration,
    options.delay,
  ])
}
```

The **cleanup function** stops the loop when the component unmounts or before
the effect re-runs — without it, a forever-looping animation would leak. The
defensive `(anim as { pause?: () => void }).pause?.()` plus `try/catch` guards
against the anime.js handle shape differing at runtime (the `?.` calls `pause`
only if it exists; the `try/catch` swallows any surprise). A good lesson in
**defensive teardown of a third-party resource**.

The **dependency array** lists each primitive option individually (not the
`options` object). Reason: a parent that constructs `{ rFrom, ... }` inline
creates a *new object every render*; depending on the object would restart the
animation every render. Depending on the **primitive values** means the effect
only restarts when an actual number changes — a subtle but important
`useEffect`-deps lesson.

## Libraries & APIs used

- **React**: `useEffect` with cleanup and carefully chosen primitive deps;
  ref-and-`enabled` pattern around the Rules of Hooks.
- **anime.js v4**: `animate(target, { ... , loop: true })`, returned handle's
  `.pause()`.
- **SVG**: animating `r` and `opacity` attributes of a `<circle>`.
- `useReducedMotion` accessibility gate.

## Concepts to learn here

- **One reusable animation hook, multiple configs** — DRY animation logic.
- **Options object + typed interface** instead of many positional params.
- **Rules of Hooks**: never call a hook conditionally; pass an `enabled` flag
  instead.
- **`useEffect` deps must be stable**: depend on primitives, not freshly-built
  objects, to avoid restart-every-render bugs.
- **Cleanup of long-lived/looping resources** and defensive teardown of a
  third-party handle.
- **Coordinating animations by delay, not by `setTimeout`** (aligning with
  [`useProgressEntrance`](./useProgressEntrance.ts.md)).
- **Reduced-motion gating** for a looping animation.

## How to edit it safely

- Keep the dep array as **individual primitives**. If you add an option, add it
  to `UsePulseOptions` *and* to the dep array (as a primitive).
- Do not call this hook conditionally in a component — always call it and toggle
  via the `enabled` argument.
- If you change the entrance timeline's total length in
  [`useProgressEntrance`](./useProgressEntrance.ts.md), revisit the `delay: 1200`
  passed by [`ProgressPhaseNode`](./ProgressPhaseNode.tsx.md) so the pulse still
  starts when the entrance ends.
- Always keep the cleanup `pause()` — a looping anime.js animation that is never
  paused is a leak.
- Callers/cross-refs: [`ProgressBeacon.tsx`](./ProgressBeacon.tsx.md) (small,
  no delay) and [`ProgressPhaseNode.tsx`](./ProgressPhaseNode.tsx.md) (large,
  delayed, gated on `status === 'current'`).
