# 01 · Vitest in this workspace

This is the first video in a series about Vitest, the test runner behind every unit test in the Saturdaze frontend. Each video takes one Vitest feature the repository really uses, such as `vi.fn`, `describe.each` or `vi.advanceTimersByTime`, and shows it in the specs where it lives. This one answers a simpler question first: when you type N P M test, what actually runs, where does `describe` come from, and which configuration applies?

## What runs when you type npm test

Start in the frontend folder. The package file maps the test script to N G test. N G test is the Angular CLI, not Vitest directly. In a workspace with several projects, it runs the test target of every project that has one.

Three projects have a test target in the angular file: components, api and saturdaze. The perf test app has none. All three targets use the same builder, the unit test builder from the Angular build package, and each one passes only its own spec T S config. Nothing in the angular file names a runner, because Vitest is the builder's default.

So the chain is: N P M test, then the Angular CLI, then the unit test builder, which compiles your specs with the same esbuild pipeline as the app and hands the result to Vitest. You never run the Vitest command line yourself in this repository.

## What the builder decides for you

The builder sets several Vitest options you would otherwise write in a config file. As of October twenty twenty-six, with Angular build twenty-one point two, these are the defaults it applies.

It finds the tests. The default include pattern is every file ending in dot spec dot T S or dot test dot T S, relative to the project root. This repository uses only dot spec dot T S.

It picks the environment. With no browsers option, tests run in Node with J S dom, a simulated document. That is why the specs can query elements and dispatch clicks, and also why the tooltip spec has to fake a pointer event: J S dom has no pointer event constructor.

It turns on globals. The builder sets globals to true, so `describe`, `it`, `expect`, `beforeEach` and the `vi` object exist without an import.

It turns off isolation. Isolate is false, to match the old Karma and Jasmine behaviour, so spec files share one module context. That is the reason cleanup matters so much in later videos: a spy or a fake clock left behind can leak into the next file.

## Globals, types and the vi import

Globals at runtime are only half the story. The compiler also needs to know their types. Each project's spec T S config adds `vitest/globals` to its types list and includes only the spec files and declaration files. That single line is what lets the editor and the compiler accept a bare `describe`.

You will still see an explicit import of `vi` from Vitest at the top of forty spec files. It is redundant at runtime, because `vi` is a global too, but it is harmless and makes the dependency obvious. Two spec files, chip input and copy field, import the `Mock` type from Vitest; that is a type only import for declaring typed mock variables, covered in video nine.

The repository pins Vitest at caret four point zero point eight in the package file; the installed version is four point one. J S dom is at version twenty-eight.

## The optional runner config

There is one Vitest config file in the frontend folder, called `vitest-base.config.mjs`. It sets a single option: coverage report on failure, true. By default Vitest writes no coverage report at all when any test fails, and the comment explains this file exists for a coverage measurement harness that needs a report even then.

Here is the subtle part. The builder only loads that file when you ask it to. Its runner config option defaults to false. Pass dash dash runner config, and it searches the project root and then the workspace root for a file named Vitest base config, and merges it in. The comment also warns you not to put a coverage include list in this file, because it filters against a different root and zeroes the collected coverage. Use the builder's own coverage include option instead.

So a normal N P M test run never reads this file. That is deliberate: day to day runs stay on the builder defaults.

## Running tests

Three commands cover nearly everything. N P M test runs every project in watch mode when you are in a terminal. Add dash dash watch equals false for a single pass; that is exactly what the continuous integration workflow runs in its unit tests step.

To run one project, name it: N P X N G test components. To run one file, add an include glob, for example the copy field spec. That is the fastest feedback loop while you work on a single component.

## What the specs use

Across the three projects there are one hundred and eighteen spec files. A full run as of this recording passes seven hundred and forty-eight tests: two hundred and ninety-three in components, one hundred and ninety-three in api and two hundred and sixty-two in saturdaze, with nearly two and a half thousand `expect` calls between them. The feature set is focused. The rest of this series covers all of it.

- Structure: `describe`, `it`, `beforeEach`, `afterEach`, and one `describe.each` table.
- Matchers: `toBe`, `toEqual`, `toMatchObject`, the null and truthy family, `toBeTypeOf`, `toContain`, `toMatch`, `toHaveLength`, and `toThrow`.
- Asymmetric matchers such as `expect.objectContaining` and `expect.any`.
- Async assertions with `resolves` and `rejects`.
- Mocks: `vi.fn`, the mock return and implementation helpers, call assertions, and `vi.spyOn` with restore.
- Time: `vi.useFakeTimers`, `vi.advanceTimersByTime` and `vi.setSystemTime`.

Just as telling is what is absent. There are no snapshot tests, and there is no `vi.mock`. The dev state spec explains why: the Angular unit test builder does not support module mocking of relative imports. The specs replace dependencies through Angular's injector instead, which you will see throughout.

## Pitfalls

A few pitfalls. Don't run the Vitest command line directly; the builder supplies the compile step, the environment and the globals, and without them the specs fail. Don't expect `vitest-base.config.mjs` to apply unless you pass the runner config flag. Don't remove `vitest/globals` from a spec T S config, or every bare `describe` becomes a compile error. And remember isolation is off, so clean up what you change.

## Recap

Things to remember.

- N P M test runs N G test, which runs the Angular unit test builder for components, api and saturdaze.
- The builder supplies Vitest's include pattern, J S dom, globals and isolate false.
- `vitest/globals` in each spec T S config gives the compiler the types.
- `vitest-base.config.mjs` only loads with dash dash runner config.
- No snapshots and no module mocking; dependencies are swapped through the injector.

Next, in video two, we look at the shape of every spec: `describe`, `it`, `beforeEach` and `afterEach`.
