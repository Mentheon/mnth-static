# `src/components/HomeMashup/utils/buildEcgPath.ts`

## What this file is

A single pure helper function, `buildEcgPath`, that **generates an SVG path
string** drawing a repeating PQRST cardiac waveform (the spiky heartbeat line on
a monitor). It returns a string — the value you put in an SVG `<path>`'s `d`
attribute. `EcgScene` uses it three times (intro waveform, sped-up waveform, and
implicitly relates to the flatline).

This doc is the place to **learn SVG path `d` syntax**, because that's all this
file does: build a `d` string mathematically.

## Crash course: the SVG `<path>` `d` attribute

An SVG `<path d="…">` draws an outline from a list of *path commands* packed
into the `d` ("data") string. Each command is a letter followed by numbers
(coordinates). Uppercase letters use **absolute** coordinates; lowercase use
**relative** ones. This file uses only uppercase (absolute). The commands used
here:

- **`M x y`** — *MoveTo*. Lift the pen and move to `(x, y)` without drawing.
  Every path starts with an `M`.
- **`L x y`** — *LineTo*. Draw a straight line from the current point to
  `(x, y)`. The pen is now at `(x, y)`.
- **`Q cx cy x y`** — *Quadratic Bézier curve*. Draw a smooth curve from the
  current point to the end point `(x, y)`, bending toward a single *control
  point* `(cx, cy)`. The curve doesn't pass *through* the control point; the
  control point "pulls" the curve toward it. Used here for the gentle, rounded P
  and T humps (vs. the sharp straight-line QRS spike).

A coordinate's origin `(0,0)` is the **top-left**; **y increases downward**.
That's why making something go *up* on screen means *subtracting* from `y`
(`midY - 44 * amp` is the tall upward R spike), and going *down* means *adding*
(`midY + 6 * amp`).

So a string like `M 0 65 L 10 65 Q 14 71 18 65` means: pen to (0,65); straight
line to (10,65); a curve ending at (18,65) that bulges toward control point
(14,71) (i.e. a small downward bump, since +y is down).

## Line-by-line / block walkthrough

### Signature

```ts
export function buildEcgPath(
  amp: number,
  beats: number,
  w = 800,
  midY = 65,
): string {
```

- `export function …` — a named export (vs. `default`); imported as
  `import { buildEcgPath } from '../utils/buildEcgPath'`.
- Parameters are all `number`; **`w = 800` and `midY = 65` are default
  parameter values** — callers may omit them. `EcgScene` actually passes
  `w = 800` and `midY = 360` explicitly to place the trace lower on its canvas.
- `: string` is the **return type annotation** — TypeScript guarantees this
  function returns a string.
- The doc comment explains the two key knobs: `amp` scales the vertical size of
  the spike (bigger = taller R wave), `beats` is how many full heartbeats span
  the strip.

### Start the path

```ts
let d = `M 0 ${midY}`
const beatW = w / beats
```

- `d` is built up by string concatenation. It opens with **`M 0 ${midY}`** —
  move the pen to the far left, vertically centred on the baseline `midY`. The
  `` `…${expr}…` `` is a *template literal*: `${midY}` injects the number into
  the string.
- **`beatW = w / beats`** — the horizontal width of one heartbeat. If the strip
  is 800 wide and we want 6 beats, each beat is ~133px wide. Every x-coordinate
  below is expressed as a fraction of `beatW` so the shape stays correctly
  proportioned no matter how many beats you ask for.

### The per-beat loop

```ts
for (let i = 0; i < beats; i++) {
  const x0 = i * beatW
  d += ` L ${x0 + beatW * 0.10} ${midY}`
  d += ` Q ${x0 + beatW * 0.14} ${midY + 6 * amp} ${x0 + beatW * 0.18} ${midY}`
  d += ` L ${x0 + beatW * 0.32} ${midY}`
  d += ` L ${x0 + beatW * 0.36} ${midY + 4 * amp}`
  d += ` L ${x0 + beatW * 0.40} ${midY - 44 * amp}`
  d += ` L ${x0 + beatW * 0.44} ${midY + 18 * amp}`
  d += ` L ${x0 + beatW * 0.48} ${midY - 2 * amp}`
  d += ` L ${x0 + beatW * 0.62} ${midY}`
  d += ` Q ${x0 + beatW * 0.72} ${midY - 12 * amp} ${x0 + beatW * 0.82} ${midY}`
  d += ` L ${x0 + beatW} ${midY}`
}
return d
```

One iteration draws one PQRST complex. `x0 = i * beatW` is the left edge of this
beat; every point is `x0 + (fraction of beatW)` horizontally. Mapping the
clinical anatomy of a heartbeat to the commands:

- **`L … 0.10 → midY`** — flat baseline (isoelectric line) for the first 10% of
  the beat.
- **`Q … 0.14, midY+6·amp … 0.18, midY`** — the **P wave**: a small *quadratic*
  hump. Control point is `6*amp` *below* the line (remember +y = down on screen,
  so this is a small bump; sign chosen to taste), curve returns to baseline.
  Curves (`Q`) are used here precisely because the P (and T) waves are smooth
  and rounded, unlike the jagged QRS.
- **`L … 0.32 → midY`** — flat PR segment.
- The **QRS complex**, drawn with sharp straight `L` lines (no smoothing — it's
  a fast, angular spike):
  - `L 0.36 → midY+4·amp` — small **Q** dip (down a touch).
  - `L 0.40 → midY-44·amp` — the big **R** spike. `midY - 44*amp` shoots far
    *up* (subtracting from y). `amp` directly scales its height — pass `amp=1.8`
    and the R wave is 1.8× taller than `amp=1`.
  - `L 0.44 → midY+18·amp` — the **S** undershoot below baseline.
  - `L 0.48 → midY-2·amp` — quick recovery toward the line.
- **`L … 0.62 → midY`** — flat ST segment.
- **`Q … 0.72, midY-12·amp … 0.82, midY`** — the **T wave**: a broader, smooth
  *quadratic* hump (control point `12*amp` above the line), back to baseline.
- **`L … beatW → midY`** — flat tail to the end of the beat, so the next
  iteration's first `L` continues seamlessly from the baseline.

After the loop, `return d` hands back the complete multi-beat string.

### Why this design is nice

- It's a **pure function**: same inputs → same output, no side effects, no DOM.
  Easy to test and reason about.
- All geometry is parameterised (`amp`, `beats`, `w`, `midY`), so `EcgScene` can
  produce a calm 6-beat trace and a frantic 9-beat taller trace from the *same*
  code — and even animate `<path>`'s `d` from one to the other.

## Libraries & APIs used

- **Plain TypeScript** — no libraries. Default parameters, template literals,
  string concatenation, a `for` loop, return-type annotation.
- Produces a value for the **SVG `<path>` `d` attribute** (consumed by
  `EcgScene` via `trace.setAttribute('d', buildEcgPath(...))`).

## Concepts to learn here

- SVG path `d` syntax: `M` (moveto), `L` (lineto), `Q` (quadratic Bézier),
  absolute vs. relative (uppercase vs. lowercase), the top-left origin and
  **y-increases-downward** coordinate system.
- When to use straight lines vs. Bézier curves to convey "jagged" vs. "smooth".
- Parameterising geometry (amplitude/count/size) so one function serves many
  visuals.
- Pure functions and why they're easy to reuse and animate between.
- Building structured strings with template literals in a loop.

## How to edit it safely

- **Change the heartbeat shape:** adjust the fraction multipliers (the `0.10`,
  `0.14`, …) to retime where each wave sits within a beat, and the
  `* amp`-scaled offsets (`+6`, `-44`, …) to reshape wave heights. They're all
  fractions of `beatW`/multiples of `amp`, so the shape stays proportional at
  any `beats`/`amp`.
- **Taller/shorter spikes:** callers pass a bigger `amp` — no edit here needed.
  `EcgScene` uses `amp = 1.5` then `1.8`.
- **More/fewer beats:** callers pass a bigger `beats`. Because every x is a
  fraction of `beatW = w/beats`, the waveform automatically rescales
  horizontally — no edit here.
- **Gotcha — animating between two paths:** anime.js can tween a `<path>`'s `d`
  only when both paths have the **same number and type of commands**. Two
  `buildEcgPath` outputs always have the *same command structure* (10 commands
  per beat) *for the same `beats`*. `EcgScene` deliberately *snaps* (re-sets `d`,
  doesn't tween) when changing `beats` from 6→9, then redraws via
  `stroke-dashoffset` instead. If you add/remove commands per beat, keep them
  uniform or path morphing will glitch.
- **Gotcha — sign of y offsets.** Up on screen = *smaller* y. If a wave points
  the wrong way, you likely flipped a `+`/`-` on the `midY ± k*amp` term.
- Keep it a pure function (no DOM, no globals). Its testability and reuse across
  scene phases depend on that.
