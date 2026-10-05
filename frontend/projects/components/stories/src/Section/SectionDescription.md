A titled region of a page. `sd-section` renders the `.section-header` from `docs/mocks-v2/styles/app.css` — an `h2.section-header__title`, an optional `.section-header__sub` — and labels the host `.section` with that heading via `aria-labelledby`.

Project the body into the default slot (a list, a card grid, a cluster of chips) and an optional `[slot=action]` (usually a quiet "Edit" button) to sit at the right of the header. Without a `title` the header — and the action slot — is not rendered at all.
