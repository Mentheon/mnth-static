# `src/components/ConceptView.css`

## What this file is

The **global stylesheet** for `ConceptView` (imported `import './ConceptView.css'`). It owns: the CSS **scroll-snap** carousel mechanics, the per-section layout, the styling for section A's headline + live ECG `<path>`, section B's roadmap SVG (line, ticks, chevrons, nodes, the travelling blob, brace), section C's grid layout, section D, and the side pill-nav — including a substantial phone-class fork. It is global (not a module) because `ConceptView.tsx` and the imperative animation code reference these class names by literal string. The single most important thing to learn here is **CSS scroll snapping**.

Pairs with `ConceptView.tsx`.

## Line-by-line / block walkthrough

### The scroll container — CSS scroll snap

```css
.concept-scroller {
  height: calc(100dvh - var(--header-h, 170px));
  overflow-y: auto;
  overscroll-behavior: contain;
  scroll-snap-type: y mandatory;
  scroll-behavior: auto;
}
@media (max-height: 560px) { .concept-scroller { scroll-snap-type: y proximity; } }
```

- `height: calc(100dvh - var(--header-h, 170px))` — exactly the viewport minus the header. `--header-h` is published by `Header.tsx` (its `ResizeObserver`); `var(--header-h, 170px)` supplies a 170px fallback for the first frame. `100dvh` (dynamic viewport height) instead of `vh` so iOS Safari's collapsing address bar does not mis-size it. This is the consumer end of the CSS-variable side-channel `Header.tsx` sets up.
- `overflow-y: auto` makes this the scroll container; `overscroll-behavior: contain` stops scroll chaining to the page behind.
- **`scroll-snap-type: y mandatory`** — the core mechanic. The browser *snaps* the scroll position to a snap point on the Y axis after every gesture. `mandatory` = always land on a snap point (no resting in-between); `proximity` = only snap if close. The `@media (max-height: 560px)` **safety hatch** drops to `proximity` on very short viewports where a section can exceed the budget and `mandatory` would lock the overflow out of reach. Knowing when to relax `mandatory`→`proximity` is a real-world scroll-snap lesson.
- `scroll-behavior: auto` (was `smooth`) — snaps land instantly rather than easing, deliberately for a more "gravitational" feel.

### Snap targets — the sections

```css
.concept-section {
  min-height: calc(100dvh - var(--header-h, 170px));
  scroll-snap-align: start;
  scroll-snap-stop: always;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
}
```

- `min-height: calc(100dvh - var(--header-h))` — each section is at least one snap-viewport tall (matching the scroller height), so one section fills the screen.
- **`scroll-snap-align: start`** — declares the section's *start* (top) edge as the snap point. The comment explains a subtle bug: `center` snapping leaves gaps between non-equal-height sections where the browser can rest "stuck" mid-scroll; `start` makes snap points *contiguous* (section N's start = section N−1's end) so momentum always commits to one stop. The *visual* centring users perceive comes from the flexbox (`align-items`/`justify-content: center`), not from snap alignment. **Lesson: prefer `scroll-snap-align: start` for contiguous full-page sections; centre content with flexbox, not with snap.**
- `scroll-snap-stop: always` — forces every section to be a hard stop (you cannot fling past one in a single gesture).

### Section A — headline + ECG

```css
.concept-a--mashup { padding: 0; display: block; }
.concept-a-headline { font-size: clamp(2.4rem, 6vw, 5.5rem); display: flex; flex-direction: column; gap: 0.4em; }
.concept-a-word { display: inline-block; opacity: 0; transform: translateY(28px); }
.concept-a-fast { font-weight: 900; color: var(--crimson); min-width: 2.5em; text-align: center; }
```

`clamp(MIN, vw-based, MAX)` is fluid responsive type (see `Helix.css` doc). `.concept-a-word` starts `opacity: 0; translateY(28px)` — pre-staged for anime.js to animate in (`utils.set` in `playSectionA` sets the same; CSS provides the default so there is no flash before JS runs). `.concept-a-fast { min-width: 2.5em }` reserves width so the scrambling letters do not make the line flutter as glyph widths change — the same "reserve space for dynamic content" principle as `HeroIconsWithContent`'s caption.

```css
.concept-a-ecg { opacity: 0; transition: opacity 600ms ease-out; }
.concept-a-ecg.is-visible { opacity: 1; }
.concept-a-ecg-trace { fill: none; stroke: var(--crimson); stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
```

The ECG strip fades in via an `.is-visible` class toggled by JS (`setTimeout` in `startEcg`). The `<path>` JS rebuilds each frame is styled here once: `fill: none` + a round-capped `stroke` — the visual; the *shape* (the `d` attribute) is driven entirely by the rAF loop. Set the look in CSS, animate the geometry in JS.

### Section B — the roadmap SVG

```css
.roadmap { max-width: min(1100px, calc(52dvh * 1.818)); }
.roadmap-svg { width: 100%; height: auto; display: block; overflow: visible; }
.roadmap-line { fill: none; stroke: var(--ink); stroke-width: 2.5; opacity: 0.55; stroke-linecap: round; }
.roadmap-tick { stroke: var(--ink); opacity: 0; }
.roadmap-chevron { fill: none; stroke: var(--ink); opacity: 0; }
.timeline-pulse-dot { fill: var(--crimson); opacity: 0; }
```

`max-width: min(1100px, calc(52dvh * 1.818))` — caps the roadmap by the *smaller* of a fixed max and a height-derived width (so the fixed-aspect SVG cannot overflow the section vertically on short laptops). `min()` for "never exceed either constraint" is the dual of `clamp()`. The ticks/chevrons/blob start `opacity: 0` because `playSectionB` fades them in — again, CSS provides the resting/pre-animation state.

```css
.roadmap-node { cursor: pointer; opacity: 0; transform: scale(0.6); transform-box: fill-box; transform-origin: center; }
.roadmap-node-circle { fill: var(--grape); filter: drop-shadow(0 2px 6px rgba(0,0,0,0.2)); transition: fill 0.2s ease, transform 0.15s ease-out; transform-box: fill-box; transform-origin: center; }
.roadmap-node:hover .roadmap-node-circle { transform: scale(1.12); }
.roadmap-node--satellite .roadmap-node-circle { fill: var(--bg); stroke: var(--ink); stroke-dasharray: 5 5; }
```

SVG nodes: `transform-box: fill-box` + `transform-origin: center` is the **mandatory SVG-transform pairing** so `scale()` grows the circle in place (same gotcha as `Helix.css`). `filter: drop-shadow(...)` works on SVG (unlike `box-shadow`). `:hover` scales the circle (CSS transition smooths it); the `--satellite` modifier gets a dashed outline (`stroke-dasharray: 5 5` = 5px dash, 5px gap) to read as "different". The base `transition` means the anime.js-driven `arriveAt`/`departFrom` colour/scale changes also animate smoothly.

```css
.roadmap-node-emoji { font-size: 60px; text-anchor: middle; dominant-baseline: central; font-family: 'Apple Color Emoji',...; }
.roadmap-node-label { font-family: 'Lato'; font-weight: 700; font-size: 18px; fill: var(--ink); text-anchor: middle; opacity: 0; }
```

Emoji inside an SVG `<text>`: `text-anchor: middle` (horizontal centre on its `x`) + `dominant-baseline: central` (vertical centre on its `y`) is how you centre SVG text on a point — different properties than HTML centring. The emoji font stack mirrors `IconCircle.module.css` for consistent colour-emoji rendering. Labels start `opacity: 0` for the entrance.

### Section C / D layout

```css
.concept-c-host {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-areas: "strands" "helix" "panel";
  gap: 1.5rem;
  align-items: start; justify-items: center;
}
.concept-c-strands-area { grid-area: strands; }
.concept-c-helix-area  { grid-area: helix; }
```

**Named grid areas**: `grid-template-areas` lays the host as three stacked named rows; each child claims one via `grid-area: strands|helix|panel`. Named areas make the layout self-documenting and easy to rearrange. When no strand is open the `panel` row simply has no content and collapses.

```css
.concept-c-seemore {
  position: fixed;
  bottom: clamp(1rem, 3dvh, 1.75rem);
  left: 50%;
  transform: translate(-50%, 0);
  z-index: 60;
  opacity: 0; pointer-events: none;
  transition: ..., opacity 0.3s ease;
}
.concept-c-seemore--visible { opacity: 1; pointer-events: auto; }
.concept-c-seemore:hover { transform: translate(-50%, -2px); }
```

The "see more" pill is `position: fixed` (pinned to the viewport bottom, *outside* the grid) so a cramped section can never crop it. `left: 50%; transform: translate(-50%, 0)` centres it (the standard centring trick on the X axis); note the hover keeps `translate(-50%, …)` so the X-centring is preserved while nudging Y. It is hidden (`opacity: 0; pointer-events: none`) until JS adds `--visible`, fading in via the transition. `pointer-events: none` while invisible stops the hidden pill capturing clicks.

```css
.concept-c-seemore-arrow { animation: concept-c-seemore-bob 1.6s ease-in-out infinite; }
@keyframes concept-c-seemore-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(3px); } }
@media (prefers-reduced-motion: reduce) { .concept-c-seemore-arrow { animation: none; } }
```

A gentle infinite bob via `@keyframes`. The **`@media (prefers-reduced-motion: reduce)`** query disables it for users who have requested less motion in their OS settings — an accessibility best practice you should apply to any decorative looping animation.

### Pill nav + mobile fork

```css
.concept-pillnav { position: fixed; left: 1.25rem; top: 50%; transform: translateY(-50%); }
.concept-pill-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--ink); opacity: 0.35; transition: ...; }
.concept-pill--active .concept-pill-dot { background: var(--crimson); opacity: 1; transform: scale(1.4); }
```

A fixed, vertically-centred (`top: 50%` + `translateY(-50%)`) dot stack. Base dot dim; the `--active` modifier (toggled from `currentSection` in JSX) recolours and scales it, animated by the base `transition`.

```css
@media (max-width: 720px) {
  .concept-pill { width: 4px; height: 28px; }
  .concept-pill-dot { width: 4px; height: 100%; border-radius: 0 2px 2px 0; }
  .concept-section { padding: 1rem; }
  .roadmap { max-width: 100%; }
  .concept-c-seemore { bottom: max(clamp(1rem,3dvh,1.75rem), calc(env(safe-area-inset-bottom) + 0.75rem)); }
}
```

The phone fork: the round dots become slim vertical bars (a progress-track metaphor better for thumbs), padding tightens, the roadmap drops its height-cap and scales to width. `env(safe-area-inset-bottom)` is the **iOS/Android safe-area** value (notch/home-indicator inset); `max(..., calc(env(...) + …))` keeps the see-more button clear of the home indicator. Respecting `env(safe-area-inset-*)` is essential for full-bleed mobile layouts. Note also `scroll-snap-type` stays `mandatory` on mobile here (the comment explains the content was compacted to fit) — relaxing snap is decided per-design.

## Libraries & APIs used

Pure CSS. References:

- CSS Scroll Snap (`scroll-snap-type`, `scroll-snap-align`, `scroll-snap-stop`): <https://developer.mozilla.org/docs/Web/CSS/CSS_scroll_snap>
- `clamp()`/`min()`/`max()`, `dvh`: <https://developer.mozilla.org/docs/Web/CSS/clamp>
- CSS custom properties (`var(--header-h)`): <https://developer.mozilla.org/docs/Web/CSS/var>
- CSS Grid named areas: <https://developer.mozilla.org/docs/Web/CSS/grid-template-areas>
- SVG presentation attrs / `text-anchor` / `dominant-baseline` / `filter`: <https://developer.mozilla.org/docs/Web/SVG/Attribute>
- `@keyframes`/`animation`, `prefers-reduced-motion`: <https://developer.mozilla.org/docs/Web/CSS/@media/prefers-reduced-motion>
- `env()` safe-area insets: <https://developer.mozilla.org/docs/Web/CSS/env>

## Concepts to learn here

- CSS scroll snap: `scroll-snap-type: y mandatory` on the container, `scroll-snap-align: start` + `scroll-snap-stop: always` on sections; why `start` (contiguous points) beats `center` for unequal-height pages; relaxing to `proximity` as a short-viewport safety hatch.
- Consuming a JS-published CSS variable (`--header-h`) with a fallback; `dvh` for mobile-stable sizing.
- Pre-staging animation start states in CSS (`opacity: 0`) so there is no flash before JS animates.
- Reserving width/height for dynamic content (`min-width` on the scrambling word, ECG strip height).
- `min()`/`clamp()` to cap a fixed-aspect element by both width and viewport height.
- SVG transforms need `transform-box: fill-box`; centring SVG text with `text-anchor`/`dominant-baseline`; `filter: drop-shadow` (not `box-shadow`) on SVG.
- Named CSS Grid template areas.
- `position: fixed` UI pinned outside the layout; `pointer-events: none` when hidden; the `left:50%`+`translate(-50%)` centring preserved across hover transforms.
- `@media (prefers-reduced-motion: reduce)` to disable decorative animation (accessibility).
- `env(safe-area-inset-*)` for notch/home-indicator-safe mobile layout.

## How to edit it safely

- **Change snap behaviour**: `.concept-scroller { scroll-snap-type }` and `.concept-section { scroll-snap-align/stop }`. Keep `scroll-snap-align: start` for these full-page contiguous sections; switching to `center` reintroduces the "stuck between sections" bug noted in the comments.
- **Change section sizing**: the `calc(100dvh - var(--header-h, 170px))` must match on `.concept-scroller` (height) and `.concept-section` (min-height) or snap points drift.
- **Tune the roadmap fit**: `.roadmap { max-width: min(...) }` — the `52dvh * 1.818` factor encodes the SVG's 800×440 aspect; change both together if you change the viewBox in `ConceptView.tsx`.
- **Restyle nodes/labels**: remember SVG needs `transform-box: fill-box` for in-place scaling and `text-anchor`/`dominant-baseline` for text centring.
- **Gotcha — class names are a contract** with `ConceptView.tsx` and its anime.js code (`roadmap-line`, `roadmap-node-circle`, `concept-a-ecg-trace`, `is-visible`, `concept-pill--active`, etc. are queried/toggled by literal string). Renaming requires editing the TSX too.
- **Gotcha — keep `prefers-reduced-motion` overrides** when adding looping decorative animations.
- **Gotcha — keep the global scoping discipline**: this is a non-module global stylesheet; its class names are deliberately not hashed so JS can target them, but that means a too-generic name could collide site-wide.
- Paired file: **`ConceptView.tsx`** (renders these classes, toggles `is-visible`/`--active`/`--visible`, and animates the SVG elements styled here); consumes `--header-h` published by **`Header.tsx`**.
