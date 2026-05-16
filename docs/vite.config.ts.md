# `vite.config.ts`

## What this file is

This is the configuration file for **Vite**, the build tool and development server that powers this project. When you run `npm run dev` or `npm run build`, Vite reads this file to learn how to serve and bundle the app. It exists because, although Vite works with zero configuration for many projects, this one needs the React plugin (so `.tsx` files and JSX are understood) and an explicit `base` path (so URLs to assets resolve correctly when the site is deployed). The file is tiny on purpose — Vite's defaults handle almost everything else.

## Line-by-line / block walkthrough

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
```

These two lines are **ESM imports** (ECMAScript Modules — the modern, standardized JavaScript way of pulling code from other files or packages). The syntax `import { defineConfig } from 'vite'` means: "from the package named `vite`, give me the *named export* called `defineConfig`." Curly braces `{ }` mean you are picking specific named things out of a module.

The second line, `import react from '@vitejs/plugin-react'`, has **no** curly braces. That is a **default import**: a module can have one "default" export, and you can name it whatever you like on import. Here we call it `react`. (The package name `@vitejs/plugin-react` uses an npm "scope" — the `@vitejs/` prefix is just a namespace owned by the Vite team.)

```ts
export default defineConfig({
  plugins: [react()],
  base: '/',
})
```

`export default` makes this object the single main thing this file provides — Vite imports it automatically. We don't *have* to wrap our config in `defineConfig(...)`; we could export a plain object. But `defineConfig` is a helper that does nothing at runtime except give your editor full **type-checking and autocomplete** for every Vite option. This is a common TypeScript pattern: a function that just returns its argument but carries rich type information.

- `plugins: [react()]` — an array of Vite plugins. Calling `react()` *invokes* the plugin factory and returns the configured plugin. This one teaches Vite to transform JSX/TSX, enable React Fast Refresh (instant updates in the browser while you edit), and wire up the modern JSX runtime.
- `base: '/'` — the public base path the site is served from. `'/'` means "the site lives at the domain root" (e.g. `https://example.com/`). If the site were instead deployed under a subfolder like `https://example.com/myapp/`, you would set `base: '/myapp/'` so that built asset URLs point to the right place.

## Libraries & APIs used

- **vite** — the dev server + bundler. In development it serves your source files over native ESM with near-instant hot reloading; for production it bundles and optimizes everything with Rollup. `defineConfig` is its config helper. Docs: <https://vitejs.dev/config/>
- **@vitejs/plugin-react** — the official Vite plugin for React. Handles JSX transformation and Fast Refresh. Docs: <https://github.com/vitejs/vite-plugin-react>

## Concepts to learn here

- ESM `import`: the difference between **named imports** (`{ defineConfig }`) and **default imports** (`react`).
- `export default` vs named exports.
- The "config-as-code" pattern: a config file is a real module that runs and returns an object.
- Wrapper functions like `defineConfig` that exist purely for type-safety/DX (developer experience).
- The concept of a build tool **plugin** and a deployment **base path**.

## How to edit it safely

- **To add a Vite feature** (path aliases, env var prefixes, a dev server port, proxying API calls), add keys to the object passed to `defineConfig`. Because of `defineConfig`, your editor will autocomplete valid options — trust it.
- **If you deploy to a subpath** (GitHub Pages project sites, a CDN folder), change `base` to match that subpath, with leading and trailing slashes (e.g. `'/mnth/'`). Getting this wrong is the #1 cause of "the site loads but all CSS/JS 404s in production."
- **To add another plugin**, install it with npm, import it, and add `pluginName()` to the `plugins` array. Order can matter for some plugins.
- Do **not** rename this file or change it to `.js` unless you also remove the TypeScript tooling — `tsconfig.node.json` specifically type-checks `vite.config.ts`.
