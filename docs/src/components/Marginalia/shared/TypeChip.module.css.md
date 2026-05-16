# `src/components/Marginalia/shared/TypeChip.module.css`

## What this file is

The **scoped stylesheet** for the article-type badge,
[`TypeChip.tsx`](./TypeChip.tsx.md). It defines one shared base chip
shape plus four colour variants (crimson / plum / ink / grape) that the
component selects per article type.

## Line-by-line / block walkthrough

```css
.chip {
  display: inline-flex;
  align-items: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  padding: 0.3rem 0.55rem;
  color: var(--bg);
  border-radius: 2px;
  white-space: nowrap;
  line-height: 1;
}
```

The **base class** — applied to every chip regardless of type (the
component always composes `styles.chip` + a colour class).

- `display: inline-flex; align-items: center` — flows inline (so it sits
  in a meta row) while vertically centring its single line of text.
- The mono / tiny / heavy / wide-tracking / uppercase combination is the
  site's badge typography.
- `text-transform: uppercase` — displays "ESSAY" while the source text
  stays "Essay" (set by the component) — keeps copy/accessibility clean.
- `padding: 0.3rem 0.55rem` + `border-radius: 2px` — a compact,
  slightly-rounded rectangle (note: *not* the `999px` pill used
  elsewhere — chips are deliberately squarer than strand pills, a
  visual distinction between "type" and "strand").
- `color: var(--bg)` — the **text** colour is the page background
  (cream/light). This is the key design decision: the chip text is
  always light, and each *variant class below sets a dark/saturated
  background*, so the label reads as light-on-colour. Defining `color`
  once here means the variants only need to set `background`.
- `white-space: nowrap` — never wrap the label onto two lines (e.g.
  "Paper summary" stays on one line), keeping the chip pill-shaped.
- `line-height: 1` — no extra leading; tight vertical box.

```css
.chipCrimson { background: var(--crimson); }
.chipPlum    { background: var(--plum); }
.chipInk     { background: var(--ink); }
.chipGrape   { background: var(--grape); }
```

The four **variant classes**. Each sets only `background` (text colour
and shape are inherited from `.chip`). This is the textbook **base +
modifier** structure: the variant adds the one differing property and
nothing else — minimal, DRY, easy to extend.

Crucially, the *class names* here exactly match the values in the
`VARIANT` lookup table in [`TypeChip.tsx`](./TypeChip.tsx.md):

| Article type      | `VARIANT` value | class here     | colour      |
|-------------------|-----------------|----------------|-------------|
| `essay`           | `chipCrimson`   | `.chipCrimson` | `--crimson` |
| `note`            | `chipPlum`      | `.chipPlum`    | `--plum`    |
| `dispatch`        | `chipInk`       | `.chipInk`     | `--ink`     |
| `paper-summary`   | `chipGrape`     | `.chipGrape`   | `--grape`   |
| `link-roundup`    | `chipGrape`     | `.chipGrape`   | `--grape`   |

The component reaches these via `styles[key]` (dynamic CSS-module
access), so the string in `VARIANT` and the class name here are bound by
an **exact-match contract** — they must stay in lockstep.

## Libraries & APIs used

- **Plain CSS** as a **CSS Module**.
- **Flexbox** (`inline-flex`, `align-items`).
- **CSS variables** for the palette (`--bg`, `--crimson`, `--plum`,
  `--ink`, `--grape`).

## Concepts to learn here

- **Base + modifier class architecture**: put every shared property in
  `.chip`; let each variant override the single differing property
  (`background`). The component composes
  `${styles.chip} ${variantClass}`.
- **Light text + variable background** strategy: set `color` once on the
  base, vary only `background` per variant.
- **The component/CSS contract**: the `VARIANT` map values in
  [`TypeChip.tsx`](./TypeChip.tsx.md) must equal class names here
  because the component does `styles[key]` (a string lookup, not a
  static reference) — no compiler check spans this boundary.
- **`white-space: nowrap`** to keep multi-word labels on one line.
- **Theme tokens (`var(--…)`)** so a palette change is centralised.

## How to edit it safely

- **Add a colour variant** (for a new article type): add a
  `.chipXxx { background: var(--token); }` rule here, then set the new
  type's value to `'chipXxx'` in the `VARIANT` table in
  [`TypeChip.tsx`](./TypeChip.tsx.md) (and add the type to the
  `ArticleType` union in [`types.ts`](../types.ts.md) — see that doc's
  recipe).
- **Recolour an existing type**: either point its `VARIANT` value at a
  different `.chip*` class, or change the `background` token in the
  relevant rule here.
- **Rename a variant class**: you must update it in **both** this file
  *and* the `VARIANT` values in [`TypeChip.tsx`](./TypeChip.tsx.md). A
  mismatch makes `styles[key]` return `undefined` → a chip with the base
  shape but no background colour, and **no error is raised**. This is
  the single biggest gotcha for this file.
- **Change chip shape** (e.g. make it a pill): edit `.chip`
  (`border-radius`) — affects all types uniformly, which is usually
  desired for consistency.
- **Gotcha**: don't move `color`/shape into the variant classes —
  keeping them on `.chip` is what makes adding a new colour a one-line
  change.
- Paired file: [`TypeChip.tsx`](./TypeChip.tsx.md).
