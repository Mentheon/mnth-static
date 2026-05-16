# `src/components/Header.module.css`

## What this file is

The **CSS Module** that implements the header's collapse/expand mechanics. It is the most conceptually interesting stylesheet for layout: it separates a *layout-reserved box* (`.site`, whose height drives the rest of the page) from a *visible overlay* (`.siteOverlay`, which grows on hover *without* shifting layout), and publishes CSS custom properties that `GridNav.module.css` and the logo consume to scale/fade themselves in step.

Pairs with `Header.tsx` (toggles `.siteCompact`) and `GridNav.module.css` (consumes the variables defined here).

## Line-by-line / block walkthrough

### The layout-reserved box

```css
.site {
  position: relative;
  width: 100%;
  height: 186px;
  background-color: var(--bg);
  max-width: 1100px;
  margin: 0 auto;
  transition: height 0.3s ease;
  z-index: 100;
}
.siteCompact { height: 70px; }
```

`.site` is the **in-flow box** — it occupies real layout space and its height is what `Header.tsx`'s `ResizeObserver` measures and publishes as `--header-h`. `position: relative` makes it the containing block for the absolutely-positioned `.siteOverlay`. The `transition: height 0.3s ease` animates the collapse. `Header.tsx` adds the `.siteCompact` class (via `styles.siteCompact`) to drop the reserved height 186→70; the transition makes that smooth and the page below reflows accordingly. **Key idea: the box that reserves layout changes height; that is the single source of truth for "how tall is the header".**

### The visible overlay (decoupled from layout)

```css
.siteOverlay {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 186px;
  background-color: var(--bg);
  transition: height 0.3s ease;
  --header-scale: 1;
  --nav-opacity: 1;
  --nav-pointer: auto;
}
.siteCompact .siteOverlay {
  height: 70px;
  overflow: hidden;
  --header-scale: 0.32;
  --nav-opacity: 0;
  --nav-pointer: none;
}
.siteCompact .siteOverlay:hover {
  height: 186px;
  overflow: visible;
  --header-scale: 1;
  --nav-opacity: 1;
  --nav-pointer: auto;
  box-shadow: 0 6px 18px rgba(47, 1, 71, 0.12);
}
```

This is the clever part. `.siteOverlay` is `position: absolute` *inside* `.site`, so **its size changes do not affect document layout** — only `.site`'s reserved height does. This lets the compact header **re-expand on hover** to overlay the content below *without* pushing the page around (which would be jarring and would feed back into the scroll position).

It also **defines three custom properties** (`--header-scale`, `--nav-opacity`, `--nav-pointer`). Because custom properties **inherit down the DOM**, the logo and `GridNav` (descendants) read them via `var(--header-scale)` etc. and scale/fade themselves automatically. The values change across three states:

- Default (expanded): scale 1, opacity 1, pointer auto.
- `.siteCompact .siteOverlay` (compact): scale 0.32, opacity 0 (nav hidden), pointer none (so the invisible nav cannot be clicked).
- `.siteCompact .siteOverlay:hover` (compact but hovered): back to full — the header pops open again, with a `box-shadow` to lift it visually off the content it overlays.

`.siteCompact .siteOverlay` is a **descendant selector** — the overlay's rules only apply when an ancestor has `.siteCompact`. The comment explains why `:hover` is detected on the *overlay* (not `.site`): the overlay's box *grows* on hover, so the hover stays "sticky" as the cursor moves into the newly-expanded area; if hover were on the fixed-size `.site` the cursor would leave its box and the header would snap shut. This is a real, subtle hover-target lesson.

`overflow: hidden` while compact clips the scaled-down contents so nothing leaks out of the 70px strip; `overflow: visible` on hover lets the full-size contents and shadow show.

### The logo

```css
.logoWrap {
  position: absolute;
  top: 6px; left: 0;
  width: 518px; height: 170px;
  display: flex; align-items: center; justify-content: center;
  transform: scale(var(--header-scale, 1));
  transform-origin: 0 0;
  transition: transform 0.3s ease;
}
.logoWrap img { width: 518px; height: 170px; display: block; }
```

The logo scales by **`transform: scale(var(--header-scale, 1))`** — the very variable `.siteOverlay` sets. So when the header goes compact, `--header-scale` becomes 0.32 and the logo shrinks; on hover it returns to 1. `transform-origin: 0 0` pivots from the top-left so the shrunken logo stays anchored to the corner. The `transition: transform 0.3s` animates it. (`GridNav.module.css` does the exact same trick with `transform-origin: 100% 0` to stay anchored right.) **Lesson: a parent sets one variable; multiple independent descendants each consume it to coordinate a single visual state — no JS, no prop drilling.**

### Mobile fork

```css
@media (max-width: 1080px) {
  .site { height: auto; padding: 8px 16px 16px; transition: height 0.3s ease, padding 0.3s ease; }
  .siteCompact { height: 50px; padding: 4px 16px; overflow: hidden; }
  .siteOverlay,
  .siteCompact .siteOverlay,
  .siteCompact .siteOverlay:hover {
    position: static; height: auto; overflow: visible; box-shadow: none;
    --header-scale: 1;
  }
  .siteCompact .siteOverlay { --nav-opacity: 0; --nav-pointer: none; }
  .siteCompact .siteOverlay:hover { --nav-opacity: 0; --nav-pointer: none; }
  .logoWrap { position: static; transform: none; ... }
  .siteCompact .logoWrap img { width: auto; max-height: 36px; max-width: 100%; }
}
```

On narrow viewports the whole absolute-overlay + transform-scale mechanic is **abandoned** in favour of normal flow: `position: static`, `transform: none`, height `auto`, and the logo is shrunk via `max-height` instead of `transform` (so it stays crisp and intrinsically proportioned — scaling can blur, clamping does not). Crucially, the hover-expand is removed (`.siteCompact .siteOverlay:hover` keeps the compact values) because **there is no hover on touch devices** — the user re-expands by scrolling back to the top instead. This is a deliberate "different interaction model on mobile" fork, not just size tweaks. Note the grouped selector listing all three overlay states together to reset them identically.

## Libraries & APIs used

Pure CSS. References:

- CSS Modules (Vite): <https://vitejs.dev/guide/features#css-modules>
- CSS custom properties (inheritance) + `var(name, fallback)`: <https://developer.mozilla.org/docs/Web/CSS/Using_CSS_custom_properties>
- `position: absolute`/`relative`/`static` containing blocks: <https://developer.mozilla.org/docs/Web/CSS/position>
- `transform`/`transform-origin`: <https://developer.mozilla.org/docs/Web/CSS/transform>
- `transition`: <https://developer.mozilla.org/docs/Web/CSS/transition>
- Media queries: <https://developer.mozilla.org/docs/Web/CSS/CSS_media_queries>

## Concepts to learn here

- Separating a **layout-reserved box** (`.site`, its height drives the page) from a **visible overlay** (`.siteOverlay`, free to resize without reflow).
- Why hover detection must be on the element that *grows* (sticky hover), not a fixed-size ancestor.
- Custom properties as a one-to-many coordination channel: parent sets `--header-scale`/`--nav-opacity`/`--nav-pointer`; logo and `GridNav` each consume them — pure CSS, no JS.
- `var(name, fallback)` and inheritance.
- `transform-origin` to keep a scaling element anchored.
- Driving `pointer-events` from a variable to neutralise faded UI.
- A genuine mobile *interaction-model* fork (drop hover-expand on touch), not just resizing.
- JS (in `Header.tsx`) only toggles the `.siteCompact` class; all motion is CSS.

## How to edit it safely

- **Change expanded/compact heights**: `.site { height }` and `.siteCompact { height }` (plus the matching `.siteOverlay` heights so the overlay tracks the box). Because `Header.tsx` *measures* `.site`'s height into `--header-h`, the rest of the page adapts automatically — keep `.site`'s height correct above all.
- **Change how much the logo/nav shrink**: the `--header-scale` value in `.siteCompact .siteOverlay` (0.32). `--nav-opacity`/`--nav-pointer` control the nav's visibility/clickability while compact.
- **Change collapse animation speed**: the `transition: height 0.3s` on `.site`/`.siteOverlay` and `transform 0.3s` on `.logoWrap`.
- **Gotcha — keep `:hover` on `.siteOverlay`, not `.site`.** Moving it to the fixed-size box breaks sticky hover (the header snaps shut as you move into the expanded area).
- **Gotcha — `.site`'s height is the contract.** Anything that changes it (padding, borders) changes `--header-h` and shifts every ConceptView snap section.
- **Gotcha — the variable values live here**; `GridNav.module.css` only *consumes* `--header-scale`/`--nav-opacity`/`--nav-pointer`. Change behaviour here, not there.
- Paired files: **`Header.tsx`** (toggles `styles.siteCompact`, measures `.site`), **`GridNav.module.css`** (reads the three custom properties this file publishes).
