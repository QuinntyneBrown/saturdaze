## Best practices

### Layout

- Put the status row at the top of the content area, above skeleton rows shaped like the result.
- Remove it as soon as the content arrives; don't leave a "done" message in its place.

### Content

- One sentence in plain family language, ending with a full stop: "Finding places to eat near your weekend."
- Name what is happening, not the mechanism: "Checking what is on nearby." rather than "Loading events…".
- Match the glyph to the screen: `sparkle` for the planner and ideas, `fork` for food, `ticket` for events, `star` for past weekends, `user` for family.

### Accessibility

- The row is already `role="status"`; render it with `@if` when loading starts so the message is announced once.
