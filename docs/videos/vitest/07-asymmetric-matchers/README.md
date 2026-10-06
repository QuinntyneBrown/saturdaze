# 07 · Asymmetric matchers: objectContaining, any, anything and stringMatching

> **Runtime:** ~8 min · **Audience:** developers writing Saturdaze unit tests · **Prerequisites:** [Video 04 · toBe, toEqual and toMatchObject](../04-tobe-toequal-tomatchobject/README.md), [Video 06 · Strings and collections](../06-strings-and-collections/README.md)

**Video:** [07-asymmetric-matchers.mp4](07-asymmetric-matchers.mp4) · [Slides](slides.html) · **Audio:** [07-asymmetric-matchers.mp3](07-asymmetric-matchers.mp3) · [Transcript](script.md)

## Why this video exists

Dialog and menu calls carry more than any one test cares about (`DIALOG_OPTIONS` alone has four settings). The specs state whole calls in one `toHaveBeenCalledWith` and mark the parts they don't care about with asymmetric matchers: `expect.objectContaining` (25 uses in 9 spec files), `expect.any` (5), `expect.anything` (2) and `expect.stringMatching` (1). Knowing exactly how strict each one is, above all that `objectContaining` compares listed values with full deep equality, keeps tests focused without making them vague.

## Learning objectives

By the end, the viewer can:

- Place asymmetric matchers inside `toEqual`, `toHaveBeenCalledWith`, `toHaveBeenNthCalledWith` and `toHaveBeenLastCalledWith`.
- Use `expect.objectContaining` to ignore extra keys, and explain why nested values are still compared exactly.
- Nest matchers: plain arrays fix length and order; `objectContaining` items match by id.
- Pin a type with `expect.any(HTMLElement | Function | String)`.
- Use `expect.anything()` as a non-null placeholder argument.
- Pin the shape of a date with `expect.stringMatching`.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Is `objectContaining` partial all the way down? | No. Each listed property must exist and its value is compared with `equals` (deep, exact). Nest another matcher or use `toMatchObject` for deeper partials. |
| Why `expect.any(Function)` in the scrolled spec? | The listener is a local arrow function inside `afterNextRender`; the test can't reference it. |
| Why `expect.anything()` instead of omitting the argument? | `toHaveBeenCalledWith` compares the whole argument list; `anything()` says a non-null config was passed. |
| What does `expect.anything()` reject? | `null` and `undefined` (`other != null`). |
| Why `stringMatching` for `plan`? | `upcomingSaturdayIso()` depends on the day the test runs; the pattern pins `YYYY-MM-DD`. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/saturdaze/src/app/dialogs/confirm-dialog/confirm-dialog.ts` | `DIALOG_OPTIONS`. |
| `frontend/projects/saturdaze/src/app/pages/ideas/ideas.page.ts`, `ideas.page.spec.ts` | `open(SubmitEventDialog, DIALOG_OPTIONS)`; `toHaveBeenNthCalledWith` with `objectContaining`. |
| `frontend/projects/saturdaze/src/app/dialogs/commitment-dialog/commitment-dialog.spec.ts` | `objectContaining` on `dialogRef.close`. |
| `frontend/node_modules/@vitest/expect/dist/index.js` | `ObjectContaining`, `Any`, `Anything` match logic. |
| `frontend/projects/saturdaze/src/app/pages/family/family.page.spec.ts` | Loose envelope, exact `data`. |
| `frontend/projects/saturdaze/src/app/pages/weekend/weekend.page.spec.ts`, `weekend.page.ts` | Nested matchers in the menu; `anything()`; `stringMatching` on `plan`. |
| `frontend/projects/components/src/lib/scrolled/scrolled.ts`, `scrolled.spec.ts` | `expect.any(Function)` for the scroll listener. |
| `frontend/projects/api/src/lib/services/session-store.spec.ts` | `expect.any(String)` for timestamps. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:34 | Introduction | Title; four matchers by use count. |
| 00:34-01:17 | Why | `DIALOG_OPTIONS`; where matchers can sit. |
| 01:17-02:28 | objectContaining | Ideas page D10/D11; commitment dialog result. |
| 02:28-03:22 | Strictness | Vitest source; family page `data`. |
| 03:22-04:06 | Nesting | Weekend More options menu. |
| 04:06-05:31 | any | Constructors; scroll listener; timestamps. |
| 05:31-06:14 | anything | Calendar and confirm dialogs. |
| 06:14-06:50 | stringMatching | `plan` with an ISO date pattern. |
| 06:50-07:20 | Pitfalls | Four pitfalls. |
| 07:20-08:01 | Recap | Things to remember; preview of video 08. |

## Demo commands

```sh
cd frontend
npx ng test saturdaze --include='**/pages/weekend/weekend.page.spec.ts'   # nested matchers, anything, stringMatching
npx ng test components --include='**/scrolled/scrolled.spec.ts'          # expect.any(Function)
npx ng test api --include='**/services/session-store.spec.ts'            # expect.any(String)
```

## Pitfalls

- Assuming `objectContaining` is partial at every depth.
- Scattering `expect.anything()` until the assertion proves nothing.
- Using `expect.anything()` for an argument that may be `undefined`.
- Calling `expect.any()` without a constructor (throws).

## References

- [Vitest: expect.objectContaining](https://vitest.dev/api/expect.html#expect-objectcontaining)
- [Vitest: expect.any](https://vitest.dev/api/expect.html#expect-any)
- [Vitest: expect.anything](https://vitest.dev/api/expect.html#expect-anything)
- [Vitest: expect.stringMatching](https://vitest.dev/api/expect.html#expect-stringmatching)
