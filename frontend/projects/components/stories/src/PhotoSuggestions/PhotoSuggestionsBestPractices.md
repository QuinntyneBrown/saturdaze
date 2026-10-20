## Best practices

### Layout

- Put it after the choices the person already has (the stop photos, the device upload), never instead of them; a failed search leaves those usable.
- Give the tiles the same `name` as the dialog's other radio tiles when one choice spans them all.

### Content

- Keep the caption to the source name; the radio's label carries the title and the source so a screen reader hears both.
- Say what the search is for in `label` ("Suggest photos", "Find a photo") and set `minQuery` to 3 when a description is required.

### Accessibility

- The status line is `role="status"`, so "Finding photos…" and the count are announced without moving focus.
- A failure is an `alert` banner; the search button stays enabled so the person can retry.
