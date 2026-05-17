# Contributing to Saturdaze

Thank you for your interest in improving Saturdaze. This project is a
full-stack family weekend planner with a .NET backend, Angular frontend,
Playwright test suite, and static mock reference application.

## Before You Start

- Check existing issues and pull requests to avoid duplicate work.
- Open an issue first for user-visible behavior changes, larger refactors, or
  changes that affect API contracts.
- Keep pull requests focused on one fix, feature, or documentation update.
- Include screenshots or Playwright evidence for visible UI changes.

## Development Setup

From the repository root, the fastest way to verify the full stack is:

```powershell
powershell .\scripts\Start-FreshStack.ps1
```

The script packs and installs the local `Saturdaze.Cli` tool, resets and seeds
the database, publishes the backend API, builds the Angular frontend, starts
both processes, and prints the frontend URL.

Manual setup:

```powershell
cd frontend
npm ci

cd ..\e2e
npm ci

cd ..\backend
dotnet restore .\Saturdaze.sln
```

## Project Layout

| Path | Purpose |
| --- | --- |
| `backend/` | .NET solution, Clean Architecture layers, EF Core, API, CLI, tests |
| `frontend/` | Angular app plus `api` and `components` libraries |
| `e2e/` | Playwright behavior and visual tests |
| `docs/mocks/` | Static reference implementation and screenshots |
| `docs/adr/` | Architecture decision records |
| `scripts/` | Local automation scripts |

## Coding Guidelines

- Follow existing patterns in the layer you are changing.
- Keep backend business rules in application handlers and domain services, not
  controllers.
- Keep EF migrations explicit. The API must not apply migrations on startup.
- Keep seed data idempotent and safe to rerun.
- Keep Angular component selectors aligned with the mock custom-element tag
  names.
- Keep visual changes consistent with `docs/mocks/` unless the pull request is
  intentionally updating the design.
- Avoid unrelated formatting churn and broad refactors in feature or bug-fix
  pull requests.

## Tests

Run the checks that match your change. For cross-stack changes, run all of
them.

```powershell
# Backend build and tests
dotnet build .\backend\Saturdaze.sln
dotnet test .\backend\Saturdaze.sln

# Frontend build and tests
cd frontend
npm run build -- saturdaze --configuration development
npm run build -- components
npm run build -- api
npm test

# Playwright behavior and visual tests
cd ..\e2e
npm run test:behavior
npm run test:visual
```

Update visual baselines only when the design change is intentional:

```powershell
cd e2e
npm run baseline
```

## Pull Request Checklist

- The change has a clear issue, rationale, or user-facing reason.
- New or changed behavior has test coverage appropriate to the risk.
- Relevant documentation is updated.
- UI changes include screenshots or Playwright evidence.
- Database changes include explicit EF migrations and seed updates if needed.
- The pull request description lists the commands you ran.

## Reporting Bugs

When filing a bug, include:

- the route or command where the problem appears;
- expected behavior;
- actual behavior;
- reproduction steps;
- logs, screenshots, or terminal output;
- operating system, browser, and relevant tool versions.

## License

By contributing to this repository, you agree that your contributions are
licensed under the repository's MIT License.
