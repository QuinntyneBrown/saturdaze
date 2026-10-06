# 01 · Vitest in this workspace

> **Runtime:** ~8 min · **Audience:** developers who write or run frontend unit tests in Saturdaze · **Prerequisites:** none

**Video:** [01-vitest-in-this-workspace.mp4](01-vitest-in-this-workspace.mp4) · [Slides](slides.html) · **Audio:** [01-vitest-in-this-workspace.mp3](01-vitest-in-this-workspace.mp3) · [Transcript](script.md)

## Why this video exists

Nobody in this repository runs the `vitest` CLI. `npm test` goes through the Angular CLI and the `@angular/build:unit-test` builder, which compiles the specs and sets most Vitest options itself: the include pattern, jsdom, `globals: true` and `isolate: false`. Knowing that chain explains why `describe` needs no import, why cleanup matters, and why `vitest-base.config.mjs` usually has no effect.

## Learning objectives

By the end, the viewer can:

- Trace `npm test` to `ng test` to `@angular/build:unit-test` to Vitest.
- Name the Vitest defaults the builder applies (include, jsdom, globals, isolate).
- Explain what `"types": ["vitest/globals"]` in `tsconfig.spec.json` does and why `import { vi } from 'vitest'` is optional.
- Say when `frontend/vitest-base.config.mjs` is loaded (only with `--runner-config`).
- Run all tests, one project, or one file.
- List the Vitest features the specs use and the two they deliberately don't (snapshots, `vi.mock`).

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Where does `describe` come from without an import? | The builder sets `globals: true`; `vitest/globals` types tell the compiler. |
| Why do specs need careful cleanup? | The builder sets `isolate: false` (Karma/Jasmine parity), so files share a module context. |
| Does `vitest-base.config.mjs` apply to `npm test`? | No; `runnerConfig` defaults to `false`. `--runner-config` searches the project root then the workspace root. |
| Why no coverage `include` in that file? | It filters against a different root and zeroes coverage; use the builder's `--coverage-include`. |
| Why is there no `vi.mock`? | The Angular unit-test builder doesn't support it on relative imports; specs swap dependencies through DI. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/package.json` | `"test": "ng test"`, `"vitest": "^4.0.8"`, `"jsdom": "^28.0.0"`. |
| `frontend/angular.json` | The three `test` targets using `@angular/build:unit-test`. |
| `frontend/node_modules/@angular/build/src/builders/unit-test/runners/vitest/plugins.js` | `globals: true`, `isolate: false` defaults. |
| `frontend/projects/components/tsconfig.spec.json` | `"types": ["vitest/globals"]`. |
| `frontend/vitest-base.config.mjs` | `coverage.reportOnFailure: true` and its comment. |
| `.github/workflows/ci.yml` | `npm test -- --watch=false`. |
| `frontend/projects/saturdaze/src/app/shared/dev-state.spec.ts` | Comment on `vi.mock` and relative imports. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:29 | Introduction | Title; three questions. |
| 00:29-01:27 | npm test | `package.json` → `ng test` → three test targets; the chain. |
| 01:27-02:41 | Builder defaults | Include, jsdom, globals, isolate. |
| 02:41-03:39 | Types | `vitest/globals`, the `vi` import, versions. |
| 03:39-04:42 | Runner config | `vitest-base.config.mjs`, `--runner-config`. |
| 04:42-05:15 | Running | All, one project, one file, CI. |
| 05:15-06:45 | Inventory | 118 files, 748 tests; the series; snapshots and `vi.mock` absent. |
| 06:45-08:02 | Pitfalls, recap | Things to remember; preview of video 02. |

## Demo commands

```sh
cd frontend
npm test                                     # every project, watch mode in a terminal
npm test -- --watch=false                    # one pass, as CI runs it
npx ng test components --watch=false         # one project
npx ng test components --include='**/copy-field/copy-field.spec.ts'   # one file
npx ng test --runner-config --coverage       # load vitest-base.config.mjs (reportOnFailure)
```

## Pitfalls

- Running `npx vitest` directly: no Angular compile step, no jsdom default, no globals.
- Expecting `vitest-base.config.mjs` to apply without `--runner-config`.
- Removing `vitest/globals` from a `tsconfig.spec.json`.
- Forgetting cleanup with `isolate: false`.

## References

- [Angular: Testing](https://angular.dev/guide/testing)
- [Vitest: Configuring Vitest](https://vitest.dev/config/)
- [Vitest: globals](https://vitest.dev/config/#globals)
- [Vitest: coverage.reportOnFailure](https://vitest.dev/config/#coverage-reportonfailure)
