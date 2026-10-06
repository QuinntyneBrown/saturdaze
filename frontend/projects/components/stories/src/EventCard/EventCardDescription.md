A local event on Ideas · Events. `sd-event-card` is a `.card` host (the event card in `docs/mocks/pages/ideas.events.html`): a `.card__head` with an `sd-date-tile`, the `h3.card__title` and a `.card__meta` place-and-time line, projected chips, and — when the event has a `url` — a `.card__footer` with a quiet "Details" button that opens it in a new tab.

The tile takes an ISO `date` ("2026-05-17" → May / 17) or pre-split `mon` / `day`, which win when given. `muted` (`.card--muted`) marks the family's own suggestion while it waits for review; a muted card hides its Details button.
