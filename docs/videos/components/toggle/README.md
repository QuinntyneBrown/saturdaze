# 48 · Coding sd-toggle: a switch built on a real checkbox

> **Runtime:** ~7.2 min · **Audience:** developers who know basic Angular and want to build components in this library · **Prerequisites:** [Video 46: sd-text-input](../text-input/README.md) (ControlValueAccessor)

**Video:** [toggle.mp4](toggle.mp4) · [Slides](slides.html) · **Audio:** [toggle.mp3](toggle.mp3) · [Transcript](script.md)

## Why this video exists

`sd-toggle` shows how to build an accessible switch by styling a native checkbox with `role="switch"` instead of re-implementing one, and how a component decides who owns its state when a static input, a form and the user can all write it.

## Learning objectives

By the end, the viewer can:

- Hide a real `<input type="checkbox" role="switch">` over its label so clicks, focus and keyboard work natively.
- Give the control exactly one accessible name (`label` or `srLabel`).
- Use `input(false, { transform: booleanAttribute })` for `checked`.
- Explain the `effect()` + `formBound` flag: the static input seeds until `writeValue` takes over.
- Style checked, focus-visible and disabled states from the real input with sibling selectors.
- Read the spec's tests for naming, ownership and the form contract.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why not a `computed()` for `internalChecked`? | Three writers: input, form, user. |
| Why is `formBound` a plain field? | Flipping it must not re-run the effect. |
| When is `aria-label` set? | Only when there is no visible label: `srLabel() || null`. |
| How does a parent listen to changes? | Through the form or `ngModelChange`; the class has no `changed` output despite its doc comment. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/components/src/lib/toggle/toggle.ts` | Decorator, providers, inputs, signals, effect, accessor. |
| `frontend/projects/components/src/lib/toggle/toggle.html` | Label, input, track, label text. |
| `frontend/projects/components/src/lib/toggle/toggle.scss` | Hidden input, track/thumb, states. |
| `frontend/projects/components/src/lib/toggle/toggle.spec.ts` | Setup and the seven tests. |
| `frontend/projects/saturdaze/src/app/pages/sign-in/sign-in.page.html` | `formControlName="remember"`. |
| `frontend/projects/saturdaze/src/app/pages/family/family.page.html` | `srLabel` + `ngModel`. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:34 | Introduction | The switch; sign-in and family usages. |
| 00:35-01:36 | Decorator | Native control design, no host bindings (ADR-009), `NG_VALUE_ACCESSOR`. |
| 01:37-02:06 | Inputs | `label`, `srLabel`, `checked`; local signals. |
| 02:07-03:02 | Ownership | Effect + `formBound`; `handleChange`. |
| 03:03-03:49 | Template | Label, input, `aria-label` rule, track. |
| 03:50-04:55 | Styles | Invisible input, track/thumb, states, the literal `#fff`. |
| 04:56-06:12 | Spec | Structure, naming, ownership, form contract. |
| 06:13-07:12 | Recap | Pitfalls, things to remember, preview of `sdTooltip`. |

## Demo commands

```sh
cd frontend
npx ng test components     # runs the components library specs, toggle.spec.ts included
npm run storybook          # open Toggle
```

## Pitfalls

- Replacing the native checkbox with a styled `div`.
- An unlabelled toggle without `srLabel`.
- Expecting a `changed` output; use the form or `ngModelChange`.

## References

- [MDN: ARIA switch role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/switch_role)
- [Angular: ControlValueAccessor](https://angular.dev/api/forms/ControlValueAccessor)
- [Angular: Effects](https://angular.dev/guide/signals#effects)
- `docs/adr/ADR-013-fluent-design-tokens.md`
