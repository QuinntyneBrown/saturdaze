# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Three sibling top-level directories make up the application; `e2e` is NOT inside `frontend`:

- `backend/` — .NET 10 Clean Architecture solution (`Saturdaze.sln`)
- `frontend/` — Angular 21 workspace with three projects: `saturdaze` (app), `api` (lib), `components` (lib)
- `e2e/` — Playwright suite (POMs in `pages/`, specs in `tests/`, fixtures in `fixtures/`)
- `docs/mocks/` — Static HTML/CSS reference app; serves as the visual baseline source
- `docs/adr/` — Architecture decision records; read before changing the area they describe
- `scripts/Start-FreshStack.ps1` — One-command fresh stack (pack CLI → reset DB → build → run both processes)

## Common commands

```powershell
# Full local stack from a clean DB (pwsh)
powershell .\scripts\Start-FreshStack.ps1

# Backend
dotnet build  .\backend\Saturdaze.sln
dotnet test   .\backend\Saturdaze.sln
dotnet run --project .\backend\src\Saturdaze.Api --urls http://localhost:5100

# Run one backend test project / one test
dotnet test .\backend\tests\Saturdaze.Application.Tests
dotnet test .\backend\Saturdaze.sln --filter "FullyQualifiedName~PlannerTests.Plans_Saturday"

# CLI (admin — replaces the deleted MigrationRunner/Seeder consoles)
$env:SATURDAZE_CONNECTION = "Server=(localdb)\MSSQLLocalDB;Database=Saturdaze;Trusted_Connection=True;TrustServerCertificate=True"
dotnet run --project .\backend\src\Saturdaze.Cli -- migrate
dotnet run --project .\backend\src\Saturdaze.Cli -- seed
dotnet run --project .\backend\src\Saturdaze.Cli -- reset --yes

# Frontend (from frontend/)
npm start                                       # ng serve on :4200
npm run build -- saturdaze --configuration development
npm run build -- api
npm run build -- components
npm test                                        # Vitest via @angular/build:unit-test

# E2E (from e2e/, requires Angular dev server on :4200 OR baseline mode)
npm run test:behavior                           # functional specs only
npm run test:visual                             # pixel-diff against committed baselines
npm run baseline                                # SD_BASELINE=1 → captures from docs/mocks on :5173
npx playwright test tests/home.spec.ts          # single spec
npx playwright test -g "shows hero"             # by title
```

API runs on `http://localhost:5100` (Swagger at `/swagger`); the Angular environment compiles this URL in, so `Start-FreshStack.ps1` rejects any other `BackendPort`.

## Backend architecture (.NET 10 Clean Architecture)

`Directory.Build.props` enforces `TreatWarningsAsErrors`, `net10.0`, nullable on. SDK pinned by `backend/global.json` to `10.0.101`. Central package management lives in `Directory.Packages.props` — two transitive pins matter (see ADR-004): `System.Security.Cryptography.Xml 10.0.6` (CVE) and `Microsoft.Data.SqlClient 7.0.1` (LocalDB v17 compatibility).

Layer dependency direction (strict):

- `Saturdaze.Domain` — entities + enums, zero deps
- `Saturdaze.Application` — MediatR handlers, validators, planner, DTO contracts, `IAppDbContext`
- `Saturdaze.Infrastructure` — `AppDbContext`, EF migrations, SQL Server, Open-Meteo client, auth services, seeder
- `Saturdaze.Api` — controllers, `Program.cs`, DI composition, Swagger, middleware
- `Saturdaze.Cli` — packaged dotnet tool (`saturdaze migrate|seed|reset`); the old `Saturdaze.MigrationRunner` / `Saturdaze.Seeder` consoles are gone — use the CLI

Rules that aren't obvious from the code:

- Business rules live in handlers/domain services, not controllers.
- The API does **not** apply EF migrations on startup. Run `saturdaze migrate` explicitly.
- Seed data is idempotent and safe to re-run.
- `POST /api/weekends/plan` is idempotent: re-posting returns the existing weekend rather than throwing or re-planning (ADR-003). The explicit reseat is `POST /api/weekends/{id}/regenerate`.
- Auth is **local JWT only** (bcrypt + SQL) — no social/OAuth providers.

### Tests

Three categories, all in `backend/tests/`:

- `Saturdaze.Application.Tests` — pure unit, parallel
- `Saturdaze.Infrastructure.Tests` — hits a real SQL Server (LocalDB locally)
- `Saturdaze.Api.Tests` — `WebApplicationFactory<Program>` end-to-end, **sequential** (`xunit.runner.json` disables parallelism — ADR-002 — because of a static `Log.Logger` race in `Program.cs`)
- `Saturdaze.Cli.Tests` — exercises the dotnet tool

LocalDB on this machine is connected via named pipe, not the `(localdb)\Instance` shortcut, due to a SQL Server 2025 / SqlClient interop bug — `Support/LocalDbConnection.cs` resolves the pipe via `sqllocaldb info` (ADR-001). `Start-FreshStack.ps1` does the same.

## Frontend architecture (Angular 21)

Workspace has three projects under `frontend/projects/`:

| Project | Type | Selector prefix | Purpose |
| --- | --- | --- | --- |
| `saturdaze` | application | `app-` | Routed pages, dialogs, route guards, HTTP interceptor |
| `components` | library (ng-packagr) | `lib-` (Angular CLI prefix); component selectors use `sd-*` | Standalone UI components matched to the mock custom-element tags |
| `api` | library (ng-packagr) | `lib-` | DTOs, models, service contracts + concrete services |

### Conventions enforced across the codebase

- **Selectors stay `sd-foo`**, but TypeScript class names, folders, and files **drop the `Sd` prefix** — e.g. `frontend/projects/components/src/lib/chip/chip.ts` exports `class Chip` with `selector: 'sd-chip'`. Renaming a selector breaks the visual-diff harness because baselines were captured against `sd-*` tag names in `docs/mocks/`.
- **Interface-driven services**: every `api` service pairs a `*.service.contract.ts` (interface + `InjectionToken`) with the concrete class. Pages inject the token (e.g. `AUTH_SERVICE`), never the class. Add a contract when you add a service.
- **No inline forms in pages**. Button-triggered editing always opens a CDK Dialog (`frontend/projects/saturdaze/src/app/dialogs/`) or navigates to a screen.
- **All modals use `@angular/cdk` Dialog/Overlay** — never hand-roll a modal.
- **Auth token persists across refresh**; the session store + interceptor in `app/auth/` own this.

### Bottom-nav iOS chrome handling (DON'T simplify without reading ADR-005)

`sd-bottom-nav` clears the iOS Safari URL bar via a CSS variable `--sd-chrome-bottom` written by a `VisualViewport` listener registered in `frontend/projects/saturdaze/src/main.ts` *before* `bootstrapApplication`. The `bottom: calc(12px + max(env(safe-area-inset-bottom, 0px), var(--sd-chrome-bottom, 0px)))` rule is load-bearing. Four pure-CSS attempts failed before this; details in `docs/adr/ADR-005`. The regression test `e2e/tests/regression/bottom-nav-clearance.spec.ts` parses the SCSS and `main.ts` to guard the invariant — if you touch nav layout, run it.

## E2E architecture (Playwright)

- POMs under `e2e/pages/`, specs under `e2e/tests/`. Visual specs in `tests/visual/` compare the Angular implementation pixel-by-pixel to the mocks.
- Three viewport projects: mobile (390×844), tablet (820×1180), desktop (1440×900). Tests are **not** parallel (`fullyParallel: false`, `workers: 1`).
- The same `playwright.config.ts` starts the Angular dev server on `:4200` for normal runs OR `http-server` against `docs/mocks/` on `:5173` when `SD_BASELINE=1`. The `baseline-capture` and verify projects share project names so they read/write the same snapshot files.
- Baselines live next to each spec under `*.spec.ts-snapshots/<name>-<project>.png`. Re-capture only when an intentional design change has landed: `npm run baseline`.
- Visual tolerance: `maxDiffPixelRatio: 0.005`, `threshold: 0.05`, animations disabled.

## Deployment

GitHub Actions (`.github/workflows/deploy.yml`): publish API to Azure App Service, run `saturdaze migrate`, build Angular and deploy to Azure Static Web Apps. Azure resources live in resource group `saturdaze-rg` (canadacentral). Secrets are managed locally in `.deploy/azure.env` and as GitHub Actions secrets.
