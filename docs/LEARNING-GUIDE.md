# Learning Guide — Read This First

This is a practical, example-driven primer for understanding the **mnth-static** codebase. Examples are taken from *this* project so you can immediately go look at the real file. After this, read the per-file docs in the order suggested in [README.md](./README.md).

The project is a **single-page website**: one HTML page, and JavaScript (React) swaps the visible content based on the URL's `#hash`. It is built with **Vite**, written in **TypeScript + React 18**, and styled with a mix of global CSS and CSS Modules.

---

## 1. The big picture: what runs, and when

There are two "times" to keep separate in your head:

- **Build/dev time** — happens on your machine via Node.js. Tools: Vite, TypeScript (`tsc`), `@vitejs/plugin-react`. They turn `.tsx`/`.css` source into plain JS/CSS the browser can run.
- **Runtime** — happens in the user's browser. Code: React + ReactDOM + your components + libraries like Three.js, anime.js, marked, highlight.js.

`package.json` defines the entry commands:

```json
"scripts": { "dev": "vite", "build": "tsc && vite build", "preview": "vite preview" }
```

- `npm run dev` → Vite dev server. It serves your source over native ES modules and does **Hot Module Replacement**: save a file, the browser updates in place, no full reload, state often preserved. This is the fast feedback loop you develop in.
- `npm run build` → first `tsc` type-checks the whole project (it compiles nothing — it's a safety gate; if a type is wrong the build stops). Then `vite build` bundles & minifies everything into a `dist/` folder of static files.
- `npm run preview` → serves the built `dist/` so you can test the production output locally.

How a page boots at runtime: `index.html` contains an empty `<div id="root">` and loads `src/main.tsx`. That file does:

```tsx
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
```

i.e. "find the root div, and render the React `<App />` tree into it." From there `App.tsx` decides what to show. See [`src/main.tsx.md`](./src/main.tsx.md) and [`src/App.tsx.md`](./src/App.tsx.md).

---

## 2. ESM imports (ES Modules)

Every `.ts`/`.tsx` file is a **module**. Modules share code with `import`/`export`.

```tsx
import { useState, useEffect } from 'react'   // named imports (pick specific exports)
import App from './App'                        // default import (one main export; you name it)
import './index.css'                           // side-effect import (run/include the file, no value)
import react from '@vitejs/plugin-react'       // default import of a package
```

Rules of thumb you'll see throughout:

- **Bare specifier** (`'react'`, `'three'`) = a package from `node_modules`.
- **Relative specifier** (`'./App'`, `'../data/strands'`) = a file in this project. Vite resolves the `.ts`/`.tsx` extension for you.
- **Subpath** (`'react-dom/client'`) = a specific entry point inside a package.
- A file exposes things with `export` (named) or `export default` (one default). `App.tsx` ends with `export default function App() {...}`; `main.tsx` imports it as `import App from './App'`.

The project is `"type": "module"` in `package.json`, so even Node-side files (`vite.config.ts`) use `import`, not `require`.

---

## 3. TypeScript basics used here

TypeScript = JavaScript + a type system checked at build time (it disappears at runtime). File extensions: **`.ts`** = TypeScript, **`.tsx`** = TypeScript that may contain **JSX** (React markup). Use `.tsx` for components, `.ts` for plain logic/data/hooks.

Concepts you'll meet:

- **Type annotations** — `const hash: string = ...`. Often inferred, so explicit annotations are mostly on function parameters and props.
- **Interfaces / type aliases** — describe the shape of an object. You'll see component props typed like:
  ```ts
  interface HeaderProps { currentHash: string }
  function Header({ currentHash }: HeaderProps) { ... }
  ```
  An `interface` and a `type` both name a shape; use either consistently.
- **Generics** — a type that takes a type parameter, written with `<...>`. React's `useState` is generic: `useState<string>('')` means "state holding a string." In `App.tsx`, `useState(window.location.hash)` infers `string` automatically.
- **Union types** — `'home' | 'who' | 'strand'`: a value that must be one of a fixed set (the `page` variable in `App.tsx` is conceptually this).
- **Non-null assertion `!`** — `document.getElementById('root')!` tells TS "this isn't null, trust me." A convenience that bypasses a check, so use it only when you're certain.
- **Nullish coalescing `??`** and **optional chaining `?.`** — `a ?? b` uses `a` unless it's `null`/`undefined`; `obj?.x` reads `x` only if `obj` exists. `App.tsx` chains `?? STRANDS.find(...) ?? STRANDS[0]` to pick a fallback.
- **`strict` mode** is on (see [`tsconfig.app.json.md`](./tsconfig.app.json.md)) — it forces you to handle `null`/`undefined` and forbids implicit `any`. Lean into the errors; they catch real bugs.

The TypeScript setup is split across [`tsconfig.json`](./tsconfig.json.md) (orchestrator), [`tsconfig.app.json`](./tsconfig.app.json.md) (browser code in `src/`), and [`tsconfig.node.json`](./tsconfig.node.json.md) (`vite.config.ts`).

---

## 4. React mental model

**A React app is a tree of components.** A component is a function that takes inputs (**props**) and returns a description of UI (**JSX**). React calls these functions, compares the result to what's on screen, and updates only what changed.

### JSX

```tsx
return (
  <>
    <Header currentHash={hash} />
    {page === 'who' ? <WhoPage /> : <ConceptView />}
  </>
)
```

JSX *looks* like HTML but is JavaScript. `<Header .../>` renders the `Header` component. `{ ... }` embeds a JS expression. `<>...</>` is a **Fragment** (group elements without an extra wrapper DOM node). The `jsx: "react-jsx"` tsconfig setting is why you don't need to `import React` in every file.

### Props

Inputs passed parent → child as attributes: `<Header currentHash={hash} />`. Inside `Header`, `currentHash` is read-only data. Data flows **down**; to send info back up, a parent passes a callback prop.

### State and re-rendering

`useState` gives a component memory:

```tsx
const [hash, setHash] = useState(window.location.hash)
```

`hash` is the current value; `setHash(next)` updates it **and triggers a re-render**. Never mutate state directly — always call the setter.

### Hooks (the ones used in this codebase)

Hooks are functions starting with `use*`, callable only at the top level of a component or another hook.

- **`useState`** — local state (above).
- **`useEffect`** — run a side effect *after* render. The **dependency array** controls when:
  ```tsx
  useEffect(() => {
    const handler = () => setHash(window.location.hash)
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler) // cleanup
  }, [])  // [] = run once on mount; cleanup runs on unmount
  ```
  Returning a function = cleanup (unsubscribe, cancel timers). `[]` = once; `[x]` = whenever `x` changes; no array = every render.
- **`useRef`** — a mutable box (`ref.current`) that survives re-renders *without* causing them. Used in this codebase to hold DOM nodes (e.g. a `<canvas>` for Three.js / `<div>` for anime.js) and animation/scene instances.
- **`useMemo`** — cache an expensive computed value between renders unless its dependencies change: `const x = useMemo(() => compute(a), [a])`.
- **`useCallback`** — like `useMemo` but for functions; keeps a stable function identity so child components/effects don't re-run unnecessarily.
- **Custom hooks** — extract reusable stateful logic into your own `useX` function. `App.tsx` defines `useHash()`; the project also has `useTypewriter` and `useIsMobile`. A custom hook is just a function that calls hooks.

### Conditional rendering & lists

- **Conditional**: `if (page === 'helix3d') return <Helix3D />` (early return), or inline ternaries `cond ? <A/> : <B/>`, or `cond && <A/>`.
- **Lists**: render arrays with `.map`, and give each item a stable `key`:
  ```tsx
  {STRANDS.map(s => <StrandIcon key={s.id} strand={s} />)}
  ```
  The `key` lets React track items efficiently — use a stable unique id, not the array index where possible.

### StrictMode

`main.tsx` wraps the app in `<StrictMode>`. In development only, React intentionally double-invokes some functions (including effects) to surface impure code. That's why effects can "run twice" in dev — write effects with proper cleanup and it's harmless.

---

## 5. Styling strategies in this project

You'll see four approaches; know when each is used:

1. **Global CSS** — `src/index.css`, imported once in `main.tsx`, applies site-wide. Used for resets, the `<body>` font/colours, and design tokens. See [`src/index.css.md`](./src/index.css.md).
2. **CSS custom properties (variables)** — defined in `:root` in `index.css`:
   ```css
   :root { --crimson: #A30B37; --bg: #FFECE1; }
   ```
   Consumed anywhere with `var(--crimson)`. Change once, update everywhere — the project's theming/token system.
3. **CSS Modules** — files named `*.module.css` (e.g. `Header.module.css`). Imported as an object and class names are *locally scoped/auto-hashed* so they can't collide between components:
   ```tsx
   import styles from './Header.module.css'
   <nav className={styles.bar}>   // styles.bar → a unique generated class
   ```
   This is the default for component-specific styling here. Plain `.css` files (e.g. `ConceptView.css`, `Helix.css`) are *not* scoped — their selectors are global, so they're used more carefully.
4. **Inline styles** — `style={{ color: 'red' }}` in JSX (a JS object, camelCased properties). Used for dynamic, per-element values computed at runtime (e.g. an animated transform).

Rule of thumb in this codebase: tokens & resets → `index.css`; component look → `*.module.css`; dynamic values → inline style; whole-feature non-scoped sheets → plain `.css` (used sparingly).

---

## 6. The dependencies — what / why here / where used

From [`package.json`](./package.json.md). `^` version ranges mean "compatible newer versions allowed." `dependencies` ship to the browser; `devDependencies` only help build.

### Runtime dependencies

- **react** — *What:* the UI library (components, JSX, state, hooks). *Why here:* the entire UI is React. *Where:* every `.tsx` file; the mental model in §4. Docs: <https://react.dev>
- **react-dom** — *What:* renders React component trees into the real browser DOM. *Why here:* needed to actually display React on a page. *Where:* `src/main.tsx` (`createRoot` from `react-dom/client`). Docs: <https://react.dev/reference/react-dom>
- **three** — *What:* Three.js, a WebGL 3D engine (scenes, cameras, meshes). *Why here:* the site has 3D DNA-helix visuals. *Where:* `src/components/Helix3D/` and `src/components/helixScene.ts`; types via `@types/three`. Docs: <https://threejs.org>
- **animejs** — *What:* a small, flexible animation engine that tweens numeric values / DOM / SVG over time. *Why here:* the animated home/concept "scenes" (ECG line, pills, rings, molecules, etc.). *Where:* `src/components/HomeMashup/scenes/*` and related visual components. Docs: <https://animejs.com>
- **marked** — *What:* a fast Markdown-to-HTML compiler. *Why here:* the "Marginalia" articles are authored as Markdown. *Where:* `src/lib/marginalia/renderMarkdown.ts` (consumed by the Marginalia components). Docs: <https://marked.js.org>
- **highlight.js** — *What:* syntax highlighting for code blocks. *Why here:* code inside Markdown articles is colourized. *Where:* the Marginalia Markdown rendering pipeline alongside `marked`. Docs: <https://highlightjs.org>

### Dev dependencies

- **typescript** — *What:* the type system + `tsc` compiler. *Why here:* the whole codebase is typed; `tsc` is the build's type-check gate. *Where:* the `tsconfig.*.json` files; your editor. Docs: <https://www.typescriptlang.org>
- **vite** — *What:* dev server + production bundler. *Why here:* fast HMR dev loop and optimized builds. *Where:* `vite.config.ts`, `npm run dev/build/preview`. Docs: <https://vitejs.dev>
- **@vitejs/plugin-react** — *What:* Vite plugin that transforms JSX/TSX and enables React Fast Refresh. *Why here:* without it Vite wouldn't understand `.tsx`/JSX. *Where:* `vite.config.ts` (`plugins: [react()]`). Docs: <https://github.com/vitejs/vite-plugin-react>
- **@types/react**, **@types/react-dom**, **@types/three** — *What:* TypeScript type definitions for libraries that ship as plain JS. *Why here:* gives autocomplete and type-checking for React/ReactDOM/Three.js. *Where:* used implicitly by the compiler whenever you import those libraries. Docs: <https://www.typescriptlang.org/dt/search>

---

## 7. Where to go next

You now have the vocabulary. Follow the **Suggested reading order** in [README.md](./README.md): tooling configs → `main.tsx` → `index.css` → `App.tsx` → the data/hooks/lib helpers → core components → feature sub-trees. Each per-file doc re-teaches the concept the *first* time it appears in that file, so it's fine to encounter something here and meet it again in context.
