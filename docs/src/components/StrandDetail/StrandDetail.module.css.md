# `src/components/StrandDetail/StrandDetail.module.css`

## What this file is

The **CSS Module** paired with [`StrandDetail.tsx`](./StrandDetail.tsx.md). It
styles the page shell: the breadcrumb, the centred page container, the framed
"card" with its 2px border, and the four decorative corner brackets. It also
holds the responsive breakpoints for the whole detail page's outer padding.

Because it is a `*.module.css` file, every class name here is **locally scoped**:
the build tool rewrites `.page` into a unique name and exposes it to the TSX as
`styles.page`. Two different components can both have a `.page` class with zero
collision.

## Line-by-line / block walkthrough

```css
.page {
  max-width: 1280px;
  margin: 1.5rem auto 5rem;
  padding: 0 3rem;
  position: relative;
}
```

`.page` is the `<main>` wrapper. `max-width` caps the content width on large
screens; `margin: 1.5rem auto 5rem` centres it horizontally (`auto` left/right)
with top/bottom spacing. `position: relative` establishes a positioning context
(not strictly needed here but harmless and intentional for any
absolutely-positioned descendant).

```css
.breadcrumb {
  max-width: 1280px;
  margin: 0 auto;
  padding: 1.75rem 3rem 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(47, 1, 71, 0.55);
}
```

The breadcrumb `<nav>`. Note the recurring **design-system idiom** used all over
this folder for small "label" text: monospace font, tiny size, wide
`letter-spacing`, `uppercase`, and a semi-transparent plum colour
(`rgba(47, 1, 71, 0.55)` — `#2F0147` at 55% alpha). You will see this exact
recipe again in `MetaItem`, `SectionTitle`, the timeline title, etc. Recognising
it teaches you the visual language of the codebase.

```css
.breadcrumb a,
.breadcrumb button {
  color: #2F0147;
  text-decoration: none;
  opacity: 0.7;
  background: none;
  border: 0;
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  padding: 0;
  cursor: pointer;
}
```

This styles **both** the `<a>` and the `<button>` the same way. Recall the TSX
renders a `<button>` when `onBack` is given and an `<a>` otherwise — styling
both identically means the breadcrumb looks the same regardless of which element
was used. The `background:none; border:0; font:inherit; padding:0` block is the
standard recipe for **"make a button look like text/inherit its surroundings."**
`font: inherit` (shorthand) pulls the monospace styling down from `.breadcrumb`.

```css
.breadcrumb a:hover,
.breadcrumb button:hover {
  opacity: 1;
  color: #A30B37;
}
```

Hover feedback: fully opaque and shift to the crimson accent `#A30B37`. This
plum→crimson hover shift is another repeated motif across the folder.

```css
.sep {
  padding: 0 0.6em;
  opacity: 0.4;
}
```

The `/` separators between breadcrumb segments, dimmed and spaced. `em` units
scale with the element's font size.

```css
.frame {
  position: relative;
  background: #FFECE1;
  border: 2px solid #2F0147;
  padding: 3rem 3rem 3.5rem;
}
```

The `<article>` card. `position: relative` is **load-bearing here**: the four
corner-crop `<span>`s are `position: absolute`, and they position themselves
relative to this `.frame`. `#FFECE1` (warm cream) is the page background colour,
`#2F0147` (deep plum) the border.

```css
.cornerCrop {
  position: absolute;
  width: 28px;
  height: 28px;
  pointer-events: none;
}
```

Base class for all four bracket marks. `position: absolute` removes them from
flow and positions them against `.frame`. `pointer-events: none` makes them
click-through so they never intercept clicks meant for content beneath them.
They have a fixed 28×28 box; only **two of their borders** are drawn (next
block), producing an L-shaped bracket.

```css
.cornerTL { top: -14px; left: -14px;  border-top:    3px solid #A30B37; border-left:  3px solid #A30B37; }
.cornerTR { top: -14px; right: -14px; border-top:    3px solid #A30B37; border-right: 3px solid #A30B37; }
.cornerBL { bottom: -14px; left: -14px;  border-bottom: 3px solid #A30B37; border-left:  3px solid #A30B37; }
.cornerBR { bottom: -14px; right: -14px; border-bottom: 3px solid #A30B37; border-right: 3px solid #A30B37; }
```

Each corner gets a different pair of borders so it forms the correct elbow
(top-left corner draws *top* + *left* edges, etc.). The `-14px` offsets push
each span half-outside the frame so the bracket straddles the frame's own
border, creating the "crop mark" look. In the TSX these classes are applied
*alongside* `.cornerCrop` with a template literal:
`` `${styles.cornerCrop} ${styles.cornerTL}` ``.

```css
@media (max-width: 880px) {
  .breadcrumb,
  .page { padding-left: 1.25rem; padding-right: 1.25rem; }
  .frame { padding: 2rem 1.5rem 2.5rem; }
}
@media (max-width: 480px) {
  .breadcrumb,
  .page { padding-left: 0.75rem; padding-right: 0.75rem; }
  .frame { padding: 1.5rem 1rem 2rem; }
}
```

Two **media queries** for responsive padding. As the viewport narrows, the
generous 3rem side padding shrinks (tablet ≤880px, phone ≤480px) so content is
not crushed and — per the comment — so the corner brackets (which stick out
14px) do not overflow the screen edge. This is the **mobile-first-in-reverse**
style: a desktop default, then progressively tighter overrides at smaller
breakpoints.

## Libraries & APIs used

- Plain CSS, consumed as a **CSS Module** (`import styles from ...`).
- `@media (max-width: …)` responsive queries.
- `rgba()` colours, `border` partial sides, absolute/relative positioning,
  `pointer-events`, the `font:` shorthand with `inherit`.

## Concepts to learn here

- **CSS Modules scoping** — why classes are referenced as `styles.x` in TSX.
- **Decorative elements done right**: `aria-hidden` in markup +
  `pointer-events: none` + absolute positioning relative to a `position:
  relative` ancestor.
- **Drawing shapes with partial borders** (the L-brackets) instead of images.
- **Responsive padding via media queries**, and the design-system label idiom
  (mono + uppercase + letter-spacing + translucent plum) that recurs throughout
  this folder.

## How to edit it safely

- Adding a new class? Add it here and reference it as `styles.newClass` in the
  TSX. Never type the raw string in JSX — the mangled name won't match.
- The corner brackets depend on `.frame` keeping `position: relative` and on the
  `-14px` offsets matching the `border` width visually. Change the frame border
  width and you'll likely want to retune those offsets.
- To restyle hover colours globally, note the plum `#2F0147` / crimson
  `#A30B37` / mauve `#9C528B` palette is repeated literally across every
  `.module.css` in this folder — there are no CSS variables, so a palette change
  is a find-and-replace across files, including the inline SVG `fill`/`stroke`
  attributes in the Progress components.
- Cross-reference: every class here is consumed in
  [`StrandDetail.tsx`](./StrandDetail.tsx.md).
