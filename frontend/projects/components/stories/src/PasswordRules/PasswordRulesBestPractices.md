## Best practices

### Layout

- Place the checklist directly under the new-password field, before `sd-strength`, and reference it from the field's `aria-describedby`.
- Use it on new-password fields only — never on sign-in.

### Content

- List the rules the API enforces, in the API's words: "8 or more characters", "A number or symbol" (L2-143). The checklist advises; the server decides.
- Show every rule from the first keystroke, met or not, so the person sees what's left.

### Accessibility

- The met state is carried by the check mark, the colour and the hidden ": met" / ": not yet met" text, never colour alone.
- Don't make the list a live region; `sd-strength` already announces as the person types.
