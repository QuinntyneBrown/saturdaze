# 06 · Strings and collections: toContain, toContainEqual, toMatch and toHaveLength

> **Runtime:** ~7.8 min · **Audience:** developers writing Saturdaze unit tests · **Prerequisites:** [Video 04 · toBe, toEqual and toMatchObject](../04-tobe-toequal-tomatchobject/README.md)

**Video:** [06-strings-and-collections.mp4](06-strings-and-collections.mp4) · [Slides](slides.html) · **Audio:** [06-strings-and-collections.mp3](06-strings-and-collections.mp3) · [Transcript](script.md)

## Why this video exists

`toContain`, `toContainEqual`, `toMatch` and `toHaveLength` look interchangeable but compare in different ways. `toContain` alone switches on its subject: substring for strings, class for a `DOMTokenList`, strict (`===`) membership for arrays. Picking the wrong matcher fails confusingly (objects never `toContain`) or passes when it shouldn't (stacked `toContain` ignores order). The specs also show the habit that beats all four when order matters: map the list and compare with `toEqual`.

## Learning objectives

By the end, the viewer can:

- Predict what `toContain` checks for a string, a class list and an array.
- Pass a class list or string to the matcher instead of asserting a boolean, for a useful failure message.
- Use `.not.toContain` to prove nothing leaked.
- Find a deeply equal object in a list with `toContainEqual`.
- Pin generated values with anchored `toMatch` patterns.
- Prefer `toHaveLength` to `.length` + `toBe`, and a mapped `toEqual` to stacked `toContain` calls.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why does `expect(chips).toContain({ … })` fail? | Arrays are checked with `===`; a new object literal is never the same reference. Use `toContainEqual`. |
| What does `toContain` do with `classList`? | Vitest recognises `DOMTokenList` and checks `contains(item)`, reporting the actual classes on failure. |
| Why anchor `toMatch` patterns? | `^` and `$` stop prefixes and suffixes from passing; the generated ids are matched exactly apart from the counter. |
| When is a mapped `toEqual` better? | When order and completeness matter; stacked `toContain` passes with the wrong order or extra items. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/saturdaze/src/app/dialogs/confirm-dialog/confirm-dialog.spec.ts` | `textContent` with `toContain`. |
| `frontend/projects/components/src/lib/icon/icon.spec.ts` | Glyph path fragment, `ICON_NAMES` membership, `classList.contains(…)).toBe(…)`. |
| `frontend/projects/components/src/lib/media/media.spec.ts` | `expect(host.classList).toContain(…)`. |
| `frontend/projects/saturdaze/src/app/dialogs/likes-dialog/likes-dialog.spec.ts` | The only `.not.toContain`. |
| `frontend/projects/api/src/lib/api/weekend-projection.spec.ts`, `api/src/lib/services/activity.service.spec.ts` | `toContainEqual` on chips. |
| `frontend/projects/components/src/lib/{chip-input,dialog,seg-radio}/*.spec.ts` | Anchored id patterns. |
| `frontend/projects/saturdaze/src/app/auth/auth.interceptor.spec.ts` | `returnUrl` redirect pattern. |
| `frontend/projects/api/src/lib/api/format.spec.ts` | Loose locale patterns; `toHaveLength(12)`. |
| `frontend/projects/api/src/lib/services/restaurant.service.spec.ts` | `toHaveLength` on picks. |
| `frontend/projects/saturdaze/src/app/pages/past/past.page.spec.ts` | Mapped filter chips with `toEqual`. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:38 | Introduction | Title; four matchers, four comparisons. |
| 00:38-01:54 | toContain | Strings, class lists, arrays. |
| 01:54-02:32 | Messages | Pass the subject, not a boolean. |
| 02:32-03:07 | .not | Likes dialog edits a copy. |
| 03:07-04:05 | toContainEqual | Why references fail; chips in a block row. |
| 04:05-05:20 | toMatch | Generated ids; `returnUrl`; loose locale patterns. |
| 05:20-05:53 | toHaveLength | Lengths; `toHaveLength` vs `.length` + `toBe`. |
| 05:53-06:37 | Map + toEqual | Past page filter chips. |
| 06:37-07:01 | Pitfalls | Four pitfalls. |
| 07:01-07:48 | Recap | Things to remember; preview of video 07. |

## Demo commands

```sh
cd frontend
npx ng test components --include='**/media/media.spec.ts'                # classList toContain
npx ng test api --include='**/api/weekend-projection.spec.ts'            # toContainEqual
npx ng test saturdaze --include='**/pages/past/past.page.spec.ts'        # mapped toEqual
```

## Pitfalls

- `toContain` for objects in an array (reference comparison).
- `classList.contains(…)` then `toBe(true)`: the failure says only `expected false to be true`.
- Unanchored or near-empty patterns (`/2/`) that match almost anything.
- Stacked `toContain` calls when order and completeness matter.

## References

- [Vitest: expect · toContain](https://vitest.dev/api/expect.html#tocontain)
- [Vitest: expect · toContainEqual](https://vitest.dev/api/expect.html#tocontainequal)
- [Vitest: expect · toMatch](https://vitest.dev/api/expect.html#tomatch)
- [Vitest: expect · toHaveLength](https://vitest.dev/api/expect.html#tohavelength)
