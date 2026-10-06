# 43 · Coding sd-stars: a rating that displays or edits

> **Runtime:** ~7.1 min · **Audience:** developers who know basic Angular · **Prerequisites:** [Video 38, sd-segments](../segments/README.md) introduces `model()`

**Video:** [stars.mp4](stars.mp4) · [Slides](slides.html) · **Audio:** [stars.mp3](stars.mp3) · [Transcript](script.md)

## Why this video exists

`sd-stars` shows a weekend's rating on the past card and edits it in the rating dialog. It is the clearest example in the library of an `input()` + `output()` pair named for two-way binding (`rating` / `ratingChange`) instead of `model()`, and of a host that switches ARIA role and label from a signal.

## Learning objectives

By the end, the viewer can:

- Declare `rating`, `label`, `size`, `editable` (`booleanAttribute`) and `groupLabel` inputs and a `ratingChange` output.
- Explain when an input + `…Change` output beats `model()`, and that `[(rating)]` works with either.
- Derive the icon size with `computed()` and keep constant data as a plain array.
- Switch the host between no role and `role="radiogroup"` with an accessible name.
- Mark exactly one `aria-checked` radio while several stars are filled.
- Test an `output()` by subscribing a spy.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why not `model()`? | The component never writes its own rating; the parent stays the single owner. |
| How does "press again to clear" work? | `pick` emits `0` when the step equals the current rating. |
| What does a screen reader hear in editable mode? | A "Rating" radio group of "1 star" … "5 stars", one checked. |
| What's missing from the keyboard pattern? | Arrow-key navigation / roving tabindex; each button is a tab stop. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/components/src/lib/past-card/past-card.html` | Display stars with a caption. |
| `frontend/projects/saturdaze/src/app/dialogs/rating-dialog/rating-dialog.html` | Large editable stars bound to a signal. |
| `frontend/projects/components/src/lib/stars/stars.ts` | Host bindings, inputs, output, `computed`, `pick`, `starLabel`. |
| `frontend/projects/components/src/lib/stars/stars.html` | Editable and display branches. |
| `frontend/projects/components/src/lib/stars/stars.scss` | `sd-icon.icon--filled`, 40px buttons. |
| `frontend/projects/components/src/lib/stars/stars.spec.ts` | Helpers and the six tests. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:23 | Introduction | Coding sd-stars. |
| 00:23-00:42 | Usage | Two modes in the app. |
| 00:42-01:26 | Decorator | The decorator: role from a signal. |
| 01:26-02:30 | API | Five inputs, one output; rating + ratingChange. |
| 02:30-03:05 | Derived | Derived state and methods. |
| 03:05-03:59 | Template | Editable: five radio buttons; Display: icons and a caption; Filled is not checked. |
| 03:59-04:40 | Styles | Fill from the icon's host class. |
| 04:40-06:02 | Tests | Spec setup and helpers; Display mode tests; Editable mode tests. |
| 06:02-06:26 | Pitfalls | Pitfalls. |
| 06:26-07:05 | Recap | Things to remember; Coding sd-status-row. |

## Demo commands

```sh
cd frontend
npx ng test components --watch=false --include='**/stars/stars.spec.ts'   # run the stars spec
npm run storybook                                                          # open the Stars stories
```

## Pitfalls

- Clicking only emits; the parent must feed the new `rating` back in.
- Editable mode has five tab stops and no arrow-key handling.
- `label` is only rendered in display mode.

## References

- [Angular: Custom events with outputs](https://angular.dev/guide/components/outputs)
- [Angular: Two-way binding](https://angular.dev/guide/templates/two-way-binding)
- [WAI-ARIA APG: Radio Group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/)
- `docs/adr/ADR-013-fluent-design-tokens.md`
