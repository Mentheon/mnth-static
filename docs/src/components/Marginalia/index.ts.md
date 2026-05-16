# `src/components/Marginalia/index.ts`

## What this file is

This is the **barrel file** (also called an "index file") for the
Marginalia feature. Its only job is to be the single, tidy front door
to the whole folder.

When some other part of the app wants to use Marginalia, it does **not**
reach deep into the folder like this:

```ts
import Marginalia from '../components/Marginalia/Marginalia'
```

Instead it imports from the *folder*, and Node/Vite automatically looks
for an `index.ts` (or `index.tsx`) inside it:

```ts
import Marginalia, { type Article } from '../components/Marginalia'
```

That second style is what `index.ts` enables. The benefit: the internal
file layout of `Marginalia/` can be reorganised freely (rename
`Marginalia.tsx`, move types around) and nothing outside the folder
breaks, as long as `index.ts` keeps re-exporting the same names.

## Line-by-line / block walkthrough

```ts
export { default } from './Marginalia'
```

This single line does two things at once and is worth unpacking
carefully because the syntax is dense:

- `from './Marginalia'` — look at the sibling file `Marginalia.tsx`
  (the `.tsx` extension is implied; TypeScript resolves it).
- `{ default }` — grab that file's **default export**. In
  `Marginalia.tsx` the component is declared as
  `export default function Marginalia(...)`. The name of a default
  export is not significant outside its own file; what matters is the
  *position* "default".
- `export { default }` — immediately re-export it, *still as the
  default export of this file*.

Net effect: the default export of `index.ts` **is** the `Marginalia`
component. This is called a **re-export**. No new variable is created;
nothing is rendered; it is pure plumbing.

```ts
export type { Article, ArticleType, MarginaliaProps } from './types'
```

This re-exports three **types** from the sibling `types.ts`:

- `export type { ... }` — the `type` keyword tells TypeScript these are
  *type-only* exports. They exist only at compile time and are erased
  from the final JavaScript bundle (this is called **type-only
  import/export elision**). Using `export type` is a small best
  practice: it makes the intent explicit and helps the bundler strip
  the code.
- `{ Article, ArticleType, MarginaliaProps }` — these are **named**
  exports (each has a real name, unlike `default`). They are re-exported
  under the same names.

So a consumer can now write a single import that pulls both the
component and its types from one place:

```ts
import Marginalia, { type Article, type MarginaliaProps } from '../components/Marginalia'
```

## Libraries & APIs used

- **ES Modules (ESM)** — `import` / `export` syntax, the JavaScript
  module standard. Nothing here is React-specific or library-specific.
- **TypeScript `export type`** — the type-only export form.

## Concepts to learn here

- **Barrel files / index modules**: a folder's `index.ts` becomes the
  public API surface for that folder. Keep it small and curated — only
  re-export what the *rest of the app* legitimately needs. Internal
  helper components (like `ArticleCard`) are deliberately *not*
  re-exported here, signalling "these are private to Marginalia".
- **Re-export syntax**: `export { default } from '...'` and
  `export { X } from '...'` move bindings outward without touching them.
- **Default vs named exports**: `default` is one special anonymous slot
  per module; named exports are addressed by name.
- **Type-only exports** and why they vanish from the runtime bundle.

## How to edit it safely

- **Adding a new public sub-component?** If (and only if) something
  *outside* `Marginalia/` needs it, add another line, e.g.
  `export { default as ArticleCard } from './List/ArticleCard'`.
  Prefer keeping the surface minimal — most sub-components should stay
  internal.
- **Renaming `Marginalia.tsx`?** Update the path string in line 1 only;
  every external import keeps working because they target the folder.
- **Adding a new shared type to `types.ts`?** If consumers outside the
  folder need it, add its name to the `export type { ... }` list on
  line 2.
- **Gotcha**: don't accidentally turn `export type { ... }` into
  `export { ... }`. The latter would attempt a *runtime* re-export of
  something that only exists as a type, which the bundler will reject or
  warn about.
- The paired files referenced here are
  [`Marginalia.tsx`](./Marginalia.tsx.md) and
  [`types.ts`](./types.ts.md) — read those next to understand what is
  actually being exported.
