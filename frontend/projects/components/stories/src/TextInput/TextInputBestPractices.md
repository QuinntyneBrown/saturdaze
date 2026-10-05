## Best practices

### Layout

- Stack fields in a single column with the form's own gap; pair two short fields (Start / End time) side by side only from tablet up.
- Put a field that needs extra help — the password strength meter, for example — directly under its input, not at the end of the form.

### Content

- Labels are short nouns in sentence case: "Family name", "Email", "Password". Don't end them with a colon.
- Use `placeholder` for an example ("The Browns"), never as a substitute for the label.
- Keep `hint` to one sentence that prevents a mistake ("Eight characters or more."). Errors say what to do next ("Use an email like name@example.com.").
- Mark only the fields a form genuinely can't do without as `required`.

### Accessibility

- Always pass `label`; it is the field's accessible name.
- Set `autocomplete` (`email`, `current-password`, `new-password`) on sign-in and sign-up fields so autofill and password managers recognise them.
- Use `invalid` without a message only when a form-level banner already explains the problem (a failed sign-in), so the field is still announced as invalid.
