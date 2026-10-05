## Best practices

### Layout

- Saturday and Sunday sit side by side in `sd-grid-days` from tablet up and stack on phones; don't put anything between them.
- Only `sd-block` (or `sd-skeleton-row` while loading) goes in the default slot — the list is `role="list"` and each block is its listitem.
- Turn `actions` off wherever the plan can't be changed: the landing preview, the shared read-only weekend, and while generating.

### Content

- The title is the day name; put the date, high / low and a plain-language forecast in `meta`: "17 May · 22° / 14° · Light breeze, good for outdoors".
- Set `weather` from the forecast so the disc agrees with the meta line; leave it `null` when there's no forecast yet.
- Keep "Add an errand" as the only footer; anything else belongs in the page header.

### Accessibility

- The day is a region labelled by its `h2`; blocks inside use `h3`.
- The day buttons are named "Regenerate Saturday" / "Lock Saturday" and the lock mirrors `aria-pressed`, so screen-reader users know which day and what state.
- Set `busy` while a regenerate or lock request is in flight so the buttons can't be pressed twice.
