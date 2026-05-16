# `src/components/StrandDetail/Sections/SectionTitle.module.css`

## What this file is

The **CSS Module** paired with [`SectionTitle.tsx`](./SectionTitle.tsx.md). It
implements the shared section-heading look: the folder's mono/uppercase label
idiom, a decorative leading tick drawn with `::before`, and a right-aligned
faint section number pushed away by `margin-left: auto`.

## Line-by-line / block walkthrough

```css
.title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #9C528B;
  font-weight: 700;
  margin: 0 0 1.2rem;
  display: flex;
  align-items: baseline;
  gap: 0.8em;
}
```

The `<h2>`. Same **label idiom** seen across the folder (mono, tiny, wide
letter-spacing, uppercase) in mauve `#9C528B`. It is a flex container:
`align-items: baseline` aligns the tick, the title text, and the number on their
text baselines (cleaner than centre-aligning differently-sized text); `gap` adds
space between the tick and the text.

```css
.title::before {
  content: '';
  display: inline-block;
  width: 28px;
  height: 1px;
  background: #9C528B;
  transform: translateY(-3px);
}
```

A **`::before` pseudo-element**: a 28px-wide, 1px-tall mauve bar rendered before
the heading text — a small decorative rule with no extra markup. `content: ''`
is required for a pseudo-element to render at all. `transform: translateY(-3px)`
nudges the bar up slightly so it visually centres against the cap height of the
uppercase text rather than sitting on the baseline. This is the **same tick
pattern** used by the timeline's title
([`ProgressTimeline.module.css`](../Progress/ProgressTimeline.module.css.md)) —
recognising shared idioms across files is part of reading a codebase.

```css
.num {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  color: rgba(47, 1, 71, 0.55);
  font-weight: 500;
  margin-left: auto;
}
```

The `§ 01` span. The trick is **`margin-left: auto`** inside a flex row: an
`auto` margin absorbs all the free space on that side, shoving the number to the
**far right** of the heading while the tick + title stay left. (This is the
flexbox equivalent of "push this item to the end" without `justify-content`,
which would affect every child.) It is lighter weight and the translucent-plum
faint colour so it reads as secondary metadata.

## Libraries & APIs used

- Plain CSS as a **CSS Module**: Flexbox (`align-items: baseline`, **`margin-left:
  auto` to push an item to the end**), `::before` pseudo-element with `content`,
  `transform: translateY` micro-nudge.

## Concepts to learn here

- **`margin: auto` in flexbox** as a one-property "push to the far side."
- **`::before` for decorative rules** without polluting the markup, plus a
  `transform` nudge to optically align it.
- **`align-items: baseline`** for mixed-size inline-ish content.
- The recurring **label idiom** and the **shared tick** (compare the timeline
  title) — design-system consistency expressed by copying a pattern.

## How to edit it safely

- To restyle every section heading at once, edit here — that is the payoff of
  the shared [`SectionTitle`](./SectionTitle.tsx.md) component.
- The `§` character itself is added in the TSX, not here; this file only styles
  the `.num` span.
- If you change the tick on the section title, consider matching the timeline's
  tick in
  [`ProgressTimeline.module.css`](../Progress/ProgressTimeline.module.css.md)
  for visual consistency (they are deliberately the same).
- Cross-refs: classes consumed by [`SectionTitle.tsx`](./SectionTitle.tsx.md);
  used inside [`AbstractSection`](./AbstractSection.module.css.md),
  [`ObjectivesSection`](./ObjectivesSection.module.css.md),
  [`ResearchQuestionsSection`](./ResearchQuestionsSection.module.css.md).
