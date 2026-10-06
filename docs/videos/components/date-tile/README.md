# 16 · Coding sd-date-tile: one computed signal

> **Runtime:** ~5.6 min · **Audience:** developers who know basic Angular and want to build or change `sd-date-tile` · **Prerequisites:** [Video 10 · sd-card](../card/README.md) (host bindings, signal inputs)

**Video:** [date-tile.mp4](date-tile.mp4) · [Slides](slides.html) · **Audio:** [date-tile.mp3](date-tile.mp3) · [Transcript](script.md)

## Why this video exists

`sd-date-tile` is the cleanest example in the library of derived state: three string inputs feed one protected `computed()` that either passes pre-split parts through or parses an ISO date without `new Date()`. It also shows a static `aria-hidden` host attribute for a purely decorative element, and an honest gap in its spec.

## Learning objectives

By the end, the viewer can:

- Derive template state with `computed()` instead of a template expression or an `effect()`.
- Parse an ISO date or date-time string without time-zone drift.
- Mark a decorative host `aria-hidden` statically.
- Read `date-tile.spec.ts` and add the missing test for `mon`/`day`.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why `computed()`? | Derived from inputs, read twice, memoised; no second source of truth. |
| Why not `new Date(date)`? | Time zones can shift a local date by a day; the digits are read from the string. |
| Why is `aria-hidden` static? | The tile is always decorative; the date must be in the surrounding text. |
| What do `mon`/`day` do? | Pre-split parts win over `date` (used by Review submissions and the approve dialog). |
| What is untested? | The `mon`/`day` path. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/components/src/lib/date-tile/date-tile.ts` | `MONTHS`, decorator, inputs, `parts`. |
| `frontend/projects/components/src/lib/date-tile/date-tile.html` | Two spans and the whitespace trick. |
| `frontend/projects/components/src/lib/date-tile/date-tile.scss` | 44px tile, brand fill/ink pair. |
| `frontend/projects/components/src/lib/date-tile/date-tile.spec.ts` | Four tests. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:32 | Introduction | Title; Where it is used. |
| 00:33-01:33 | Decorator | A constant and the decorator. |
| 01:34-02:56 | Computed | Inputs and one computed signal; Why computed()?. |
| 02:57-03:41 | Template & styles | Template and styles. |
| 03:42-04:42 | Spec | Spec; A gap worth filling. |
| 04:43-05:01 | Pitfalls | Pitfalls. |
| 05:02-05:34 | Recap | Things to remember; preview of `sd-day`. |

## Demo commands

```sh
cd frontend
npx ng test components --include='**/date-tile/date-tile.spec.ts'   # run the date-tile spec
npm run storybook                                                   # Components → DateTile → Split parts
```

## Pitfalls

- Parsing with `new Date()`.
- Deriving in the template or with `effect()`.
- Relying on the tile alone to convey the date.
- Reformatting the template so whitespace appears between the spans.

## References

- [Angular: Signals (computed)](https://angular.dev/guide/signals#computed-signals)
- [MDN: Date — time zone pitfalls of date-only strings](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#date_time_string_format)
- `docs/adr/ADR-009-v2-responsive-shell.md`, `docs/adr/ADR-013-fluent-design-tokens.md`
