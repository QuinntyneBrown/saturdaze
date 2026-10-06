# 12 · vi.spyOn and restoring

> **Runtime:** ~7 min · **Audience:** developers writing frontend unit tests in Saturdaze · **Prerequisites:** [Video 01 · Vitest in this workspace](../01-vitest-in-this-workspace/README.md) (`isolate: false`), video 09 (`vi.fn`)

**Video:** [12-vi-spyon-and-restoring.mp4](12-vi-spyon-and-restoring.mp4) · [Slides](slides.html) · **Audio:** [12-vi-spyon-and-restoring.mp3](12-vi-spyon-and-restoring.mp3) · [Transcript](script.md)

## Why this video exists

The specs call `vi.spyOn` 26 times on three kinds of target: `console.error` (14), the Angular `Router` (11) and `window.removeEventListener` (1). They restore those spies in three different styles, and two of them leak a silenced console if an assertion fails first. With `isolate: false`, a leaked spy on a global affects later tests and files. As of Vitest 4.1, `vi.restoreAllMocks()` restores only `vi.spyOn` spies, not `vi.fn` mocks.

## Learning objectives

By the end, the viewer can:

- Choose between `vi.fn` (a dependency you hand over) and `vi.spyOn` (a method on a real object you can't hand over).
- Stop the real method with `.mockResolvedValue(true)` or `.mockImplementation(() => undefined)`, or leave it running and only record calls.
- Explain why router spies need no restore (TestBed resets) and console spies do (globals).
- Restore spies robustly in `afterEach` with `vi.restoreAllMocks()`.
- Say what `mockRestore()` and `vi.restoreAllMocks()` do and don't do in Vitest 4.1.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| What does a spy with no implementation do? | Calls through to the original and records the call (`scrolled.spec.ts`). |
| Why is `navigateByUrl` mocked with `mockResolvedValue(true)`? | Prevents real navigation and returns what a successful navigation returns. |
| Why aren't router spies restored? | TestBed resets the testing module between tests; the next test injects a fresh `Router`. |
| Why restore in `afterEach` rather than as the last line? | A failing assertion stops the test before the last line; `afterEach` still runs. |
| Does `vi.restoreAllMocks()` clear a `vi.fn`? | No: only `vi.spyOn` registers a restore callback in `@vitest/spy` 4.1. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/components/src/lib/button/button.spec.ts` | Router spy, `toHaveBeenCalledWith('/weekend')`, `not.toHaveBeenCalled()`. |
| `frontend/projects/saturdaze/src/app/pages/create-account/create-account.page.spec.ts` | `let navigate: ReturnType<typeof vi.spyOn>` assigned in `beforeEach`. |
| `frontend/projects/api/src/lib/services/weekend-plan.service.ts` | `console.error` before rethrow in `loadCurrent()`. |
| `frontend/projects/api/src/lib/services/weekend-plan.service.spec.ts` | Spy in `beforeEach`, `vi.restoreAllMocks()` in `afterEach`. |
| `frontend/projects/api/src/lib/services/saved.service.spec.ts` | `vi.restoreAllMocks()` as the last line of a test. |
| `frontend/projects/saturdaze/src/app/pages/family/family.page.spec.ts` | `consoleError.mockRestore()` as the last line. |
| `frontend/projects/components/src/lib/scrolled/scrolled.spec.ts` | Call-through spy on `window.removeEventListener`. |
| `frontend/node_modules/@vitest/spy/dist/index.js` | `MOCK_RESTORE` and `restoreAllMocks()`. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:35 | Introduction | Title; 26 spies, three targets. |
| 00:35-01:02 | Choosing | `vi.fn` versus `vi.spyOn`. |
| 01:02-02:24 | Router | Button spec, the never-called case, shared spy in `beforeEach`, who owns the object. |
| 02:24-03:05 | Console | Why services log; silencing with `mockImplementation`. |
| 03:05-04:20 | Restoring | `afterEach`, last-line `restoreAllMocks`, last-line `mockRestore`, the failure leak. |
| 04:20-04:52 | Call-through | `scrolled.spec.ts`. |
| 04:52-05:35 | Restore semantics | `mockRestore`, `restoreAllMocks` skips `vi.fn`. |
| 05:35-05:56 | No vi.mock | Inject or spy. |
| 05:56-07:06 | Pitfalls, recap | Things to remember; preview of video 13. |

## Demo commands

```sh
cd frontend
npx ng test components --watch=false --include='**/scrolled/scrolled.spec.ts'
npx ng test api --watch=false --include='**/weekend-plan.service.spec.ts'
npx ng test saturdaze --watch=false --include='**/family/family.page.spec.ts'
```

## Pitfalls

- Forgetting that a spy without an implementation calls through.
- Restoring at the end of the test body instead of in `afterEach`.
- Expecting `vi.restoreAllMocks()` to clear `vi.fn` call history.
- Spying on a global (`console`, `window`) without restoring it while `isolate` is `false`.

## References

- [Vitest: vi.spyOn](https://vitest.dev/api/vi#vi-spyon)
- [Vitest: vi.restoreAllMocks](https://vitest.dev/api/vi#vi-restoreallmocks)
- [Vitest: mockRestore](https://vitest.dev/api/mock#mockrestore)
- [Vitest: Mocking](https://vitest.dev/guide/mocking)
