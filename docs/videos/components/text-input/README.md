# 46 · Coding sd-text-input: a labelled field that speaks forms

> **Runtime:** ~7.2 min · **Audience:** developers who know basic Angular and want to build components in this library · **Prerequisites:** [Consuming tokens](../../05-consuming-tokens/README.md) helps

**Video:** [text-input.mp4](text-input.mp4) · [Slides](slides.html) · **Audio:** [text-input.mp3](text-input.mp3) · [Transcript](script.md)

## Why this video exists

`sd-text-input` is the library's form field and its first `ControlValueAccessor`. It shows how signal inputs, writable signals, a `computed()` for ARIA wiring and one deliberate `effect()` combine with Angular forms, and how field states are styled on real attributes.

## Learning objectives

By the end, the viewer can:

- Register a component as `NG_VALUE_ACCESSOR` with `forwardRef` and `multi: true`.
- Use `input()` with `booleanAttribute` for bare boolean attributes (`required`, `invalid`, `multiline`, `readonly`).
- Hold local state in `signal()` (`internalValue`, `disabled`) and derive `aria-describedby` with `computed()`.
- Explain why one `effect()` seeds the value from the static `value` input, and why effects stay rare.
- Wire label, hint and error with generated ids, `aria-invalid` and `aria-required`.
- Read the spec's three groups: rendering, forwarding and the accessor contract.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why is `disabled` a signal and not an input? | Disabling comes from the form via `setDisabledState`. |
| Why an `effect()` for `value`? | `internalValue` has two writers (input and form); only non-empty values seed. |
| Why `computed()` for `describedBy`? | Pure derivation from `error` and `hint`, cached. |
| Why `|| null` on attributes? | An empty string removes the attribute instead of rendering an empty one. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/components/src/lib/text-input/text-input.ts` | Decorator, providers, inputs, signals, `describedBy`, effect, accessor methods. |
| `frontend/projects/components/src/lib/text-input/text-input.html` | Label, input/textarea, error/hint. |
| `frontend/projects/components/src/lib/text-input/text-input.scss` | Focus, `aria-invalid`, `readonly` states. |
| `frontend/projects/components/src/lib/text-input/text-input.spec.ts` | Setup and the ten tests. |
| `frontend/projects/saturdaze/src/app/pages/sign-in/sign-in.page.html` | Real usage with `formControlName`. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:38 | Introduction | What the field is; where it is used. |
| 00:39-01:38 | Decorator | Field id counter, host attributes, `NG_VALUE_ACCESSOR`. |
| 01:39-02:21 | Inputs | String inputs, `booleanAttribute`, forwarded attributes. |
| 02:22-03:03 | State | Plain ids, `signal()`s, `computed()` describedBy. |
| 03:04-03:54 | Effect | Seeding from `value`; the accessor methods. |
| 03:55-04:41 | Template | Label, control bindings, error/hint. |
| 04:42-05:18 | Styles | Attribute-driven states, tokens by role. |
| 05:19-06:24 | Spec | Rendering, forwarding and accessor groups. |
| 06:25-06:39 | Pitfalls | Clearing `value`; keeping ids wired. |
| 06:40-07:14 | Recap | Things to remember; preview of `sdThemeProvider`. |

## Demo commands

```sh
cd frontend
npx ng test components     # runs the components library specs, text-input.spec.ts included
npm run storybook          # open TextInput
```

## Pitfalls

- Setting `value` to `''` does not clear the control; reset through the form.
- Building label/hint/error outside the component breaks the id wiring.

## References

- [Angular: Signal inputs](https://angular.dev/guide/components/inputs)
- [Angular: ControlValueAccessor](https://angular.dev/api/forms/ControlValueAccessor)
- [Angular: Effects](https://angular.dev/guide/signals#effects)
- [MDN: aria-describedby](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-describedby)
- `docs/adr/ADR-009-v2-responsive-shell.md`, `docs/adr/ADR-013-fluent-design-tokens.md`
