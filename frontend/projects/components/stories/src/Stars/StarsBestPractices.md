## Best practices

### Layout

- Use the default size on past-weekend cards and `size="lg"` in the rating dialog, where the 40px radios are comfortable touch targets.
- Keep the caption short and next to the stars; don't add a second line.

### Content

- Captions read as a score or a prompt: "4 of 5", "Rate it".
- A rating of `0` means "not rated yet", not "terrible" — show "Rate it" rather than five empty stars with no caption.

### Accessibility

- In display mode the stars themselves are decorative; put the score in `label` or in the containing button's accessible name ("Rate this weekend, currently 4 of 5").
- When `editable`, set `groupLabel` to what is being rated ("Rate Saturday"). Each radio already announces its step and `aria-checked`.
