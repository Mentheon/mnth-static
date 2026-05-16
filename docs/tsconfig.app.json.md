# `tsconfig.app.json`

## What this file is

This is the TypeScript configuration for the **application source code** — everything under `src/` that runs in the browser. It is one of the two sub-projects referenced by the root `tsconfig.json`. It declares which JavaScript/DOM features TypeScript should assume are available, how strict the type-checking should be, and how JSX (React's HTML-in-JS syntax) should be compiled. This file is *type-checking only* — Vite (not `tsc`) actually transforms and bundles the code; `tsc` here just acts as a strict safety net that fails the build if types are wrong.

## Line-by-line / block walkthrough

```json
"target": "ES2020",
```

`target` is the JavaScript language version TypeScript assumes/aims for when it reasons about your code (e.g. it knows `?.` optional chaining and `Promise.allSettled` exist at ES2020). Vite still down-levels output for older browsers during the real build, but type-checking uses this baseline.

```json
"useDefineForClassFields": true,
```

Makes TypeScript class fields follow the modern ECMAScript "define" semantics instead of older TypeScript-specific behaviour. Mostly relevant if you write classes; this codebase is component-function-heavy so you'll rarely notice it, but it's the correct modern default.

```json
"lib": ["ES2020", "DOM", "DOM.Iterable"],
```

`lib` lists the **built-in type definitions** to load. `ES2020` gives core JS APIs; `DOM` gives browser globals like `document`, `window`, `HTMLElement`; `DOM.Iterable` adds iterator support for DOM collections (so you can `for...of` over a `NodeList`). This is *why* `src/App.tsx` can use `window.location.hash` and `window.addEventListener` with full type-safety.

```json
"module": "ESNext",
"moduleResolution": "bundler",
```

`module: "ESNext"` keeps your `import`/`export` statements as native ES modules (a bundler will handle them). `moduleResolution: "bundler"` tells TypeScript to resolve imports the way a modern bundler (Vite) does — so things like importing a CSS file or omitting file extensions work without TypeScript complaining.

```json
"allowImportingTsExtensions": true,
```

Permits writing `import x from './foo.ts'` with the explicit `.ts` extension. Safe here because nothing is emitted by `tsc` (see `noEmit` below).

```json
"isolatedModules": true,
"moduleDetection": "force",
```

`isolatedModules` ensures every file can be compiled on its own (each file must be a module), which is required by single-file transpilers like the one Vite uses. `moduleDetection: "force"` treats every `.ts/.tsx` file as a module even if it has no `import`/`export`, so there are no accidental "global script" files.

```json
"noEmit": true,
```

TypeScript here produces **no output files**. It only *checks* types. Vite is responsible for actually turning `.tsx` into browser JavaScript. This is the standard Vite + TS arrangement.

```json
"jsx": "react-jsx",
```

This is the line that makes **JSX** work. `react-jsx` selects React 17+'s "automatic runtime": you can write JSX like `<App />` *without* manually `import React from 'react'` in every file. (Notice `src/App.tsx` never imports React itself, yet returns JSX — this setting is why.)

```json
"strict": true,
```

Turns on the full bundle of strict type-checking flags (no implicit `any`, strict null checks, etc.). This is the single most important setting for catching bugs at edit-time and is what makes the `!` in `document.getElementById('root')!` (in `src/main.tsx`) necessary.

```json
"noUnusedLocals": true,
"noUnusedParameters": true,
"noFallthroughCasesInSwitch": true
```

Three extra "tidiness" checks: error on unused variables, on unused function parameters, and on `switch` cases that fall through without `break`/`return`. These keep the codebase clean and catch a common class of mistakes.

```json
"include": ["src"]
```

Scope: type-check everything in the `src/` directory. That is the entire browser app.

## Libraries & APIs used

- **typescript** — the compiler/type-checker reading this file. Reference for every option: <https://www.typescriptlang.org/tsconfig>
- **DOM lib types** — built into TypeScript; this is how browser APIs (`window`, `document`, events) are typed without installing anything.

## Concepts to learn here

- `target` / `lib` and how TypeScript "knows" which APIs exist.
- `noEmit` + a bundler: type-checking and code generation are *separate jobs*.
- `jsx: "react-jsx"` and the modern JSX runtime (no per-file React import).
- `strict` mode and what it forces you to handle (nulls, `any`).
- The cleanliness flags (`noUnusedLocals`, etc.) and why teams enable them.

## How to edit it safely

- **To loosen strictness while learning** (not recommended long-term), you could set `"strict": false`, but you will lose most of TypeScript's value. Prefer fixing the type error instead.
- **If unused-variable errors block you** during a refactor, prefix the variable with `_` or temporarily relax `noUnusedLocals`/`noUnusedParameters` — but re-enable before committing.
- **To use a newer JS API** (e.g. something from ES2023), bump `target` and add the matching entry to `lib` (e.g. add `"ES2023"`), and confirm your target browsers support it.
- Do **not** set `"noEmit": false` here — that would make `tsc` start writing `.js` files alongside your source and fight with Vite.
- Editing `include` changes what gets type-checked; keep it as `["src"]` unless you intentionally restructure the project.
