# 14 · vi.setSystemTime

In the last video, `vi.advanceTimersByTime` moved the fake clock and ran every timer on the way. Sometimes you want only half of that: the clock should read a different time, but nothing should fire. That is `vi.setSystemTime`. The repository calls it exactly once, in the tooltip spec, and that one line has a good story behind it, including a gap I found while making this video. We finish with a short recap of the whole series.

## What setSystemTime does

With fake timers installed, `vi.setSystemTime` sets the fake clock's current time. From then on, date dot now and new date return the new time. No timer runs, however far you move.

Compare that with advancing by ten seconds. Advance timers by time also moves date dot now forward by ten seconds, but it runs every timer due in those ten seconds on the way. Set system time just jumps.

Two details from Vitest four point one's source. When you call `vi.useFakeTimers`, the fake clock starts at the real current time. And if you call set system time without fake timers, Vitest mocks only the date and leaves timers real. In this repository it is always used under fake timers.

## The warm window

To see why the tooltip spec needs it, look at the directive. It has a module level variable called last hidden at, which starts at zero. Every time a tooltip hides, it stores date dot now there.

When the pointer enters a trigger, the directive compares the two. If date dot now minus last hidden at is less than the warm window of six hundred milliseconds, it shows the tooltip at once. Otherwise it schedules the usual four hundred millisecond delay. That is the behaviour you see in good desktop apps: the first tooltip makes you wait, and the next one, right after, appears immediately.

The important word is module level. There is one last hidden at for the whole app. In tests, with isolation off, there is one for every test and every spec file that runs in the same worker. A hide in one test is still remembered in the next.

## The test that proves the warm path

The spec has a test called skips the delay for the next tooltip right after one hides. It hovers, advances four hundred milliseconds so the bubble shows, leaves, and advances a hundred so it hides. At that moment last hidden at is stamped with the fake clock's time. Then it enters again and, without advancing at all, expects the bubble to be there. Advance timers by time moved date dot now in step with the timers, so the directive sees zero milliseconds since the hide, well inside the window.

## The guard in before each

Now the one call. Before each installs fake timers, and the next line, under a comment that reads step past the warm window left by the previous test's hide, calls `vi.setSystemTime` with date dot now plus ten thousand.

Here date dot now is the fake clock, which `vi.useFakeTimers` has just set to the real current time. So every test starts ten seconds in the future.

That guard does protect against one thing. Suppose a tooltip was hidden on the real clock a moment ago, for example by another spec file in the same worker. Only a few real milliseconds have passed, which would count as warm. Jumping ten seconds ahead makes the gap far larger than six hundred, so the first test starts cold.

## A gap found while making this video

But the comment says the previous test's hide, and that hide was stamped on the previous test's fake clock. That clock also started at the real time plus ten seconds, and then the test advanced it. The stays open test advances a full second before its tooltip hides.

So when the next test starts, its clock reads the real time, a few milliseconds later, plus ten seconds. That is behind the previous stamp. Date dot now minus last hidden at comes out negative, which is less than six hundred, so the directive thinks it is warm.

Today the suite passes anyway, because the one test that needs a cold start, shows after a hover delay, happens to run first. To check, I moved that test to the end of a temporary copy of the spec. It failed, both with and without the set system time line, expecting null and finding the tooltip already open.

Then I tried a fix in another temporary copy. Keep a clock variable in the describe block, initialised from date dot now. In before each, add sixty thousand to it and pass the result to `vi.setSystemTime`. Now every test starts a full minute after the previous one started, far beyond anything a test advances. The reordered copy passed all ten tests. The temporary copies are gone; the spec in the repository is unchanged.

The general lesson: right after you install fake timers, setting the time relative to date dot now is relative to real time, not to the previous test's fake time. If tests must be separated, move the clock monotonically, or reset the module state itself.

## Pitfalls

A few pitfalls. Don't use set system time when you need timers to fire; that is advance timers by time. Don't assume a time relative to date dot now separates one test from the next. Watch out for module level state such as last hidden at, which survives between tests while isolation is off. And remember that order dependent tests can pass for months; try running a test on its own, or last, to see whether it really stands alone.

## Recap

Things to remember.

- `vi.setSystemTime` moves the fake clock without running any timer.
- `vi.useFakeTimers` starts the fake clock at the real current time.
- Module state like the tooltip's last hidden at outlives a test when isolation is off.
- To separate tests, move the clock monotonically, for example by sixty thousand each time.

## The series

That completes the series. Here is the whole path in one breath.

- Video one: N P M test runs the Angular unit test builder, which supplies Vitest's globals, J S dom and isolate false.
- Videos two and three: `describe`, `it`, the hooks, and table driven tests with `describe.each`.
- Videos four to eight: the matchers, from `toBe` and `toEqual` to asymmetric matchers, `resolves`, `rejects` and `toThrow`.
- Videos nine to eleven: `vi.fn`, programming its behaviour, and asserting how it was called.
- Video twelve: `vi.spyOn`, and restoring in after each.
- Videos thirteen and fourteen: fake timers, `vi.advanceTimersByTime`, and `vi.setSystemTime`.

Every one of those features earns its place in a spec in this repository. Thanks for watching.
