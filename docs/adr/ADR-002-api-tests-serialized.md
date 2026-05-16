# ADR-002 — API tests run sequentially

**Status:** Accepted
**Date:** 2026-05-16

## Context

`Saturdaze.Api.Tests` boots the API in-process via `WebApplicationFactory<Program>`. Each test class has its own `SaturdazeApiFactory` fixture and its own per-fixture database.

With xUnit's default parallel test collection execution, two factories starting concurrently in the same process race on the static `Log.Logger` set up at the top of `Program.cs`. The first factory's `finally { Log.CloseAndFlush(); }` runs while the second is mid-startup, causing the second host build to fail with "The entry point exited without ever building an IHost."

## Decision

Disable test-collection parallelization for `Saturdaze.Api.Tests` via `xunit.runner.json`:

```json
{ "parallelizeAssembly": false, "parallelizeTestCollections": false }
```

This is scoped to API tests only. `Saturdaze.Application.Tests` and `Saturdaze.Infrastructure.Tests` parallelize normally.

## Consequences

- API test runtime is longer (each fixture starts/stops a full host in series).
- Total wall-clock for the test suite is still under a minute, which is acceptable given the plan's "speed of implementation is not a goal" stance.
- A future refactor to use `IHostApplicationBuilder.Logging` instead of the static `Log.Logger` pattern in `Program.cs` would remove the underlying conflict and re-enable parallelism.
