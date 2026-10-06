## Best practices

### When to use

- Every icon-only button gets one; `sd-button` does this for you from `label`.
- Use it to name or briefly explain a control, never for content people need to finish a task — touch users never see it.
- Don't put a tooltip on a non-interactive element; keyboard users can't reach it.

### Content

- Say what pressing does, in a few words and sentence case: "Swap for something else", "Lock — keep when regenerating".
- Drop context the screen already shows. The block's `label` is "Swap Riverwood Conservancy"; its tooltip is just "Swap for something else".
- Plain text only — no links, buttons or formatting inside the bubble.

### Behaviour

- Don't repeat visible button text in a tooltip.
- Phones and tablets have no hover, so whatever a hover-only action does must also be reachable another way (the block's chevron opens the details dialog).
