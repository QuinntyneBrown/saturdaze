## Best practices

### Layout

- The tile leads an event card or a submission row at a fixed 44×44px; don't stretch it.
- Show the full date and time in the card meta next to it — the tile is a glance cue, not the record.

### Content

- Prefer `date` with the event's local ISO date; use `mon` / `day` only when the API already splits them.
- For multi-day events, show the start date and put the range in the meta text ("Sat–Sun").

### Accessibility

- The tile is `aria-hidden`, so a screen reader hears the date only from the visible meta text. Make sure it's there.
