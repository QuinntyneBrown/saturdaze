# 15 · Coding sd-cover: a photo header with a readable scrim

> **Runtime:** ~7.5 min · **Audience:** developers who know basic Angular and want to build or change `sd-cover` · **Prerequisites:** [Consuming tokens](../../05-consuming-tokens/README.md) (knobs, breakpoints, `respond-to()`)

**Video:** [cover.mp4](cover.mp4) · [Slides](slides.html) · **Audio:** [cover.mp3](cover.mp3) · [Transcript](script.md)

## Why this video exists

`sd-cover` is the hero of the Weekend screen (L2-108). It shows an input `alias`, `@let` with `@if` type narrowing, a well-behaved hero image (explicit dimensions, `loading="eager"`, `fetchpriority="high"`), a decorative `aria-hidden` fallback, a single named slot, a `--sd-` scrim knob built with `color-mix`, and `respond-to(tablet)`. The folder has **no spec file**; the video says so and lists what a spec should prove, and points at the Playwright coverage that exists.

## Learning objectives

By the end, the viewer can:

- Bind a host modifier directly to a signal (`[class.cover--fallback]`: `!media()`).
- Use `input('', { alias: 'title' })` to keep a public name while the class uses a clearer one.
- Read a signal once with `@let` and rely on `@if` narrowing.
- Render a hero image without layout shift and with the right loading priority.
- Keep overlaid text readable with a gradient scrim and tokens by role.
- Write a spec checklist for a component that has none.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why `alias: 'title'`? | The page keeps the mock's `title`; the class uses `coverTitle`, distinct from the native `title` attribute. |
| Why `@let m = media()`? | One read, a local name, and type narrowing inside `@if (m)`. |
| Why eager and high priority? | It is the largest element above the fold. |
| Why is the fallback `aria-hidden`? | It is decoration; the `h1` and text carry the content. |
| Is there a unit spec? | No. The behaviour is covered by `e2e/tests/weekend-cover.spec.ts`; a unit spec would be faster. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/components/src/lib/cover/cover.ts` | Decorator, doc comment, inputs and alias. |
| `frontend/projects/components/src/lib/cover/cover.html` | `@let`, image, fallback, body, edit slot. |
| `frontend/projects/components/src/lib/cover/cover.scss` | Scrim knob, body gradient, `respond-to(tablet)`. |
| `frontend/projects/components/src/lib/media/media.ts` | `CardMedia` and `MediaTone`. |
| `frontend/projects/saturdaze/src/app/pages/weekend/weekend.page.html` | The only usage. |
| `e2e/tests/weekend-cover.spec.ts` | Existing end-to-end coverage. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:43 | Introduction | Title; Where the app uses it. |
| 00:44-01:29 | Decorator | The decorator; Two design promises. |
| 01:30-02:36 | Inputs | Five inputs, no outputs; An alias for the public name. |
| 02:37-04:06 | Template | @let + @if: read once, narrow the type; Fallback, body and the edit slot. |
| 04:07-05:25 | Styles | A scrim knob on the host; Contrast by design; Responsive without a magic number. |
| 05:26-06:30 | Testing | No cover.spec.ts — what one should prove; Covered end to end today. |
| 06:31-06:55 | Pitfalls | Pitfalls. |
| 06:56-07:31 | Recap | Things to remember; preview of `sd-date-tile`. |

## Demo commands

```sh
cd frontend
npm run storybook                                    # Components → Cover → Default / Fallback
cd ../e2e && npx playwright test tests/weekend-cover.spec.ts   # existing end-to-end coverage
```

## Pitfalls

- Omitting `width`/`height` on the image.
- Lazy-loading the hero image.
- Rendering the `h1` in only one branch.
- Hard-coding the 720px breakpoint.
- Making the fallback tile visible to assistive technology.

## References

- [Angular: Accepting data with input properties (aliases)](https://angular.dev/guide/components/inputs)
- [Angular: `@let` template variables](https://angular.dev/guide/templates/variables)
- [MDN: `fetchpriority`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#fetchpriority)
- `docs/adr/ADR-009-v2-responsive-shell.md`, `docs/adr/ADR-013-fluent-design-tokens.md`
