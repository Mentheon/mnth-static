# `src/components/Helix3D/helix3d.css`

## What this file is

The **global stylesheet for the `Helix3D` WebGL experience**. Imported as `import './helix3d.css'` in `Helix3D.tsx`. Like `Helix.css` it is a *global* (non-module) stylesheet because the imperative code creates DOM with literal class names. To prevent it from taking over the whole site (it sets `cursor: none`, theme variables, and a full-viewport fixed layout), **every single rule is nested under `.helix3d-root`** — the class on this component's root `<div>`. This is descendant-selector scoping done by hand.

It pairs with `Helix3D.tsx` (which builds the DOM and toggles `data-theme`).

## Line-by-line / block walkthrough

### Theme tokens via attribute selectors

```css
.helix3d-root,
.helix3d-root[data-theme="light"] {
  --bg: #FFECE1; --ink: #2F0147; --crimson: #A30B37; ...
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
}
.helix3d-root[data-theme="dark"] {
  --bg: #1A0226; --ink: #FFECE1; --crimson: #D63158; ...
}
```

This is **CSS-variable theming via an attribute selector**. `[data-theme="dark"]` matches the element when `Helix3D.tsx` sets `root.setAttribute('data-theme', 'dark')`. All visual rules use `var(--ink)` etc., so flipping that one attribute re-themes the entire experience (and `refreshSceneColours()` re-reads the same vars for the WebGL meshes). Defining variables on the root and consuming them everywhere is the canonical scalable theming pattern. `--ease-out`/`--ease-in-out` store reusable bezier curves as variables — you can put *any* value in a custom property, not just colours.

### Box-sizing reset & the full-viewport takeover

```css
.helix3d-root *, .helix3d-root *::before, .helix3d-root *::after { box-sizing: border-box; }
.helix3d-root {
  position: fixed; inset: 0; z-index: 1;
  background: var(--bg); color: var(--ink);
  overflow: hidden; cursor: none;
  transition: background 0.4s var(--ease-out), color 0.4s var(--ease-out);
}
```

`box-sizing: border-box` (scoped, applied to all descendants) makes `width`/`height` include padding+border — the sane box model; resetting it is standard. `position: fixed; inset: 0;` pins the root to all four viewport edges (`inset: 0` = `top/right/bottom/left: 0`) — a full-screen takeover. `cursor: none` hides the OS cursor so the custom JS cursor can replace it. The `transition` on `background`/`color` makes the light↔dark theme switch fade smoothly using the bezier stored in `--ease-out`.

### Loader

```css
.helix3d-root .loader { position: fixed; inset: 0; z-index: 2000;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  transition: opacity 0.6s var(--ease-out), visibility 0.6s var(--ease-out); }
.helix3d-root .loader.is-hidden { opacity: 0; visibility: hidden; pointer-events: none; }
```

A high `z-index: 2000` keeps the loader above everything until done. The **`is-hidden` class** (toggled by JS) drives the exit: transitioning both `opacity` and `visibility` is a deliberate idiom — `opacity` fades it, and `visibility` (which *can* be transitioned, unlike `display`) flips to `hidden` at the end so the invisible loader is removed from the accessibility tree and hit-testing without a hard pop. `flexbox` centring (`align-items` + `justify-content` on a `flex-direction: column`) stacks and centres the loader contents.

```css
.helix3d-root .loader-corner--tl { top: 16px; left: 16px; border-top: 3px solid var(--crimson); border-left: 3px solid var(--crimson); }
```

The four corner brackets are empty `<span>`s positioned in each corner with only two borders each — a pure-CSS "crop marks" / framing motif reused across the site.

### Custom cursor

```css
.helix3d-root .cursor-dot, .helix3d-root .cursor-ring { position: fixed; top: 0; left: 0; pointer-events: none; z-index: 9999; }
.helix3d-root .cursor-ring { transition: width 0.25s var(--ease-out), height 0.25s var(--ease-out), border-color 0.2s; }
.helix3d-root .cursor-ring.is-active { width: 56px; height: 56px; border-color: var(--crimson); }
@media (max-width: 720px) {
  .helix3d-root { cursor: auto; }
  .helix3d-root .cursor-dot, .helix3d-root .cursor-ring { display: none; }
}
```

A dot and a trailing ring. They are `position: fixed` at `top:0; left:0` and JS moves them with `transform: translate(...)` (transforms are GPU-cheap and do not trigger layout). `pointer-events: none` so they never intercept clicks. The `.is-active` ring grows on hover over interactive elements (class toggled by JS). The **media query** restores the native cursor and hides the custom one on touch/phone widths — a custom cursor makes no sense without a mouse. Lesson: feature-detect-by-media-query for pointer-dependent UI.

### Marquee — pure-CSS infinite scroll

```css
.helix3d-root .marquee-track {
  display: flex; white-space: nowrap;
  animation: helix3dMarquee 40s linear infinite;
}
@keyframes helix3dMarquee { to { transform: translateX(-50%); } }
```

The track contains the phrase block **duplicated** (JS does `block + block`); the keyframe translates the track left by exactly `-50%` (one full copy) `linear infinite`, so when it loops it is visually identical — a seamless scrolling ticker with zero JavaScript. The duplicate-content + translate-by-50% trick is the standard CSS marquee.

### Nav, view-toggle, theme switch

```css
.helix3d-root .nav { position: fixed; ...; pointer-events: none; }
.helix3d-root .nav > * { pointer-events: auto; }
```

The nav bar itself ignores pointer events (so it does not block the canvas behind it) but its **direct children re-enable them** (`> *` is the direct-child combinator) — a neat way to make a transparent bar where only the controls are clickable.

```css
.helix3d-root .theme-switch .icon-sun  { display: none; }
.helix3d-root .theme-switch .icon-moon { display: block; }
.helix3d-root[data-theme="dark"] .theme-switch .icon-sun  { display: block; }
.helix3d-root[data-theme="dark"] .theme-switch .icon-moon { display: none; }
```

Both sun and moon SVG icons exist in the DOM; CSS shows exactly one based on the `data-theme` attribute on the root. Toggling visibility via an ancestor attribute selector — no JS branching needed for the icon swap.

```css
.helix3d-root .theme-switch svg { stroke: currentColor; fill: none; stroke-width: 1.6; }
.helix3d-root .theme-switch:hover { transform: rotate(20deg); color: var(--crimson); }
```

`stroke: currentColor` makes the inline SVG icon inherit the element's `color`, so changing `color` on hover recolours the icon for free — the single most useful inline-SVG styling trick. `transform: rotate(20deg)` on hover is a cheap delightful micro-interaction.

### Stage / WebGL holder / fog

```css
.helix3d-root .helix3d { position: absolute; inset: 0; transition: opacity 0.5s var(--ease-out); }
.helix3d-root .helix3d.is-hidden { opacity: 0; pointer-events: none; }
.helix3d-root .helix3d canvas { display: block; width: 100%; height: 100%; }
.helix3d-root .helix-fog {
  position: absolute; inset: 0; pointer-events: none; z-index: 1;
  background: radial-gradient(ellipse at 50% 50%, rgba(var(--fog-color), 0) 45%, rgba(var(--fog-color), 0.88) 100%);
}
```

`#helix3d` is the WebGL canvas mount point. `canvas { width:100%; height:100% }` makes the three.js canvas fill it (the renderer's pixel buffer is sized separately in JS). `.helix-fog` overlays a **radial gradient** that is transparent in the centre and fades to the background colour at the edges — a cheap CSS vignette that visually "fogs" the rim of the 3D scene so it dissolves into the page. Note `rgba(var(--fog-color), 0.88)` — `--fog-color` holds just the `R, G, B` numbers so it can be slotted into `rgba()` with a variable alpha (a common pattern for "same colour, varying opacity").

### Node labels (billboarded by JS)

```css
.helix3d-root .node-label {
  position: absolute; left: 0; top: 0;
  will-change: transform, opacity;
  transform: translate(-9999px, -9999px);
}
.helix3d-root .node-label-name { background: rgba(var(--fog-color), 0.85); backdrop-filter: blur(2px); }
```

Labels start parked off-screen (`translate(-9999px,-9999px)`) until JS projects the 3D node position and sets a real `transform` each frame. `will-change: transform, opacity` hints the browser to promote these to their own compositor layer for smooth per-frame updates — use sparingly, only on things that genuinely animate. `backdrop-filter: blur(2px)` frosts whatever is behind the label so text stays legible over the busy 3D scene.

### List view, transitions, menu

```css
.helix3d-root .list-item {
  display: grid; grid-template-columns: 80px 80px 1fr auto;
  opacity: 0; transform: translateY(20px);
  animation: helix3dListFadeIn 0.6s var(--ease-out) forwards;
}
.helix3d-root .list-item:nth-child(1) { animation-delay: 0.05s; }
@keyframes helix3dListFadeIn { to { opacity: 1; transform: translateY(0); } }
.helix3d-root .listview:not(.is-visible) .list-item { animation: none; opacity: 0; }
```

`display: grid` with `grid-template-columns: 80px 80px 1fr auto` lays each row as four columns: two fixed (number, disc), one flexible (`1fr` takes remaining space), one content-sized (`auto`). The list items fade/rise in with a **CSS-only staggered entrance**: each `:nth-child` gets a larger `animation-delay`; `animation-fill-mode: forwards` (the `forwards` keyword) holds the end state. The `:not(.is-visible)` rule resets them so re-opening the list replays the entrance.

```css
.helix3d-root .transition-overlay { position: fixed; inset: 0; z-index: 500; transform: translateY(100%); }
.helix3d-root .transition-overlay.is-sweeping { animation: helix3dSweep 1.1s var(--ease-in-out) forwards; }
@keyframes helix3dSweep {
  0%, 100% { transform: translateY(100%); }
  45%, 55% { transform: translateY(0); }
  100%     { transform: translateY(-100%); }
}
```

A page-transition wipe: a full-screen panel slides up from below to cover the screen, holds (45%–55% at `translateY(0)`), then continues up off the top. Multi-stop `@keyframes` with grouped selectors (`0%, 100%`, `45%, 55%`) expresses "rise, hold, exit" in one animation. JS triggers it by toggling `.is-sweeping` (and forces a reflow to restart the animation — see `Helix3D.tsx`'s `triggerPageTransition`).

The `.menu-close-x::before/::after` rotated to `45deg`/`-45deg` is the classic pure-CSS "X" close icon built from two pseudo-element bars.

### Responsive

```css
@media (max-width: 720px) {
  .helix3d-root .stage-readout { display: none; }
  .helix3d-root .list-item { grid-template-columns: 50px 56px 1fr auto; gap: 1rem; }
  ...
}
```

Phone-class adjustments: hide non-essential chrome, tighten the grid columns and font sizes. Plus the earlier `@media (max-width: 720px)` that disables the custom cursor.

## Libraries & APIs used

Pure CSS. References:

- CSS custom properties & attribute-selector theming: <https://developer.mozilla.org/docs/Web/CSS/Using_CSS_custom_properties>, <https://developer.mozilla.org/docs/Web/CSS/Attribute_selectors>
- `transition` (incl. `visibility`): <https://developer.mozilla.org/docs/Web/CSS/transition>
- `@keyframes` / `animation` / `animation-fill-mode`: <https://developer.mozilla.org/docs/Web/CSS/@keyframes>
- Flexbox: <https://developer.mozilla.org/docs/Web/CSS/CSS_flexible_box_layout>
- Grid: <https://developer.mozilla.org/docs/Web/CSS/CSS_grid_layout>
- `radial-gradient`: <https://developer.mozilla.org/docs/Web/CSS/gradient/radial-gradient>
- `backdrop-filter`: <https://developer.mozilla.org/docs/Web/CSS/backdrop-filter>
- `will-change`: <https://developer.mozilla.org/docs/Web/CSS/will-change>
- Media queries: <https://developer.mozilla.org/docs/Web/CSS/CSS_media_queries>

## Concepts to learn here

- Hand-scoping a global stylesheet under one root class to isolate a takeover UI.
- CSS-variable theming switched by a `[data-theme]` attribute selector; the same vars feed JS (`getComputedStyle`).
- Variables can hold easing curves and partial colour triplets (`R, G, B` for `rgba(var(--x), a)`).
- `box-sizing: border-box` reset; `position: fixed; inset: 0` full-screen layout.
- Transitioning `opacity` + `visibility` together for a clean fade-out (vs un-transitionable `display`).
- Pure-CSS infinite marquee (duplicate content + translate −50%).
- `pointer-events: none` on a bar + `pointer-events: auto` on `> *` children.
- `stroke: currentColor` so inline SVG icons inherit `color`.
- Showing one of two icons via an ancestor attribute selector.
- CSS-only staggered list entrance with `:nth-child` + `animation-delay` + `forwards`.
- Multi-stop keyframes with grouped selectors for "enter / hold / exit" sweeps.
- `backdrop-filter` for legibility over busy backgrounds; `will-change` for per-frame-animated elements.
- Pure-CSS X icon and corner-bracket motifs from pseudo-elements/empty spans.

## How to edit it safely

- **Re-theme**: edit the colour variables in the `.helix3d-root[data-theme="..."]` blocks. Both CSS and the 3D scene read them, so they stay in sync automatically (the scene refreshes on theme toggle).
- **Add a theme**: add a new `.helix3d-root[data-theme="x"]` block and have `Helix3D.tsx`'s toggle cycle to that value.
- **Adjust transition feel**: change the `--ease-out`/`--ease-in-out` variables once; every transition using them updates.
- **Gotcha — keep every rule prefixed with `.helix3d-root`.** An unscoped rule (especially `cursor: none`, `* { box-sizing }`, or the `position: fixed` root) would leak into the whole site.
- **Gotcha — class names are a contract with `Helix3D.tsx`** (`is-hidden`, `is-active`, `is-open`, `is-sweeping`, `is-visible`, `node-label`, etc., are toggled by string in JS). Renaming requires editing both files.
- **Gotcha — the WebGL canvas size**: `canvas { width:100%; height:100% }` only stretches the canvas element; the actual render resolution is set by `renderer.setSize(...)` in JS via the container's client size. Sizing must be consistent or the scene blurs/stretches.
- **Gotcha — `will-change` is not free.** Only keep it on the genuinely per-frame-animated `.node-label`; sprinkling it everywhere wastes memory.
- Paired file: **`Helix3D.tsx`** — builds this DOM, toggles `data-theme`, and animates these classes; see that doc.
