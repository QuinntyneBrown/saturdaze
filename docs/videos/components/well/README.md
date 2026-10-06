# 52 · Coding sd-well: the quiet note block, and the end of the series

> **Runtime:** ~7.3 min · **Audience:** developers who know basic Angular and want to build components in this library · **Prerequisites:** [Consuming tokens](../../05-consuming-tokens/README.md) helps

**Video:** [well.mp4](well.mp4) · [Slides](slides.html) · **Audio:** [well.mp3](well.mp3) · [Transcript](script.md)

## Why this video exists

`sd-well` is the note block the planner uses to explain itself ("Why this", "Locked"). It is small, but it shows an aliased input with a natural public name, a default that maps to no modifier, inputs kept off host attributes (ADR-009), a content slot declared once, and tone variants as fill/ink pairs. It closes the components series with a summary of the ideas every component shares.

## Learning objectives

By the end, the viewer can:

- Map tone to host modifier classes (default has none) and explain why inputs such as `title` are not reflected onto the host (ADR-009).
- Use `input<string>('', { alias: 'title' })` so templates write `title` while the class reads `wellTitle()`.
- Explain why the component needs no `computed()`, `output()` or local state.
- Declare the single, unconditional `<ng-content />` body slot (AGENTS.md rule).
- Style tones as status/brand fill and ink pairs and space the body only after a title.
- Test projection through a host component.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why alias `title`? | Short familiar attribute outside, explicit `wellTitle` inside, distinct from the native `title`. |
| Why is the slot unconditional? | Content projection is static; a slot inside `@if` branches projects into one branch only. |
| Why isn't `title` reflected onto the host? | A host `title` attribute is a native hover tooltip the mocks never had; ADR-009 keeps only classes and ARIA state on hosts. |
| How is projection tested? | `HostCmp` with content between the tags. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/components/src/lib/well/well.ts` | `WellTone`, decorator, inputs. |
| `frontend/projects/components/src/lib/well/well.html` | Icon, optional title, `ng-content` body. |
| `frontend/projects/components/src/lib/well/well.scss` | Host, tones, title/body spacing. |
| `frontend/projects/components/src/lib/well/well.spec.ts` | Host component, `glyph`/`drawn` helpers and five tests. |
| `frontend/projects/saturdaze/src/app/dialogs/block-dialog/block-dialog.html` | "Locked" and "Why this" wells. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:38 | Introduction | What a well is; block, confirm, add-to-day dialogs and the legal page. |
| 00:39-01:35 | Decorator | `WellTone`, modifier classes, no reflected inputs (ADR-009). |
| 01:36-02:23 | Inputs | `icon`, `tone`, aliased `title`; nothing else needed. |
| 02:24-03:19 | Template | Icon, title, single body slot. |
| 03:20-04:34 | Styles | Host, tones as fill/ink pairs, title/body spacing. |
| 04:35-06:04 | Spec | Setup and the five tests, including projection. |
| 06:05-06:52 | Recap | Pitfalls and things to remember. |
| 06:53-07:15 | End | The ideas shared across all 52 components. |

## Demo commands

```sh
cd frontend
npx ng test components     # runs the components library specs, well.spec.ts included
npm run storybook          # open Well
```

## Pitfalls

- Reflecting `title` onto the host would add a native hover tooltip; keep it an input that renders a paragraph.
- Wrapping the body slot in a condition.
- Choosing a tone for colour instead of meaning.

## References

- [Angular: Content projection with ng-content](https://angular.dev/guide/components/content-projection)
- [Angular: Signal inputs (aliases)](https://angular.dev/guide/components/inputs)
- [MDN: title global attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/title)
- `docs/adr/ADR-009-v2-responsive-shell.md`, `docs/adr/ADR-013-fluent-design-tokens.md`
