# 02 · describe, it and the hooks

> **Runtime:** ~7.4 min · **Audience:** developers who write frontend unit tests in Saturdaze · **Prerequisites:** [Video 01 · Vitest in this workspace](../01-vitest-in-this-workspace/README.md)

**Video:** [02-describe-it-and-hooks.mp4](02-describe-it-and-hooks.mp4) · [Slides](slides.html) · **Audio:** [02-describe-it-and-hooks.mp3](02-describe-it-and-hooks.mp3) · [Transcript](script.md)

## Why this video exists

Every spec in the repo is built from four globals: `describe`, `it`, `beforeEach` and `afterEach`. The specs nest them, mix sync and async hooks, keep helpers inside `describe`, and clean up with either `afterEach` or a `try`/`finally`. Because the Angular unit-test builder sets `isolate: false`, cleanup decides whether one spec file can break another.

## Learning objectives

By the end, the viewer can:

- Group tests by class and method so nested names read as a specification.
- Write async tests and async hooks that Vitest awaits.
- Predict hook order across nested `describe` blocks (outer `beforeEach` first, `afterEach` in reverse).
- Use `afterEach` to verify (`httpMock.verify()`) and restore (`vi.restoreAllMocks()`, `vi.useRealTimers()`).
- Explain why no spec resets `TestBed` (Angular's global cleanup hooks).
- Choose between `beforeEach`, a `mount()` helper and `try`/`finally`.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| When do you add a nested `describe`? | When there is more than one behaviour to state about a method; `creates a share link` stays ungrouped. |
| In what order do nested hooks run? | Outer `beforeEach`, inner `beforeEach`, test, inner `afterEach`, outer `afterEach` (Vitest's default stack order). |
| Why does no spec call `TestBed.resetTestingModule()` in `afterEach`? | `@angular/core/testing` registers global `beforeEach`/`afterEach` cleanup hooks, which need globals on. |
| Why does `past.page.spec.ts` use `mount()` instead of `beforeEach`? | Each test mounts with a different route query; `beforeEach` only builds the shared fakes. |
| Why `try`/`finally` in the reset-password resend test? | It is the only test in the file that fakes timers and there is no `afterEach` to restore them. |
| Why does cleanup matter more here? | `isolate: false`: leftover fake timers or spies leak into the next spec file. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/api/src/lib/services/weekend-plan.service.spec.ts` | Nested `describe`s, sync `beforeEach`, `afterEach` with `verify()` and `restoreAllMocks()`, `loadCurrent()` helper, `block actions` nested hook. |
| `frontend/projects/components/src/lib/tooltip/tooltip.spec.ts` | Async `beforeEach`, `afterEach` destroying the fixture, `bubble()` helper. |
| `frontend/projects/components/src/lib/copy-field/copy-field.spec.ts` | `afterEach` that only restores real timers. |
| `frontend/projects/saturdaze/src/app/pages/past/past.page.spec.ts` | `mount(query)` helper. |
| `frontend/projects/saturdaze/src/app/pages/reset-password/reset-password.page.spec.ts` | `try`/`finally` around fake timers. |
| `frontend/node_modules/@angular/core/fesm2022/testing.mjs` | `globalThis.beforeEach?.(getCleanupHook(false))`. |
| `frontend/projects/api/src/lib/api/weekend-projection.spec.ts` | Read-only `const day = projectDay(...)` at `describe` level. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:25 | Introduction | Title; four pieces. |
| 00:25-01:26 | Structure | Group by class and method; names as a specification; ungrouped tests. |
| 01:26-01:59 | Async | Async tests are awaited. |
| 01:59-02:45 | beforeEach | Sync and async `beforeEach`. |
| 02:45-03:21 | Order | Nested `beforeEach`; setup in, teardown out. |
| 03:21-04:12 | afterEach | `verify()`, `restoreAllMocks()`, real timers; Angular resets `TestBed`. |
| 04:12-05:06 | Helpers | `let` + `beforeEach`; helper functions; `mount()`. |
| 05:06-05:44 | try/finally | One-off cleanup; two ways to clean up. |
| 05:44-06:09 | Why | `isolate: false` consequences. |
| 06:09-06:40 | Pitfalls | Collection-time state, missing `await`, assertions in hooks, order dependence. |
| 06:40-07:21 | Recap | Things to remember; preview of video 03. |

## Demo commands

```sh
cd frontend
npx ng test api --watch=false --include='**/weekend-plan.service.spec.ts'
npx ng test components --watch=false --include='**/tooltip/tooltip.spec.ts'
npx ng test saturdaze --watch=false --include='**/reset-password/reset-password.page.spec.ts'
```

## Pitfalls

- Assigning mutable state in a `describe` body (runs once, at collection).
- Forgetting `await` in a test or hook.
- Assertions inside hooks.
- Tests that depend on another test having run.
- Leaving fake timers or spies behind with `isolate: false`.

## References

- [Vitest: Test API (describe, test)](https://vitest.dev/api/)
- [Vitest: Setup and teardown hooks](https://vitest.dev/api/#setup-and-teardown)
- [Vitest: sequence.hooks](https://vitest.dev/config/#sequence-hooks)
- [Angular: Testing](https://angular.dev/guide/testing)
