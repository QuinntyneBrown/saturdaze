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
