## Best practices

### Layout

- Render it once from the app shell for `site` routes; signed-in screens use `sd-top-bar` + `sd-bottom-nav`, and auth screens use no bar.
- Turn on `cta` only where signing up is the point of the page (landing, the shared weekend). Legal pages keep it off so the coral button isn't competing with reading.

### Content

- Don't add more links here — the bar is a way in, not site navigation. Footer links (Terms, Privacy) live in the page footer.
