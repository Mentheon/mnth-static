# `src/components/HomeMashup/types.ts`

## What this file is

The **shared contract** for the whole HomeMashup feature. It exports three
types, no runtime code. Every other file in the directory either implements or
consumes these types:

- `HomeMashup.tsx` builds a `SceneDescriptor[]` and passes `SceneProps` to scenes.
- `CarouselPills.tsx` receives `SceneDescriptor[]`.
- Every `scenes/*.tsx` file is a component typed `ComponentType<SceneProps>`.

If you read one file to understand "how do all these scenes fit together?",
read this one (alongside `HomeMashup.tsx.md`). Each individual scene doc points
back here for the contract rather than re-explaining it.

## Line-by-line / block walkthrough

### Type-only import

```ts
import type { ComponentType } from 'react'
```

`ComponentType<P>` is a React type meaning "any React component (function or
class) that accepts props of shape `P`". `import type` means this import is
**erased at compile time** — it only exists for type-checking, contributing
nothing to the JS bundle. Use `import type` whenever you import something used
purely in type positions.

### `SceneId` — a string-literal union

```ts
export type SceneId =
  | 'helix'
  | 'molecule'
  | 'cell'
  | 'neural'
  | 'mri'
  | 'rings'
  | 'pills'
  | 'vrPose'
  | 'ehr'
  | 'defib'
  | 'ecg'
```

This is a **union of string literal types**. A value of type `SceneId` can only
be exactly one of these eleven strings — not any other string. The leading `|`
on each line is optional formatting (a union may start with `|`); it just keeps
the list visually aligned.

Why bother instead of plain `string`? Two payoffs:
- **Typo protection.** `{ id: 'hlix', … }` in `SCENES` would be a compile error.
- **Exhaustiveness.** If you `switch` on a `SceneId`, TypeScript can warn if you
  forget a case.

When you add a scene you must add its id here first — see
`HomeMashup.tsx.md` "How to edit it safely".

### `SceneProps` — what every scene receives

```ts
export interface SceneProps {
  /** Tells the parent what to display in the corner readout. */
  onReadoutChange: (left: string, right: string) => void
  /** Fired when the scene's animation has fully run its course. … */
  onComplete: () => void
}
```

`interface` declares an object shape. These are the **only two props every
scene gets** — this is the heart of the shared contract.

- `onReadoutChange: (left: string, right: string) => void` — the type
  `(args) => void` is a **function type**: "a function taking two strings,
  returning nothing meaningful". A scene calls this to push text into the
  corner `Readout` (e.g. `onReadoutChange('Sequencing', '1,200 / 3,200 bp')`).
- `onComplete: () => void` — a zero-argument callback the scene *may* call when
  its motion finishes. The doc comment is important: the orchestrator owns
  advance timing through `SceneDescriptor.duration`; `onComplete` is a *signal*
  reserved for future use, not a polling mechanism. In the current code
  `HomeMashup`'s handler for it is an intentional no-op.
- The `/** … */` blocks are **JSDoc/TSDoc comments**. Editors surface them on
  hover, so they're live documentation, not just comments.

### `SceneDescriptor` — one row of the carousel table

```ts
export interface SceneDescriptor {
  id: SceneId
  label: string
  duration: number
  Component: ComponentType<SceneProps>
}
```

This describes one entry in `HomeMashup`'s `SCENES` array:

- `id: SceneId` — must be one of the eleven allowed strings; used as React
  `key` and pill key.
- `label: string` — free text for the pill's accessible label.
- `duration: number` — milliseconds the scene is shown before auto-advance.
- `Component: ComponentType<SceneProps>` — the scene component itself, **typed
  to require the `SceneProps` contract**. This is the line that *enforces* every
  scene accept exactly `onReadoutChange` + `onComplete`. If you write a scene
  that takes different props and try to put it in `SCENES`, this type fails to
  compile. `Component` is capitalised because it's rendered as JSX
  (`<Component/>`), and JSX treats lowercase names as HTML elements.

## Libraries & APIs used

- **React types** — `ComponentType` from the `react` package.
- **TypeScript** — string-literal unions, `interface`, function types,
  generics (`ComponentType<SceneProps>`), `import type`.

## Concepts to learn here

- A "contract" file: centralising the types that multiple modules must agree on
  so the compiler enforces consistency.
- String-literal unions for safe enumerations.
- Function types as props (callbacks the child uses to talk to the parent).
- `ComponentType<P>` to type "a component that must accept these props".
- Type-only imports and TSDoc comments.

## How to edit it safely

- **Add a scene id:** add a new `| 'foo'` line to `SceneId`. Do this *first*
  when adding a scene; the compiler then guides you through the rest (see
  `HomeMashup.tsx.md`).
- **Add data to every scene's descriptor** (say a `theme` colour): add the
  field to `SceneDescriptor`, then TypeScript will flag every incomplete entry
  in `SCENES` until you fill it in — a feature, not a chore.
- **Add a prop every scene receives** (say `reducedMotion: boolean`): add it to
  `SceneProps`. Every scene component signature and the `HomeMashup` render site
  will need updating; the compiler lists exactly where.
- **Gotcha:** changing `onComplete` from "signal" to "the thing that advances
  the carousel" is a real behavioural change, not a typing change — you'd also
  rewrite `HomeMashup`'s auto-advance effect. The current contract deliberately
  keeps timing in the orchestrator; respect that unless you intend to redesign it.
- This file has no runtime code, so edits here never *do* anything by
  themselves — they only tighten or loosen what the compiler accepts elsewhere.
