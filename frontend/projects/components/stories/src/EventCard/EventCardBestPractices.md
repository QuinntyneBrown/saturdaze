## Best practices

### Layout

- Group events by day in an `sd-section` ("Saturday · 17 May") inside an `sd-grid-cards` grid; put the family's pending suggestion in its own "Your suggestion" section first.
- Prefer passing the ISO `date` straight from the API; use `mon` / `day` only when the page has already formatted them.

### Content

- `meta` is venue · time: "Living Arts Centre · 2pm matinée", "Royal Botanical Gardens · all weekend".
- Chips describe the kind of event (Seasonal, Outdoor, Theatre, Festival) and end with the drive time.
- A pending suggestion carries a sun "Pending review" chip so the muted state is said in words.

### Accessibility

- The date tile is decorative (`aria-hidden`); put the day in `meta` too if the time of day matters.
- Details opens an external site in a new tab; label it "Details", not the URL.
