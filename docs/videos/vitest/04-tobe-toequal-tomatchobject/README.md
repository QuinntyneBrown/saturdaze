# 04 · toBe, toEqual and toMatchObject

> **Runtime:** ~7.4 min · **Audience:** developers who write frontend unit tests in Saturdaze · **Prerequisites:** [Video 02 · describe, it and the hooks](../02-describe-it-and-hooks/README.md)

**Video:** [04-tobe-toequal-tomatchobject.mp4](04-tobe-toequal-tomatchobject.mp4) · [Slides](slides.html) · **Audio:** [04-tobe-toequal-tomatchobject.mp3](04-tobe-toequal-tomatchobject.mp3) · [Transcript](script.md)

## Why this video exists

`toBe` (1,452 uses), `toEqual` (273) and `toMatchObject` (41) are more than two thirds of the ~2,460 `expect` calls in the frontend specs. Each defines "the same" differently: `Object.is`, recursive contents, or a subset. Picking the wrong one makes a test brittle or blind.

## Learning objectives

By the end, the viewer can:

- Explain `toBe` as `Object.is`: value for primitives, identity for objects.
- Use `toBe` deliberately to prove a helper returns the same object (`weather.spec.ts`).
- Compare request bodies and view-model fragments with `toEqual`.
- Apply the map-then-`toEqual` pattern to lists of elements.
- Match a slice of a large object, or an error's `code`, with `toMatchObject`.
- Avoid the nested-array trap in `toMatchObject` and use `not` sparingly.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why does `expect({ locked: true }).toBe({ locked: true })` fail? | A literal is a new object; `Object.is` checks identity. Vitest says "serializes to the same string" and suggests `toStrictEqual`. |
| When is `toBe` on an object the right call? | When identity is the behaviour: `forecastFor([sat], …)` returns `sat`; `full.dto` is `NEWER`. |
| Why map a list before `toEqual`? | One assertion states the whole expected list and order; the diff shows every element. |
| What does `toEqual` ignore? | `undefined` properties and class types (`toStrictEqual` checks them; unused here). |
| Why `toMatchObject` for `rejects` in `auth.service.spec.ts`? | The test pins the `code` the app branches on, not the copy in `message`. |
| Does `toMatchObject` treat nested arrays as subsets? | No: arrays must match in length; use `toContainEqual` for "contains". |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/api/src/lib/services/weekend-plan.service.spec.ts` | `toBe` on status/id/count; `toEqual({ locked: true })`; `toMatchObject({ preferredDay: 'Sunday' })`. |
| `frontend/projects/components/src/lib/tooltip/tooltip.spec.ts` | `toBe('tooltip')` on the role attribute. |
| `frontend/projects/api/src/lib/api/weather.spec.ts` | `toBe(sat)` identity. |
| `frontend/projects/api/src/lib/services/event-submissions.service.spec.ts` | `expect(full.dto).toBe(NEWER)`. |
| `frontend/projects/api/src/lib/api/weekend-projection.spec.ts` | `toEqual` on a chip; `toMatchObject` on block rows; `toContainEqual`. |
| `frontend/projects/components/src/lib/vote-row/vote-row.spec.ts` | Map `aria-pressed` then `toEqual`. |
| `frontend/projects/saturdaze/src/app/pages/past/past.page.spec.ts` | Map filter chips then `toEqual`. |
| `frontend/projects/api/src/lib/services/auth.service.spec.ts` | `rejects.toMatchObject({ code } satisfies Partial<AuthError>)`. |
| `frontend/projects/components/src/lib/empty/empty.spec.ts` | `not.toBe(sparkle)`. |
| Vitest 4.1 output | The `toBe`-on-a-literal and nested-array failure messages. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:30 | Introduction | Title; usage counts. |
| 00:30-01:14 | toBe | Primitives; `Object.is` vs `===`. |
| 01:14-02:08 | Identity | `toBe(sat)`, `toBe(NEWER)`; the literal mistake. |
| 02:08-02:44 | toEqual | Request bodies and chips. |
| 02:44-03:58 | Map + toEqual | `vote-row`, `past.page`; what `toEqual` ignores. |
| 03:58-05:15 | toMatchObject | Block rows; request body; error codes. |
| 05:15-05:42 | Arrays | Nested arrays must match in length; `toContainEqual`. |
| 05:42-06:04 | not | `not.toBe(sparkle)`. |
| 06:04-06:20 | Choosing | One question per matcher. |
| 06:20-06:44 | Pitfalls | Four pitfalls. |
| 06:44-07:24 | Recap | Things to remember; preview of video 05. |

## Demo commands

```sh
cd frontend
npx ng test api --watch=false --include='**/weekend-projection.spec.ts'
npx ng test api --watch=false --include='**/weather.spec.ts'
npx ng test components --watch=false --include='**/vote-row/vote-row.spec.ts'
```

## Pitfalls

- `toBe` with an object or array literal.
- `toEqual` on a large view model when the test is about two fields.
- Expecting `toMatchObject` to treat nested arrays as subsets.
- `not` when you could state the expected value.

## References

- [Vitest: toBe](https://vitest.dev/api/expect.html#tobe)
- [Vitest: toEqual](https://vitest.dev/api/expect.html#toequal)
- [Vitest: toStrictEqual](https://vitest.dev/api/expect.html#tostrictequal)
- [Vitest: toMatchObject](https://vitest.dev/api/expect.html#tomatchobject)
- [MDN: Object.is()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is)
