# `src/components/StrandDetail/Progress/ProgressBranch.module.css`

## What this file is

A deliberately **tiny one-rule CSS Module** paired with
[`ProgressBranch.tsx`](./ProgressBranch.tsx.md). Almost all of a branch's
appearance (colours, shapes, dashes) is set with **inline SVG attributes** in
the TSX, because each output type (paper/prototype/artefact) needs different
values that CSS classes would awkwardly multiply. This file only handles the one
thing that *is* uniform: the hover cursor.

## Line-by-line / block walkthrough

```css
/* Branch group — cursor + hit-target. The branch lines, returns and
   nodes themselves carry presentational SVG attributes inline because
   each output type uses different colours / shapes. */
.branch {
  cursor: pointer;
}
```

The comment is itself the lesson: it documents *why* the file is nearly empty —
inline SVG attributes own the per-type visuals. The single rule sets
`cursor: pointer` on the branch `<g>` so the whole branch group reads as
interactive (it is hover/focus/tooltip-enabled). The group is the hit-target;
this just gives it the right pointer affordance.

Recall the TSX applies this as `className={`${styles.branch} branch`}` — the
`styles.branch` (this rule) for the cursor, and the *plain* `branch` /
`branch-line` / `branch-node` etc. classes for the animation hook to select.
Two class systems coexisting on one element for two different purposes (styling
vs animation targeting) is worth internalising.

## Libraries & APIs used

- Plain CSS as a **CSS Module**: just `cursor`.

## Concepts to learn here

- **When NOT to use CSS**: data-driven, per-variant SVG visuals are often
  cleaner as inline attributes than as a combinatorial explosion of CSS classes.
  The minimal module + explanatory comment is intentional design, not laziness.
- **Two parallel class systems on one element**: CSS-module class for styling,
  plain string classes for JS animation selectors (see
  [`useProgressEntrance.ts`](./useProgressEntrance.ts.md)).

## How to edit it safely

- Need a hover *visual* change for the whole branch (e.g. dim siblings)? That
  is hard here because colours are inline per element; prefer doing it via the
  React hover state already flowing through
  [`ProgressTimeline`](./ProgressTimeline.tsx.md) (which is how the tooltip
  works) rather than CSS sibling selectors.
- Do not move the per-type colours into this file unless you also restructure
  the TSX — they are intentionally inline because they vary by `output.type`.
- Cross-refs: [`ProgressBranch.tsx`](./ProgressBranch.tsx.md) (consumes
  `.branch`), and [`useProgressEntrance.ts`](./useProgressEntrance.ts.md) (uses
  the *plain* branch classes, not this module).
