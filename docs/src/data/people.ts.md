# `src/data/people.ts`

## What this file is

A **static data module**: it defines the team/people shown on the site,
together with the TypeScript types describing their shape. There is no
logic here — it's a typed constant that React components import and
render. Keeping content like this in a typed `data/` module (rather than
hard-coded inside components) means the structure is enforced by the
compiler and the content is editable in one obvious place.

## Line-by-line / block walkthrough

```ts
export interface PersonTheme {
  title: string
  description: string
}
```

A TypeScript **interface** = a contract for an object's shape. A
`PersonTheme` is one "theme" / area-of-work card: a `title` and a
`description`, both strings. `export` makes it importable elsewhere (e.g.
a component that renders a theme list can type its prop as
`PersonTheme[]`).

```ts
export interface Person {
  id: string
  name: string
  credentials: string
  tagline: string
  href: string
  themes: PersonTheme[]
}
```

The shape of one team member:

- `id` — a short stable key (`'nicholas'`). Used for routing/React keys.
- `name` — full display name.
- `credentials` — e.g. `'MSc, BSc'`.
- `tagline` — a one-line role descriptor.
- `href` — the link to their detail page. Note the hash form
  `'#/people/nicholas'` — this site uses **hash-based routing** (the
  part after `#` selects the view without a server round-trip), common
  in static single-page apps.
- `themes: PersonTheme[]` — an **array of** the interface above. Types
  compose: `Person` embeds `PersonTheme`.

```ts
export const PEOPLE: Person[] = [
  { id: 'nicholas', name: 'Nicholas Quentin Smith', ... themes: [ ... ] },
  { id: 'toby', ... },
  { id: 'rhys', ... },
]
```

The actual data: a constant array typed `Person[]`. Because of that
annotation, the compiler checks **every object** in the array against
`Person` — a typo'd key, a missing field, or a wrong type is a build
error, not a runtime surprise. Each entry follows the same structure:
identity fields plus a `themes` array of three `{ title, description }`
cards.

`const` means the binding can't be reassigned. (It does **not** deep-
freeze the array — the objects are still technically mutable at runtime;
the protection here is the *type*, plus the convention that this is
read-only data.)

## Libraries & APIs used

None. This is plain TypeScript: `interface` declarations and a typed
`const`. No React, no browser APIs, no third-party packages. It's
imported by React components elsewhere (search the codebase for
`from '../data/people'` / `PEOPLE`).

## Concepts to learn here

- **Interfaces** as object-shape contracts, and how they **compose**
  (`Person` contains `PersonTheme[]`).
- Typing a constant (`const PEOPLE: Person[] = [...]`) so the compiler
  validates the data.
- Separating **content/data** from **presentation/components** — a
  maintainability pattern.
- `export` on both types and data so components can import the types for
  their props.
- Hash-based routing hrefs (`#/people/<id>`).

## How to edit it safely

- **To add a team member:** append a new object to the `PEOPLE` array.
  TypeScript will *require* every `Person` field (`id`, `name`,
  `credentials`, `tagline`, `href`, `themes`) — if you forget one, the
  build fails with a clear error. Give it a unique lowercase `id` and a
  matching `href` of the form `#/people/<id>`.
- **To add/remove a theme card:** edit that person's `themes` array;
  each item must be `{ title, description }`.
- **Keep `id` values unique and stable** — they're used as React list
  keys and in routes. Changing an existing `id` will break any saved/
  shared links to that person and may cause React reconciliation churn.
- **Changing the data shape** (adding a field like `photo`): add it to
  the `Person` interface first. If you make it required, every existing
  entry must be updated; make it optional (`photo?: string`) to add it
  incrementally without touching all rows.
- This file has no side effects, so editing it is low-risk — the main
  thing to watch is keeping the array valid against the interface.
