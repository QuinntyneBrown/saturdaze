## Best practices

### Layout

- Use details inside a card or dialog, under the card head — not as a page-level layout.
- Keep the same labels in the same order across every card in a list so reviewers can scan down them.

### Content

- Labels are one word where possible: "Location", "Cost", "Ages", "Link", "Notes".
- Pass `null` for a value the submitter left blank rather than an empty string or a dash; the component says "Not given" consistently.
- Show the link's readable text (the domain and path), not "Click here".

### Accessibility

- The host is not a native `<dl>`; keep each label short and unique so the pairs read clearly in order.
- External links open in a new tab and show a trailing arrow; don't use `href` for in-app paths.
