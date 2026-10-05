## Best practices

### Layout

- Checkboxes sit at the end of a form, just above the submit button (Create account).
- One checkbox per decision; stack them with the form gap, never inline in a row.

### Content

- Write the label as a statement the person agrees to: "Send me the Friday preview. A draft of the weekend in my inbox at 6pm."
- Links in the label (`.sd-link`) open the legal pages; keep the rest of the sentence plain.
- For a setting that applies immediately (a preference on Family), use `sd-toggle` instead.

### Accessibility

- The whole label is the click target and the accessible name — don't put the only meaningful text in a link.
- Mark consent that blocks submit as `required` and validate with `Validators.requiredTrue`.
