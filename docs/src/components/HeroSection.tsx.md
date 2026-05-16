# `src/components/HeroSection.tsx`

## What this file is

The landing **hero block**: a two-line headline ("We undertake:" + a dynamic second line), a row of three clickable icon circles (Research / Development / Consultancy), and a "scroll" cue. It is a small *stateful container* that owns which category is selected and passes that down to the presentational `HeroIconsWithContent` child. A textbook example of the "smart container holds state, dumb child renders" split.

It pairs with `HeroSection.module.css` (its styles) and renders `HeroIconsWithContent` (which pairs with `IconCircle`).

## Line-by-line / block walkthrough

```tsx
import { useState } from 'react'
import HeroIconsWithContent from './HeroIconsWithContent'
import styles from './HeroSection.module.css'
```

- `useState` — the hook for local component state.
- `HeroIconsWithContent` — the child component.
- `import styles from './HeroSection.module.css'` — a **CSS Module**. The build tool transforms `.hero` into a uniquely hashed class name and gives you a `styles` object mapping `styles.hero → "_hero_ab12"`. This means class names are **locally scoped**: two files can both define `.hero` with no collision. This is the opposite approach to `Helix.css`'s global+manual-prefix strategy — and the default for ordinary components in this codebase.

```tsx
const HERO_LINE2: Record<string, string> = {
  research:    'Digital Health Research',
  development: 'R&D of Software as a Medical Device (SaMD)',
  consultancy: 'Consultancy for your Digital Health needs',
}
```

A lookup table mapping the selected id to the headline's second line. Declared at **module scope** (outside the component) so it is created once, not on every render. `Record<string, string>` is the TS type for "string-keyed object of strings". Driving UI text from a data map keyed by state is cleaner than `if/else` chains in JSX.

```tsx
export default function HeroSection() {
  const [selected, setSelected] = useState('research')
```

`useState('research')` declares one piece of state with initial value `'research'`. `selected` is the current value; `setSelected` schedules a re-render with a new value. This component **owns** the selection — it is the single source of truth that the child reads from and writes to.

```tsx
  return (
    <section className={styles.hero} id="home">
      <p className={styles.line1}>We undertake:</p>
      <p className={styles.line2}>{HERO_LINE2[selected]}</p>
      <HeroIconsWithContent selected={selected} onSelect={setSelected} />
      <div className={styles.scrollCue}>
        <span>scroll to see our latest work</span>
      </div>
    </section>
  )
}
```

- `className={styles.hero}` — note `styles.hero`, not `"hero"`. With CSS Modules you reference the imported object's properties; the value is the hashed class string.
- `id="home"` — a real DOM id, used as an in-page anchor target (`#home` in the nav).
- `{HERO_LINE2[selected]}` — JSX **expression interpolation**: `{}` evaluates a JS expression and renders the result. As `selected` changes (via the child calling `onSelect`), this text changes and React re-renders just the differing text node.
- `<HeroIconsWithContent selected={selected} onSelect={setSelected} />` — **passing state down + the setter down**. The child is *controlled*: it has no state of its own for the selection; it reads `selected` and calls `onSelect` (which *is* `setSelected`) to request a change. Passing the setter directly as the callback is a common, valid shortcut. This is the **lift-state-up / controlled-child** pattern.

## Libraries & APIs used

- **React 18** — `useState`. <https://react.dev/reference/react/useState>
- **CSS Modules** (via Vite) — `import styles from './x.module.css'`. <https://vitejs.dev/guide/features#css-modules>
- The child component `HeroIconsWithContent`.

## Concepts to learn here

- Container vs presentational split: this file holds state; the child renders.
- `useState` for local UI state, with the parent as the single source of truth.
- Passing both the value (`selected`) and the updater (`onSelect={setSelected}`) down to a controlled child.
- CSS Modules: locally-scoped, hashed class names accessed via a `styles` object — contrast with global CSS.
- Module-scope constant data maps keyed by state to drive UI text.
- JSX expression interpolation `{...}` and in-page anchor ids.

## How to edit it safely

- **Change a headline line**: edit the strings in `HERO_LINE2`. The keys must match the `id`s used by `HeroIconsWithContent`'s `HERO_ITEMS` (`research`/`development`/`consultancy`).
- **Add a fourth category**: add it to `HERO_LINE2` here *and* to `HERO_ITEMS` and `TYPED_CONTENT` in `HeroIconsWithContent.tsx` — the three lists are coupled by id.
- **Change the default selection**: the argument to `useState('research')`.
- **Restyle**: edit `HeroSection.module.css`; class names are referenced as `styles.hero`, `styles.line1`, etc. — if you rename a class in the CSS you must rename the `styles.x` reference here too (they are matched by property name).
- **Gotcha — CSS Modules**: `className="hero"` (string) will *not* work; it must be `className={styles.hero}`. A typo like `styles.heroo` is silently `undefined` (no class applied, no error).
- Paired files: **`HeroSection.module.css`** (styles), **`HeroIconsWithContent.tsx`** (the controlled child receiving `selected`/`onSelect`).
