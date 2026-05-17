# Bug 015 — Home page `Plan This Weekend` button icon is missing

## Symptom

On `http://127.0.0.1:4201/`, there appear to be missing icons. The
`Plan This Weekend` button looks like it is supposed to have an icon on the
left side, but nothing is visible there.

## Impact

The primary call-to-action looks visually incomplete. If the button layout
reserves space for an icon that fails to render, the CTA can look broken or
unfinished even though the text is still visible.

This may also indicate a broader icon-rendering issue on the Home page.

## Fix

Inspect the Home page CTA and icon component usage for `Plan This Weekend`.
Confirm whether an icon is intended, then either render the correct icon or
remove the reserved icon slot from the button layout.

Also scan the Home page for other missing icons and verify icon rendering in
desktop and mobile layouts.

## Status

- Logged: 2026-05-16
- Reported from: `http://127.0.0.1:4201/`
- Status: Fixed
- Fixed: 2026-05-16
- Verification: Playwright smoke confirmed the `Plan This Weekend` button
  renders visible SVG glyph content on `http://127.0.0.1:4201/`.
