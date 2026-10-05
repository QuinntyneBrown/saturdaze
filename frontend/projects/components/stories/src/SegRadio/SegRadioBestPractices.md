## Best practices

### Layout

- Two or three options only. For more, use `sd-select`.
- The group stretches to the field width and splits it evenly; keep it in the form's single column.

### Content

- One or two words per option: "Saturday", "Sunday", "Either".
- Put the flexible option ("Either") last, and make it the default when the planner can decide.
- Always seed a value; a segmented group with nothing selected looks broken.

### Accessibility

- Pass `label`; the radiogroup is `aria-labelledby` it.
- Native radios give arrow-key movement between options for free — don't intercept the keys.
