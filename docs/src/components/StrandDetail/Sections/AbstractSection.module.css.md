# `src/components/StrandDetail/Sections/AbstractSection.module.css`

## What this file is

The **CSS Module** paired with
[`AbstractSection.tsx`](./AbstractSection.tsx.md). It styles the section spacing
and the prose paragraph, and — the teaching highlight — applies a typographic
**drop-cap** to the first letter using the `::first-letter` pseudo-element.

## Line-by-line / block walkthrough

```css
.section {
  margin-bottom: 3.5rem;
}
```

Uniform spacing below the section. The same `margin-bottom: 3.5rem` appears in
[`ObjectivesSection.module.css`](./ObjectivesSection.module.css.md) and
[`ResearchQuestionsSection.module.css`](./ResearchQuestionsSection.module.css.md)
— a deliberately consistent rhythm between sections.

```css
.body {
  font-size: 1.15rem;
  line-height: 1.65;
  color: #2F0147;
  max-width: 75ch;
  margin: 0;
}
```

The abstract paragraph. Generous `line-height: 1.65` and `font-size: 1.15rem`
make a long block comfortable to read; `max-width: 75ch` caps the line length at
~75 characters (the `ch` unit ≈ one character's width) — a readability best
practice so lines never get uncomfortably wide on big screens.

```css
.body::first-letter {
  font-size: 3.2rem;
  font-weight: 900;
  color: #A30B37;
  float: left;
  line-height: 0.9;
  margin: 0.1em 0.1em 0 0;
}
```

The **drop-cap**. `::first-letter` is a pseudo-element that targets *only the
first letter* of a block — no markup needed, the browser finds it. The styling
makes that letter big (`3.2rem`), heavy, and crimson. The mechanics:

- `float: left` takes the letter out of normal flow and lets the following text
  *wrap around its right side* — this is what produces the classic drop-cap
  where two or three lines of text hug the large initial.
- `line-height: 0.9` tightens the big letter so it doesn't push the first line
  down excessively.
- `margin: 0.1em 0.1em 0 0` gives a little breathing room to the right/top so
  the wrapping text isn't jammed against it. `em` units scale with the letter's
  own (large) font size.

This is a pure-CSS editorial flourish — the TSX paragraph stays plain text.

## Libraries & APIs used

- Plain CSS as a **CSS Module**: `::first-letter` pseudo-element, `float` for
  text wrap, `ch`/`em` units, readability-oriented typography.

## Concepts to learn here

- **`::first-letter` drop-cap** with `float: left` to wrap body text around an
  oversized initial — a real typographic technique done with zero extra DOM.
- **Readability constraints**: `max-width: …ch` and a roomy `line-height`.
- **Consistent vertical rhythm** (`margin-bottom: 3.5rem`) shared across all
  section modules.

## How to edit it safely

- The drop-cap relies on `float: left`; removing the float makes the big letter
  sit inline and shove the first line down instead of wrapping. Keep it if you
  want the drop-cap effect.
- Tweak the cap size via `::first-letter { font-size }` and re-check
  `line-height`/`margin` so it still aligns with the first lines.
- Keep `max-width` in `ch` for readability; widening it hurts long-line
  legibility.
- The heading above the paragraph is styled by the shared
  [`SectionTitle.module.css`](./SectionTitle.module.css.md), not here.
- Cross-refs: [`AbstractSection.tsx`](./AbstractSection.tsx.md); spacing matches
  the other section modules.
