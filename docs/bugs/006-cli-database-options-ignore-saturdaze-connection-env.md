# Bug 006 — CLI ignores `SATURDAZE_CONNECTION` env var; only `--connection` works

## Symptom

```
> SATURDAZE_CONNECTION='Server=.\SQLEXPRESS;...' dotnet run --project src/Saturdaze.Cli -- seed
Unhandled exception: System.InvalidOperationException: Provider 'SqlServer' requires a connection string.
Pass --connection, set ConnectionStrings:Saturdaze, or set SATURDAZE_CONNECTION.
```

The error message says `SATURDAZE_CONNECTION` is honoured, but it isn't — only
the `--connection` flag works. The MigrationRunner *does* read the env var, so
the operator experience is split: same env var works for one binary and not
the other.

## Root cause

`Saturdaze.Cli.Database.DbContextRegistrar.RequireConnection` only inspects
`DatabaseOptions.Connection` (populated from `--connection`) and
`IConfiguration` (populated from appsettings + `ConnectionStrings__Saturdaze`).
It never reads `Environment.GetEnvironmentVariable("SATURDAZE_CONNECTION")`,
despite the error message telling the operator that variable is supported.

## Impact

A developer following the README workflow (`$env:SATURDAZE_CONNECTION = "..."`
then `dotnet run --project src\Saturdaze.MigrationRunner` then
`dotnet run --project src\Saturdaze.Cli -- seed`) succeeds at the first step
and crashes at the second, with an error that misdescribes the supported
inputs.

## Fix

In `DbContextRegistrar.RequireConnection`, fall through to the env var if
`options.Connection` and the config-derived strings are both empty.
Alternatively: register a configuration source in `CliHostFactory` that
reads `SATURDAZE_CONNECTION` and maps it to `ConnectionStrings:Saturdaze`.

## Status

- Logged: 2026-05-16
- Workaround applied this session: passed `--connection` explicitly on the
  seed command.
- Permanent fix pending.
