# Bug 002 — `Saturdaze.Api` ignores `SATURDAZE_CONNECTION`; README says it works

## Symptom

The repository `README.md` documents `SATURDAZE_CONNECTION` as the
environment-variable override for the connection string. The
`MigrationRunner` and CLI honour it; the API does not. Starting the API on
a machine without LocalDB requires the user to know to pass
`ConnectionStrings__Saturdaze` instead — which is not in the docs.

## Root cause

`Saturdaze.Infrastructure.DependencyInjection.AddInfrastructure` reads the
connection string strictly via `IConfiguration.GetConnectionString("Saturdaze")`,
which only resolves the `ConnectionStrings:Saturdaze` configuration key
(set in `appsettings.json` or via `ConnectionStrings__Saturdaze`).

## Impact

Operators are silently routed at LocalDB, which is not installed on this
machine. The error surface is a Win32 193 crash deep in EF, with no hint
that the env var documented in the README was ignored.

## Fix

In `Saturdaze.Infrastructure.DependencyInjection`, before falling back to
`GetConnectionString("Saturdaze")`, prefer the same lookup chain the
MigrationRunner uses (the `SATURDAZE_CONNECTION` env var). Update the
appsettings.json default to either omit the LocalDB entry (force-explicit)
or point at the SQL Server Express form documented in the README.

## Status

- Logged: 2026-05-16
- Workaround applied this session: started the API with
  `ConnectionStrings__Saturdaze` set to the SQL Express connection string.
- Permanent fix pending.
