# `src/components/StrandDetail/Progress/ProgressBranchTooltip.module.css`

## What this file is

The **CSS Module** paired with
[`ProgressBranchTooltip.tsx`](./ProgressBranchTooltip.tsx.md). It styles the
floating dark tooltip box, defines its fade-in transition, and — importantly —
applies the `transform` offset that turns the JS-computed anchor point into the
tooltip *floating above and centred on* that point.

Division of labour: the TSX computes the *dynamic* `left/top` (inline style);
this file owns everything *static* (look, offset, transition).

## Line-by-line / block walkthrough

```css
.tip {
  position: absolute;
  background: #2F0147;
  color: #FFECE1;
  padding: 0.7rem 0.9rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.68rem;
  line-height: 1.4;
  pointer-events: none;
  opacity: 0;
  transform: translate(-50%, -100%) translateY(-8px);
  transition: opacity 0.18s ease;
  max-width: 240px;
  letter-spacing: 0.03em;
  z-index: 5;
}
```

- `position: absolute` — positioned within the timeline container (the TSX sets
  `left`/`top` relative to it).
- `pointer-events: none` — the tooltip never intercepts mouse events. Critical:
  without this, the tooltip could appear under the cursor, the cursor would now
  be "over the tooltip not the branch," the branch's `mouseleave` would fire,
  the tooltip would hide, re-show, hide… a flicker loop. Making it
  click/hover-transparent prevents that entirely.
- `opacity: 0` + `transition: opacity 0.18s ease` — hidden by default, fades in
  when `.visible` is added. A state-derived class driving an opacity transition
  — the same pattern as the beacon chevron and the timeline panel.
- **`transform: translate(-50%, -100%) translateY(-8px)`** — the key line. The
  TSX positioned the box's *top-left corner* at the anchor's horizontal centre
  and top edge. `translate(-50%, -100%)` then shifts the box left by half its
  own width (so it is *centred* on that x) and up by its full own height (so it
  sits *above* the anchor). The extra `translateY(-8px)` adds a small gap. Using
  percentage translices that resolve against the element's *own* size is the
  classic "center/position an element on a point without knowing its size in
  advance" trick — and it pairs cleanly with the simple coordinate the JS had
  to compute.
- `z-index: 5` — stack above the SVG. `max-width: 240px` keeps long descriptions
  readable. The dark plum bg / cream text invert the page palette so the tooltip
  reads as an overlay.

```css
.tip.visible { opacity: 1; }
```

When the TSX adds the `.visible` class (hover active + position computed),
opacity goes to 1; the `transition` on `.tip` animates the 0→1 fade.

```css
.title {
  display: block;
  font-family: 'Lato', sans-serif;
  font-size: 0.9rem;
  letter-spacing: 0;
  margin-bottom: 0.25rem;
  font-weight: 700;
}
```

The bold output title (`<strong class={styles.title}>`). `display: block` puts
it on its own line above the description (a `<strong>` is inline by default —
same stacking trick as [`MetaItem`](../MetaRow/MetaItem.module.css.md)). It
overrides the box's mono font with the display font and resets letter-spacing
for a clean heading.

```css
.meta {
  color: rgba(255, 236, 225, 0.55);
  text-transform: uppercase;
  font-size: 0.6rem;
  letter-spacing: 0.14em;
  margin-bottom: 0.4rem;
}
```

The small uppercase meta line at the top — the folder's "label" idiom again, but
inverted for the dark background (cream at 55% alpha instead of plum at 55%).

## Libraries & APIs used

- Plain CSS as a **CSS Module**: absolute positioning, **`transform: translate`
  with percentages** for size-agnostic placement, `opacity` transition,
  `pointer-events: none`, `z-index`, `max-width`.

## Concepts to learn here

- **`transform: translate(-50%, -100%)` to position an element on a point**
  without knowing its dimensions — the perfect complement to the simple anchor
  coordinate computed in
  [`ProgressBranchTooltip.tsx`](./ProgressBranchTooltip.tsx.md).
- **`pointer-events: none` to prevent hover-flicker loops** on overlays — a
  subtle but important real-world bug fix.
- **Static styling in CSS, dynamic coordinates in inline style** — a clean
  split of responsibilities.
- The inverted "label" colour idiom for dark-on-light overlays.

## How to edit it safely

- The `translate(-50%, -100%)` is what makes the JS math in the TSX correct (the
  TSX deliberately computes only the anchor centre/top). If you change this
  transform, the tooltip will mis-align — change *placement* by tweaking the
  extra `translateY(-8px)` (the gap), not the `-50% / -100%`.
- Keep `pointer-events: none` or you risk reintroducing the show/hide flicker.
- Keep `.tip` always rendered with `opacity: 0` and only toggle `.visible` (the
  TSX keeps the div mounted for exactly this) so the fade transition works.
- Cross-refs: [`ProgressBranchTooltip.tsx`](./ProgressBranchTooltip.tsx.md)
  (computes `left/top`, toggles `.visible`); positioning depends on the
  container ref owned by
  [`ProgressTimeline.tsx`](./ProgressTimeline.tsx.md).
