# `src/components/PersonIcon.tsx`

## What this file is

A tiny **inline-SVG component**: a single reusable "person" silhouette disc (a filled circle with a stylised head/shoulders and decorative dots) used for every person on the `WhoPage`. It is the cleanest example in the codebase of authoring SVG directly as JSX and parameterising it via props. Pairs with `WhoPage.tsx` / `PersonPanel.tsx` (which render it) and is the people-equivalent of `StrandIcon`.

## Line-by-line / block walkthrough

```tsx
interface PersonIconProps {
  color: string
  className?: string
  style?: React.CSSProperties
}
```

The prop interface: a required `color` and optional `className`/`style`. `React.CSSProperties` is the TypeScript type for an inline style object (the same shape you pass to a `style={{...}}` prop) — using it makes the component accept a typed style object from its parent. Optional props (`?`) mean callers can omit them.

```tsx
export default function PersonIcon({ color, className, style }: PersonIconProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      style={style}
    >
```

- **Inline SVG in JSX**: you write `<svg>` and its children directly as JSX elements. React renders real SVG DOM nodes (it knows the SVG namespace for elements written in JSX — unlike imperative code which needs `createElementNS`). This is the React-idiomatic way to ship an icon: no extra file, no `<img>`, fully styleable.
- `viewBox="0 0 200 200"` defines a 200×200 internal coordinate system. All the child coordinates below are in those units; the SVG scales to whatever CSS width/height the parent gives it (`className`/`style` are passed straight through so the *parent* controls size — e.g. `RDStrands.module.css`'s `.svgDisc`). Decoupling intrinsic coordinates (`viewBox`) from rendered size is the core SVG idea.
- `xmlns="http://www.w3.org/2000/svg"` — the SVG namespace declaration (good practice; required when the SVG might be used standalone).
- `aria-hidden="true"` — the icon is decorative; the accessible name comes from the surrounding button/label, so it is hidden from screen readers.
- `className={className}` / `style={style}` — **pass-through props**: the component does not style itself; it lets the caller size/position it. This keeps the icon dumb and reusable across contexts (picker disc, panel header).

```tsx
<circle cx="100" cy="100" r="95" fill={color} />
<circle cx="100" cy="100" r="72" fill="none" stroke="#FCE8D5" strokeWidth="2" opacity="0.35" />
<circle cx="78"  cy="62"  r="2.5" fill="#FCE8D5" opacity="0.7" />
...
<circle cx="100" cy="95" r="18" fill="none" stroke="#FCE8D5" strokeWidth="4" />
<path
  d="M 68 145 C 68 125, 82 118, 100 118 C 118 118, 132 125, 132 145"
  fill="none" stroke="#FCE8D5" strokeWidth="4" strokeLinecap="round"
/>
```

The drawing, in `viewBox` coordinates:

- `<circle cx cy r fill={color} />` — the big background disc. **`fill={color}` is the one parameterised attribute**: the parent passes a colour (often a CSS `var(--strand-selected, …)` string) and the disc recolours. This is how one SVG component serves both the default and selected states without duplication.
- `fill="none"` + a `stroke` = an outlined (un-filled) shape — the head ring and the inner faint ring. `fill` and `stroke` are independent in SVG.
- The small `<circle>`s with low `opacity` are decorative "constellation" dots.
- **`<path d="...">`** is the shoulders curve. The `d` mini-language here uses `M` (moveto) then `C` (cubic Bézier: `C c1x c1y, c2x c2y, endx endy` — two control points then the end point). Reading a `C` command: it draws a smooth curve from the current point to the end point, bent by the two control points. `strokeLinecap="round"` rounds the stroke ends.
- **JSX SVG attribute naming**: note `strokeWidth`, `strokeLinecap` (camelCase) — JSX uses the DOM property names, not the hyphenated SVG attribute names (`stroke-width`). This is a frequent source of confusion: in a `.svg` file it is `stroke-width`; in JSX it is `strokeWidth`.

## Libraries & APIs used

- **React 18** — function component, JSX SVG. <https://react.dev/>
- **SVG** — `<svg viewBox>`, `<circle>`, `<path>` with the `M`/`C` path commands, `fill`/`stroke`/`stroke-width`/`stroke-linecap`/`opacity`. <https://developer.mozilla.org/docs/Web/SVG/Element>; path syntax: <https://developer.mozilla.org/docs/Web/SVG/Attribute/d>
- **TypeScript** — `React.CSSProperties`.

## Concepts to learn here

- Authoring an icon as inline JSX SVG (no asset file, fully styleable) vs `<img>` or `createElementNS`.
- `viewBox` as an intrinsic coordinate system decoupled from rendered size.
- Pass-through `className`/`style` props so the *caller* controls sizing/positioning — a dumb, reusable component.
- Parameterising one attribute (`fill={color}`) to serve multiple visual states.
- `fill="none"` + `stroke` for outlined shapes; `fill`/`stroke` independence.
- SVG path mini-language: `M` (move), `C` (cubic Bézier with two control points).
- JSX SVG attributes are camelCased DOM property names (`strokeWidth`, not `stroke-width`).
- `aria-hidden="true"` for decorative graphics.

## How to edit it safely

- **Recolour the disc**: it is controlled by the `color` prop from the parent — change the value passed in `WhoPage.tsx`/`PersonPanel.tsx`, not here. The accent strokes (`#FCE8D5`) are hardcoded; change them here if needed.
- **Restyle/redraw**: edit the `<circle>`/`<path>` coordinates — they are in the 200×200 `viewBox` space, so they are resolution-independent and scale with whatever size the parent sets.
- **Resize**: do *not* add width/height here; the parent sizes it via `className`/`style` (e.g. `.svgDisc` in `RDStrands.module.css`). Keeping size external is what makes it reusable.
- **Gotcha — use camelCase SVG attributes in JSX** (`strokeWidth`, `strokeLinecap`); the hyphenated forms will not work.
- **Gotcha — keep `aria-hidden="true"`** unless this icon ever becomes the sole conveyor of meaning (then give it a `<title>`/`role="img"` instead).
- Paired/related: **`StrandIcon.tsx`** (the same pattern for strands, with per-id glyphs), **`PersonPanel.tsx`** and **`WhoPage.tsx`** (render this and supply `color`/`className`/`style`), and the sizing class `.svgDisc` in **`RDStrands.module.css`** (reused by `WhoPage`).
