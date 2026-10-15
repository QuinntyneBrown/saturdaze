# 43 · Reset links: say what the server does

A password reset link is a small promise: use me within this long, or ask again. In Saturdaze the screens made one promise and the server kept another. This short video covers issue eighty eight: what the screens said, what the server did, why a mismatch on a security link matters, the fix and its tests, and the real reset screen before and after. Recorded as of October 2026.

## What the screens promised, and what the server did

When someone asks for a reset link, the screen says Check your email, and under it: the link works for thirty minutes. If they come back with an old link, the expired screen says: reset links last thirty minutes, ask for a fresh one. The mock the pages were built from said the same.

The server did something different. The forgot password handler stamps each reset token with an expiry of now plus sixty minutes. The detailed design says sixty. And the requirement for resetting a password, L2 zero zero five, said nothing about expiry at all, so nobody could say which half was right.

## Why a mismatch on a security link matters

It is a trust problem and a security problem in one. Someone who is told thirty minutes will give up on a link at thirty one, or request another, when it still works. And the server's real window is twice what anyone was told, which is longer than the person believes a stolen or forwarded link stays live. A security control only works if the people it protects, and the people reviewing it, share one number.

## The decision, and the fix

The fix needs a decision first. The issue offers two: sixty minutes, which changes only the copy, or thirty, which changes the handler and the design. We chose sixty. It is the lowest risk: today people are told less time than they get, so correcting the words only helps them, and nothing about token handling changes.

So the requirement came first. L2 zero zero five gains two acceptance criteria. A reset link requested at time T is accepted at T plus fifty nine minutes and rejected, as expired, at T plus sixty one. And the request, sent and expired states state that same duration.

Then the tests, before any production code. On the back end, a new integration test file uses the fake clock, which gained a time of day so a test can move forward in minutes. It checks that the expiry is exactly sixty minutes after the request, that the link is accepted at fifty nine minutes, and that it is rejected at sixty one with the token expired error. These pass already, because the server was right; they pin the contract. On the front end, a Playwright test, through the reset password page object, registers a throwaway account, asks the real server for a link, reads the expiry the server returns, and turns it into minutes. It then sends the link through the screen and expects the sent state to say that many minutes, and an expired link to say the same. It failed, because the page said thirty while the server's number was sixty.

Last, the copy. The sent and expired states in the page, the two lines in the mock, the design system pages that quote the example, and the expired link story all say sixty minutes now, the detailed design says the copy and the handler change together, and the test passes.

## Seeing it on the real screen

Here is the build from before the fix. A throwaway account asks for a reset link on the real Reset password screen. The panel compares the two numbers. The page says the link works for thirty minutes. The server's link expires in sixty minutes. They disagree.

And here is the fix. The same flow. The page now says the link works for sixty minutes, and the server's link expires in sixty. They agree.

You cannot wait an hour on camera to watch a link expire, so the accepted and rejected cases are shown by the back end tests, which move the clock. At fifty nine minutes the reset is accepted. At sixty one minutes it is rejected as expired.

## Recap

Things to remember.

- A security window needs one number, in the requirement, the handler and the copy.
- Decide the number first, then write it into the requirement before changing anything.
- Pin the server's behaviour with a clock test, and tie the copy to the server's own response.
- Fix the copy, not the token, when the copy is the part that was wrong.
