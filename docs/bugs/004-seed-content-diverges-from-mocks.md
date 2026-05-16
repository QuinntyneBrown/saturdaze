# Bug 004 — Seeded catalog content does not match the mocks

## Symptom

Seed data populated by `Saturdaze.Cli seed` is unrelated to the entities
the mocks (and therefore the frontend pages) display:

| Surface | Mock content | API content |
| --- | --- | --- |
| `GET /api/family` members | Quinn, Sara, Eli (9), Mae (5) | Avery (5), Theo (9), Jennifer (39), Quinn (41) |
| `GET /api/restaurants?slot=Lunch` | La Marina, Symposium Café, The Sicilian Sidewalk Café, Jack Astor's | Port Credit Pizza, Joe Dog's, Cora's Port Credit |
| `GET /api/activities` top entries | Terre Bleu Lavender Farm, Bronte Creek, Rec Room | Port Credit Memorial Park, Jack Darling Park, Mississauga Central Library |
| `GET /api/events` | Lavender Bloom Opening, Cirque Mechanics, Tulip Festival | Three rows seeded; queries for current Sat return empty (date out of range) |

## Root cause

`backend/tests/Saturdaze.Api.Tests/SeedData/*.json` (the source files behind
the CLI `seed` command in this workaround) were authored independently of
the mocks. There is no canonical seed that aligns with the visual reference.

## Impact

Visual baselines captured from `docs/mocks` will never match the Angular
app once it pulls live data from the API. End-to-end "data is persisting"
checks against the mock content will fail.

## Fix

Choose one of:

1. **Frontend stays mock-shaped, backend seed is rewritten** to mirror
   `docs/mocks`. Replace `activities.json`, `restaurants.json`,
   `local-events.json`, and `family.json` so the visible content matches
   the mocks (Quinn/Sara/Eli/Mae for the family; Terre Bleu / Bronte Creek
   / Rec Room for activities; La Marina / Symposium / Sicilian / Jack
   Astor's for restaurants; Lavender / Cirque / Tulip Festival for events).
   Update event `StartsOn`/`EndsOn` to a moving target (this Sat/Sun) so
   `GET /api/events?weekendOf=...` returns rows by default.
2. **Backend seed stays as-is, mocks are refreshed.** Re-capture every mock
   under `docs/mocks/` from the real content. Re-record visual baselines.

Option 1 is the cheaper fix and matches the spirit of the mocks being the
design spec. Option 2 retires the lavender narrative — only do it if there
is product-side intent to drop those examples.

## Status

- Logged: 2026-05-16
- **Fixed: 2026-05-16 (Option 1).** Backend seed now mirrors `docs/mocks`:
  - `family.json`: Quinn / Sara / Eli / Mae (Port Credit) — already aligned in
    a prior commit (verified).
  - `restaurants.json`: La Marina, Symposium Café, The Sicilian Sidewalk
    Café, Jack Astor's, Snug Harbour, Spice Lounge, Cora's Port Credit,
    Brogue Inn — already aligned (verified).
  - `activities.json`: Terre Bleu, Bronte Creek, Royal Botanical Gardens,
    The Rec Room, Ontario Science Centre, Toronto Zoo, Riverwood, Living
    Arts Centre kids' theatre — already aligned (verified).
  - `local-events.json`: now wrapped in an envelope
    `{ "anchorSaturday", "events": [...] }`. `LocalEventSeeder` injects
    `IDateTimeProvider`, resolves the upcoming Saturday from the clock,
    and shifts every event date by
    `(currentUpcomingSaturday - anchorSaturday)` days so
    `GET /api/events?weekendOf=...` returns rows for the current weekend
    regardless of when `seed` is run. Saturday events (Lavender / Cirque /
    Tulip) land on `weekendOf`; Sunday events (Symphony / Farmer's Market)
    on `weekendOf + 1`; later events (Strawberry +1 week, Pumpkin +119
    days) stay at their relative offset.
- Verified by: `dotnet test tests/Saturdaze.Cli.Tests` (52/52 pass) and
  `dotnet test tests/Saturdaze.Api.Tests` (25/25 pass). New
  `LocalEventSeederTests` cover envelope shifting and the legacy flat-array
  fallback.
