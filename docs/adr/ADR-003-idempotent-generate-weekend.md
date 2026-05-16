# ADR-003 — `GenerateWeekendCommand` is idempotent

**Status:** Accepted
**Date:** 2026-05-16

## Context

`GenerateWeekendCommand(DateOnly weekendOf)` runs the planner and persists a `Weekend` for that date. The plan does not explicitly say what to do when a weekend already exists for the same family + date — only that there is a unique index on `(FamilyId, WeekendOf)`.

Two reasonable choices:

1. **Throw `ConflictException`** if the weekend already exists. Forces the caller to use `RegenerateWeekendCommand` instead.
2. **Return the existing weekend** unchanged.

## Decision

The handler returns the existing weekend (option 2). The frontend's natural flow is "user opens the app on Friday → weekend may or may not be planned → render one either way." Forcing the caller to distinguish a "first plan" from "already planned" doubles the API surface for no user-visible benefit, and an existing weekend's content (including locked blocks and favourite marks) is exactly what the user wants to see.

Regeneration is its own explicit operation (`POST /api/weekends/{id}/regenerate`), so there is no risk of accidentally clobbering a customized plan via repeated `POST /api/weekends/plan`.

## Consequences

- `POST /api/weekends/plan` is safe to call repeatedly.
- Callers cannot tell from the response alone whether a new weekend was created or an existing one returned. The frontend doesn't need to know.
- If the planner improves and we want to give users an easy way to re-pick, `RegenerateWeekendCommand` is the supported path. Calling `plan` will not silently re-plan.
