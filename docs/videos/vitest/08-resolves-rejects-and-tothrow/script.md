# 08 · Promises and errors: resolves, rejects and toThrow

Most of the Saturdaze frontend is asynchronous. Services return promises, dialogs resolve when they close, and a failed request should reject with a useful error. This video covers how the specs assert on all of that: `resolves` and `rejects` for promises, and `toThrow` for code that throws synchronously. It also covers the ordering rule every A P I service spec follows, and the mistakes that make an async assertion pass without checking anything.

## Assertions on a promise

Put a promise inside `expect`, add `resolves` or `rejects`, then any matcher. Vitest waits for the promise to settle, then applies the matcher to the value it resolved with or the reason it rejected with. If the promise settles the other way, the assertion fails.

Because Vitest has to wait, the assertion itself returns a promise, and you must await it. Every one of the forty `resolves` and `rejects` assertions in the specs starts with `await expect`. Hold on to that; it is the first pitfall.

## resolves

There are twenty-one `resolves` assertions, with four matchers: `toBe` eleven times, `toBeUndefined` six, `toEqual` three and `toBeNull` once.

The confirm dialog spec tests a helper called confirm with. It gives the helper a fake dialog whose closed stream emits confirm, and awaits that the result resolves to true. Then it swaps in a dialog that closes with nothing, and awaits that the result resolves to false. Two lines, both outcomes.

The menu opener spec opens a menu, clicks its first item, then awaits that the pending promise resolves to be the first item. `toBe` here means the very same object, so the test proves the opener hands back the item the user picked, not a copy.

`resolves.toBeUndefined` is how the specs say this call succeeds and returns nothing. The session store's logout, and the auth service's fire and forget calls, such as forgot password, all use it.

## rejects

There are nineteen `rejects` assertions. The strongest ones say what the error is.

The auth service maps every failure to an auth error, a plain object with a code and a message. Its spec checks both shapes. When the backend sends its own error body, sign up must rethrow it, so the spec awaits that the promise rejects to equal the code email in use with the message taken. When the body carries no code, login must fall back, so the spec awaits that it rejects matching an object whose code is invalid credentials. That object also uses the TypeScript satisfies keyword with a partial auth error, so a typo in the expected code is a compile error, not a silently passing test.

Ten assertions use `rejects.toBeTruthy`. That only proves the promise rejected with something. It is fine for a service like weekend plan, whose rejection is whatever the H T T P client produced and whose real contract is the state afterwards: the next line expects the weekend to still be loading. But when callers branch on the error, assert its shape, as the auth specs do.

## The ordering rule for H T T P specs

The A P I service specs all follow one order: start the call, answer the request, then await the assertion.

Look at the sign up test. It calls the service and keeps the promise without awaiting it. That call has now sent a request into Angular's H T T P testing controller. Next, the spec expects exactly one request to the register U R L and flushes it with an error body and a four oh nine status. Only then does it await that the promise rejects.

Swap the last two steps and the test hangs. The promise can't settle until the request is flushed, and the flush never runs because the test is stuck awaiting. You'd see a timeout, not a helpful failure. The same order appears in the shared four-route table in the auth spec from video three: call, expect one, flush, then await `resolves.toBeUndefined`.

When nothing needs answering, you can call inside the `expect` directly. The session store spec mocks the auth service, so it simply awaits that refresh session resolves to true.

## toThrow for synchronous code

`toThrow` is for code that throws while it runs. It takes a function, not a value: you wrap the code in an arrow function, and Vitest calls it and catches what it throws.

The specs use it three times in the negative form. The app config spec loops over the app's providers and runs every factory that takes no dependencies, all inside an arrow function, and expects it not to throw. The require auth and require anonymous guard specs run the guard in an injection context and expect that not to throw either. These are smoke tests, and the guard specs follow them with the tests that matter: should return true when authenticated, and should redirect.

## toThrow on a rejection

The fourth use is `rejects.toThrow`, and it shows why the two forms are not interchangeable. The weekend plan service's regenerate method is async. Before sending anything it looks up the current weekend's id, and a private helper throws an error saying no current weekend is loaded yet.

Because regenerate is async, that throw doesn't escape the call. It becomes a rejected promise. So the spec awaits that regenerate rejects, then applies `toThrow` with the message. Wrapping the call in an arrow function and expecting it to throw would fail: the function returns a promise without throwing.

Use `toThrow` with an error instance, as here. The auth service rejects with plain objects, not errors, which is why its spec uses `toEqual` and `toMatchObject` instead.

## Pitfalls

A few pitfalls. Forgetting await on a `resolves` or `rejects` assertion. As of Vitest four point one, it prints a warning that the promise was not awaited and awaits it at the end of the test, and the warning says this will fail in the next major version. Either way, the assertion runs after the lines that follow it, which is not what you wrote. Awaiting before flushing the H T T P request makes the test hang. Passing a value to `toThrow` instead of a function. Using `toThrow` on an async function instead of `rejects`. And leaning on `rejects.toBeTruthy` when the error's shape is part of the contract.

## Recap

Things to remember.

- Always write await expect with `resolves` or `rejects`.
- `resolves.toBe` checks identity, and `resolves.toBeUndefined` means success with no value.
- Assert the shape of a rejection with `toEqual` or `toMatchObject` when callers depend on it.
- In H T T P specs: start the call, flush the request, then await the assertion.
- `toThrow` takes a function, and only sees synchronous throws.
- An async function's throw is a rejection: use `rejects.toThrow`.

Next, in video nine, we start on mocks with `vi.fn` and the `Mock` type.
