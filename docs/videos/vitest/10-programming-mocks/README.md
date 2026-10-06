# 10 · Programming mock behaviour

> **Runtime:** ~8 min · **Audience:** developers writing or reading Saturdaze frontend specs · **Prerequisites:** [Video 09 · vi.fn and the Mock type](../09-vi-fn-and-the-mock-type/README.md)

**Video:** [10-programming-mocks.mp4](10-programming-mocks.mp4) · [Slides](slides.html) · **Audio:** [10-programming-mocks.mp3](10-programming-mocks.mp3) · [Transcript](script.md)

## Why this video exists

The specs drive pages through confirmations, failures and loading states by programming mocks. They use all eight helpers: `mockReturnValue` (2), `mockReturnValueOnce` (31), `mockResolvedValue` (13), `mockResolvedValueOnce` (6), `mockRejectedValue` (1), `mockRejectedValueOnce` (21), `mockImplementation` (15) and `mockImplementationOnce` (4). One rule ties them together: the once queue answers first, then the permanent behaviour, then the original `vi.fn(impl)`.

## Learning objectives

By the end, the viewer can:

- Override a default for the rest of a test with `mockReturnValue`.
- Script a sequence of answers with chained `mockReturnValueOnce` calls.
- Program async results with `mockResolvedValue(Once)` and failures with `mockRejectedValue(Once)`.
- Replace behaviour with `mockImplementation`, and freeze a loading state with a never-resolving `mockImplementationOnce`.
- State the resolution order: once queue → permanent behaviour (last set wins) → original implementation.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| What happens when the once queue is empty? | The mock falls back to its permanent behaviour, then to the function passed to `vi.fn`. |
| Why do `mockReturnValue` and `mockResolvedValue` override each other? | All four permanent helpers set the same implementation (`mockImplementation`) underneath. |
| How does the weekend page spec test a failure then a recovery? | `lockDay.mockRejectedValueOnce(...)`; the second click falls back to the resolving base and the banner clears. |
| Why does sign-in reject with `{ code, message }`? | That is the `AuthError` shape the session store surfaces, not an `Error` instance. |
| How do you hold a page in its loading state? | `mockImplementationOnce(() => new Promise<void>(() => undefined))`. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/saturdaze/src/app/shell/menu-opener.spec.ts` | `isMatched: vi.fn(() => false)`, then `mockReturnValue(true)`. |
| `frontend/projects/saturdaze/src/app/pages/family/family.page.spec.ts` | Chained `mockReturnValueOnce` for two dialogs; base `open` returns `of(undefined)`. |
| `frontend/projects/saturdaze/src/app/pages/past/past.page.spec.ts` | Router spy `.mockResolvedValue(true)`; never-resolving `mockImplementationOnce`. |
| `frontend/projects/components/src/lib/copy-field/copy-field.spec.ts` | `mockResolvedValue(undefined)`; the only `mockRejectedValue`. |
| `frontend/projects/saturdaze/src/app/app.spec.ts` | `menus.open.mockResolvedValueOnce(...)`. |
| `frontend/projects/saturdaze/src/app/pages/sign-in/sign-in.page.spec.ts` | One `mockRejectedValueOnce` per submit. |
| `frontend/projects/saturdaze/src/app/pages/weekend/weekend.page.spec.ts` | `lockDay.mockRejectedValueOnce`; `mountReady`'s `mockImplementation`. |
| `frontend/node_modules/@vitest/spy/dist/index.js` | The resolution order in Vitest 4.1. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:36 | Introduction | Title; four behaviours, two forms, eight helpers. |
| 00:36-01:24 | Return values | Menu opener's `mockReturnValue(true)`; where the change lives. |
| 01:24-02:39 | Once queue | The queue; family page's two dialogs; the safe base. |
| 02:39-03:43 | Resolved | Router spies and the clipboard; app spec's menu choice. |
| 03:43-05:06 | Rejected | Denied clipboard; sign-in error codes; failure then recovery. |
| 05:06-06:09 | Implementations | Console silencing and `mountReady`; freezing a loading state. |
| 06:09-06:44 | The rule | Once → permanent → original. |
| 06:44-07:51 | Pitfalls, recap | Things to remember; preview of video 11. |

## Demo commands

```sh
cd frontend
npx ng test saturdaze --include='**/shell/menu-opener.spec.ts'
npx ng test saturdaze --include='**/pages/family/family.page.spec.ts'
npx ng test saturdaze --include='**/pages/sign-in/sign-in.page.spec.ts'
npx ng test saturdaze --include='**/pages/weekend/weekend.page.spec.ts'
```

## Pitfalls

- A permanent form where you meant `Once`: the retry you meant to succeed fails too.
- Unconsumed `Once` values wait for the next call.
- Rejecting with an `Error` when the real dependency rejects with a plain object.
- No safe default on the base mock, so unscripted calls return `undefined`.

## References

- [Vitest: Mock API](https://vitest.dev/api/mock.html)
- [Vitest: mockReturnValueOnce](https://vitest.dev/api/mock.html#mockreturnvalueonce)
- [Vitest: mockImplementationOnce](https://vitest.dev/api/mock.html#mockimplementationonce)
- [Vitest: Mocking guide](https://vitest.dev/guide/mocking)
