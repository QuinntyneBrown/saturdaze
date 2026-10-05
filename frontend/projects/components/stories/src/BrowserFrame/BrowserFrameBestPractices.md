## Best practices

### Layout

- Size the frame with its container, not with `frameWidth`. `frameWidth` / `frameHeight` are the *design* size of the composition inside; the frame scales that down.
- Keep `frameWidth` at the desktop width the composition was designed for (720px for the weekend miniature) so the miniature looks like the real screen.
- Content overflowing `frameHeight` is clipped — crop the composition deliberately rather than letting it cut mid-row.

### Content

- Decorative only. Never put the only copy of information, a link or a control inside it; the host is hidden from assistive tech.
- Use readonly components inside (`sd-block readonly`, `sd-day [actions]="false"`) so there are no dead buttons in the illustration.
