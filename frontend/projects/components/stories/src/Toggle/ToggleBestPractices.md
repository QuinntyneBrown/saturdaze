## Best practices

### Layout

- In a settings list, put the switch in the row's `[slot=trailing]` and let the row's title and subtitle explain it.
- On a form, keep it on one line with a related link ("Remember me" … "Forgot password?").

### Content

- Name the setting, not the action: "Keep it cheap", "Try something new", "Friday preview" — not "Turn on budget mode".
- A preference saves as soon as it flips; don't add a Save button next to switches.
- For a one-off agreement inside a form that submits (terms consent), use `sd-checkbox`.

### Accessibility

- Every switch needs a name: `label`, or `srLabel` when there is no visible label.
- The input has `role="switch"`, so screen readers announce "on" / "off" rather than "checked".
