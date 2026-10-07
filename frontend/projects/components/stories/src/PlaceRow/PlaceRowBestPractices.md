## Best practices

### Layout

- Use rows inside `sd-list card`, one per place, and nothing else in that list.
- Let the list scroll with the page; the thumbnails load lazily, so long lists stay cheap.

### Content

- Pass the health chips worst first (no photo, blocked URL, unreviewed, missing alt text) and a single "Healthy" chip when there is nothing to fix.
- Match `tone` and `icon` to the catalog (`leaf`/`tree` activities, `sun`/`fork` restaurants, `sky`/`ticket` events) so fallback tiles are recognisable.

### Accessibility

- The row is one link whose name is the place name and meta line; the chips are read after them.
