# `src/components/HeroIconsWithContent.tsx`

## What this file is

The presentational child of `HeroSection`. It renders the three clickable icon circles, a typewriter-animated paragraph that changes with the selection, and a row of status dots. It is a **controlled component**: it holds *no* selection state itself — it receives `selected` and `onSelect` from the parent and is purely a function of those props (plus a derived animated string from the `useTypewriter` hook).

Pairs with `HeroIconsWithContent.module.css` (styles), `IconCircle` (the animated circle child), and the `useTypewriter` custom hook.

## Line-by-line / block walkthrough

```tsx
import { useMemo } from 'react'
import IconCircle from './IconCircle'
import { useTypewriter } from '../hooks/useTypewriter'
import styles from './HeroIconsWithContent.module.css'
```

- `useMemo` — a hook that memoizes (caches) a computed value between renders.
- `useTypewriter` — a **custom hook** (a reusable function starting with `use` that itself calls React hooks). It encapsulates the type-on/erase animation logic so this component does not have to.
- `styles` — the CSS Module object (hashed, locally-scoped class names).

```tsx
const HERO_ITEMS = [
  { id: 'research',    label: 'Research',    emoji: '🔬' },
  { id: 'development', label: 'Development', emoji: '💻' },
  { id: 'consultancy', label: 'Consultancy', emoji: '📋' },
]
const TYPED_CONTENT: Record<string, string[]> = {
  research: ['Our research pushes the boundaries of digital health.', 'Cutting-edge methods and pioneering discoveries.'],
  development: [...],
  consultancy: [...],
}
```

Module-scope data: `HERO_ITEMS` is the list rendered as buttons; `TYPED_CONTENT` maps each id to the array of phrases the typewriter cycles through. Keeping this data outside the component means it is allocated once, and keeping it as plain arrays/records makes the render a simple `.map`.

```tsx
interface Props {
  selected: string
  onSelect: (id: string) => void
}
export default function HeroIconsWithContent({ selected, onSelect }: Props) {
```

The **prop interface** declares the contract: a `selected` id and an `onSelect(id)` callback. The `{ selected, onSelect }` in the parameter list is **destructuring** the props object. This component never owns `selected` — the parent does (lift-state-up).

```tsx
const strings = useMemo(() => TYPED_CONTENT[selected] ?? [], [selected])
const typedText = useTypewriter(strings, { speed: 35, eraseDelay: 1800 })
```

- `useMemo(fn, deps)` recomputes `fn()` only when a value in `deps` changes; otherwise it returns the cached result. Here `strings` is recomputed only when `selected` changes. **Why it matters:** `useTypewriter` likely restarts its animation when the `strings` array *identity* changes. Without `useMemo`, `TYPED_CONTENT[selected] ?? []` would create a *new array object every render*, even with the same contents, constantly resetting the typewriter. Memoizing stabilises the reference. This is the canonical use of `useMemo`: stabilising a reference passed into a hook/child. `?? []` is the **nullish-coalescing** operator (fall back to `[]` if `undefined`/`null`).
- `useTypewriter(strings, opts)` returns the current partially-typed string; the component re-renders as the hook advances the animation internally.

```tsx
return (
  <div>
    <div className={styles.iconsRow}>
      {HERO_ITEMS.map((item) => (
        <div key={item.id} className={styles.iconGroup}>
          <a
            href="#"
            className={`${styles.iconLink} ${selected === item.id ? styles.selected : ''}`}
            onClick={(e) => { e.preventDefault(); onSelect(item.id) }}
            aria-pressed={selected === item.id}
          >
            <div className={styles.iconWrapper}>
              <IconCircle emoji={item.emoji} size={120} isSelected={selected === item.id} />
            </div>
          </a>
          <span className={styles.label}>{item.label}</span>
        </div>
      ))}
    </div>
```

- **`.map()` to render a list**: each item becomes JSX. The **`key={item.id}`** prop is required by React for lists — it lets React match elements between renders so it can update efficiently and preserve component state. Use a stable unique id, never the array index when the list can reorder.
- **Conditional className**: `` `${styles.iconLink} ${selected === item.id ? styles.selected : ''}` `` — a template literal joining the base class with the `selected` modifier class only when this item is the chosen one. This is the standard CSS-Modules way to do conditional styling.
- `onClick={(e) => { e.preventDefault(); onSelect(item.id) }}` — `e.preventDefault()` stops the `<a href="#">` from jumping the page to the top (the anchor is a fallback/semantic affordance, not a real navigation); then it calls the parent's `onSelect` with this item's id. **The component requests a state change; it does not mutate state itself.**
- `aria-pressed={selected === item.id}` — accessibility: announces the toggle state of the button-like link to screen readers. Passing a boolean to an `aria-*` attribute is correct.
- `<IconCircle emoji={item.emoji} size={120} isSelected={selected === item.id} />` — passes the selected flag down so the circle can restyle itself.

```tsx
    <div className={styles.typedContent}>
      {typedText}
      <span className={styles.caret} aria-hidden="true" />
    </div>

    <div className={styles.statusIndicators}>
      {HERO_ITEMS.map((item) => (
        <div
          key={item.id}
          className={`${styles.indicator} ${selected === item.id ? styles.activeIndicator : ''}`}
        />
      ))}
    </div>
  </div>
)
```

- `{typedText}` renders the hook's current string; the blinking `<span className={styles.caret}>` is decorated as a cursor (the blink is a CSS `@keyframes` in the module — see that doc). `aria-hidden="true"` hides the purely decorative caret from assistive tech.
- The status indicators are another `.map` producing one dot per item, with the active one getting `styles.activeIndicator`. This re-uses the conditional-className pattern. Driving multiple UI regions (icons + caption + dots) from the *same* `selected` prop keeps them perfectly in sync — a core benefit of single-source-of-truth state.

## Libraries & APIs used

- **React 18** — `useMemo`. <https://react.dev/reference/react/useMemo>
- **Custom hook** `useTypewriter` (`src/hooks/useTypewriter`) — encapsulated type/erase animation.
- **CSS Modules** (Vite). <https://vitejs.dev/guide/features#css-modules>
- Child component `IconCircle`.
- DOM: `Event.preventDefault()`, `aria-pressed`/`aria-hidden`.

## Concepts to learn here

- Controlled/presentational component: output is a pure function of props (+ a derived hook value).
- `useMemo` to stabilise a derived array reference passed into a hook (prevents needless re-runs).
- Nullish coalescing `?? []`.
- Custom hooks as reusable stateful logic.
- Rendering lists with `.map` and stable `key`s.
- Conditional class names with template literals + CSS Modules modifier classes.
- `preventDefault()` on an anchor used as an interactive control; `aria-pressed`/`aria-hidden` for accessibility.
- One state value driving several synchronized UI regions.

## How to edit it safely

- **Change the phrases**: edit `TYPED_CONTENT`; keys must match `HERO_ITEMS` ids and the keys of `HERO_LINE2` in `HeroSection.tsx`.
- **Add/remove a category**: update `HERO_ITEMS` *and* `TYPED_CONTENT` here, *and* `HERO_LINE2` in `HeroSection.tsx` — the three are coupled by id.
- **Tune the typewriter**: the options object `{ speed: 35, eraseDelay: 1800 }` (ms per char / pause before erase). The behaviour itself lives in `useTypewriter`.
- **Gotcha — keep the `useMemo([selected])`**: removing it makes `strings` a new array every render and the typewriter will visibly restart constantly.
- **Gotcha — `key` must be stable and unique** (`item.id`), not the map index.
- **Gotcha — CSS Modules conditional classes**: a falsy branch must be `''` (empty string), not `undefined`/`false`, to avoid `"undefined"` appearing in `className`.
- Paired files: **`HeroIconsWithContent.module.css`** (styles incl. the caret blink keyframes), **`IconCircle.tsx`** (receives `emoji`/`size`/`isSelected`), **`HeroSection.tsx`** (owns `selected`/`onSelect`).
