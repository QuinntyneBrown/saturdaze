# 12 · vi.spyOn and restoring

A mock made with `vi.fn` is a brand new function that nothing else knows about. Sometimes that is not what you need. Sometimes the function already exists on a real object, the router, the console, the window, and you want to watch it, or quietly replace it for one test, and then put it back. That is `vi.spyOn`. This video covers every way the Saturdaze specs use it, and the part people forget: restoring.

## Spy on, or fake?

The specs call `vi.spyOn` twenty-six times, on exactly three kinds of target. Fourteen spies silence console dot error. Eleven watch the Angular router. One watches window dot remove event listener.

Here is how to choose. Use `vi.fn` when the code under test receives the dependency, for example a fake service handed over through an injection token. Use `vi.spyOn` when the code reaches for a real object you cannot hand it: a global like console or window, or a real service the test bed already created. A spy replaces one method on that object and remembers the original, so you can restore it.

## Spying on the router

Start with the button spec. The test injects the real router from the test bed, then spies on its navigate by U R L method and chains mock resolved value true. Without the chained call, a spy calls through to the real method. With it, the real navigation never happens and the spy returns a promise of true, exactly what a successful navigation returns. The test sets an in app href, clicks, and expects the spy to have been called with slash weekend.

The second button test uses the same spy the other way round: external links, modifier clicks and targeted links must keep their browser meaning, so the spy must never be called.

Pages do the same, with one twist. The create account spec declares the spy as a variable typed return type of typeof `vi.spyOn`, and assigns it in before each, after compile components, so every test can assert against it. The past page spec does the same inside its mount helper.

None of these router spies is restored, and that is fine. Angular's test bed resets the testing module between tests, so the next test injects a fresh router, and the spy goes away with the old instance. The rule of thumb: a spy on something the test bed owns dies with the test bed. A spy on a global lives until you restore it.

## Silencing console.error

The services log before they recover. For example, the weekend plan service catches a failed load of the current weekend, logs it with console dot error, and rethrows. A test that drives that failure on purpose would print a red stack trace into an otherwise green run.

So the spec spies on console dot error and chains mock implementation with a function that returns undefined. The original is replaced for as long as the spy is in place, and the output stays clean. Because console is a global, and isolation is off, this spy must be removed, or every later test, in this file and the next, loses its error output.

## Three ways to put it back

The repository restores these spies in three styles.

The weekend plan service spec does it the robust way. The spy is created in before each, and after each calls `vi.restoreAllMocks` right after verifying the H T T P mock. Every test gets a fresh spy, and cleanup runs even when a test fails.

Five tests in the activity, events, restaurant and saved service specs create the spy inside the test and call `vi.restoreAllMocks` as the last line.

Eight page and dialog specs keep the spy in a variable named console error and call its mock restore method as the last line. The family page spec is a good example: spy, mount, make save profile reject once, toggle a preference, check the warn banner, then restore.

The last two styles have the same weakness. If an assertion fails, the test stops at that line, and the restore below it never runs. The silenced console then leaks into the following tests, hiding the very errors you would need to debug the failure. Put the restore in after each, as the weekend plan service does, and that cannot happen.

## Spying without replacing

The scrolled spec shows the other half of `vi.spyOn`: watching without changing anything. The test spies on window dot remove event listener with no implementation at all, so the spy calls through to the real method. Then it destroys the fixture and expects the spy to have been called with scroll and `expect.any(Function)`. The directive really did remove its listener, and the test proved it without faking anything. The last line, `remove.mockRestore()`, puts the original method back on window.

## What restore actually does

As of Vitest four point one, mock restore on a spy clears its recorded calls and puts the original method back on the object. `vi.restoreAllMocks` does that for every spy created with `vi.spyOn`.

It does not touch mocks made with `vi.fn`. In Vitest's spy package, only `vi.spyOn` registers a restore callback, and restore all mocks just runs those callbacks. So a `vi.fn` keeps its calls after restore all mocks. The specs sidestep the question by building fresh fakes in before each, as the past page spec does for its saved service, weekend service and dialog.

## Spies instead of module mocks

You might reach for `vi.mock` to replace a whole module. Video one showed why the specs never do: the dev state spec notes that the Angular unit test builder does not support it on relative imports. The pattern here is simpler anyway. Fake what you inject with `vi.fn` and a provider, and spy on what you cannot inject.

## Pitfalls

A few pitfalls. Don't forget that a spy with no implementation calls through; chain mock resolved value or mock implementation if the real method must not run. Don't restore at the end of a test body when after each can do it. Don't expect `vi.restoreAllMocks` to clear a `vi.fn`. And don't spy on a global without restoring it, because with isolation off, the next file inherits it.

## Recap

Things to remember.

- `vi.spyOn` wraps a method on a real object; `vi.fn` is a new function you hand over.
- Chain `mockResolvedValue` or `mockImplementation` to stop the real method running.
- Spies on test bed objects die with the test bed; spies on globals must be restored.
- Restore in after each with `vi.restoreAllMocks`, so a failing test cannot leak a spy.
- Restore all mocks only restores spies, never `vi.fn` mocks.

Next, in video thirteen, we take control of time with fake timers and `vi.advanceTimersByTime`.
