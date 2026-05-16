# `src/components/StrandDetail/Sections/ObjectiveCard.module.css`

## What this file is

The **CSS Module** paired with [`ObjectiveCard.tsx`](./ObjectiveCard.tsx.md). It
draws the card box, the corner number badge **read from a `data-` attribute**, a
small decorative L-bracket accent, the verb/text typography, and a hover lift.
It is a rich little file teaching `attr()`, two pseudo-elements on one element,
and a `transform` hover.

## Line-by-line / block walkthrough

```css
.card {
  position: relative;
  padding: 1.5rem 1.4rem 1.4rem 1.4rem;
  background: #FFECE1;
  border: 1px solid rgba(47, 1, 71, 0.15);
  transition: border-color 0.2s, transform 0.2s;
}
```

`position: relative` anchors the two absolutely-positioned pseudo-elements
(below). The translucent-plum hairline border is the folder's standard card
edge. `transition: border-color 0.2s, transform 0.2s` pre-declares the two
properties that animate on hover.

```css
.card::before {
  content: attr(data-num);
  position: absolute;
  top: 0.85rem;
  right: 1rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  font-weight: 700;
  color: rgba(47, 1, 71, 0.55);
  letter-spacing: 0.08em;
}
```

The **number badge**. The key is **`content: attr(data-num)`** — a CSS
pseudo-element's `content` can pull the value of any attribute via `attr()`.
The TSX put the zero-padded number on the element as `data-num="01"`; this
displays it in the top-right corner without it ever being a DOM text node. This
is the receiving end of the JS→CSS data channel described in
[`ObjectiveCard.tsx`](./ObjectiveCard.tsx.md). It uses the folder's faint
mono-label idiom.

```css
.card::after {
  content: '';
  position: absolute;
  top: -1px;
  left: -1px;
  width: 12px;
  height: 12px;
  border-top: 2px solid #9C528B;
  border-left: 2px solid #9C528B;
  transition: border-color 0.2s;
}
```

A second pseudo-element (`::after`) — one element can have **both `::before` and
`::after`**. Here it draws a 12px **L-shaped corner bracket** at the card's
top-left using only `border-top` + `border-left` (the same partial-border
technique as the page frame's corner crops in
[`StrandDetail.module.css`](../StrandDetail.module.css.md)). The `-1px` offsets
sit it exactly over the card's own border. It has its own `border-color`
transition for the hover below.

```css
.card:hover {
  border-color: #A30B37;
  transform: translateY(-2px);
}

.card:hover::after {
  border-color: #A30B37;
}
```

On hover: the card border turns crimson, the whole card **lifts 2px**
(`transform: translateY(-2px)` — GPU-friendly, no layout reflow), and the corner
bracket also shifts to crimson. A coordinated multi-element hover state built
from the transitions declared above — the plum→crimson shift is the recurring
folder interaction motif.

```css
.verb {
  font-family: 'Lato', sans-serif;
  font-weight: 900;
  font-size: 1.05rem;
  color: #A30B37;
  margin: 0 0 0.45rem;
  text-transform: lowercase;
  font-variant: small-caps;
  letter-spacing: 0.04em;
}
```

The verb line. Interesting combo: `text-transform: lowercase` first forces all
characters lowercase, then `font-variant: small-caps` renders them as small
capitals — together producing an even small-caps look regardless of how the
data was capitalised (e.g. data `"Characterise"` → displays as small-caps
"characterise"). A subtle typographic normalisation trick.

```css
.text {
  font-size: 0.98rem;
  line-height: 1.55;
  color: #2F0147;
  margin: 0;
  opacity: 0.9;
}
```

The description: comfortable reading size/line-height, slightly de-emphasised
(`opacity: 0.9`) so the crimson verb leads visually.

## Libraries & APIs used

- Plain CSS as a **CSS Module**: `::before` **and** `::after` on one element,
  **`content: attr(data-*)`**, partial-border bracket, `transform: translateY`
  hover, `text-transform` + `font-variant: small-caps`, transitions.

## Concepts to learn here

- **`content: attr(data-num)`** — display a JS-supplied attribute value through
  CSS generated content (the receiving half of the data channel; see
  [`ObjectiveCard.tsx`](./ObjectiveCard.tsx.md)).
- **Two pseudo-elements on one element** for two independent decorations
  (badge + corner bracket) with no extra markup.
- **`lowercase` + `small-caps`** to normalise casing into uniform small caps.
- **`transform: translateY` hover lift** (reflow-free) + coordinated
  multi-target hover via pre-declared transitions.
- The partial-border bracket technique, echoing the page frame.

## How to edit it safely

- The badge depends on the TSX setting `data-num`. Change the attribute name in
  one place and you must change `attr(...)` here too.
- `position: relative` on `.card` is required for both pseudo-elements'
  absolute positioning — keep it.
- Add a hover-animated property? Add it to the relevant `transition` list or it
  will snap. Keep using `transform` (not `top`/`margin`) for the lift.
- Cross-refs: [`ObjectiveCard.tsx`](./ObjectiveCard.tsx.md); the corner-bracket
  idea mirrors [`StrandDetail.module.css`](../StrandDetail.module.css.md); grid
  placement in
  [`ObjectivesSection.module.css`](./ObjectivesSection.module.css.md).
