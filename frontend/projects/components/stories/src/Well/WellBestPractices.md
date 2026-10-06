## Best practices

### Layout

- Use a well inside a card or dialog to explain a decision, not as a page-level alert — that's `sd-banner`.
- One well per context. Two stacked wells usually mean the copy should be merged.

### Content

- The title is a short label ("Why this", "Locked", "A recurring commitment"); the body is one or two plain sentences.
- Explain the planner in family terms: "Sunny and 22°, so we kept it outside." rather than scores or rules.
- Tones: `default` for explanations, `accent` (with `lock`) for locked days and recurring commitments, `primary` for tips, `warn` for something worth double-checking.

### Accessibility

- The glyph is decorative; the title and body carry the meaning.
- A well isn't announced when it appears. If the note is a response to an action, use `sd-banner` instead.
