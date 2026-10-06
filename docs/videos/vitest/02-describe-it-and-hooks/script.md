# 02 · describe, it and the hooks

Every one of the one hundred and eighteen spec files in the Saturdaze frontend has the same skeleton: `describe` blocks that group, `it` blocks that state one behaviour each, and `beforeEach` and `afterEach` hooks that build and tear down the world around every test. In this video you learn how those four pieces fit together, in what order the hooks run, where helper functions belong, and why cleanup is not optional in this workspace.

## describe groups, it states a behaviour

Open the weekend plan service spec in the api project. The outer `describe` is named after the class, Weekend Plan Service. Inside it, more `describe` blocks group the tests by method: load current, plan, regenerate, block actions and add errand.

Each `it` names one behaviour as a sentence. Read the names from the outside in and you get a specification: Weekend Plan Service, load current, maps a four oh four to the empty state. When that test fails, the report prints the same path, so the name alone tells you what broke.

Not every test needs a group. Creates a share link sits directly under the outer `describe`, because it is the only test for its method. Group when there is more than one behaviour to say about something, not before.

Across the repository there are about a hundred and fifty `describe` blocks and about seven hundred and forty `it` blocks. As you saw in video one, both are globals, so no spec imports them.

## Async tests

Almost every test here is an async function. When the callback returns a promise, Vitest waits for it before it decides the test passed. That matters because so much of the code under test is asynchronous: services await H T T P responses, and pages await their first load.

The rule is simple. If the test starts something asynchronous, await it before you assert. A forgotten await lets the test finish green while the real assertion runs after it, or never.

## beforeEach builds a fresh world

`beforeEach` runs before every `it` in its block, so each test starts from the same state. In the weekend plan service spec it is synchronous. It silences console error with a spy, configures the test bed with the service, the H T T P testing providers and a base U R L, then injects the service and the H T T P testing controller into variables the tests share.

A hook can also be async. The tooltip spec's `beforeEach` installs fake timers, moves the clock forward, awaits compile components, then creates the fixture, runs change detection and finds the trigger button. Vitest awaits an async hook just like an async test, so the fixture is ready before the first line of every test.

## Nested hooks and their order

Hooks nest with their blocks. Inside the weekend plan service spec, the block actions group adds its own async `beforeEach` that awaits a helper called load current, because every block action needs a weekend loaded first.

For each test in that group, the outer `beforeEach` runs first and configures the test bed, then the inner one loads the weekend. After the test, the order reverses: inner `afterEach` hooks run before outer ones. That stack order is Vitest's default, and it means teardown always unwinds in the opposite order of setup.

## afterEach undoes what the test changed

The weekend plan service spec's `afterEach` does two jobs. It calls verify on the H T T P testing controller, which fails the test if any request was made and never answered. Then it calls `vi.restoreAllMocks`, which puts the real console error back.

The tooltip spec destroys its fixture and switches back to real timers. The copy field spec's `afterEach` only switches back to real timers, because just one of its tests fakes them; calling it when nothing was faked is harmless.

Notice what no spec does: reset the test bed. Angular's testing module registers its own global `beforeEach` and `afterEach` hooks that tear the test bed down between tests. That only works because globals are on, which is one more reason the builder enables them.

## Helpers live inside describe

Shared variables are declared with let at the top of the `describe` and assigned in `beforeEach`. That way each test gets new values, and nothing leaks from one test to the next.

Helper functions sit beside them. The weekend plan service spec has an async helper that loads the current weekend, answers the request and waits for it to settle. The tooltip spec has a one line arrow that queries the document for the bubble.

The past page spec shows a pattern worth copying. Its `beforeEach` builds the fake services, but it does not create the component. Instead an async function called mount takes an optional query, configures the test bed with that query on a fake activated route, creates the component and settles it. Each test calls mount itself, so one test can mount with the empty state query and another with none. Use `beforeEach` for what every test shares, and a mount helper for what varies.

## try and finally inside a test

The reset password page spec has one test that fakes timers: resends once and then rests for a minute. There is no `afterEach` in that file to restore them, so the test wraps its body in try, and calls `vi.useRealTimers` in finally. Even if an assertion throws halfway through, the real clock comes back.

So you have two ways to clean up. An `afterEach` is automatic and covers every test in the block, which suits cleanup most tests need. A try and finally keeps the cleanup next to the one test that made the mess. Both are fine; leaving the mess is not.

## Why cleanup matters here

Remember from video one that the builder sets isolate to false. Spec files share one module context, so state left behind does not stay in its file. Fake timers left on would freeze every set timeout in the next spec. A console spy left mocked would hide real errors in tests that have nothing to do with yours. Clean up in the same file that made the change, every time.

## Pitfalls

A few pitfalls. Don't assign mutable state in the body of a `describe`; that code runs once, when the file is collected, and every test shares the result. The weekend projection spec does compute a projected day at the `describe` level, but it only ever reads it, which is safe. Don't forget to await async work inside a test or a hook. Don't put assertions in hooks, where a failure is hard to attribute. And don't make one test depend on another having run first.

## Recap

Things to remember.

- `describe` groups, `it` states one behaviour, and the nested names read as a sentence.
- Async tests and async hooks are awaited; await everything you start.
- `beforeEach` builds fresh state; nested hooks run outer first, and teardown unwinds in reverse.
- `afterEach` verifies and restores; Angular resets the test bed for you.
- A mount helper handles setup that varies per test, and try and finally cleans up a one off.

Next, in video three, we turn one block of tests into a table with `describe.each`.
