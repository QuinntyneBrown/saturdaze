# Bug 001 — CLI `seed` command fails on first run: user-scope seed directory is empty

## Symptom

```
> dotnet run --project src/Saturdaze.Cli -- seed --connection '<sqlexpress>'
info: Seeding from C:\Users\quinn\AppData\Roaming\saturdaze\seed
fail: Seed directory 'C:\Users\quinn\AppData\Roaming\saturdaze\seed' does not exist.
```

## Root cause

`SeedPathResolver` resolves the seed directory to `%APPDATA%\saturdaze\seed`,
but nothing ever populates it. The canonical seed JSONs live only inside the
test project at `backend/tests/Saturdaze.Api.Tests/SeedData/*.json`. A fresh
clone of the repo has no way to seed.

## Impact

End-to-end bring-up is impossible from a clean machine. Every dependent
acceptance test in the user guide (plan a weekend, browse activities, pick a
restaurant, find events, view family profile) hits an empty database.

## Fix

1. Vendor canonical seed JSONs under `backend/src/Saturdaze.Cli/Seed/Data/`
   (or `Saturdaze.Infrastructure/SeedData/` per backend-plan §3) and ship
   them as content with the CLI.
2. On first invocation of `seed`, if the user-scope directory is empty, copy
   the bundled files into place before reading.
3. Alternatively: make `--seed-dir` default to the bundled location and only
   fall back to user-scope when an explicit override exists.

## Status

- Logged: 2026-05-16
- **Fixed: 2026-05-16.** Canonical seed JSON files now ship under
  `backend/src/Saturdaze.Cli/Seed/Data/` (marked content with
  `CopyToOutputDirectory=PreserveNewest` and `PackagePath` set for the
  packed tool). `SeedCommandHandler.EnsureUserScopePopulatedFromBundle`
  copies any missing files from the bundled location into the resolved
  user-scope directory on first run — idempotent, never overwrites.
- Verified by: `dotnet build src/Saturdaze.Cli` succeeds; bundled JSONs
  land in `bin/Debug/net10.0/Seed/Data/`.
