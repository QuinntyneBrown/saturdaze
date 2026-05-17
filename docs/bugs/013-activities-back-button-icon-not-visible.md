# Bug 013 — Activities page back button icon is not visible

## Symptom

On `http://127.0.0.1:4201/activities`, one icon appears white or nearly
white to the eye and is not visible against its surrounding background. The
icon looks like it may be a back button.

## Impact

The control is hard to discover and may be unusable for sighted users. If it
is a navigation control, users may not realize they can go back from the
Activities page.

This is also likely a contrast/accessibility issue: the icon color should have
enough contrast against the button or page background in every supported page
state.

## Fix

Identify the Activities page navigation icon, confirm whether it is the back
button, and update its foreground/background styling so the icon remains
visible.

Check both desktop and mobile layouts, and verify hover/focus/active states do
not regress the contrast.

## Status

- Logged: 2026-05-16
- Reported from: `http://127.0.0.1:4201/activities`
- Status: Fixed
- Fixed: 2026-05-16
- Verification: Playwright smoke confirmed the Activities back button renders
  visible SVG glyph content and is not white on `http://127.0.0.1:4201/activities`.
