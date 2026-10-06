## Best practices

### Layout

- Place the ghost row directly under the list it adds to; it brings its own 12px top margin.
- One ghost row per list. If a list can be added to in more than one way, open a dialog that asks which.

### Content

- "Add a …" / "Add an …" plus the singular noun: "Add an errand", "Add a family member".
- Keep the default `plus` glyph unless the list has a clear icon of its own (`bag` for errands, `user` for family).
- Prefer `pressed` and a CDK dialog for adding; use `href` only when adding is its own screen.

### Accessibility

- The label is the accessible name, so write it as a complete action.
- It's a real `<button>` or `<a>`, so it is keyboard reachable and gets the global focus ring.
