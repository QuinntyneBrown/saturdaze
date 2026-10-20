## Best practices

### Layout

- Place it between the brand and the card inside `sd-auth-shell`, at the card's width.
- Use one `count` for the whole wizard; the segments are sized from it.

### Content

- Count only the steps that ask a question. A closing "You're set" screen shows no stepper.
- Keep "Step n of N" as the label; the step's own question is the card's heading.

### Accessibility

- The track is `aria-hidden`; the label text is what assistive technology reads.
- Done and current segments differ by colour only, which is fine because the label carries the state.
