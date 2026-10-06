# 45 · Coding sd-strength: a three segment meter from two inputs

> **Runtime:** ~6.9 min · **Audience:** developers who know basic Angular and want to build components in this library · **Prerequisites:** [Consuming tokens](../../05-consuming-tokens/README.md) helps

**Video:** [strength.mp4](strength.mp4) · [Slides](slides.html) · **Audio:** [strength.mp3](strength.mp3) · [Transcript](script.md)

## Why this video exists

`sd-strength` is the smallest useful pattern in the library: two signal inputs, host bindings that turn one value into a modifier class, and an encapsulated stylesheet that does the rest. It also shows a live region placed where it has to be — on the host — so label changes are announced.

## Learning objectives

By the end, the viewer can:

- Declare a standalone, OnPush component whose host is the BEM block (`strength`) and a polite live region.
- Use `input()` with a `null` default and read it directly in host bindings (`[class.strength--weak]`, `[attr.level]`).
- Explain why the component needs no `computed()`, `output()` or `ngOnChanges`.
- Fill one, two or three segments from a level with `:host(.strength--…)` and `nth-child`, using status and palette tokens by role.
- Test inputs with `fixture.componentRef.setInput` and assert host classes and attributes.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why is `aria-live` on the host? | A live region must exist before its content changes; the label span comes and goes. |
| Why are the segments `aria-hidden`? | They are decoration; the label carries the meaning. |
| Where is the level computed? | In the page, via `passwordStrength()` in `saturdaze/src/app/shared/password-strength.ts`. |
| What does `null` mean? | No password yet: no modifier class, no `level` attribute, grey segments. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/components/src/lib/strength/strength.ts` | `StrengthLevel`, decorator, host bindings, the two inputs. |
| `frontend/projects/components/src/lib/strength/strength.html` | The bar of three segments and the optional label. |
| `frontend/projects/components/src/lib/strength/strength.scss` | Grid bar, `nth-child` level rules, tokens. |
| `frontend/projects/components/src/lib/strength/strength.spec.ts` | Setup and the four tests. |
| `frontend/projects/saturdaze/src/app/pages/create-account/create-account.page.html` | The real usage. |
| `frontend/projects/saturdaze/src/app/shared/password-strength.ts` | The page-side helper that returns level and label. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:48 | Introduction | What the meter is; create-account and reset-password usages; the exported type. |
| 00:49-02:23 | Decorator | Standalone, OnPush, host class, `aria-live`, modifier bindings, `[attr.level]`. |
| 02:24-03:42 | Inputs | Two `input()` signals; what the component doesn't need. |
| 03:43-04:06 | Template | `aria-hidden` bar, `@if` label. |
| 04:07-05:01 | Styles | Grid bar, level rules, tokens by role. |
| 05:02-05:55 | Spec | TestBed setup and the four tests. |
| 05:56-06:16 | Pitfalls | Live region placement, colour only through `level`. |
| 06:17-06:53 | Recap | Things to remember; preview of `sd-text-input`. |

## Demo commands

```sh
cd frontend
npx ng test components                               # runs the components library specs, strength.spec.ts included
npm run storybook                                    # open Strength
```

## Pitfalls

- Moving `aria-live` onto the conditional label span (it would not announce reliably).
- Colouring the meter with page-level classes instead of the `level` input.
- Making segments focusable or giving them roles.

## References

- [Angular: Signal inputs](https://angular.dev/guide/components/inputs)
- [Angular: Host elements](https://angular.dev/guide/components/host-elements)
- [MDN: aria-live](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-live)
- `docs/adr/ADR-009-v2-responsive-shell.md`, `docs/adr/ADR-013-fluent-design-tokens.md`
