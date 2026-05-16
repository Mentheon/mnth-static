# `src/components/HomeMashup/Readout.tsx`

## What this file is

A tiny, **purely presentational** ("dumb") component: the top-corner monitor
strip that mimics the "LEAD II" annotations on hospital cardiac monitors. It
renders two short strings — `left` and `right` — and nothing else. It holds no
state and runs no effects.

It is one half of the orchestrator's chrome (the other is `CarouselPills`). The
flow: a scene calls `onReadoutChange(left, right)` → `HomeMashup` stores that in
state → re-renders `<Readout left right />` → the text on screen updates. See
`HomeMashup.tsx.md` for the full data flow; this file is just the display end.

## Line-by-line / block walkthrough

```tsx
import styles from './Readout.module.css'

interface ReadoutProps {
  left: string
  right: string
}
```

- CSS Module import — `styles.readout`, `styles.left`, `styles.right` are
  hashed, component-scoped class names (see `Readout.module.css.md`).
- `interface ReadoutProps` declares two **required string props**. No `?`, so a
  caller must pass both. TypeScript will error if `HomeMashup` renders
  `<Readout left="x" />` without `right`.

```tsx
export default function Readout({ left, right }: ReadoutProps) {
  return (
    <div className={styles.readout} aria-hidden="true">
      <span className={styles.left}>{left}</span>
      <span className={styles.right}>{right}</span>
    </div>
  )
}
```

- `{ left, right }: ReadoutProps` — **prop destructuring** in the parameter
  list. Equivalent to `(props) { const left = props.left … }` but terser. This
  is the standard React function-component signature.
- The component returns JSX directly — no state, no effect, no logic. Given the
  same props it always renders the same DOM. This makes it a **pure function
  component**, the simplest and most predictable kind.
- **`{left}` / `{right}`** — curly braces in JSX embed a JS expression as a
  text node. Here they interpolate the prop strings between the `<span>` tags.
- **`aria-hidden="true"`** — the readout is decorative flavour text layered over
  an animation; this removes it from the screen-reader accessibility tree so
  assistive tech doesn't announce constantly-changing "LEAD II"-style noise.
- Two `<span>`s, one pushed left and one right by CSS flexbox
  (`justify-content: space-between` in the module), giving the classic
  monitor-corners look.

## Libraries & APIs used

- **React** — function component, JSX, props.
- **TypeScript** — props interface with required fields.
- **CSS Modules** — `Readout.module.css`.
- **ARIA** — `aria-hidden` for accessibility.

## Concepts to learn here

- A *presentational / pure* component: props in, JSX out, no state or effects.
- Required vs optional props (no `?`).
- JSX text interpolation with `{expression}`.
- `aria-hidden` for decorative UI.
- The "child displays, parent owns the data" split: this component never
  *computes* the readout, it only shows what `HomeMashup` hands it.

## How to edit it safely

- **Add a third segment** (say a centre clock): add `center: string` to
  `ReadoutProps`, render a third `<span className={styles.center}>{center}</span>`,
  add a `.center` rule in `Readout.module.css`, and update every
  `onReadoutChange` caller plus `HomeMashup`'s `readout` state shape. The
  compiler will list each spot that needs the new field.
- **Restyle position/size:** edit `Readout.module.css`, not this file. This
  component intentionally carries no inline styles.
- **Gotcha:** keep it pure. Don't add `useState`/`useEffect` here — the design
  deliberately keeps all readout state in `HomeMashup` so there's a single
  source of truth. Adding local state would create two competing copies.
- If you make a prop optional, give it a default in the destructure
  (`{ left, right = '--' }`) so the layout never collapses on a missing value.
