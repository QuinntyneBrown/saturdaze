## Best practices

### Layout

- Place the meter directly under the password field it measures, and only once something has been typed.
- Use it on new-password fields only — never on sign-in.

### Content

- The label states the level, then the rule: "Weak · eight characters or more.", "OK · … Add a capital letter to make it strong.", "Strong."
- Keep the rule in step with the API's minimum (eight characters); the meter advises, the validator decides.

### Accessibility

- Always pass `label`: the bar is `aria-hidden`, so the label is the only thing announced.
- Don't rely on segment colour alone; the label repeats the level in words.
