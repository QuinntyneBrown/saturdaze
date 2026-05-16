# Bug 003 — Every frontend service returns hard-coded static data; no HTTP integration

## Symptom

The Angular app renders identical mock content on every page reload regardless
of the database. The Plan-This-Weekend CTA does nothing, the Lock-day button
does nothing, and the Family Profile screen will not surface any edits made
through the CLI or the API.

## Root cause

Every service in `frontend/projects/api/src/lib/services/` is a thin wrapper
around a hand-written constant:

- `WeekendPlanService.getDemoOverview()` returns `signal(DEMO_OVERVIEW)`.
- `WeekendPlanService.getDemoItinerary()` returns `signal(DEMO_ITINERARY)`.
- `ActivityService.list()`, `RestaurantService.list()`, `SavedService.list()`,
  `EventsService.list()`, `FamilyService.getProfile()` — all return a
  module-level constant.

There is no `HttpClient`, no `httpResource`, no `provideHttpClient()` in
`app.config.ts`, and no `environment.ts` with an API base URL.

## Impact

The acceptance criteria for /goal cannot be met:
- "frontend ... integrated with backend making http requests to get its data" — false.
- "data is persisting to the database and coming from the database" — false.
- The user-guide steps that imply persistence (set up family, add commitment,
  pick a restaurant, save weekend, add errand) have no working code path.

This is the **biggest gap** between the current code and the goal.

## Fix (Phase 12 of frontend-implementation-plan.md, brought forward)

1. Add `provideHttpClient(withFetch())` to `projects/saturdaze/src/app/app.config.ts`.
2. Add `projects/saturdaze/src/environments/environment.ts` with `apiBaseUrl: 'http://localhost:5100'`.
3. In `projects/api/src/lib/api/`, add a thin `ApiClient` that wraps `fetch`
   (or `HttpClient`) with the base URL.
4. Rewrite each service body to call the corresponding backend endpoint
   (see backend-plan §7 for the route table):
   - `FamilyService.getProfile` → `GET /api/family`
   - `FamilyService.save(profile)` → `PUT /api/family`
   - `ActivityService.list` → `GET /api/activities`
   - `RestaurantService.list` → `GET /api/restaurants`
   - `EventsService.list` → `GET /api/events`
   - `WeekendPlanService.getDemoOverview` (rename to `current()`) → `GET /api/weekends/current`
   - `WeekendPlanService.getDemoItinerary` (rename to `byId(id)`) → `GET /api/weekends/{id}`
   - `WeekendPlanService.plan(weekendOf)` → `POST /api/weekends/plan`
   - `WeekendPlanService.regenerate(id)` → `POST /api/weekends/{id}/regenerate`
   - `WeekendPlanService.markFavourite(id, fav)` → `PUT /api/weekends/{id}/favourite`
   - `WeekendPlanService.swapBlock(blockId)` → `POST /api/blocks/{id}/swap`
   - `WeekendPlanService.lockBlock(blockId, locked)` → `PUT /api/blocks/{id}/lock`
   - `WeekendPlanService.addErrand(...)` → `POST /api/weekends/{id}/errands`
   - `SavedService.list` → `GET /api/weekends/history`
5. Map the backend DTOs (defined in `Application/Contracts/`) to the
   view-model shapes the pages already consume. Either expand the DTOs to
   match, or add a thin projection inside the service.
6. Add per-service loading + error signals so pages can render an empty/
   loading/error state without throwing.

## Sub-bugs

- 003a — `ActivityService` returns no `filters` from the API; filter chips are
  baked into the frontend constant.
- 003b — `RestaurantService` data model includes `votes`, but the backend
  `RestaurantDto` has no `votes` field. The vote feature appears to be a
  frontend-only concept right now.
- 003c — `SavedService.list` shape (`SavedView` with filters + recent + avoid)
  does not match any backend query response. Need to either widen the API or
  split the page state.
- 003d — `EventsService.list` returns a `view` with section-grouped events;
  backend returns flat `LocalEventDto[]`. Section grouping must happen in
  the service mapper.

## Status

- Logged: 2026-05-16
- **Fixed: 2026-05-16.** Every frontend service now fetches real data
  from the backend. See sub-bug section below for the per-service status.

Sub-bugs:

- **003a — Closed.** `ActivityService` filter chips are now derived from
  the loaded catalog: each predicate-based filter is included only if at
  least one row matches, and "All" is always present. Filters are no
  longer baked into the frontend constant.
- **003b — Deferred (out of scope for this bug).** Votes remain
  presentation-only. The backend has no `Vote` domain (entity, endpoints,
  seed) and adding one is a feature, not a bug fix. The synthesised
  per-name pattern in `RestaurantService` is explicitly tagged with a
  comment pointing at this sub-bug so the next round can pick it up
  without re-discovering the gap.
- **003c — Closed via [bug 009](009-saved-service-still-static.md).**
  `SavedView` is now mapped from `WeekendSummaryDto[]` (with `Title` /
  `Rating` added to the entity + DTO).
- **003d — Closed.** EventsService groups flat events into Saturday /
  Sunday / Coming-soon sections.

Master-service status:

  - `FamilyService.getProfile()` → `GET /api/family` ✓
  - `ActivityService.list()` → `GET /api/activities` ✓ (filters now data-driven)
  - `RestaurantService.list()` → `GET /api/restaurants?slot=…` ×2 ✓
  - `EventsService.list()` → `GET /api/events?weekendOf=…` ×3 ✓
  - `SavedService.list()` → `GET /api/weekends/history` ✓ (bug 009)
  - `WeekendPlanService.getDemoOverview()` → `GET /api/weekends/current` ✓ (bug 010)
  - `WeekendPlanService.getDemoItinerary()` → projects same DTO via active day ✓ (bug 010)
  - `WeekendPlanService.plan|regenerate|markFavourite|lockBlock|swapBlock|addErrand` ✓ (bug 010)
