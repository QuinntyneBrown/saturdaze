## Best practices

### Layout

- Stack sections down a page or a `family-grid` column; the section owns its bottom spacing, so don't add margins between them.
- At most one `[slot=action]`, and keep it a quiet `size="sm"` button. The coral primary belongs to the page header.

### Content

- Titles name what's inside in the family's words: "Who's in", "Locked in every weekend", "Right for this weekend's weather".
- Use `subtitle` for one short line of context ("Near Terre Bleu · 12:00 to 1:30"), not instructions that belong in the body.

### Accessibility

- The title is an `h2` under the page's `h1`; content inside should start at `h3` (the typed cards do).
- An action button such as "Edit" should make sense next to its heading — the section title gives it context for screen-reader users navigating by region.
