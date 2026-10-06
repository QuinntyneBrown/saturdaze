## Best practices

### Layout

- Always open dialogs through CDK `Dialog` with `panelClass: 'sd-dialog-panel'` and `backdropClass: 'sd-dialog-backdrop'` — never hand-roll a modal or a backdrop.
- Use `wide` only for form dialogs; confirmations stay at the default width.
- Actions: quiet "Cancel" first, then the one primary (or danger) action. Put "Remove" in `[slot=actions-left]` so it is apart from Save.
- Keep the body short enough to fit a phone sheet without scrolling where possible.

### Content

- Titles are the question or the task: "Sign out?", "Remove Mae from the family?", "Share this weekend", "Add a family member".
- The subtitle is the consequence in one sentence ("Your family and weekends stay saved.").
- Name the action on the button ("Sign out", "Replace draft", "Add member") — never "OK" or "Yes".
- Reserve `variant="danger"` for Replace draft, Remove, Sign out and Reject.

### Accessibility

- Open with `autoFocus: 'first-tabbable'` and `restoreFocus: true`; form dialogs focus their first field.
- Set `closeLabel` if the × does something other than close ("Cancel and discard").
- Every dialog needs a `title`; it becomes the dialog's accessible name.
