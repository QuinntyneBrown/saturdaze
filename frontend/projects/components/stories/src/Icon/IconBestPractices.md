## Best practices

### Layout

- Let the container size the glyph where it can: chips, discs, wells and buttons already set the right box through `--_size`.
- Stick to the sizes the mocks use — 13–16px inside chips and rows, 20px by default, 24–26px in large discs.
- Keep `stroke` at the default 1.7 except in tiny contexts (the chip × uses 2.5 at 10px) where a heavier line stays legible.

### Content

- Use the glyph that matches the product meaning everywhere: `lock` for a locked day, `refresh` to regenerate, `fork` for food, `ticket` for events, `sun` / `cloud` / `rain` for the forecast.
- Reserve `filled` for state that is "on": a rated star, a saved heart.
- Pick from `ICON_NAMES`; a typo silently renders the sparkle.

### Accessibility

- Icons are always decorative. Put the meaning in visible text or, for icon-only buttons, in the button's `label`.
- Don't rely on a filled vs. outline glyph alone to convey state — pair it with `aria-pressed` or text ("Saved").
