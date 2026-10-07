## Best practices

### Layout

- Keep the grid to a handful of choices; it is a picker, not a gallery. More than nine photos belongs on a screen of its own.
- Put a "No photo" or upload option last, after the photos.

### Content

- Give every option the same `name`, so the browser treats them as one radio group.
- Start with a sensible choice checked (the current cover, the first curated photo), so the dialog can be confirmed straight away.

### Accessibility

- Name the group with `label`; use `showLabel` when there is no other visible heading for it.
- The radios are native: Tab reaches the group once and the arrow keys move between photos.
