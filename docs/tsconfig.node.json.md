# `tsconfig.node.json`

## What this file is

This is the TypeScript configuration for the project's **Node.js-side tooling** — specifically `vite.config.ts`. That file runs inside Node.js (when Vite starts), *not* in the browser, so it needs different assumptions than the app code: a newer language target, no DOM types, and no JSX. It is the second of the two sub-projects referenced by the root `tsconfig.json`. Splitting it out means a mistake in your Vite config is type-checked too, but with rules appropriate to where it actually executes.

## Line-by-line / block walkthrough

```json
"target": "ES2022",
"lib": ["ES2023"],
```

The Node environment that runs Vite supports very modern JavaScript, so the `target` is `ES2022` and `lib` is `ES2023`. Crucially, **there is no `"DOM"` entry** — `vite.config.ts` should never touch `window` or `document`, and omitting DOM types makes TypeScript flag it if you accidentally do.

```json
"module": "ESNext",
"moduleResolution": "bundler",
"allowImportingTsExtensions": true,
```

Same module philosophy as the app config: native ES modules, bundler-style import resolution, explicit `.ts` extensions allowed. This is consistent with the project being `"type": "module"` in `package.json`.

```json
"isolatedModules": true,
"moduleDetection": "force",
"noEmit": true,
```

Same as the app config: each file is an independent module, every file is treated as a module, and `tsc` emits nothing — it only checks types. The actual loading of `vite.config.ts` is handled by Vite/Node, not by `tsc`.

```json
"strict": true,
"noUnusedLocals": true,
"noUnusedParameters": true,
"noFallthroughCasesInSwitch": true
```

Identical strictness and cleanliness rules to the app config, so configuration code is held to the same quality bar as application code.

```json
"include": ["vite.config.ts"]
```

This config's scope is exactly one file: `vite.config.ts`. (Note the **absence** of `"jsx"` — there is no React/JSX in Node tooling, so the option isn't needed.)

## Libraries & APIs used

- **typescript** — the type-checker. Same option reference as elsewhere: <https://www.typescriptlang.org/tsconfig>
- **vite** / **@vitejs/plugin-react** types — these are what `vite.config.ts` imports; this config ensures those imports are type-checked correctly in a Node context.

## Concepts to learn here

- The same codebase can have **multiple TypeScript environments** (browser vs. Node) with different `lib`/`target`.
- Why you'd deliberately *exclude* DOM types from build tooling (it prevents environment-confused code).
- How `include` narrows a project to specific files.
- Consistency: tooling code gets the same `strict` treatment as app code.

## How to edit it safely

- **If you add more Node-only scripts** (e.g. a `scripts/generate.ts` or `vitest.config.ts`), add them to `include` so they get type-checked here, e.g. `"include": ["vite.config.ts", "scripts/**/*.ts"]`.
- Resist adding `"DOM"` to `lib` here — if you find yourself wanting it, the code probably belongs in `src/` (the app project), not in tooling.
- Keep `noEmit: true`; this project never compiles config files to disk.
- Bump `target`/`lib` only if you rely on a newer JS feature *and* your Node version supports it.
