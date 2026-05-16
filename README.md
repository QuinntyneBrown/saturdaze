# Saturdaze

Saturdaze is a family weekend planner for turning Saturday and Sunday into a ready-to-use plan. It is designed around a Port Credit family of four, fixed weekend commitments, kid-friendly activities, weather, restaurants, errands, and a predictable evening wind-down.

The repo is a full-stack workspace:

- `backend/` - .NET Clean Architecture backend, EF Core persistence, SQL Server, MediatR, API, migration runner, seeder, and backend tests.
- `frontend/` - Angular workspace with the `saturdaze` app plus `api` and `components` libraries.
- `e2e/` - Playwright tests, including visual comparison against the mock skeleton.
- `docs/` - product notes, backend/frontend implementation plans, and the canonical mock screens under `docs/mocks/`.

## Current State

The mock screens in `docs/mocks/` are the visual and interaction reference for the Angular implementation. The frontend workspace is scaffolded and the e2e suite is wired to run against either the mocks or the Angular app. The backend has the initial solution structure, persistence foundation, seed data, and a `_ping` pipeline endpoint.

## Prerequisites

- .NET SDK compatible with `backend/global.json` (`10.0.101` pinned there)
- SQL Server LocalDB or SQL Server Express
- Node.js and npm (`frontend/package.json` uses `npm@10.9.4`)

## Install

Command snippets assume you start from the repo root.

Install frontend and e2e dependencies:

```powershell
cd frontend
npm install

cd ..\e2e
npm install
```

Then restore the backend:

```powershell
cd backend
dotnet restore Saturdaze.sln
```

## Database

The API default connection string points at LocalDB:

```text
Server=(localdb)\MSSQLLocalDB;Database=Saturdaze;Trusted_Connection=True;TrustServerCertificate=True
```

The Saturdaze CLI can also read `SATURDAZE_CONNECTION`:

```powershell
cd backend
$env:SATURDAZE_CONNECTION = "Server=(localdb)\MSSQLLocalDB;Database=Saturdaze;Trusted_Connection=True;TrustServerCertificate=True"

dotnet run --project src\Saturdaze.Cli -- migrate
dotnet run --project src\Saturdaze.Cli -- seed
```

Use a SQL Server Express connection string instead if LocalDB is not available.

## Run Locally

Start the backend API:

```powershell
cd backend
dotnet run --project src\Saturdaze.Api --urls http://localhost:5100
```

Swagger is available at `http://localhost:5100/swagger`.

Start the Angular app:

```powershell
cd frontend
npm start
```

The app runs at `http://localhost:4200/`.

Serve the static mock app when working from the design reference:

```powershell
cd e2e
npx http-server ..\docs\mocks -p 5173 -c-1
```

Then open `http://localhost:5173/`.

## Test

Backend:

```powershell
cd backend
dotnet build Saturdaze.sln
dotnet test Saturdaze.sln
```

Frontend:

```powershell
cd frontend
npx ng build saturdaze
npx ng build components
npx ng build api
npm test
```

Playwright e2e:

```powershell
cd e2e
npm test
```

Capture or update visual baselines from the mocks:

```powershell
cd e2e
npm run baseline
```

Run visual comparisons against the Angular app:

```powershell
cd e2e
npm run test:visual
```

## Key Docs

- Product and screen list: `docs/features.md`
- Backend plan: `docs/backend-plan.md`
- Backend technology constraints: `docs/backend-tech.md`
- Frontend implementation plan: `docs/frontend-implementation-plan.md`
- Mock app: `docs/mocks/index.html`

## Development Notes

- Keep the mock custom element tag names and Angular component selectors aligned.
- Backend code follows the existing Clean Architecture layout and keeps business logic out of controllers.
- EF migrations are explicit; the API does not apply migrations on startup.
- Seed data is intended to be idempotent and re-runnable.
