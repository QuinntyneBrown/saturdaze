# 05 · Presence and type matchers

Equality matchers ask "is this the value I expected?" A second family asks a coarser question: is anything there at all, and what kind of thing is it? In this video you meet `toBeNull`, `toBeTruthy`, `toBeUndefined`, `toBeDefined`, `toBeTypeOf` and `toBeGreaterThan`, plus a small feature that makes loops of assertions readable: a custom message as the second argument to `expect`. Each one is precise about something different, and the repository's choices between them are deliberate.

## toBeNull: the absent element

`toBeNull` passes only for null, and nothing else. It is the third most common matcher in the repository, after `toBe` and `toEqual`, used more than two hundred times, and more than half of those are on the result of a query selector.

That is no accident. When query selector finds nothing, the D O M returns null, not undefined. So `toBeNull` says exactly "this element is not in the page". The tooltip spec hovers the trigger, and before the delay runs out it expects the bubble to be null. After the pointer moves onto the bubble and time passes, it expects the bubble not to be null. The app spec expects the default app chrome to have a top bar that is not null and a site bar that is null.

## Keeping one kind of absent

Optional chaining complicates this. If a test reads the text of an element that is missing, the question mark dot operator produces undefined, not null. The page specs solve that in their helpers. The past page spec's header title helper reads the title's text content, trims it, and then adds question mark question mark null at the end, so a missing title becomes null. There are more than twenty helpers like that across the specs.

The payoff is consistency: every "not there" in a page spec is null, so every test asserts it the same way, with `toBeNull`.

## toBeNull for "nothing" results

The same matcher states a contract for services and helpers that return null on purpose. The weather helpers spec expects the forecast for a date with no forecast to be null. The weekend plan service spec expects add errand to resolve to null when nothing was placed. In both cases null is a designed answer, and `toBeNull` pins it down.

## toBeUndefined: deliberately missing

`toBeUndefined` passes only for undefined. The repository uses it where undefined is the meaningful value. The routes spec expects the public pages, verify email, legal and sample weekend, to have no can activate guard at all. The app spec expects the body's page data attribute to be undefined in the default app chrome. The family member dialog spec expects the age field to have no error message while the name field has one.

It also appears after `resolves`. The auth service methods that return nothing are expected to resolve to undefined, which proves they succeeded and handed back no value.

## toBeDefined: weaker than it looks

`toBeDefined` is the negation of `toBeUndefined`, and it is used only four times. The A P I base U R L spec expects the injection token to be defined, and the guard specs do the same for their guard functions.

Be careful with it. `toBeDefined` passes for null, for zero, for an empty string, for anything except undefined. It is a smoke check at best. When you know what the value should be, say so with an equality matcher instead.

## toBeTruthy: the smoke test

`toBeTruthy` passes for any value that is not false, zero, an empty string, null, undefined or not a number. Forty spec files contain the same test: expect the fixture's component instance to be truthy. That is a cheap smoke test that the component compiled and was created.

The other common use is with errors. Ten tests expect a promise to reject with something truthy, and the auth interceptor spec expects a captured error to be truthy after a failed refresh. Those prove that something went wrong.

Here is the trade-off. `toBeTruthy` is loose. An empty object is truthy, an error string is truthy, a wrong error is truthy. It proves the failure happened, but not which failure. That is fine when the test's real subject is elsewhere, such as the interceptor test, which goes on to check the redirect to sign in. When the error itself is the behaviour, match its code with `toMatchObject`, as the auth service spec does, or its message with `toThrow`, as the weekend plan service spec does.

## toBeTypeOf: the kind of value

`toBeTypeOf` compares the type of operator's answer with a string you give it, such as function or string. The routes spec uses it to prove routes are lazy. For every page in the app it expects the route's load component to be a function. For the children under ideas it expects load component to be a function and the subtitle in the route data to be a string. And it expects the privacy redirect to be a function before calling it.

That is the right level of precision for configuration: the test doesn't care which function, only that the route lazy loads something.

## toBeGreaterThan: a direction, not a value

`toBeGreaterThan` checks a number against a bound. The weekend projection spec uses it on a comparator: it expects sorting by sort order then start time to return a positive number for two blocks in the wrong order. A comparator's contract is only its sign, so asserting an exact value would over specify it. The app config spec uses it more loosely, to expect at least one provider.

## Custom messages

When an assertion sits in a loop, a failure needs to say which iteration broke. Vitest's `expect` takes an optional second argument, a message, and prefixes it to the failure. The routes spec loops over every route and passes the route's path as the message. If the sign in route lost its lazy component, the failure would read sign in, colon, expected undefined to be type of function. The reset password page spec does the same with the state name in its five state loop.

It costs one argument and turns an anonymous failure into a precise one. Use it in every assertion inside a loop.

## Pitfalls

A few pitfalls. Don't use `toBeFalsy` or `not.toBeTruthy` for a missing element; they also pass for an empty string. Don't mix null and undefined for absence in one spec; pick null, and normalize with question mark question mark null. Don't rely on `toBeDefined`, which passes for null. Don't let a truthy rejection be the only check when the error is the behaviour. And add a message to assertions in loops.

## Recap

Things to remember.

- `toBeNull` for absent elements: query selector returns null.
- Normalize optional chains with question mark question mark null, so every absence is null.
- `toBeUndefined` when undefined is the meaningful value; `toBeDefined` passes for null.
- `toBeTruthy` is a smoke test; it proves something happened, not what.
- `toBeTypeOf` and `toBeGreaterThan` check kind and direction, not exact values.
- A second argument to `expect` names the failing iteration of a loop.

Next, in video six, we look at strings and collections: `toContain`, `toContainEqual`, `toMatch` and `toHaveLength`.
