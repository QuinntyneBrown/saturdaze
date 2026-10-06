# 18 · Coding sd-details: label and value pairs from one input

> **Runtime:** ~6.7 min · **Audience:** developers who know basic Angular and want to build or change `sd-details` · **Prerequisites:** [Video 10 · sd-card](../card/README.md) (host class, signal inputs)

**Video:** [details.mp4](details.mp4) · [Slides](slides.html) · **Audio:** [details.mp3](details.mp3) · [Transcript](script.md)

## Why this video exists

`sd-details` shows a submission's facts on the Review submissions page. It is a small presentational component that demonstrates an exported item type, a `readonly` array signal input, `@for` with `@if / @else if / @else`, safe external links (`target="_blank"` + `rel="noopener"`), a configurable placeholder, and a responsive grid. It also raises two honest caveats: `<dt>`/`<dd>` are rendered inside the `sd-details` host rather than a real `<dl>`, and the 576px media query is not one of the shared breakpoints.

## Learning objectives

By the end, the viewer can:

- Export an item interface and accept `input<readonly DetailItem[]>([])`.
- Choose template control flow over a `computed()` view model for per-item rendering.
- Render external links safely and never render an empty link.
- Make a placeholder text configurable and prove it is live in a test.
- Spot semantic and breakpoint issues worth fixing.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why `readonly` in the input type? | The component promises not to mutate the parent's array. |
| Why check `href && value` first? | An href without a value falls back to the placeholder, avoiding a nameless link. |
| Why `rel="noopener"`? | The opened page cannot reach back through `window.opener`. |
| Why `overflow-wrap: anywhere`? | Long URLs break instead of overflowing narrow cards. |
| What could be improved? | Render a real `<dl>` (or give the host a role); use `respond-to()` if the grid should follow shared breakpoints. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/components/src/lib/details/details.ts` | `DetailItem`, decorator, two inputs. |
| `frontend/projects/components/src/lib/details/details.html` | `@for`, link / value / placeholder branches. |
| `frontend/projects/components/src/lib/details/details.scss` | Grid, faint value, link, 576px media query. |
| `frontend/projects/components/src/lib/details/details.spec.ts` | `ITEMS` fixture and five tests. |
| `frontend/projects/saturdaze/src/app/pages/review-submissions/review-submissions.page.html` | `<sd-details [items]="details(card)" />`. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:36 | Introduction | Title; Where the app uses it. |
| 00:37-01:19 | Decorator | An exported item type; The decorator. |
| 01:20-01:57 | Inputs | Two inputs. |
| 01:58-02:57 | Template | The template; Safe links, never empty. |
| 02:58-04:25 | Styles | Styles; Two columns from 576px; A semantics caveat. |
| 04:26-05:42 | Spec | Spec fixture; A live placeholder; Links, locked in. |
| 05:43-06:07 | Pitfalls | Pitfalls. |
| 06:08-06:39 | Recap | Things to remember; preview of `sd-dialog`. |

## Demo commands

```sh
cd frontend
npx ng test components --include='**/details/details.spec.ts'   # run the details spec
npm run storybook                                               # Components → Details → Missing values / With link
```

## Pitfalls

- `target="_blank"` without `rel="noopener"`.
- Rendering a link with no text.
- Mutating the input array.
- `<dt>`/`<dd>` outside a real `<dl>`.
- One-off media queries instead of the shared mixin.

## References

- [Angular: Control flow](https://angular.dev/guide/templates/control-flow)
- [MDN: `<dl>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dl)
- [MDN: `rel="noopener"`](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/noopener)
- `docs/adr/ADR-009-v2-responsive-shell.md`, `docs/adr/ADR-013-fluent-design-tokens.md`
