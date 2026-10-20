# ADR-019 — Administrators act inside a family's scope; every change is audited

**Status:** Accepted
**Date:** 2026-10-20
**Implements:** [L2-158](../specs/L2.md#l2-158-administrators-act-inside-one-familys-scope), [L2-160](../specs/L2.md#l2-160-change-a-familys-plan-from-saturdaze-admin), [L2-161](../specs/L2.md#l2-161-record-every-administrator-change-to-a-familys-weekend).
**Related:** [ADR-008](ADR-008-per-user-family-scoping-and-auth-fallback.md), [ADR-014](ADR-014-separate-admin-application.md), [ADR-016](ADR-016-family-ownership-and-member-sign-in.md). Design: `docs/detailed-designs/administration/oversee-family-weekends`.

## Context

Family weekend oversight (L1-038) lets an administrator view and change any family's upcoming weekend from Saturdaze Admin. Every weekend, block and day handler resolves "the current family" through `ICurrentFamilyAccessor`, which reads the caller's own `Users.FamilyId` (ADR-008, ADR-016), and every query filters on that family so another family's ids are 404s. The planning rules an administrator must respect (locked blocks stay, commitments cannot be unlocked, only unlocked activities swap) live in those handlers.

Two ways to let an administrator act on another family were considered:

1. **Duplicate the handlers** with a `FamilyId` parameter under `Admin/Families`. Every rule would exist twice and drift.
2. **Scope the request to the family named in the route** and run the existing handlers unchanged.

## Decisions

### 1. `AdminFamilyScope` overrides the current family for administrators only

`AdminFamilyScope` is a scoped service. `EnterAsync(familyId)` requires `ICurrentUserAccessor.Role == Admin`, loads the family (404 when unknown) and records its id. `CurrentUserFamilyAccessor.GetCurrentFamilyIdAsync` returns the scoped id when one is set and the caller is an administrator; otherwise it behaves as before. Only the admin family handlers call `EnterAsync`, and the controller that sends them carries `[Authorize(Policy = "Admin")]`, so a family member can never enter another family's scope.

Each admin route has a thin handler that enters the scope, sends the family's own command or query, and records the change. The family's handlers, their ownership filters and their 409 rules run unchanged, so an administrator can never produce a plan the family could not (L2-158, L2-160).

### 2. Reads create nothing

`GET /api/weekends/current` plans the weekend on first load (ADR-003). The admin read does not: `GetAdminFamilyWeekendQueryHandler` reads the upcoming weekend directly and answers 404 `weekend_not_planned` when there is none. Planning is an explicit `POST …/weekends/plan`, which is idempotent like the family's.

### 3. Every administrator change writes a `WeekendAuditEntry`

`WeekendAuditWriter` mirrors `PhotoAuditWriter` (ADR-014's audit convention): who, when (UTC), the family, the weekend, the action, the day or block and the values before and after as JSON. The admin handler adds the entry after the inner handler has saved and saves again in the same request scope. The family's own routes never reach the writer, so the log is the administrator's trail only (L2-161).

## Consequences

- One migration adds `WeekendAuditEntries`.
- A new weekend rule written in a family handler applies to administrators automatically.
- `CurrentUserFamilyAccessor` has one more branch; its unit of trust is the `Admin` role plus the admin-only policy on the controller.
- Nested MediatR sends share the request's scoped `AppDbContext`, so the audit entry and the weekend change commit in one request; a failed inner command throws before any entry is written.
