## Best practices

### Layout

- Chips sit in a wrapping row under a card title; let them wrap rather than truncate.
- Use `size="sm"` in dense lists (past weekends, the review queue) and the default size on cards.
- `count` is for a numeric badge beside a nav row or heading ("Review submissions 3"), not for general tags.

### Content

- One or two words, sentence case: "Outdoor", "Ages 5+", "Seasonal", "Top pick".
- Let the tone carry meaning consistently: `sun` / `sky` for weather and seasonal, `leaf` for outdoors, `indoor` for indoor and errands, `warn` for dislikes and cautions, `primary` for highlights.
- Chips are labels, not controls. For a toggle in a filter row use `sd-filter-chip`.

### Accessibility

- Colour is decoration — the chip text must stand on its own.
- Give a removable chip a specific `removeLabel` ("Remove Camping") so screen-reader users know which chip the × removes.
