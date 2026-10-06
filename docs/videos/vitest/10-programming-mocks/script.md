# 10 · Programming mock behaviour

A mock that only records calls can't drive a page through its interesting paths. To test a dialog that confirms, a save that fails or a load that never finishes, you program what the mock does. Vitest gives you four kinds of behaviour, a return value, a resolved promise, a rejected promise and a whole implementation, and each comes in a permanent form and a once form. The Saturdaze specs use all eight. This video shows each one where it lives, and the rule that ties them together: the once queue runs first, then falls back.

## Permanent behaviour with mockReturnValue

Start with the simplest. `mockReturnValue` makes every later call return the value you give it. It appears twice, both in the menu opener spec.

Before each test, the spec builds a fake breakpoint observer whose is matched mock returns false, which means a narrow phone screen, so the menu opens as a bottom sheet dialog. Two tests need the desktop path instead. Each starts with is matched, mock return value true. From that line on, every call in that test reports a wide screen, and the menu anchors a popover.

Notice where the change lives. The default sits in before each, the override sits in the test that needs it, and the next test gets a fresh mock with the default again. That keeps every test readable on its own.

## The once queue

`mockReturnValueOnce` is the most used helper of the eight, with thirty-one calls. It answers the next call only. Call it twice and you queue two answers, consumed in order. When the queue is empty, the mock falls back to its base behaviour.

The family page spec shows why that matters. Editing a member opens two dialogs in a row: the member dialog, then a confirmation. The test chains two once values on the dialog's open mock. The first returns a closed stream that emits remove. The second returns one that emits confirm. Then it calls edit member, checks the confirmation's title, and checks the member was removed from the saved profile.

Then it runs the same flow with a different ending. It clears the save mock's call history, queues remove and then undefined, which is what a dismissed confirmation emits, and asserts the profile was never saved. Two branches of one flow, each scripted in two lines.

The base behaviour matters too. In before each, the dialog fake's open returns a stream that emits undefined, a dismissed dialog. So any open the test didn't script is harmlessly cancelled, rather than crashing on an undefined return.

## Resolved promises

Most service calls are async, so the specs often program promises. `mockResolvedValue` is shorthand for an implementation that returns a promise resolving to your value. It appears thirteen times. Twelve are on router spies, where the spec spies on navigate by U R L and makes it resolve true, so navigation is recorded but never happens. The thirteenth is the copy field spec's clipboard: write text resolves undefined, like a successful copy.

`mockResolvedValueOnce` appears six times, three of them in the app spec. There, the fake menu opener's open is an async mock that resolves undefined, meaning the menu was dismissed. The sign out test queues one resolved value, the sign out item, then clicks the avatar. The app sees sign out chosen, confirms, logs out and navigates to sign in. Another test queues the family item and then undefined, opens the menu twice, and asserts the session was left alone both times.

## Rejected promises

Failure paths are where the once form really shines. `mockRejectedValue`, the permanent form, appears exactly once. In the copy field spec, the clipboard is denied for the whole test: write text rejects with an error. The test proves the component still emits copied and still shows the copied state, because a denied clipboard isn't fatal.

`mockRejectedValueOnce` appears twenty-one times. The sign in page spec queues one rejection per submit. It sets up rate limited, submits, and checks the message about waiting a minute. Then token invalid with a server message, submits, and checks that message is shown. Then token invalid with no message, and checks the generic fallback. Each submit consumes exactly one rejection. Note that these rejections are plain objects with a code and a message, the auth error shape the session store surfaces, not error instances. Reject with whatever the real dependency rejects with.

The weekend page spec shows the fallback in action. Lock day rejects once. The test clicks lock Saturday and sees one warning banner. Then it clicks again. The queue is empty, so lock day falls back to its base implementation, which resolves, and the banner clears. One line scripted a failure followed by a recovery.

## Whole implementations

When a return value isn't enough, replace the implementation. `mockImplementation` appears fifteen times. Fourteen are the same line: spy on console error and give it an implementation that returns undefined, silencing expected error logs. Video twelve covers that spy. The fifteenth is in the weekend page spec. Its mount ready helper sets load current's implementation to an async function that sets the weekend signal to the view under test. One helper, any starting state.

`mockImplementationOnce` appears four times, in two pairs. The past page and review submissions specs each use it to freeze a loading state. The first test makes the load return a promise that never resolves. The page stays in its loading state for as long as the test needs, so the test can assert the status row, then set the view itself and continue. The other use in each spec swaps in a load that sets an empty view, to reach the empty state.

## The rule that ties it together

Here is the order Vitest follows on each call. First, if the once queue has an entry, use it and remove it. Otherwise, use the permanent behaviour set by mock return value, mock resolved value, mock rejected value or mock implementation; the last one set wins, because all four set the same implementation underneath. Otherwise, use the function you passed to `vi.fn` in the first place.

That is why the specs put a safe default in before each and script only the calls that make a test interesting.

## Pitfalls

A few pitfalls. Don't use a permanent form when you mean once; the failure you scripted for one click will also break the retry you meant to succeed. Don't leave once values unconsumed and assume they vanish; they wait for the next call. Don't reject with an error instance if the real dependency rejects with a plain object, or the code under test may read the wrong fields. And always give the base mock a safe default, so unscripted calls do something harmless.

## Recap

Things to remember.

- Four behaviours: return value, resolved, rejected, implementation.
- Each has a once form that answers the next call only, consumed in order.
- Once first, then the permanent behaviour, then the original implementation.
- A safe default in before each, scripted answers in the test.
- A never resolving promise freezes a loading state.

Next, in video eleven, we read what those mocks recorded: called, called with, called times, nth and last call, and the mock dot calls array.
