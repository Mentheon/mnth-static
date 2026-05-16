# `src/components/StrandPanel.module.css`

## What this file is

The **CSS Module** that styles and *animates* the detail panel. It is shared by **both `StrandPanel.tsx` and `PersonPanel.tsx`** (they render identical structure). The headline lesson here is the **collapse/expand animation done in pure CSS** via a `.panel` → `.panel.open` class toggle, plus CSS-only staggered card entrances.

## Line-by-line / block walkthrough

```css
.panel {
  width: 100%;
  max-width: 1100px;
  margin: 2rem auto 0;
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-height 0.5s ease, opacity 0.4s ease 0.1s, margin-top 0.4s ease;
  pointer-events: none;
}
.panel.open {
  max-height: 1500px;
  opacity: 1;
  pointer-events: auto;
}
```

This is the core technique. The closed state is `max-height: 0; opacity: 0; overflow: hidden` — the panel collapses to nothing and its overflow is clipped so the content does not spill. Adding `.open` (React toggles it from `isOpen`) sets `max-height: 1500px; opacity: 1`. The **`transition`** on `.panel` animates `max-height`, `opacity`, and `margin-top`, so the class toggle produces a smooth slide-open/closed.

Key points:

- **You cannot transition `height: auto`**, so the `max-height` trick is used: animate from `0` to a value *guaranteed larger than the content* (`1500px`). The downside (and the reason `helixScene.ts` does the more complex measure-then-animate dance instead) is the timing is slightly off — the transition traverses the full 0→1500px range at constant speed even if real content is only 600px, so close can feel like it "waits" before moving. Here that trade-off is accepted for simplicity. **Understand both approaches: `max-height` hack (simple, slightly imperfect timing) vs measure-`scrollHeight` (perfect, more code).**
- `opacity 0.4s ease 0.1s` — the third value (`0.1s`) is a **transition-delay**: opacity starts fading 100ms after the collapse begins, so the panel starts sliding before it starts appearing/disappearing (a nicer layered feel).
- `pointer-events: none` when closed so the collapsed (but technically present) panel cannot capture clicks; `auto` when open.

```css
.panelInner {
  position: relative;
  background-color: #FFECE1;
  border: 2px solid #2F0147;
  border-radius: 2px;
  padding: 3rem 3rem 2.5rem;
}
.cornerCrop {
  position: absolute;
  top: -12px; left: -12px;
  width: 24px; height: 24px;
  border-top: 3px solid #A30B37;
  border-left: 3px solid #A30B37;
}
```

`.panelInner` is the visible card; `position: relative` makes it the containing block for the absolutely-positioned `.cornerCrop` (the L-bracket motif, positioned just *outside* the top-left corner with negative offsets and only two borders — the same decoration used in the header/nav/loader).

```css
.closeButton { position: absolute; top: 12px; right: 16px; background: transparent; border: none; transition: color 0.2s, transform 0.2s; }
.closeButton:hover { color: #A30B37; transform: scale(1.1); }
```

The close `×`, absolutely positioned in the corner, with a button reset (`background: transparent; border: none`) and a hover that recolours + grows it slightly (animated by its `transition`).

```css
.headerIconCircle {
  flex-shrink: 0;
  width: 125px; height: 125px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(47, 1, 71, 0.25);
  animation: iconPulse 0.6s ease-out;
}
@keyframes iconPulse {
  0%   { transform: scale(0.85); opacity: 0; }
  60%  { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); }
}
```

A fixed 125px circular frame (`border-radius: 50%; overflow: hidden` clips the `StrandIcon`/`PersonIcon` SVG to a circle). `flex-shrink: 0` stops it shrinking when the header flex row is tight. **`animation: iconPulse 0.6s ease-out`** plays a one-shot entrance whenever the element appears: it scales up from 0.85 (invisible) past 1.05 (slight overshoot) to 1 — a subtle "pop" that draws attention to the icon. This is a pure-CSS attention animation; no JS.

```css
.panelHeader { display: flex; align-items: center; gap: 2rem; border-bottom: 1px solid rgba(47,1,71,0.15); padding-bottom: 2rem; }
.headerText { flex: 1; min-width: 0; }
```

Flex header: icon + text side by side. `.headerText { flex: 1; min-width: 0 }` — `flex: 1` takes the remaining width; **`min-width: 0`** is the flex gotcha again (lets the text column shrink below content size so long taglines wrap/truncate instead of overflowing).

```css
.themeGrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; }
.themeCard { animation: cardRise 0.5s ease-out backwards; }
.themeCard:nth-child(1) { animation-delay: 0.15s; }
.themeCard:nth-child(2) { animation-delay: 0.25s; }
...
@keyframes cardRise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
.themeCard:hover { background-color: rgba(163, 11, 55, 0.06); border-left-color: #A30B37; transform: translateX(2px); }
```

- **Responsive grid**: `grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))` = as many columns as fit, each at least 220px and sharing leftover space equally. Drops from multi-column (wide panel) to one column (narrow) with *no media query* — the canonical responsive-grid one-liner.
- **CSS-only staggered entrance**: every card runs `cardRise` (fade + rise from 12px), and each `:nth-child` gets a progressively larger `animation-delay`, so they cascade in. `animation-fill-mode: backwards` (the `backwards` keyword) applies the `from` state *during the delay*, so a card stays invisible until its turn instead of flashing visible then animating. This recreates a staggered reveal with zero JS — compare with anime.js `stagger()` elsewhere; CSS suffices when the stagger is fixed.
- `:hover` recolours the card and nudges it 2px (animated by `.themeCard`'s own `transition` declared earlier in the source).

```css
.ctaLink { display: inline-flex; align-items: center; gap: 0.6rem; background-color: #A30B37; transition: background-color 0.2s, gap 0.2s; }
.ctaLink:hover { background-color: #2F0147; gap: 1rem; }
.ctaArrow { transition: transform 0.2s; }
.ctaLink:hover .ctaArrow { transform: translateX(3px); }
```

The CTA button. **Animating `gap` on hover** (0.6rem → 1rem) plus translating the arrow makes the arrow "slide out" from the text on hover — a polished micro-interaction built from two cheap transitions. `.ctaLink:hover .ctaArrow` is a descendant-on-hover selector.

```css
@media (max-width: 640px) {
  .panelHeader { flex-direction: column; text-align: center; gap: 1rem; }
  .themeGrid { grid-template-columns: 1fr; gap: 1rem; }
  .ctaLink { justify-content: center; width: 100%; }
}
```

Phone fork: the header stacks vertically and centres, the theme grid forces a single column, and the CTA goes full-width — typical mobile layout adjustments.

## Libraries & APIs used

Pure CSS. References:

- CSS Modules (Vite): <https://vitejs.dev/guide/features#css-modules>
- `transition` (incl. delay, multi-property): <https://developer.mozilla.org/docs/Web/CSS/transition>
- `max-height` collapse technique: <https://css-tricks.com/using-css-transitions-auto-dimensions/>
- `@keyframes` / `animation` / `animation-fill-mode: backwards`: <https://developer.mozilla.org/docs/Web/CSS/animation-fill-mode>
- Responsive grid `repeat(auto-fit, minmax())`: <https://developer.mozilla.org/docs/Web/CSS/CSS_grid_layout>
- Flexbox + `min-width:0`: <https://developer.mozilla.org/docs/Web/CSS/flex>
- Media queries: <https://developer.mozilla.org/docs/Web/CSS/CSS_media_queries>

## Concepts to learn here

- Pure-CSS collapse/expand: `max-height: 0` → large value + `transition`, toggled by a class; its limitation vs the measure-`scrollHeight` approach.
- `transition-delay` (third value) to stagger which property starts when.
- `pointer-events: none` on a collapsed-but-present element.
- One-shot CSS attention animation (`iconPulse`) on appearance.
- The `min-width: 0` flex gotcha for shrinkable text columns.
- Responsive grid with `repeat(auto-fit, minmax())` (no media query needed for the column count).
- CSS-only staggered entrance with `:nth-child` + `animation-delay` + `backwards` fill mode.
- Micro-interaction by transitioning `gap` + a child `transform` on hover.
- A CSS Module deliberately shared by two twin components.

## How to edit it safely

- **Change open/close speed/feel**: `.panel`'s `transition` (and the `opacity ... 0.1s` delay). To fix the "waits before closing" feel you would need the measure-based JS approach (see `helixScene.ts`'s `showPanel`); the simple `max-height` trick trades that for less code.
- **Raise the height ceiling**: `.panel.open { max-height: 1500px }` — increase if a strand/person with many themes is being clipped.
- **Tune the card stagger**: the `:nth-child(n) { animation-delay }` values and the `cardRise` keyframes.
- **Gotcha — keep `overflow: hidden` on `.panel`**; without it the collapsed-but-tall content spills while `max-height` is 0.
- **Gotcha — this module is shared with `PersonPanel.tsx`.** Any change affects both the strand panel and the person panel; check both.
- **Gotcha — class renames** must be mirrored in *both* `StrandPanel.tsx` and `PersonPanel.tsx` (`styles.panel`, `styles.open`, `styles.themeCard`, …).
- Paired/related: **`StrandPanel.tsx`** & **`PersonPanel.tsx`** (toggle `styles.open` from `isOpen`), **`StrandIcon.tsx`**/**`PersonIcon.tsx`** (clipped inside `.headerIconCircle`). Note `Helix.css` defines a *visually identical but separately-scoped* `.panel`/`.themeCard` set for the helix's internal (hidden) panel — they are intentional twins, not the same rules.
