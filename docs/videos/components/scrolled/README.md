# 35 · Coding sd-scrolled: the [sdScrolled] directive, a signal and no template

> **Runtime:** ~6.5 min · **Audience:** developers who know basic Angular · **Prerequisites:** [Components series index](../README.md)

**Video:** [scrolled.mp4](scrolled.mp4) · [Slides](slides.html) · **Audio:** [scrolled.mp3](scrolled.mp3) · [Transcript](script.md)

## Why this video exists

`[sdScrolled]` has no template: a writable `signal()` drives one host attribute, set up in `afterNextRender`, cleaned up with `DestroyRef`, with the scroll listener outside Angular's zone. `sd-top-bar` and `sd-sitebar` apply it through `hostDirectives`.

## Learning objectives

By the end, the viewer can:

- Write an attribute directive whose host binding reads a signal (`data-scrolled`).
- Do browser-only setup in `afterNextRender` and clean up with `DestroyRef.onDestroy`.
- Run a passive listener with `runOutsideAngular` and re-enter only when state flips.
- Apply a directive with `hostDirectives` and style `:host([data-scrolled])`.
- Walk through the six tests in `scrolled.spec.ts`, including the leak test.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why `afterNextRender`? | Runs once, after first render, only in the browser — no `window` on the server. |
| Why outside the zone? | Scroll fires many times a second; only a state flip should trigger change detection. |
| Why no `effect()`? | It reacts to a DOM event, not to a signal. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/components/src/lib/scrolled/scrolled.ts` | The whole directive. |
| `frontend/projects/components/src/lib/top-bar/top-bar.ts` | `hostDirectives: [Scrolled]`. |
| `frontend/projects/components/src/lib/top-bar/top-bar.scss` | `:host([data-scrolled])` backdrop. |
| `frontend/projects/components/src/lib/scrolled/scrolled.spec.ts` | Six tests and `setScrollY`. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:36 | Introduction | A directive with no template. |
| 00:37-01:17 | Usage | Top bar and site bar via `hostDirectives`; the backdrop style. |
| 01:18-02:04 | Decorator | `@Directive`, selector, host attribute binding. |
| 02:05-02:35 | State | `inject()` and one public signal. |
| 02:36-04:01 | Constructor | `afterNextRender`, zone, passive listener, cleanup, no effect. |
| 04:02-05:25 | Testing | Setup and the six tests. |
| 05:26-05:50 | Pitfalls | SSR, zone, cleanup, nested scrollers, page templates. |
| 05:51-06:28 | Recap | Things to remember; next: `sd-section`. |

## Demo commands

```sh
cd frontend
npx ng test components --include='**/scrolled/scrolled.spec.ts'
```

## Pitfalls

- Touching `window` in the constructor instead of `afterNextRender`.
- Listening inside the zone (change detection on every scroll).
- No `removeEventListener` on destroy.
- Expecting nested scroll containers to be tracked (it watches the window).
- Adding `sdScrolled` in page templates instead of `hostDirectives`.

## References

- [Angular: afterNextRender](https://angular.dev/api/core/afterNextRender)
- [Angular: Directive composition API (hostDirectives)](https://angular.dev/guide/directives/directive-composition-api)
- [Angular: DestroyRef](https://angular.dev/api/core/DestroyRef)
- [MDN: addEventListener passive](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#passive)
