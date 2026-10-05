## Best practices

### Layout

- Use `card` for any list that stands on its own in a section (Who's in, Locked in every weekend, Preferences). Drop it only when the list already sits inside a card or dialog.
- Put an `sd-ghost-row` ("Add a family member") directly under the list, outside it, so it isn't counted as a row.
- Keep rows homogeneous: all avatars, or all discs, so the text column lines up.

### Content

- Every row needs a title; keep subtitles to one short line ("Kid · 9", "Saturdays · 9:00 to 10:00").
- Order by what the family thinks of first — parents then kids, commitments by day and time.

### Accessibility

- Only project `sd-list-item`s (each is `role="listitem"`); anything else breaks the list semantics screen readers announce ("list, 4 items").
