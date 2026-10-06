A month-over-day tile for events and review submissions. The `sd-date-tile` host carries `.date-tile` from `docs/mocks/styles/app.css` and renders two spans, `.date-tile__m` ("May") over `.date-tile__d` ("17").

Pass an ISO date (`2026-05-17`) or ISO date-time (`2026-12-03T10:30:00Z`) as `date`; only the date part is read, so there is no timezone shift. Or pass pre-split `mon` / `day`, which win over `date`. An unparseable `date` renders an empty tile. The tile is decorative (`aria-hidden`).
