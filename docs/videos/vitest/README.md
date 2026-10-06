# Vitest series

One video per Vitest feature the Saturdaze frontend specs actually use, shown in the specs where it lives. The specs run under the Angular `@angular/build:unit-test` builder (Vitest 4.1, jsdom, `globals: true`, `isolate: false`); video 01 explains that setup, and the rest go feature by feature, ending with fake timers, `vi.advanceTimersByTime` and `vi.setSystemTime`. Watch 01 first; the rest stand alone but build on each other in order.

Each folder holds `script.md`, `slides.html` and `README.md` (outline), plus the generated `<folder>.mp3` and `<folder>.mp4`. Build them the same way as the other videos (see [../README.md](../README.md)), passing the nested folder, e.g. `docs/videos/vitest/13-fake-timers-and-advancetimersbytime`.

| # | Video | Runtime | Features |
| --- | --- | --- | --- |
| 01 | [Vitest in this workspace](01-vitest-in-this-workspace/README.md) | ~8 min | `ng test` and the unit-test builder, jsdom, globals, `isolate: false`, `vitest/globals`, `vitest-base.config.mjs` |
| 02 | [describe, it and the hooks](02-describe-it-and-hooks/README.md) | ~7.4 min | `describe`, `it`, `beforeEach`, `afterEach` |
| 03 | [Table-driven tests with describe.each](03-describe-each/README.md) | ~6.9 min | `describe.each`, `%s` titles |
| 04 | [toBe, toEqual and toMatchObject](04-tobe-toequal-tomatchobject/README.md) | ~7.4 min | `toBe`, `toEqual`, `toMatchObject`, `.not` |
| 05 | [Presence and type matchers](05-null-truthy-and-type-matchers/README.md) | ~7.5 min | `toBeNull`, `toBeTruthy`, `toBeUndefined`, `toBeDefined`, `toBeTypeOf`, `toBeGreaterThan`, `expect(value, message)` |
| 06 | [Strings and collections](06-strings-and-collections/README.md) | ~7.8 min | `toContain`, `toContainEqual`, `toMatch`, `toHaveLength` |
| 07 | [Asymmetric matchers](07-asymmetric-matchers/README.md) | ~8 min | `expect.objectContaining`, `expect.any`, `expect.anything`, `expect.stringMatching` |
| 08 | [Promises and errors: resolves, rejects and toThrow](08-resolves-rejects-and-tothrow/README.md) | ~7.2 min | `.resolves`, `.rejects`, `toThrow` |
| 09 | [vi.fn and the Mock type](09-vi-fn-and-the-mock-type/README.md) | ~8 min | `vi.fn`, `Mock<T>`, fake services through DI |
| 10 | [Programming mock behaviour](10-programming-mocks/README.md) | ~7.9 min | `mockReturnValue(Once)`, `mockResolvedValue(Once)`, `mockRejectedValue(Once)`, `mockImplementation(Once)` |
| 11 | [Asserting calls](11-asserting-calls/README.md) | ~7.8 min | `toHaveBeenCalled*`, `.mock.calls`, `mockClear` |
| 12 | [vi.spyOn and restoring](12-vi-spyon-and-restoring/README.md) | ~7.1 min | `vi.spyOn`, `mockRestore`, `vi.restoreAllMocks` |
| 13 | [Fake timers and vi.advanceTimersByTime](13-fake-timers-and-advancetimersbytime/README.md) | ~9 min | `vi.useFakeTimers`, `vi.advanceTimersByTime`, `vi.useRealTimers` |
| 14 | [vi.setSystemTime](14-vi-setsystemtime/README.md) | ~7.2 min | `vi.setSystemTime`, faked `Date.now()` |

Not covered, because the specs don't use them: snapshots, and `vi.mock` (the Angular unit-test builder doesn't support it on relative imports; dependencies are swapped through the injector instead).
