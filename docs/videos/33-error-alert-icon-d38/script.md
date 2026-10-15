# 33 · Design drift D38: errors that say warning, once

When something goes wrong, the screen has two jobs: show it, and tell people who cannot see it. This short video covers drift D38 from the design-system drift log: what drifted, why it matters, the fix in the mocks and the app, and the real sign-in screen before and after. Recorded as of October 2026.

## What drifted

Two things were off. First, the icon. The error banner on sign-in, and the small error line under a field, drew a cross, the close glyph. But a cross means dismiss. It sits on the dialog close button, on chips you can remove. On an error it read as a button to click away, not as a warning.

Second, the announcement. The banner had `role="alert"`, and on top of that the mock and the component also set `aria-live="assertive"`. A role of alert already is an assertive live region. Saying it twice is redundant, and some screen readers announce the message twice.

The design system had already chosen: an alert icon, a warning triangle, and `role="alert"` on its own.

## Why it matters

The first problem is meaning. One icon, one meaning, so a cross should only ever say close. The second is WCAG four point one point three, status messages: an error has to be announced to assistive technology without moving focus. Role alert does that fully. A second declaration adds nothing and risks a double announcement.

## The fix in code

This changes accessibility semantics, so the requirement came first. L2 one thirty six says an error banner and a field error use the alert icon, never the close glyph, and that an error banner is announced by role alert alone, with no `aria-live` attribute. Status banners keep role status, also without it.

Then the mocks: the sign-in banner and the image address error in the dialogs now use the alert icon, and the banner lost its extra `aria-live`. The alert icon joins the mocks' sprite.

In the app, four changes. The icon set gains alert, the same triangle the design system draws. The banner component no longer binds `aria-live`. The text input's error line draws alert instead of close. And every error banner, twenty files across the family and admin apps, passes icon alert instead of close.

The acceptance test came first. It signs in with a wrong password and expects the banner to have role alert, no `aria-live` attribute, and the alert glyph. It failed because the banner said assertive, and passes now. The banner and icon unit specs were updated to match, and the text input spec checks that its error line draws the alert glyph. Finally, the D38 row is gone from the drift log.

## Before and after

Here is the build from before the fix. This is sign-in after a wrong password. The banner says that email and password did not match, and it is marked with a cross, the same shape as every close button.

And here is the fix. The same screen, the same message, and the banner is now marked with a warning triangle. The announcement for a screen reader is unchanged to hear, but it now comes from the role alone.

## Recap

Things to remember.

- A cross means dismiss; an error gets the alert icon, a warning triangle.
- `role="alert"` already is an assertive live region; do not add `aria-live` on top.
- Status banners keep role status, also with no `aria-live`.
- Requirement and mock first, a failing test, then delete the drift record.
