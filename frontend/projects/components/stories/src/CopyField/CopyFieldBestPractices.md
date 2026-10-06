## Best practices

### Layout

- Use it inside the Share dialog with a short line underneath that says what the link allows ("Read-only · expires in 7 days").
- Let it take the full width of the dialog body; long links truncate inside the value box.

### Content

- Show the exact text that will be copied — no shortening or prettifying of the URL.
- Only copy things meant to leave the app (share links); don't use it for passwords or tokens.

### Accessibility

- The button's "Copied" confirmation is in a polite live region, so it is announced without moving focus.
- Listen to `copied` if the page needs to record the share; don't show a second toast.
