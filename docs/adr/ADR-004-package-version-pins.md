# ADR-004 — Package version pins for security and runtime compatibility

**Status:** Accepted
**Date:** 2026-05-16

## Context

`Directory.Build.props` sets `TreatWarningsAsErrors`, which promotes NuGet `NU1903` (known vulnerability) errors. The transitive graph of `Microsoft.EntityFrameworkCore.SqlServer` pulled in `System.Security.Cryptography.Xml` 9.0.0, which has two known high-severity advisories (GHSA-37gx-xxp4-5rgx, GHSA-w3x6-4m5h-cxqf). The first patched version is 10.0.6 / 9.0.15 / 8.0.3 (per advisory `first_patched_version`).

Separately, the bundled `Microsoft.Data.SqlClient` (5.x range) failed to talk to SQL Server 2025 LocalDB v17 — see ADR-001 for symptoms.

## Decision

Pin two transitive packages in `Directory.Packages.props` under central package management:

- `System.Security.Cryptography.Xml` → `10.0.6` (closes the vulnerabilities)
- `Microsoft.Data.SqlClient` → `7.0.1` (supports LocalDB v17 / SQL Server 2025)

These are the only direct deviations from the framework's default transitive versions.

## Consequences

- Build is clean (`0 Warning(s)`).
- Future framework updates may make these pins redundant; they should be re-evaluated when bumping the .NET version.
- A vulnerability scan from this date onward will see the patched versions.

## Update 2026-09-01

New advisories against `System.Security.Cryptography.Xml` 10.0.6 and the transitive `SQLitePCLRaw.lib.e_sqlite3` 2.1.11 turned `NU1903` into build errors again. The whole `10.0.0` Microsoft line was moved to `10.0.11` (EF Core, Extensions, ASP.NET packages), `System.Security.Cryptography.Xml` to `10.0.11`, `Microsoft.Extensions.Http.Resilience` to `10.9.0` (it does not follow the runtime's patch numbers), and the IdentityModel pair to `8.22.0` (the JwtBearer package now requires ≥ 8.19.2). EF Core 10.0.11 pulls a patched SQLitePCLRaw, so no explicit SQLite pin was needed. The two original pins remain as documented.
