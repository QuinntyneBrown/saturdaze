# 08 · Promises and errors: resolves, rejects and toThrow

> **Runtime:** ~7.2 min · **Audience:** developers writing Saturdaze unit tests, especially API service specs · **Prerequisites:** [Video 03 · describe.each](../03-describe-each/README.md), [Video 04 · toBe, toEqual and toMatchObject](../04-tobe-toequal-tomatchobject/README.md)

**Video:** [08-resolves-rejects-and-tothrow.mp4](08-resolves-rejects-and-tothrow.mp4) · [Slides](slides.html) · **Audio:** [08-resolves-rejects-and-tothrow.mp3](08-resolves-rejects-and-tothrow.mp3) · [Transcript](script.md)

## Why this video exists

Services return promises, dialogs resolve on close and failures should reject with a useful error. The specs make 40 `resolves`/`rejects` assertions (every one awaited) and 4 `toThrow` assertions. The API service specs share an ordering rule (call, flush the `HttpTestingController` request, then await) that turns a would-be hang into a clear failure. `weekend-plan.service.spec.ts` shows why an async method's throw needs `rejects.toThrow`, not `toThrow`.

## Learning objectives

By the end, the viewer can:

- Write `await expect(promise).resolves.…` and `.rejects.…`, and explain why the `await` is required.
- Choose `resolves.toBe` (identity) and `resolves.toBeUndefined` (success, no value).
- Assert the shape of a rejection with `toEqual` / `toMatchObject` (plus `satisfies Partial<AuthError>`), and know when `rejects.toBeTruthy` is enough.
- Order HTTP specs: start the call, `expectOne(...).flush(...)`, then await the assertion.
- Pass a function to `toThrow`, and use `rejects.toThrow` for async methods.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| What happens without `await`? | As of Vitest 4.1 a warning ("was not awaited"), auto-await at the end of the test, failure in the next major; the assertion runs after later lines. |
| Why call, flush, then await? | The promise can't settle until the request is flushed; awaiting first deadlocks until timeout. |
| Why does `expect(() => service.regenerate()).toThrow()` fail? | `regenerate` is `async`: `targetId`'s throw becomes a rejected promise; nothing throws synchronously. |
| Why `toEqual`/`toMatchObject` for auth rejections? | `AuthService` rejects with plain `AuthError` objects (`code`, `message`), not `Error` instances. |
| When is `rejects.toBeTruthy` fine? | When the contract is the state afterwards (e.g. the weekend stays `loading`), not the error's shape. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/saturdaze/src/app/dialogs/confirm-dialog/confirm-dialog.spec.ts` | `confirmWith` resolves `true` / `false`. |
| `frontend/projects/saturdaze/src/app/shell/menu-opener.spec.ts` | `resolves.toBe(ITEMS[0])`. |
| `frontend/projects/api/src/lib/services/auth.service.spec.ts` | Logout `resolves.toBeUndefined`; sign-up `rejects.toEqual`; login `rejects.toMatchObject` with `satisfies`. |
| `frontend/projects/api/src/lib/services/weekend-plan.service.spec.ts` | `rejects.toBeTruthy` then state; `rejects.toThrow('No current weekend is loaded yet.')`. |
| `frontend/projects/api/src/lib/services/weekend-plan.service.ts` | `async regenerate()` and `private targetId()`. |
| `frontend/projects/api/src/lib/services/session-store.spec.ts` | `await expect(service.refreshSession()).resolves.toBe(true)`. |
| `frontend/projects/saturdaze/src/app/app.config.spec.ts`, `auth/require-auth.guard.spec.ts` | `expect(() => …).not.toThrow()`. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:30 | Introduction | Title; outline. |
| 00:30-01:03 | Promises | The shape; the assertion is a promise. |
| 01:03-02:02 | resolves | Counts; `confirmWith`; menu opener; `toBeUndefined`. |
| 02:02-03:11 | rejects | Counts; `AuthError` shape; `toBeTruthy`. |
| 03:11-04:18 | HTTP order | Call · flush · await; the sign-up test; why swapping hangs. |
| 04:18-04:59 | toThrow | Takes a function; `.not.toThrow` smoke tests. |
| 04:59-05:49 | Async throws | `regenerate` / `targetId`; `rejects.toThrow`. |
| 05:49-06:29 | Pitfalls | Five pitfalls. |
| 06:29-07:11 | Recap | Things to remember; preview of video 09. |

## Demo commands

```sh
cd frontend
npx ng test api --include='**/services/auth.service.spec.ts'          # resolves/rejects + HTTP order
npx ng test api --include='**/services/weekend-plan.service.spec.ts'  # rejects.toThrow
npx ng test saturdaze --include='**/app.config.spec.ts'               # .not.toThrow
```

## Pitfalls

- A `resolves`/`rejects` assertion without `await`.
- Awaiting the assertion before flushing the HTTP request (hang, then timeout).
- `expect(run()).toThrow()` instead of `expect(() => run()).toThrow()`.
- `toThrow` on an async function instead of `rejects.toThrow`.
- `rejects.toBeTruthy` when callers branch on the error's shape.

## References

- [Vitest: expect · resolves](https://vitest.dev/api/expect.html#resolves)
- [Vitest: expect · rejects](https://vitest.dev/api/expect.html#rejects)
- [Vitest: expect · toThrowError / toThrow](https://vitest.dev/api/expect.html#tothrowerror)
- [Angular: Testing HTTP requests](https://angular.dev/guide/http/testing)
