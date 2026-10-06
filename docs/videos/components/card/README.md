# 10 · Coding sd-card: a host that is the surface

> **Runtime:** ~7.2 min · **Audience:** developers who know basic Angular and want to build or change `sd-card` · **Prerequisites:** [Consuming tokens](../../05-consuming-tokens/README.md) helps

**Video:** [card.mp4](card.mp4) · [Slides](slides.html) · **Audio:** [card.mp3](card.mp3) · [Transcript](script.md)

## Why this video exists

`sd-card` is the simplest example of the ADR-009 class contract: the host element *is* the mock's `.card` block, and every input toggles a host modifier. Building it step by step shows signal inputs with defaults, the `booleanAttribute` transform, host bindings that read signals, attribute mirroring with `null`, and a spec that drives inputs through `setInput`.

## Learning objectives

By the end, the viewer can:

- Write a standalone, OnPush component whose host carries the mock's BEM block and modifier classes.
- Declare string-union and boolean signal inputs with defaults and `transform: booleanAttribute`.
- Bind host classes and attributes to signals, and remove an attribute by returning `null`.
- Port a mock CSS block to encapsulated `:host(.modifier)` rules using tokens by role.
- Read and extend `card.spec.ts`.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why is there no wrapper element? | The host is the card (ADR-009); page objects and the spec expect content directly inside it. |
| Why `booleanAttribute`? | So `<sd-card locked>` (an empty-string attribute) type-checks and becomes `true`. |
| Why no `computed()`? | Each host binding is a single comparison; `computed` is for shared or non-trivial derivations. |
| How is an attribute removed? | The binding returns `null`. |
| Are `locked` / `dimmed` / `muted` accessible? | No, they are visual only; say the state in text (a chip). |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/components/src/lib/card/card.ts` | Decorator, host object, inputs. |
| `frontend/projects/components/src/lib/card/card.html` | The single `<ng-content />`. |
| `frontend/projects/components/src/lib/card/card.scss` | `:host` surface, sunk/locked modifiers, hover media query. |
| `frontend/projects/components/src/lib/card/card.spec.ts` | Host component, `setInput`, the four tests. |
| `docs/mocks/styles/app.css` | The `.card` block and modifiers. |
| `frontend/projects/saturdaze/src/app/...` | Usages in three dialogs, Family and Review submissions. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:39 | Introduction | Title; Where the app uses it. |
| 00:40-01:33 | Decorator | The decorator; The host is the card. |
| 01:34-02:59 | Inputs | Two string-union inputs with defaults; Boolean flags. |
| 03:00-03:54 | Host bindings | Host bindings read the signals; Mirror state as attributes. |
| 03:55-04:53 | Template & styles | Template: one slot; Styles: tokens by role; Hover only where hover exists. |
| 04:54-06:05 | Spec | Spec setup; The four tests; On, then off again. |
| 06:06-06:35 | Pitfalls | Pitfalls. |
| 06:36-07:13 | Recap | Things to remember; preview of `sd-checkbox`. |

## Demo commands

```sh
cd frontend
npx ng test components --include='**/card/card.spec.ts'   # run the card spec
npm run storybook                                         # Components → Card
grep -rn "<sd-card" projects/saturdaze/src                # find usages
```

## Pitfalls

- Treating `locked`, `dimmed` or `muted` as the only signal of state.
- Using `interactive` without a real button or link inside.
- Adding a wrapper element to the template.
- Hard-coding a colour in a new modifier instead of a token by role.

## References

- [Angular: Accepting data with input properties](https://angular.dev/guide/components/inputs)
- [Angular: Host elements](https://angular.dev/guide/components/host-elements)
- [Angular: Content projection](https://angular.dev/guide/components/content-projection)
- `docs/adr/ADR-009-v2-responsive-shell.md`, `docs/adr/ADR-013-fluent-design-tokens.md`
