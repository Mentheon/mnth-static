# `src/components/StrandDetail/Sections/ResearchQuestionItem.module.css`

## What this file is

The **CSS Module** paired with
[`ResearchQuestionItem.tsx`](./ResearchQuestionItem.tsx.md). It styles each
question card: a tinted panel with a coloured left accent bar, an
absolutely-positioned `RQ` badge, and a hover state that shifts the accent and
badge from mauve to crimson.

## Line-by-line / block walkthrough

```css
.item {
  position: relative;
  padding: 1.5rem 1.5rem 1.5rem 3.2rem;
  background: rgba(47, 1, 71, 0.04);
  border-left: 3px solid #9C528B;
  transition: border-left-color 0.2s, background 0.2s;
}
```

- `position: relative` — anchors the absolutely-positioned `.num` badge.
- The asymmetric padding (`3.2rem` on the **left**) reserves space for the badge
  that is positioned into that gutter.
- `background: rgba(47,1,71,0.04)` — a barely-there plum tint so the card reads
  as a distinct surface.
- `border-left: 3px solid #9C528B` — a thick mauve **accent bar** down the left
  edge (a common "callout / quote" visual).
- `transition: border-left-color 0.2s, background 0.2s` — pre-declares what
  animates on hover.

```css
.item:hover {
  border-left-color: #A30B37;
  background: rgba(163, 11, 55, 0.05);
}
```

On hover the accent bar turns crimson and the tint shifts to a faint crimson —
the folder's recurring mauve/plum → crimson hover motif, animated via the
transitions above.

```css
.num {
  position: absolute;
  top: 1.5rem;
  left: 1.25rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  font-weight: 700;
  color: #9C528B;
}
```

The `RQ1` badge. `position: absolute` with `top`/`left` places it into the
left padding gutter that `.item`'s `padding-left: 3.2rem` reserved — so it sits
beside the text without being part of the text flow. (Contrast with
[`ObjectiveCard`](./ObjectiveCard.module.css.md), where the badge is CSS
generated content from a `data-` attribute; here it is a real `<span>` element,
so it is styled as an element, not via `content`.) Mono, bold, mauve to match
the accent bar.

```css
.item:hover .num { color: #A30B37; }
```

A **descendant hover selector**: when the `.item` is hovered, recolour the
nested `.num` to crimson too, so the badge and accent bar change together as one
coordinated hover state. (`.num` has no `transition`, so this colour snaps;
that is a minor inconsistency with the smoothly-transitioning bar — see "How to
edit it safely.")

```css
.text {
  font-size: 1rem;
  line-height: 1.55;
  color: #2F0147;
  margin: 0;
}
```

The question prose: comfortable size/line-height, full-strength plum.

## Libraries & APIs used

- Plain CSS as a **CSS Module**: `position: absolute` inside `position:
  relative`, reserved padding gutter, **`border-left` accent bar**, descendant
  hover selector, transitions.

## Concepts to learn here

- **Absolute-position-into-a-reserved-padding-gutter** — a clean way to place a
  badge/marker beside text without it participating in text flow.
- **`border-left` accent bar** as a lightweight callout style.
- **Coordinated multi-element hover** via a descendant selector
  (`.item:hover .num`).
- **Element badge vs generated-content badge**: contrast with
  [`ObjectiveCard.module.css`](./ObjectiveCard.module.css.md)'s
  `content: attr(data-num)` — two valid approaches.

## How to edit it safely

- If you change the badge width/format, keep `.item`'s `padding-left` wide
  enough that `.text` never overlaps the absolutely-positioned `.num`.
- Polish nit: `.num` has no `transition`, so its hover colour snaps while the
  bar fades. To make them match, add `transition: color 0.2s` to `.num`.
- Keep the plum→crimson hover convention for consistency with the rest of the
  folder.
- Cross-refs: classes consumed in
  [`ResearchQuestionItem.tsx`](./ResearchQuestionItem.tsx.md); grid placement in
  [`ResearchQuestionsSection.module.css`](./ResearchQuestionsSection.module.css.md);
  compare badge technique with
  [`ObjectiveCard.module.css`](./ObjectiveCard.module.css.md).
