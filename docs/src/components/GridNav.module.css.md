# `src/components/GridNav.module.css`

## What this file is

The **CSS Module** for `GridNav.tsx`: a fixed 3-column × 2-row grid of nav tiles, absolutely positioned in the header's top-right, that **scales and fades in step with the header's compact/expanded state** by reading CSS custom properties published by `Header.module.css`. This is a good study of CSS-variable-driven coordination between two stylesheets.

## Line-by-line / block walkthrough

```css
.gridContainer {
  position: absolute;
  top: 16px;
  right: 0;
  width: 518px;
  height: 170px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 4px;
  font-size: 1.9rem;
  transform: scale(var(--header-scale, 1));
  transform-origin: 100% 0;
  opacity: var(--nav-opacity, 1);
  pointer-events: var(--nav-pointer, auto);
  transition: transform 0.3s ease, opacity 0.25s ease;
}
```

- `position: absolute; top: 16px; right: 0;` — pinned to the top-right of its positioned ancestor (the header's `.siteOverlay`, which is `position: relative/absolute`). The nav floats over the header rather than taking layout flow.
- **CSS Grid**: `display: grid` with `grid-template-columns: repeat(3, 1fr)` (three equal columns — `1fr` = one fraction of the free space) and `grid-template-rows: repeat(2, 1fr)` (two equal rows). The six children auto-place into the six cells in source order. `gap: 4px` spaces the cells. This is exactly why `GridNav.tsx` is hard-limited to 6 items — the grid is 3×2.
- **`transform: scale(var(--header-scale, 1))`** — the scale factor is read from a custom property `--header-scale`, with a fallback of `1` (`var(name, fallback)`). That variable is set by `Header.module.css` on the `.siteOverlay` ancestor (1 when expanded, 0.32 when compact). So this nav shrinks/grows automatically when the header collapses — *no JavaScript and no prop passing*; the cascade carries the value down. This is the key teaching point: **custom properties inherit, so a parent can drive a child component's transform by setting a variable.**
- `transform-origin: 100% 0` — scale pivots from the top-right corner, so the nav stays anchored to the right edge as it shrinks (instead of scaling toward its centre and drifting).
- `opacity: var(--nav-opacity, 1)` — likewise faded out (to 0) when the header is compact.
- `pointer-events: var(--nav-pointer, auto)` — when invisible, the parent sets this var to `none` so the offscreen "ghost" of the nav cannot capture clicks. Driving `pointer-events` via a variable is a clean way to make a faded-out element non-interactive without extra rules.
- `transition: transform 0.3s ease, opacity 0.25s ease` — animates those variable-driven changes smoothly. **Note:** you cannot transition a custom property's *value* directly here, but you *can* transition the `transform`/`opacity` properties that consume it — so when `--header-scale` jumps from 1 to 0.32, the resulting `transform` change is what transitions. Subtle but important: transition the consuming property, not the variable.

```css
.navItem {
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: #FFECE1;
  font-weight: bold;
  width: 75%;
  height: 75%;
  position: relative;
  background-color: var(--plum);
  justify-self: center;
  align-self: center;
  transition: background-color 160ms ease;
}
.navItem:hover { background-color: #520359; }
.navItem.active { background-color: var(--crimson); }
```

Each tile is a flex box centring its label text. `width/height: 75%` makes the tile smaller than its grid cell, and `justify-self: center; align-self: center` centre it within the cell (grid-item self-alignment) — so there is visible padding between tiles beyond the `gap`. `text-decoration: none` strips the default anchor underline. `position: relative` is needed so the `.cornerCrop` child (absolutely positioned) anchors to the tile. The `:hover` and `.active` rules just swap `background-color`; the `transition` on the base makes both changes fade. `.navItem.active` is a **compound selector** (the element must have *both* classes) — matching the conditional `${styles.navItem} ${styles.active}` from the component.

```css
.cornerCrop {
  position: absolute;
  top: -10px;
  left: -10px;
  width: 20px;
  height: 20px;
  border-top: 3px solid #2F0147;
  border-left: 3px solid #2F0147;
}
```

The decorative crop bracket the component renders only on the active tile. It is an empty box positioned just outside the tile's top-left corner (negative offsets) with only its top and left borders drawn — a two-sided "L" mark. This corner-bracket motif recurs across the site (loader, panels) and is always built from one or two borders of an empty element.

```css
@media (max-width: 1080px) {
  .gridContainer {
    position: static;
    width: 100%;
    max-width: 518px;
    margin: 12px auto 0;
    height: 140px;
    font-size: 1.3rem;
  }
  .navItem { width: 92%; height: 88%; }
}
```

Responsive fork: on narrow viewports the nav drops the absolute-positioned overlay mechanics and returns to normal flow (`position: static`), centred (`margin: 12px auto 0`), full-width up to 518px, with larger tiles. The header's mobile rules similarly disable the transform-scaling, so on mobile the nav simply stacks under the logo.

## Libraries & APIs used

Pure CSS. References:

- CSS Modules (Vite): <https://vitejs.dev/guide/features#css-modules>
- CSS Grid + `repeat()`/`fr` + self-alignment: <https://developer.mozilla.org/docs/Web/CSS/CSS_grid_layout>
- CSS custom properties + `var(name, fallback)`: <https://developer.mozilla.org/docs/Web/CSS/var>
- `transform`/`transform-origin`: <https://developer.mozilla.org/docs/Web/CSS/transform>
- `transition`: <https://developer.mozilla.org/docs/Web/CSS/transition>
- Media queries: <https://developer.mozilla.org/docs/Web/CSS/CSS_media_queries>

## Concepts to learn here

- CSS Grid `repeat(n, 1fr)` for an even tile grid; grid-item self-alignment for in-cell centring.
- Parent-driven coordination via *inherited* custom properties (`--header-scale`, `--nav-opacity`, `--nav-pointer`) — a sibling stylesheet sets them, this consumes them, zero JS.
- `var(name, fallback)` for safe defaults.
- Transitioning the property that *consumes* a variable (you cannot transition the variable itself).
- `transform-origin` to control the scaling anchor point so the element stays pinned.
- Driving `pointer-events` from a variable to disable faded UI.
- Compound selectors (`.navItem.active`) matching conditional CSS-Modules classes.
- Corner-bracket decoration from partial borders on an empty positioned element.
- Responsive: switching from absolute overlay to normal flow at a breakpoint.

## How to edit it safely

- **Change tile colours**: `.navItem` `background-color` (idle = `var(--plum)`), `:hover`, `.active` (= `var(--crimson)`). Prefer the global tokens.
- **Change the grid shape**: `grid-template-columns/rows`. If you change the count, update `NAV_ITEMS` in `GridNav.tsx` to match (6 items ↔ 3×2). They are coupled.
- **Adjust collapse scaling**: the *values* of `--header-scale`/`--nav-opacity`/`--nav-pointer` are set in `Header.module.css` (`.siteCompact .siteOverlay`), not here — change them there. Here you only change *how* they are consumed (e.g. the `transform-origin`, the transition timing).
- **Gotcha — `transform-origin: 100% 0`** is what keeps the nav anchored right while scaling; changing it will make the collapsed nav drift.
- **Gotcha — renaming a class** requires updating `styles.x` in `GridNav.tsx`.
- Paired files: **`GridNav.tsx`** (renders the tiles + applies `styles.active`/`styles.cornerCrop`), **`Header.module.css`** (publishes `--header-scale`/`--nav-opacity`/`--nav-pointer` that this file reads).
