## Best practices

### Layout

- One coral `primary` button per screen. Everything else is `quiet`, `ghost` or `text`.
- In dialogs the primary action sits on the right on tablet and desktop and stacks first on phones.
- Keep targets at least 44×44px on touch layouts — `size="sm"` is for dense desktop rows only.
- Don't use a button to navigate; pass `href` so it renders a real link (the exception is a wizard's Back / Next).

### Content

- Sentence case, usually a single verb: "Plan my weekend", "Lock day", "Sign out".
- Icon-only buttons (`icon`) **must** have a `label`; it becomes the `aria-label`.
- Use `variant="danger"` only for destructive, irreversible actions, and confirm them in a dialog.
