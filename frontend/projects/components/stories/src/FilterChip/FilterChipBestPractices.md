## Best practices

### Layout

- Always place filter chips inside an `sd-filters` row so they scroll on phones and wrap from tablet.
- Lead each row with an "All" chip and separate groups with `<span class="sd-vdivider">`.

### Content

- Short nouns or ranges: "Saturday", "Outdoor", "Under 30 min", "Ages 5+".
- Use a tone only when it echoes the chip colours the results will show (`leaf` for Outdoor, `indoor` for Indoor, `sun` for Seasonal); otherwise leave the default ink.
- Decide in the page whether the row is single-select (days, meal slots) or multi-select (extras) and wire `pressedChange` accordingly.

### Accessibility

- `aria-pressed` is set for you; don't also add `role="radio"` or `aria-selected`.
- Give the containing `sd-filters` a `label` so the group is announced ("Day", "Kind of idea").
- `disabled` uses the native attribute, so the chip leaves the tab order — explain why nearby if it isn't obvious.
