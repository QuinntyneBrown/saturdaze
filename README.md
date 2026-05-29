# Saturdaze

Saturdaze is a full-stack family weekend planner. It turns household
preferences, recurring commitments, kid-friendly activities, restaurant picks,
local events, errands, and weather into a weekend plan that is ready to use.

[Overview](#overview) · [Features](#features) · [Quick-start](#quick-start) ·
[Architecture](#architecture) · [Development](#development) ·
[Testing](#testing) · [Documentation](#documentation) ·
[Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) ·
[Support](SUPPORT.md) · [Code of Conduct](CODE_OF_CONDUCT.md) ·
[License](LICENSE)

---

## Overview

Saturdaze is built around a realistic family weekend workflow:

- keep the family profile and recurring commitments current;
- plan Saturday and Sunday around weather, fixed obligations, and kid ages;
- discover nearby activities, local events, and family-friendly restaurants;
- manage errands and saved weekends without losing the plan context.

The project is intentionally full-stack. The backend owns planning, persistence,
authentication, seeding, and API contracts. The Angular frontend owns the user
experience and consumes the backend through the shared `api` library. The
Playwright suite checks both behavior and visual alignment with the mock design
reference.

## Features

- Weekend itinerary generation with locked blocks, regeneration, favourites,
  errands, restaurant picks, and saved weekend history.
- Family profile management for household members, recurring commitments,
  budget preferences, likes, and dislikes.
- Authentication flows for sign-up, login, verification, password reset, and
  sign-out.
- Weather-aware planning through the Open-Meteo integration, with test fakes
  and neutral fallback behavior.
- AI-driven catalog ingestion: fresh local events, activities, and restaurants
  are discovered by a grounded Claude web search and upserted into the catalogs,
  with every pass recorded in an `IngestionRun` audit row. Triggered on-demand
  via `saturdaze ingest` or on a cron schedule by the `Saturdaze.Worker` service.
  See the [Schedule Ingestion design](docs/detailed-designs/01-schedule-ingestion/README.md).
- Static mock application under `docs/mocks/` used as the visual reference for
  Angular implementation and visual regression tests.
- Local CLI for database migration, seeding, reset, and catalog ingestion.
- One-command fresh stack script for local verification.

## Quick Start

The fastest way to run the current application from a clean database is the
fresh-stack script:

```powershell
powershell .\scripts\Start-FreshStack.ps1
```

The script:

1. packs and installs the local `Saturdaze.Cli` .NET tool;
2. resets and seeds the database through that freshly installed tool;
3. publishes the backend API;
4. builds the Angular frontend;
5. starts both processes and prints the frontend URL.

By default the API runs on `http://localhost:5100`. The frontend prefers
`http://127.0.0.1:4200/`, and automatically moves to the next available port
when that port is already in use.

### Prerequisites

- .NET SDK `10.0.101` or a compatible feature-band SDK, as pinned by
  `backend/global.json`
- SQL Server LocalDB or SQL Server Express
- Node.js and npm; the frontend workspace declares `npm@10.9.4`
- PowerShell for the fresh-stack script

## Manual Setup

Install dependencies:

```powershell
cd frontend
npm ci

cd ..\e2e
npm ci

cd ..\backend
dotnet restore .\Saturdaze.sln
```

Prepare the database:

```powershell
cd backend
$env:SATURDAZE_CONNECTION = "Server=(localdb)\MSSQLLocalDB;Database=Saturdaze;Trusted_Connection=True;TrustServerCertificate=True"

dotnet run --project .\src\Saturdaze.Cli -- migrate
dotnet run --project .\src\Saturdaze.Cli -- seed
```

Run the API:

```powershell
cd backend
dotnet run --project .\src\Saturdaze.Api --urls http://localhost:5100
```

Swagger is available at `http://localhost:5100/swagger`.

Run the Angular app:

```powershell
cd frontend
npm start
```

Run the mock reference app:

```powershell
cd e2e
npx http-server ..\docs\mocks -p 5173 -c-1
```

Then open `http://localhost:5173/`.

## Architecture

| Area | Path | Notes |
| --- | --- | --- |
| Backend API | `backend/src/Saturdaze.Api` | ASP.NET Core controllers, middleware, auth wiring, Swagger |
| Application layer | `backend/src/Saturdaze.Application` | MediatR handlers, validators, planning logic, DTO contracts |
| Domain layer | `backend/src/Saturdaze.Domain` | Entities and enums with no infrastructure dependency |
| Infrastructure | `backend/src/Saturdaze.Infrastructure` | EF Core, SQL Server persistence, migrations, weather client, Claude web-search ingestion client, auth services |
| CLI | `backend/src/Saturdaze.Cli` | Database migration, seed, reset, and `ingest` commands |
| Worker | `backend/src/Saturdaze.Worker` | Cron-scheduled .NET Worker Service that runs catalog ingestion |
| Angular app | `frontend/projects/saturdaze` | Routed user-facing application |
| API library | `frontend/projects/api` | Client-side models and services for backend integration |
| Component library | `frontend/projects/components` | Standalone Angular UI components aligned with the mock system |
| E2E suite | `e2e` | Playwright behavior and visual tests |
| Design reference | `docs/mocks` | Static mock app and screenshots used as implementation reference |

## Development

Common commands from the repository root:

```powershell
# Backend
dotnet build .\backend\Saturdaze.sln
dotnet test .\backend\Saturdaze.sln

# Frontend
cd frontend
npm run build -- saturdaze --configuration development
npm run build -- components
npm run build -- api
npm test

# E2E
cd ..\e2e
npm test
```

Development conventions:

- Keep backend business rules in application handlers and domain services, not
  controllers.
- Keep EF migrations explicit; the API does not apply migrations on startup.
- Keep seed data idempotent and suitable for repeatable local resets.
- Keep Angular selectors aligned with the mock custom-element tag names.
- Prefer the fresh-stack script for end-to-end verification when a change spans
  the database, backend, and frontend.

## Testing

| Suite | Command | Purpose |
| --- | --- | --- |
| Backend build | `dotnet build .\backend\Saturdaze.sln` | Compile API, application, infrastructure, CLI, and tests |
| Backend tests | `dotnet test .\backend\Saturdaze.sln` | Unit, integration, API, and CLI tests |
| Angular app build | `npm run build -- saturdaze --configuration development` | Build the runnable frontend |
| Angular libraries | `npm run build -- components` and `npm run build -- api` | Build shared frontend packages |
| Frontend unit tests | `npm test` from `frontend/` | Angular/Vitest tests |
| Playwright behavior | `npm run test:behavior` from `e2e/` | End-to-end behavior tests |
| Playwright visual | `npm run test:visual` from `e2e/` | Visual comparisons against baselines |
| Baseline update | `npm run baseline` from `e2e/` | Refresh visual snapshots from the mock app |

## Documentation

- [Backend guide](backend/README.md)
- [User guide](docs/user-guide/README.md)
- [Level 1 specification](docs/specs/L1.md)
- [Level 2 specification](docs/specs/L2.md)
- [Architecture decision records](docs/adr/)
- [Mock application](docs/mocks/index.html)
- [Button/link audit](docs/button-link-audit-2026-05-17.md)
- [Sign-out plan](docs/sign-out-plan.md)

## Deployment

The repository includes a GitHub Actions workflow at
`.github/workflows/deploy.yml`.

The workflow:

- publishes and deploys the ASP.NET Core API to Azure App Service;
- applies EF migrations through `Saturdaze.Cli`;
- builds the Angular app and deploys it to Azure Static Web Apps.

Deployment requires the relevant Azure publish profile, Static Web Apps token,
and database connection string secrets to be configured in GitHub Actions.

## Contributing

Contributions are welcome when they keep the app useful, testable, and aligned
with the existing architecture. See [CONTRIBUTING.md](CONTRIBUTING.md) for the
development workflow, coding guidelines, test expectations, and pull request
checklist.

## Security

Do not report suspected security vulnerabilities in public issues. See
[SECURITY.md](SECURITY.md) for supported versions, private reporting guidance,
and security-sensitive areas that require extra review.

## Support

Use GitHub Issues for reproducible bugs, feature requests, and documentation
problems. See [SUPPORT.md](SUPPORT.md) for the information to include in a good
report.

## Code of Conduct

Participation in this project is governed by
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## License

Saturdaze is licensed under the [MIT License](LICENSE).
