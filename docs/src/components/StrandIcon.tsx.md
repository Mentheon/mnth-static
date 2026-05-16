# `src/components/StrandIcon.tsx`

## What this file is

An **inline-SVG icon component** that draws a different glyph inside a coloured disc depending on which strand id it is given (`kindred`, `vitalis`, `vitrix`). It is the strand equivalent of `PersonIcon`, but with **conditional sub-graphics**. Used by `RDStrands`, `MobileStrandList`, and `StrandPanel`.

## Line-by-line / block walkthrough

```tsx
interface StrandIconProps {
  strandId: string
  color: string
  className?: string
  style?: React.CSSProperties
}
export default function StrandIcon({ strandId, color, className, style }: StrandIconProps) {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={className} style={style}>
      <circle cx="100" cy="100" r="95" fill={color} />
```

Same skeleton as `PersonIcon` (see that doc for the SVG fundamentals: `viewBox` as intrinsic coordinate space, pass-through `className`/`style`, `aria-hidden`, `fill={color}` parameterisation). The added input is `strandId`, which selects which inner glyph to draw.

```tsx
{strandId === 'kindred' && (
  <g fill="none" stroke="#FCE8D5" strokeWidth="4" strokeLinecap="round">
    <circle cx="80" cy="100" r="32" />
    <circle cx="120" cy="100" r="32" />
    <path d="M 100 108 C 100 108, 92 100, 92 94 C 92 89, 96 86, 100 90 C 104 86, 108 89, 108 94 C 108 100, 100 108, 100 108 Z" fill="#FCE8D5" stroke="none" />
    <circle cx="100" cy="55" r="3" fill="#FCE8D5" stroke="none" />
    ...
  </g>
)}
{strandId === 'vitalis' && ( <g ...> ...branching strokes + dots... </g> )}
{strandId === 'vitrix' && ( <g> ...waveform path + node dots... </g> )}
```

The interesting part: **conditional rendering of SVG sub-trees with `&&`**. `{strandId === 'kindred' && (<g>…</g>)}` renders that `<g>` group only when the id matches; the other two branches are `false` (React renders nothing for `false`). Exactly one glyph appears. Concepts:

- **`<g>` is the SVG group element** — it has no shape itself but lets you set shared presentation attributes (`fill="none" stroke="#FCE8D5" strokeWidth="4"`) once and have *all children inherit* them. SVG presentation attributes inherit down the tree like CSS, so grouping is the way to avoid repeating `stroke` on every child. This is the SVG analogue of a styled wrapper.
- Each glyph mixes outlined shapes (`fill="none"` + the group's `stroke`) with filled accents that **override the group** locally (`fill="#FCE8D5" stroke="none"` on individual children) — child attributes win over inherited group attributes, the normal SVG cascade.
- The `kindred` heart `<path>` ends with **`Z`** — the closepath command, which draws a straight line back to the path's start point to close the shape (so it can be filled cleanly). `M`/`C`/`Z` together = move, curve, close. Worth knowing alongside `L`/`Q`.
- `vitalis` is a branching tree of `<path>` strokes plus terminal `<circle>` dots; `vitrix` is a zig-zag waveform `<path>` with `strokeLinejoin="round"` (rounds the corners *between* segments, distinct from `strokeLinecap` which rounds the ends) plus orbit dots. These show the same primitives composed differently.

This "switch on an id prop to pick one of N inline SVG sub-trees" is a clean pattern for an icon set that shares a common frame (the disc) — far simpler than N separate components or N asset files.

## Libraries & APIs used

- **React 18** — function component, JSX SVG, conditional rendering with `&&`. <https://react.dev/>
- **SVG** — `<svg viewBox>`, `<g>` (grouping + attribute inheritance), `<circle>`, `<path>` with `M`/`C`/`Z` commands, `fill`/`stroke`/`stroke-width`/`stroke-linecap`/`stroke-linejoin`. <https://developer.mozilla.org/docs/Web/SVG/Element/g>; path syntax: <https://developer.mozilla.org/docs/Web/SVG/Attribute/d>
- **TypeScript** — `React.CSSProperties`.

## Concepts to learn here

- Conditional rendering of whole SVG sub-trees with `{cond && <g>…</g>}` to switch glyphs by an id prop.
- `<g>` for shared, inherited presentation attributes; child attributes override the group (SVG cascade).
- Mixing outlined (`fill:none`+`stroke`) and filled (`stroke:none`+`fill`) shapes within one group.
- SVG path commands `M` / `C` / `Z` (move, cubic Bézier, closepath); `stroke-linejoin` vs `stroke-linecap`.
- Reusable icon-set pattern: one shared frame + a prop-selected inner glyph (vs many components/files).
- Pass-through `className`/`style`, `fill={color}` parameterisation, `aria-hidden` (same as `PersonIcon`).

## How to edit it safely

- **Add a new strand glyph**: add another `{strandId === 'newid' && (<g>…</g>)}` block. Keep the disc `<circle>` (it is shared and outside the conditionals). The new id must match the strand's `id` in `src/data/strands.ts`.
- **Recolour the disc**: it is the `color` prop — change what callers pass (`RDStrands`/`MobileStrandList`/`StrandPanel`). Accent strokes are the hardcoded `#FCE8D5`; change here if needed.
- **Redraw a glyph**: edit its `<g>`'s children — coordinates are in the 200×200 `viewBox`, so they scale with whatever size the parent sets via `className`/`style`.
- **Gotcha — camelCase SVG attributes in JSX** (`strokeWidth`, `strokeLinecap`, `strokeLinejoin`), not the hyphenated forms.
- **Gotcha — if no `strandId` matches**, only the bare coloured disc renders (all three `&&` branches are `false`). That is the implicit default; ensure ids stay in sync with the data.
- **Gotcha — close filled paths with `Z`**; an unclosed path filled looks wrong.
- Paired/related: **`PersonIcon.tsx`** (same pattern, single glyph), **`RDStrands.tsx`** / **`MobileStrandList.tsx`** / **`StrandPanel.tsx`** (render this, supply `strandId`/`color`), sizing via `.svgDisc` in **`RDStrands.module.css`** and `.icon` in **`MobileStrandList.module.css`**.
