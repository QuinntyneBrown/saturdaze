## Best practices

### Layout

- Render it **once**, in the app shell (`app.html`), next to `sd-bottom-nav` — never inside a page. Pages declare `data.nav` on their route instead.
- Keep exactly four destinations; the list is fixed in `NAV_ITEMS` (ADR-006). Secondary screens (Review submissions, Legal) highlight their parent or nothing.
- Public pages (landing, legal, shared weekend) use `sd-sitebar`, and auth screens use no bar at all (`data.shell: 'bare'`).
- Don't give the page content its own top padding to clear the bar — it is sticky, not fixed, and `.sd-frame` already spaces the page.

### Content

- Pass the signed-in email so the avatar shows the right initial; leave it empty only while the session rehydrates (the avatar shows `?`).
- Open account actions (Family settings, Sign out) from `accountClick` in an `sd-menu` anchored to the emitted element, not a page.
