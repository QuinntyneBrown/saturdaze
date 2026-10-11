## Best practices

### Layout

- Render it once, as the first element of the app shell, before the top bar, site bar or admin navigation. After the bar it skips nothing.
- Every page's `<main>` has `id="main"`.

### Content

- Exactly "Skip to content" on every page and in both apps, so it is recognised. Not "Skip navigation".

### Accessibility

- Never hide it with `display: none` or `visibility: hidden`: that takes it out of the tab order.
- It is not a substitute for moving focus to the new page's heading after a route change.
