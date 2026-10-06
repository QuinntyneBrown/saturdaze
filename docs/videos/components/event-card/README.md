# 22 · Coding sd-event-card: a typed card built from smaller parts

> **Runtime:** ~7.0 min · **Audience:** developers who know basic Angular · **Prerequisites:** [Consuming tokens](../../05-consuming-tokens/README.md); the `sd-button` (09) and `sd-date-tile` (16) videos help

**Video:** [event-card.mp4](event-card.mp4) · [Slides](slides.html) · **Audio:** [event-card.mp3](event-card.mp3) · [Transcript](script.md)

## Why this video exists

`sd-event-card` shows one local event on Ideas · Events. It is a composition exercise: media, date tile, button and icon from the library, the shared `.card` anatomy from the mock, a `card-host` Sass mixin shared by every typed card, and an `output()` that reports "Add to day" without deciding what it means.

## Learning objectives

By the end, the viewer can:

- Compose library components inside a typed card (`Media`, `DateTile`, `Button`, `Icon`).
- Alias an input (`title` → `cardTitle`), use `booleanAttribute` for `muted`/`addable`, and reuse exported types (`CardMedia`, `MediaTone`).
- Report a user action with `output()` and leave the decision to the page.
- Render a footer only when it has content, hide Details on muted cards, and give each "Add to day" button a unique accessible name.
- Share card styles through `@include card-host`.
- Read `event-card.spec.ts` and name what it does not yet cover.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why does the card emit instead of adding to a day? | Business logic stays in the page/handlers; the library only reports the press. |
| Why is Details hidden when muted? | A pending suggestion is not verified yet. |
| Where does `rel="noopener"` come from? | `sd-button`'s `rel` computed when `target` is `_blank`. |
| Why `[label]="'Add to day: ' + cardTitle()"`? | Each button gets a distinct accessible name in a grid of cards. |
| What does the spec not cover? | `addable`, `addToDay`, `media`. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/saturdaze/src/app/pages/ideas-events/ideas-events.page.html` | The real usage with chips. |
| `frontend/projects/components/src/lib/event-card/event-card.ts` | Decorator, host, inputs, output. |
| `frontend/projects/components/src/lib/event-card/event-card.html` | Media, head, chips slot, conditional footer. |
| `frontend/projects/components/src/lib/event-card/event-card.scss` | `@include card-host`, muted opacity. |
| `frontend/projects/components/src/lib/styles/_card-base.scss` | The `card-host` mixin. |
| `frontend/projects/components/src/lib/button/button.ts` | `rel` computed. |
| `frontend/projects/components/src/lib/event-card/event-card.spec.ts` | Setup and six tests. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:33 | Introduction | What it is; ideas-events usage. |
| 00:33-01:23 | Decorator | Imports, `card card--media`, no reflected inputs (ADR-009). |
| 01:23-02:35 | Inputs | Ten inputs, shared media types, `output()`. |
| 02:35-04:02 | Template | Head, chips slot, footer logic, accessible label. |
| 04:02-04:47 | Styles | `card-host` mixin, muted. |
| 04:47-06:05 | Spec | Setup, tests, gaps. |
| 06:05-06:24 | Pitfalls | Four mistakes. |
| 06:24-06:59 | Recap | Things to remember; preview of `sd-filter-chip`. |

## Demo commands

```sh
cd frontend
npx ng test components --include='**/event-card/event-card.spec.ts'   # run the event-card spec
npm run storybook                                                       # EventCard stories
```

## Pitfalls

- Putting business logic in the card instead of emitting `addToDay`.
- Showing Details on a muted (pending) suggestion.
- Copying card styles instead of including `card-host`.
- Wrapping several `[slot=chips]` nodes in one `@if`.

## References

- [Angular: Signal inputs](https://angular.dev/guide/components/inputs)
- [Angular: Custom events with outputs](https://angular.dev/guide/components/outputs)
- `docs/specs/L2.md` (L2-106, L2-107), `docs/adr/ADR-009-v2-responsive-shell.md`
