# `src/components/HomeMashup/index.ts`

## What this file is

A **barrel file** — a tiny module whose only job is to re-export the public API
of the `HomeMashup/` folder so the rest of the app can import it cleanly:

```ts
import HomeMashup from '@/components/HomeMashup'
// instead of
import HomeMashup from '@/components/HomeMashup/HomeMashup'
```

It contains no logic.

## Line-by-line / block walkthrough

```ts
export { default } from './HomeMashup'
export { default as HomeMashup } from './HomeMashup'
```

Two re-export statements, both pointing at the sibling `HomeMashup.tsx`:

- **`export { default } from './HomeMashup'`** — a *re-export*. It takes the
  default export of `./HomeMashup` (the `HomeMashup` component) and re-exports
  it as the **default export of this folder**. When Node/the bundler resolves
  `import X from '@/components/HomeMashup'`, it looks for `index.ts` in that
  folder, finds this default export, and binds it to `X`. So
  `import HomeMashup from '@/components/HomeMashup'` works.
- **`export { default as HomeMashup } from './HomeMashup'`** — the same default
  export, re-exported *also* as a **named export** called `HomeMashup`. This
  enables `import { HomeMashup } from '@/components/HomeMashup'`.

Offering both forms (default and named) is a common convenience so callers can
use whichever import style the codebase prefers; they resolve to the exact same
component.

A note on **`export … from`**: this is "re-export" syntax. It is shorthand for
`import { default } from './HomeMashup'; export { default }` — the binding is
forwarded without ever creating a local variable in this file.

## Libraries & APIs used

- **ES Modules** only — `export … from` re-export syntax. No React, no runtime
  behaviour.

## Concepts to learn here

- The barrel-file / `index.ts` pattern: a folder's public entry point.
- `default` vs *named* exports, and how to expose one binding as both.
- `export { x } from './y'` re-export syntax (forwarding without a local var).

## How to edit it safely

- **Expose another piece of the folder publicly** (say you want callers to
  import `SceneDescriptor`): add
  `export type { SceneDescriptor } from './types'`. Use `export type` for
  type-only re-exports so the binding is erased at build time.
- **Do not** add logic here. A barrel file should stay declarative; importing
  it should have zero side effects.
- **Gotcha — circular imports.** Don't import this `index.ts` from files
  *inside* the same folder (e.g. a scene importing
  `from '@/components/HomeMashup'`). Inside the folder, import the specific
  sibling directly (`from './HomeMashup'`, `from './types'`). Barrel files
  importing their own folder's modules that in turn import the barrel is a
  classic circular-dependency trap.
- If you rename `HomeMashup.tsx`, update both `from './HomeMashup'` paths here.
