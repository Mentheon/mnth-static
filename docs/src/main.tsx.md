# `src/main.tsx`

## What this file is

This is the **entry point** of the entire React application — the very first of your own code that runs in the browser. Vite's `index.html` loads this file as a module; its job is to find the empty `<div id="root">` in the HTML page and tell React to render the whole `<App />` component tree inside it. It is deliberately tiny: it just *bootstraps* React and gets out of the way. The `.tsx` extension means "TypeScript file that may contain JSX."

## Line-by-line / block walkthrough

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
```

Four **ESM imports**:

- `StrictMode` — a named import from `react`. It's a React component (renders nothing visible) that activates extra development-only checks and warnings to surface bugs early.
- `createRoot` — a named import from `react-dom/client`. This is React 18's modern API for attaching a React app to a DOM node (it replaced the older `ReactDOM.render`). Note the *subpath* `react-dom/client` — a package can expose multiple entry points.
- `import './index.css'` — importing a **CSS file** for its side effect. There is no variable here; the import statement simply tells the bundler "include this stylesheet in the page." This is a Vite/bundler convention, not standard browser behaviour. The leading `./` makes it a **relative import** (a file in this folder), versus a bare name like `react` which means "a package from `node_modules`."
- `import App from './App'` — a **default import** of our root component from `./App` (Vite resolves the `.tsx` extension automatically). `App` is named by us on import because it's the default export.

```tsx
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

This is the boot sequence:

- `document.getElementById('root')` — a standard **DOM API** call that finds the `<div id="root">` element defined in `index.html`. This is the container React will manage.
- The trailing `!` is a TypeScript **non-null assertion**. `getElementById` is typed as possibly returning `null`. `!` tells TypeScript "trust me, this is definitely not null here." It's safe because we know the element exists in our HTML — but it's an assertion, not a runtime check, so if you renamed the div in HTML this would crash at runtime.
- `createRoot(container)` creates a React "root" bound to that DOM node, and `.render(...)` mounts a React element tree into it.
- `<StrictMode><App /></StrictMode>` is **JSX**. JSX looks like HTML but is really syntactic sugar for function calls that create React elements. `<App />` is *rendering a component* — `App` is a function (defined in `App.tsx`) that returns more JSX. Wrapping it in `<StrictMode>` opts the whole tree into React's strict development checks (which intentionally double-invoke certain functions in dev to help you catch impure code — this is why you might see effects run twice in development only).
- The trailing comma after `</StrictMode>,` is just a normal allowed trailing argument comma.

## Libraries & APIs used

- **react** — provides `StrictMode`. Docs: <https://react.dev/reference/react/StrictMode>
- **react-dom/client** — provides `createRoot`, the React 18 entry API. Docs: <https://react.dev/reference/react-dom/client/createRoot>
- **Browser DOM API** — `document.getElementById`, built into browsers. Docs: <https://developer.mozilla.org/docs/Web/API/Document/getElementById>
- **Vite CSS import** — importing `./index.css` is handled by Vite's asset pipeline. Docs: <https://vitejs.dev/guide/features.html#css>

## Concepts to learn here

- The single **mount point** pattern: one root `<div>`, one `createRoot().render()` call, one component tree.
- ESM imports: named vs. default vs. side-effect (`import './index.css'`), and package **subpath imports** (`react-dom/client`).
- **JSX** as function-call sugar; rendering a component with `<App />`.
- TypeScript **non-null assertion** (`!`) and its risk.
- `StrictMode` and React's dev-only double-invocation behaviour.
- How a static HTML page hands control over to a JavaScript app.

## How to edit it safely

- **To wrap the app in a global provider** (theme, context, router, error boundary), nest it *inside* `<StrictMode>` and *around* `<App />`, e.g. `<StrictMode><ThemeProvider><App /></ThemeProvider></StrictMode>`.
- **The string `'root'`** must match the `id` attribute of the div in `index.html`. Change one, change both, or the `!` assertion will hide a crash.
- **Removing `<StrictMode>`** is possible but discouraged — it's only active in development and helps catch bugs. If an effect "runs twice" in dev and that confuses you, that's StrictMode doing its job, not a bug to fix by deleting StrictMode.
- Keep the `import './index.css'` here (or somewhere top-level) — it's what loads the global stylesheet for the whole site.
- Don't add UI/logic here; this file should stay a thin bootstrap. Real app structure lives in `src/App.tsx` and below.
