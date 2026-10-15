# 40 · Design drift D45: focus that follows what you see

On a phone, the main button of the page header is drawn first, at the top. If the keyboard visits the other button first, focus and sight disagree. This short video covers drift D45 from the design-system drift log: what drifted, why it matters, the fix, and the real header before and after, on a phone-sized screen with the Tab key. Recorded as of October 2026.

## What drifted

The generating Weekend mock has a page header with two actions: Add to calendar, which is a quiet button, and Share, the primary one. In the mock's markup, Add to calendar came first and Share came last. On a phone, the stylesheet draws the primary button first, above the other, using the CSS order property. So the screen shows Share on top and Add to calendar below it, but the Tab key visits Add to calendar first.

The Angular page header does not have this problem. It projects the primary slot first in the markup, so the order in the document already matches the phone layout.

## Why it matters

The criteria are WCAG two point four point three, focus order, and one point three point two, meaningful sequence. Focus should move through a page in an order that preserves its meaning and operability, and for someone using a keyboard or a switch, an order that jumps from the second button to the first feels broken. The primary action should be the first stop.

## The fix in code

This is a change to the mock only. The product already ships the right behaviour, so there is no new requirement and no production code to change. In the generating Weekend mock the Share button now comes first in the markup and Add to calendar second, the same order as the Angular header. On wider screens the two buttons keep their natural order, so the primary sits first there too.

The design system's page header page used the old mock as its example of what not to do, and carried an open note about it. Both are reworded: the mock and the component now agree. The D45 row is gone from the drift log.

There is also a small regression test. It opens the generating state of the Weekend page, reads the accessible names of the header buttons in document order through the page object, and expects Share first and Add to calendar second. It passes on the app today, which confirms the claim, and it will catch the order slipping.

## Before and after

Here is the build from before the fix. This is the generating Weekend mock at phone width, with its buttons enabled so Tab can reach them. The panel at the bottom reports where focus lands. Pressing Tab until focus reaches the header actions, it lands on Add to calendar, the lower button on screen. The primary button above it is skipped.

And here is the fix. The same screen and the same keys. Focus lands on Share first, the upper button, and the next Tab moves down to Add to calendar. What you see and what the keyboard does now agree.

## Recap

Things to remember.

- Focus order follows the document, so the document must match the visual order.
- The primary action goes first in the markup; CSS may draw it first on phones, but it should not have to.
- The Angular page header already did this; the mock now does too.
- Fix the mock, lock the app's order with a test, then delete the drift record.
