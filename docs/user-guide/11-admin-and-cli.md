# 11. Admin and Command-Line Tools

This chapter is for whoever **runs** Saturdaze — a developer or operator
setting up the database — not the everyday family user. If you just want to
plan weekends, you can stop after Chapter 10.

Saturdaze ships a small command-line tool, **`saturdaze`**, that handles
database administration: applying schema migrations, loading seed data, and
doing a clean from-scratch reset. (It replaces the old `MigrationRunner` and
`Seeder` console projects, which are gone.)

## The three commands at a glance

| Command            | What it does                                                        |
| ------------------ | ------------------------------------------------------------------- |
| `saturdaze migrate` | Applies any pending EF Core migrations to the database.            |
| `saturdaze seed`    | Loads catalog + family data from JSON seed files (idempotent).     |
| `saturdaze reset`   | Drops the database, re-migrates, and re-seeds. Requires `--yes`.   |

The API **does not** apply migrations on startup — running `migrate` is an
explicit, deliberate step.

## Two ways to run it

**During development**, run it straight from the solution:

```powershell
dotnet run --project .\backend\src\Saturdaze.Cli -- migrate
dotnet run --project .\backend\src\Saturdaze.Cli -- seed
dotnet run --project .\backend\src\Saturdaze.Cli -- reset --yes
```

Everything after `--` is passed to the tool.

**As a packaged tool**, it installs under the command name `saturdaze`
(package id `Saturdaze.Cli`, built to `backend/artifacts`):

```powershell
saturdaze migrate
saturdaze seed
saturdaze reset --yes
```

## Telling it which database to use

Before any command can touch a database, it needs a connection string. The
tool resolves one in this order:

1. The **`--connection`** option, if you pass it.
2. **`ConnectionStrings:Saturdaze`** from `appsettings.json`.
3. The **`SATURDAZE_CONNECTION`** environment variable.
4. A **provider default** — only SQLite has one (a file under your app-data
   folder); SQL Server and others require an explicit connection string and
   will error without one.

The usual local setup is to set the environment variable once per shell:

```powershell
$env:SATURDAZE_CONNECTION = "Server=(localdb)\MSSQLLocalDB;Database=Saturdaze;Trusted_Connection=True;TrustServerCertificate=True"
dotnet run --project .\backend\src\Saturdaze.Cli -- migrate
```

> **LocalDB on this machine:** SQL Server 2025 / SqlClient has a known
> interop quirk with the `(localdb)\Instance` shortcut. The fresh-stack
> script resolves LocalDB to a **named pipe** via `sqllocaldb info` to work
> around it (see ADR-001). If a raw `(localdb)\…` connection misbehaves,
> that's why.

Connection strings are **password-redacted** in the tool's log output, so
it's safe to copy logs.

## Global options

These work on every command:

| Option           | Default     | Purpose                                                        |
| ---------------- | ----------- | ------------------------------------------------------------- |
| `--provider`     | `SqlServer` | Target provider: `SqlServer`, `Sqlite`, or `InMemory`.        |
| `--connection`   | (from config) | Override the connection string.                             |
| `--seed-dir`     | (bundled)   | Override the directory the seed files are read from.           |
| `--verbose`      | off         | Emit `Debug`-level logging.                                    |

`SqlServer` and `Sqlite` need a connection string; `InMemory` doesn't (it
spins up a throwaway in-memory store, handy for smoke tests).

## `saturdaze migrate`

Applies all pending EF Core migrations to the configured database, then logs
"Migrations applied." It's safe to run repeatedly — only outstanding
migrations are applied. Exit code **0** on success.

## `saturdaze seed`

Loads data from a set of JSON files:

- Default: the files **bundled with the tool** (`Seed/Data` next to the
  assembly), so the data always matches the installed version.
- Override with **`--seed-dir <path>`** or the **`SATURDAZE_SEED_DIR`**
  environment variable. A custom directory is filled in with any bundled
  files it lacks on first run (existing files are never overwritten), so you
  only need to supply the files you want to change.
- The per-user directory (`%APPDATA%\saturdaze\seed` on Windows,
  `~/.config/saturdaze/seed` elsewhere) is only used when the install ships
  no bundle.

It processes these files, in order, and logs how many records each produced:

`activities.json` → `restaurants.json` → `local-events.json` →
`family.json` → `users.json` → `event-submissions.json`

Seeding is **idempotent**: every seeder *upserts* (inserts new rows, updates
matching ones) keyed by a natural identifier — activity/restaurant name,
family home location, normalized email, and so on. Re-running `seed` leaves
you in the same state rather than creating duplicates.

Exit codes: **0** success · **2** seed directory doesn't exist · **3**
directory exists but contains no recognised seed files.

### What the bundled seed data contains

Out of the box, `seed` gives you a complete worked example:

- **Family** — "Port Credit, Mississauga, ON", with **4 members** (Quinn 38,
  Sara 36, Eli 9, Mae 5), **3 commitments** (Swim lessons Sat 9–10, Workout
  window Sat 17–18, Church Sun 10:30–11:45), and **8 preference tags** (likes:
  Parks, Short hikes, Zoo, Rec Room, Lavender, Live theatre; dislikes:
  Camping, "Drives > 60 min").
- **8 activities** and **8 restaurants** (the Port Credit / Halton catalog).
- **7 local events** (their dates shift automatically toward the current
  upcoming Saturday, so the data stays seasonally relevant).
- **3 example event submissions** (in the moderation queue).
- **2 user accounts** (see below).

### Default accounts

The seed creates two sign-in accounts, both with the password
**`password123`**:

| Email                        | Role  | Notes                                  |
| ---------------------------- | ----- | -------------------------------------- |
| `quinntynebrown@gmail.com`   | User  | Linked to the seeded family            |
| `admin@saturdaze.app`        | Admin | Can moderate event submissions         |

> **Security:** these are local/development convenience credentials. Change
> or remove them (edit `users.json` in your seed directory) before pointing
> the seed at anything that isn't a throwaway local database.

## `saturdaze reset`

The one-shot "give me a clean database" command. It:

1. **Drops** the existing database.
2. **Migrates** it back to the current schema (for a relational provider) or
   recreates it (for in-memory).
3. **Seeds** it.

Because it's destructive, it **refuses to run without `--yes`**:

```powershell
saturdaze reset           # refuses: "Refusing to reset without --yes." (exit 4)
saturdaze reset --yes     # proceeds
```

Exit code **4** if `--yes` is missing; otherwise it returns the seed step's
exit code.

## Exit codes, all in one place

| Code | Meaning                                                  |
| ---- | ------------------------------------------------------- |
| `0`  | Success.                                                 |
| `2`  | `seed`: the seed directory doesn't exist.                |
| `3`  | `seed`: the directory has no recognised seed files.      |
| `4`  | `reset`: attempted without `--yes`.                      |

## The one-command local stack

For a full local environment from a clean database, `eng/Start-FreshStack.ps1`
wraps all of this — it packs the CLI, resolves the LocalDB pipe, resets the
database, builds, and runs both the API and the Angular dev server:

```powershell
powershell .\eng\Start-FreshStack.ps1
```

The API serves on `http://localhost:5100` (Swagger at `/swagger`); the
Angular app serves on `http://localhost:4200`.

## Where the CLI fits in deployment

In CI/CD (GitHub Actions, `.github/workflows/deploy.yml`), the API is
published to Azure App Service and then **`saturdaze migrate`** is run against
the target database before the new build goes live — the same explicit-migrate
discipline you use locally. Seeding is a local/setup convenience and is not
part of the production deploy.

## See also

- The repository **`CLAUDE.md`** for the developer-facing command reference.
- **`docs/adr/ADR-001`** (LocalDB named pipe) and **ADR-004** (package pins).
- Earlier chapters of this guide for what the app does once the database is
  set up.
