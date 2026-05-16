# `src/App.tsx`

## What this file is

`App.tsx` is the **root component** and the site's hand-rolled **router**. The whole site is a single page (a "single-page application"), and which "page" you see is decided entirely by the URL **hash** (the part after `#`, e.g. `https://site/#who`). This file watches the hash, derives which view should be shown, picks any data the view needs (like which strand to detail), and renders the corresponding child component inside a shared `<Header>`. It exists so the app can have multiple navigable views *without* installing a routing library — just the browser's built-in `hashchange` event.

## Line-by-line / block walkthrough

```tsx
import { useState, useEffect } from 'react'
import Header from './components/Header'
import WhoPage from './components/WhoPage'
import ConceptView from './components/ConceptView'
import Helix3D from './components/Helix3D/Helix3D'
import StrandDetail from './components/StrandDetail'
import Marginalia from './components/Marginalia'
import { STRANDS } from './data/strands'
```

- `useState`, `useEffect` are React **Hooks** — special functions that let a function component "remember" things across renders (`useState`) and run side effects (`useEffect`).
- The five component imports are the top-level views this router can show. We don't document their internals here (other docs cover them), but at a high level:
  - `Header` — the persistent site navigation bar, told the current hash so it can highlight the active link.
  - `WhoPage` — the "#who" page (people/team).
  - `ConceptView` — the default landing/concept view (also used for `#concept`).
  - `Helix3D` — a full-screen 3D takeover view (its own chrome, no shared header).
  - `StrandDetail` — the detail page for one research "strand," given its data + progress.
  - `Marginalia` — the news/articles section (list or single article).
- `STRANDS` is imported from `./data/strands` — a plain TypeScript data array describing each research strand (id, progress, etc.). This is the app's local "database."

### The custom hook: `useHash`

```tsx
function useHash() {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => {
    const handler = () => setHash(window.location.hash)
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])
  return hash
}
```

This is a **custom hook** — a normal function whose name starts with `use` and that calls other hooks. It encapsulates "give me the current URL hash, and re-render when it changes."

- `const [hash, setHash] = useState(window.location.hash)` — `useState` returns a pair: the current value and a setter. **Array destructuring** names them `hash` and `setHash`. The argument `window.location.hash` is the *initial* value (the hash when the component first mounts, e.g. `"#who"`). Calling `setHash(newValue)` updates the value **and** tells React to re-render anything using it.
- `useEffect(() => { ... }, [])` — runs a **side effect** *after* render. The second argument, the **dependency array** `[]`, is empty, so the effect runs exactly **once** (on mount) and its cleanup runs on unmount. Inside, we define `handler`, subscribe to the browser's `hashchange` event, and **return a cleanup function** that unsubscribes. Returning a function from `useEffect` is React's pattern for "undo this effect" — here it prevents a memory leak / duplicate listeners.
- `return hash` — the hook hands the current hash back to whoever calls it. Now any component can call `useHash()` and automatically re-render when the URL hash changes. This is the core "reactivity" that powers the whole router.

### The component and route derivation

```tsx
export default function App() {
  const hash = useHash()
```

`App` is a **function component** (a function that returns JSX). `export default` makes it the file's main export (imported by `src/main.tsx`). It calls our custom hook to get the live hash.

```tsx
  const isStrandRoute = hash === '#strand' || hash.startsWith('#strand/')
  const hashPath = hash.split('?')[0]
  const isMarginaliaRoute =
    hashPath === '#marginalia' || hashPath.startsWith('#marginalia/')
```

Plain JavaScript string logic computes booleans for "are we on a strand route?" and "are we on a marginalia route?" Note the care taken with query strings: `hash.split('?')[0]` strips a `?strand=...` query before checking the path, so `#marginalia?strand=kindred` still counts as the marginalia route. This is **derived state** — values computed from `hash` on every render rather than stored separately (simpler and always consistent).

```tsx
  const page =
    hash === '#helix3d' ? 'helix3d'    :
    hash === '#who'     ? 'who'        :
    hash === '#concept' ? 'concept'    :
    isStrandRoute       ? 'strand'     :
    isMarginaliaRoute   ? 'marginalia' :
    'home'
```

A chained **ternary expression** (`condition ? a : b`) acting like a switch: it resolves `page` to one short string label. Anything not matched falls through to `'home'`. This is a compact way to map many URL shapes to a small set of view names.

```tsx
  if (page === 'helix3d') {
    return <Helix3D />
  }
```

**Early return** for the special full-screen view. Because `Helix3D` has its own navigation/footer, it is rendered *standalone* — the function returns before reaching the shared-`Header` layout below. Returning different JSX based on a condition is **conditional rendering**.

```tsx
  const requestedId = hash.startsWith('#strand/') ? hash.slice('#strand/'.length) : null
  const detailStrand =
    (requestedId ? STRANDS.find(s => s.id === requestedId) : null)
    ?? STRANDS.find(s => s.progress)
    ?? STRANDS[0]
```

Extracts the strand id from a URL like `#strand/kindred` (`.slice(...)` removes the `#strand/` prefix), else `null`. Then it picks which strand object to show using the **nullish coalescing operator** `??` (use the left side unless it is `null`/`undefined`, then try the next): "the requested strand, OR the first strand that has `progress` data, OR just the first strand." `STRANDS.find(s => s.id === requestedId)` is the standard array `.find` with an **arrow function** predicate.

```tsx
  const marginaliaSlug = hashPath.startsWith('#marginalia/')
    ? hashPath.slice('#marginalia/'.length)
    : null
```

Same slug-extraction pattern for articles: `null` means "show the list," any string means "show that article."

```tsx
  const queryStr = hash.includes('?') ? hash.split('?').slice(1).join('?') : ''
  const strandFilter = new URLSearchParams(queryStr).get('strand')
```

Pulls everything after the first `?` and parses it with the browser's built-in **`URLSearchParams`** API, then reads the `strand` parameter. So `#marginalia?strand=kindred` yields `strandFilter === 'kindred'` (used to filter the article list); no query yields `null`.

```tsx
  return (
    <>
      <Header currentHash={hash} />
      {page === 'who' ? (
        <WhoPage />
      ) : page === 'strand' && detailStrand.progress ? (
        <StrandDetail strand={detailStrand} progress={detailStrand.progress} />
      ) : page === 'marginalia' ? (
        <Marginalia slug={marginaliaSlug} strandFilter={strandFilter} />
      ) : (
        <ConceptView />
      )}
    </>
  )
}
```

The render output:

- `<> ... </>` is a **React Fragment** — an invisible wrapper that lets you return multiple sibling elements without adding an extra `<div>` to the page.
- `<Header currentHash={hash} />` — rendering the `Header` component and passing it **props**. Props are inputs to a component; `currentHash={hash}` passes the live hash so `Header` can highlight the active nav item. Curly braces `{ }` in JSX embed a JavaScript expression.
- The `{ page === 'who' ? (...) : ... }` block is **conditional rendering** again, choosing exactly one view component. Note `page === 'strand' && detailStrand.progress` — it only renders `StrandDetail` if a strand *and* its `progress` data exist; otherwise it falls through to `ConceptView`. `detailStrand.progress` being truthy is also why `progress={detailStrand.progress}` is safe to pass.
- Both the default and `#concept` cases land on `<ConceptView />` (the final `: (...)`). The inline comment notes the older home view is intentionally unwired and recoverable from git history.

### High-level routing/state summary

- **Single source of truth:** the URL hash. `useHash` makes it reactive; everything else is *derived* from it on each render (no extra `useState` for "current page").
- **Views/routes:** `#helix3d` → `Helix3D` (standalone) · `#who` → `WhoPage` · `#strand` / `#strand/<id>` → `StrandDetail` · `#marginalia` / `#marginalia/<slug>` / `#marginalia?strand=<id>` → `Marginalia` · everything else (incl. `#concept`) → `ConceptView`.
- **Data flows down via props:** `STRANDS` (from `src/data/strands`) → chosen `detailStrand` → passed into `StrandDetail`; parsed slug/filter → `Marginalia`.

## Libraries & APIs used

- **react** — `useState`, `useEffect`, function components, JSX, Fragments. Docs: <https://react.dev/reference/react>
- **Browser `window.location` & `hashchange`** — the routing mechanism. Docs: <https://developer.mozilla.org/docs/Web/API/Window/hashchange_event>
- **`URLSearchParams`** — built-in query-string parser. Docs: <https://developer.mozilla.org/docs/Web/API/URLSearchParams>
- Local module `./data/strands` (`STRANDS`) — app data; documented separately.
- Child view components (`Header`, `WhoPage`, `ConceptView`, `Helix3D`, `StrandDetail`, `Marginalia`) — documented in their own files.

## Concepts to learn here

- **Custom hooks** (`useHash`): extracting reusable stateful logic into a `use*` function.
- `useState` (state + setter, array destructuring, initial value) and **re-render on state change**.
- `useEffect` with an empty dependency array (run once) and a **cleanup function** (subscribe/unsubscribe pattern, avoiding leaks).
- **Derived state**: computing values from one source on each render instead of duplicating state.
- **Conditional rendering** via `if`-early-return and chained ternaries.
- **Props** and passing data from parent to child.
- **Fragments** (`<>...</>`).
- Modern JS operators: optional `?.`-style guards via `&&`, nullish coalescing `??`, arrow functions, `Array.find`, `String.slice/split/startsWith`.
- Hash-based client-side routing without a router library.

## How to edit it safely

- **To add a new page:** (1) import its component at the top, (2) add a branch to the `page = ...` ternary mapping a new hash to a label, (3) add a matching branch in the JSX render's conditional. Make sure `Header` has a link to the new hash so users can reach it.
- **To change a route's URL**, update the string comparisons consistently in *both* the `page` derivation and any slug/`startsWith` logic (e.g. changing `#strand` would mean updating `isStrandRoute`, `requestedId`, and `Header`'s links).
- **Query parameters:** add more `.get('...')` calls on the `URLSearchParams` object; the existing `queryStr` extraction already handles a `?` anywhere in the hash.
- **Gotcha — StrictMode double effects:** in development, `useEffect` (and the listener subscribe/cleanup) may run twice due to `<StrictMode>` in `src/main.tsx`. The cleanup function makes this safe; don't "fix" it by removing the cleanup.
- **Gotcha — `detailStrand.progress`:** `StrandDetail` is only rendered when `detailStrand.progress` is truthy. If you add a strand without `progress`, requesting it will fall back to `ConceptView`. Add `progress` data in `src/data/strands` to make a strand's detail page reachable.
- Keep the `Helix3D` early return *above* the shared-`Header` block — it intentionally renders without the site header.
- Don't introduce a routing library just to add one page; this hash router is simple and intentional. Reach for a library only if requirements grow (nested routes, history API, code-splitting per route).
