# 08 · Coding sd-browser-frame: inject, a signal, a computed and a ResizeObserver

> **Runtime:** ~7.1 min · **Audience:** developers who know basic Angular and are new to the Saturdaze components library · **Prerequisites:** [04 · sd-avatar](../avatar/README.md) (first `computed()`)

**Video:** [browser-frame.mp4](browser-frame.mp4) · [Slides](slides.html) · **Audio:** [browser-frame.mp3](browser-frame.mp3) · [Transcript](script.md)

## Why this video exists

`sd-browser-frame` draws a small browser window around the landing hero's live miniature of the Weekend screen, laid out at a fixed size and scaled to fit. It is the first component in the series that measures the DOM, so it shows the modern combination of `inject()`, a local `signal()`, a `computed()` scale, `afterNextRender` and `DestroyRef`, and why it needs no `effect()`.

## Learning objectives

By the end, the viewer can:

- Inject `ElementRef` and `DestroyRef` with `inject()` in field initialisers.
- Feed CSS custom properties from signals with `[style.--_s]` and unit bindings like `[style.--_w.px]`.
- Hold measured state in a private `signal()` and derive a clamped scale with `computed()`.
- Start a `ResizeObserver` once, in the browser only, with `afterNextRender`, and disconnect it via `DestroyRef`.
- Explain why `effect()` is the wrong tool here.
- Explain what each test in `browser-frame.spec.ts` proves.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why `afterNextRender`? | Runs once after render, in the browser only (not during SSR), when the element has a size. |
| Why no `effect()`? | Nothing reacts to a signal; the observer must start once and *feed* a signal. |
| What does `scale` guarantee? | Never above 1; 1 when nothing has been measured yet. |
| Why `.px` in the binding? | The inputs stay plain numbers; Angular appends the unit. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/saturdaze/src/app/pages/landing/landing.page.html` | `<sd-browser-frame url="saturdaze.app/weekend">`. |
| `frontend/projects/components/src/lib/browser-frame/browser-frame.ts` | Host style bindings, `inject()`, inputs, `hostWidth`, `scale`, constructor. |
| `frontend/projects/components/src/lib/browser-frame/browser-frame.html` | Bar, view, scale slot. |
| `frontend/projects/components/src/lib/browser-frame/browser-frame.scss` | `calc()` height and `transform: scale()` from custom properties. |
| `frontend/projects/components/src/lib/browser-frame/browser-frame.spec.ts` | `whenStable`, five tests. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:29 | Introduction | The landing miniature; what this component teaches. |
| 00:30-01:44 | Decorator | `aria-hidden`, no reflected `url`, custom-property style bindings. |
| 01:45-02:32 | Inputs | `inject()` fields; url, frame width and height. |
| 02:33-03:16 | Scale | Private `hostWidth` signal; the clamped `computed()`. |
| 03:17-04:26 | Measuring | `afterNextRender`, `ResizeObserver`, `DestroyRef`; why no `effect()`. |
| 04:27-05:10 | Template | Bar, view, slot; geometry and tokens in SCSS. |
| 05:11-06:15 | Tests | Setup with `whenStable`; five tests. |
| 06:16-06:32 | Pitfalls | Measuring too early, leaks, effects, upscaling. |
| 06:33-07:07 | Recap | Things to remember; preview of video 09. |

## Demo commands

```sh
cd frontend
npx ng test components --include='**/browser-frame/*.spec.ts'
npm run storybook          # Components → Browser Frame
```

## Pitfalls

- Measuring in the constructor or a field initialiser, before the element has a size.
- Forgetting to disconnect the `ResizeObserver`.
- Starting the observer from an `effect()`.
- Letting the scale exceed 1, which blurs the miniature.

## References

- [Angular: afterNextRender](https://angular.dev/api/core/afterNextRender)
- [Angular: Signals](https://angular.dev/guide/signals)
- [Angular: inject](https://angular.dev/api/core/inject)
- [MDN: ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)
- `docs/adr/ADR-009-v2-responsive-shell.md`, `docs/adr/ADR-013-fluent-design-tokens.md`
