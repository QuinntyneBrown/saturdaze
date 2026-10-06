# 37 · Coding sd-seg-radio: a segmented radio group for Angular forms

> **Runtime:** ~7.7 min · **Audience:** developers who know basic Angular · **Prerequisites:** [Consuming tokens](../../05-consuming-tokens/README.md) helps

**Video:** [seg-radio.mp4](seg-radio.mp4) · [Slides](slides.html) · **Audio:** [seg-radio.mp3](seg-radio.mp3) · [Transcript](script.md)

## Why this video exists

`sd-seg-radio` is the Saturday / Sunday / Either picker in the add errand, add to day and commitment dialogs. It is the clearest example in the library of a component that plugs into Angular forms as a `ControlValueAccessor` while keeping its state in signals, and of getting accessibility for free from native radios.

## Learning objectives

By the end, the viewer can:

- Register a component as `NG_VALUE_ACCESSOR` with `forwardRef` and implement `writeValue`, `registerOnChange`, `registerOnTouched` and `setDisabledState`.
- Explain why form-owned state lives in `signal()` rather than `input()` or `model()`.
- Derive a modifier class with `computed()`.
- Build a radio group from native radios sharing one `name`, labelled with `aria-labelledby`.
- Style checked and focus-visible state with `:has()` and tokens by role.
- Test a CVA by calling its methods and dispatching `change` events.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why are `value` and `disabled` signals, not inputs? | The forms API writes them imperatively; signals make the OnPush template react. |
| Why not `model()`? | It would create a second source of truth next to the form control. |
| Where does keyboard support come from? | Native `type="radio"` inputs sharing one `name`. |
| How is the selected pill styled? | `.seg-radio__opt:has(input:checked)`; no class toggling in TS. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/saturdaze/src/app/dialogs/add-errand-dialog/add-errand-dialog.html` | `[ngModel]` / `(ngModelChange)` usage. |
| `frontend/projects/components/src/lib/seg-radio/seg-radio.ts` | `SegRadioOption`, decorator, providers, signals, `computed`, CVA methods. |
| `frontend/projects/components/src/lib/seg-radio/seg-radio.html` | Label, `role="radiogroup"`, native radios. |
| `frontend/projects/components/src/lib/seg-radio/seg-radio.scss` | Track grid, invisible input, `:has` states. |
| `frontend/projects/components/src/lib/seg-radio/seg-radio.spec.ts` | Setup and the six tests. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:25 | Introduction | Coding sd-seg-radio. |
| 00:25-00:54 | Usage | Where it is used; What you will build. |
| 00:54-01:59 | Decorator | The option type and an id counter; The decorator; Plugging into forms. |
| 01:59-03:04 | State | Inputs, signals and a computed; The form owns the value; computed() for derived state. |
| 03:04-03:30 | Methods | The methods. |
| 03:30-04:27 | Template | The label and the group; One native radio per option; Native radios: accessibility for free. |
| 04:27-05:15 | Styles | The track and the invisible input; State styling with :has. |
| 05:15-06:36 | Tests | Spec setup; Structure and labelling; Driving the accessor. |
| 06:36-06:59 | Pitfalls | Pitfalls. |
| 06:59-07:40 | Recap | Things to remember; Coding sd-segments. |

## Demo commands

```sh
cd frontend
npx ng test components --watch=false --include='**/seg-radio/seg-radio.spec.ts'   # run the seg-radio spec
npm run storybook                                                                  # open the SegRadio stories
```

## Pitfalls

- There is no `value` input: bind with `ngModel` or a form control.
- Duplicate option values break `track option.value`.
- Only two- and three-column layouts exist; more than three options don't fit the design.

## References

- [Angular: ControlValueAccessor](https://angular.dev/api/forms/ControlValueAccessor)
- [Angular: Signals](https://angular.dev/guide/signals)
- [WAI-ARIA APG: Radio Group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/)
- `docs/adr/ADR-009-v2-responsive-shell.md`, `docs/adr/ADR-013-fluent-design-tokens.md`
