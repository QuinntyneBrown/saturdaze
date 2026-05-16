## Bug 011 — Component folders, files, and class names carry an `Sd` / `sd-` prefix

## Symptom

Every component under `frontend/projects/components/src/lib/` is wrapped
in an `sd-`-prefixed folder, with matching `sd-*.ts` / `sd-*.html` /
`sd-*.scss` files and `Sd`-prefixed TypeScript classes / exported types:

```
lib/sd-chip/
  sd-chip.ts        // export class SdChip, export type SdChipTone
  sd-chip.html
  sd-chip.scss
```

The prefix duplicates information already encoded by the package /
folder structure. The class identifier `SdChip` reads as
`Saturdaze.Components.SdChip` at the import site, and `SdChipTone`
becomes `chip.tone: SdChipTone` — the `Sd` is pure noise inside a file
that already imports from `@saturdaze/components`.

## Root cause

Initial scaffolding mirrored the custom-element tag (`sd-chip`) into
every layer: filename, folder, and class. That convention is correct for
the **selector** (custom elements require a hyphen, and `sd-` is the
project's namespace), but it leaks into identifiers that don't need it.

## Fix

Drop the `Sd` / `sd-` prefix from folders, file names, and exported
TypeScript identifiers. **The Angular `selector` stays as `sd-chip`** —
custom-element naming requirements and external consumers of the tag
are unchanged.

Example rename for chip:

```
lib/sd-chip/sd-chip.ts    -> lib/chip/chip.ts
lib/sd-chip/sd-chip.html  -> lib/chip/chip.html
lib/sd-chip/sd-chip.scss  -> lib/chip/chip.scss

export class SdChip       -> export class Chip
export type  SdChipTone   -> export type  ChipTone

@Component({
  selector: 'sd-chip',                  // unchanged
  templateUrl: './chip.html',           // updated
  styleUrl: './chip.scss',              // updated
})
export class Chip { ... }
```

Apply the same rename to every sibling folder under `lib/` (sd-avatar →
avatar, sd-button → button, sd-list-item → list-item, etc.) and update:

- The package barrel (`public-api.ts` / `index.ts`) re-exports.
- Every consumer import path and type reference across `frontend/`.
- Any `templateUrl` / `styleUrl` strings inside the component decorators.

## Impact

- Wide rename across the components library and every consumer.
- Risk of collision with DOM globals is low for these names (`Chip`,
  `Button`, `Card`, `Dialog`, `Icon`, `Hero`, `Section`); double-check
  on a case-by-case basis and alias on import if a real collision
  appears (e.g. `Dialog as SdDialog` only at the call site that already
  has a `Dialog` in scope).
- Tests, stories, and the docs gallery need their imports updated.

## Status

- Logged: 2026-05-16
- **Fixed: 2026-05-16.**
  - All 27 folders under `frontend/projects/components/src/lib/` renamed
    from `sd-foo` → `foo`. Inner `sd-foo.{ts,html,scss}` files renamed
    to `foo.{ts,html,scss}`.
  - Inside each component .ts:
    - `templateUrl: './sd-foo.html'` → `'./foo.html'`
    - `styleUrl:    './sd-foo.scss'` → `'./foo.scss'`
    - Class `SdFoo` → `Foo`
    - Type alias `SdFooTone` → `FooTone`, plus standalone aliases like
      `SdVote` → `Vote`
    - Internal sibling imports `'../sd-bar/sd-bar'` → `'../bar/bar'`
  - `frontend/projects/components/src/public-api.ts` re-points every
    export to the new path.
  - All 10 consumer pages under
    `frontend/projects/saturdaze/src/app/pages/` updated their
    `import { ... } from 'components'` lists and the matching
    `imports: [...]` arrays on each `@Component` decorator.
  - **Angular `selector: 'sd-foo'` left unchanged everywhere.** Custom-
    element naming requirements and any external HTML that uses
    `<sd-foo>` (including the mock pages in `docs/mocks`) keep working.
  - The e2e fixtures (`e2e/fixtures/sd-test.ts`) still use the
    `Sd`-prefixed `SdFixtures` interface; that's not a component class
    and stays as scoped local nomenclature.
- Collision analysis confirmed safe: the api lib's `WeatherDay` model
  and the components lib's `WeatherDay` class never appear in the same
  file (consumer pages import only the class; service code imports only
  the model). `Vote` in components vs. the unused `Vote` export in
  `api/models/restaurant.ts` is similarly siloed.
- Verified by: `ng build saturdaze`, `ng build components`, `ng build
  api` all succeed. A final grep for `\bSd[A-Z]` across
  `frontend/projects/` returns zero hits.
