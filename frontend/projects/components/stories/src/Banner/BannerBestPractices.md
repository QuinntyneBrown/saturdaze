## Best practices

### Layout

- Place the banner where the problem is: above the form fields on auth cards, at the top of a dialog body for save failures.
- Show at most one banner per form; replace its text rather than stacking new ones.

### Content

- Say what happened and what to do next in one or two sentences: "That email and password don't match. Try again or reset your password."
- `warn` with `icon="close"` for errors, `success` with `icon="check"` for confirmations, `info` for neutral notices (a shared, read-only weekend).
- Don't use a banner to explain a planner choice — that's `sd-well`.

### Accessibility

- Use `role="alert"` only for errors the user must act on; everything else stays `status`.
- Render the banner when the message appears (e.g. inside an `@if`) so the live region announces it.
