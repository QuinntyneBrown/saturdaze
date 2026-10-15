# 34 · Design drift D39: signing out is not dangerous

A big red button tells people something is about to be destroyed. This short video covers drift D39 from the design-system drift log: a Sign out button that was red when nothing is destroyed. We look at what drifted, why it matters, the fix in the mock and the component, and the real screen before and after. Recorded as of October 2026.

## What drifted

When someone who is not an administrator signs in to Saturdaze Admin, they land on a gate. It says this account can't use Saturdaze Admin, shows the email they are signed in with, and offers one action: Sign out. In the mock and in the app, that button was a danger button: a large, solid brick red.

On the Family page, the same action, Sign out, is a quiet button with warm text. The design system had already decided the gate should match: a quiet warn-text button, as on Family.

## Why it matters

Red is a promise. In Saturdaze the danger style is reserved for the button that confirms a destructive action inside a dialog, such as removing a family member. Signing out destroys nothing: you sign back in and everything is there. A red button here makes a harmless choice look risky, and it weakens the red for the moments that need it. It also makes the same action look different in the two apps, which is the idea behind consistent identification, success criterion three point two point four.

## The fix in code

This is a visual change with no new behaviour, so there is no new acceptance test, and the mock leads. In the admin gate mock, the Sign out button drops the danger class and takes the quiet and warn-text classes, still large and full width.

In the app, the admin gate component renders its button as `variant="quiet"` with `warnText`, the same two attributes the Family page uses, and keeps the large, full-width size. The component's story description now says a quiet warn-text Sign out button.

In the design system, the auth card page no longer lists this as something noted without a drift id, and its do and don't example now says a danger button is reserved for confirming a destructive action, and signing out destroys nothing. The D39 row is gone from the drift log. The existing Admin end-to-end test still finds the button by its name, so it keeps working.

## Before and after

Here is the build from before the fix. A family account signs in to Saturdaze Admin and lands on the gate. Under the message, Sign out is a large, solid red button, the loudest thing on the card.

And here is the fix. The same gate. Sign out is now a quiet, outlined button with warm text, the same style as on the Family page, and the card no longer shouts.

## Recap

Things to remember.

- The danger style confirms destruction; signing out destroys nothing.
- Same action, same look: the gate matches Family.
- Quiet plus warn-text is the pair of attributes to use.
- Mock first, then the component, then delete the drift record.
