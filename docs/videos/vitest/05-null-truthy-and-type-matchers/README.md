# 05 · Presence and type matchers

> **Runtime:** ~7.5 min · **Audience:** developers who write frontend unit tests in Saturdaze · **Prerequisites:** [Video 04 · toBe, toEqual and toMatchObject](../04-tobe-toequal-tomatchobject/README.md)

**Video:** [05-null-truthy-and-type-matchers.mp4](05-null-truthy-and-type-matchers.mp4) · [Slides](slides.html) · **Audio:** [05-null-truthy-and-type-matchers.mp3](05-null-truthy-and-type-matchers.mp3) · [Transcript](script.md)

## Why this video exists

After equality, the specs lean on coarser matchers: `toBeNull` (224 uses), `toBeTruthy` (62), `toBeUndefined` (15), `toBeTypeOf` (5), `toBeDefined` (4) and `toBeGreaterThan` (2), plus `expect(value, message)` in loops. The repository's choices are deliberate: `toBeNull` for absent elements because `querySelector` returns `null`, helpers that normalize optional chains with `?? null`, and `toBeTruthy` only as a smoke test.

## Learning objectives

By the end, the viewer can:

- Assert an absent element with `toBeNull` and explain why it beats `toBeFalsy`.
- Normalize `?.` results with `?? null` so every absence in a spec is `null`.
- Use `toBeUndefined` when `undefined` is the meaningful value (no guard, no error, `resolves` of a `void` method).
- Explain why `toBeDefined` is weak (it passes for `null`).
- Weigh `toBeTruthy` (component smoke tests, "something was rejected") against `toMatchObject`/`toThrow`.
- Use `toBeTypeOf` for lazy routes and `toBeGreaterThan` for a comparator's sign.
- Add a message as the second argument to `expect` inside loops.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why `toBeNull` for missing elements? | `querySelector` returns `null`; `toBeNull` passes only for `null`, unlike `toBeFalsy` (which also passes for `''`). |
| Why do page-spec helpers end in `?? null`? | `?.` on a missing element yields `undefined`; normalizing keeps one kind of absent. |
| What does `toBeDefined` let through? | `null`, `0`, `''` — anything but `undefined`. |
| What does `rejects.toBeTruthy()` prove? | That the promise rejected with something truthy — not which error. |
| Why `toBeTypeOf('function')` for routes? | The behaviour is "lazy-loads something", not which function. |
| Why `toBeGreaterThan(0)` for `bySortThenStart`? | A comparator's contract is its sign. |
| What does `expect(value, path)` add? | The message prefixes the failure: `sign-in: expected undefined to be type of 'function'`. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/components/src/lib/tooltip/tooltip.spec.ts` | `expect(bubble()).toBeNull()` / `.not.toBeNull()`. |
| `frontend/projects/saturdaze/src/app/app.spec.ts` | Top bar not null, site bar null; `dataset['page']` undefined. |
| `frontend/projects/saturdaze/src/app/pages/past/past.page.spec.ts` | `headerTitle` / `headerSubtitle` with `?? null`. |
| `frontend/projects/api/src/lib/api/weather.spec.ts` | `forecastFor(...)).toBeNull()`. |
| `frontend/projects/api/src/lib/services/weekend-plan.service.spec.ts` | `resolves.toBeNull()`, `rejects.toBeTruthy()`. |
| `frontend/projects/saturdaze/src/app/app.routes.spec.ts` | `toBeUndefined` guards, `toBeTypeOf`, `expect(hasTarget, route.path)`. |
| `frontend/projects/saturdaze/src/app/dialogs/family-member-dialog/family-member-dialog.spec.ts` | `errorOf('memberAge')).toBeUndefined()`. |
| `frontend/projects/api/src/lib/services/auth.service.spec.ts` | `resolves.toBeUndefined()`. |
| `frontend/projects/api/src/lib/api/api-base-url.spec.ts` | `toBeDefined()`. |
| `frontend/projects/saturdaze/src/app/auth/auth.interceptor.spec.ts` | `expect(error).toBeTruthy()` then the redirect checks. |
| `frontend/projects/api/src/lib/api/weekend-projection.spec.ts` | `toBeGreaterThan(0)` on the comparator. |
| `frontend/projects/saturdaze/src/app/app.config.spec.ts` | `providers.length).toBeGreaterThan(0)`. |
| `frontend/projects/saturdaze/src/app/pages/reset-password/reset-password.page.spec.ts` | `expect(title(), state)`. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:32 | Introduction | Title; the family and its counts. |
| 00:32-01:19 | toBeNull | `querySelector` returns `null`; tooltip and app chrome. |
| 01:19-02:18 | One absent | `?? null` helpers; `null` as a designed answer. |
| 02:18-02:57 | Undefined | Guards, data attributes, form errors; `resolves.toBeUndefined()`. |
| 02:57-03:27 | Defined | `toBeDefined` passes for `null`. |
| 03:27-04:35 | Truthy | Smoke tests; rejections; the trade-off. |
| 04:35-05:11 | Type | `toBeTypeOf` on lazy routes and the redirect. |
| 05:11-05:37 | Greater | Comparator sign; provider count. |
| 05:37-06:18 | Messages | `expect(value, message)`; the prefixed failure. |
| 06:18-06:47 | Pitfalls | Five pitfalls. |
| 06:47-07:31 | Recap | Things to remember; preview of video 06. |

## Demo commands

```sh
cd frontend
npx ng test saturdaze --watch=false --include='**/app.routes.spec.ts'
npx ng test components --watch=false --include='**/tooltip/tooltip.spec.ts'
npx ng test saturdaze --watch=false --include='**/auth/auth.interceptor.spec.ts'
```

## Pitfalls

- `toBeFalsy` / `not.toBeTruthy` for a missing element (`''` passes too).
- Mixing `null` and `undefined` for absence in one spec.
- Relying on `toBeDefined`, which passes for `null`.
- A truthy rejection as the only check when the error is the behaviour.
- Assertions in loops without a message.

## References

- [Vitest: toBeNull](https://vitest.dev/api/expect.html#tobenull)
- [Vitest: toBeTruthy](https://vitest.dev/api/expect.html#tobetruthy)
- [Vitest: toBeUndefined / toBeDefined](https://vitest.dev/api/expect.html#tobeundefined)
- [Vitest: toBeTypeOf](https://vitest.dev/api/expect.html#tobetypeof)
- [Vitest: expect (message argument)](https://vitest.dev/api/expect.html)
- [MDN: Document.querySelector()](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector)
