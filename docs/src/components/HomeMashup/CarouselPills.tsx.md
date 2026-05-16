# `src/components/HomeMashup/CarouselPills.tsx`

## What this file is

The progress indicator beneath the carousel canvas: a horizontal row of small
dots. The active scene's dot is crimson and larger; clicking any dot jumps
straight to that scene.

Like `Readout`, it is a **controlled, presentational** component. It holds no
state. The orchestrator owns `currentIndex`; this component just *renders* which
pill is active and *reports clicks upward* via the `onSelect` callback. See
`HomeMashup.tsx.md` for how `onSelect={setCurrentIndex}` wires a click directly
into the orchestrator's state.

## Line-by-line / block walkthrough

```tsx
import type { SceneDescriptor } from './types'
import styles from './CarouselPills.module.css'

interface CarouselPillsProps {
  scenes: SceneDescriptor[]
  activeIndex: number
  onSelect: (index: number) => void
}
```

- `import type { SceneDescriptor }` — type-only import of the shared contract
  (see `types.ts.md`). We need the descriptor to read each scene's `id` and
  `label`.
- The props:
  - `scenes: SceneDescriptor[]` — the whole `SCENES` array, so we render one
    pill per scene.
  - `activeIndex: number` — which scene is live; used to mark the active pill.
  - `onSelect: (index: number) => void` — a callback the parent supplies; the
    pill calls it with its own index to request a jump. This is the
    **"child reports an event up via a callback prop"** pattern again.

```tsx
export default function CarouselPills({ scenes, activeIndex, onSelect }: CarouselPillsProps) {
  return (
    <nav className={styles.pillnav} aria-label="Carousel scene navigation">
      {scenes.map((scene, idx) => {
        const isActive = idx === activeIndex
        return (
          <button
            key={scene.id}
            type="button"
            className={`${styles.pill} ${isActive ? styles.pillActive : ''}`}
            onClick={() => onSelect(idx)}
            aria-current={isActive ? 'true' : undefined}
            aria-label={`Jump to ${scene.label}`}
          >
            <span className={styles.pillDot} aria-hidden="true" />
          </button>
        )
      })}
    </nav>
  )
}
```

Concepts taught here for the first time:

- **`<nav aria-label="…">`** — `<nav>` is a semantic landmark element for
  navigation. `aria-label` names that landmark for screen readers, since there's
  no visible heading.
- **Rendering a list with `.map()`**:
  `{scenes.map((scene, idx) => { … return <button/> })}` — the canonical React
  way to turn an array into a list of elements. `.map` produces an array of
  JSX `<button>`s and React renders each. `idx` is the array index.
- **`key={scene.id}`** — every element produced in a list **must have a stable,
  unique `key`**. React uses keys to match elements between renders so it can
  update the DOM minimally. We use `scene.id` (a stable `SceneId` string) rather
  than the array index, which is best practice (index keys break if the list is
  reordered).
- **`const isActive = idx === activeIndex`** — derived locally each render. The
  component recomputes "am I the active one?" rather than storing it; this is
  the React mindset — *derive from props, don't duplicate into state*.
- **Conditional className**:
  `` `${styles.pill} ${isActive ? styles.pillActive : ''}` `` — always apply
  `.pill`, additionally apply `.pillActive` only when active. (Ternary again:
  `cond ? a : b`.)
- **`type="button"`** — explicitly set because a `<button>` inside any form
  defaults to `type="submit"`, which would try to submit/reload. Always set
  `type="button"` for non-submitting buttons.
- **`onClick={() => onSelect(idx)}`** — note this *is* a fresh inline arrow
  each render. That's fine here: a plain DOM `<button>`'s `onClick` doesn't
  trigger expensive re-mounting the way the scene callbacks do, so the
  readability of the closure (`idx` captured) wins. (Contrast with
  `HomeMashup`'s deliberate `useCallback` on the scene callbacks — context
  matters.)
- **`aria-current={isActive ? 'true' : undefined}`** — sets
  `aria-current="true"` on the active pill so assistive tech announces it as
  the current item. Setting it to `undefined` (not `'false'`) *removes the
  attribute entirely* for inactive pills, which is the correct ARIA pattern.
- **`aria-label={`Jump to ${scene.label}`}`** — a template literal builds a
  meaningful label per pill (e.g. "Jump to Sequencing"), since the visible
  content is just a decorative dot.
- **`<span className={styles.pillDot} aria-hidden="true" />`** — the visible
  dot. It's purely decorative (the `<button>` carries the real meaning via its
  `aria-label`), so it's hidden from screen readers. `<span … />` is a
  self-closing JSX element, allowed because it has no children.

The accessibility layering here is worth noticing: a real `<button>` (keyboard
focusable, Enter/Space activatable) carries the semantics and label; the colour
change is *visual only* and the styling lives entirely in the CSS module.

## Libraries & APIs used

- **React** — function component, list rendering with `.map`, keys, props,
  callback props, conditional className.
- **TypeScript** — props interface, function-type prop, type-only import.
- **CSS Modules** — `CarouselPills.module.css`.
- **ARIA / semantic HTML** — `<nav>`, `aria-label`, `aria-current`,
  `aria-hidden`, explicit `type="button"`.

## Concepts to learn here

- Turning an array into UI with `.map`, and why `key` must be stable & unique.
- Deriving display state (`isActive`) from props instead of storing it.
- Controlled/presentational component: parent owns state, child reports clicks.
- Accessible interactive lists: real `<button>`s + ARIA, decorative visuals
  hidden.
- When inline arrow handlers are fine vs. when to memoise (compare to
  `HomeMashup.tsx`).

## How to edit it safely

- **Pills update automatically when scenes change.** Because it renders
  `scenes.map(...)`, adding/removing/reordering entries in `HomeMashup`'s
  `SCENES` array changes the pill row with no edits here.
- **Change active styling:** edit `.pillActive` / `.pillDot` in
  `CarouselPills.module.css`, not this file.
- **Add tooltips/numbers:** you could render `{idx + 1}` inside the `<button>`
  instead of (or beside) the dot — but keep the `aria-label` so the meaning
  survives for screen readers.
- **Gotcha:** don't switch `key` to the array index. If `SCENES` is ever
  reordered, index keys cause React to mis-match pills (wrong active state /
  flicker). `scene.id` is stable — keep it.
- **Gotcha:** keep `aria-current` as `undefined` (not the string `'false'`) for
  inactive pills; emitting `aria-current="false"` is technically valid but
  noisier and not the intended pattern here.
- Don't introduce local state for "active pill". The orchestrator is the single
  source of truth via `activeIndex`; a second copy here would drift out of sync
  with the auto-advance timer.
