## Best practices

### Layout

- Keep the default `scroll` on page-level filter rows (Ideas, Food, Events, Past) so a long row never pushes the cards down on phones.
- `.scroller-x` bleeds into the page gutter (`--layoutGutter`) on phones; place it directly in the page column, not inside a padded card.
- Turn `scroll` off inside dialogs and cards, where the row should simply wrap.
- Separate unrelated groups (day vs. kind) with an `sd-vdivider`, not extra margin.

### Content

- Lead with "All", then the most-used filters. Keep a row to one decision where you can.

### Accessibility

- Always set `label` to what the chips choose ("Day", "Kind of idea", "Meal"); the default "Filters" is a fallback.
- The row is a plain group, not a toolbar — every chip stays in the tab order.
