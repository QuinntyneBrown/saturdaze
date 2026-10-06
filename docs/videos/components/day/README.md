# 17 · Coding sd-day: a labelled column with two outputs

> **Runtime:** ~8.3 min · **Audience:** developers who know basic Angular and want to build or change `sd-day` · **Prerequisites:** [Video 12 · sd-chip](../chip/README.md) (`output()`), [Video 15 · sd-cover](../cover/README.md) (input `alias`)

**Video:** [day.mp4](day.mp4) · [Slides](slides.html) · **Audio:** [day.mp3](day.mp3) · [Transcript](script.md)

## Why this video exists

`sd-day` is one column of the Weekend screen. It combines most of the patterns in the library: an aliased `title` input, boolean flags with `booleanAttribute`, two typed outputs (`regenerate`, `lockToggle`) instead of a `model()`, small `computed()` signals over a lookup table, a host labelled by its own heading, accessible button names that include the day, `aria-pressed` for the lock, and two slots (the block list and a footer).

## Learning objectives

By the end, the viewer can:

- Label a region by its own heading with a generated id and `aria-labelledby`.
- Keep state the parent owns as an input plus an output that emits the requested next state.
- Derive values from a typed lookup table with `computed()`.
- Give repeated buttons unique accessible names and toggle state with `pressed`.
- Declare a default slot inside a `role="list"` and a named footer slot, each once.
- Read `day.spec.ts`, including how outputs are tested.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why is `locked` not a `model()`? | The page calls the API and owns the state; the day emits `!locked()` and waits for the input. |
| Why `aria-labelledby` on the host? | The column is announced by its heading ("Saturday"). |
| Why put the day name in button labels? | Two days on screen would otherwise have identical "Regenerate" buttons. |
| Why two `computed()`s, not one? | One job each, recalculated only when `weather` changes. |
| Why `top: var(--layoutTopBarHeight)` from tablet? | The sticky header must sit below the top bar. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/components/src/lib/day/day.ts` | Type, `WEATHER` table, counter, decorator, inputs, outputs, computed. |
| `frontend/projects/components/src/lib/day/day.html` | Header, chip, buttons, list and footer slots. |
| `frontend/projects/components/src/lib/day/day.scss` | Sticky header, icon-only buttons, locked tint, `respond-to(tablet)`. |
| `frontend/projects/components/src/lib/day/day.spec.ts` | Host component and seven tests. |
| `frontend/projects/saturdaze/src/app/pages/weekend/weekend.page.html` | Inputs and outputs in use. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:39 | Introduction | Title; Where the app uses it. |
| 00:40-01:44 | Decorator | A type, a lookup table, a counter; The decorator. |
| 01:45-02:42 | Inputs & outputs | Inputs and outputs; Input + output, not model(). |
| 02:43-03:12 | Derived state | Derived state. |
| 03:13-04:50 | Template | The header; The lock toggle; Two slots, each declared once. |
| 04:51-05:38 | Styles | A sticky header; Icon-only on phones, labelled from 720px. |
| 05:39-07:07 | Spec | Spec setup; Rendering and accessible names; Busy, outputs and projection. |
| 07:08-07:40 | Pitfalls | Pitfalls. |
| 07:41-08:19 | Recap | Things to remember; preview of `sd-details`. |

## Demo commands

```sh
cd frontend
npx ng test components --include='**/day/day.spec.ts'   # run the day spec
npm run storybook                                       # Components → Day → Locked / Read only
```

## Pitfalls

- Letting the component flip its own lock.
- Generic button labels repeated across days.
- Losing the heading id link or reusing an id.
- Reflecting `title` onto the host (it produced a native tooltip on the column; ADR-009).
- A pixel sticky offset instead of the layout token.

## References

- [Angular: Custom events with outputs](https://angular.dev/guide/components/outputs)
- [Angular: Signals (computed)](https://angular.dev/guide/signals#computed-signals)
- [MDN: aria-labelledby](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-labelledby)
- [MDN: aria-pressed](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-pressed)
- `docs/adr/ADR-009-v2-responsive-shell.md`, `docs/adr/ADR-013-fluent-design-tokens.md`
