# `src/components/HomeMashup/scenes/EhrScene.tsx`

## What this file is

A carousel scene: a "Mentheon-OS" boot log streams into the canvas like a
terminal — some lines drop in whole (banners, comments, OK lines), others type
out character-by-character (prompts, mounts, stats, the closing flag). It's the
longest, most data-driven scene.

Follows the **shared scene contract / skeleton** (`HelixScene.tsx.md` — read
first). New concepts: **a data-driven render (a `LINES` script + per-kind style
table), a running time `cursor` to sequence everything, and a typewriter effect
built from the object-counter idiom.**

## Line-by-line / block walkthrough

### The content as data

```tsx
type LineKind = 'banner' | 'prompt' | 'ok' | 'mount' | 'stat' | 'comment' | 'flag' | 'spacer'
interface Line { text: string; kind: LineKind }
const INSTANT_KINDS: ReadonlySet<LineKind> = new Set(['banner', 'comment', 'ok', 'spacer'])
const LINES: Line[] = [
  { kind: 'banner',  text: 'MENTHEON-OS  v0.9.4-rc2  (build 20260504.b3a1)' },
  …
  { kind: 'flag',    text: '> signal velocity exceeds historic baseline' },
]
```

The whole boot log is **declarative data**, not imperative draw calls.
`LineKind` is a string-literal union (see `types.ts.md`) categorising each line.
`LINES` is the script. `INSTANT_KINDS` is a `Set` of kinds that appear whole
rather than typed — `set.has(kind)` is a fast membership test. This separation
(content as data, one loop to render it) is the central design idea: to change
the boot text you edit `LINES`, never the loop.

```tsx
interface KindStyle { fill: string; opacity: string; weight: string }
const KIND_STYLES: Record<LineKind, KindStyle> = {
  banner:  { fill: 'var(--ink)',     opacity: '1',    weight: '700' },
  …
  flag:    { fill: 'var(--crimson)', opacity: '1',    weight: '700' },
}
```

A `Record<LineKind, KindStyle>` (see `MoleculeScene.tsx.md` for `Record`) maps
each kind to its visual style. **`Record<LineKind, …>` forces you to define a
style for *every* kind** — if you add a `LineKind` member, TypeScript errors
until you add its style. The compiler keeps the data tables in sync.

```tsx
const CHAR_MS = 14, INSTANT_HOLD = 80, SPACER_HOLD = 60, TYPED_GAP = 80
const START_Y = 80, LINE_H = 22
```

All timing/layout knobs hoisted to named constants so the whole sequence can be
retuned without touching the loop.

### The render loop with a running time cursor

```tsx
let cursor = 0  // running ms offset for the next line to start
LINES.forEach((entry, idx) => {
  const style = KIND_STYLES[entry.kind]
  if (entry.kind === 'spacer') { cursor += SPACER_HOLD; return }

  const text = document.createElementNS(SVG_NS, 'text')
  text.setAttribute('x', '80')
  text.setAttribute('y', String(START_Y + idx * LINE_H))
  …
  text.setAttribute('opacity', '0')
  svg.appendChild(text)
```

The key technique is **`cursor`**: a single accumulating millisecond offset.
Each line schedules itself at `delay: cursor`, then advances `cursor` by however
long that line takes. This is how a *sequence* of independently-animated
elements is choreographed without nesting `setTimeout`s — every element is
created up front, but its anime.js `delay` is its start time on a shared
timeline. Spacers advance the cursor (and y-rhythm via `idx * LINE_H`) but draw
nothing.

### Instant lines

```tsx
if (INSTANT_KINDS.has(entry.kind)) {
  const id = window.setTimeout(() => { text.textContent = entry.text }, cursor)
  timeouts.push(id)
  animations.push(
    animate(text, { opacity: [0, parseFloat(style.opacity)], duration: 220, delay: cursor, ease: 'outQuad' }),
  )
  cursor += INSTANT_HOLD
  return
}
```

For instant kinds: a `setTimeout(…, cursor)` drops the whole string in at the
scheduled time, while an anime.js tween fades the row up (also `delay: cursor`,
so the fade and the text appearance line up). `parseFloat(style.opacity)`
converts the table's string opacity to a number for the tween. Then
`cursor += INSTANT_HOLD` so the next line starts a beat later.

### Typed lines — the typewriter

```tsx
animate(text, { opacity: [0, parseFloat(style.opacity)], duration: 180, delay: cursor, ease: 'outQuad' })

const obj = { i: 0 }
const typeMs = entry.text.length * CHAR_MS
animations.push(
  animate(obj, {
    i: entry.text.length,
    duration: typeMs,
    delay: cursor,
    ease: 'linear',
    onUpdate: () => {
      const i = Math.round(obj.i)
      text.textContent = entry.text.slice(0, i)
    },
  }),
)
cursor += typeMs + TYPED_GAP
```

The **typewriter effect** is the object-counter idiom (`HelixScene.tsx.md`)
applied to text: animate `obj.i` from `0` to the string length over
`length * CHAR_MS` ms with **`ease: 'linear'`** (constant speed = even typing),
and every frame set `text.textContent = entry.text.slice(0, i)` — i.e. show the
first `i` characters. Linear easing is essential here; any acceleration would
make the typing speed visibly uneven. Then the cursor advances by the typing
duration plus a gap before the next line.

The whole effect — terminal boot log — emerges from data + one loop + the shared
counter idiom; there's no bespoke animation code per line.

### Cleanup

```tsx
return () => {
  animations.forEach(a => a.pause())
  timeouts.forEach(id => clearTimeout(id))
  while (svg.firstChild) svg.removeChild(svg.firstChild)
}
```

Mandatory cleanup + clearing the instant-line `setTimeout`s.

## Libraries & APIs used

- **React / anime.js / DOM-SVG / CSS Modules / TypeScript** — shared set
  (`HelixScene.tsx.md`).
- New: string-literal-union-keyed `Record` tables, `Set` membership,
  monospace SVG `<text>`, `String.slice` for the typewriter, a running-cursor
  timeline, `parseFloat`.

## Concepts to learn here

- Content-as-data + a single render loop (vs. hand-coding each element).
- `Record<Union, T>` to force exhaustive style/config tables (compiler-enforced
  sync with the union).
- A running `cursor` offset as a lightweight sequencer across many independently
  delayed animations.
- The typewriter: object-counter + `slice` + **linear** easing.
- Hoisting timing/layout to named constants for one-place retuning.

## How to edit it safely

- **Change the boot text:** edit the `LINES` array. To make a line typed vs.
  instant, set its `kind` (instant if the kind is in `INSTANT_KINDS`).
- **Add a line kind:** add it to the `LineKind` union, then add its entry to
  `KIND_STYLES` (TypeScript will force this) and, if it should appear whole,
  to `INSTANT_KINDS`.
- **Retime:** adjust `CHAR_MS` (typing speed), `*_HOLD`/`TYPED_GAP` (inter-line
  pacing). The total run is the sum of all per-line cursor advances — it must
  fit this scene's `duration` (6000ms) in `HomeMashup`'s `SCENES` (see
  `HomeMashup.tsx.md`). This scene is long; recompute roughly after big edits.
- **Gotcha:** keep `ease: 'linear'` on the typewriter tween — non-linear easing
  makes typing speed visibly ramp.
- **Gotcha:** `y = START_Y + idx * LINE_H` uses the array index, so removing a
  line shifts everything below it; that's fine, but very many lines can run off
  the 520-tall viewBox.
- **Gotcha:** clear the `timeouts` in cleanup (instant lines use `setTimeout`).
- Universal scene gotchas in `HelixScene.tsx.md`.
