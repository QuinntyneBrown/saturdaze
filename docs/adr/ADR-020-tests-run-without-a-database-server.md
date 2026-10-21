# ADR-020 — Tests run without a database server

**Status:** Accepted
**Date:** 2026-10-20
**Category:** testing
**Deciders:** Quinntyne Brown
**Supersedes:** [ADR-001](ADR-001-localdb-named-pipe-in-tests.md) (LocalDB named pipe in tests).
**Related:** [ADR-002](ADR-002-api-tests-serialized.md) (serial API tests), [ADR-008](ADR-008-per-user-family-scoping-and-auth-fallback.md) (family scoping), [ADR-017](ADR-017-production-hosting-and-continuous-deployment.md) (CI and deploy gates).

## Context

The backend suite is the slowest CI gate. `Saturdaze.Api.Tests` boots the API in-process with `WebApplicationFactory<Program>` against a per-fixture LocalDB database: it resolves LocalDB's pipe (ADR-001), runs `Database.MigrateAsync()`, seeds with `TestSeed` and drops the database on disposal, for 51 test classes in series (ADR-002). `Saturdaze.Infrastructure.Tests` does the same through `TestDatabase` for the persistence round trips, the migration-upgrade test and the `sp_getapplock` ingestion lock. CI therefore runs the backend job on `windows-latest`, installs LocalDB through Chocolatey when it is missing and starts it. On the last green run on main before this change (run 39534228786, 2026-10-21) the backend job took **7 min 31 s**, against under 2 minutes for the frontend job and about 4½ for the design-system job. Playwright needs the API on :5100 over a LocalDB database that `saturdaze migrate` and `saturdaze seed` prepared, and `eng/Restart-Api.ps1` exists only because LocalDB's pipe goes stale.

`Saturdaze.Application.Tests` and `Saturdaze.Cli.Tests` already run on EF Core InMemory, and `Microsoft.EntityFrameworkCore.Sqlite` is already pinned and used by the CLI's `--provider Sqlite`.

The schema relies on SQL Server for: filtered unique indexes (`Users.AvatarToken`, `Users.GoogleSubject`, `FamilyMembers.UserId`, `PlacePhotos` primary-per-place), the identity column `PhotoAuditEntries.Sequence`, the migrations themselves (T-SQL generated for SQL Server), and `sp_getapplock` in `AppDbContext.AcquireLockAsync`, which already falls back to no lock on any other provider. Every timestamp is a `DateTimeOffset`, and the handlers filter and sort on them.

The goal is speed without losing coverage: every test keeps its assertions, and production and local development stay on SQL Server.

## Decision

1. **SQLite in memory for API and Infrastructure tests.** Each `SaturdazeApiFactory` (and each Infrastructure persistence fixture) owns a named shared-cache in-memory SQLite database (`Data Source=saturdaze-<guid>;Mode=Memory;Cache=Shared`). The fixture holds one connection open for its lifetime so the database lives exactly as long as the fixture; every `DbContext` the API creates opens its own connection to the same name, so concurrent requests behave as they do against a server. The schema comes from the EF model (`EnsureCreated`), not from the migrations. SQLite enforces what the tests rely on: foreign keys and cascades, unique indexes, and the filtered unique indexes, which SQLite creates as partial indexes from the same `HasFilter` text.
2. **The provider's gaps are closed in the model, not in the tests.** When the provider is SQLite, `AppDbContext` stores `DateTimeOffset` values through EF's `DateTimeOffsetToBinaryConverter` (all values are UTC, so the encoded order is the time order and comparisons and `ORDER BY` translate), and `PhotoAuditEntries.Sequence` is filled by an insert trigger from the row id, the SQLite counterpart of the identity column. The SQL Server model is untouched.
3. **SQL Server-only tests become opt-in, and the migrations stay covered.** The migration-upgrade round trip and the two `sp_getapplock` tests prove behaviour that only exists on SQL Server, so they move behind `[SqlServerFact]`, which carries `[Trait("Category", "SqlServer")]` and skips unless `SATURDAZE_TEST_SQLSERVER` is set (to a server connection string, or to `localdb` for the LocalDB pipe of ADR-001). The default `dotnet test` and CI report them as skipped. Because the API fixtures no longer run `MigrateAsync`, a new test checks with `Database.HasPendingModelChanges()` against the SQL Server model that the committed migrations cover the model; it needs no connection. The remaining round-trip tests (unique names, unique weekend per family and date, cascades, value conversions) run on SQLite by default.
4. **No process-local lock.** `AcquireLockAsync` keeps returning `NoLock` on SQLite. The only tests that prove mutual exclusion are the `sp_getapplock` tests, and a process-local lock under them would prove a stand-in, not the lock production uses; the runner's use of the lock is covered by the Application tests' `TestAppDbContext`.
5. **The API can run on SQLite for Playwright, and only outside Production.** `Saturdaze:Database:Provider` selects `SqlServer` (the default when unset) or `Sqlite`, in `DependencyInjection.AddInfrastructure`; the connection string comes from the usual places. Under `Sqlite` the API creates the schema from the model on startup (`EnsureCreated`, a no-op when it exists); SQL Server still never migrates on startup. `Program.cs` refuses to start with `Sqlite` when the environment is `Production`, and the setting is in no `appsettings` file or Bicep template, so it cannot be turned on by accident. `eng/Start-E2eApi.ps1` deletes and recreates a SQLite file under `.run/`, starts the API on :5100 against it, and seeds it with the existing seeder (`saturdaze seed --provider Sqlite`), so the accounts and catalog `e2e/fixtures/auth.ts` expects exist as they do after a LocalDB reseed.
6. **API test collections stay serial for now.** Measured below: see *Measurements*. ADR-002's cause (the static `Log.Logger` in `Program.cs`) is only worth removing if the serial suite is still the slowest CI job after the provider change.
7. **The backend CI job runs on `ubuntu-24.04`** like the other jobs, with no LocalDB step, in both `ci.yml` and `deploy.yml`. `eng/Test-Backend.ps1` still builds once and runs the four assemblies side by side; each SQLite database is private to its fixture.

## Options Considered

### Option 1: SQLite in memory with a kept-open connection (chosen)
- **Pros:** A relational engine: foreign keys, cascades, unique and filtered unique indexes, transactions and real SQL translation all run, so the cross-family scoping tests (ADR-008) and the conflict tests keep failing when the code is wrong. No server, no install, cross-platform; a fixture's database is created in milliseconds.
- **Cons:** Not the production engine: no migrations, no `sp_getapplock`, `DateTimeOffset` and identity need model-level adapters, and translation differences can hide SQL Server-only query failures.

### Option 2: EF Core InMemory
- **Pros:** Already used by the Application and CLI tests; the fastest.
- **Cons:** No foreign keys, no unique indexes, no cascades beyond tracked entities, no transactions, and LINQ runs as LINQ-to-objects: tests that rely on a unique index or a cascade would pass with the bug present. It would weaken the API suite.

### Option 3: A hand-written fake behind `IAppDbContext`
- **Pros:** Full control.
- **Cons:** `IAppDbContext` exposes `DbSet<T>`s, so a fake is a second EF provider in all but name; large to write and the least faithful.

### Option 4: Keep SQL Server, in a container (Testcontainers) on Linux
- **Pros:** The production engine, migrations included.
- **Cons:** A container start per run and still a server per test assembly; it moves the bottleneck rather than removing it. Kept as a possible nightly job (deferred).

## Consequences

### Positive
- `dotnet test` passes on a clean machine with no database server, and CI drops Windows and Chocolatey.
- Playwright no longer needs LocalDB or `eng/Restart-Api.ps1`; the API for e2e starts from a fresh file each time.

### Negative
- The migrations no longer run in the default suite. `HasPendingModelChanges` catches a model change without a migration, but not a migration that fails on a real server; the opt-in SQL Server tests and the deploy's `saturdaze migrate` are the remaining checks.
- Three tests are skipped by default.

### Risks
- A query SQLite translates and SQL Server does not (or the reverse) would pass the suite and fail in production. The handlers use plain LINQ; anything provider-specific should be covered by an opt-in `[SqlServerFact]`.
- The SQLite adapters in `AppDbContext` must keep up with new `DateTimeOffset` or identity columns; a missing one shows up as a failing test, not a silent pass.

## Measurements

| | Backend CI job |
| --- | --- |
| Before (run 39534228786, `windows-latest`, LocalDB) | 7 min 31 s |
| After (this PR, `ubuntu-24.04`, SQLite) | _to be filled from the PR's CI run_ |

## References

- [ADR-001](ADR-001-localdb-named-pipe-in-tests.md), [ADR-002](ADR-002-api-tests-serialized.md)
- EF Core, [SQLite provider limitations](https://learn.microsoft.com/ef/core/providers/sqlite/limitations)
- EF Core, [Testing against a database without the production engine](https://learn.microsoft.com/ef/core/testing/choosing-a-testing-strategy)
