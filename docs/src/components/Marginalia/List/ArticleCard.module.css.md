# `src/components/Marginalia/List/ArticleCard.module.css`

## What this file is

The **scoped stylesheet** for one article card,
[`ArticleCard.tsx`](./ArticleCard.tsx.md). It turns the `<a>` into a
vertical flex card, handles the multi-line summary truncation, and
choreographs a coordinated **hover micro-interaction** (border colour,
lift, shadow, corner tick, CTA colour, arrow nudge — all at once).
Placement *between* cards is the parent grid's job
([`MarginaliaList.module.css`](./MarginaliaList.module.css.md)); this
file styles only the card interior.

## Line-by-line / block walkthrough

```css
.card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 1.5rem 1.4rem 1.4rem;
  background: var(--bg);
  border: 1px solid var(--ink-soft, rgba(47, 1, 71, 0.15));
  text-decoration: none;
  color: var(--ink);
  transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
}
```

The card root (an `<a>`).

- `display: flex; flex-direction: column` — a **vertical flex
  container**. Children (meta, title, summary, tags, CTA) stack top to
  bottom. The column direction is what enables the "push CTA to the
  bottom" trick below (`margin-top: auto`).
- `position: relative` — anchors the absolutely-positioned
  `.cornerTick`.
- `text-decoration: none` — strips the default link underline so it
  reads as a card, not a hyperlink (in-prose links *keep* underlines —
  see [`ArticleBody.module.css.md`](../Detail/ArticleBody.module.css.md)
  — a deliberate contrast).
- `transition: border-color, transform, box-shadow (0.2s ease)` —
  pre-declares which properties animate on state change; the actual new
  values are set in `:hover`. Declaring transitions on the base rule
  (not the hover rule) means both enter *and* exit animate.
- `cursor: pointer` — pointer cursor over the whole card.

```css
.cornerTick {
  position: absolute;
  top: -1px;
  left: -1px;
  width: 12px;
  height: 12px;
  border-top: 2px solid var(--grape);
  border-left: 2px solid var(--grape);
  transition: border-color 0.2s ease;
  pointer-events: none;
}
```

The little top-left L tick. `position: absolute` places it relative to
the `position: relative` `.card`; `top/left: -1px` sits it exactly on
the 1px border so the two L-strokes overlay the corner. Grape by
default, transitions colour, and `pointer-events: none` so it never
intercepts the card click.

```css
.card:hover {
  border-color: var(--crimson);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm, 0 2px 6px rgba(47, 1, 71, 0.12));
}
.card:hover .cornerTick {
  border-top-color: var(--crimson);
  border-left-color: var(--crimson);
}
```

The hover state, a **coordinated multi-property animation**:

- `border-color: var(--crimson)` — accent border.
- `transform: translateY(-2px)` — lifts the card up 2px. `transform` is
  GPU-friendly and doesn't trigger layout reflow (unlike animating
  `top`/`margin`), so it's the right tool for motion.
- `box-shadow` — a soft lift shadow (variable with fallback).
- `.card:hover .cornerTick` — a **descendant selector keyed on the
  parent's hover state**: hovering the card recolours the *child* tick
  to crimson. This "parent hover drives child" pattern recurs below for
  the CTA and arrow, producing one synchronised effect from a single
  hover.

```css
.title {
  font-family: 'Lato', sans-serif;
  font-weight: 900;
  font-size: 1.35rem;
  line-height: 1.2;
  letter-spacing: -0.005em;
  color: var(--ink);
  margin: 0 0 0.6rem;
}
```

The `<h3>` title — heavy weight, tight line-height. (Recall the `<h3>`
is for *document structure*; its visual size comes entirely from this
rule, decoupling semantics from appearance.)

```css
.summary {
  font-family: 'Lato', sans-serif;
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--ink);
  opacity: 0.78;
  margin: 0 0 1.1rem;
  /* 2-line clamp */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

The **2-line truncation** of the summary so every card stays the same
height regardless of summary length. The four-property recipe is the
well-known cross-browser line-clamp:

- `display: -webkit-box` + `-webkit-box-orient: vertical` +
  `-webkit-line-clamp: 2` — render as a box that shows only 2 lines.
- `overflow: hidden` — hide the rest (an ellipsis is added by the
  engine).

Despite the `-webkit-` prefixes, this is supported across modern
browsers and is the standard idiom for "clamp to N lines". The component
[`ArticleCard.tsx`](./ArticleCard.tsx.md) passes the full summary text;
the trimming is purely visual here.

```css
.tagsRow { margin: 0 0 1rem; }

.cta {
  margin-top: auto;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-quiet);
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  transition: color 0.2s ease, gap 0.2s ease;
}
```

`.cta` is the "Read →" footer. The key line is **`margin-top: auto`**:
inside a `flex-direction: column` container, an `auto` top margin
absorbs all remaining vertical space, pushing the CTA to the **bottom of
the card**. That's why cards with short summaries still have the "Read
→" pinned at the base — every card's footer aligns. A very common, very
useful flex trick. It is itself an `inline-flex` row so the label and
arrow align with a `gap`.

```css
.card:hover .cta { color: var(--crimson); gap: 0.6rem; }

.arrow { display: inline-block; transition: transform 0.2s ease; }
.card:hover .arrow { transform: translateX(2px); }
```

More **parent-hover-drives-child** rules:

- Card hover turns the CTA crimson and widens its `gap` 0.4→0.6rem
  (animated, since `gap` is in `.cta`'s transition list) — the same
  animated-gap "nudge" idiom used by the back/CTA links elsewhere in the
  feature.
- The `.arrow` additionally slides right 2px via
  `transform: translateX(2px)`. `display: inline-block` is required for
  `transform` to take effect on an inline element.

Together with the lift, shadow, border and tick recolour, a single
hover fires ~six coordinated transitions — all defined declaratively in
CSS, no JS.

## Libraries & APIs used

- **Plain CSS** as a **CSS Module**.
- **Flexbox** (`flex-direction: column`, `align-items`, `gap`,
  `margin-top: auto`).
- **CSS transitions & transforms** (`translateY`, `translateX`).
- **CSS variables with fallbacks**.
- **Line-clamp** (`-webkit-box` / `-webkit-line-clamp`).
- **Pseudo-classes** (`:hover`) and descendant selectors.

## Concepts to learn here

- **`margin-top: auto` in a flex column** to pin a footer to the bottom
  and equalise card layouts.
- **Multi-line text truncation** with the `-webkit-line-clamp` recipe.
- **Coordinated hover micro-interactions** via
  `.parent:hover .child` selectors — one trigger, many synchronised
  changes.
- **Animating `transform` (not layout properties)** for smooth,
  reflow-free motion; `inline-block` requirement for transforms on
  inline elements.
- **Declaring `transition` on the base rule** so changes animate both
  ways.

## How to edit it safely

- **Change summary truncation length**: edit `-webkit-line-clamp` (e.g.
  `3` for three lines). Keep the other three line-clamp properties
  together — removing any one breaks the effect.
- **Tune the hover feel**: adjust the `:hover` values
  (`translateY`/`box-shadow`/colours) and the `transition` durations.
  Keep `transform` for motion rather than animating `top`/`margin`
  (avoids jank).
- **Footer not at the bottom?** Ensure `.card` keeps
  `display: flex; flex-direction: column` and `.cta` keeps
  `margin-top: auto` — the trick depends on all three.
- **Card placement / grid columns** are *not* here — see
  [`MarginaliaList.module.css`](./MarginaliaList.module.css.md).
- **Class renames** must mirror
  [`ArticleCard.tsx`](./ArticleCard.tsx.md) (CSS Modules fail silently
  on mismatch).
- **Gotcha**: the `.cornerTick` `top/left: -1px` is tied to the card's
  `1px` border so the L sits exactly on the corner; if you change the
  border width, re-derive the offset.
- Paired file: [`ArticleCard.tsx`](./ArticleCard.tsx.md).
