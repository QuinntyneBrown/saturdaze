# 51 · Coding sd-vote-row: thumbs up, thumbs down, one output

> **Runtime:** ~7.3 min · **Audience:** developers who know basic Angular and want to build components in this library · **Prerequisites:** [Video 25: sd-food-card](../food-card/README.md) (the parent)

**Video:** [vote-row.mp4](vote-row.mp4) · [Slides](slides.html) · **Audio:** [vote-row.mp3](vote-row.mp3) · [Transcript](script.md)

## Why this video exists

`sd-vote-row` is a textbook controlled component: signal inputs in, one `output()` out, no local state. It also shows a labelled `role="group"`, toggle buttons with `aria-pressed`, and pressed styles keyed off the same attribute screen readers use.

## Learning objectives

By the end, the viewer can:

- Export the types (`Vote`, `VoteCell`) the parent and component share.
- Declare `votes`, `label` and `disabled` (`booleanAttribute`) inputs and a `voteChange` output.
- Implement the clear-on-repeat rule in `cast()` without mutating inputs.
- Explain when a controlled input + output beats a two-way `model()`.
- Render the cells with `@for … track cell.name` and accessible, icon-only toggle buttons.
- Read the spec, especially the clear-on-repeat test with a spy.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why no `signal()` or `model()`? | The parent owns server-backed votes; the row only emits intent. |
| What does pressing the current vote do? | Emits `none` for that member. |
| Why `role="group"` with a label? | One named set of buttons per restaurant (`Family vote for …`). |
| Why style on `aria-pressed`? | The visual and the announced state can't drift apart. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/components/src/lib/vote-row/vote-row.ts` | Types, decorator, inputs, output, `cast()`. |
| `frontend/projects/components/src/lib/vote-row/vote-row.html` | `@for` cells and the two buttons. |
| `frontend/projects/components/src/lib/vote-row/vote-row.scss` | Grid row, truncation, pressed states. |
| `frontend/projects/components/src/lib/vote-row/vote-row.spec.ts` | Fixture data, helpers, six tests. |
| `frontend/projects/components/src/lib/food-card/food-card.html` | The parent binding. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:34 | Introduction | What the row is; inside `sd-food-card`. |
| 00:35-00:59 | Types | `Vote`, `VoteCell`. |
| 01:00-01:39 | Decorator | `role="group"`, `aria-label`; no reflected `disabled` (ADR-009). |
| 01:40-02:09 | API | Inputs and `voteChange`. |
| 02:10-02:58 | Controlled | `cast()` and the parent-owned data flow. |
| 02:59-03:56 | Template | Cells, avatars, `aria-pressed` toggle buttons. |
| 03:57-04:45 | Styles | Grid, truncation, fill/ink pressed states. |
| 04:46-06:26 | Spec | Setup and the six tests. |
| 06:27-07:15 | Recap | Pitfalls, things to remember, preview of `sd-well`. |

## Demo commands

```sh
cd frontend
npx ng test components     # runs the components library specs, vote-row.spec.ts included
npm run storybook          # open VoteRow
```

## Pitfalls

- Mutating the `votes` array in place.
- Tracking by index instead of a stable name.
- Icon-only buttons without an `aria-label`.

## References

- [Angular: Custom events with outputs](https://angular.dev/guide/components/outputs)
- [Angular: Signal inputs](https://angular.dev/guide/components/inputs)
- [MDN: aria-pressed](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-pressed)
- `docs/adr/ADR-013-fluent-design-tokens.md`
