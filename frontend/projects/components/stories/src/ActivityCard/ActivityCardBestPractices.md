## Best practices

### Layout

- Lay activity cards out in an `sd-grid-cards` grid inside an `sd-section` that explains the grouping ("Right for this weekend's weather", "If the weather turns").
- Use `tone="leaf"` with outdoor glyphs (`tree`, `bike`) and `tone="indoor"` with indoor ones (`popcorn`, `ticket`) so the colour agrees with the filter chips.

### Content

- `meta` is the town or venue only ("Milton", "Square One"); the drive time goes in a sky chip.
- `why` is the personal reason this fits this family this weekend — the kids, the weather, last time — in one or two sentences. It clamps to two lines.
- Two or three chips: drive time first, then ages.

### Accessibility

- The disc is decorative; the title and chips carry the meaning.
- The Map button opens an external site in a new tab; don't wrap the whole card in a link as well.
