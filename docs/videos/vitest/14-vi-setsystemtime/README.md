# 14 · vi.setSystemTime

> **Runtime:** ~7 min · **Audience:** developers testing time-dependent logic in Saturdaze · **Prerequisites:** [Video 13 · Fake timers and vi.advanceTimersByTime](../13-fake-timers-and-advancetimersbytime/README.md)

**Video:** [14-vi-setsystemtime.mp4](14-vi-setsystemtime.mp4) · [Slides](slides.html) · **Audio:** [14-vi-setsystemtime.mp3](14-vi-setsystemtime.mp3) · [Transcript](script.md)

## Why this video exists

`vi.setSystemTime` is called once, in the `beforeEach` of `tooltip.spec.ts`, to step past the tooltip's 600 ms "warm" window, which lives in module-level state (`lastHiddenAt`) that survives between tests while `isolate` is `false`. While making this video, temporary reordered copies of the spec showed that `Date.now() + 10_000` separates a test from a hide stamped on the **real** clock, but not from the previous test's hide on its **fake** clock. The suite passes today only because the one test that needs a cold start runs first. A monotonic clock (`clock += 60_000`) made a reordered copy pass. The committed spec is unchanged. The last part recaps the whole series.

## Learning objectives

By the end, the viewer can:

- Contrast `vi.setSystemTime` (clock moves, no timer runs) with `vi.advanceTimersByTime`.
- State two Vitest 4.1 details: the fake clock starts at real `Date.now()`; without fake timers only `Date` is mocked.
- Explain the tooltip's warm window and why module state leaks between tests.
- Explain why `Date.now() + n` right after `vi.useFakeTimers()` is relative to real time.
- Separate tests by moving the clock monotonically.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| What does `vi.setSystemTime` do under fake timers? | Sets the fake clock's now; `Date.now()` changes; no timers fire. |
| Why does the tooltip spec need it at all? | `lastHiddenAt` is module state shared by every test in the worker. |
| What does `Date.now() + 10_000` protect against? | A hide stamped on the real clock moments earlier (e.g. another spec file). |
| What doesn't it protect against? | The previous test's hide, stamped on a fake clock that also started at real time + 10 s and then advanced. |
| How do you separate tests reliably? | A describe-scoped `clock` advanced by a fixed amount (e.g. 60,000 ms) per test, or resetting the module state. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/components/src/lib/tooltip/tooltip.ts` | `WARM_MS`, `let lastHiddenAt = 0`, `hide()`, `onPointerEnter()`. |
| `frontend/projects/components/src/lib/tooltip/tooltip.spec.ts` | `beforeEach` guard; "skips the delay for the next tooltip right after one hides". |
| `frontend/node_modules/vitest/dist/chunks/test.DNmyFkvJ.js` | `useFakeTimers()` start time; `setSystemTime()` with and without fake timers. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:29 | Introduction | Title; half of advancing. |
| 00:29-01:17 | setSystemTime | What it does; two Vitest 4.1 details. |
| 01:17-02:13 | Warm window | `lastHiddenAt`, cold or warm, module-level state. |
| 02:13-02:47 | Warm test | The test that proves the warm path. |
| 02:47-03:34 | The guard | `vi.setSystemTime(Date.now() + 10_000)`; what it protects against. |
| 03:34-05:17 | A gap | The previous test's hide; the reorder experiment; the monotonic fix; the lesson. |
| 05:17-06:11 | Pitfalls, recap | Things to remember. |
| 06:11-07:12 | Series | The 14 videos; close. |

## Demo commands

```sh
cd frontend
npx ng test components --watch=false --include='**/tooltip/tooltip.spec.ts'
```

To reproduce the gap, copy `tooltip.spec.ts` to a temporary `*.spec.ts` beside it, move the "shows after a hover delay and hides on pointer-out" test to the end, run it with `--include`, then delete the copy.

## Pitfalls

- Using `setSystemTime` when timers need to fire.
- Assuming `Date.now() + n` separates one test from the next.
- Module-level state surviving between tests while `isolate` is `false`.
- Order-dependent tests that pass only in file order.

## References

- [Vitest: vi.setSystemTime](https://vitest.dev/api/vi#vi-setsystemtime)
- [Vitest: vi.useFakeTimers](https://vitest.dev/api/vi#vi-usefaketimers)
- [Vitest: Mocking dates](https://vitest.dev/guide/mocking#dates)
