# 04 · toBe, toEqual and toMatchObject

Three matchers carry most of the weight in this repository's specs. `toBe` appears about fourteen hundred and fifty times, `toEqual` about two hundred and seventy, and `toMatchObject` about forty. Together they are more than two thirds of every `expect` in the frontend. They all answer the question "is this the value I expected?", but each defines "the same" differently. Pick the wrong one and a test either fails for no good reason or passes when it should not.

## toBe: the same value

`toBe` compares with `Object.is`, which for most purposes is triple equals. For strings, numbers and booleans that means the same value, and that is how the specs use it almost every time. The weekend plan service spec expects the view's status to be ready, its i d to be w one and its block count to be eight. The tooltip spec expects the bubble's role attribute to be tooltip.

`Object.is` differs from triple equals in only two corners: it treats not a number as equal to itself, and it tells positive zero from negative zero. You will rarely hit either, but it is why the failure message says Object dot is equality.

## toBe on objects means identity

For objects and arrays, `toBe` asks a stricter question: is this the very same object? The weather helpers spec uses that on purpose. It builds a Saturday forecast, passes it in an array to forecast for, and expects the result to be that same forecast. That proves the helper returns the object it was given, not a copy.

The event submissions service spec does the same with a card. After mapping a submission to a card, it expects the card's D T O to be the original newer submission, so the card keeps a reference to its source rather than a clone.

The flip side is a classic mistake: `toBe` with an object literal can never pass, because a literal creates a new object. Vitest's failure message even says so. It reports that the values serialize to the same string, and suggests replacing `toBe` with a deep equality matcher.

## toEqual: the same contents

`toEqual` compares recursively. Two objects are equal when they have the same keys with equal values, and two arrays when they have the same elements in the same order, all the way down.

The weekend plan service spec uses it for request bodies: the lock request's body should equal an object with locked set to true. The weekend projection spec expects the first chip of a locked block to equal an object with an accent tone, a lock icon and the label Locked. Every property is checked, and an extra property on either side fails the test.

## Map, then toEqual

One pattern shows up across the page and component specs. Instead of asserting element by element, the test maps a list of elements to the one thing it cares about, then compares the whole list with `toEqual`.

The vote row spec maps the thumbs up and thumbs down buttons of each person to their aria pressed attributes and expects false, false for the first person, true, false for the second and false, true for the third. The past page spec maps its filter chips to their text and expects All, Favourites, This year and five stars, then maps the same chips to aria pressed and expects only the first to be true.

One assertion states the whole expected list, the order is checked for free, and when it fails the diff shows every element at once.

## What toEqual ignores

`toEqual` ignores properties whose value is undefined, so an object with an extra undefined key still equals one without it. It also does not compare classes, only contents. Vitest has `toStrictEqual` for when those differences matter. This repository never uses it, because its view models are plain objects where an undefined key and a missing one mean the same thing.

## toMatchObject: a subset

`toMatchObject` checks only the properties you list. Everything else on the received object is allowed.

The weekend projection spec projects a Saturday and looks up a block row with many fields. One test cares about time formatting, so it matches only the time, the time range, the duration and the duration in minutes. Another matches only locked, swappable and lockable. Each test states just the slice of the object it is about, and adding a new field to the row will not break either one.

The pattern works for requests too. The weekend plan service spec's add errand test matches the request body against just the preferred day, Sunday, without restating the description and the estimated minutes.

## toMatchObject on errors

The auth service spec uses it with `rejects`. When login fails with a server error and no body, the test expects the promise to reject with an object matching a code of invalid credentials. It doesn't care about the friendly message, which is copy that may change, only the code the app branches on. The `satisfies Partial` of auth error after the literal makes the compiler check that the expected object is a valid slice of an auth error.

You will see more of `resolves` and `rejects` in video eight.

## Nested arrays are not subsets

One rule surprises people. Inside `toMatchObject`, nested objects are matched as subsets, but arrays are not: an array must have the same length as the expected one, element for element. If the row has three chips and you list one, the test fails. For "contains this chip" use `toContainEqual`, which is what the weekend projection spec does for the day highlight chip. That one is covered in video six.

## Using not

Every matcher can be negated with `not`. The empty state spec reads the sparkle icon's markup, changes the icon input to calendar, and then expects the markup not to be the sparkle. Use `not` sparingly with equality: "not this value" passes for every other value, including broken ones, so prefer stating what the value should be when you can.

## Choosing

So the choice comes down to one question each. Is it a primitive, or must it be the very same object? Use `toBe`. Must the whole structure match? Use `toEqual`. Do only some properties matter to this test? Use `toMatchObject`.

## Pitfalls

A few pitfalls. Don't use `toBe` with an object or array literal; it always fails. Don't use `toEqual` on a large view model when the test is about two fields; the test breaks on every unrelated change. Don't expect `toMatchObject` to treat arrays as subsets. And don't reach for `not` when you can state the expected value.

## Recap

Things to remember.

- `toBe` is `Object.is`: values for primitives, identity for objects.
- `toEqual` compares contents recursively and ignores undefined properties.
- Map a list to what you care about, then compare it with `toEqual`.
- `toMatchObject` checks a subset of properties, but nested arrays must match in length.
- `not` negates any matcher; state the expected value when you can.

Next, in video five, we look at the matchers for presence and type: `toBeNull`, `toBeTruthy`, `toBeUndefined`, `toBeDefined` and `toBeTypeOf`.
