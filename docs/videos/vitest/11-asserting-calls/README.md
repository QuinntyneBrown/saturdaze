# 11 · Asserting calls

> **Runtime:** ~8 min · **Audience:** developers writing or reading Saturdaze frontend specs · **Prerequisites:** [Video 09 · vi.fn and the Mock type](../09-vi-fn-and-the-mock-type/README.md), [Video 10 · Programming mock behaviour](../10-programming-mocks/README.md)

**Video:** [11-asserting-calls.mp4](11-asserting-calls.mp4) · [Slides](slides.html) · **Audio:** [11-asserting-calls.mp3](11-asserting-calls.mp3) · [Transcript](script.md)

## Why this video exists

The specs read what mocks recorded 281 times with five matchers: `toHaveBeenCalled` (61, of which 57 are `.not`), `toHaveBeenCalledTimes` (55), `toHaveBeenCalledWith` (124), `toHaveBeenLastCalledWith` (35) and `toHaveBeenNthCalledWith` (6). Five lines read `.mock.calls` directly, and four `mockClear()` calls reset history mid-test or between tests. Picking the matcher that states the intent exactly (any call, the last call, the nth call, or a count) is what makes these tests precise.

## Learning objectives

By the end, the viewer can:

- Use `.not.toHaveBeenCalled()` to prove something did not happen.
- Use `toHaveBeenCalledTimes` when the count is the behaviour (a throttle, a single load).
- Explain that `toHaveBeenCalledWith` matches any call, with deep equality and asymmetric matchers.
- Choose `toHaveBeenLastCalledWith` for running state and `toHaveBeenNthCalledWith` (1-based) for order.
- Read `mock.calls` (0-based) to inspect a big argument, find a call, or apply another matcher.
- Reset history with `mockClear` and contrast it with `mockReset` and `mockRestore`.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why are 57 of 61 `toHaveBeenCalled` uses negated? | A bare positive check is weak; with arguments known, `toHaveBeenCalledWith` says more. Negatives prove a path was not taken. |
| If a mock was called five times, when does `toHaveBeenCalledWith` pass? | When any one call matches. |
| What does `toHaveBeenLastCalledWith()` with no arguments assert? | The last call received no arguments (the confirm dialog's cancel). |
| Where does counting start? | `toHaveBeenNthCalledWith` at 1; `mock.calls` at 0. |
| Why does the events service spec call `mockClear` in `beforeEach`? | `loadMine` is created once in the `describe` body and reused by every test's provider. |
| What does `mockReset` add over `mockClear`? | It also empties the once queue and resets the implementation to the original `vi.fn(impl)`. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/saturdaze/src/app/pages/past/past.page.spec.ts` | `?state=empty` → `saved.load` not called. |
| `frontend/projects/components/src/lib/chip-input/chip-input.spec.ts` | Blanks/duplicates not calling `onChange`; `toHaveBeenLastCalledWith`. |
| `frontend/projects/saturdaze/src/app/pages/reset-password/reset-password.page.spec.ts` | Resend throttle, `toHaveBeenCalledTimes(1)`. |
| `frontend/projects/saturdaze/src/app/shell/menu-opener.spec.ts` | `toHaveBeenCalledWith('(min-width: 720px)')`; with `expect.objectContaining`. |
| `frontend/projects/saturdaze/src/app/dialogs/confirm-dialog/confirm-dialog.spec.ts` | `toHaveBeenLastCalledWith()`. |
| `frontend/projects/saturdaze/src/app/pages/weekend/weekend.page.spec.ts` | `lockDay` nth calls; `dialog.open.mockClear()`. |
| `frontend/projects/saturdaze/src/app/pages/ideas/ideas.page.spec.ts` | Dialog sequence with nth calls. |
| `frontend/projects/saturdaze/src/app/pages/family/family.page.spec.ts` | `saved()` and `confirmData()` helpers over `mock.calls`. |
| `frontend/projects/saturdaze/src/app/auth/auth.interceptor.spec.ts` | `mock.calls[0]?.[0]` with `toMatch`. |
| `frontend/projects/api/src/lib/services/events.service.spec.ts` | Shared `loadMine` and `mockClear` in `beforeEach`. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:28 | Introduction | Title; five matchers, 281 uses. |
| 00:28-01:22 | Called | 57 of 61 negated; past page and chip input examples. |
| 01:22-01:53 | Times | Reset password's resend throttle. |
| 01:53-02:42 | With | Media query argument; `expect.objectContaining`; any call. |
| 02:42-03:28 | Last | Chip input's running list; last call with no arguments. |
| 03:28-04:05 | Nth | Lock day order; a sequence of dialogs. |
| 04:05-05:16 | mock.calls | The array; inspect, search, match. |
| 05:16-06:47 | mockClear | Count from zero; a shared mock; clear vs reset vs restore. |
| 06:47-07:46 | Pitfalls, recap | Things to remember; preview of video 12. |

## Demo commands

```sh
cd frontend
npx ng test components --include='**/chip-input/chip-input.spec.ts'
npx ng test saturdaze --include='**/pages/weekend/weekend.page.spec.ts'
npx ng test saturdaze --include='**/pages/family/family.page.spec.ts'
npx ng test api --include='**/services/events.service.spec.ts'
```

## Pitfalls

- A bare `toHaveBeenCalled()` when the arguments are known.
- `toHaveBeenCalledWith` when order or recency matters; it matches any call.
- Off-by-one: nth counts from 1, `mock.calls` from 0.
- Sharing a mock across tests without `mockClear`.
- `mockReset` when only the history should go; it also drops programmed behaviour.

## References

- [Vitest: toHaveBeenCalledWith and friends](https://vitest.dev/api/expect.html#tohavebeencalledwith)
- [Vitest: toHaveBeenNthCalledWith](https://vitest.dev/api/expect.html#tohavebeennthcalledwith)
- [Vitest: mock.calls](https://vitest.dev/api/mock.html#mock-calls)
- [Vitest: mockClear, mockReset, mockRestore](https://vitest.dev/api/mock.html#mockclear)
