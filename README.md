<p align="center">
  <img src="docs/assets/saturdaze-mark.svg" alt="Saturdaze logo" width="96" height="96">
</p>

<h1 align="center">Saturdaze</h1>

<p align="center">
  <strong>Family weekends, planned.</strong><br>
  A full-stack weekend planner that turns household preferences, recurring
  commitments, local activities and events, errands, and weather into a weekend
  plan that is ready to use.
</p>

<p align="center">
  <a href="https://github.com/QuinntyneBrown/saturdaze/actions/workflows/ci.yml"><img src="https://github.com/QuinntyneBrown/saturdaze/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI"></a>
  <a href="https://github.com/QuinntyneBrown/saturdaze/actions/workflows/deploy.yml"><img src="https://github.com/QuinntyneBrown/saturdaze/actions/workflows/deploy.yml/badge.svg?branch=main" alt="Deploy"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/.NET-10.0-512BD4.svg" alt=".NET 10">
  <img src="https://img.shields.io/badge/Angular-21-DD0031.svg" alt="Angular 21">
  <img src="https://img.shields.io/badge/Playwright-e2e-2EAD33.svg" alt="Playwright">
</p>

<p align="center">
  <a href="#overview">Overview</a> ·
  <a href="#getting-started">Getting started</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="#development">Development</a> ·
  <a href="#testing">Testing</a> ·
  <a href="#documentation">Documentation</a> ·
  <a href="CONTRIBUTING.md">Contributing</a>
</p>

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
  sign-out, plus "Continue with Google", which creates the account on first use
  (ADR-019).
- Family member sign-in: the account that creates a family owns it, invites
  members by a shareable link so each signs in with their own password, adds
  members such as young children who never sign in, and removes members,
  which ends their access (ADR-016).
- Platform invitations from Saturdaze Admin: an administrator invites one or
  more email addresses, can describe a prospective family first and generate
  and shape a sample weekend for it, and the invitee opens one link that
  shows that weekend and creates their account, which then owns the family
  and its plan (ADR-019).
- Weather-aware planning through the Open-Meteo integration, with test fakes
  and neutral fallback behavior.
- AI-driven catalog ingestion: fresh local events, activities, and restaurants
  are discovered by a grounded Claude web search and upserted into the catalogs,
  with every pass recorded in an `IngestionRun` audit row. Triggered on-demand
  via `saturdaze ingest` or on a cron schedule by the `Saturdaze.Worker` service.
  See [Ingestion triggers](backend/deploy/webjobs/ingest/README.md) for scheduling options.
- Static HTML design under `docs/mocks/` — the source of truth for the
  Angular implementation and the visual regression baselines (ADR-009, ADR-010).
- Local CLI for database migration, seeding, reset, and catalog ingestion.
- One-command fresh stack script for local verification.

## Getting started

### Prerequisites

- .NET SDK `10.0.101` or a compatible feature-band SDK, as pinned by
  `backend/global.json`
- SQL Server LocalDB or SQL Server Express, to run the app locally (the
  tests need no database server, ADR-020)
- Node.js and npm; the frontend workspace declares `npm@10.9.4`
- PowerShell for the fresh-stack script

### Quick start

The fastest way to run the current application from a clean database is the
fresh-stack script:

```powershell
powershell .\eng\Start-FreshStack.ps1
```

The script:

1. packs and installs the local `Saturdaze.Cli` .NET tool;
2. resets and seeds the database through that freshly installed tool;
3. publishes the backend API;
4. builds the Angular frontend;
5. starts both processes and prints the frontend URL.

By default the API runs on `http://localhost:5100` (the Angular environment
compiles that URL in, so the script rejects any other `-BackendPort`). The
frontend prefers `http://127.0.0.1:4200/` and moves to the next free port when
4200 is busy; if you pass `-FrontendPort` explicitly and that port is taken,
the script stops instead of guessing.

### Manual setup

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

#### Sign in with Google (optional)

"Continue with Google" works locally out of the box: the **Saturdaze web**
OAuth client (Google Cloud project `saturdaze-512302`, type **Web application**,
authorised JavaScript origins `https://app.saturdaze.ca`, `http://localhost:4200`
and `http://localhost`; no redirect URI and no client secret, ADR-019) is a
public id, committed in two places:

- `frontend/projects/saturdaze/src/environments/environment.ts` →
  `googleClientId` (and `environment.prod.ts` for the deployed app);
- the API: `Saturdaze:Google:ClientId` in `appsettings.Development.json`
  (production reads it from the `GOOGLE_CLIENT_ID` GitHub Actions variable
  through `eng/infra/main.bicepparam`).

To use a client of your own, override both with the same id
(`$env:Saturdaze__Google__ClientId = "<id>"` for the API). With the API's id
empty, `POST /api/auth/google` answers `503 google_not_configured`; with the
app's id empty, the button is not rendered.

Run the design reference (static mocks):

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
| Marketing site | `marketing` | Static page at www.saturdaze.ca: plain HTML, CSS and JS with no build ([README](marketing/README.md), ADR-018) |
| Angular app | `frontend/projects/saturdaze` | Routed user-facing application at app.saturdaze.ca |
| Admin app | `frontend/projects/admin` | Saturdaze Admin: catalog photo management on its own host (`npm run start:admin`, ADR-014) |
| API library | `frontend/projects/api` | Client-side models and services for backend integration |
| Component library | `frontend/projects/components` | Standalone Angular UI components aligned with the mock system |
| Perf test | `frontend/projects/perf-test` | Component render-cost scenarios profiled from `e2e/perf-test` (ADR-014) |
| E2E suite | `e2e` | Playwright behavior and visual tests |
| Design reference | `docs/mocks` | Static HTML/CSS design, screenshots, and its own lint/verify scripts (`.check.mjs`, `.verify.mjs`) |
| Design system | `frontend/projects/components/stories` | Storybook docsite for the component library — concepts, theme tokens, component docs and patterns (`npm run storybook`; deployed by `deploy-storybook.yml`, ADR-012) |

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
npm run lint          # angular-eslint (npm run lint:fix to autofix)
npm run format        # Prettier (npm run format:check in CI)
npm run tokens        # regenerate _tokens.scss + tokens.ts from the TS theme (npm run tokens:check in CI, ADR-013)

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
- `npm ci` in `frontend/` installs a husky pre-commit hook that runs
  `eslint --fix` and `prettier --write` on staged frontend files; CI runs
  `npm run format:check` and `npm run lint`.
- Prefer the fresh-stack script for end-to-end verification when a change spans
  the database, backend, and frontend.

## Testing

| Suite | Command | Purpose |
| --- | --- | --- |
| Backend build | `dotnet build .\backend\Saturdaze.sln` | Compile API, application, infrastructure, CLI, and tests |
| Backend tests | `dotnet test .\backend\Saturdaze.sln` | Unit, integration, API, and CLI tests; no database server needed (ADR-020) |
| Backend tests, as CI | `pwsh .\eng\Test-Backend.ps1` | Builds once, runs the four test assemblies side by side |
| SQL Server tests (opt-in) | `$env:SATURDAZE_TEST_SQLSERVER = "localdb"`, then `dotnet test .\backend\Saturdaze.sln --filter Category=SqlServer` | Migration upgrade and `sp_getapplock` tests against a real server; skipped otherwise |
| API for Playwright | `pwsh .\eng\Start-E2eApi.ps1` | The API on :5100 over a fresh, seeded SQLite file; no LocalDB |
| Angular app build | `npm run build -- saturdaze --configuration development` | Build the runnable frontend |
| Angular libraries | `npm run build -- components` and `npm run build -- api` | Build shared frontend packages |
| Frontend unit tests | `npm test` from `frontend/` | Angular/Vitest tests |
| Storybook | `npm run storybook` / `npm run build-storybook` from `frontend/` | Design-system docsite on :6006 / static build to `frontend/dist/storybook` |
| Storybook contract and browser tests | Build Storybook, then `npm run test:storybook` from `e2e/` | Public component documentation coverage, every indexed example and docs page, and form interaction in Chromium |
| Frontend lint | `npm run lint` from `frontend/` | angular-eslint over TypeScript and templates |
| Frontend format | `npm run format:check` from `frontend/` | Prettier formatting check |
| Design tokens | `npm run tokens:check` from `frontend/` | Generated `_tokens.scss` / `tokens.ts` / `marketing/assets/tokens.css` match the TypeScript theme (ADR-013) |
| Marketing site | `npm run test:marketing` from `e2e/` | The static site under its production headers on :4500: sections, links, video, menu, metadata, CSP and parity with its mock (ADR-018) |
| Playwright behavior | `npm run test:behavior` from `e2e/` | End-to-end behavior tests |
| Playwright visual | `npm run test:visual` from `e2e/` | Visual comparisons against baselines |
| Baseline update | `npm run baseline` from `e2e/` | Refresh visual snapshots from the mock app |
| Perf test | `npx ng build perf-test` from `frontend/`, then `npm run perf-test` from `e2e/` | Component render cost under the CPU profiler, compared against the base branch on PRs ([guide](frontend/projects/perf-test/README.md), ADR-014) |

### Tests without a database server

The backend tests run on in-memory SQLite (ADR-020): each API test fixture and
each Infrastructure persistence fixture owns a private database, so
`dotnet test` works on a clean machine and CI runs on Linux with no LocalDB.
SQLite enforces the foreign keys, cascades and (filtered) unique indexes the
tests rely on; on SQLite only, `AppDbContext` stores `DateTimeOffset` sortably
and compares text case-insensitively, like SQL Server.

Three tests prove SQL Server-only behaviour (the migration upgrade and the
ingestion lock's `sp_getapplock`) and are skipped unless
`SATURDAZE_TEST_SQLSERVER` is set: to `localdb` for the LocalDB pipe, or to a
server connection string without a database (for example a SQL Server
container). A default test checks without a connection that the committed
migrations cover the model.

Playwright needs the API on :5100 with the seeded accounts. Start it on SQLite:

```powershell
pwsh .\eng\Start-E2eApi.ps1        # -Build to build the backend first
cd e2e
npm test
```

The script deletes `.run/e2e/saturdaze-e2e.db`, starts the API with
`Saturdaze__Database__Provider=Sqlite` (the API creates the schema on
startup; the setting is refused in Production), seeds it with
`saturdaze seed --provider Sqlite`, and checks the seeded sign-in. Running
the API against LocalDB (`eng/Restart-Api.ps1`) still works for e2e.

## Documentation

| Topic | Location |
| --- | --- |
| Backend guide | [backend/README.md](backend/README.md) |
| Requirements | [Level 1](docs/specs/L1.md) and [Level 2](docs/specs/L2.md) specifications in [docs/specs](docs/specs/) |
| Detailed designs | [docs/detailed-designs](docs/detailed-designs/) |
| Architecture decisions | [docs/adr](docs/adr/) |
| Design reference | [docs/mocks](docs/mocks/index.html) and its [README](docs/mocks/README.md) |
| Extracted design system | [docs/design-system](docs/design-system/README.md) |
| Catalog ingestion triggers | [backend/deploy/webjobs/ingest](backend/deploy/webjobs/ingest/README.md) |
| Perf test | [frontend/projects/perf-test](frontend/projects/perf-test/README.md) |

## Deployment

Every push to `main` runs `.github/workflows/deploy.yml` (ADR-017):

1. **Test gates** — the backend suite (on SQLite, ADR-020) and the frontend unit tests and
   production builds.
2. **Provision** — `eng/infra/main.bicep` converges `saturdaze-rg`: a Linux B1
   App Service plan and the API Web App, Azure SQL Basic, four Static Web Apps
   (family app, admin, design system, marketing site), the Microsoft Foundry account with the
   Claude deployment (ADR-011), Log Analytics + Application Insights, and a
   monthly budget. Missing resources are created; existing ones are left alone.
3. **API + ingestion WebJob** — publishes the API and `Saturdaze.Cli` (as a
   scheduled WebJob under `App_Data/jobs/triggered/ingest`) into one zip and
   deploys it.
4. **Migrations** — `saturdaze migrate` from the runner, through a SQL firewall
   rule that exists only for the length of the job.
5. **Static Web Apps** — the family app and Saturdaze Admin (ADR-014), with
   deployment tokens read from Azure at run time rather than stored in GitHub,
   and `marketing/` as committed to the marketing site (ADR-018).
6. **Smoke test** — the API answers, both SPAs serve a deep route (L2-042),
   and the marketing site serves its page with its security headers (L2-156).

### Domains (ADR-018)

| Host | Serves |
| --- | --- |
| `www.saturdaze.ca` | The static marketing site (`sd-www-<suffix>`) |
| `saturdaze.ca` | Redirects to `www` (the apex is bound to the marketing site, with `www` as its default domain) |
| `app.saturdaze.ca` | The family app (`sd-web-<suffix>`) |
| `admin.saturdaze.ca` | Saturdaze Admin (`sd-admin-<suffix>`, ADR-014) |

DNS is at Namecheap: `CNAME app`, `CNAME admin` and `CNAME www` to each app's
default host, `ALIAS @` to the marketing app's default host, and the `_dnsauth`
TXT records Static Web Apps asks for. Set the repository variables
`APP_CUSTOM_DOMAIN`, `ADMIN_CUSTOM_DOMAIN`, `MARKETING_CUSTOM_DOMAIN` and
`MARKETING_APEX_DOMAIN` once those validate.
When the subscription has no Free Static Web App slot left, set
`MARKETING_SWA_SKU=Standard`.

### Email (ADR-021)

Account mail goes out as `no-reply@saturdaze.ca` through Azure Communication
Services; the API reaches it over SMTP with settings the template writes.
Set it up once, then again after the records are in DNS:

```pwsh
pwsh ./eng/Setup-Email.ps1 -Domain saturdaze.ca
pwsh ./eng/Setup-Email.ps1 -Domain saturdaze.ca -Verify
```

The first run creates the resources and the `saturdaze-smtp` identity and
prints the records Namecheap needs: `TXT @` with the ownership token,
`include:spf.protection.outlook.com` merged into the existing SPF record,
`CNAME selector1-azurecomm-prod-net._domainkey` and
`CNAME selector2-azurecomm-prod-net._domainkey`. Add a `TXT _dmarc` of
`v=DMARC1; p=none; rua=mailto:<you>` beside them. The second run waits for
Azure to verify the domain, links it, points the API at the relay and sets
`EMAIL_DOMAIN_VERIFIED=true` so every later deployment keeps it. Until then the
API writes `.eml` files under `/home/data/mail` on the App Service.

Inbound mail to any `@saturdaze.ca` address is a Namecheap catch-all forwarder
to the owner's mailbox; it is separate from sending.

The design system deploys from `deploy-storybook.yml` on changes to the
components library.

### First-time setup

```pwsh
az login
pwsh ./eng/Bootstrap-Azure.ps1 -OrganizationName "<legal name>" -BudgetAlertEmail you@example.com
```

The script creates the OpenID Connect app registration GitHub Actions signs in
with, resolves the application secrets (keeping any already live in Azure so
nobody is signed out), stores them as GitHub secrets and variables (with `gh`)
and in the gitignored `.deploy/azure.env`, shows a what-if, and runs the first
deployment.

GitHub Actions needs these **secrets**: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`,
`AZURE_SUBSCRIPTION_ID`, `SQL_ADMIN_LOGIN`, `SQL_ADMIN_PASSWORD`,
`SATURDAZE_JWT_SIGNING_KEY`, `SATURDAZE_PHOTOS_SIGNING_KEY`,
`EMAIL_SMTP_CLIENT_SECRET`; and these
**variables**: `FOUNDRY_ORGANIZATION_NAME`, `FOUNDRY_COUNTRY_CODE`,
`APP_CUSTOM_DOMAIN`, `ADMIN_CUSTOM_DOMAIN`, `MARKETING_CUSTOM_DOMAIN`,
`MARKETING_APEX_DOMAIN`, `MARKETING_SWA_SKU` (optional), `BUDGET_ALERT_EMAIL`, `GOOGLE_CLIENT_ID`
(optional: the production OAuth client id for "Continue with Google", whose
authorised origin is `https://app.saturdaze.ca`; set the same id as
`googleClientId` in `environment.prod.ts`, ADR-019), `EMAIL_DOMAIN`,
`EMAIL_DOMAIN_VERIFIED`, `EMAIL_SMTP_CLIENT_ID` and `EMAIL_SMTP_PRINCIPAL_ID`
(set by `eng/Setup-Email.ps1`, ADR-021).

### Configuration

Every API setting is written by the template — the connection string, the
signing keys, `Cors:AllowedOrigins` (both Static Web Apps plus the custom
domains), `Saturdaze:CuratedPhotos:PublicOrigin` and
`Saturdaze:Images:AllowedOrigins` (ADR-015), and the Claude-on-Foundry
settings with `ANTHROPIC_FOUNDRY_API_KEY` read straight from the Foundry
account. Change them in `eng/infra/main.bicep`, not in the portal. Tiers live
in `eng/infra/main.bicepparam`.

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
