## Best practices

### Layout

- `lg` (default) in the top bar and on family member rows, `sm` beside a submitter's email in the review queue.
- When stacking several avatars, keep them the same size and tone order everywhere.

### Content

- Pass the person's display name (or their email when that's all there is); the component picks the initial.
- Keep a member's tone stable across screens — assign it from the member's position in the family, not at random.

### Accessibility

- The avatar is hidden from assistive tech. Always show the name next to it, or give the containing control an accessible name.
