## Best practices

### Layout

- Prefer `sd-status-row` for page-level loading; it wraps the spinner with a message and a live region.
- Use `size="sm"` inline next to text or inside compact controls; the 40px default for cards and auth states.

### Content

- Put a glyph inside the ring that hints at the work: `sparkle` while planning, `mail` while verifying an email, `fork` while finding food.

### Accessibility

- The spinner is `aria-hidden`. Something visible must say what is loading, inside a `role="status"` region.
- Keep the wait short; past a couple of seconds swap to skeleton rows so the layout is visible.
