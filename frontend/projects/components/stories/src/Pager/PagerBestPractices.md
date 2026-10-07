## Best practices

### Layout

- Place the pager directly under the list it pages; it carries its own 16px top margin.
- Use one pager per list. A list short enough for one page still shows the pager, with both buttons disabled, so the count stays visible.

### Content

- Pass `total`, `page` and `pageSize` from the API's page response rather than counting rows on the client.
- Word `emptyText` for the list ("No places", "No changes") instead of a generic "No results".

### Accessibility

- Give each pager a distinct `label` when a screen has more than one list, since every pager is a landmark.
