## Best practices

### Layout

- Render it alone on the page; it owns the whole viewport like the sign-in screen.

### Content

- Always pass the signed-in email so the person knows which account is in the way.
- Point `familyAppUrl` at the family app's origin in production; in development it is the local dev server.

### Accessibility

- The card title is the page `<h1>`; Sign out is the only interactive control besides the links in the shell footer.
