# `package.json`

## What this file is

`package.json` is the **manifest** for any Node/npm project. It names the project, declares which third-party packages it depends on (and at which version ranges), and defines the **scripts** you run from the terminal (`npm run dev`, `npm run build`, etc.). When you run `npm install`, npm reads the `dependencies`/`devDependencies` here and downloads them into `node_modules/`. This is the first file to read to understand "what is this project made of and how do I run it?"

## Line-by-line / block walkthrough

```json
"name": "mnth-static",
"private": true,
"version": "0.0.0",
"type": "module",
```

- `name` — the package's identifier. For an app (not a published library) it's mostly cosmetic.
- `private: true` — guards against accidentally publishing this to the public npm registry with `npm publish`.
- `version` — `0.0.0` is a placeholder; it isn't a released library so the number doesn't matter much.
- `type: "module"` — **important.** This tells Node to treat `.js`/`.ts` files as **ES Modules** (using `import`/`export`) rather than the old CommonJS (`require`). This is why `vite.config.ts` uses `import ... from`. It aligns with the `"module": "ESNext"` settings in the tsconfig files.

```json
"scripts": {
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview"
},
```

These define commands runnable via `npm run <name>`:

- `dev` → runs `vite`, which starts the **development server**. It serves your source over native ESM with Hot Module Replacement (edit a file, the browser updates instantly without a full reload). This is what you use while developing. Open the printed `localhost` URL.
- `build` → `tsc && vite build`. The `&&` means "run `tsc`, and **only if it succeeds**, run `vite build`." `tsc` type-checks the whole project (following `tsconfig.json` → app + node sub-projects). If types are wrong, the build fails *before* bundling. Then `vite build` produces the optimized, minified static site in `dist/`.
- `preview` → `vite preview` serves the already-built `dist/` folder locally so you can sanity-check the production build before deploying.

```json
"dependencies": {
  "animejs": "^4.4.1",
  "highlight.js": "^11.11.1",
  "marked": "^15.0.12",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "three": "^0.184.0"
},
```

`dependencies` are packages the **shipped app needs at runtime**. The `^` (caret) in `^4.4.1` means "this version or any newer compatible one that doesn't change the major version" — i.e. `>=4.4.1 <5.0.0`. (Caret pins the leftmost non-zero segment; for `0.184.0` it means `>=0.184.0 <0.185.0`.)

- **react** — the UI library: components, state, hooks. The mental model behind every `.tsx` file.
- **react-dom** — the renderer that puts React components into the actual browser DOM. `src/main.tsx` uses `react-dom/client`'s `createRoot`.
- **three** — Three.js, a WebGL 3D library. Used by the 3D helix scene (`src/components/Helix3D/`, `helixScene.ts`).
- **animejs** — a lightweight animation engine for tweening DOM/SVG/JS values over time. Used by the home/concept animated scenes.
- **marked** — a fast Markdown → HTML compiler. Used to render the `src/content/marginalia/*.md` articles into the page.
- **highlight.js** — syntax highlighting for code blocks (typically paired with `marked` so code inside articles is colourized).

```json
"devDependencies": {
  "@types/react": "^18.3.1",
  "@types/react-dom": "^18.3.1",
  "@types/three": "^0.184.1",
  "@vitejs/plugin-react": "^4.3.1",
  "typescript": "^5.5.3",
  "vite": "^5.4.1"
}
```

`devDependencies` are needed only to **develop/build** the project, not at runtime in the browser:

- **@types/react**, **@types/react-dom**, **@types/three** — TypeScript *type definitions* for libraries that ship as plain JavaScript. Installing these gives you autocomplete and type-checking for React, ReactDOM, and Three.js. (`react`/`three` themselves contain no types; the `@types/*` packages supply them.)
- **@vitejs/plugin-react** — the Vite plugin enabling JSX/TSX transformation and Fast Refresh (configured in `vite.config.ts`).
- **typescript** — the `tsc` compiler used by the `build` script and your editor.
- **vite** — the dev server and bundler itself.

## Libraries & APIs used

Every package listed above. Authoritative docs:

- npm / `package.json` fields: <https://docs.npmjs.com/cli/v10/configuring-npm/package-json>
- React: <https://react.dev> · ReactDOM: <https://react.dev/reference/react-dom>
- Vite: <https://vitejs.dev> · @vitejs/plugin-react: <https://github.com/vitejs/vite-plugin-react>
- TypeScript: <https://www.typescriptlang.org>
- Three.js: <https://threejs.org> · anime.js: <https://animejs.com> · marked: <https://marked.js.org> · highlight.js: <https://highlightjs.org>

## Concepts to learn here

- The difference between **`dependencies`** (runtime) and **`devDependencies`** (build/dev only).
- **Semver** and the meaning of the `^` caret range.
- `"type": "module"` and CommonJS vs. ES Modules in Node.
- npm **scripts** and shell chaining with `&&`.
- Why JavaScript libraries need separate **`@types/*`** packages for TypeScript.
- The dev → build → preview lifecycle.

## How to edit it safely

- **To add a library:** run `npm install <pkg>` (runtime) or `npm install -D <pkg>` (dev tooling). npm updates this file *and* `package-lock.json` for you — prefer the command over hand-editing, so the lockfile stays consistent.
- **Never hand-edit `package-lock.json`.** It records exact resolved versions for reproducible installs; let npm manage it.
- **Changing a version range** here does not retroactively change installed code until you run `npm install`.
- **Adding a script:** add a key under `"scripts"`. Run it with `npm run <key>`.
- Keep `react` and `react-dom` (and their `@types/*`) on **matching major versions** — mismatches cause subtle runtime errors.
- Keep `three` and `@types/three` versions aligned; the Three.js API changes often between minor versions.
