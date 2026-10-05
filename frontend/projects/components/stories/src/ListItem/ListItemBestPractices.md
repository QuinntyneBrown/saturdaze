## Best practices

### Layout

- Use `chevron` only on rows that go somewhere or open a dialog; a static row (the Home location) has none.
- One trailing control per row. A row with a toggle is not also an `action` — nested interactive controls can't be reached reliably.

### Content

- Titles are the thing itself ("Swim lessons", "Mae"); subtitles are the detail ("Saturdays · 9:00 to 10:00", "Kid · 5").
- Use `subtitleFirst` for settings-style rows where a small label sits over the value.

### Accessibility

- Use `href` to navigate and `action` to open a dialog or toggle state — never a click handler on a static row.
- The row's text is its accessible name. If it is ambiguous out of context, pass `label` to override it.
- A leading avatar or disc is decorative; don't repeat the name in it.
