# `src/components/RDStrands.module.css`

## What this file is

The **CSS Module** for the strand picker. It styles the section, the mixed-weight title, the row of strand groups (with `.selected`/`.dimmed`/`.collapsed` state modifiers), the SVG disc, and the label — with heavy use of `clamp()` for fluid sizing and two responsive forks. It is reused by `WhoPage.tsx` as well as `RDStrands.tsx`, so the class names carry double duty.

## Line-by-line / block walkthrough

```css
.rd {
  text-align: center;
  padding: clamp(0.5rem, 2.4dvh, 4rem) 2rem 0.25rem;
  max-width: 1100px;
  margin: 0 auto;
  scroll-margin-top: 20px;
}
```

`padding: clamp(0.5rem, 2.4dvh, 4rem) 2rem 0.25rem` — the top padding is **fluid**: between 0.5rem and 4rem, scaling with `2.4dvh` (2.4% of dynamic viewport height). Using `dvh`-based `clamp()` for vertical rhythm means the picker shrinks its breathing room on short laptop screens (so it does not blow ConceptView's per-section height budget) but stays generous on tall displays. `scroll-margin-top: 20px` adds a 20px offset when this element is the target of a scroll-snap or anchor jump, so it does not land flush against the top edge — a small but important scroll-UX property.

```css
.rdTitle {
  font-size: clamp(1.25rem, 2dvh + 0.4rem, 2.5rem);
  margin: 0 0 clamp(0.5rem, 2.4dvh, 3.5rem);
  line-height: 1.1;
}
.thin { font-weight: 400; }
```

`clamp(1.25rem, 2dvh + 0.4rem, 2.5rem)` — the preferred value is an **expression** (`2dvh + 0.4rem`), which `clamp()` supports: a viewport-relative part plus a fixed floor. The bottom margin is also a `dvh` clamp. `.thin` is the lighter-weight class the component wraps around fragments of the heading for mixed-weight typography.

```css
.rdRow {
  display: flex;
  justify-content: center;
  gap: clamp(2rem, 8dvh, 8rem);
  margin-top: clamp(0.5rem, 2dvh, 2rem);
  transition: gap 0.4s ease, margin-top 0.4s ease;
}
.rdRow.collapsed {
  gap: clamp(1.5rem, 4dvh, 4rem);
  margin-top: clamp(0.25rem, 1dvh, 1rem);
}
```

The flex row of strand groups. **`transition: gap 0.4s ease, margin-top 0.4s ease`** — when the component adds the `.collapsed` modifier (because a strand is open), the `gap` and `margin-top` shrink and the transition *animates* that contraction. Modern flex `gap` is animatable; the picker visually tightens when you open a strand. This is the base-with-transition + toggled-modifier pattern again. `.rdRow.collapsed` is a compound selector (both classes present).

```css
.rdGroup {
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: opacity 0.35s ease, transform 0.4s ease, max-width 0.4s ease;
  max-width: 260px;
  padding: 18px 24px 0;
}
.rdGroup.selected { transform: scale(1.06); }
.rdGroup.dimmed { opacity: 0.4; }
.rdGroup.dimmed:hover { opacity: 1; }
```

Each group is a centred column. The base `transition` covers `opacity`/`transform`/`max-width`, so the state modifiers animate:

- `.selected` → `transform: scale(1.06)` (a subtle "this is current" pop). The comment records a real bug history: it used to be hidden (opacity 0 + max-width 0), which both hid `StrandIcon`'s crimson highlight *and* dropped the row to two circles, knocking the picker off-centre. The fix: keep it in the row, just scale it. **Lesson: hiding a flex child changes the centring of its siblings — prefer de-emphasising over removing.**
- `.dimmed` → `opacity: 0.4` for the non-selected ones; `.dimmed:hover` brings it back to full so hovering a dimmed strand still previews it.

```css
.rdLink { background: none; border: none; padding: 0; cursor: pointer; display: inline-block; }
```

Resets the native `<button>` chrome (background, border, padding) so the button is an invisible wrapper around the SVG disc — the standard "unstyle a button used purely as a click target" reset, while keeping it a real accessible `<button>`.

```css
.svgDisc {
  width: clamp(82px, 14dvh, 130px);
  height: clamp(82px, 14dvh, 130px);
  border-radius: 50%;
  transition: transform 0.2s ease-out, filter 0.25s ease;
  transform-origin: center;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.2));
  overflow: visible;
}
.rdLink:hover .svgDisc {
  transform: scale(var(--strand-hover-scale, 1.12));
}
```

The disc is a fluid square (`clamp` width = height) clipped to a circle (`border-radius: 50%`). `filter: drop-shadow(...)` (works on inline SVG; `box-shadow` would not follow the circle). The hover scale reads `var(--strand-hover-scale, 1.12)` — a custom property with a fallback, so a parent could tune the hover strength without editing this file. `.rdLink:hover .svgDisc` is a **descendant-on-hover selector**: hovering the button scales the disc inside it. `transform-origin: center` keeps the scale in place.

```css
@media (max-width: 1080px) { .rdTitle { font-size: 1.8rem; } .rdRow { gap: 3rem; flex-wrap: wrap; } ... }
@media (max-width: 720px) {
  .rdTitle { display: none; }
  .rdRow, .rdRow.collapsed { gap: clamp(0.5rem, 3vw, 1.25rem); flex-wrap: nowrap; justify-content: space-around; }
  .rdGroup { max-width: 33%; padding: 0; }
  .svgDisc { width: clamp(56px, 19vw, 92px); height: clamp(56px, 19vw, 92px); }
  .label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
}
```

Two responsive forks. At ≤1080px the title shrinks and the row may wrap. At ≤720px (phone): the redundant title is **removed entirely** (`display: none` — the section eyebrow already names it; reclaiming vertical space matters more than the duplicate heading), discs switch to **width-based** clamps (`vw` not `dvh`) so they shrink with horizontal room, the row is forced to *not* wrap (`flex-wrap: nowrap` + `space-around` keeps all three on one line at 360px), and labels get the classic single-line truncation trio: `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`. Switching from `dvh`-based to `vw`-based clamps on phones (where horizontal space is the real constraint) is a thoughtful responsive decision worth noting.

## Libraries & APIs used

Pure CSS. References:

- CSS Modules (Vite): <https://vitejs.dev/guide/features#css-modules>
- `clamp()` with expression preferred value, `dvh`/`vw`: <https://developer.mozilla.org/docs/Web/CSS/clamp>
- `scroll-margin-top`: <https://developer.mozilla.org/docs/Web/CSS/scroll-margin-top>
- Flexbox `gap`/`flex-wrap` (animatable `gap`): <https://developer.mozilla.org/docs/Web/CSS/gap>
- `filter: drop-shadow`: <https://developer.mozilla.org/docs/Web/CSS/filter-function/drop-shadow>
- Custom properties `var(name, fallback)`: <https://developer.mozilla.org/docs/Web/CSS/var>
- Text truncation: <https://developer.mozilla.org/docs/Web/CSS/text-overflow>

## Concepts to learn here

- Fluid sizing with `clamp()`, including expression preferred values and `dvh` vs `vw` (height- vs width-driven, chosen per breakpoint).
- `scroll-margin-top` so snap/anchor targets do not land flush.
- Animatable flex `gap`: base `transition` + a toggled `.collapsed` modifier contracts the row smoothly.
- De-emphasise (scale/opacity) rather than remove a flex child, to avoid shifting sibling centring.
- `:hover` recovery on dimmed items; descendant-on-hover (`.rdLink:hover .svgDisc`).
- Button reset for an accessible-button-as-click-target.
- `filter: drop-shadow` for SVG (vs `box-shadow`); `var(name, fallback)` for tunable hover scale.
- Single-line truncation idiom (`nowrap` + `overflow:hidden` + `text-overflow:ellipsis`).
- A CSS Module shared by two components.

## How to edit it safely

- **Resize the discs**: `.svgDisc { width/height: clamp(...) }` (and the ≤720px override). Keep width == height (it is clipped to a circle).
- **Tune the open-state contraction**: `.rdRow.collapsed` gap/margin and `.rdGroup.selected` scale.
- **Change hover strength**: the `--strand-hover-scale` fallback in `.rdLink:hover .svgDisc`, or set that variable from a parent.
- **Gotcha — do not hide `.rdGroup.selected`** (opacity/max-width 0); the comment documents that this broke picker centring and hid the active highlight. Keep it visible and just scale it.
- **Gotcha — this module is shared with `WhoPage.tsx`.** A change here affects both the strand picker and the people picker; check both.
- **Gotcha — renaming a class** must be mirrored in `RDStrands.tsx` *and* `WhoPage.tsx` (and `MobileStrandList`/`StrandPanel` use their *own* modules — do not confuse them).
- Paired files: **`RDStrands.tsx`** and **`WhoPage.tsx`** (both consume `styles.rd*`), **`StrandIcon.tsx`**/**`PersonIcon.tsx`** (the SVG given `styles.svgDisc`).
