## Best practices

### Layout

- Forms are a vertical stack with 14px gaps and one full-width, `size="lg"` primary button last.
- Put a server error in an `sd-banner tone="warn" role="alert"` **above** the form and mark the affected fields `invalid`; keep field-level messages for validation (`error`).
- Status cards (check your email, verified, link expired) use `center` with an `xl` disc in `[slot=disc]` and stacked full-width buttons — no form.

### Content

- Titles are short and human: "Welcome back", "Start planning weekends", "Check your email". The subtitle says what happens next.
- The alt line is one sentence with one link. Don't put a second primary action there.
