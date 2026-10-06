# 11 · Asserting calls

Video nine made mocks and video ten programmed them. This one reads what they recorded. Vitest has five call matchers, called, called times, called with, last called with and nth called with, and the Saturdaze specs use all five, nearly three hundred times between them. When a matcher isn't precise enough, the specs read the mock's calls array directly. And when a test needs a clean slate halfway through, they clear the history with `mockClear`.

## Was it called at all

The plainest matcher is `toHaveBeenCalled`, which passes if the mock was called at least once. It appears sixty-one times, and here is the telling part: fifty-seven of those are negated, with not dot to have been called. The specs mostly use it to prove that something did not happen.

In the past page spec, the empty state test mounts with query state equals empty and asserts the saved service's load was not called, so the design harness never touches the network. In the chip input spec, typing three spaces and then a duplicate in a different case, each followed by enter, must not call on change. And the app spec proves that dismissing the account menu leaves the session alone: log out was not called.

A positive to have been called, with no arguments checked, is rarely what you mean. If you know what the call should carry, say so with called with.

## How many times

`toHaveBeenCalledTimes` appears fifty-five times. Use it when the count is the behaviour.

The past page spec checks the page loads its weekends exactly once. The reset password spec is the clearest case. The page lets you resend the reset link once and then rests for a minute. The test resends, checks the call carried the email, resends again straight away, and asserts forgot password was still called only one time. The count is the throttle.

## With what arguments

`toHaveBeenCalledWith` is the workhorse, with one hundred and twenty-four uses. It passes if any call so far received exactly these arguments, compared with deep equality.

The menu opener spec asserts is matched was called with the media query string min width seven twenty pixels, which proves the breakpoint the code checks. Called with combines naturally with asymmetric matchers, covered in video seven. The menu opener spec asserts the dialog was opened with the menu dialog component and an object containing the data, the panel class and the backdrop class, ignoring every other option.

Remember the any call part. If a mock was called five times, called with passes when one of them matches. When order or recency matters, use one of the next two.

## The last call

`toHaveBeenLastCalledWith` appears thirty-five times, and it fits anything that reports a running state. The chip input spec is the model. The forms on change callback receives the full list every time it changes. After typing Lego and pressing enter, the test asserts the last call was Parks, Pizza and Lego. An earlier call with a shorter list doesn't matter; the latest value is the truth.

The confirm dialog spec shows a neat edge case. The test confirms, and expects close to have been called with the string confirm. Then it cancels, and expects the last call to have had no arguments at all. Last called with, with nothing inside the brackets, asserts exactly that.

## The nth call

`toHaveBeenNthCalledWith` appears six times. Its first argument is a call number, counting from one, not zero, followed by the expected arguments.

The weekend page spec locks Saturday, switches to Sunday and unlocks it. Then it asserts the first lock day call was Saturday with true, and the second was Sunday with false. The ideas page spec uses it to prove a sequence of dialogs: the first open was the submit event dialog, the second was the event submitted dialog carrying the new submission. Use nth when the order of calls is part of the contract.

## Reading mock dot calls directly

Every mock keeps an array of its calls, one entry per call, each an array of arguments. Five lines in the specs read it directly, for three reasons.

To inspect a big argument. The family page spec defines a helper called saved that returns the first argument of the save profile mock's most recent call, using at minus one. Tests then assert on just the members, or just the commitments, of the saved profile, with ordinary to equal.

To find a call by its first argument. The family, past and weekend page specs each define a confirm data helper. It searches the dialog open mock's calls for the one whose first argument is the confirm dialog, and returns the data from its second argument. Then a test can assert the confirmation's title and labels with to match object, however many other dialogs opened first.

To use a matcher the call matchers don't offer. The auth interceptor spec takes the first argument of the first navigate call, converts it to a string, and checks it with to match against a pattern that starts with slash sign in, question mark, return U R L.

## Clearing the history with mockClear

Sometimes a test needs to count from zero again. `mockClear` empties the recorded calls and results, and keeps the programmed behaviour. It appears four times.

In the weekend page spec, adding an errand opens two dialogs. The test checks both with nth called with, then clears the dialog open mock, clicks the add button again, and asserts open was called only once. The base dialog returns a dismissed result, so the flow stops after the first dialog, and the clear makes that count meaningful.

The family page spec clears save profile between two branches of the same flow, so its final not to have been called is about the second branch only.

The events service spec shows the other reason. Its load mine mock is created once, in the describe block, not in before each, because every test's provider reuses that one mock. So before each test it calls mock clear on it. Without that, a called times assertion would count calls from earlier tests.

## Clear, reset and restore

Three similar names, three different scopes. `mockClear` forgets the calls. `mockReset` forgets the calls, empties the once queue and resets the implementation to the one you passed to `vi.fn`. `mockRestore` does all of that and, for a spy, puts the real method back on the object. Video twelve is about that last one. In these specs, clear is the one you want mid test, because the fake's default behaviour must survive.

## Pitfalls

A few pitfalls. Don't settle for a bare to have been called when you know the arguments. Don't use called with when the order matters; it matches any call. Don't count from one with zero: nth called with starts at one, while the calls array starts at zero. Don't share a mock across tests without clearing it. And don't reset when you only meant to clear.

## Recap

Things to remember.

- Not to have been called proves something didn't happen; fifty-seven of sixty-one uses.
- Called times when the count is the behaviour.
- Called with matches any call; last and nth when recency or order matters.
- Read mock dot calls to inspect, search, or apply another matcher.
- Mock clear forgets calls and keeps behaviour; reset and restore go further.

Next, in video twelve, we spy on real objects with `vi.spyOn`, and put them back with mock restore and restore all mocks.
