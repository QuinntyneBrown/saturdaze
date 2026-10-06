# 01 · Coding sd-activity-card: inputs, an output and projected chips

> **Runtime:** ~6.8 min · **Audience:** developers who know basic Angular and are new to the Saturdaze components library · **Prerequisites:** [Consuming tokens](../../05-consuming-tokens/README.md) helps

**Video:** [activity-card.mp4](activity-card.mp4) · [Slides](slides.html) · **Audio:** [activity-card.mp3](activity-card.mp3) · [Transcript](script.md)

## Why this video exists

`sd-activity-card` is the suggestion card on the Ideas screen and the simplest of the typed cards: signal inputs, one boolean flag, one output and one projected slot, with its anatomy shared through the `card-host` mixin. It is a good first component to build step by step.

## Learning objectives

By the end, the viewer can:

- Write a standalone, OnPush component whose host carries the mock's BEM block (`card card--media`).
- Declare signal inputs with typed defaults, an `alias: 'title'`, and a `booleanAttribute` transform.
- Emit a typed `output<void>()` straight from the template.
- Declare a projected `[slot=chips]` once and project into it correctly.
- Reuse shared card styles from `_card-base.scss` with tokens read by role.
- Explain what each test in `activity-card.spec.ts` proves, and what it does not cover yet.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why alias the title input? | Consumers write `title`; the class field `cardTitle` is not confused with the native `title`. |
| Why `booleanAttribute` on `addable`? | The bare attribute `addable` arrives as `''`; the transform makes it `true`. |
| Why no `computed()` or `effect()`? | The template reads inputs directly; there is no derived or local state. |
| How do chips get in? | `<ng-content select="[slot=chips]" />`, declared once; one `@if` per slotted node. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/saturdaze/src/app/pages/ideas-activities/ideas-activities.page.html` | The real usage. |
| `frontend/projects/components/src/lib/activity-card/activity-card.ts` | Decorator, host block, inputs, output. |
| `frontend/projects/components/src/lib/activity-card/activity-card.html` | Media, head, body, chips slot, footer. |
| `frontend/projects/components/src/lib/activity-card/activity-card.scss` | `card-host` include and the two-line clamp. |
| `frontend/projects/components/src/lib/styles/_card-base.scss` | The `card-host` mixin. |
| `frontend/projects/components/src/lib/activity-card/activity-card.spec.ts` | Setup and six tests. |
| `docs/mocks/pages/ideas.html` | `<li class="card card--media">`. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:35 | Introduction | What the card is; where Ideas uses it. |
| 00:36-01:57 | Decorator | Selector, standalone, imports, OnPush, host classes and attributes. |
| 01:58-03:00 | Inputs | Typed inputs, `alias`, `booleanAttribute`, `output()`, what it doesn't need. |
| 03:01-03:57 | Template | Media, head, chips slot, footer buttons. |
| 03:58-04:24 | Styles | `card-host` mixin, tokens by role, line clamp. |
| 04:25-05:50 | Tests | Setup with `setInput`; six tests grouped by behaviour. |
| 05:51-06:12 | Pitfalls | Transform, slots, links, BEM classes. |
| 06:13-06:48 | Recap | Things to remember; preview of video 02. |

## Demo commands

```sh
cd frontend
npx ng test components --include='**/activity-card/*.spec.ts'
npm run storybook          # Components → Activity Card
```

## Pitfalls

- Dropping `transform: booleanAttribute` from `addable`, so the bare attribute no longer means true.
- Wrapping several `[slot=chips]` nodes in one `@if` (NG8011).
- Wrapping the whole card in a link as well as the Map button.
- Renaming the mock's BEM classes that e2e locators depend on.

## References

- [Angular: Accepting data with input properties](https://angular.dev/guide/components/inputs)
- [Angular: Custom events with outputs](https://angular.dev/guide/components/outputs)
- [Angular: Content projection with ng-content](https://angular.dev/guide/components/content-projection)
- `docs/adr/ADR-009-v2-responsive-shell.md`, `docs/adr/ADR-013-fluent-design-tokens.md`
