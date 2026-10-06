# 09 · vi.fn and the Mock type

> **Runtime:** ~8 min · **Audience:** developers writing or reading Saturdaze frontend specs · **Prerequisites:** [Video 01 · Vitest in this workspace](../01-vitest-in-this-workspace/README.md)

**Video:** [09-vi-fn-and-the-mock-type.mp4](09-vi-fn-and-the-mock-type.mp4) · [Slides](slides.html) · **Audio:** [09-vi-fn-and-the-mock-type.mp3](09-vi-fn-and-the-mock-type.mp3) · [Transcript](script.md)

## Why this video exists

`vi.fn` appears 233 times across 61 spec files. Specs use it three ways: a bare mock as an output listener, a mock with an implementation inside a fake service, and a typed mock for a small callback. The fakes reach the code under test through injection tokens (`{ provide: SAVED_SERVICE, useValue: saved }`) instead of `vi.mock`, which the Angular unit-test builder doesn't support on relative imports. Knowing the strict `Mock<…>` type and the loose `ReturnType<typeof vi.fn>` shortcut lets you choose how much the compiler checks.

## Learning objectives

By the end, the viewer can:

- Explain what a mock function records and where (`fn.mock`).
- Use a bare `vi.fn()` to listen to a component `output()`.
- Build a fake service from `vi.fn(impl)` members and plain functions, and provide it with `useValue`.
- Explain why interface-driven services (contract + `InjectionToken`) replace `vi.mock` here.
- Type a mock strictly with `import type { Mock } from 'vitest'` and `vi.fn<(…) => …>()`.
- Weigh the loose `ReturnType<typeof vi.fn>` type against the strict one.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| What does `vi.fn()` return when called with nothing? | A mock that does nothing and returns `undefined`, but records every call. |
| Why is `list` in the past page's fake a plain function? | Nothing asserts on it or reprograms it; only wrap what you check. |
| How does a fake reach the page? | `TestBed` providers: `{ provide: SAVED_SERVICE, useValue: saved }`; the page injects the token. |
| Why no `vi.mock`? | The builder doesn't support it on relative imports (`dev-state.spec.ts`); DI gives the seam. |
| What is the type argument of `vi.fn<…>()`? | The whole function signature, e.g. `(text: string) => Promise<void>`, not the return type. |
| What does `ReturnType<typeof vi.fn>` cost? | Any arguments, any return: the fake isn't checked against the contract. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/components/src/lib/copy-field/copy-field.spec.ts` | Bare `vi.fn()` subscribed to `copied`; typed `writeText` mock. |
| `frontend/projects/saturdaze/src/app/pages/past/past.page.spec.ts` | Fake `saved`, `weekend`, `dialog`; `useValue` providers; loose typing. |
| `frontend/projects/api/src/lib/services/saved.service.contract.ts` | `SAVED_SERVICE` `InjectionToken<ISavedService>`. |
| `frontend/projects/saturdaze/src/app/app.config.ts` | `{ provide: SAVED_SERVICE, useExisting: SavedService }`. |
| `frontend/projects/saturdaze/src/app/pages/past/past.page.ts` | `inject(SAVED_SERVICE)`. |
| `frontend/projects/saturdaze/src/app/shell/menu-opener.spec.ts` | Fake `BreakpointObserver` and `Dialog`. |
| `frontend/projects/saturdaze/src/app/dialogs/confirm-dialog/confirm-dialog.spec.ts` | `mockDialogRef = { close: vi.fn() }`. |
| `frontend/projects/saturdaze/src/app/shared/dev-state.spec.ts` | Comment on `vi.mock` and relative imports. |
| `frontend/projects/components/src/lib/chip-input/chip-input.spec.ts` | `Mock<(value: string[]) => void>` for `onChange`. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:26 | Introduction | Title; 233 uses in 61 files. |
| 00:26-01:07 | Mock functions | What a mock records; `vi.fn()` vs `vi.fn(impl)`. |
| 01:07-02:26 | Bare mocks | Copy field's output subscriber; subscribe, act, check. |
| 02:26-03:00 | Implementations | The past page's fakes; two details worth copying. |
| 03:00-04:07 | Injector | `useValue` providers; contract and token; framework classes. |
| 04:07-04:36 | vi.mock | Why the specs don't use it. |
| 04:36-05:36 | Strict types | `Mock<…>` in chip input and copy field. |
| 05:36-06:40 | Loose types | `ReturnType<typeof vi.fn>`; the trade-off; choosing. |
| 06:40-07:56 | Pitfalls, recap | Things to remember; preview of video 10. |

## Demo commands

```sh
cd frontend
npx ng test components --include='**/copy-field/copy-field.spec.ts'
npx ng test components --include='**/chip-input/chip-input.spec.ts'
npx ng test saturdaze --include='**/pages/past/past.page.spec.ts'
npx ng test saturdaze --include='**/shell/menu-opener.spec.ts'
```

## Pitfalls

- Wrapping every fake member in `vi.fn`, including values nothing asserts on.
- Building a fake in the `describe` body without resetting it; build it in `beforeEach`.
- Reaching for `vi.mock` instead of a `useValue` provider.
- Awaiting or reading a property from a bare mock's `undefined` result.
- Passing the return type instead of the function signature to `vi.fn<…>()`.

## References

- [Vitest: Mock functions (`vi.fn`)](https://vitest.dev/api/vi.html#vi-fn)
- [Vitest: Mock API](https://vitest.dev/api/mock.html)
- [Vitest: Mocking guide](https://vitest.dev/guide/mocking)
- [Angular: Dependency injection providers](https://angular.dev/guide/di/dependency-injection-providers)
- [Angular: Testing services](https://angular.dev/guide/testing/services)
