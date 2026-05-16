# `src/components/StrandDetail/hooks/useDisclosure.ts`

## What this file is

A tiny **custom React hook** that manages an open/closed boolean. It is the
single source of truth for "is the progress timeline expanded?" used by
[`StrandDetail.tsx`](../StrandDetail.tsx.md). "Disclosure" is the standard UI
term for a control that shows/hides a region (an accordion, a details/summary,
an expandable panel).

A *custom hook* is just a function whose name starts with `use` and which calls
other hooks inside it. It lets you bottle up reusable stateful logic and share
it between components without duplicating `useState` boilerplate.

## Line-by-line / block walkthrough

```ts
import { useCallback, useState } from 'react'
```

Two built-in hooks:
- `useState` — gives a component a piece of state and a setter that, when
  called, triggers a re-render.
- `useCallback` — memoises a function so the *same function instance* is
  returned across renders (instead of a brand-new closure every render).

```ts
export interface UseDisclosureReturn {
  isOpen: boolean
  toggle: () => void
  open: () => void
  close: () => void
}
```

The hook's **return type**, written as an interface so consumers get
autocompletion and type-checking. It returns the current state plus three
action functions. Typing a hook's return value explicitly is good practice — it
documents the API at a glance.

```ts
export default function useDisclosure(initial = false): UseDisclosureReturn {
```

The hook function. `initial = false` is a **default parameter**: callers can do
`useDisclosure()` (starts closed) or `useDisclosure(true)` (starts open). The
return annotation ties the implementation to the interface above.

```ts
  const [isOpen, setIsOpen] = useState<boolean>(initial)
```

`useState` returns a 2-element array, destructured into the current value
(`isOpen`) and its setter (`setIsOpen`). `useState<boolean>` pins the state type.
`initial` seeds the first render's value. **Important:** the seed is only used on
the *first* render; passing a different `initial` later does not reset the state.

```ts
  const toggle = useCallback(() => setIsOpen(o => !o), [])
```

`toggle` flips the value. Note `setIsOpen(o => !o)` — passing a **function** to
the setter (the "functional update" form) computes the next value from the
*previous* value `o`. This is the correct way to flip a boolean: it never reads
a possibly-stale `isOpen` from the closure.

`useCallback(fn, [])` with an **empty dependency array** means "create this
function once and reuse it forever." Because `toggle` uses only the functional
setter (no outside variables), it never needs to be recreated. Stable function
identity matters here: `StrandDetail` passes `toggle` down to `ProgressBeacon`
as `onToggle`; a stable reference avoids needless prop changes / re-renders
downstream.

```ts
  const open   = useCallback(() => setIsOpen(true),    [])
  const close  = useCallback(() => setIsOpen(false),   [])
```

`open` and `close` set absolute values, also memoised once. They are part of the
returned API even though `StrandDetail` currently only uses `toggle` — keeping
the hook a complete, reusable disclosure primitive.

```ts
  return { isOpen, toggle, open, close }
}
```

Returns the state and the three actions as an object matching
`UseDisclosureReturn`. Consumers destructure what they need
(`const disclosure = useDisclosure()` then `disclosure.isOpen`,
`disclosure.toggle`).

## Libraries & APIs used

- **React**: `useState` (with the functional-updater pattern), `useCallback`
  (with empty deps for stable identity).
- TypeScript: interface as a return contract, default parameter.

## Concepts to learn here

- **Custom hooks** package reusable stateful logic; the `use` prefix is a rule,
  not a convention (React's linter enforces hook rules on `use*` names).
- **Functional state updates** (`setIsOpen(o => !o)`) avoid stale-closure bugs.
- **`useCallback` with `[]` for stable function identity**, and *why* identity
  stability matters when passing callbacks as props.
- **Default parameters** to make a hook configurable yet zero-config.

## How to edit it safely

- To make the timeline open by default, the *caller* changes —
  `useDisclosure(true)` in [`StrandDetail.tsx`](../StrandDetail.tsx.md). Do not
  hardcode `true` here; that would change behaviour for every future consumer.
- If you add a new action, add it to **both** `UseDisclosureReturn` and the
  returned object, and memoise it with `useCallback(..., [])` unless it closes
  over changing values (then list those values as deps).
- Keep it generic — this hook intentionally knows nothing about timelines or
  beacons. Resist adding strand-specific logic here.
- Cross-reference: consumed in [`StrandDetail.tsx`](../StrandDetail.tsx.md),
  which feeds `isOpen`/`toggle` to
  [`ProgressBeacon`](../Progress/ProgressBeacon.tsx.md) and
  [`ProgressTimeline`](../Progress/ProgressTimeline.tsx.md).
