# Codebase Learning Docs — Index

Welcome. This `docs/` tree is a guided tour of the **mnth-static** site (a Vite + React 18 + TypeScript single-page app) written for someone learning HTML, CSS, JavaScript, TypeScript, React, Vite, and this project's libraries *by reading real code*.

## How these docs are organised (the convention)

**Every documentation file mirrors the path of the source file it explains, with `.md` appended.**

- Source `vite.config.ts` → doc `docs/vite.config.ts.md`
- Source `src/App.tsx` → doc `docs/src/App.tsx.md`
- Source `src/components/Header.tsx` → doc `docs/src/components/Header.tsx.md`

So to find the docs for any file, take its path from the project root and look for the same path under `docs/` with `.md` on the end. Each per-file doc follows the same template: *What this file is → Line-by-line walkthrough → Libraries & APIs used → Concepts to learn → How to edit it safely.*

Start with **[LEARNING-GUIDE.md](./LEARNING-GUIDE.md)** — a from-scratch primer (Vite, ESM, TypeScript, React, CSS strategies, and every dependency) you should read before the per-file docs.

---

## Suggested reading order (for a learner)

1. **[LEARNING-GUIDE.md](./LEARNING-GUIDE.md)** — concepts primer; read this first.
2. **Foundations & Tooling** in this order: `package.json` → `vite.config.ts` → `tsconfig.json` → `tsconfig.app.json` → `tsconfig.node.json`. (How the project is built and configured.)
3. **`src/main.tsx`** — how the app boots.
4. **`src/index.css`** — the global styling/theming layer.
5. **`src/App.tsx`** — the root component and hash-based router; the map of the whole app.
6. **Data/Hooks/Lib** — the small reusable pieces `App` and components depend on.
7. **Core Components** — `Header`, then the view components (`ConceptView`, `WhoPage`, `StrandDetail`, `Marginalia`, `Helix`/`Helix3D`).
8. **HomeMashup**, **Marginalia**, **StrandDetail** sub-trees — deeper feature areas; read once the core flow makes sense.

---

## Foundations & Tooling

- [`package.json`](./package.json.md) — dependencies, scripts, the dev/build lifecycle
- [`vite.config.ts`](./vite.config.ts.md) — Vite dev server & bundler config
- [`tsconfig.json`](./tsconfig.json.md) — root TS config (project references)
- [`tsconfig.app.json`](./tsconfig.app.json.md) — TS rules for `src/` (browser/JSX)
- [`tsconfig.node.json`](./tsconfig.node.json.md) — TS rules for `vite.config.ts` (Node)
- [`src/main.tsx`](./src/main.tsx.md) — application entry point
- [`src/index.css`](./src/index.css.md) — global stylesheet & design tokens
- [`src/App.tsx`](./src/App.tsx.md) — root component + hash router

## Data / Hooks / Lib

- [`src/hooks/useTypewriter.ts`](./src/hooks/useTypewriter.ts.md) — typewriter text effect hook
- [`src/lib/useIsMobile.ts`](./src/lib/useIsMobile.ts.md) — responsive viewport hook
- [`src/lib/marginalia/loadArticles.ts`](./src/lib/marginalia/loadArticles.ts.md) — load Markdown articles
- [`src/lib/marginalia/parseFrontmatter.ts`](./src/lib/marginalia/parseFrontmatter.ts.md) — parse article frontmatter
- [`src/lib/marginalia/renderMarkdown.ts`](./src/lib/marginalia/renderMarkdown.ts.md) — Markdown → HTML rendering
- [`src/data/people.ts`](./src/data/people.ts.md) — people/team data
- [`src/data/strands.ts`](./src/data/strands.ts.md) — research "strands" data (used by `App.tsx`)
- [`src/content/marginalia/`](./src/content/marginalia/) — Markdown article source (per-file `.md.md` docs)

## Core Components

- [`src/components/Header.tsx`](./src/components/Header.tsx.md) · [`Header.module.css`](./src/components/Header.module.css.md)
- [`src/components/ConceptView.tsx`](./src/components/ConceptView.tsx.md) · [`ConceptView.css`](./src/components/ConceptView.css.md)
- [`src/components/WhoPage.tsx`](./src/components/WhoPage.tsx.md) · [`WhoPage.module.css`](./src/components/WhoPage.module.css.md)
- [`src/components/Helix.tsx`](./src/components/Helix.tsx.md) · [`Helix.css`](./src/components/Helix.css.md) · [`helixScene.ts`](./src/components/helixScene.ts.md)
- [`src/components/Helix3D/Helix3D.tsx`](./src/components/Helix3D/Helix3D.tsx.md) · [`helix3d.css`](./src/components/Helix3D/helix3d.css.md)
- [`src/components/HeroSection.tsx`](./src/components/HeroSection.tsx.md) · [`HeroSection.module.css`](./src/components/HeroSection.module.css.md)
- [`src/components/HeroIconsWithContent.tsx`](./src/components/HeroIconsWithContent.tsx.md) · [`HeroIconsWithContent.module.css`](./src/components/HeroIconsWithContent.module.css.md)
- [`src/components/GridNav.tsx`](./src/components/GridNav.tsx.md) · [`GridNav.module.css`](./src/components/GridNav.module.css.md)
- [`src/components/IconCircle.tsx`](./src/components/IconCircle.tsx.md) · [`IconCircle.module.css`](./src/components/IconCircle.module.css.md)
- [`src/components/RDStrands.tsx`](./src/components/RDStrands.tsx.md) · [`RDStrands.module.css`](./src/components/RDStrands.module.css.md)
- [`src/components/MobileStrandList.tsx`](./src/components/MobileStrandList.tsx.md) · [`MobileStrandList.module.css`](./src/components/MobileStrandList.module.css.md)
- [`src/components/PersonIcon.tsx`](./src/components/PersonIcon.tsx.md) · [`src/components/PersonPanel.tsx`](./src/components/PersonPanel.tsx.md)
- [`src/components/StrandIcon.tsx`](./src/components/StrandIcon.tsx.md) · [`src/components/StrandPanel.tsx`](./src/components/StrandPanel.tsx.md) · [`StrandPanel.module.css`](./src/components/StrandPanel.module.css.md)

## HomeMashup

- [`src/components/HomeMashup/HomeMashup.tsx`](./src/components/HomeMashup/HomeMashup.tsx.md)
- [`src/components/HomeMashup/CarouselPills.tsx`](./src/components/HomeMashup/CarouselPills.tsx.md)
- [`src/components/HomeMashup/Readout.tsx`](./src/components/HomeMashup/Readout.tsx.md)
- [`src/components/HomeMashup/index.ts`](./src/components/HomeMashup/index.ts.md)
- [`src/components/HomeMashup/types.ts`](./src/components/HomeMashup/types.ts.md)
- [`src/components/HomeMashup/utils/buildEcgPath.ts`](./src/components/HomeMashup/utils/buildEcgPath.ts.md)
- Scenes: [`CellScene`](./src/components/HomeMashup/scenes/CellScene.tsx.md) · [`DefibScene`](./src/components/HomeMashup/scenes/DefibScene.tsx.md) · [`EcgScene`](./src/components/HomeMashup/scenes/EcgScene.tsx.md) · [`EhrScene`](./src/components/HomeMashup/scenes/EhrScene.tsx.md) · [`HelixScene`](./src/components/HomeMashup/scenes/HelixScene.tsx.md) · [`MoleculeScene`](./src/components/HomeMashup/scenes/MoleculeScene.tsx.md) · [`MriScene`](./src/components/HomeMashup/scenes/MriScene.tsx.md) · [`NeuralScene`](./src/components/HomeMashup/scenes/NeuralScene.tsx.md) · [`PillsScene`](./src/components/HomeMashup/scenes/PillsScene.tsx.md) · [`RingsScene`](./src/components/HomeMashup/scenes/RingsScene.tsx.md) · [`VrPoseScene`](./src/components/HomeMashup/scenes/VrPoseScene.tsx.md)
- Associated `*.module.css` files mirror the same paths with `.md` appended.

## Marginalia

- [`src/components/Marginalia/`](./src/components/Marginalia/) — the news/articles UI (per-file docs mirror the source paths under this folder)
- Supporting lib lives under **Data/Hooks/Lib** above (`src/lib/marginalia/*`)
- Article content: [`src/content/marginalia/*.md`](./src/content/marginalia/)

## StrandDetail

- [`src/components/StrandDetail/`](./src/components/StrandDetail/) — the per-strand detail view (per-file docs mirror the source paths under this folder); entry rendered by `App.tsx` when the route is `#strand` / `#strand/<id>`

> Note: docs for files outside the Foundations & Tooling group are authored separately. If a link above 404s, that file's doc has not been written yet — the link still shows you the correct mirrored path it *will* live at.
