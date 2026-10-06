## Best practices

### Layout

- Use a select for one choice out of five or more short options (errand duration). For two or three, use `sd-seg-radio` so every option is visible.
- Keep it in the form's single column; it stretches to the field width.

### Content

- Option labels are short and scannable: "15 min", "30 min", "60 min" — not sentences.
- Always seed the control with a sensible default ("45 min") so the field never starts blank.
- Option `value`s are strings; convert numbers when you read the form value.

### Accessibility

- Always pass `label`; the `<label for>` names the native select.
- The native picker handles keyboard and screen readers — don't replace it with a custom listbox.
