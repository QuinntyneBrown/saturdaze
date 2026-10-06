# 04 · Coding sd-avatar: a computed initial and host class bindings

> **Runtime:** ~7.0 min · **Audience:** developers who know basic Angular and are new to the Saturdaze components library · **Prerequisites:** [01 · sd-activity-card](../activity-card/README.md); [Consuming tokens](../../05-consuming-tokens/README.md) helps

**Video:** [avatar.mp4](avatar.mp4) · [Slides](slides.html) · **Audio:** [avatar.mp3](avatar.mp3) · [Transcript](script.md)

## Why this video exists

`sd-avatar` is the member initial (or photo) used by the top bar, Family, vote rows, review submissions and the profile-photo dialog. It is the first component in the series with derived state, so it introduces `computed()`, and it shows how a decorative host maps typed inputs onto the mock's (deliberately odd) modifier classes.

## Learning objectives

By the end, the viewer can:

- Write a decorative (`aria-hidden`) standalone, OnPush component whose host is the mock's `.avatar`.
- Map union-typed inputs to one `[class.…]` host binding per modifier, keeping the mock's class names (`avatar--q`, `--s`, `--e`, `--m`).
- Keep inputs as inputs: no reflected `name`/`tone`/`size` attributes, only classes and ARIA on the host (ADR-009).
- Derive the initial with a pure, memoised `computed()`.
- Render a photo or the initial with `@if` and an `ng-container`.
- Explain what each test in `avatar.spec.ts` proves, and that `src` has no test yet.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why is the avatar `aria-hidden`? | The member's name is always written next to it; reading it twice is noise. |
| Why `avatar--q` for the primary tone? | The mock names person tones after the family (Quinn, Sara, Eli, Mae); ADR-009 keeps the mock's classes verbatim. |
| Why a `computed()` for the initial? | Derived from a signal, side-effect free, recomputed only when `name` changes, readable and testable. |
| Why no `avatar--lg` class? | Large is the base size of `.avatar`. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/saturdaze/src/app/pages/family/family.page.html` | Member avatar with tone and size. |
| `frontend/projects/saturdaze/src/app/dialogs/profile-photo-dialog/profile-photo-dialog.html` | Avatar with `src` as a live preview. |
| `frontend/projects/components/src/lib/avatar/avatar.ts` | Decorator, host class bindings, inputs, `initial`. |
| `frontend/projects/components/src/lib/avatar/avatar.html` | Photo or initial. |
| `frontend/projects/components/src/lib/avatar/avatar.scss` | Sizes and paired tone tokens. |
| `frontend/projects/components/src/lib/avatar/avatar.spec.ts` | Five tests; the tone-to-class table. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:33 | Introduction | What the avatar is; where it is used. |
| 00:34-02:20 | Decorator | `aria-hidden`, size and tone class bindings, mock class names, photo modifier, no reflected attributes. |
| 02:21-03:33 | Inputs | Four typed inputs; the `initial` computed. |
| 03:34-03:58 | Template | `@if` photo with empty `alt`, else the initial. |
| 03:59-04:44 | Styles | Sizes, background/foreground token pairs, photo fit. |
| 04:45-06:02 | Tests | Defaults, the computed, the tone table, sizes; `src` gap. |
| 06:03-06:23 | Pitfalls | Base size, class names, alt text, side effects. |
| 06:24-07:00 | Recap | Things to remember; preview of video 05. |

## Demo commands

```sh
cd frontend
npx ng test components --include='**/avatar/*.spec.ts'
npm run storybook          # Components → Avatar
```

## Pitfalls

- Adding an `avatar--lg` class; large is the base.
- Renaming `avatar--q/s/e/m`, breaking parity with the mock.
- Giving the image real `alt` text inside an `aria-hidden` host.
- Putting side effects inside `computed()`.

## References

- [Angular: Signals (computed)](https://angular.dev/guide/signals)
- [Angular: Binding to the host element](https://angular.dev/guide/components/host-elements)
- `docs/adr/ADR-009-v2-responsive-shell.md`, `docs/adr/ADR-013-fluent-design-tokens.md`
