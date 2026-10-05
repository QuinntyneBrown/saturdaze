## Best practices

### Layout

- Give each list its own field — "Likes" and "Dislikes" side by side in one dialog, never mixed in one input.
- The box wraps; let it grow with its chips instead of capping its height.

### Content

- Values are short tags the planner can match: "Parks", "Pancakes", "Museums", "Camping".
- Tone carries meaning: `leaf` for likes, `warn` for dislikes. Don't pick tones for decoration.
- Keep the placeholder as the instruction ("Add one, press Enter") unless the context needs an example.

### Accessibility

- Pass `label`; it names the text input.
- Each chip's remove button is labelled "Remove {value}", so a screen reader user knows which tag goes.
