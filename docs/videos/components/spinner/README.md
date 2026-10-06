# 42 · Coding sd-spinner: a decorative ring with an optional glyph

> **Runtime:** ~6.0 min · **Audience:** developers who know basic Angular · **Prerequisites:** none

**Video:** [spinner.mp4](spinner.mp4) · [Slides](slides.html) · **Audio:** [spinner.mp3](spinner.mp3) · [Transcript](script.md)

## Why this video exists

`sd-spinner` is the rotating ring behind every loading state, mostly through `sd-status-row`, and directly on the verify email page. It shows how far typed signal inputs and `host` bindings go on their own: no `computed()`, no `effect()`, no local state, and a decorative `aria-hidden` contract with its container.

## Learning objectives

By the end, the viewer can:

- Type an input as a string union (`'sm' | 'md'`) with a default.
- Derive classes from signals directly in the `host` block.
- Keep inputs as inputs: only classes and ARIA state go on the host (ADR-009).
- Explain why the spinner is `aria-hidden` and who supplies the words.
- Build the ring and rotation with tokens by role and `@keyframes`.
- Read a spec that proves bindings both set and clear.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why no `computed()`? | Each derived value is a one-line expression the host binding already tracks. |
| Why is it `aria-hidden`? | It is decoration; the container (a status row or a hidden live region) says it in words. |
| What turns it into a spinner disc? | A non-empty `icon` adds `.spinner-disc` and renders `sd-icon` inside. |
| Why test setting `md` after `sm`? | To prove the binding removes the class, not just adds it. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/saturdaze/src/app/pages/verify-email/verify-email.page.html` | Spinner in the auth card's disc slot plus a hidden status. |
| `frontend/projects/components/src/lib/spinner/spinner.ts` | Decorator, host bindings, two inputs. |
| `frontend/projects/components/src/lib/spinner/spinner.html` | Ring span and optional icon. |
| `frontend/projects/components/src/lib/spinner/spinner.scss` | Host box, small modifier, ring, `sd-spin`. |
| `frontend/projects/components/src/lib/spinner/spinner.spec.ts` | The `glyph`/`drawn` helpers and the three tests. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:22 | Introduction | Coding sd-spinner. |
| 00:22-00:55 | Usage | Where it is used. |
| 00:55-02:02 | Decorator | The decorator; Decorative by contract; Classes from signals. |
| 02:02-02:41 | Inputs | Two typed inputs; What it doesn't need. |
| 02:41-02:57 | Template | The template. |
| 02:57-03:44 | Styles | The host box; The ring. |
| 03:44-04:57 | Tests | Spec: compare the drawn glyph; Spec: the default; Spec: the disc; Spec: set, then clear. |
| 04:57-05:22 | Pitfalls | Pitfalls. |
| 05:22-05:59 | Recap | Things to remember; Coding sd-stars. |

## Demo commands

```sh
cd frontend
npx ng test components --watch=false --include='**/spinner/spinner.spec.ts'   # run the spinner spec
npm run storybook                                                              # open the Spinner stories
```

## Pitfalls

- Using a spinner as the only loading signal; it is `aria-hidden`.
- Passing a size other than `sm` or `md`; the union type rejects it.
- The stylesheet has no `prefers-reduced-motion` rule; keep spinners short-lived.

## References

- [Angular: Signal inputs](https://angular.dev/guide/components/inputs)
- [Angular: Binding to the host element](https://angular.dev/guide/components/host-elements)
- [MDN: aria-hidden](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-hidden)
- `docs/adr/ADR-013-fluent-design-tokens.md`
