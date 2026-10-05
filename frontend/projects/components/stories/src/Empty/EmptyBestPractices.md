## Best practices

### Layout

- Put an empty state in a narrow column (`sd-narrow`) under the page header — it replaces the content, not the header.
- Reserve `warm` for the first-run moment that starts the product loop ("Plan this weekend"). Ordinary empty lists use the plain variant.
- One button in `[slot=cta]`: coral `primary` when it is the next step, `quiet` when it just points elsewhere.

### Content

- The title says what's true now ("Nothing here yet", "Queue is clear"), not an error.
- The body says when or how it fills up: "Plan this weekend and it shows up here on Monday, ready to rate."
- Use `note` for a reassuring fallback ("Or wait for Friday at 6pm."), not for more instructions.

### Accessibility

- The title is an `h2` that names the region, so keep it short and specific.
- The disc is decorative; don't rely on its icon or tone to carry meaning the title doesn't.
