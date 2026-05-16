# Bug 012 — `Saturdaze.MigrationRunner` duplicates bootstrap that already belongs in `Saturdaze.Cli`

## Symptom

`backend/src/` ships two executable projects that both bootstrap
`AppDbContext` against the same connection string and exist to drive
the same database:

```
backend/src/
  Saturdaze.Cli/                 // seed (and growing) commands
    Program.cs
    RootCommandFactory.cs
    Database/                    // DbContext registrar, provider, options
    Hosting/                     // CliHostFactory + GlobalOptions
    Seed/
  Saturdaze.MigrationRunner/     // single-purpose: db.Database.MigrateAsync()
    Program.cs
    Saturdaze.MigrationRunner.csproj
```

`MigrationRunner/Program.cs` is 38 lines of top-level statements that:

1. Build a `ConfigurationBuilder` from `appsettings.json`, env vars, and
   command-line args.
2. Resolve a connection string from
   `ConnectionStrings:Saturdaze` → `Saturdaze:ConnectionString` →
   `SATURDAZE_CONNECTION` (the same chain bug 006 standardised for the
   CLI).
3. Register `AppDbContext` with `UseSqlServer(...)`.
4. Call `db.Database.MigrateAsync()`.
5. Print a sanitized connection string.

Every one of those steps already exists, in a more reusable form, in
`Saturdaze.Cli` (`Database/DbContextRegistrar.cs`,
`Hosting/CliHostFactory.cs`, `Hosting/GlobalOptions.cs`). The runner is
a parallel mini-bootstrap that has to be kept in sync by hand.

## Root cause

`MigrationRunner` predates the `Saturdaze.Cli` host. When the CLI grew
its own configuration pipeline and DbContext registration (bug 006), the
runner was left in place rather than folded in. The result is two entry
points, two `Program.cs` files, two `.csproj` files, two sets of
`PackageReference`s to keep aligned, and two places where the
connection-resolution rules can drift.

## Impact

- **Drift risk.** A change to the connection-resolution chain or
  `UseSqlServer` options has to be made twice. Bug 006 already had to
  touch the CLI side; the runner side was not part of that fix and
  could silently diverge.
- **Discoverability.** New contributors see two executables and have to
  reason about which one to run for which operation. There is no good
  answer — `migrate` is just a missing CLI verb.
- **Tooling surface.** CI / Docker / docs all have to special-case the
  runner. Folding it in collapses that to one binary.
- **Tests.** `CliHostFactory` has tests (see commit `3217cad`); the
  runner's bootstrap has none.

## Fix

Fold the migration step into `Saturdaze.Cli` as a sibling of
`SeedCommand`, then delete the runner project entirely.

1. **New verb.** Add `MigrateCommand` under
   `Saturdaze.Cli/Database/` (or a new `Saturdaze.Cli/Migrate/` folder
   matching the `Seed/` shape). Register it in `RootCommandFactory`
   alongside `SeedCommand`. The handler reuses
   `CliHostFactory` + `DbContextRegistrar` so connection resolution and
   `UseSqlServer` configuration come from one place.

   Target usage:

   ```
   saturdaze migrate
   saturdaze migrate --connection "Server=...;Database=..."
   saturdaze migrate --provider Sqlite
   ```

2. **Remove the runner project.**
   - Delete every file under
     `backend/src/Saturdaze.MigrationRunner/` (`Program.cs`,
     `Saturdaze.MigrationRunner.csproj`, `bin/`, `obj/`).
   - Remove the project folder itself.
   - Remove the project from `backend/Saturdaze.sln` (and any
     `Directory.*.props` / solution filter that names it).
   - Sweep for any leftover references: CI workflows, Dockerfiles,
     `README.md`, `docs/`, deploy scripts, `dotnet run --project ...`
     invocations.

3. **Verify.** `dotnet build backend/Saturdaze.sln` succeeds and
   `saturdaze migrate` applies pending migrations against a fresh DB.

## Out of scope

- Behavioural changes to migration application (transactional wrapping,
  baseline checks, seed-after-migrate composition) — same semantics as
  the runner today.
- Renaming any of the existing CLI verbs.

## Status

- Logged: 2026-05-16
- Pending — no code change yet; this bug captures the merge plan.
