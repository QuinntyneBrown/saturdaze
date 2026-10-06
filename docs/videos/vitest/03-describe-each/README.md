# 03 · Table-driven tests with describe.each

> **Runtime:** ~6.9 min · **Audience:** developers who write frontend unit tests in Saturdaze · **Prerequisites:** [Video 02 · describe, it and the hooks](../02-describe-it-and-hooks/README.md)

**Video:** [03-describe-each.mp4](03-describe-each.mp4) · [Slides](slides.html) · **Audio:** [03-describe-each.mp3](03-describe-each.mp3) · [Transcript](script.md)

## Why this video exists

The repository has exactly one `describe.each`, in `auth.service.spec.ts`. It covers four `AuthService` methods with identical behaviour (`forgotPassword`, `resendVerification`, `resetPassword`, `verifyEmail`) using one row each and two tests per row. It shows rows as tuples, `as const`, a `'%s'` title, destructured columns, template-literal `it` titles, and the collection-time trap that forces each call into an arrow function.

## Learning objectives

By the end, the viewer can:

- Recognise when behaviour is identical enough for a table.
- Write `describe.each([...] as const)('%s', (_name, path, call) => { ... })`.
- Explain how `%s` (and `%d`, `%j`, `%#`, `$property`) build each block's title.
- Explain why rows are evaluated at collection time and wrap calls in functions.
- Choose between a loop inside one test and a table of tests.
- Keep similar-but-different behaviour (`login`, `refresh`) hand written.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| What makes these four methods a good table? | Same shape: POST a body, resolve `void`, map errors through `rethrowAsAuthError`; only name, path and request differ. |
| What does `as const` do here? | Each row becomes a read-only tuple with literal types; Vitest maps tuple positions onto callback parameters. |
| Where does the block name come from? | `'%s'` takes the first column: `forgotPassword`, `resendVerification`, … |
| How many tests does it generate? | 4 rows × 2 `it` = 8, each reported as `AuthService > <method> > <test>`. |
| Why `() => service.forgotPassword(...)` instead of calling it? | The table is built at collection time, before `beforeEach` assigns `service`. |
| Loop or table? | A loop is one test that stops at the first failure; a table makes one named test per row. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/api/src/lib/services/auth.service.ts` | `forgotPassword` (same shape as the other three). |
| `frontend/projects/api/src/lib/services/auth.service.spec.ts` | The `describe.each` table (lines ~171-207) and its two tests. |
| `frontend/projects/saturdaze/src/app/pages/reset-password/reset-password.page.spec.ts` | `renders each of the five states for the design harness` loop. |
| Verbose reporter output | The eight generated test names. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:27 | Introduction | Title; the one use in the repo. |
| 00:27-01:05 | One shape | Four methods; the signal for a table. |
| 01:05-01:53 | The table | Rows, `as const`, two calls. |
| 01:53-02:33 | Titles | `%s`; other placeholders. |
| 02:33-03:39 | Callback | Columns as parameters; the two tests; eight test names. |
| 03:39-04:14 | Collection | Rows are built before `beforeEach`; wrap calls. |
| 04:14-05:05 | Table or loop | The reset-password loop; reporting differences. |
| 05:05-05:48 | When not | `login`/`refresh` stay hand written; `it.each`. |
| 05:48-06:12 | Pitfalls | Four pitfalls. |
| 06:12-06:53 | Recap | Things to remember; preview of video 04. |

## Demo commands

```sh
cd frontend
npx ng test api --watch=false --include='**/auth.service.spec.ts' --reporters=verbose
```

## Pitfalls

- Calling the code under test while building the table.
- One shared title for every row (no placeholder).
- Columns that switch the body's behaviour.
- Rows too long to read at a glance.

## References

- [Vitest: describe.each](https://vitest.dev/api/#describe-each)
- [Vitest: test.each](https://vitest.dev/api/#test-each)
- [TypeScript: const assertions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions)
