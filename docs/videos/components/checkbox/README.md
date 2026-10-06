# 11 · Coding sd-checkbox: a native box that speaks reactive forms

> **Runtime:** ~7.6 min · **Audience:** developers who know basic Angular and want to build or change `sd-checkbox` · **Prerequisites:** [Video 10 · sd-card](../card/README.md) (host bindings, signal inputs)

**Video:** [checkbox.mp4](checkbox.mp4) · [Slides](slides.html) · **Audio:** [checkbox.mp3](checkbox.mp3) · [Transcript](script.md)

## Why this video exists

`sd-checkbox` is the library's smallest form control. It shows when to use signal inputs (configuration: `required`, `name`) versus local `signal()` state (`checked`, `disabled`, owned through the forms API), how `ControlValueAccessor` and the `NG_VALUE_ACCESSOR` provider make a component work with `formControlName`, and why a native input inside a label gives accessibility for free.

## Learning objectives

By the end, the viewer can:

- Register a component as a value accessor with `forwardRef` and `multi: true`.
- Choose `signal()` over `input()`/`model()` for state the form owns.
- Implement `writeValue`, `registerOnChange`, `registerOnTouched` and `setDisabledState`.
- Build an accessible checkbox from a wrapping `<label>`, a native input and `aria-required`.
- Test the forms contract directly by calling the accessor methods.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why is `checked` a signal and not a `model()`? | The form control is the single source of truth; a model would add a second one. |
| Why `forwardRef`? | The class is referenced in its own decorator before it is defined. |
| Why `!!value` in `writeValue`? | A reset form can write `null`. |
| Why call `onTouched` on change? | So touched-based validation messages appear after the first click. |
| Why does the host carry no `checked`/`required` attributes? | Inputs stay inputs; state lives on the native input, and ADR-009 keeps only classes and ARIA state on a host. |
| Why `display: contents` on the host? | ADR-009: the label sits in the layout and the native input carries the accessible name. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/components/src/lib/checkbox/checkbox.ts` | Decorator, provider, inputs, signals, accessor methods. |
| `frontend/projects/components/src/lib/checkbox/checkbox.html` | Label, native input, bindings, slot. |
| `frontend/projects/components/src/lib/checkbox/checkbox.scss` | `display: contents`, `accent-color` token. |
| `frontend/projects/components/src/lib/checkbox/checkbox.spec.ts` | Host component, helper, six tests. |
| `frontend/projects/saturdaze/src/app/pages/create-account/create-account.page.html` | Terms and Friday preview checkboxes. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:32 | Introduction | Title; Where the app uses it. |
| 00:33-01:28 | Decorator | The decorator; The value accessor provider. |
| 01:29-02:32 | State | Inputs vs. local signals; Why not input() or model() for checked?. |
| 02:33-03:25 | Forms contract | The forms contract; Two directions. |
| 03:26-04:19 | Template | The template; Accessibility for free. |
| 04:20-04:55 | Styles | Styles. |
| 04:56-06:28 | Spec | Spec setup; Structure and inputs; The forms contract; Projection. |
| 06:29-06:57 | Pitfalls | Pitfalls. |
| 06:58-07:35 | Recap | Things to remember; preview of `sd-chip`. |

## Demo commands

```sh
cd frontend
npx ng test components --include='**/checkbox/checkbox.spec.ts'   # run the checkbox spec
npm run storybook                                                 # Components → Checkbox → Reactive forms
```

## Pitfalls

- Making `checked` an input or a model alongside the form.
- Forgetting `forwardRef` (or `multi: true`) in the provider.
- Not coercing `null` in `writeValue`.
- Calling `onChange` without `onTouched`.
- Replacing the native input with a styled element.

## References

- [Angular: Signals](https://angular.dev/guide/signals)
- [Angular API: ControlValueAccessor](https://angular.dev/api/forms/ControlValueAccessor)
- [MDN: `<input type="checkbox">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox)
- `docs/adr/ADR-009-v2-responsive-shell.md`, `docs/adr/ADR-013-fluent-design-tokens.md`
