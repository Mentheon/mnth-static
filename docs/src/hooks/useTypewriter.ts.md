# `src/hooks/useTypewriter.ts`

## What this file is

A **custom React hook** that produces an animated "typewriter" string: it
types a phrase out character by character, optionally pauses, deletes it,
and moves on to the next phrase — looping forever. A component calls it
like this:

```ts
const text = useTypewriter(['Hello', 'World'])
// `text` starts as '', then 'H', 'He', 'Hel', ... 'Hello', then deletes
```

A *custom hook* is just a function whose name starts with `use` and which
calls other hooks (`useState`, `useEffect`, …) inside it. React treats any
`useXxx` function specially: the rules of hooks (call them at the top
level, never in a loop/condition) apply. Custom hooks are the standard way
to package reusable stateful logic so multiple components can share it
without duplicating the wiring.

## Line-by-line / block walkthrough

```ts
import { useState, useEffect } from 'react'
```

Two of the core React hooks. `useState` gives a component a piece of
state plus a setter; changing it triggers a re-render. `useEffect` runs
side-effecting code (timers, subscriptions, network) *after* render, and
optionally cleans up.

```ts
interface Options {
  speed?: number
  eraseDelay?: number
}
```

A TypeScript **interface** describes the shape of an object. The `?`
makes each field **optional** — callers may pass `{ speed: 50 }`, just
`{}`, or omit the argument entirely. `number` is the type annotation.

```ts
export function useTypewriter(strings: string[], { speed = 35, eraseDelay = 1800 }: Options = {}) {
```

- `strings: string[]` — the first parameter is an array of strings (`[]`
  after a type means "array of that type").
- `{ speed = 35, eraseDelay = 1800 }: Options = {}` — the second
  parameter is **destructured** inline. Destructuring pulls named
  properties out of an object into local variables. The `= 35` and
  `= 1800` are **default values** used when the property is missing. The
  trailing `: Options` types the whole object, and `= {}` defaults the
  *entire argument* to an empty object so `useTypewriter(['hi'])` works
  with no options at all.

```ts
const [text, setText] = useState('')
```

`useState('')` returns a two-element array: the current value and a
setter function. **Array destructuring** names them `text` and
`setText`. The argument `''` is the initial value. Calling
`setText('He')` later re-renders the component with the new `text`.

```ts
useEffect(() => {
  ...
  return () => { cancelled = true }
}, [strings.join('||'), speed, eraseDelay])
```

This is the engine. `useEffect(fn, deps)` runs `fn` after the first
render and again whenever any value in the **dependency array** `deps`
changes. The function it returns is the **cleanup function**: React calls
it before re-running the effect and when the component unmounts.

The dependency array here is `[strings.join('||'), speed, eraseDelay]`.
Why `strings.join('||')` rather than `strings`? Arrays are compared by
reference in React's dependency check. A parent that passes a fresh
array literal (`['a','b']`) every render would create a new reference
each time and restart the animation constantly. Joining the array into a
single string like `"a||b"` produces a value that is *equal* across
renders when the contents are the same, so the effect only restarts when
the actual phrases change. The `eslint-disable-next-line
react-hooks/exhaustive-deps` comment silences the lint rule that would
otherwise complain that `strings` itself isn't listed — a deliberate,
documented exception.

```ts
let cancelled = false
let i = 0
let j = 0
let deleting = false
setText('')
```

Local variables scoped to *this run* of the effect. `i` indexes which
phrase we're on, `j` is how many characters are currently shown,
`deleting` is the direction flag, and `cancelled` is the kill switch the
cleanup function flips. `setText('')` clears the display at the start of
each run. These are plain `let` bindings, not state, because they change
many times per second and we do *not* want a re-render for each — only
`setText` should trigger renders.

```ts
function tick() {
  if (cancelled) return
  const full = strings[i]
```

`tick` is one animation step. The very first thing it does is bail if
`cancelled` is true — this is what makes the cleanup safe: any
`setTimeout` that fires after unmount finds `cancelled === true` and does
nothing. `full` is the complete current phrase.

```ts
  if (!deleting) {
    j++
    setText(full.slice(0, j))
    if (j === full.length) {
      if (strings.length === 1) return
      setTimeout(() => {
        if (!cancelled) { deleting = true; tick() }
      }, eraseDelay)
      return
    }
  }
```

Typing forward: increment `j`, then show the first `j` characters with
`full.slice(0, j)` (`slice` returns a substring; the original string is
unchanged because strings are immutable in JS). When `j` reaches the full
length the phrase is fully typed. If there is only one phrase
(`strings.length === 1`) the function `return`s and the animation simply
stops — a single phrase types once and stays. Otherwise it schedules a
pause of `eraseDelay` milliseconds via `setTimeout`, after which it flips
into delete mode and continues. `setTimeout(fn, ms)` is a browser API
that runs `fn` once after `ms` milliseconds.

```ts
  } else {
    j--
    setText(full.slice(0, j))
    if (j === 0) {
      deleting = false
      i = (i + 1) % strings.length
    }
  }
```

Deleting: decrement `j` and re-render the shorter slice. When `j` hits 0
the phrase is gone; clear the `deleting` flag and advance to the next
phrase. `(i + 1) % strings.length` is the **modulo wrap**: `% n` keeps
the index in range `0 .. n-1`, so after the last phrase it returns to 0
and loops forever.

```ts
  setTimeout(tick, deleting ? 18 : speed)
}
```

Schedule the next step. Deleting uses a fixed fast `18` ms; typing uses
the configurable `speed` (default 35 ms). `cond ? a : b` is the
**ternary operator** — a compact `if/else` that produces a value.

```ts
  tick()
  return () => { cancelled = true }
```

Kick the loop off once, then hand React the cleanup function. When the
effect re-runs or the component unmounts, `cancelled` becomes `true` and
every pending `tick`/timeout becomes a no-op. This prevents the classic
bug where a finished component's timer keeps calling `setText` on an
unmounted component.

```ts
  return text
}
```

The hook's return value is just the current animated string. The
component renders it directly.

## Libraries & APIs used

- **React** (`useState`, `useEffect`) — component state and side effects.
  Read more: <https://react.dev/reference/react/useState> and
  <https://react.dev/reference/react/useEffect>.
- **`setTimeout`** — a Web/JS timer API (also in Node). Runs a callback
  once after a delay and returns an id you *could* cancel with
  `clearTimeout`. This hook cancels via the `cancelled` flag instead,
  which is simpler when many timeouts are chained.
  <https://developer.mozilla.org/docs/Web/API/setTimeout>
- **`String.prototype.slice`** — returns a substring without mutating the
  original.
  <https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String/slice>

## Concepts to learn here

- Custom hooks: packaging stateful logic in a `useXxx` function.
- `useState` returns `[value, setter]`; the setter triggers re-render.
- `useEffect` for timers; the **cleanup function** stops them.
- **Dependency arrays** and why object/array identity matters — the
  `strings.join('||')` trick to compare arrays by content.
- Mutable `let` locals vs. React state: change a `let` freely, only call
  the setter when you want the UI to update.
- A "cancelled" boolean as a lightweight way to neutralise pending
  async callbacks after teardown.
- Modulo (`%`) for cyclic indexing; the ternary operator.

## How to edit it safely

- **Change speeds:** pass `useTypewriter(list, { speed: 50, eraseDelay:
  2500 })`. Don't hard-code numbers in the body; add options to the
  `Options` interface and destructure with a default.
- **One phrase that should not delete:** already handled — pass a
  single-element array and it types once and stops.
- **Don't put `strings` directly in the dependency array.** If you do,
  any parent passing an inline array literal will restart the animation
  every render. Keep the `.join()` sentinel (or memoise the array in the
  caller with `useMemo`).
- **Always keep the `cancelled` guard and the returned cleanup.**
  Removing them reintroduces "setState on unmounted component" warnings
  and runaway timers.
- If you switch the delete speed from the literal `18`, consider making
  it another `Options` field for consistency.
