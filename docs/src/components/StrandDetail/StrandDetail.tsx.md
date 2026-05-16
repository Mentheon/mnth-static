# `src/components/StrandDetail/StrandDetail.tsx`

## What this file is

This is the **top-level component** for the strand-detail page. Its only job is
**composition**: it arranges the smaller components (Header, MetaRow, Progress,
Sections, CTAs) in the right order and wires the one piece of shared state (is
the progress timeline expanded?) between two of them. It deliberately contains
no presentation styling logic and no data shaping — those live in children and
in `src/data/strands.ts`.

This is the best file to read first to understand the whole subsystem.

## The big picture: how the pieces fit together

```
StrandDetail                         (this file — composition + disclosure state)
├── <nav> breadcrumb                  strands / <id> / detail
└── <main> / <article> (the framed card with corner crops)
    ├── StrandDetailHeader            icon + kicker + name + tagline
    │   ├── StrandMetaRow             "since / collaborators / phase"
    │   │   └── ProgressBeacon        tiny inline SVG; the disclosure TRIGGER
    │   └── ProgressTimeline          big animated SVG; the disclosure PANEL
    ├── AbstractSection               §01 prose
    ├── ObjectivesSection             §02 grid of ObjectiveCards
    ├── ResearchQuestionsSection      §03 list of ResearchQuestionItems
    └── StrandCTARow                  buttons (CTAButton x N)
```

Two children share one boolean: `ProgressBeacon` (the clickable summary) and
`ProgressTimeline` (the expandable detail). Clicking the beacon toggles the
timeline open/closed. That boolean is **state**, and this component owns it via
the `useDisclosure` hook.

## Line-by-line / block walkthrough

```tsx
import { useId } from 'react'
import type { StrandDetailProps } from './types'
import StrandDetailHeader from './Header/StrandDetailHeader'
import StrandMetaRow from './MetaRow/StrandMetaRow'
import ProgressBeacon from './Progress/ProgressBeacon'
import ProgressTimeline from './Progress/ProgressTimeline'
import AbstractSection from './Sections/AbstractSection'
import ObjectivesSection from './Sections/ObjectivesSection'
import ResearchQuestionsSection from './Sections/ResearchQuestionsSection'
import StrandCTARow from './CTAs/StrandCTARow'
import useDisclosure from './hooks/useDisclosure'
import styles from './StrandDetail.module.css'
```

- `useId` is a React hook that returns a **stable, unique string id**, generated
  once per component instance. We use it to link the beacon (trigger) and the
  timeline (panel) for accessibility (`aria-controls` / `id`).
- `import type { StrandDetailProps }` — type-only import of the prop contract
  (see [`types.ts`](./types.ts.md)).
- Each child component is **default-imported** from its own folder. The folder
  layout groups a component with its CSS and helpers.
- `import styles from './StrandDetail.module.css'` — a **CSS Module**. `styles`
  is an object whose keys are the class names you wrote in the `.module.css`
  file, and whose values are *uniquely mangled* class strings (e.g.
  `.breadcrumb` becomes something like `StrandDetail_breadcrumb_a1b2c`). This is
  how CSS Modules scope styles to a component so they cannot collide with other
  components' classes. You always reference classes as `styles.breadcrumb`,
  never as the literal string `"breadcrumb"`. Paired file:
  [`StrandDetail.module.css`](./StrandDetail.module.css.md).

```tsx
export default function StrandDetail({ strand, progress, onBack }: StrandDetailProps) {
```

A **function component**: a plain function that takes props and returns JSX. The
`{ strand, progress, onBack }` is **destructuring** — instead of `props.strand`
everywhere, we pull the three fields out by name in the parameter list. The
`: StrandDetailProps` annotation types the whole props object so TypeScript
checks both the call site and our usage.

```tsx
  const disclosure = useDisclosure()
  const timelineId = useId()
```

- `useDisclosure()` is a **custom hook** (see
  [`hooks/useDisclosure.ts`](./hooks/useDisclosure.ts.md)). It returns
  `{ isOpen, toggle, open, close }`. This is the single source of truth for
  whether the timeline is expanded. State lives *here*, at the common ancestor
  of the two components that need it — this is the React pattern called
  **"lifting state up."**
- `useId()` generates the shared id string for the beacon↔timeline accessibility
  link. Calling it in the component (not hardcoding `"timeline"`) means multiple
  `StrandDetail`s on one page won't produce duplicate ids.

```tsx
  return (
    <>
```

The component returns JSX. `<>...</>` is a **React Fragment**: a wrapper that
groups multiple elements without adding an extra DOM node. We need it because a
component must return a single root, but we want a `<nav>` *and* a `<main>` as
siblings.

```tsx
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        {onBack ? (
          <button type="button" onClick={onBack}>strands</button>
        ) : (
          <a href="#">strands</a>
        )}
        <span className={styles.sep}>/</span>
        <a href={strand.href}>{strand.id}</a>
        <span className={styles.sep}>/</span>
        <span>detail</span>
      </nav>
```

- `className` (not `class`) is how JSX sets an element's CSS class — `class` is
  a reserved word in JavaScript.
- `aria-label="Breadcrumb"` names this navigation landmark for screen readers.
- `{onBack ? (...) : (...)}` is a **conditional (ternary) expression inside
  JSX**. Curly braces let you drop JavaScript into JSX. If the optional `onBack`
  callback was provided, render a real `<button>` that calls it on click;
  otherwise render a dead link (`href="#"`). This is the runtime consequence of
  `onBack` being optional in the type.
- `onClick={onBack}` passes the function itself as the click handler (no
  parentheses — we are *referencing* it, not calling it now).
- `{strand.href}` / `{strand.id}` interpolate data values into the markup.

```tsx
      <main className={styles.page}>
        <article className={styles.frame}>
          <span className={`${styles.cornerCrop} ${styles.cornerTL}`} aria-hidden="true" />
          <span className={`${styles.cornerCrop} ${styles.cornerTR}`} aria-hidden="true" />
          <span className={`${styles.cornerCrop} ${styles.cornerBL}`} aria-hidden="true" />
          <span className={`${styles.cornerCrop} ${styles.cornerBR}`} aria-hidden="true" />
```

- `<main>` and `<article>` are **semantic HTML** landmarks — better for
  accessibility and document structure than generic `<div>`s.
- The four `<span>`s are purely decorative "corner crop" marks (the little
  L-shaped brackets at the card corners). `className={`${styles.cornerCrop}
  ${styles.cornerTL}`}` uses a **template literal** to combine two CSS-module
  classes on one element: a shared base class plus a per-corner positioning
  class. See the paired CSS for how the brackets are drawn.
- `aria-hidden="true"` hides them from assistive tech because they convey no
  information. Self-closing `<span ... />` is valid JSX for an empty element.

```tsx
          <StrandDetailHeader strand={strand}>
            <StrandMetaRow meta={strand.meta}>
              <ProgressBeacon
                progress={progress}
                expanded={disclosure.isOpen}
                onToggle={disclosure.toggle}
                ariaControls={timelineId}
              />
            </StrandMetaRow>
            <ProgressTimeline id={timelineId} progress={progress} expanded={disclosure.isOpen} />
          </StrandDetailHeader>
```

This is the **composition heart of the file**, and it shows an important React
technique: **`children` as a composition slot**.

- `StrandDetailHeader` receives `strand` as a prop *and* receives JSX *between
  its tags* as its `children`. The header renders the strand's icon/name/tagline
  and then drops `{children}` in place — meaning the header does not need to
  know what a "meta row" or "timeline" is. It just renders whatever it is given.
  This keeps the header purely presentational. (See
  [`Header/StrandDetailHeader.tsx`](./Header/StrandDetailHeader.tsx.md).)
- Likewise `StrandMetaRow` renders the `meta` fields and then `{children}` — and
  the child here is the `ProgressBeacon`. So the beacon visually sits inside the
  meta row, but the meta row is decoupled from it.
- The wiring of the shared state:
  - `ProgressBeacon` gets `expanded={disclosure.isOpen}` (so it can show
    "expand"/"collapse" and rotate its chevron) and
    `onToggle={disclosure.toggle}` (clicking it flips the state).
  - `ProgressTimeline` gets the *same* `expanded={disclosure.isOpen}` (so it
    knows whether to be open).
  - Both share `timelineId`: the beacon advertises `aria-controls={timelineId}`
    and the timeline's container has `id={timelineId}`. A screen-reader user
    activating the beacon knows which region it controls.

This is the classic **lifted-state + props-down/callbacks-up** data flow: state
lives in the parent, flows *down* as props, and changes come back *up* through
the `onToggle` callback.

```tsx
          <AbstractSection text={strand.abstract ?? ''} sectionNumber="01" />
          <ObjectivesSection items={strand.objectives ?? []} sectionNumber="02" />
          <ResearchQuestionsSection items={strand.researchQuestions ?? []} sectionNumber="03" />
          <StrandCTARow ctas={strand.ctas ?? []} />
```

- `strand.abstract ?? ''` uses the **nullish coalescing operator** `??`: "use
  `strand.abstract`, but if it is `null`/`undefined`, fall back to `''`." This
  matters because those fields are *optional* on `Strand` (see
  [`types.ts`](./types.ts.md) / `src/data/strands.ts`). Each section component
  then renders nothing if it receives an empty string/array, so absent data
  cleanly omits the section.
- The hardcoded `"01" / "02" / "03"` are the section numbers shown as `§ 01`
  etc. by `SectionTitle`.

```tsx
        </article>
      </main>
    </>
  )
}
```

Close tags, matched in reverse order. The component returns one Fragment
containing `<nav>` and `<main>`.

## Libraries & APIs used

- **React**: function components, JSX, Fragments (`<>`), `useId`, custom hooks,
  `children` composition.
- **CSS Modules** via `import styles from './StrandDetail.module.css'`.
- TypeScript: typed props via destructuring + `StrandDetailProps`.

## Concepts to learn here

- **Composition over configuration.** The page is assembled from small,
  single-purpose components; layout is just the order they appear in.
- **`children` as a slot.** Header and MetaRow accept arbitrary JSX so they stay
  presentational and reusable.
- **Lifting state up.** The disclosure boolean lives in the lowest common
  ancestor of the components that need it, then flows down as props with a
  callback flowing back up.
- **Accessible disclosure wiring** with `useId` + `aria-controls` + `id`.
- **Optional data handling** with `?.` consumers and `?? default` fallbacks.

## How to edit it safely

- **To add a new section** (e.g. "Methods"): create a `Methods*` component pair
  under `Sections/` (mirror `AbstractSection`), then add one line here in the
  desired order with `text={strand.methods ?? ''}` and a `sectionNumber`. Add
  the `methods?` field to `Strand` in `src/data/strands.ts`.
- **To reorder sections**, just move the JSX lines; nothing else depends on
  order except the literal `sectionNumber` strings (renumber those).
- **To change what controls the timeline** (e.g. open by default): pass an
  initial value through `useDisclosure(true)` — see
  [`hooks/useDisclosure.ts`](./hooks/useDisclosure.ts.md).
- **Do not** put styling logic or data transformation here; push it into the
  child or into `src/data/strands.ts`. Keeping this file "composition only" is
  the whole point.
- Gotcha: the beacon and timeline must keep receiving the *same* `disclosure`
  object's `isOpen`/`toggle` and the *same* `timelineId`, or the trigger/panel
  link breaks.
