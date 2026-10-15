## Best practices

### Layout

- Place it at the top of the form body, above the first field. Show at most one summary per form.
- Keep the primary action enabled; the summary is how a person learns what is missing.

### Content

- Each line is the same sentence its field shows, so the two never disagree: "Enter a title for the event".
- Remove a line as soon as its field is fixed, and remove the summary when none are left.
- Don't use it for a server failure — that is `sd-banner` with `role="alert"`.
