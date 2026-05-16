# `src/components/WhoPage.module.css`

## What this file is

The smallest stylesheet in the project: a **single-class CSS Module** holding just the `.credentials` style for the `WhoPage` people picker. It exists precisely *because* `WhoPage` reuses `RDStrands.module.css` for the picker layout but needs one extra who-specific element (the credentials line under each name) that the strand picker does not have. It is a good illustration of "reuse the big shared module, add a tiny dedicated module for the delta".

Pairs with `WhoPage.tsx` (which imports it aliased as `whoStyles`), alongside the reused `RDStrands.module.css`.

## Line-by-line / block walkthrough

```css
.credentials {
  font-size: 1rem;
  margin-top: 0.35rem;
  opacity: 0.7;
  font-weight: bold;
  color: var(--ink);
}
```

The one and only rule. It styles the parenthesised credentials text (e.g. "(PhD, …)") rendered beneath each person's name in `WhoPage.tsx` via `className={whoStyles.credentials}`:

- `font-size: 1rem` — relative to the root font size (proportional).
- `margin-top: 0.35rem` — a small gap separating it from the name above (which is itself styled by the *reused* `styles.label` from `RDStrands.module.css`).
- `opacity: 0.7` — makes it a quiet, secondary line so the name stays the primary element. Reducing opacity for de-emphasis is a lighter-touch alternative to picking a separate grey colour token.
- `font-weight: bold` — still bold (it is metadata that should read clearly) but the lower opacity keeps it subordinate.
- `color: var(--ink)` — the global theme ink colour. **CSS Modules scope class *names*, not custom properties** — `var(--ink)` still resolves to the app-wide token defined in `src/index.css`, so this stays on-theme automatically.

That is the whole file. The lesson is architectural rather than syntactic: when a component reuses another component's module, **do not fork/duplicate the whole stylesheet to add one element** — create a minimal dedicated module for just the difference and combine both in the component (`styles.*` for the shared layout, `whoStyles.*` for the delta). This keeps the shared picker visually identical across `RDStrands` and `WhoPage` while isolating the who-only addition.

## Libraries & APIs used

Pure CSS. References:

- CSS Modules (Vite): <https://vitejs.dev/guide/features#css-modules>
- CSS custom properties / `var()` (not scoped by CSS Modules): <https://developer.mozilla.org/docs/Web/CSS/Using_CSS_custom_properties>
- `opacity`: <https://developer.mozilla.org/docs/Web/CSS/opacity>

## Concepts to learn here

- The "reuse the big shared module + a tiny dedicated module for the difference" architecture (vs duplicating a whole stylesheet).
- Combining two CSS Modules in one component (`styles.*` + `whoStyles.*`).
- CSS Modules scope class names but **not** custom properties — `var(--ink)` still reads global tokens.
- `opacity` as a de-emphasis tool (lighter-touch than a separate colour).
- `rem` for proportional sizing.

## How to edit it safely

- **Restyle the credentials line**: this is the only place; safe to change freely — it affects nothing else (single class, single consumer).
- **Add more who-only elements**: add classes here and reference them via `whoStyles.x` in `WhoPage.tsx`. Resist the urge to add who-only rules to `RDStrands.module.css` (that module is shared with `RDStrands` and would leak the change there).
- **Gotcha — renaming `.credentials`** must be mirrored in `WhoPage.tsx` (`whoStyles.credentials`).
- **Gotcha — the picker layout is NOT here**; it is in the reused `RDStrands.module.css`. Changing the disc/row/label belongs there (and affects `RDStrands` too) — this file is only the credentials delta.
- Paired/related: **`WhoPage.tsx`** (imports this as `whoStyles`), **`RDStrands.module.css`** (the reused picker layout module), **`RDStrands.tsx`** (the other consumer of that shared module — be mindful when editing it, not this).
