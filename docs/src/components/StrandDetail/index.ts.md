# `src/components/StrandDetail/index.ts`

## What this file is

This is the **public entry point** ("barrel file") for the entire `StrandDetail`
folder. When some other part of the app wants the strand-detail view, it does
not reach deep into the folder — it imports from here. Everything else in the
folder is an internal implementation detail.

A barrel file has one job: decide what the outside world is allowed to see, and
give those things stable names.

## Line-by-line / block walkthrough

```ts
export { default } from './StrandDetail'
```

`StrandDetail.tsx` has a *default export* (the component function). The line
above **re-exports** that default export as *this file's* default export. So a
consumer can write:

```ts
import StrandDetail from '../components/StrandDetail'
```

and get the component. Note the import path is the folder, not a file —
Node/Vite automatically resolve `StrandDetail/` to `StrandDetail/index.ts`.

```ts
export { default as StrandDetail } from './StrandDetail'
```

This re-exports the *same* component a second time, but as a **named export**
called `StrandDetail`. This is a common convenience pattern: some people prefer
`import StrandDetail from '...'` (default) and some prefer
`import { StrandDetail } from '...'` (named). Offering both means callers do not
have to care which style the file used internally.

```ts
export type { StrandDetailProps } from './types'
```

This re-exports the **TypeScript type** `StrandDetailProps` (defined in
`types.ts`). The `export type` keyword (rather than plain `export`) tells the
compiler "this is a type, not a runtime value" — it is erased entirely from the
compiled JavaScript. Consumers who need to type a variable that holds props for
this component can import the type from the same place they import the
component.

## Libraries & APIs used

- ES module `export ... from` re-export syntax (no library).
- TypeScript `export type` (type-only export).

## Concepts to learn here

- **Barrel files / public API surface.** A folder is a module; `index.ts`
  curates what leaks out. Keeping internals unexported lets you refactor the
  folder freely without breaking consumers.
- **Default vs named exports**, and offering both for ergonomics.
- **Type-only exports** and why they vanish at runtime.

## How to edit it safely

- If you add a new component to this folder that the *rest of the app* should
  use, add an `export` line here. If it is only used *inside* this folder, do
  **not** add it — keep the surface small.
- If you rename `StrandDetail.tsx`, update both re-export lines here; nothing
  outside the folder should need to change.
- Keep type re-exports as `export type` — switching to plain `export` would pull
  the type into the runtime bundle as a (broken) value import under
  `isolatedModules`.
- Cross-reference: the props type itself lives in
  [`types.ts`](./types.ts.md); the component in
  [`StrandDetail.tsx`](./StrandDetail.tsx.md).
