# Saturdaze Backend

.NET 10 Clean Architecture backend for the Saturdaze family weekend planner. See `docs/backend-plan.md` for the design and `docs/adr/` for decisions that deviated from the plan.

## Layout

```
backend/
  Saturdaze.sln
  Directory.Build.props          # shared compile settings (net10.0, nullable, warnings-as-errors)
  Directory.Packages.props       # central package management
  global.json                    # pins SDK to 10.0.x
  src/
    Saturdaze.Domain/            # entities, enums  (no dependencies)
    Saturdaze.Application/       # MediatR handlers, IAppDbContext, planner, DTOs
    Saturdaze.Infrastructure/    # AppDbContext, EF migrations, Open-Meteo client, seeder
    Saturdaze.Api/               # Controllers, Program.cs, DI composition
    Saturdaze.MigrationRunner/   # console: applies EF migrations
    Saturdaze.Seeder/            # console: idempotent catalog + family seed
  tests/
    Saturdaze.Application.Tests/   # pure unit tests (planner, handlers, validators)
    Saturdaze.Infrastructure.Tests/# real SQL Server: persistence + weather contract
    Saturdaze.Api.Tests/           # WebApplicationFactory end-to-end
```

## Local quickstart

```powershell
# 1. Restore + build
dotnet build backend/Saturdaze.sln

# 2. Apply migrations (set connection string via env var or appsettings)
$env:SATURDAZE_CONNECTION = "Server=(localdb)\MSSQLLocalDB;Database=Saturdaze;Trusted_Connection=True;TrustServerCertificate=True"
dotnet run --project backend/src/Saturdaze.MigrationRunner

# 3. Seed catalog and the Brown family profile (idempotent)
dotnet run --project backend/src/Saturdaze.Seeder

# 4. Run the API
dotnet run --project backend/src/Saturdaze.Api
```

Swagger UI is served at `/swagger` in every environment (the Angular frontend uses the spec to generate its client).

## Test the whole stack

```powershell
dotnet test backend/Saturdaze.sln
```

Three test projects, three layers, ~95 tests total. Integration and API tests need LocalDB running locally; see ADR-001 for the named-pipe workaround that resolves a SQL Server 2025 LocalDB interop quirk.

## API surface

| Method | Route | Purpose |
| --- | --- | --- |
| GET / PUT | `/api/family` | Read / upsert the household profile |
| GET | `/api/activities` | Filtered activity suggestions |
| GET | `/api/restaurants` | Wife-approved meal picks |
| GET | `/api/events` | Local events overlapping the weekend |
| GET | `/api/weather` | Open-Meteo forecast for the weekend, with neutral fallback |
| POST | `/api/weekends/plan` | Plan a Saturday (idempotent — see ADR-003) |
| GET | `/api/weekends/current` | Upcoming Sat's weekend |
| GET | `/api/weekends/{id}` | Read a specific weekend |
| GET | `/api/weekends/history` | Recent planned weekends |
| POST | `/api/weekends/{id}/regenerate` | Re-plan, preserving locked blocks |
| PUT | `/api/weekends/{id}/favourite` | Toggle favourite flag |
| POST | `/api/blocks/{id}/swap` | Replace one activity with the next-best alternative |
| PUT | `/api/blocks/{id}/lock` | Lock / unlock a block |
| POST | `/api/weekends/{id}/errands` | Add a shopping errand |
| PUT | `/api/errands/{id}/done` | Mark an errand done |
| POST | `/api/_ping` | Pipeline smoke endpoint (used by tests) |
```
