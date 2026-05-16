# `src/components/StrandDetail/Progress/ProgressBeacon.module.css`

## What this file is

The **CSS Module** paired with [`ProgressBeacon.tsx`](./ProgressBeacon.tsx.md).
It styles the beacon button: resetting native button chrome, the hover/focus
affordances (this is an interactive disclosure trigger), the label row, and the
chevron rotation that flips when expanded.

## Line-by-line / block walkthrough

```css
.beacon {
  flex: 1;
  min-width: 320px;
  cursor: pointer;
  border: 1px dashed transparent;
  transition: border-color 0.2s, background 0.2s;
  padding: 0.5rem 0.75rem;
  margin: 0 -0.75rem;
  border-radius: 2px;
  background: transparent;
  text-align: left;
  font: inherit;
  color: inherit;
}
```

- `flex: 1; min-width: 320px` — the beacon is a flex child of the meta row
  (see [`StrandMetaRow.module.css`](../MetaRow/StrandMetaRow.module.css.md)). It
  grows to fill remaining space but never shrinks below 320px, so on narrow
  screens it wraps onto its own line.
- `font: inherit; color: inherit; background: transparent; text-align: left` —
  the standard **button reset**: a native `<button>` has its own font, centred
  text and grey background; this strips all that so the button looks like
  ordinary page content. (Same idea as the breadcrumb's button reset in
  [`StrandDetail.module.css`](../StrandDetail.module.css.md).)
- `border: 1px dashed transparent` + `transition: border-color …, background …`
  — an invisible border reserved so that on hover the border can appear
  **without shifting layout** (a common trick: always reserve the border, just
  change its colour).
- `margin: 0 -0.75rem` — negative horizontal margin cancels the `0.75rem`
  padding so the *text* still lines up with siblings while the hover background
  extends slightly beyond.

```css
.beacon:hover {
  border-color: rgba(47, 1, 71, 0.15);
  background: rgba(47, 1, 71, 0.04);
}
```

On hover the reserved dashed border becomes faintly visible and a barely-there
tint appears — a subtle "this is clickable" affordance. Both properties are in
the transition list so they fade in.

```css
.beacon:focus-visible {
  outline: 2px solid #A30B37;
  outline-offset: 2px;
}
```

**Keyboard accessibility.** `:focus-visible` matches only when focus should be
*shown* (typically keyboard navigation, not mouse clicks), so mouse users do not
get a focus ring but keyboard users get a clear crimson outline. `outline-offset`
pushes it slightly away from the element. Never remove focus styling from an
interactive control without replacing it — this is the replacement, done right.

```css
.label { ... display: flex; justify-content: space-between; align-items: center; }
.expand { ... color: #A30B37; font-weight: 700; }
```

The label row uses Flexbox with `justify-content: space-between` to push
"progression" to the left and the "expand/collapse" hint to the right edge. Both
use the folder's mono/uppercase/letter-spaced label idiom; `.expand` is the
crimson accent.

```css
.expandIcon {
  display: inline-block;
  transition: transform 0.3s;
  margin-left: 0.3em;
}

.beacon.expanded .expandIcon {
  transform: rotate(180deg);
}
```

The `▾` chevron. `display: inline-block` so `transform` applies cleanly.
`transition: transform 0.3s` means any rotation animates. The second rule is a
**state-driven transform**: when the beacon also has the `.expanded` class
(added by the TSX when `expanded` is true), the chevron rotates 180° to point
up. Because of the transition it *spins* smoothly between ▾ and ▴ as the user
toggles. This is the canonical "rotate a caret to indicate open/closed" pattern,
driven purely by a class toggled from React state.

```css
.svg {
  width: 100%;
  height: 56px;
  display: block;
  overflow: visible;
}
```

The mini SVG: full width, fixed `56px` tall (matching `BEACON_VBH = 56` in the
TSX so the viewBox maps 1:1 vertically), `display: block` removes the inline
baseline gap, `overflow: visible` lets the pulsing circle and any glyphs that
extend past the viewBox still show (the pulse grows beyond its nominal radius).

## Libraries & APIs used

- Plain CSS as a **CSS Module**: Flexbox, **button reset**,
  `transition: transform`, `transform: rotate()`, `:hover`,
  **`:focus-visible`**, `overflow: visible`, negative margin trick.

## Concepts to learn here

- **Styling a native `<button>` to look like content** (button reset) while
  keeping its semantics/accessibility.
- **`:focus-visible`** for keyboard-only focus rings — accessible *and*
  unobtrusive.
- **Reserve-the-border trick** to prevent hover layout shift.
- **State-driven CSS via a toggled class** (`.expanded`) animating a
  `transform: rotate` — React owns state, CSS owns the motion.
- Matching CSS pixel height to the SVG viewBox height.

## How to edit it safely

- If you change `BEACON_VBH` in [`ProgressBeacon.tsx`](./ProgressBeacon.tsx.md),
  update `.svg { height }` here to match (keeps the aspect mapping clean).
- Keep a visible focus style — if you change it, replace it, never just
  `outline: none`. This control must be keyboard-usable (it is the disclosure
  trigger).
- The chevron flip depends on the TSX adding `styles.expanded` when `expanded`
  is true; the `.beacon.expanded .expandIcon` selector won't fire otherwise.
- The pulse animation itself lives in [`usePulse.ts`](./usePulse.ts.md)
  (anime.js), not here — this file only needs `overflow: visible` so the
  expanding circle is not clipped.
- Cross-refs: classes consumed in
  [`ProgressBeacon.tsx`](./ProgressBeacon.tsx.md); the beacon's flex behaviour
  interacts with
  [`StrandMetaRow.module.css`](../MetaRow/StrandMetaRow.module.css.md).
