The "working on it" row shown while the planner or a list loads: "Working through your locks, the forecast and past weekends." The `sd-status-row` host carries `.status-row` from `docs/mocks-v2/styles/app.css` and is a polite live region (`role="status"`, `aria-live="polite"`).

It renders an `sd-spinner` disc with the `icon` glyph inside (default `sparkle`) and projects the message into `.status-row__text`. The row has a built-in 24px bottom margin so the content below it sits at the right distance.
