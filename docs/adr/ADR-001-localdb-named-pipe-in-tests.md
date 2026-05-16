# ADR-001 — LocalDB connection via named pipe in tests

**Status:** Accepted
**Date:** 2026-05-16

## Context

Integration tests (`Saturdaze.Infrastructure.Tests`, `Saturdaze.Api.Tests`) need a real SQL Server database. The plan calls for SQL Server Express in production and LocalDB on developer machines.

The natural connection string `Server=(localdb)\MSSQLLocalDB;...` failed at runtime on this machine with `Microsoft.Data.SqlClient.SqlException ... error 56 — Unable to load the SQLUserInstance.dll`. The DLL exists at the registered path and is the correct architecture, but the SQL Server 2025 (LocalDB v17) interop layer fails to load it through the `(localdb)\Instance` shortcut from the .NET client we ship with.

## Decision

In tests, resolve the LocalDB pipe via `sqllocaldb info MSSQLLocalDB` and connect to that named pipe directly (`Server=np:\\.\pipe\LOCALDB#...\tsql\query;...`). This bypasses the LocalDB user-instance redirect and works reliably.

The helper lives in two places (one per test project) under `Support/LocalDbConnection.cs`. Both copies are intentionally identical and self-contained — duplicated to keep test projects from depending on each other.

Production never uses LocalDB, so this workaround is test-only.

## Consequences

- Tests work on this developer machine without registry surgery.
- A real SQL Server Express install in CI would use the standard `Server=hostname;...` form; no workaround needed.
- If LocalDB v17's interop issue is fixed in a future SqlClient release, the shortcut form will start working again and the helper can be retired. There is no behavioral coupling, so removing the helper is a safe refactor.
