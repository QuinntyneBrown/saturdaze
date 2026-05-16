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
- Pending.
