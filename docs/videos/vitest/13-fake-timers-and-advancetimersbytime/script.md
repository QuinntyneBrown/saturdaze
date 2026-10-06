# 13 · Fake timers and vi.advanceTimersByTime

Some code waits. The copy field shows Copied for two seconds. The tooltip waits four hundred milliseconds before it appears and a hundred before it hides. The reset password page lets you resend a link once, then rests for a full minute. Testing that with real time would make the suite slow and flaky. Vitest's answer is fake timers: you replace the clock, and the test decides exactly when time passes. This video covers the three calls the repository uses, `vi.useFakeTimers`, `vi.advanceTimersByTime` and `vi.useRealTimers`, in the three specs that use them.

## How fake timers work

Calling `vi.useFakeTimers` installs a fake clock. From then on, set timeout does not schedule anything with the real event loop. It adds the callback to the fake clock's queue, and nothing in that queue runs on its own.

`vi.advanceTimersByTime` moves the fake clock forward by the number of milliseconds you pass. As it moves, it runs every timer that falls due inside that window, in order, synchronously, before the call returns. If one of those callbacks schedules another timer that is also due inside the window, that one runs too.

`vi.useRealTimers` uninstalls the fake clock and puts the real functions back.

Two defaults matter, as of Vitest four point one. With no options, Vitest fakes every timer function it knows, set timeout, set interval, the date and more, except next tick and queue microtask. And the fake clock starts at the real current time. So promises and microtasks keep working normally under fake timers. Only timers stop.

The specs call `vi.useFakeTimers` three times, `vi.advanceTimersByTime` eleven times and `vi.useRealTimers` three times.

## The copy field: a boundary from both sides

Look at the copy field component first. Its copy method writes to the clipboard, sets the just copied signal to true, emits the copied output, and then schedules set timeout with two thousand milliseconds to set the signal back to false.

Now the test, called flips to a pressed Copied state and reverts after two seconds. Its first line calls `vi.useFakeTimers` with a to fake option listing only set timeout and clear timeout. It does this inside the test, before the click. That ordering is the first rule of fake timers: the fake clock must be installed before the code schedules its timer. A timer scheduled with the real set timeout stays real.

Then it clicks the button and calls its flush helper, which awaits four resolved promises and runs detect changes. That works under fake timers because microtasks are never faked. The test checks the pressed state: aria pressed is true, the text says Copied, the icon is a check, and the polite live region says Copied.

Here is the heart of the video. The test advances the clock by nineteen ninety-nine milliseconds, runs detect changes, and expects the text to still say Copied. Then it advances by one more millisecond, runs detect changes again, and expects aria pressed to be false and the text to be back to Copy.

Two small calls prove the boundary from both sides. If someone shortens the delay to fifteen hundred, the first check fails. If someone lengthens it, or the reset never happens, the second check fails. A single advance of, say, three seconds would only prove that the reset happens eventually.

Notice the detect changes after each advance. The timer callback sets a signal, and Angular schedules a render for it, but the test calls detect changes itself so the D O M is up to date before it asserts.

Why narrow to fake at all? The spec doesn't say. The effect is that only those two functions are fake, and the date, set interval, request animation frame and everything else stay real. Faking only what the component uses is a good habit: it leaves less for a fake clock to freeze by accident.

Finally, after each in this spec calls `vi.useRealTimers`. It runs for every test, including the ones that never faked anything, which is harmless, and it guarantees the fake clock never outlives the test that installed it.

## The tooltip: delays and grace periods

The tooltip directive has three constants: a show delay of four hundred milliseconds, a hide delay of a hundred, which gives the pointer time to move onto the bubble, and a warm window of six hundred, which comes back in the next video.

Its spec fakes timers for every test. Before each calls `vi.useFakeTimers` with no options, and after each destroys the fixture and then calls `vi.useRealTimers`.

The first test, shows after a hover delay and hides on pointer out, reads like a timeline. Pointer enter, and the bubble is still null. Advance four hundred, and the bubble exists with the right text and the tooltip role. Pointer leave, advance a hundred, and the bubble is gone. There is no detect changes here, because the directive renders its panel itself when it shows.

The second test, stays open while the pointer moves onto the bubble, uses the grace period. Hover, advance four hundred, leave the trigger, then enter the bubble before the hide timer fires. Now advance five hundred milliseconds, far longer than the hide delay, and the bubble is still there, because entering the bubble cleared the timer. Leave the bubble, advance a hundred, and it closes.

The touch test is short. A touch pointer enters, the clock advances a full thousand milliseconds, and the bubble is still null. Advancing well past the show delay is the point: it proves never, not merely not yet.

## The reset password page: a minute in a millisecond

The reset password page sets a resent signal to true after a resend and schedules set timeout with sixty thousand milliseconds to clear it.

The test, called resends once and then rests for a minute, calls `vi.useFakeTimers` as its first line, then wraps everything else in try and finally, with `vi.useRealTimers` in the finally block. It mounts the page in the sent state, resends, and checks that forgot password was called with the email, that resent is true, and that the button says Sent and is disabled. A second resend changes nothing: forgot password has still been called exactly once.

Then one line advances the clock by sixty thousand milliseconds. After detect changes, resent is false, and the button says Resend and is enabled again. A full minute of cooldown passes in a fraction of a millisecond.

The try and finally is the same lesson as after each in the last video. If any assertion fails, the finally block still restores real timers, so the fake clock cannot leak into later tests while isolation is off.

## Synchronous or async?

`vi.advanceTimersByTime` is synchronous. It runs the due callbacks, but it does not wait for promises those callbacks start. Every timer callback in these three components just sets a signal, so the synchronous version is all they need.

If a timer callback awaited something and then scheduled the next timer, you would reach for the async variant, advance timers by time async, which lets promises settle between timers. The repository doesn't use it, and it doesn't use run all timers or run only pending timers either. Advancing by an exact amount keeps every test honest about how long it expects to wait.

## Pitfalls

A few pitfalls. Don't install fake timers after the code has already scheduled its timer. Don't forget to restore real timers; use after each, or try and finally. Don't await a helper that waits on a zero millisecond set timeout, like the settle function in several page specs, while timers are fake and nobody advances them, because it will never resolve. Don't test only one side of a delay. Remember detect changes when the callback changes state the template reads. And fake only what you need.

## Recap

Things to remember.

- `vi.useFakeTimers` queues timers on a fake clock; nothing runs until you advance.
- `vi.advanceTimersByTime` runs every timer due in the window, synchronously and in order.
- Prove a boundary from both sides: nineteen ninety-nine, then one.
- Install the fake clock before the timer is scheduled, and narrow it with to fake when you can.
- Restore with `vi.useRealTimers` in after each, or in a finally block.

Next, in video fourteen, the last in the series, we move the clock without running any timers, with `vi.setSystemTime`.
