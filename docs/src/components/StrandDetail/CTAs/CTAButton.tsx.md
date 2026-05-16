# `src/components/StrandDetail/CTAs/CTAButton.tsx`

## What this file is

A single **call-to-action button** (rendered as a styled `<a>` link). It takes
one `CTA` data object and renders a link with the right visual variant
(`primary` / `secondary`) and an optional trailing arrow. It is the leaf
component used by [`StrandCTARow`](./StrandCTARow.tsx.md), which maps over the
strand's `ctas` array.

## Line-by-line / block walkthrough

```tsx
import type { CTA } from '../../../data/strands'
import styles from './CTAButton.module.css'
```

- `import type { CTA }` — type-only import of the `CTA` shape from the canonical
  data module (`{ label, href, variant, arrow? }`; see `src/data/strands.ts`).
- `styles` — the paired **CSS Module**
  ([`CTAButton.module.css`](./CTAButton.module.css.md)).

```tsx
export interface CTAButtonProps {
  cta: CTA
}
```

The component's props: a single `cta` object. Wrapping the data in a named prop
(rather than spreading `label`, `href`, … as separate props) keeps the call site
tidy and lets the data type stay the single source of truth.

```tsx
export default function CTAButton({ cta }: CTAButtonProps) {
  const variantClass = cta.variant === 'primary' ? styles.primary : styles.secondary
```

`variant` is a **string-literal union** (`'primary' | 'secondary'`). The ternary
maps it to the matching CSS-module class. Doing this once into a variable keeps
the JSX readable and means the class decision lives in one place.

```tsx
  return (
    <a href={cta.href} className={`${styles.cta} ${variantClass}`}>
```

Renders an anchor. The `className` is a **template literal** combining two
classes: the shared `.cta` base (sizing, padding, transition) plus the chosen
variant class (colours). Combining a base + modifier class is a common pattern;
the base holds shared rules, the modifier holds the differences.

```tsx
      {cta.label}
      {cta.arrow && (
        <span className={styles.arrow} aria-hidden="true">→</span>
      )}
```

- `{cta.label}` renders the visible link text.
- `{cta.arrow && (<span>…</span>)}` is **conditional rendering via `&&`**: if
  `cta.arrow` is truthy, render the arrow span; if falsy/`undefined`, render
  nothing. (`arrow?` is optional in the `CTA` type.) This is the idiomatic
  React way to say "render X only when condition." The `→` is just a Unicode
  character; `aria-hidden="true"` hides it from screen readers because it is
  decorative — the label already conveys the action. The CSS animates this span
  on hover (see the paired CSS).

```tsx
    </a>
  )
}
```

## Libraries & APIs used

- **React**: function component, JSX, `&&` conditional rendering, template
  literal `className`.
- **CSS Modules** (`styles.cta`, `styles.primary`, …).
- TypeScript: string-literal union (`CTA.variant`), optional field (`arrow?`).

## Concepts to learn here

- **Base + variant class composition** driven by a typed union.
- **Conditional rendering with `&&`** vs the ternary used in
  [`StrandDetail.tsx`](../StrandDetail.tsx.md) — `&&` for "show or nothing,"
  ternary for "this or that."
- **Decorative content + `aria-hidden`** for accessibility.
- Passing **one data object as a prop** instead of many primitives.

## How to edit it safely

- To add a third variant (e.g. `'ghost'`): add it to the `CTA.variant` union in
  `src/data/strands.ts`, then replace the ternary with a lookup/switch mapping
  each variant to its class, and add a `.ghost` rule in
  [`CTAButton.module.css`](./CTAButton.module.css.md).
- To change the arrow glyph or its hover motion, edit the CSS (the `.arrow`
  transition / `.cta:hover .arrow`), not this file.
- If a CTA should open in a new tab, add `target`/`rel` here driven by a new
  optional field on `CTA` — keep behaviour data-driven, not hardcoded.
- Cross-reference: rendered in a list by
  [`StrandCTARow.tsx`](./StrandCTARow.tsx.md); styled by
  [`CTAButton.module.css`](./CTAButton.module.css.md).
