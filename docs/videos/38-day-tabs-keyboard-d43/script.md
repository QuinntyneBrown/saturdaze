# 38 · Design drift D43: the day tabs, by keyboard

The Weekend screen shows one day at a time, and two tabs switch between them: Saturday and Sunday. Plenty of people never touch them with a mouse. This short video covers drift D43 from the design-system drift log: what drifted, why it matters, the fix in the mock and the component, and the real tabs before and after, driven from the keyboard. Recorded as of October 2026.

## What drifted

The mock's tabs responded to clicks only. There were no arrow keys and every tab was in the Tab order, so a keyboard user would Tab through both tabs and could not move between them the way a tablist is meant to work.

The Angular tabs were closer. Only the selected tab was in the Tab order, and the left and right arrows moved and wrapped. But two keys from the standard pattern were missing: Home and End. The design system's tabs page describes the full model from the WAI-ARIA Authoring Practices, with automatic activation, and that is what both the mock and the app should do.

## Why it matters

The criteria are WCAG two point one point one, keyboard, and four point one point two, name, role, value. A tablist is one stop in the Tab order. Inside it, arrows move between tabs, and Home and End jump to the first and the last. People who use the keyboard, or a screen reader, expect exactly that, and a page that shows only one day at a time depends on the tabs working.

## The fix in code

This changes how the tabs behave, so the requirement came first. L2 one thirty nine spells out the model. Only the selected tab is in the Tab order. The left and right arrows select and focus the next or previous tab and wrap at the ends. Home and End select and focus the first and last tab. A click still selects.

In the mock, the Saturday and Sunday tabs now carry a tabindex, zero on the selected tab and minus one on the other, and the small script that swaps the panels handles the arrows, Home and End and keeps the tabindex in step.

In the app, the segments component already did the arrows and the roving tabindex. It gains Home and End: the key handler works out a target index from the key, and the rest is unchanged.

The acceptance test came first. It reads the tabindex of both tabs, focuses Saturday, presses the right arrow and expects Sunday to be selected and focused, presses it again and expects a wrap back to Saturday, then presses End and Home. It failed at End, because the key did nothing, and passes now. Finally, the D43 row is gone from the drift log, along with the note that said the mock had no keyboard handling.

## Before and after

Here is the build from before the fix. Focus is on the Saturday tab, and the panel at the top right shows the key being pressed. The right arrow selects Sunday. Then Home: Sunday stays selected, and the page scrolls to the top instead. Then End: Sunday still, and the page scrolls to the bottom.

And here is the fix. The same keys. The right arrow selects Sunday. Home returns to Saturday. End selects Sunday again, and the focus ring follows each selection.

## Recap

Things to remember.

- A tablist is one Tab stop; arrows move inside it.
- Home and End jump to the first and last tab, and the arrows wrap.
- Selection and focus move together, with automatic activation.
- Requirement and mock first, a failing test, then delete the drift record.
