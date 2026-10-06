## Best practices

### Layout

- One cell per family member, in the same order as Family's "Who's in" — parents then kids — on every card.
- Use it inside a food card, below the chips; it isn't meant to stand alone on a page.

### Content

- Use each member's first name and the same avatar tone they have everywhere else.
- Treat `'none'` as "hasn't voted yet", not a no. Only a thumbs-down counts against a pick.

### Accessibility

- Give each row a specific `label` ("Family vote for La Marina"); several rows on one screen otherwise read the same.
- Each button is named "{name} votes yes / no" and is a pressed toggle, so the current vote is announced.
- Use `disabled` rather than hiding the row once a pick is locked, so the family can still see how everyone voted.
