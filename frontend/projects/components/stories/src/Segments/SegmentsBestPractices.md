## Best practices

### Layout

- Put segments directly under the page header, above any filters (Ideas: Activities · Food · Events).
- Use `narrow` when the control sits in a reading column (the Legal document switch) rather than spanning the page.
- Two to four tabs. More than that wants a different pattern.

### Content

- One or two words per tab, nouns, sentence case: "Activities", "Food", "Events".
- Every tab is a destination with its own URL — segments are navigation, not a filter or a toggle. Use `sd-seg-radio` for a choice inside a form and filter chips to narrow a list.

### Accessibility

- Give each instance a `label` ("Idea type", "Document"); it becomes the navigation landmark's name.
- Selection is announced through `aria-current="page"`, so don't add a second "selected" cue in the label.
