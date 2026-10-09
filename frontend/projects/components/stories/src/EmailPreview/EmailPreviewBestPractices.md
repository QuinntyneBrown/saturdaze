## Best practices

### Content

- Pass what `POST /api/admin/email-templates/preview` returns, unchanged. Do not render placeholders in the browser; the server's renderer is the one a sender will use.
- Keep the last good render and set `error` when a refresh is refused, so the administrator sees both the problem and what the email looked like.

### Layout

- Give it at least 400 px; beside the form from 1200 px it fills its column and sticks to the top while the form scrolls.

### Security

- Never add `allow-scripts` or `allow-same-origin` to the frame, and never move the HTML out of the frame. Template HTML is administrator-written and is only inert inside the sandbox.
