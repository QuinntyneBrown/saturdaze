## Best practices

### Layout

- Lay tiles out in a `.photo-grid`: one column, two from 720px, three from 1024px.
- Keep the actions row to `size="sm"` buttons; the primary action of the tile (Make primary) is the one coral button.

### Content

- Pass the photo's real alt text; an empty value renders as "Not given" so a missing description is visible at a glance.
- Order badges by what the curator decides on: Primary first, then source, then review state, then the health warnings.

### Accessibility

- The image's `alt` is the photo's alt text, so the tile reads the same way the family app does.
- The blocked tile is decorative; the "Blocked URL" badge carries the meaning.
