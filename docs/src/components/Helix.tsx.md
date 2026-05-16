# `src/components/Helix.tsx`

## What this file is

This is the **React shell** around the DNA-style "Rod of Asclepius" helix. It is deliberately *thin*: it renders the skeleton HTML/SVG, hands DOM refs to an imperative engine (`helixScene.ts`), and wires up the React-y concerns the engine should not own: page-scroll-driven logo resizing, scroll-snap navigation between projects, and two-way selection sync with the rest of the page.

A useful mental model: **React owns the boxes; `helixScene.ts` owns the pixels inside one of those boxes.** This file is the boundary between the two worlds.

## Line-by-line / block walkthrough

### Imports

```tsx
import { useEffect, useRef, useState } from 'react'
import { mountHelix, type HelixHandle } from './helixScene'
import './Helix.css'
```

- `useEffect`, `useRef`, `useState` are React **hooks** (special functions that let a function component "remember" things and run side effects). We meet each below.
- `mountHelix` is the imperative engine's single entry point; `HelixHandle` is its TypeScript return type. `import type` is a TS-only import — it is erased at build time because types do not exist at runtime.
- `import './Helix.css'` — a **plain (global) CSS import**. Vite bundles the file and injects it into the page. Unlike a CSS *module* (`*.module.css`), the class names are *not* hashed, so `helixScene.ts` can create elements with literal class names like `panel` and have them styled. This is why `Helix.css` scopes everything under `.helix` (see that doc).

### The props interface

```tsx
interface HelixProps {
  selectedStrandId: string | null
  onSelect: (id: string | null) => void
}
```

A **TypeScript interface** describes the shape of the props object. This component is *controlled*: it does not own which strand is selected — the parent (`ConceptView`) does. `selectedStrandId` flows down; `onSelect` is the callback to push a change back up. This is the classic React "lifting state up" pattern.

### Module-level constants

```tsx
const LARGE_ROD = 180
const SMALL_ROD = 56
const ROD_SHRINK_AT = 0.45
```

Declared *outside* the component so they are computed once, not per render. They control the brand logo's two discrete sizes and the scroll progress (0–1) at which it flips from large to small.

### Refs

```tsx
const sectionRef = useRef<HTMLElement>(null)
const stageRef = useRef<HTMLDivElement>(null)
...
const handleRef = useRef<HelixHandle | null>(null)
```

`useRef(initial)` returns a stable mutable object `{ current: initial }`. It survives across renders and **changing `.current` does not trigger a re-render**. Two distinct uses here:

1. **DOM refs** (`sectionRef`, `stageRef`, …): attach to a JSX element via `ref={stageRef}` and React sets `.current` to the real DOM node after mount. This is how you get a raw `HTMLDivElement` to hand to non-React code.
2. **Instance/value refs** (`handleRef`, `programmaticScrollUntil`, `lastReportedRdId`): plain mutable storage that needs to persist but should not cause renders.

```tsx
const programmaticScrollUntil = useRef(0)
const lastReportedRdId = useRef<string | null>(null)
```

These two refs prevent **feedback loops**. When code scrolls the helix programmatically, the scroll event would otherwise fire the snap logic, which would fire `onSelect`, which would scroll again… `programmaticScrollUntil` is a timestamp: "ignore snap until `Date.now()` passes this". `lastReportedRdId` remembers the last id we already told the parent about, so we do not re-report the same selection.

### ID-bridging maps

```tsx
const HELIX_TO_RD: Record<string, string> = { kindreon: 'kindred', ... }
const RD_TO_HELIX: Record<string, string> = { kindred: 'kindreon', ... }
```

`Record<string, string>` is a TS type for "object whose keys and values are strings". The helix engine and the R&D Strands data use different historical ids for the same projects; these dictionaries translate between the two vocabularies. Whenever two subsystems disagree on naming, an explicit lookup table at the boundary is far safer than scattering string literals.

### State: the rod size

```tsx
const [rodSize, setRodSize] = useState(LARGE_ROD)
```

`useState(initial)` returns `[value, setter]`. Calling `setRodSize(x)` schedules a re-render with the new value. Because `rodSize` is later rendered into an inline style, changing it visibly resizes the logo (CSS transitions the morph — see `Helix.css` `.helix-header-rod`).

### State + effect: strand hover

```tsx
const [isStrandHovered, setIsStrandHovered] = useState(false)
useEffect(() => {
  const handler = (e: Event) => {
    const hovering = !!(e as CustomEvent<{ hovering: boolean }>).detail?.hovering
    setIsStrandHovered(hovering)
  }
  document.addEventListener('mentheon:strand-hover', handler as EventListener)
  return () => document.removeEventListener('mentheon:strand-hover', handler as EventListener)
}, [])
```

This is the **`useEffect` pattern for subscribing to something external**:

- The function passed to `useEffect` runs *after* render (a "side effect").
- It returns a **cleanup function**. React calls it before the effect re-runs and on unmount. Here it removes the listener — without this you leak listeners every render and double-handle events (especially under React StrictMode, which deliberately mounts twice in dev).
- The second argument `[]` is the **dependency array**. `[]` means "run once on mount, clean up on unmount". This is the single most important `useEffect` concept: the deps array decides *when* the effect re-runs.

`mentheon:strand-hover` is a **CustomEvent** dispatched by `RDStrands.tsx`. Components communicate via a DOM event instead of prop-drilling — loose coupling at the cost of an invisible wire. `e as CustomEvent<{ hovering: boolean }>` is a **TS type assertion**: the DOM types `addEventListener` as generic `Event`, so we tell the compiler the real shape. `!!x` coerces to a boolean.

### The big mount effect — mounting the imperative engine

```tsx
useEffect(() => {
  if (!stageRef.current || ... ) return
  const handle = mountHelix({ stageEl: stageRef.current, ... })
  handleRef.current = handle
  ...
  return () => {
    stage.removeEventListener('scroll', onScroll)
    if (snapTimer) window.clearTimeout(snapTimer)
    handle.cleanup()
    handleRef.current = null
  }
}, [])
```

This is the **bridge to non-React code**. Key teaching points:

- The guard `if (!stageRef.current ...) return` — refs are `null` on the very first render (before the DOM exists). Effects run after the DOM is committed, so by the time this runs the refs *should* be set, but the guard is defensive.
- `mountHelix(...)` takes the real DOM nodes and returns a `handle` (an object of functions — `cleanup`, `getProjectViewboxYs`, `setSelected`, plus `viewBoxWidth/Height`). We stash it in `handleRef` so other effects can call it.
- The returned cleanup calls `handle.cleanup()` — **this is critical for three.js / animejs / RAF code**: it stops loops, removes listeners, and disposes GPU resources. Forgetting it leaks memory and runs zombie animation loops. (`helixScene.ts` is SVG, not WebGL, but the same discipline applies; `Helix3D.tsx` is the WebGL case.)
- `[]` deps + the `eslint-disable-next-line react-hooks/exhaustive-deps` comment: this effect should run *exactly once*. The lint rule normally wants every referenced value in deps; here that is intentionally suppressed because re-running would tear down and rebuild the entire scene.

#### `getProjectPxY` and `measuredSelectorOffset`

```tsx
function getProjectPxY(h: HelixHandle, vbY: number): number | null {
  const svg = stage.querySelector('.helix-svg') as SVGSVGElement | null
  ...
  const scale = Math.min(r.width / h.viewBoxWidth, r.height / h.viewBoxHeight)
  const contentH = h.viewBoxHeight * scale
  const bandY = (r.height - contentH) / 2
  return bandY + vbY * scale
}
```

This converts a coordinate from **SVG viewBox units** into **screen pixels**. The key SVG concept: a `viewBox` defines an internal coordinate system; `preserveAspectRatio="xMidYMid meet"` scales the drawing uniformly to fit the element and centres it, leaving empty "letterbox" bands. `scale` is the uniform scale factor (the smaller of the width-fit and height-fit). `bandY` is the centred top band offset. Together they map `vbY` → pixel Y. Understanding `viewBox` + `preserveAspectRatio` is essential for any responsive SVG work.

`measuredSelectorOffset()` reads the selector line's *actual* rendered position from the DOM (`getBoundingClientRect()`) rather than trusting a CSS percentage. The lesson: when sub-pixel precision matters, **measure the rendered DOM, do not recompute from assumptions**.

#### `snapToNearest` — scroll-snap by JavaScript

This function implements custom scroll-snapping: after scrolling stops, find which project's "ideal scroll position" the current scroll is closest to, and glide there. The algorithm:

1. For each project, compute `idealScroll` = the `scrollTop` that lands its bead on the selector line, **clamped** to `[0, maxScroll]` (so a project whose natural position is unreachable still owns a snap point at the boundary).
2. Partition the scroll range at midpoints between adjacent ideals; the project whose zone contains the current `scrollTop` wins.
3. If already within a 1 px deadzone, just report the selection; otherwise `stage.scrollTo({ top, behavior: 'smooth' })` and report.

```tsx
stage.scrollTo({ top: chosen.idealScroll, behavior: 'smooth' })
```

Note it passes the *fractional* value — modern browsers honour sub-pixel `scrollTop`, and rounding was a past source of misalignment. Transferable idea: nearest-neighbour selection by partitioning a number line at midpoints.

#### `onScroll` — debouncing

```tsx
function onScroll() {
  if (Date.now() < programmaticScrollUntil.current) return
  if (snapTimer) window.clearTimeout(snapTimer)
  snapTimer = window.setTimeout(snapToNearest, 70)
}
stage.addEventListener('scroll', onScroll, { passive: true })
```

This is a **debounce**: every scroll event cancels the pending timer and restarts it; `snapToNearest` only fires after 70 ms of scroll silence. The `programmaticScrollUntil` guard ignores scroll events caused by our own `scrollTo`. `{ passive: true }` tells the browser the listener will not call `preventDefault`, letting it keep scrolling smooth.

#### Initial scroll position

```tsx
requestAnimationFrame(() => {
  const ys = handle.getProjectViewboxYs()
  const firstY = ys.kindreon ?? Object.values(ys)[0]
  ...
  stage.scrollTop = pxY - measuredSelectorOffset()
})
```

`requestAnimationFrame(cb)` schedules `cb` to run just before the browser's next paint — used here to wait one frame so the SVG has been laid out and `getBoundingClientRect()` returns real numbers. A common pattern: "do this after the DOM has actually rendered".

### Page-scroll → rod size effect

```tsx
useEffect(() => {
  function onWindowScroll() {
    if (selectedStrandId !== null || isStrandHovered) { setRodSize(SMALL_ROD); return }
    const rect = section.getBoundingClientRect()
    const vh = window.innerHeight || document.documentElement.clientHeight
    const raw = (vh - rect.top) / vh
    const progress = Math.max(0, Math.min(1, raw))
    setRodSize(progress < ROD_SHRINK_AT ? LARGE_ROD : SMALL_ROD)
  }
  window.addEventListener('scroll', onWindowScroll, { passive: true })
  window.addEventListener('resize', onWindowScroll)
  onWindowScroll()
  return () => {
    window.removeEventListener('scroll', onWindowScroll)
    window.removeEventListener('resize', onWindowScroll)
  }
}, [selectedStrandId, isStrandHovered])
```

A classic **scroll-progress** computation: `rect.top` is the section's distance from the viewport top; mapping it to `0..1` and clamping with `Math.max(0, Math.min(1, …))` gives a normalized progress. Note the deps array `[selectedStrandId, isStrandHovered]` — the effect re-subscribes whenever either changes, because the handler *closes over* those values and a stale closure would use old values. This is the flip side of the `[]` lesson: **include in deps every reactive value the effect reads**, or accept stale closures.

`onWindowScroll()` is called once immediately so the size is correct before the first scroll.

### Two-way selection sync effect

```tsx
useEffect(() => {
  const h = handleRef.current
  ...
  h.setSelected(selectedStrandId)
  if (selectedStrandId !== null && selectedStrandId === lastReportedRdId.current) return
  if (selectedStrandId == null) return
  ...
  stage.scrollTo({ top: targetScroll, behavior: 'smooth' })
}, [selectedStrandId])
```

When the parent changes `selectedStrandId` (e.g. a strand button elsewhere was clicked), this: (a) mirrors the selection into the helix appearance via `h.setSelected`, and (b) scrolls the helix so that project sits on the selector line — *unless* this helix's own snap is what caused the change (the `=== lastReportedRdId.current` short-circuit, the loop-breaker). This is the "two-way binding" you must hand-build when bridging React state to imperative scroll position.

### The JSX (the render)

```tsx
return (
  <section className="helix" id="helix" ref={sectionRef}>
    <div className="helix-key"> ... </div>
    <div className="helix-viewport">
      <div className="helix-header" aria-hidden="true">
        <div className="helix-line" />
        <img className="helix-header-rod"
             src={`${import.meta.env.BASE_URL}rod-only.svg`}
             alt="" style={{ width: rodSize, height: rodSize }} />
      </div>
      <div className="helix-selector" aria-hidden="true">
        <span className="helix-selector-chev">&rsaquo;</span>
        <span className="helix-selector-line" />
        <span className="helix-selector-chev">&lsaquo;</span>
      </div>
      <div className="helix-stage" ref={stageRef} data-orientation="vertical"></div>
    </div>
    <div className="helix-legend" ref={legendRef}></div>
    <div className="panel" ref={panelRef} aria-hidden="true"> ... </div>
    <div className="helix-tooltip" ref={tooltipRef}></div>
  </section>
)
```

**JSX** is HTML-like syntax that compiles to `React.createElement` calls. Concepts shown:

- `className` not `class` (`class` is a reserved word in JS).
- `ref={stageRef}` binds the DOM node to the ref after mount.
- **Empty containers** like `<div className="helix-stage" ref={stageRef}></div>` — React renders nothing inside; `helixScene.ts` fills it imperatively. This is the standard "React provides the mount point, library owns the subtree" pattern. *Do not* render React children into these.
- `style={{ width: rodSize, height: rodSize }}` — inline styles are an object; numbers become `px`. Driven by `rodSize` state so React re-renders the size and CSS transitions the morph.
- `src={`${import.meta.env.BASE_URL}rod-only.svg`}` — `import.meta.env.BASE_URL` is Vite's configured base path, so the asset URL is correct under a sub-path deployment.
- Inline `<svg>` glyphs in `.helix-key` (a `<line>` and `<circle>` with `stroke`, `strokeWidth`, `strokeLinecap`, `fill`): note the camelCase attribute names — JSX uses the DOM property names (`strokeWidth`) not the SVG attribute names (`stroke-width`).
- `aria-hidden="true"` removes purely decorative nodes from the accessibility tree.
- `&rsaquo;`/`&lsaquo;` are HTML entities for the chevron glyphs.

## Libraries & APIs used

- **React 18** — `useState`, `useEffect`, `useRef`. Docs: <https://react.dev/reference/react>
- **`./helixScene`** — local imperative engine; see its own doc.
- **DOM APIs**: `addEventListener`/`removeEventListener`, `CustomEvent`, `Element.getBoundingClientRect()` (<https://developer.mozilla.org/docs/Web/API/Element/getBoundingClientRect>), `Element.scrollTo()` (<https://developer.mozilla.org/docs/Web/API/Element/scrollTo>), `window.requestAnimationFrame()` (<https://developer.mozilla.org/docs/Web/API/window/requestAnimationFrame>), `window.setTimeout`/`clearTimeout`.
- **SVG**: `viewBox` + `preserveAspectRatio` (<https://developer.mozilla.org/docs/Web/SVG/Attribute/preserveAspectRatio>).
- **Vite**: `import.meta.env.BASE_URL` (<https://vitejs.dev/guide/env-and-mode>).

## Concepts to learn here

- Controlled component: state lives in the parent, flows down via props, changes flow up via a callback.
- `useRef` for DOM access *and* for non-rendering mutable storage (loop guards).
- `useEffect` deps array: `[]` = once; `[a, b]` = re-run when `a`/`b` change; always return a cleanup for subscriptions.
- Stale closures: a handler captures the values from the render it was created in — the deps array controls freshness.
- Bridging React to imperative libraries: empty ref'd container + mount/cleanup effect.
- Custom DOM events as a decoupled cross-component channel.
- Debouncing with `setTimeout`/`clearTimeout`.
- SVG viewBox ↔ pixel coordinate conversion via `preserveAspectRatio` math.
- Programmatic scroll without feedback loops (timestamp guard + last-reported guard).

## How to edit it safely

- **Change the logo's large/small sizes or shrink point**: edit `LARGE_ROD`, `SMALL_ROD`, `ROD_SHRINK_AT`. The visible morph is a CSS transition on `.helix-header-rod` in `Helix.css` — change the *speed* there, the *sizes* here.
- **Change which projects exist / their ids**: that data lives in `helixScene.ts` (`PROJECTS`) and `src/data/strands.ts`. If you add a project, update both `HELIX_TO_RD` and `RD_TO_HELIX` here or selection sync silently no-ops.
- **Tune snap feel**: the 70 ms debounce and the 1 px `SNAP_DEADZONE` in `snapToNearest`; the 700 ms `programmaticScrollUntil` window.
- **Gotcha — the mount effect's `[]` deps**: do not "fix" the eslint-disable by adding deps; the effect must run once or you tear down and rebuild three.js/SVG/animejs state every render and leak.
- **Gotcha — always keep cleanup symmetric**: every `addEventListener` here has a matching `removeEventListener` in the returned cleanup. If you add a listener, add its removal, or you leak under StrictMode/unmount.
- **Gotcha — refs are `null` on first render**: never read `someRef.current` during render; only inside effects/handlers.
- Paired stylesheet: **`Helix.css`** (global, scoped under `.helix`) — see that doc. The selector line position (`.helix-selector top: max(60%, 200px)`) and `SELECTOR_FRAC = 0.6` here must stay conceptually in sync, though the JS *measures* the real position so small CSS tweaks are safe.
