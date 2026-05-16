# `src/components/HomeMashup/HomeMashup.tsx`

## What this file is

This is the **orchestrator** of the whole HomeMashup feature: an animated, rotating
carousel of 11 short "vignette" scenes that play on the home page (and, with a
headline overlay, inside the ConceptView).

It is the single most important file in the directory to understand first,
because every other file plugs into the architecture defined here. Read this
doc and `types.ts.md` before any individual scene doc — the scene docs
deliberately do **not** re-explain the shared contract.

### The big picture (architecture)

```
HomeMashup  ──────────────────────────── the orchestrator (this file)
  │
  ├─ owns currentIndex state            (which scene is on screen)
  ├─ owns readout state                 (the corner text)
  ├─ a setTimeout that advances the scene after `duration` ms
  │
  ├─ <Readout left right />             top-corner monitor strip
  ├─ <ActiveScene key=… onReadoutChange onComplete />   the live vignette
  └─ <CarouselPills scenes activeIndex onSelect />       progress dots
```

The data that glues it together is the **`SceneDescriptor`** array (`SCENES`)
and the **`SceneProps`** interface — both defined in `types.ts`. Every scene is
an interchangeable React component matching `ComponentType<SceneProps>`. To the
orchestrator, scenes are black boxes: it mounts one, hands it two callbacks,
waits a fixed number of milliseconds, then swaps in the next.

The **shared scene contract** (the thing every scene file implements, and that
every scene doc refers back to here):

1. A scene is a React function component typed `({ onReadoutChange, onComplete }: SceneProps) => JSX`.
2. It renders exactly one `<svg className={styles.canvas} viewBox="0 0 800 520">`
   and grabs a `ref` to it.
3. Inside a single `useEffect(() => { … }, [onReadoutChange])`, it imperatively
   builds SVG nodes with `document.createElementNS`, animates them with
   `anime.js`'s `animate()` (and `window.setTimeout` for phase sequencing),
   and calls `onReadoutChange(left, right)` to drive the corner text.
4. The effect returns a **cleanup function** that pauses every animation,
   clears every timer, and empties the SVG. This is non-negotiable — see
   "How to edit it safely".
5. The orchestrator decides when the scene ends (via the `duration` field in
   `SCENES`), not the scene itself. `onComplete` exists in the contract but is
   currently a no-op signal (reserved).

## Line-by-line / block walkthrough

### Imports

```tsx
import { useCallback, useEffect, useState } from 'react'
import type { SceneDescriptor } from './types'
import Readout from './Readout'
import CarouselPills from './CarouselPills'
import HelixScene from './scenes/HelixScene'
// … nine more scene imports …
import styles from './HomeMashup.module.css'
```

- `useState`, `useEffect`, `useCallback` are **React Hooks** — special
  functions that let a function component hold state and run side effects.
  We use all three here.
- `import type { SceneDescriptor }` is a **TypeScript type-only import**.
  The `type` keyword tells the compiler "this import disappears at runtime,
  it's only for type-checking". `SceneDescriptor` is an interface, not real
  code, so importing it as a type is correct and keeps the JS bundle smaller.
- `import styles from './HomeMashup.module.css'` is a **CSS Module** import.
  Because the file ends in `.module.css`, the build tool turns it into a
  JavaScript object where `styles.stage` is a *uniquely hashed* class name
  (e.g. `HomeMashup_stage__a1b2c`). This scopes CSS to the component so class
  names can't collide across the app.

### The `SCENES` table

```tsx
const SCENES: SceneDescriptor[] = [
  { id: 'helix',    label: 'Sequencing',         duration: 4000, Component: HelixScene },
  { id: 'molecule', label: 'Molecular assembly', duration: 4000, Component: MoleculeScene },
  …
  { id: 'vrPose',   label: 'XR pose tracking',   duration: 6500, Component: VrPoseScene },
]
```

This array **is the carousel**. Each entry is a `SceneDescriptor` (see
`types.ts.md`) with four fields:

- `id` — a stable string key used for React's `key` prop and the pill `key`.
- `label` — human text for the pill's `aria-label` ("Jump to Sequencing").
- `duration` — **milliseconds the scene stays on screen** before the carousel
  advances. Note `Component` is a *reference to the component*, capitalised
  because JSX requires custom components to start with an uppercase letter
  (`<ActiveScene/>` works; `<activeScene/>` would be treated as an HTML tag).

The comment block above `SCENES` documents *why* each duration is what it is:
durations are tuned to be ~50–60% longer than the scene's own longest internal
animation, so the motion finishes and lingers a beat before swapping out. This
is the key tuning knob for pacing — see "How to edit it safely".

### Props interface

```tsx
interface HomeMashupProps {
  showHeadline?: boolean
}
export default function HomeMashup({ showHeadline = false }: HomeMashupProps) {
```

- `interface HomeMashupProps` declares the **shape of this component's props**.
  The `?` in `showHeadline?: boolean` means the prop is optional.
- `{ showHeadline = false }: HomeMashupProps` is **object destructuring with a
  default value** in the parameter list. If the parent renders
  `<HomeMashup/>` with no props, `showHeadline` is `false`. If it renders
  `<HomeMashup showHeadline />`, it's `true`.

### State

```tsx
const [currentIndex, setCurrentIndex] = useState(0)
const [readout, setReadout] = useState<{ left: string; right: string }>({
  left: 'Mentheon',
  right: '--',
})
```

`useState(initialValue)` returns a pair: the current value and a setter. Calling
the setter triggers a re-render with the new value.

- `currentIndex` is the index into `SCENES` of the scene currently shown.
- `readout` is the corner text. `useState<{ left: string; right: string }>(…)`
  uses a **generic type argument** (`<…>`) to tell TypeScript the state's shape,
  since it can't always infer object shapes that will change.

### The auto-advance effect (the heartbeat of the carousel)

```tsx
useEffect(() => {
  const scene = SCENES[currentIndex]
  const id = window.setTimeout(() => {
    setCurrentIndex(prev => (prev + 1) % SCENES.length)
  }, scene.duration)
  return () => clearTimeout(id)
}, [currentIndex])
```

This is the single most important behaviour in the file. Read it as four facts:

1. **`useEffect(fn, deps)`** runs `fn` after render, and re-runs it whenever
   any value in the dependency array `deps` changes. Here `deps` is
   `[currentIndex]`, so the effect re-runs every time the scene changes.
2. It schedules `window.setTimeout(…, scene.duration)` — after the current
   scene's `duration` ms, advance.
3. **`setCurrentIndex(prev => (prev + 1) % SCENES.length)`** uses the
   *functional updater* form. `prev` is the latest index; `% SCENES.length`
   wraps `10 → 0`, making the carousel loop forever. (We use the function form,
   not `setCurrentIndex(currentIndex + 1)`, so we always read the freshest
   value and never close over a stale `currentIndex`.)
4. **`return () => clearTimeout(id)`** is the effect's *cleanup function*.
   React runs it before re-running the effect and on unmount. So if the user
   clicks a pill (changing `currentIndex` early), the in-flight timer is
   cancelled and a fresh one is scheduled for the newly selected scene. Without
   this cleanup you'd get overlapping timers and the carousel would race ahead.

This pattern — *schedule a timer in an effect, clear it in the cleanup* — is
the canonical way to do "do X after N ms" in React. Memorise it.

### The two callbacks

```tsx
const handleReadoutChange = useCallback((left: string, right: string) => {
  setReadout({ left, right })
}, [])

const handleSceneComplete = useCallback(() => {
  /* Reserved for future use — the orchestrator owns advance timing. */
}, [])
```

`useCallback(fn, deps)` returns a **memoised** (cached) version of `fn` that
keeps the *same function identity* between renders as long as `deps` don't
change. Why does that matter here? These callbacks are passed as props into the
scene. The scene's effect lists `onReadoutChange` in its dependency array. If
`handleReadoutChange` were a fresh function every render, the scene's effect
would tear down and rebuild its entire animation on every parent render. By
wrapping it in `useCallback(…, [])` (empty deps = never changes), the scene's
effect runs exactly once per scene. This is a real, load-bearing optimisation —
not decoration.

`handleSceneComplete` is intentionally empty: the contract says the orchestrator
owns timing via `duration`. It's wired in so scenes *could* signal completion
later without changing the contract.

### Render

```tsx
const ActiveScene = SCENES[currentIndex].Component

return (
  <div className={styles.stage}>
    <Readout left={readout.left} right={readout.right} />

    {showHeadline && (
      <div className={styles.headlineTop} aria-hidden="true">
        Digital health is moving…&nbsp;<span className={styles.headlineFast}>fast</span>
      </div>
    )}

    <div className={`${styles.canvasArea} ${showHeadline ? styles.canvasAreaInset : ''}`}>
      <ActiveScene
        key={SCENES[currentIndex].id}
        onReadoutChange={handleReadoutChange}
        onComplete={handleSceneComplete}
      />
    </div>

    <CarouselPills
      scenes={SCENES}
      activeIndex={currentIndex}
      onSelect={setCurrentIndex}
    />
  </div>
)
```

JSX concepts, taught here for the first time:

- **`const ActiveScene = SCENES[currentIndex].Component`** then `<ActiveScene/>`.
  Assigning a component to a capitalised local variable lets you render a
  *dynamic* component chosen at runtime. This is how the carousel swaps scenes.
- **`className={styles.stage}`** — in JSX you use `className`, not HTML's
  `class` (because `class` is a reserved word in JS). The value is the hashed
  string from the CSS Module.
- **`{showHeadline && (<div>…</div>)}`** — *conditional rendering*. In JS,
  `false && X` evaluates to `false`, and React renders `false`/`null` as
  nothing. So this renders the headline only when `showHeadline` is true. This
  `cond && <JSX/>` idiom is everywhere in React.
- **`&nbsp;`** is a non-breaking space HTML entity; it keeps "moving… fast" from
  breaking across a line at that space.
- **`aria-hidden="true"`** hides decorative text from screen readers.
- **Template-literal className**:
  `` `${styles.canvasArea} ${showHeadline ? styles.canvasAreaInset : ''}` ``
  joins a base class with a conditional modifier class — the standard way to
  toggle CSS classes in React. The ternary `cond ? a : b` picks one of two
  values.
- **`key={SCENES[currentIndex].id}`** on `<ActiveScene>` is critical. React
  uses `key` to decide whether to *reuse* or *recreate* a component. Because the
  key changes whenever the scene changes, React **unmounts the old scene and
  mounts a fresh one**. That means the old scene's effect cleanup runs (timers
  cleared, SVG wiped) and the new scene's effect runs from scratch. If we
  *didn't* change the key, React would try to reuse the same instance and the
  animations would not reset cleanly. The `key` here is what makes the whole
  "play once, then move on" model work.
- Props flow **down**: `scenes`, `activeIndex`, `onSelect` go into
  `CarouselPills`; `left`/`right` go into `Readout`. Events flow **up**:
  `onSelect={setCurrentIndex}` lets a pill click set the orchestrator's state
  directly (passing the state setter itself as the handler — clicking pill `n`
  calls `setCurrentIndex(n)`).

## Libraries & APIs used

- **React** — `useState`, `useEffect`, `useCallback`, JSX, props, conditional
  rendering, the `key` reconciliation mechanism.
- **TypeScript** — interfaces, optional props, type-only imports, generics on
  `useState`.
- **CSS Modules** — scoped class names via `HomeMashup.module.css`.
- **`window.setTimeout` / `clearTimeout`** — the DOM timer API driving
  auto-advance.

## Concepts to learn here

- How a parent orchestrates interchangeable child components via a descriptor
  table + a shared props contract.
- The "effect schedules a timer, cleanup clears it" pattern.
- Why `useCallback` with `[]` deps stabilises a handler passed to a child whose
  effect depends on it.
- Why a changing `key` forces a clean remount, and why that's the engine of
  this carousel.
- Lifting state up: `currentIndex` lives in the parent so both the scene picker
  (pills) and the auto-timer can drive it.

## How to edit it safely

**Add a new scene to the carousel:**
1. Create `scenes/FooScene.tsx` implementing the shared scene contract
   (`HomeMashup.tsx` lines 84–112 show what's expected; copy an existing scene
   like `scenes/HelixScene.tsx` as a template — it is the simplest).
2. Add its `id` to the `SceneId` union in `types.ts` (line 8–19) — TypeScript
   will error until you do.
3. `import FooScene from './scenes/FooScene'` near the other scene imports
   (lines 5–15).
4. Add an entry to `SCENES` (lines 34–46):
   `{ id: 'foo', label: 'Foo demo', duration: 4000, Component: FooScene }`.
   Pick `duration` ≈ 1.5× your scene's longest internal animation.

**Reorder scenes:** just move entries within the `SCENES` array. Order in the
array = order in the carousel = order of the pills.

**Retime a scene:** change its `duration` in `SCENES`. Larger = lingers longer.
If the scene's own animation got longer, bump `duration` to keep the ~50–60%
headroom described in the comment at lines 25–33.

**Stop the auto-advance entirely (e.g. for debugging one scene):** comment out
the `window.setTimeout` body in the effect at lines 66–72, or hard-code
`useState(3)` to pin the carousel to scene index 3.

**Gotchas:**
- Do not pass inline arrow functions as `onReadoutChange`/`onComplete`
  (e.g. `onReadoutChange={(l,r) => …}`). That defeats `useCallback` and makes
  every scene re-mount on each parent render. Keep them memoised.
- The `key` on `<ActiveScene>` must stay tied to something that changes per
  scene. Removing it breaks the clean remount.
- `% SCENES.length` is what makes it loop. Don't replace it with `+ 1` without
  re-adding the wrap, or the carousel will run off the end of the array.
