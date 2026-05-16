# `tsconfig.json`

## What this file is

This is the **root TypeScript configuration**. TypeScript needs to know *which* files to type-check and *with what rules*. Rather than putting everything in one big file, this project uses a **"solution-style" / project-references** setup: the root `tsconfig.json` itself compiles nothing — it just points at two sub-configurations, one for the browser app code (`tsconfig.app.json`) and one for the Node-side tooling like `vite.config.ts` (`tsconfig.node.json`). This split exists because app code and config code run in *different environments* (a browser vs. Node.js) and need slightly different settings.

## Line-by-line / block walkthrough

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

`"files": []` — an explicitly **empty** list of files. This tells TypeScript: "this particular config compiles zero files itself." Without this, TypeScript might try to default to including files and complain.

`"references": [...]` — this is the TypeScript **Project References** feature. Each `{ "path": "..." }` entry names another `tsconfig.*.json` that is a self-contained sub-project. The benefit: each sub-project can have its own compiler options, environment libraries, and `include` globs, and tools (and `tsc --build`) can type-check them independently and even cache results per project.

So the mental model is:

```
tsconfig.json          ← orchestrator only (no compilation)
├── tsconfig.app.json  ← rules for everything in src/ (browser, JSX/React)
└── tsconfig.node.json ← rules for vite.config.ts (Node environment)
```

When you run `npm run build` (`tsc && vite build`), `tsc` reads this root file, follows the references, and type-checks both sub-projects.

## Libraries & APIs used

- **typescript** — the TypeScript compiler (`tsc`) and language service that powers editor type-checking. This file is consumed by `tsc` and by your editor's TypeScript integration. Docs on project references: <https://www.typescriptlang.org/docs/handbook/project-references.html>

## Concepts to learn here

- A config file does not have to *do* work; it can just **delegate** to others.
- TypeScript **Project References** and why you would split app vs. tooling configs.
- JSON-with-config as a first-class part of a toolchain.
- The idea that "compile target environment" (browser vs Node) drives which type definitions and language features are available.

## How to edit it safely

- You will **rarely edit this file**. Day-to-day rule changes (strictness, libs, target) belong in `tsconfig.app.json` (for `src/`) or `tsconfig.node.json` (for build scripts).
- **To introduce a third project** (say, a `tests/` folder with its own settings), create a `tsconfig.test.json` and add another `{ "path": "./tsconfig.test.json" }` entry here.
- Do not add `compilerOptions` here expecting them to affect `src/` — they would not, because this file compiles nothing. Put them in the referenced configs.
- Keep `"files": []`; removing it can change TypeScript's default file discovery in confusing ways.
