# `src/components/StrandDetail/Progress/ProgressPhaseNode.module.css`

## What this file is

An **intentionally empty CSS Module** (only commented placeholder rules) paired
with [`ProgressPhaseNode.tsx`](./ProgressPhaseNode.tsx.md). The phase nodes'
entire appearance is set via **inline SVG attributes** (per-status fill/stroke);
the class names exist only as *hooks* for the entrance animation. This file
documents that decision so a future reader does not "fix" the empty rules.

## Line-by-line / block walkthrough

```css
/* ProgressPhaseNode — visual styling lives almost entirely in the
   inline SVG attributes (fill / stroke). The class hooks below exist
   so the entrance hook can target each phase tier by status. */
.node            { /* base — shared transforms */ }
.past            { /* past phases — solid plum */ }
.current         { /* current phase — crimson with pulse */ }
.projected       { /* projected phase — outline only, dashed stroke */ }
```

Four empty rule bodies. They exist so that `styles.node`, `styles.past`,
`styles.current`, `styles.projected` are **defined keys** on the CSS-module
`styles` object — the TSX references them in its `className` strings, and a
CSS-module class that is referenced but undefined would be `undefined` at
runtime (yielding a literal `"undefined"` in the class list). Declaring them
empty keeps the references valid while documenting what each *tier* represents.

The comment is the real content: it explains the architecture. Recall the TSX
applies, e.g., `className={`${styles.node} ${styles.current} phase
phase--current`}`:

- `styles.node` / `styles.current` — these (empty) module classes; placeholders
  / future style hooks.
- `phase` / `phase--current` — **plain** class names that
  [`useProgressEntrance`](./useProgressEntrance.ts.md) selects
  (`.phase--past circle`, `.phase--current text`, `.phase--projected`, …) to
  drive the staggered entrance and the reduced-motion snap.

So the per-status *colours/shapes* are inline SVG attributes (they vary by
status and would be clumsy as CSS), while the *animation grouping* is done with
plain semantic classes — and this module just holds the (empty) module-class
keys.

## Libraries & APIs used

- CSS as a **CSS Module** (placeholder rules only).

## Concepts to learn here

- **Why a CSS Module can be legitimately empty**: when visuals are data-driven
  inline SVG attributes, the module only needs to *exist* to provide valid class
  keys; the animation targeting uses separate plain classes.
- **Three class roles on one element**: empty module hooks (future styling),
  plain animation-selector classes (read by the JS entrance hook), and inline
  attributes (the actual look). Recognising this prevents accidental
  "refactors."

## How to edit it safely

- It is fine to leave these rules empty. If you ever need a *shared* tweak
  across a status tier (e.g. a CSS transition on all current nodes), add it to
  the matching rule here rather than duplicating inline attributes.
- Do **not** delete the empty rules expecting nothing to change — the TSX
  references `styles.node/past/current/projected`; removing them yields
  `undefined` class names.
- The actual entrance behaviour is controlled by the *plain* classes in the TSX
  and the selectors in
  [`useProgressEntrance.ts`](./useProgressEntrance.ts.md), not by this file.
- Per-status colour changes go in the inline attributes of
  [`ProgressPhaseNode.tsx`](./ProgressPhaseNode.tsx.md) (and, for consistency,
  the mini dots in [`ProgressBeacon.tsx`](./ProgressBeacon.tsx.md)).
- Cross-refs: [`ProgressPhaseNode.tsx`](./ProgressPhaseNode.tsx.md),
  [`useProgressEntrance.ts`](./useProgressEntrance.ts.md). Compare with the
  similarly-minimal [`ProgressBranch.module.css`](./ProgressBranch.module.css.md).
