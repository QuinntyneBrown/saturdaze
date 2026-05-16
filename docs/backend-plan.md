# Saturdaze — Backend Implementation Plan

Backend for the Saturdaze family weekend planner. Built to the constraints in `backend-tech.md`: .NET + Clean Architecture, MediatR (free version), EF Core on SQL Server Express, `IAppDbContext` injected (no repositories / UoW), Controllers over Endpoints, one C# type per file, `.sln`, radically simple — no over-engineering.

**Speed of implementation is not a goal.** This plan prioritizes correctness, test coverage, and getting things right the first time over shipping fast. That does *not* mean adding layers — "radically simple" still rules. It means: no stubs we plan to "swap later", no dev-only shortcuts that hide in production code, proper tests at every seam, and a deliberate migration/seed story.

## 1. Solution layout

```
backend/
  Saturdaze.sln
  src/
    Saturdaze.Domain/          # entities, enums, value objects — no deps
    Saturdaze.Application/     # MediatR handlers, IAppDbContext, DTOs
    Saturdaze.Infrastructure/  # AppDbContext, EF config, external clients
    Saturdaze.Api/             # Controllers, Program.cs, DI wiring
  tests/
    Saturdaze.Application.Tests/
```

Dependency flow: `Api → Application → Domain` and `Infrastructure → Application → Domain`. Api references Infrastructure only for composition root.

## 2. Domain model (one type per file)

Just enough to express the features — no premature abstractions.

| Entity | Purpose |
| --- | --- |
| `Family` | One per household. `Id`, `HomeLocation`, `BudgetEnabled`. |
| `FamilyMember` | `Id`, `FamilyId`, `Name`, `Age`. |
| `Commitment` | Fixed recurring slot (Sat swim, Sun church, husband's workout). `Id`, `FamilyId`, `Title`, `DayOfWeek`, `StartTime`, `EndTime`. |
| `Preference` | Like/dislike tag (`PreferenceKind`, `Value`). |
| `Activity` | Curated outing. `Id`, `Name`, `Category`, `Indoor`, `MinAge`, `MaxAge`, `DriveMinutes`, `WeatherTags`, `Description`, `MapUrl`. |
| `Restaurant` | `Id`, `Name`, `Style`, `Slot` (Lunch/Dinner), `WifeApproved`, `Notes`. |
| `LocalEvent` | `Id`, `Name`, `StartsOn`, `EndsOn`, `Location`, `DriveMinutes`, `Url`, `Category`. |
| `Weekend` | One per planned Sat+Sun. `Id`, `FamilyId`, `WeekendOf` (Sat date), `IsFavourite`, `Notes`. |
| `ItineraryBlock` | Single block in a day timeline. `Id`, `WeekendId`, `Day` (Sat/Sun), `StartTime`, `EndTime`, `Kind` (Workout/Activity/Meal/Drive/Downtime/Commitment), `Title`, `RefId`, `IsLocked`, `Reason`. |
| `ShoppingErrand` | `Id`, `WeekendId`, `Description`, `EstimatedMinutes`, `Done`. |

Enums: `PreferenceKind`, `BlockKind`, `MealSlot`, `DayOfWeekend` (Saturday/Sunday).

## 3. Persistence

- `IAppDbContext` in `Application` exposes `DbSet<T>` for every entity above plus `SaveChangesAsync(CancellationToken)`.
- `AppDbContext : DbContext, IAppDbContext` in `Infrastructure`.
- Entity config via `IEntityTypeConfiguration<T>` — one file per entity.
- SQL Server Express via `Server=.\SQLEXPRESS;Database=Saturdaze;Trusted_Connection=True;TrustServerCertificate=True`.
- EF Core migrations checked in under `Infrastructure/Migrations`.
- Seed data on startup (idempotent): the Brown family, default commitments, curated Activities (parks, Rec Room, Toronto Zoo, Stratford theatre, Niagara Escarpment hikes, Terre Bleu lavender, etc.), wife-approved Restaurants.

## 4. Application layer (MediatR)

One handler per file. `IRequest<TResponse>` for queries, `IRequest` for fire-and-forget commands (none planned — everything returns something useful).

**Commands**
- `SaveFamilyProfileCommand` — upsert family, members, commitments, preferences.
- `GenerateWeekendCommand(DateOnly weekendOf)` — runs the planner, persists `Weekend` + `ItineraryBlock`s.
- `SwapBlockCommand(Guid blockId)` — replaces one block with the next-best alternative, respects `IsLocked` on neighbours.
- `LockBlockCommand(Guid blockId, bool locked)`.
- `RegenerateWeekendCommand(Guid weekendId)` — re-plans, keeping locked blocks.
- `AddShoppingErrandCommand(Guid weekendId, string description, int estMinutes)`.
- `MarkFavouriteCommand(Guid weekendId, bool fav)`.

**Queries**
- `GetFamilyProfileQuery` → DTO.
- `GetCurrentWeekendQuery` → upcoming Sat date's `Weekend` + blocks + weather.
- `GetWeekendByIdQuery(Guid id)`.
- `GetWeekendHistoryQuery(int take = 20)`.
- `GetActivitySuggestionsQuery(filters)` — indoor/outdoor, drive ≤ N min, age range, weather, "try something new".
- `GetRestaurantPicksQuery(DateOnly day, MealSlot slot, Guid? nearActivityId)`.
- `GetLocalEventsQuery(DateOnly weekendOf, int maxDriveMin)`.

DTOs live in `Application/Contracts/`. No AutoMapper — hand-mapped, one projection per query.

## 5. The Planner (the only non-trivial piece)

`WeekendPlanner` is a plain service in `Application` (interface + impl, injected). Input: family profile, weekend date, weather forecast, candidate activities/restaurants/events, last weekend's blocks, optional `ShoppingErrand`. Output: ordered `ItineraryBlock` list for Sat + Sun.

### Algorithm

Rule-based, deterministic given the same inputs and seed. Seed is `weekendOf` so re-runs of the same weekend are stable; regenerate uses a new seed derived from `weekendOf + regenerateCount`.

1. **Frame the day.** Hard bounds: 09:00 out-the-door (earliest activity start), 21:00 bedtime for kids. Sunday-evening wind-down 19:30 onward — no new outings.
2. **Place `Commitment`s** as immovable `Commitment`-kind blocks (Sat swim, Sun church, husband's workout). Reject the weekend with a clear error if commitments overlap.
3. **Window decomposition.** What remains in each day is a list of `(start, end)` gaps. Each gap gets typed: morning / midday / afternoon / evening, based on midpoint.
4. **Activity selection.** For each gap ≥ 90 minutes, score every `Activity`:
   - Weather fit: `WeatherTags` vs forecast for that day (rain → indoor +3, sun + warm → outdoor +2).
   - Drive fit: penalise round-trip drive > gap × 0.4 (don't spend the whole window driving).
   - Age fit: every member's age in `[MinAge, MaxAge]` → +2; one outside → +0; two outside → disqualify.
   - Recency: appeared in last 1 weekend → −4; last 2–4 weekends → −1; else 0.
   - "Try something new" toggle: never-used activities → +3.
   - Preference match: liked tag → +1 per match; disliked tag → disqualify.
   - Highest non-disqualified wins; ties broken by seed.
5. **Drive-time blocks** inserted before and after each chosen activity using `Activity.DriveMinutes` (one-way).
6. **Meals.** Each day gets Lunch (12:00–13:30 window) and Dinner (17:30–19:00 window) from `WifeApproved` `Restaurant`s. Prefer ones tagged near the chosen activity; otherwise nearest to home. If the activity occupies the meal window, the meal moves to the closest free 60-min slot.
7. **Downtime** fills any remaining gap ≥ 30 min. Gaps < 30 min are absorbed into adjacent blocks as buffer.
8. **`ShoppingErrand`** placement: smallest gap that fits `EstimatedMinutes + 20 min buffer`; prefer Saturday morning unless that's already loaded.
9. **`Reason`** is written for every block (e.g. "indoor pick — rain in afternoon forecast", "fits 75-min gap before swim", "first time trying this — variety on").

### Regenerate vs Swap

- **Regenerate**: re-runs the whole algorithm but treats every `IsLocked = true` block as a `Commitment` for the purposes of step 2.
- **Swap one block**: holds the surrounding blocks fixed, runs steps 4–6 against that single window only, returns the next-highest-scored alternative (tracking which alternatives have already been rejected this session via a transient `RejectedActivityIds` set on the swap command).

### Determinism & testability

The planner takes `DateTime utcNow` and an `IRandomSource` (seeded `Random` wrapper) via DI so tests are fully deterministic. No `DateTime.Now`, no `new Random()` inside the algorithm.

## 6. External integrations

- **Weather**: `IWeatherClient` → Open-Meteo (no API key). Implementation in `Infrastructure`, `HttpClient` via `IHttpClientFactory`, Polly retry policy on transient failures, typed response DTO. 7-day forecast cached in-memory (`IMemoryCache`) for 60 min keyed by `(lat, lon, date)`. If the call fails after retries, the planner falls back to a neutral forecast (no weather penalty/bonus) and the block `Reason` notes "weather unavailable".
- **Events**: `ILocalEventsSource` with a real implementation backed by a curated JSON file checked into `Infrastructure/SeedData/local-events.json`, loaded on startup into the `LocalEvent` table. Maintained by hand for v1 — there's no point pretending we have an API integration we don't. Schema is identical to the `LocalEvent` entity, so the eventual swap to a scraped/API source is a constructor change, not an architecture change.
- **Maps**: no server call — `Activity.MapUrl` is a precomputed Google Maps deep link stored on the entity.

## 7. Api layer (Controllers, not Minimal APIs)

| Controller | Routes |
| --- | --- |
| `FamilyController` | `GET /api/family`, `PUT /api/family` |
| `WeekendsController` | `POST /api/weekends/plan`, `GET /api/weekends/current`, `GET /api/weekends/{id}`, `GET /api/weekends/history`, `POST /api/weekends/{id}/regenerate`, `PUT /api/weekends/{id}/favourite` |
| `BlocksController` | `POST /api/blocks/{id}/swap`, `PUT /api/blocks/{id}/lock` |
| `ActivitiesController` | `GET /api/activities` |
| `RestaurantsController` | `GET /api/restaurants` |
| `EventsController` | `GET /api/events` |
| `WeatherController` | `GET /api/weather?weekendOf=...` |
| `ErrandsController` | `POST /api/weekends/{id}/errands`, `PUT /api/errands/{id}/done` |

Every action: inject `ISender`, send the request, return the result. No business logic in controllers.

Cross-cutting:
- `ProblemDetails` for errors via a single `ExceptionHandlingMiddleware` that maps domain exceptions (`NotFoundException`, `ValidationException`, `ConflictException`) to status codes. No try/catch in controllers or handlers.
- `[ApiController]` model validation **plus** a MediatR `ValidationBehavior` running FluentValidation validators on every command. One validator per command, one file each.
- A MediatR `LoggingBehavior` records each request name and duration at Information level; failures at Warning with the exception.
- CORS configured per environment via `appsettings`. No wildcard origin in production.
- Swashbuckle for OpenAPI in all environments — the frontend uses the spec to generate its client.
- Serilog with console + rolling file sinks; structured properties on every log entry.

Auth is out of scope for v1 (single-family app, local-network). A header-based family-id middleware is the seam to add later — its placeholder is a `CurrentFamilyAccessor` service that today returns the single seeded family's id, so handlers already depend on the accessor instead of hardcoding the id.

## 8. Configuration & startup

- `appsettings.json`, `appsettings.Development.json`, `appsettings.Production.json` — connection string, weather base URL, CORS origins, log levels. Secrets in production via environment variables, never the appsettings file.
- `Program.cs` wires: EF Core, MediatR (`AddMediatR` scanning `Application`), MediatR pipeline behaviors (Validation, Logging), FluentValidation validators, `HttpClient`s with Polly, `IMemoryCache`, controllers, Swagger, Serilog.
- `Infrastructure/DependencyInjection.cs` and `Application/DependencyInjection.cs` extension methods to keep `Program.cs` short.
- **Migrations are explicit**, never auto-applied at runtime. The `Saturdaze.Cli` `migrate` verb applies pending migrations against a target connection string. Same binary runs in dev and prod, invoked as a deploy step. (Replaces the original `Saturdaze.MigrationRunner` console — see bug 012 for the merge rationale.)
- **Seed is explicit too.** The `Saturdaze.Cli` `seed` verb (idempotent: keyed upserts on natural keys like activity name + location) loads the curated Activities, Restaurants, LocalEvents, and the Brown family profile from bundled JSON files. Run after migrations, also re-runnable safely when seed data changes.
- Neither verb touches the data path of the API. The API process does nothing at startup beyond DI wiring.

## 9. Testing

Three test projects, all xUnit + FluentAssertions. No `Moq` — hand-rolled fakes for the few interfaces we own (`IRandomSource`, `IWeatherClient`, `ILocalEventsSource`). Each test class is one file.

### `Saturdaze.Application.Tests` — pure unit tests for handlers and the planner
Runs in milliseconds, no I/O.
- Planner: every scoring rule has at least one happy-path and one boundary test (age fit at exact `MinAge`, drive time at the 0.4× threshold, recency at 1 / 2 / 5 weekends back, weather match for each tag).
- Planner: deterministic-seed test — same inputs produce identical output across runs.
- Planner: locked-block honoured by regenerate; swap respects `RejectedActivityIds`; conflicting commitments raise `ConflictException`.
- Planner: shopping-errand placement prefers Saturday morning unless loaded; falls back correctly.
- Planner: weather-unavailable fallback produces a plan and notes it in the `Reason`.
- Each handler: success path + each thrown domain exception. Validators tested directly (one test per rule).

### `Saturdaze.Infrastructure.Tests` — integration tests against real SQL Server
Runs against a real SQL Server instance (LocalDB on developer machines, the SQL Server Express container in CI). Each test class gets a unique database, applies migrations, runs, drops the database — no shared state.
- `AppDbContext`: every `IEntityTypeConfiguration<T>` is exercised via a round-trip save/load.
- Seeder: idempotency — running twice produces the same row counts and no duplicates.
- `WeatherClient`: tested against a recorded HTTP response via `HttpMessageHandler` fake (the contract test, not a live network call); separately, one opt-in `[Trait("Category", "Live")]` test hits Open-Meteo to catch contract drift.

### `Saturdaze.Api.Tests` — end-to-end through `WebApplicationFactory`
Boots the full API in-process pointing at a per-test SQL Server database, hits real HTTP endpoints.
- Every controller action has at least one test for the success case and one for each error path it documents.
- The full "plan a weekend" flow: seed → POST plan → GET current → swap a block → lock a block → regenerate → assert locked block survived.
- Validation: invalid commands return `400` with a `ProblemDetails` body listing the failed rules.

CI runs all three projects. No category is "deferred to later" — controllers are pass-through but they still get tested because pass-through code still breaks at the wiring.

## 10. Build order

Incremental but with no "we'll add tests later" — each step lands with its full test coverage in the same commit. Each step is reviewed and merged before the next begins. Speed is not the goal; doing each step well is.

1. **Foundations.** Solution + projects + Domain entities + `IAppDbContext` + `AppDbContext` + entity configurations + first migration + `Saturdaze.Cli` (`migrate` + `seed` verbs) + the curated seed JSON files. Infrastructure round-trip tests for every entity.
2. **Cross-cutting plumbing.** MediatR + Validation + Logging behaviors, `ExceptionHandlingMiddleware`, `ProblemDetails`, Serilog, Swagger, CORS, `CurrentFamilyAccessor`. One placeholder controller + one placeholder command exercise the whole pipeline end-to-end in an Api test.
3. **Family profile.** `GetFamilyProfileQuery`, `SaveFamilyProfileCommand` + validator, `FamilyController`. Full handler + validator + API tests.
4. **Catalog endpoints.** `GetActivitySuggestionsQuery` with all filters, `GetRestaurantPicksQuery`, `GetLocalEventsQuery` + controllers + tests.
5. **Weather.** `IWeatherClient`, `WeatherClient` with Polly + memory cache, `WeatherController`, contract test + one opt-in live test.
6. **Planner — full algorithm.** Build steps 1–9 of section 5 in one piece, with the full scoring rubric. Every rule shipped with its tests. No "v1 then polish" — write it right the first time.
7. **Generate / read weekend.** `GenerateWeekendCommand` + `GetCurrentWeekendQuery` + `GetWeekendByIdQuery` + `WeekendsController`. Persists the plan, returns it. Full API tests.
8. **Swap / lock / regenerate.** `SwapBlockCommand`, `LockBlockCommand`, `RegenerateWeekendCommand`, `BlocksController`. End-to-end test of the full interaction loop.
9. **History + favourites.** `GetWeekendHistoryQuery`, `MarkFavouriteCommand`. Recency dedup wired into the planner now has real data to dedup against.
10. **Shopping errand slot.** `AddShoppingErrandCommand`, `ErrandsController`, planner placement step exercised against real persisted weekends.
11. **Final pass.** Re-read the plan against the codebase, log any drift, add any tests the implementation revealed were missing. ADR for any decision that surprised us.

## 11. Explicitly out of scope (deferred for scope, not for speed)

- Auth / multi-tenant — single-family LAN app for v1.
- Push notifications, share-with-wife flow, kid view, packing checklist — these are frontend or notification-channel features that don't need backend work until they ship.
- Live events-feed scraper / API — the curated JSON source is the v1 implementation, not a stub. A scraper is a feature, not a shortcut.
- Caching beyond the weather forecast cache — no read path is hot enough to need it.
- Background jobs — the Friday "weekend is ready" notification will be added as a `HostedService` when notifications are designed; building it before the notification channel exists would be speculative.
