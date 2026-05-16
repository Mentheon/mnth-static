# Mentheon Site — Implemented Requirements

A reverse-engineered requirements register for the **live Vite + React 18 + TypeScript SPA** (`src/` + build config). Every row was derived from the actual source and cross-checked against the per-file docs in `docs/`. Legacy `mnth/` and standalone `*.html` files are out of scope.

> Scope note: this records what **is implemented**, not a backlog. Items that exist in code but are unreachable, or are wired to nothing, are recorded with an honest status so the register doubles as a traceability matrix.

## Status legend

| Status | Meaning |
|--------|---------|
| `Implemented` | Built and reachable/working in the live app. |
| `Partial` | Works, but with a meaningful limitation or uneven coverage (explained in Description). |
| `Stub (not wired)` | UI/handler exists but its effect is wired to nothing (no-op / preference discarded). |
| `Built, not routed` | Component is fully built but never imported/reached by any live route. |
| `Convention only` | Achieved by discipline/config, not enforced by tooling. |
| `Absent (gap)` | Recognised quality the codebase does **not** provide; recorded so the gap is tracked. |
| `Planned (TODO)` | Agreed future requirement, not yet implemented (carried in the normal tables; lifecycle is in the Status column, not the ID). |

## Summary

- **Functional:** 55 requirements — 45 `Implemented`, 4 `Built, not routed` (HeroSection/typewriter, MobileStrandList, useIsMobile consumers), 2 `Stub (not wired)` (sound gate, roadmap node clicks), 2 `Partial`, 2 `Planned (TODO)` (FR-054, FR-055).
- **Non-functional:** 48 requirements — 1 `Planned (TODO)` (NFR-048); strong on performance hygiene, maintainability and build/deploy; honest gaps in **automated testing**, **error boundaries**, and **build-time content-link validation**; accessibility is real but uneven.
- **Planned (TODO) items:** FR-054 (theme-aware logos), FR-055 (mobile → list view + lightweight logo), NFR-048 (consistent top bar under text scaling). Filter the Status column for `Planned (TODO)` to see all open work.

### Accuracy flags (read these)
- `HomeMashup` **is** live (ConceptView section A). The in-code "legacy home" comment refers to an older, removed home composition, not this usage.
- `ScrollLockView` **is** reachable via `#scrolllock` (and `#helix3d?skipIntro=true` skips the intro).
- `docs/src/App.tsx.md` is stale vs the real `src/App.tsx` (it predates `ScrollLockView`, `skipIntro`, the dev re-render key). Routing rows below were sourced from the live source, not that doc.
- The only true no-op stubs are the **sound/silent gate** (preference discarded) and **roadmap node clicks** (`console.log` only).

---

## Functional Requirements

### Navigation & Routing

| FR-ID | Requirement | Description | Status | Key files |
|-------|-------------|-------------|--------|-----------|
| FR-001 | Hash-based SPA routing | The whole site is one page; the view is derived entirely from `window.location.hash`. A `useHash` hook subscribes to `hashchange` and re-renders, with no router library. | Implemented | src/App.tsx:11-19,35-43 |
| FR-002 | Route map across views | `#helix3d` / `#helix3d?skipIntro=true` → Helix3D; `#scrolllock` → ScrollLockView; `#who` → WhoPage; `#concept` and any unmatched hash → ConceptView; `#strand`/`#strand/<id>` → StrandDetail; `#marginalia`(/`<slug>`/`?strand=`) → Marginalia. | Implemented | src/App.tsx:28-97 |
| FR-003 | Deep-linkable strand detail | `#strand/<id>` resolves the matching strand; falls back to the first strand with `progress` data, else the first strand; only renders detail if the strand has `progress`, else falls through to ConceptView. | Implemented | src/App.tsx:60-64,84-85 |
| FR-004 | Deep-linkable article slug + strand filter query | `#marginalia/<slug>` opens an article; `#marginalia?strand=<id>` filters the list; query parsed with `URLSearchParams`, works with path-style hash. | Implemented | src/App.tsx:69-77, src/components/Marginalia/List/StrandFilter.tsx:31-44 |
| FR-005 | Persistent primary navigation header | Shared `Header` (logo + `GridNav`) on all non-3D routes; Helix3D/ScrollLockView render standalone. | Implemented | src/App.tsx:46-96, src/components/Header.tsx, src/components/GridNav.tsx |
| FR-006 | Nav active-state highlighting | `GridNav` highlights Home/News/Who from the current hash with a corner-crop active marker. | Implemented | src/components/GridNav.tsx:12-41 |
| FR-007 | Nav links to unrouted destinations | `About`/`What?`/`Why?` links point to hashes with no route branch and silently fall back to ConceptView. | Partial | src/components/GridNav.tsx:3-10, src/App.tsx:35-43 |
| FR-008 | Compacting / scroll-aware header | Header collapses to compact after the first segment (ConceptView `mentheon:section` event) or a viewport-scroll threshold elsewhere, with hysteresis; publishes height to `--header-h`. | Implemented | src/components/Header.tsx:21-92 |
| FR-009 | Dev-only force-remount control | In dev builds a "⟳ re-render" button bumps a key to remount the view; stripped from production via `import.meta.env.DEV`. | Implemented | src/App.tsx:26,104-127 |
| FR-054 | Theme-aware logos (dark / light) | The site has a light/dark theme (`data-theme` on `<html>`, read at `Helix3D.tsx:178`; scene re-tints from CSS tokens) but the header logo is a single static asset that does not swap with the theme. Provide distinct dark/light logo variants selected by the active theme. Extends FR-012. | Planned (TODO) | src/components/Header.tsx:110-113 (`web-svg.svg`); assets public/web-svg.svg, public/rod-only.svg, public/helix-logo.svg; theme src/components/Helix3D/Helix3D.tsx:153-178 |

### 3D Helix Experience

| FR-ID | Requirement | Description | Status | Key files |
|-------|-------------|-------------|--------|-----------|
| FR-010 | Helix3D WebGL scene | `#helix3d` renders a full-viewport three.js "Rod of Asclepius": metal staff, serpent tube on a helix curve, glowing nodes, three-point lighting, transparent canvas. | Implemented | src/components/Helix3D/Helix3D.tsx |
| FR-011 | Helix3D node hover/pick + labels | Pointer raycasting activates nodes on hover; HTML labels positioned by projecting 3D positions to screen with depth fade. | Implemented | src/components/Helix3D/Helix3D.tsx |
| FR-012 | Helix3D chrome | Custom cursor, marquee, list-view toggle, light/dark theme switch (recolours from CSS vars), peek panel, menu overlay, page-transition sweep. | Implemented | src/components/Helix3D/Helix3D.tsx |
| FR-013 | Helix3D skip-intro path | `skipIntro` (dev remount key, or `#helix3d?skipIntro=true`) bypasses loader/gate and starts the scene directly. | Implemented | src/App.tsx:36-37,51 |
| FR-014 | GPU/lifecycle teardown | Scene, geometries, materials, renderer, listeners, RAF, timers disposed on unmount; survives StrictMode double-mount. | Implemented | src/components/Helix3D/Helix3D.tsx:1290-1311 |
| FR-015 | ScrollLockView frozen variant | `#scrolllock` renders a scroll-locked traversal of the coil: wheel/swipe steps one node, rotor snaps, camera dollies in. | Implemented | src/App.tsx:38,52-54, src/components/Helix3D/ScrollLockView.tsx |
| FR-016 | Self-contained 3D strand content | Both 3D views carry their own six-strand content (separate from `src/data/strands.ts`); `id` is identity only, not wired to navigation. | Partial | src/components/Helix3D/ScrollLockView.tsx:48-84 |

### Intro / Gate

| FR-ID | Requirement | Description | Status | Key files |
|-------|-------------|-------------|--------|-----------|
| FR-017 | Intro loader splash | anime.js loader fills the Mentheon wordmark via animated SVG clip, "filling · N%" caption, welcome line, then fades. | Implemented | src/components/Helix3D/HelixIntro.tsx:54-152 |
| FR-018 | Skippable loader | "skip ↦" button appears ~600 ms in; click or natural completion finishes once (idempotent) and resolves boot. | Implemented | src/components/Helix3D/HelixIntro.tsx:68,112-150 |
| FR-019 | Sound/silent gate | Gate offers "enter with sound" / "enter without sound"; either dismisses and starts the scene. **The chosen preference is not persisted or used — no audio is wired anywhere in the codebase.** | Stub (not wired) | src/components/Helix3D/HelixIntro.tsx:71-89,156-171 |

### Strands

| FR-ID | Requirement | Description | Status | Key files |
|-------|-------------|-------------|--------|-----------|
| FR-020 | Strand detail page composition | Breadcrumb, framed article with corner crops, header, meta row, progress beacon/timeline, Abstract (01), Objectives (02), Research Questions (03), CTA row — driven by `src/data/strands.ts`. | Implemented | src/components/StrandDetail/StrandDetail.tsx:16-60 |
| FR-021 | Strand header & meta row | Header shows identity; MetaRow renders meta items (since/collaborators/phase) from `strand.meta`. | Implemented | src/components/StrandDetail/Header/StrandDetailHeader.tsx, src/components/StrandDetail/MetaRow/StrandMetaRow.tsx, src/data/strands.ts:47-51 |
| FR-022 | Expandable progress disclosure | ProgressBeacon toggles the expanded timeline; `aria-controls`/`aria-expanded` wired via `useDisclosure`. | Implemented | src/components/StrandDetail/StrandDetail.tsx:17,42-49, src/components/StrandDetail/hooks/useDisclosure.ts |
| FR-023 | Animated SVG progress timeline | Draws phase nodes along a spine, strokes the active path, then fades a dashed projected path with arrowhead; entrance animates on expand. | Implemented | src/components/StrandDetail/Progress/ProgressTimeline.tsx:30-148, src/components/StrandDetail/Progress/useProgressEntrance.ts |
| FR-024 | Progress output branches with tooltips | Each `ProgressOutput` renders as a branch with a hover tooltip showing meta/description. | Implemented | src/components/StrandDetail/Progress/ProgressTimeline.tsx:117-127, src/components/StrandDetail/Progress/ProgressBranch.tsx, src/components/StrandDetail/Progress/ProgressBranchTooltip.tsx |
| FR-025 | Strand CTAs | CTA row renders primary/secondary buttons with optional arrows from `strand.ctas`. | Implemented | src/components/StrandDetail/CTAs/StrandCTARow.tsx, src/components/StrandDetail/CTAs/CTAButton.tsx, src/data/strands.ts:39-44 |
| FR-026 | Reduced-motion respect | `useReducedMotion` lets progress/entrance animations honour the user's preference. | Implemented | src/components/StrandDetail/hooks/useReducedMotion.ts |
| FR-027 | StrandPanel selectable detail card (ConceptView) | `RDStrands` bubbles toggle a strand; `StrandPanel` shows its themes and can be closed. | Implemented | src/components/RDStrands.tsx:13-67, src/components/StrandPanel.tsx, src/components/ConceptView.tsx:746-796 |

### Marginalia (Notes)

| FR-ID | Requirement | Description | Status | Key files |
|-------|-------------|-------------|--------|-----------|
| FR-028 | Markdown content pipeline | All `src/content/marginalia/*.md` glob-loaded once at module load, frontmatter parsed, body rendered, sorted newest-first. | Implemented | src/lib/marginalia/loadArticles.ts:37-80, src/lib/marginalia/parseFrontmatter.ts |
| FR-029 | Markdown → HTML + syntax highlighting | Scoped `marked` instance (GFM, no hard breaks); code blocks highlighted via highlight.js common bundle with on-brand classes. | Implemented | src/lib/marginalia/renderMarkdown.ts:1-36 |
| FR-030 | Marginalia list view | Header/tagline + grid of article cards (title, date, type, summary), newest-first. | Implemented | src/components/Marginalia/List/MarginaliaList.tsx:28-76, src/components/Marginalia/List/ArticleCard.tsx |
| FR-031 | Strand filter chips with counts | "All" + per-strand chips show counts and filter the grid; each chip is a deep-linkable `#marginalia?strand=<id>` anchor. | Implemented | src/components/Marginalia/List/StrandFilter.tsx:15-55, src/components/Marginalia/List/MarginaliaList.tsx:17-35 |
| FR-032 | Article detail view | Non-null slug renders the matching article (meta + rendered body); frontmatter `strands:` tags align with real strand ids so filtering works. | Implemented | src/components/Marginalia/Marginalia.tsx:11-45, src/components/Marginalia/Detail/MarginaliaArticle.tsx, src/content/marginalia/*.md |
| FR-033 | Article not-found fallback | Unknown slug renders a styled 404 stub with a "back to marginalia" link. | Implemented | src/components/Marginalia/Marginalia.tsx:19-43 |
| FR-034 | Empty-filter messaging | A strand filter with no articles shows a contextual "No articles tagged with X yet" message. | Implemented | src/components/Marginalia/List/MarginaliaList.tsx:60-65 |
| FR-035 | Frontmatter resilience | Missing/unknown `type` → `note`; missing title/author/summary default safely; never throws on malformed editorial. | Implemented | src/lib/marginalia/loadArticles.ts:21-29,55-68 |
| FR-036 | Marginalia tab affordance | A persistent edge tab gives quick access to the notes feature. | Implemented | src/components/MarginaliaTab.tsx |

### People / Who

| FR-ID | Requirement | Description | Status | Key files |
|-------|-------------|-------------|--------|-----------|
| FR-037 | People page (`#who`) | WhoPage renders the team from `src/data/people.ts`: each person a clickable icon disc with name + credentials. | Implemented | src/components/WhoPage.tsx:8-72, src/data/people.ts:14-40 |
| FR-038 | Person selection / detail panel | Clicking a person toggles selected state (others dim/collapse) and opens a closable `PersonPanel` with their themes. | Implemented | src/components/WhoPage.tsx:11-69, src/components/PersonPanel.tsx |

### Home / Concept

| FR-ID | Requirement | Description | Status | Key files |
|-------|-------------|-------------|--------|-----------|
| FR-039 | ConceptView default route | Default/`#concept` renders a 3–4 section scroll-snap carousel with side pill nav; pills reflect and jump to the active section. | Implemented | src/App.tsx:88-94, src/components/ConceptView.tsx:611-629 |
| FR-040 | Section A: HomeMashup + headline | Section A embeds `HomeMashup` with the "Digital health is moving… fast" headline and a scramble/typewriter entrance. | Implemented | src/components/ConceptView.tsx:106-152,631-640, src/components/HomeMashup/HomeMashup.tsx |
| FR-041 | HomeMashup scene carousel | Auto-advances ~11 healthtech vignette scenes on per-scene timers, loops, with `Readout` + `CarouselPills`. Live via ConceptView section A. | Implemented | src/components/HomeMashup/HomeMashup.tsx:34-90, src/components/ConceptView.tsx:639 |
| FR-042 | Section A live ECG trace | Scrolling PQRST ECG path whose amplitude tracks recent mouse displacement (still → flat; fast → tall R-spikes). | Implemented | src/components/ConceptView.tsx:166-364 |
| FR-043 | Section B: animated service roadmap | Research→Design→Development timeline draws on (line, ticks, chevrons, nodes, brace, Consultancy satellite, labels) with a traversing breathing blob. | Implemented | src/components/ConceptView.tsx:367-585,642-729 |
| FR-044 | Roadmap node clicks | Clicking roadmap nodes is a WIP no-op that only `console.log`s; no per-domain view wired. | Stub (not wired) | src/components/ConceptView.tsx:587-591,690-725 |
| FR-045 | Section C: strand picker + Helix | `RDStrands` picker + 2D `Helix`; selecting a strand mounts section D (`StrandPanel`) as its own snap stop with a "See more" affordance. | Implemented | src/components/ConceptView.tsx:731-796 |
| FR-046 | Section ↔ Header coordination | ConceptView broadcasts the active section on a `mentheon:section` document event so Header folds compact without prop-drilling. | Implemented | src/components/ConceptView.tsx:55-66, src/components/Header.tsx:63-89 |
| FR-047 | Strand-hover broadcast | Hovering a strand bubble dispatches `mentheon:strand-hover` (consumed e.g. by logo-minimise behaviour). | Implemented | src/components/RDStrands.tsx:47-52 |
| FR-048 | Hero section + typewriter effect | `HeroSection`/`HeroIconsWithContent` (the only `useTypewriter` consumer) is fully built but not imported by any route — unreachable. | Built, not routed | src/components/HeroSection.tsx, src/components/HeroIconsWithContent.tsx:3,34, src/hooks/useTypewriter.ts |

### Mobile / Responsive (functional)

| FR-ID | Requirement | Description | Status | Key files |
|-------|-------------|-------------|--------|-----------|
| FR-049 | Reactive mobile breakpoint hook | `useIsMobile` (default 720 px) is reactive and SSR-safe, but not imported by ConceptView or any component — currently unused. | Built, not routed | src/lib/useIsMobile.ts:15-35 |
| FR-050 | Mobile strand list substitute | `MobileStrandList` is a built phone-friendly stacked list sharing ConceptView's `openId/onSelect` contract, but ConceptView never imports it. | Built, not routed | src/components/MobileStrandList.tsx, src/components/ConceptView.tsx:746-749 |
| FR-051 | Mobile-responsive layouts (CSS) | Responsive behaviour that ships is CSS-driven: Helix.css clamps shrink the spiral; module CSS adapts framed pages; per-segment mobile scroll. | Implemented | src/components/Helix.css, src/components/ConceptView.css, src/components/ConceptView.tsx:738-751 |
| FR-055 | Mobile viewport → confined list view + lightweight logo | On mobile, confine the experience to the **list view** instead of the 3D rod+strands helix, plus a lightweight logo. Rationale: porting the full rod+strands WebGL to mobile is unlikely/not worth it; list view + light logo is the lowest-cost path. Mostly a wiring job — connects the already-built but unrouted FR-049/FR-050. | Planned (TODO) | Wires FR-049 (src/lib/useIsMobile.ts), FR-050 (src/components/MobileStrandList.tsx) into src/components/ConceptView.tsx:746-749; lightweight logo via src/components/Header.tsx + public/rod-only.svg |

### Data & Content

| FR-ID | Requirement | Description | Status | Key files |
|-------|-------------|-------------|--------|-----------|
| FR-052 | Strand dataset | Canonical strand "database" (incl. `kindred`/`vitalis`/`vitrix`) with themes, optional abstract/objectives/research-questions/CTAs/meta and rich `progress`; consumed by StrandDetail, Marginalia filter, ConceptView. | Implemented | src/data/strands.ts |
| FR-053 | People & marginalia corpora | `PEOPLE` array (id/name/credentials/tagline/href/themes) for WhoPage; five authored markdown articles with frontmatter form the news corpus. | Implemented | src/data/people.ts:14-40, src/content/marginalia/*.md |

---

## Non-Functional Requirements

### Performance

| NFR-ID | Category | Requirement | Description / evidence | Status | Key files |
|--------|----------|-------------|------------------------|--------|-----------|
| NFR-001 | Performance | rAF-driven render loops | All continuous animation uses `requestAnimationFrame` (never `setInterval`) with paired `cancelAnimationFrame` in cleanup. | Implemented | src/components/Helix3D/Helix3D.tsx:937,1216,1295, src/components/helixScene.ts:1361,1391, src/components/ConceptView.tsx:339-346 |
| NFR-002 | Performance | three.js GPU resource teardown | On unmount the scene is traversed and every geometry/material plus the renderer is `dispose()`d and the canvas removed. | Implemented | src/components/Helix3D/Helix3D.tsx:1302-1311, src/components/Helix3D/ScrollLockView.tsx:1077-1085 |
| NFR-003 | Performance | Render-loop pause guards | `destroyed`/`animationActive` flags stop the loop on teardown so a fast unmount cannot keep WebGL running. | Implemented | src/components/Helix3D/Helix3D.tsx:1261,1293-1295 |
| NFR-004 | Performance | Markdown pipeline runs once | All `*.md` globbed, parsed and rendered once at module load; navigation never re-runs marked/highlight.js. | Implemented | src/lib/marginalia/loadArticles.ts:37-66 |
| NFR-005 | Performance | Trimmed highlight bundle | Imports `highlight.js/lib/common` not the full grammar set (≈200 KB saved, commented). | Implemented | src/lib/marginalia/renderMarkdown.ts:11 |
| NFR-006 | Performance | Stable memoised computation | `useMemo` keeps derived layout/data stable in the progress timeline and hero icons; usage sparse, adequate for scope. | Partial | src/components/StrandDetail/Progress/ProgressTimeline.tsx, src/components/HeroIconsWithContent.tsx |
| NFR-007 | Performance | Declarative anime.js timelines | Entrance/pulse use anime.js timelines + staggers with one-shot ref guards, not manual frame math. | Implemented | src/components/StrandDetail/Progress/useProgressEntrance.ts:41-101, src/components/StrandDetail/Progress/usePulse.ts:30 |
| NFR-008 | Performance | Font preconnect / swap | `preconnect` to Google Fonts + `display=swap` to avoid invisible-text blocking. | Implemented | index.html:6-12 |

### Accessibility

| NFR-ID | Category | Requirement | Description / evidence | Status | Key files |
|--------|----------|-------------|------------------------|--------|-----------|
| NFR-009 | Accessibility | prefers-reduced-motion (JS) | `useReducedMotion` reads `matchMedia` and live-subscribes (old-Safari `addListener` fallback); used by progress entrance + pulse. | Implemented | src/components/StrandDetail/hooks/useReducedMotion.ts |
| NFR-010 | Accessibility | prefers-reduced-motion (CSS) | Reduced-motion media query only in 2 of ~44 stylesheets; the WebGL/anime home & helix experiences are not gated by it. | Partial | src/components/ConceptView.css:493, src/components/StrandDetail/Header/StrandDetailHeader.module.css:81 |
| NFR-011 | Accessibility | Disclosure ARIA wiring | Expand/collapse triggers wire `aria-expanded` + `aria-controls` to controlled regions. | Implemented | src/components/StrandDetail/Progress/ProgressBeacon.tsx:69-70, src/components/WhoPage.tsx:43-44, src/components/MobileStrandList.tsx:34-35 |
| NFR-012 | Accessibility | Unique control IDs | No React `useId`; `aria-controls` targets are hard-coded string IDs — fine for singletons, not collision-safe if duplicated. | Partial | src/components/WhoPage.tsx:44, src/components/MobileStrandList.tsx:35 |
| NFR-013 | Accessibility | Keyboard operability | Beacon toggles on Enter/Space; branches `tabIndex={0}` with `onFocus`; Helix3D supports Escape. No global focus-trap/skip-link. | Partial | src/components/StrandDetail/Progress/ProgressBeacon.tsx:46,72, src/components/StrandDetail/Progress/ProgressBranch.tsx:103-105, src/components/Helix3D/Helix3D.tsx:694 |
| NFR-014 | Accessibility | Semantic HTML & landmarks | `<nav aria-label>`, `<main>`, `<header>`, `<article>`, `<button>`, headings; decorative elements `aria-hidden`. | Implemented | src/components/GridNav.tsx:26, src/components/Marginalia/Detail/MarginaliaArticle.tsx:19 |
| NFR-015 | Accessibility | Accessible names on icon controls | Icon-only buttons/regions carry `aria-label`; panels toggle `aria-hidden` with open state. | Implemented | src/components/StrandPanel.tsx:15,20, src/components/PersonPanel.tsx:15,20, src/components/MarginaliaTab.tsx:72 |
| NFR-016 | Accessibility | User-controlled text scaling | Rem-based text-scale control persisted to `localStorage`, clamped 0.85–1.4, applied to `<html>` before first paint. | Implemented | src/lib/textScale.ts, src/main.tsx:5,8 |

### Responsive

| NFR-ID | Category | Requirement | Description / evidence | Status | Key files |
|--------|----------|-------------|------------------------|--------|-----------|
| NFR-017 | Responsive | Reactive viewport hook | `useIsMobile(720)` wraps `matchMedia`, live-subscribes, SSR-safe (desktop default until effect). | Implemented | src/lib/useIsMobile.ts |
| NFR-018 | Responsive | Mobile-specific component | Dedicated stacked-list mobile component exists to replace the helix/carousel below the breakpoint. | Implemented | src/components/MobileStrandList.tsx, src/components/MobileStrandList.module.css |
| NFR-019 | Responsive | Fluid sizing with clamp() | Fluid typography/spacing via `clamp()` across ~9 stylesheets. | Implemented | src/components/Marginalia/List/MarginaliaList.module.css, src/components/StrandDetail/Header/StrandDetailHeader.module.css, src/components/Helix3D/helix3d.css |
| NFR-020 | Responsive | Intrinsic responsive grids | Card/objective/theme grids use `repeat(auto-fit, minmax())` so they reflow without breakpoints. | Implemented | src/components/StrandDetail/Sections/ResearchQuestionsSection.module.css:8, src/components/Marginalia/List/MarginaliaList.module.css:65 |
| NFR-021 | Responsive | Breakpoint media queries | Width/height queries (1080/880/720/640/480 px + `max-height:560px` hatch) across many modules. | Implemented | src/components/ConceptView.css:35,581,600, src/components/Header.module.css:98, src/components/StrandDetail/StrandDetail.module.css:63,70 |
| NFR-022 | Responsive | Viewport meta | `width=device-width, initial-scale=1.0` declared. | Implemented | index.html:5 |
| NFR-048 | Responsive | Consistent top bar under text scaling | Text enlarge/decrease is in progress (NFR-016). Ensure the top bar keeps a consistent format/layout across the full text-scale range (0.85–1.4): no overflow, wrap, or `--header-h` jump as the user scales text. Hardens NFR-016 against FR-005/FR-008. | Planned (TODO) | src/lib/textScale.ts, src/main.tsx:5,8, src/components/Header.tsx:35, src/components/Header.module.css, src/components/GridNav.tsx |

### Maintainability

| NFR-ID | Category | Requirement | Description / evidence | Status | Key files |
|--------|----------|-------------|------------------------|--------|-----------|
| NFR-023 | Maintainability | TypeScript strict mode | `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`; project-references split. | Implemented | tsconfig.app.json, tsconfig.node.json, tsconfig.json |
| NFR-024 | Maintainability | CSS Modules scoping | ~40 `*.module.css` vs 4 global sheets, giving locally-scoped class names by default. | Implemented | src/components/**/*.module.css; global: src/index.css, src/components/Helix.css, src/components/ConceptView.css, src/components/Helix3D/helix3d.css |
| NFR-025 | Maintainability | Design tokens via CSS variables | Brand palette/interaction constants centralised as `:root` custom properties. | Implemented | src/index.css:1-11 |
| NFR-026 | Maintainability | Barrel files / public API | Feature folders export through `index.ts` barrels. | Implemented | src/components/StrandDetail/index.ts, src/components/Marginalia/index.ts, src/components/HomeMashup/index.ts |
| NFR-027 | Maintainability | Typed data layer | Strands/people modelled with explicit interfaces and string-literal unions, not loose objects. | Implemented | src/data/strands.ts:1-40, src/data/people.ts |
| NFR-028 | Maintainability | Content auto-discovery | New articles added by dropping a `.md`; `import.meta.glob(eager, ?raw)` auto-discovers with resilient fallbacks. | Implemented | src/lib/marginalia/loadArticles.ts:14-66, src/lib/marginalia/parseFrontmatter.ts |
| NFR-029 | Maintainability | Component composition | Deeply decomposed feature trees + small single-purpose hooks (`useDisclosure`, `usePulse`, `useProgressEntrance`). | Implemented | src/components/StrandDetail/**, src/components/Marginalia/**, src/components/StrandDetail/hooks/useDisclosure.ts |
| NFR-030 | Maintainability | Scoped third-party config | Private `Marked` instance so renderer/GFM overrides don't leak to the global import. | Implemented | src/lib/marginalia/renderMarkdown.ts:27-32 |

### Build & Deployment

| NFR-ID | Category | Requirement | Description / evidence | Status | Key files |
|--------|----------|-------------|------------------------|--------|-----------|
| NFR-031 | Build & Deployment | Vite dev/build/preview pipeline | `dev` (Vite), `build` (`tsc && vite build`), `preview`; React plugin configured. | Implemented | package.json:6-9, vite.config.ts |
| NFR-032 | Build & Deployment | Typecheck gates the build | `build` runs `tsc` before `vite build`, so a type error fails the prod build/CI. | Implemented | package.json:8, .github/workflows/deploy.yml |
| NFR-033 | Build & Deployment | CI deploy to GitHub Pages | Actions on push to `main`: checkout → Node 20 → `npm ci` → build → upload-pages-artifact → deploy-pages; concurrency cancel-in-progress. | Implemented | .github/workflows/deploy.yml |
| NFR-034 | Build & Deployment | Custom domain | `CNAME` pins apex `mentheon.com`; Vite `base:'/'` matches root-domain hosting. | Implemented | public/CNAME, vite.config.ts:5 |
| NFR-035 | Build & Deployment | Reproducible installs | CI uses `npm ci` against committed `package-lock.json`. | Implemented | .github/workflows/deploy.yml, package-lock.json |
| NFR-036 | Build & Deployment | Dev code stripped from prod | Force-remount debug button gated on `import.meta.env.DEV`, tree-shaken from prod. | Implemented | src/App.tsx:106-111 |

### Browser / Runtime

| NFR-ID | Category | Requirement | Description / evidence | Status | Key files |
|--------|----------|-------------|------------------------|--------|-----------|
| NFR-037 | Browser/Runtime | SPA hash routing, no server config | Routing is `window.location.hash` via `hashchange` — no history API, so Pages needs no rewrite/404 fallback. | Implemented | src/App.tsx |
| NFR-038 | Browser/Runtime | StrictMode double-invoke safe | `<StrictMode>` + idempotent init guards + full cleanup so dev double-invoke/remount rebuilds WebGL/loops cleanly. | Implemented | src/main.tsx, src/components/Helix3D/Helix3D.tsx:128-144,1290-1311, src/components/HomeMashup/scenes/RingsScene.tsx:116 |
| NFR-039 | Browser/Runtime | SSR-safe window guards | `typeof window === 'undefined'` / `!window.matchMedia` guards in viewport/reduced-motion hooks; `localStorage` in try/catch. | Implemented | src/lib/useIsMobile.ts:17, src/components/StrandDetail/hooks/useReducedMotion.ts:8,13, src/lib/textScale.ts |
| NFR-040 | Browser/Runtime | Legacy media-query fallback | `useReducedMotion` falls back to deprecated `addListener/removeListener` for older Safari. | Implemented | src/components/StrandDetail/hooks/useReducedMotion.ts:18-22 |

### Security

| NFR-ID | Category | Requirement | Description / evidence | Status | Key files |
|--------|----------|-------------|------------------------|--------|-----------|
| NFR-041 | Security | Markdown/SVG HTML trust model | `dangerouslySetInnerHTML` used for article bodies + inline loader SVG. Trust is build-time-author-only (repo-committed content); **no runtime sanitization** (e.g. DOMPurify). Acceptable first-party, risk if content ever becomes user-supplied. | Partial | src/components/Marginalia/Detail/ArticleBody.tsx:8-12, src/components/Helix3D/HelixIntro.tsx:66 |
| NFR-042 | Security | No secrets in client bundle | Fully static site; no API keys/auth/backend calls. Deploy uses GitHub OIDC (`id-token: write`), no stored creds. | Implemented | .github/workflows/deploy.yml |

### Reliability / Testing

| NFR-ID | Category | Requirement | Description / evidence | Status | Key files |
|--------|----------|-------------|------------------------|--------|-----------|
| NFR-043 | Reliability/Testing | Automated test suite | No test files and no runner/framework (no vitest/jest/testing-library/playwright). Quality relies on `tsc` only. | Absent (gap) | package.json (no test deps/script) |
| NFR-044 | Reliability/Testing | Error boundaries | No React error boundary anywhere; a render throw in the heavy WebGL views white-screens the whole SPA. | Absent (gap) | (none in src/) |
| NFR-045 | Reliability/Testing | Content cross-link integrity | Article `strands` frontmatter references strand IDs in `data/strands.ts`, unvalidated at build; a typo silently yields an unfilterable article. | Absent (gap) | src/lib/marginalia/loadArticles.ts:50-58, src/data/strands.ts |
| NFR-046 | Reliability/Testing | Graceful content degradation | Markdown/frontmatter pipeline never throws: missing fence → whole file as body; unknown type → `note`; missing fields → defaults. | Implemented | src/lib/marginalia/parseFrontmatter.ts:28-39, src/lib/marginalia/loadArticles.ts:22-31 |
| NFR-047 | Reliability/Testing | Robust effect cleanup | Async loops (typewriter, rAF scenes, anime timelines) use `cancelled`/`destroyed` flags + listener removal to prevent post-unmount updates/leaks. | Implemented | src/hooks/useTypewriter.ts, src/components/Helix3D/Helix3D.tsx:1293-1311, src/components/MarginaliaTab.tsx:56-61 |

---

## Top recorded gaps (for triage)

1. **No automated tests** (NFR-043) — only `tsc` guards regressions.
2. **No error boundary** (NFR-044) — a single render throw in Helix3D/ConceptView blanks the entire site.
3. **No build-time content-link validation** (NFR-045) — mistyped strand tags silently disappear from filters.
4. **Reduced-motion only covers the progress timeline** (NFR-010) — the most motion-heavy surfaces (WebGL helix, anime home) ignore the preference.
5. **Dead/unrouted code** (FR-048/049/050) — HeroSection+typewriter, MobileStrandList, and `useIsMobile` are built but unreachable; either wire them up or remove to reduce confusion.
6. **Two no-op stubs** (FR-019 sound gate, FR-044 roadmap clicks) — present in the UI but wired to nothing.
