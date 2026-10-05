## Best practices

### Layout

- `md` (36px) leads list rows, `lg` (40px) leads cards, `xl` (56px) headlines an auth card or empty state, `sm` (32px) fits dense rows.
- Use `tone="surface"` when the disc sits on a recessed background, so it keeps an outline.

### Content

- Match the tone to what the row is about: `sun` for events and food, `leaf` for outdoors, `indoor` for errands and indoor plans, `accent` for locked commitments, `primary` for account and email, `warn` for passwords and cautions.
- One glyph per disc, from `ICON_NAMES`.

### Accessibility

- A disc says nothing to assistive tech. The adjacent row title must carry the meaning.
