# 13 · Fake timers and vi.advanceTimersByTime

> **Runtime:** ~9 min · **Audience:** developers testing timed behaviour in Saturdaze components and pages · **Prerequisites:** [Video 01 · Vitest in this workspace](../01-vitest-in-this-workspace/README.md), [Video 12 · vi.spyOn and restoring](../12-vi-spyon-and-restoring/README.md) (cleanup in `afterEach`)

**Video:** [13-fake-timers-and-advancetimersbytime.mp4](13-fake-timers-and-advancetimersbytime.mp4) · [Slides](slides.html) · **Audio:** [13-fake-timers-and-advancetimersbytime.mp3](13-fake-timers-and-advancetimersbytime.mp3) · [Transcript](script.md)

## Why this video exists

Three pieces of code wait: `sd-copy-field` (2,000 ms), `[sdTooltip]` (400 ms show, 100 ms hide) and the reset password resend cooldown (60,000 ms). Their specs use `vi.useFakeTimers` (3 calls), `vi.advanceTimersByTime` (11) and `vi.useRealTimers` (3). The copy field spec shows the best technique in the repo: advance 1999 ms, then 1 ms, to prove a boundary from both sides.

## Learning objectives

By the end, the viewer can:

- Explain what `vi.useFakeTimers` replaces, and that Vitest 4.1 never fakes `nextTick` or `queueMicrotask` by default (so promises still resolve).
- Use `vi.advanceTimersByTime` to run exactly the timers due in a window, synchronously and in order.
- Prove a delay from both sides (1999 then 1).
- Install the fake clock before the code schedules its timer, and narrow it with `toFake`.
- Restore real timers in `afterEach` or a `finally` block.
- Say when `advanceTimersByTimeAsync` would be needed (not used here).

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why does `flush()` still work under fake timers? | It awaits resolved promises; microtasks are never faked by default. |
| Why call `vi.useFakeTimers` before `button().click()`? | A timer scheduled with the real `setTimeout` stays real. |
| What do 1999 and 1 catch that one 3,000 ms advance doesn't? | A shortened delay (first check) and a lengthened or missing reset (second). |
| Why `fixture.detectChanges()` after advancing? | The callback sets a signal; the test renders before reading the DOM. |
| Why no `detectChanges()` in the tooltip tests? | The directive renders its panel itself in `show()`. |
| Why `try … finally` in the reset password test? | Restores real timers even if an assertion fails (`isolate: false`). |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/components/src/lib/copy-field/copy-field.ts` | `setTimeout(() => this.justCopied.set(false), 2000)`. |
| `frontend/projects/components/src/lib/copy-field/copy-field.spec.ts` | `toFake: ['setTimeout', 'clearTimeout']`, `flush()`, 1999 + 1, `afterEach`. |
| `frontend/projects/components/src/lib/tooltip/tooltip.ts` | `SHOW_DELAY_MS`, `HIDE_DELAY_MS`, `WARM_MS`. |
| `frontend/projects/components/src/lib/tooltip/tooltip.spec.ts` | Hooks, hover delay, grace period, touch. |
| `frontend/projects/saturdaze/src/app/pages/reset-password/reset-password.page.ts` | `resend()` and the 60,000 ms timeout. |
| `frontend/projects/saturdaze/src/app/pages/reset-password/reset-password.page.spec.ts` | `try … finally`, `vi.advanceTimersByTime(60_000)`. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:40 | Introduction | Title; code that waits. |
| 00:40-01:54 | How it works | Install, queue, advance, restore; Vitest 4.1 defaults; call counts. |
| 01:54-04:24 | Copy field | Source; install before the timer; microtasks; 1999 then 1; `detectChanges`; `toFake`. |
| 04:24-05:57 | Tooltip | Constants; hooks; hover timeline; grace period; touch never shows. |
| 05:57-07:08 | Reset password | Cooldown source; a minute in a millisecond; `afterEach` vs `finally`. |
| 07:08-07:48 | Sync or async | `advanceTimersByTime` vs `advanceTimersByTimeAsync`; what's not used. |
| 07:48-09:01 | Pitfalls, recap | Things to remember; preview of video 14. |

## Demo commands

```sh
cd frontend
npx ng test components --watch=false --include='**/copy-field/copy-field.spec.ts'
npx ng test components --watch=false --include='**/tooltip/tooltip.spec.ts'
npx ng test saturdaze --watch=false --include='**/reset-password/reset-password.page.spec.ts'
```

## Pitfalls

- Installing fake timers after the timer was scheduled.
- Not restoring real timers (`afterEach` or `finally`).
- Awaiting a `settle()` helper (a 0 ms `setTimeout`, used by nine page specs) while timers are fake and nothing advances.
- Testing only one side of a delay.
- Forgetting `fixture.detectChanges()` when the callback changes template state.
- Faking more than the code under test uses.

## References

- [Vitest: Fake timers (guide)](https://vitest.dev/guide/mocking#timers)
- [Vitest: vi.useFakeTimers](https://vitest.dev/api/vi#vi-usefaketimers)
- [Vitest: vi.advanceTimersByTime](https://vitest.dev/api/vi#vi-advancetimersbytime)
- [Vitest: fakeTimers.toFake](https://vitest.dev/config/#faketimers-tofake)
