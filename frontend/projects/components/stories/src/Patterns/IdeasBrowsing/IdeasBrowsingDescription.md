The Ideas screen: everything the planner could put in a weekend, browsable by hand. A page header, `sd-segments` for **Activities · Food · Events**, a row of `sd-filter-chip`s in `sd-filters` (a full-bleed horizontal scroller on phones, wrapping from 720px, with `.sd-vdivider` between groups), then `sd-section`s of cards in `.sd-grid-cards` (1 / 2 / 3 columns).

- **Activities** — `sd-activity-card`: leaf (outdoor) or indoor disc, why-this line, drive and age chips, a Map link.
- **Food** — `sd-food-card` in the two-column grid: the top pick spans both columns (`card--span`), the family votes in an `sd-vote-row`, and "Lock it in" pins it to the weekend.
- **Events** — `sd-event-card` with an `sd-date-tile`; pending submissions are `muted`.

Filters are toggle buttons (`aria-pressed`); the cards never offer "add to Saturday" — the planner places things (ADR-009 §5). Composition mirrors `docs/mocks/pages/ideas.html`, `ideas.food.html` and `ideas.events.html`.
