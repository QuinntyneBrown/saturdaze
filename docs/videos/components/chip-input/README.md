# 13 · Coding sd-chip-input: a tag editor built on signals

> **Runtime:** ~7.6 min · **Audience:** developers who know basic Angular and want to build or change `sd-chip-input` · **Prerequisites:** [Video 11 · sd-checkbox](../checkbox/README.md) (the forms contract), [Video 12 · sd-chip](../chip/README.md) (the remove output)

**Video:** [chip-input.mp4](chip-input.mp4) · [Slides](slides.html) · **Audio:** [chip-input.mp3](chip-input.mp3) · [Transcript](script.md)

## Why this video exists

`sd-chip-input` is a `ControlValueAccessor` over `string[]` that edits the family's likes and dislikes. It shows how far plain `signal()` state and event handlers go without `effect()`, how to keep arrays immutable across the forms boundary, and how a generated id links a label to the input.

## Learning objectives

By the end, the viewer can:

- Separate configuration inputs from component-owned signals (`values`, `draft`, `disabled`).
- Route every change through one private `set()` that updates the signal and notifies the form.
- Handle Enter, comma, Backspace and blur for a tag editor, with `preventDefault()`.
- Wire a child's `output()` (`sd-chip` `remove`) to a parent method.
- Test keyboard behaviour with small `type()` and `key()` helpers.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why is `id` not a signal? | It never changes after construction. |
| Why copy arrays in `set()` and `writeValue()`? | So the form and the component never share a mutable array. |
| Why no `effect()`? | All state changes happen in event handlers; nothing needs syncing afterwards. |
| Why `track value`? | Values are de-duplicated (case-insensitive), so they are unique keys. |
| Why can the text box drop its outline? | `.chip-input:focus-within` draws the ring on the whole field. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/components/src/lib/chip-input/chip-input.ts` | Counter, decorator, inputs, signals, handlers, `set()`, CVA. |
| `frontend/projects/components/src/lib/chip-input/chip-input.html` | Label, chip loop, native input. |
| `frontend/projects/components/src/lib/chip-input/chip-input.scss` | Field box and `:focus-within`. |
| `frontend/projects/components/src/lib/chip-input/chip-input.spec.ts` | Helpers and nine tests. |
| `frontend/projects/saturdaze/src/app/dialogs/likes-dialog/likes-dialog.html` | Likes and dislikes with `ngModel`. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:25 | Introduction | Title; Where the app uses it. |
| 00:26-01:07 | Decorator | The decorator. |
| 01:08-01:58 | State | Inputs, an id, and three signals; What each member is. |
| 01:59-03:15 | Behaviour | Keyboard handling; Commit and remove; One way out, one way in. |
| 03:16-04:09 | Template | The template: label and chips; The template: the bare input. |
| 04:10-04:43 | Styles | Focus on the whole field. |
| 04:44-06:34 | Spec | Spec setup and helpers; Rendering; Typing; Removing and the form. |
| 06:35-07:02 | Pitfalls | Pitfalls. |
| 07:03-07:37 | Recap | Things to remember; preview of `sd-copy-field`. |

## Demo commands

```sh
cd frontend
npx ng test components --include='**/chip-input/chip-input.spec.ts'   # run the chip-input spec
npm run storybook                                                     # Components → ChipInput → Likes and dislikes
```

## Pitfalls

- Using `model()` or an input for the value the form owns.
- Passing the internal array to `onChange`.
- Missing `preventDefault()` on Enter and comma.
- A hard-coded id shared by every instance.
- Adding an `effect()` to sync state a handler can set.

## References

- [Angular: Signals](https://angular.dev/guide/signals)
- [Angular API: ControlValueAccessor](https://angular.dev/api/forms/ControlValueAccessor)
- [Angular: Control flow (`@for`, `track`)](https://angular.dev/guide/templates/control-flow)
- `docs/adr/ADR-009-v2-responsive-shell.md`, `docs/adr/ADR-013-fluent-design-tokens.md`
