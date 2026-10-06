# 36 · Coding sd-section: a titled region with an action slot

> **Runtime:** ~6.6 min · **Audience:** developers who know basic Angular · **Prerequisites:** [Consuming tokens](../../05-consuming-tokens/README.md) helps

**Video:** [section.mp4](section.mp4) · [Slides](slides.html) · **Audio:** [section.mp3](section.mp3) · [Transcript](script.md)

## Why this video exists

`sd-section` is the titled region that structures the Family, Ideas and Weekend pages. It is small, but it shows several house rules at once: signal inputs with an alias, host bindings that read signals, a self-labelling region (`aria-labelledby`), BEM parity with the mocks, and `ng-content` slots declared exactly once.

## Learning objectives

By the end, the viewer can:

- Write the `@Component` decorator for an `sd-*` component: standalone, OnPush, a `host` block.
- Declare signal inputs with `input()`, including an `alias`, and explain why none is required.
- Generate a unique heading id with a module counter and link it with `aria-labelledby`.
- Declare a named slot (`[slot=action]`) and the default slot once each, and explain the consequence of the slot living inside `@if`.
- Style with tokens by role and hide an empty slot with `:has`.
- Read the spec: `setInput`, `detectChanges`, and a host component to prove projection.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why is the input called `sectionTitle` with `alias: 'title'`? | Consumers write `title="…"` like the mock; the class avoids a `title` field. |
| How does the section get an accessible name? | `aria-labelledby` on the host points at the `h2`'s generated id, only when titled. |
| Why does an action without a title vanish? | The `[slot=action]` `ng-content` is inside `@if (sectionTitle())`. |
| How does the spec test slots? | A standalone `HostCmp` projects a button and a paragraph; the test checks where they land. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/saturdaze/src/app/pages/family/family.page.html` | The Home section with an Edit button in `slot="action"`. |
| `frontend/projects/components/src/lib/section/section.ts` | Module counter, decorator, `host` block, two inputs. |
| `frontend/projects/components/src/lib/section/section.html` | Header behind `@if`, the two slots. |
| `frontend/projects/components/src/lib/section/section.scss` | Title/subtitle tokens, `respond-to(tablet)`, `:not(:has(*))`. |
| `frontend/projects/components/src/lib/section/section.spec.ts` | Setup, `HostCmp`, the four tests. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:23 | Introduction | What the section is. |
| 00:23-01:03 | Usage | Family, Ideas and Weekend pages; goals. |
| 01:03-02:16 | Decorator | Counter, selector, OnPush, host bindings, best practice. |
| 02:16-03:03 | Inputs | `input()` with alias; what it doesn't need. |
| 03:03-03:51 | Template | `@if` header, slots declared once. |
| 03:51-04:28 | Styles | Tokens by role, tablet margin, `:has`. |
| 04:28-05:35 | Tests | Setup, host component, four tests. |
| 05:35-05:58 | Pitfalls | Untitled actions, `@if` around slots, extra headings. |
| 05:58-06:35 | Recap | Things to remember; preview of `sd-seg-radio`. |

## Demo commands

```sh
cd frontend
npx ng test components --watch=false --include='**/section/section.spec.ts'   # run the section spec
npm run storybook                                                # open the Section stories
```

## Pitfalls

- Projecting `[slot=action]` into an untitled section: it is never rendered.
- Wrapping several `[slot=…]` nodes in one consumer-side `@if` (NG8011): use one `@if` per node.
- Adding a heading inside the body; the section's `h2` already labels the region.

## References

- [Angular: Signal inputs](https://angular.dev/guide/components/inputs)
- [Angular: Content projection with ng-content](https://angular.dev/guide/components/content-projection)
- [MDN: aria-labelledby](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-labelledby)
- `docs/adr/ADR-009-v2-responsive-shell.md`, `docs/adr/ADR-013-fluent-design-tokens.md`
