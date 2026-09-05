# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Three sibling top-level directories make up the application; `e2e` is NOT inside `frontend`:

- `backend/` — .NET 10 Clean Architecture solution (`Saturdaze.sln`)
- `frontend/` — Angular 21 workspace with three projects: `saturdaze` (app), `api` (lib), `components` (lib)
- `e2e/` — Playwright suite (POMs in `pages/`, specs in `tests/`, fixtures in `fixtures/`)
- `design-system/` — Standalone token/component catalog (own `npm test`, own SWA deploy workflow); no runtime dependency on the other folders
- `docs/mocks-v2/` — Static HTML/CSS design (the source of truth, ADR-009): `pages/*.html` + `styles/app.css`; `node docs/mocks-v2/.check.mjs` lints it, `node docs/mocks-v2/.verify.mjs --capture` screenshots it (port 5180). The e2e visual baselines are captured from here.
- `docs/adr/` — Architecture decision records; read before changing the area they describe
- `eng/Start-FreshStack.ps1` — One-command fresh stack (pack CLI → reset DB → build → run both processes)

## Common commands

```powershell
# Full local stack from a clean DB (pwsh)
powershell .\eng\Start-FreshStack.ps1

# API only, re-pointed at LocalDB's current pipe (LocalDB auto-stops when idle and
# returns with a new pipe name; an API started earlier then 500s on every SQL call)
powershell .\eng\Restart-Api.ps1

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

# E2E (from e2e/; behaviour specs need the API on :5100 with a seeded DB — run Start-FreshStack.ps1 — plus the Angular dev server on :4200; baseline mode needs neither)
npm run typecheck                               # tsc over POMs, fixtures and specs
npm run test:behavior                           # functional specs only
npm run test:visual                             # pixel-diff against committed baselines (ADR-010)
npm run baseline                                # SD_BASELINE=1 → captures from docs/mocks-v2 on :5173
npm run audit / npm run audit:mocks             # 5-viewport overflow audit (app / mocks)
npx playwright test tests/visual/shell.visual.spec.ts   # the shell gate — run this first against the app
npx playwright test tests/weekend.spec.ts       # single spec
npx playwright test -g "locks a day"            # by title
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
- Auth is **local JWT only** (ASP.NET Identity `PasswordHasher` PBKDF2 + SQL) — no social/OAuth providers. Access tokens last 15 minutes; `POST /api/auth/refresh` rotates the 14-day refresh token and `POST /api/auth/logout` revokes it (ADR-007).
- **Every endpoint requires a bearer** via a global fallback policy; only the auth endpoints, `GET /api/weather`, `GET /api/weekends/shared/{token}` and `GET /api/weekends/{id}/calendar.ics` are `[AllowAnonymous]`. Swagger is registered above `UseAuthentication` for that reason — keep it there (ADR-008).
- `Program.cs` registers `UseSerilogRequestLogging` *before* `ExceptionHandlingMiddleware` so the completion event logs the status the client received; the other way round every handled 401/404/409 is logged as an ERR 500 with a stack trace.
- **Family scoping is per user**: `CurrentUserFamilyAccessor` (claim, then `Users.FamilyId`) and every weekend/block/errand handler filters by `FamilyId`; another family's id is a 404. API tests sign in through `tests/Saturdaze.Api.Tests/Support/SignedInClient.cs`.
- `saturdaze seed` (and the seed step inside `reset`) reads the JSON bundled next to the tool by default; `--seed-dir` or `SATURDAZE_SEED_DIR` override it. The old per-user copy under `%APPDATA%\saturdaze\seed` is only a fallback when no bundle ships — a stale copy there once pinned the dev DB to May-dated events.
- `saturdaze reset` refuses when `DOTNET_ENVIRONMENT`/`ASPNETCORE_ENVIRONMENT` is `Production` unless `--allow-production` is passed. Connection resolution order for the CLI is `--connection`, `SATURDAZE_CONNECTION`, then configuration (blank values are skipped).

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

- **Selectors stay `sd-foo`**, but TypeScript class names, folders, and files **drop the `Sd` prefix** — e.g. `frontend/projects/components/src/lib/chip/chip.ts` exports `class Chip` with `selector: 'sd-chip'`.
- **Components carry the mocks' BEM classes** (ADR-009): the host gets the block class and modifiers (`<sd-block class="block block--locked">`), inner elements get the element classes verbatim from `docs/mocks-v2/styles/app.css`, and state is ARIA (`aria-current`, `aria-pressed`, `aria-invalid`, `role=switch`). Interactive atoms use a `display: contents` host so the real `<button>`/`<a>`/`<input>` carries the class. The e2e page objects locate by these classes against both the mocks and the app — renaming one breaks the harness.
- **Per-component encapsulated SCSS**, each the matching `app.css` block with `:host` substitutions; global SCSS holds only reset, tokens and `sd-`-prefixed utilities. Prod budget: 6kB warn / 10kB error per component style.
- **Declare each `ng-content` slot once.** A component that renders `<a>` or `<button>` by condition puts its slots in one `<ng-template>` and renders it with `ngTemplateOutlet` in both branches (`sd-button`, `sd-ghost-row`, `sd-list-item`); slots repeated per `@if` branch project into one branch only. On the consumer side, a `@if` wrapping several `[slot=…]` nodes loses the slot (NG8011) — one `@if` per node.
- **Routes are named for the v2 screens** (`/weekend`, `/ideas`, `/ideas/food`, `/ideas/events`, `/past`, `/family`, `/review-submissions`, `/sign-in`, `/create-account`, `/reset-password`, `/verify-email`, `/legal`, `/sample-weekend?share=`); every v1 path redirects. Route `data.shell` (`app` | `site` | `bare`) picks the chrome and `data.page` lands on `body[data-page]`.
- **Dev-only surfaces**: the `/dialogs` gallery and the `?state=` page overrides (`weekend?state=empty|generating`, `past?state=empty`, `review-submissions?state=empty`, `sign-in?state=error`, `reset-password?state=…`, `verify-email?state=…`) exist only while `environment.galleryRoutes` is true; the prod environment file compiles them out.
- **Interface-driven services**: every `api` service pairs a `*.service.contract.ts` (interface + `InjectionToken`) with the concrete class. Pages inject the token (e.g. `AUTH_SERVICE`), never the class. Add a contract when you add a service.
- **No inline forms in pages**. Button-triggered editing always opens a CDK Dialog (`frontend/projects/saturdaze/src/app/dialogs/`) or navigates to a screen.
- **All modals use `@angular/cdk` Dialog/Overlay** — never hand-roll a modal.
- **Auth token persists across refresh**; the session store + interceptor in `app/auth/` own this, including the silent refresh (`SessionStore.refreshSession()` single-flight, one retry after a 401 in `auth.interceptor.ts`).

### Bottom-nav iOS chrome handling (DON'T simplify without reading ADR-005)

`sd-bottom-nav` clears the iOS Safari URL bar via a CSS variable `--sd-chrome-bottom` written by a `VisualViewport` listener registered in `frontend/projects/saturdaze/src/main.ts` *before* `bootstrapApplication`. The `bottom: calc(12px + max(env(safe-area-inset-bottom, 0px), var(--sd-chrome-bottom, 0px)))` rule is load-bearing. Four pure-CSS attempts failed before this; details in `docs/adr/ADR-005`. The regression test `e2e/tests/regression/bottom-nav-clearance.spec.ts` parses `bottom-nav.scss`, `main.ts`, `index.html`, the `.sd-frame {…}` block in `_global.scss` (the app's `<main>`, which must keep `env(safe-area-inset-bottom`) and `docs/mocks-v2/styles/app.css` to guard the invariant — if you touch nav layout, run it.

## E2E architecture (Playwright)

- POMs under `e2e/pages/` (one per v2 screen plus `base.page.ts` / `auth-card.page.ts`), behaviour specs under `e2e/tests/`, visual specs in `tests/visual/`, regression specs in `tests/regression/`, the 5-viewport audit in `audit/`. Locators are the mocks' BEM classes, `data-nav`, `aria-current`/`aria-pressed`, `#dialog-<slug>` and roles + accessible names — the same set works against the mocks and the app.
- Three viewport projects: mobile (390×844), tablet (820×1180), desktop (1440×900). Tests are **not** parallel (`fullyParallel: false`, `workers: 1`). E2E does not run in CI.
- The same `playwright.config.ts` starts the Angular dev server on `:4200` for normal runs OR `http-server` against `docs/mocks-v2/` on `:5173` when `SD_BASELINE=1`. The `baseline-capture` and verify projects share project names so they read/write the same snapshot files.
- Route keys live in `fixtures/routes.ts` (`app`, optional `mock`, `guard: 'auth' | 'admin'`, `page`); app states use `?state=`, mock states use `#state-*` or a `<page>.<state>.html` file; `sharedWeekend` is app-only (`goto` plans a weekend and mints the share link). `waitForReady(slug)` waits for `body[data-page]` plus a per-page anchor.
- Visual policy is ADR-010: full-page baselines only where copy is fixed or seed-derived (auth, landing, legal, dialogs gallery, empty states); element shots with `mask` for dated/weather regions (`.day__meta`, `.date-tile`, `.card__meta`, `.card__eyebrow`, `.submitter`, `.prose__updated`, `.page-header__subtitle`, …); no full-page shots of planner-driven screens. `tests/visual/shell.visual.spec.ts` (top bar, bottom nav) is the gate to run first. Baselines live next to each spec under `*.spec.ts-snapshots/<name>-<project>.png`; re-capture only when an intentional design change has landed in the mocks: `npm run baseline`.
- Behaviour specs sign in through the API: `fixtures/auth.ts` logs in as the seeded user (`SD_E2E_EMAIL`/`SD_E2E_PASSWORD`, default `quinntynebrown@gmail.com`/`password123`; admin `admin@saturdaze.app`) and seeds `sd.auth.token` before navigation; `goto(key)` does this automatically for guarded route keys, pass `{ anonymous: true }` to skip. `SD_API_URL` overrides the API origin.
- Visual tolerance: `maxDiffPixelRatio: 0.005`, `threshold: 0.05`, animations disabled — never loosened; parity failures are fixed in components.

## Deployment

GitHub Actions (`.github/workflows/deploy.yml`): backend tests (Windows runner, LocalDB) and frontend build+unit tests gate the pipeline, then publish API to Azure App Service, run `saturdaze migrate`, and deploy the Angular bundle to Azure Static Web Apps. `ci.yml` runs the same gates on pull requests; `deploy-design-system.yml` ships `design-system/` to its own SWA. Azure resources live in resource group `saturdaze-rg` (canadacentral). Secrets are managed locally in `.deploy/azure.env` and as GitHub Actions secrets.
