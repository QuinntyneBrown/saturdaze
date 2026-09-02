# ADR-008 — Per-user family scoping and a global authorization fallback

**Status:** Accepted
**Date:** 2026-09-01
**Implements:** [L2-008](../specs/L2.md#l2-008-jwt-protected-endpoints-require-a-valid-bearer-token), [L2-009](../specs/L2.md#l2-009-family-profile-view-returns-the-callers-family), [L2-014 #4](../specs/L2.md#l2-014-block-lock-toggle-is-idempotent).
**Related:** [ADR-003](ADR-003-idempotent-generate-weekend.md), [ADR-007](ADR-007-refresh-token-session-lifecycle.md).

## Context

Two defects made every family's data visible to every account:

1. Only `AuthController.Me` and the event-submission endpoints carried `[Authorize]`. Weekends, blocks, errands, the family profile, restaurant votes and locks, activities, events and the pipeline probe were all anonymous.
2. `SingleFamilyAccessor` resolved "the current family" as the first `Family` row ordered by `HomeLocation`. Registration creates a family with an empty `HomeLocation` for every new account, and the empty string sorts first, so the newest empty family became everyone's family. The JWT already carried a `family_id` claim that nothing read.

Handlers that took a weekend, block or errand id never checked ownership either, so any caller could read or mutate any weekend by id.

## Decisions

### 1. Fallback policy: everything requires a bearer unless it opts out

`Program.cs` sets `AuthorizationOptions.FallbackPolicy` to `RequireAuthenticatedUser` pinned to the JWT scheme. Anonymous surface is explicit with `[AllowAnonymous]`:

- the auth endpoints (`register`, `login`, `refresh`, `logout`, `forgot-password`, `reset-password`, `verify-email`, `resend-verification`);
- `GET /api/weather` (no PII);
- `GET /api/weekends/shared/{token}` and `GET /api/weekends/{id}/calendar.ics` — capability URLs handed to the browser, `webcal:` and Google Calendar, which cannot attach a bearer. Possession of the weekend id *is* the share capability (the token is the base64 GUID).

`GET /api/activities`, `/api/restaurants` and `/api/events` were listed as public in the original L2-008, but they are personalized per family (votes, locks, novelty history), so they require a bearer and the spec was amended.

Swagger is plain middleware; the authorization middleware applies the fallback even when there is no endpoint, so Swagger is registered above `UseAuthentication` and only outside Production. `POST /api/_ping` stays authenticated and doubles as the "fallback policy is on" probe.

### 2. `CurrentUserFamilyAccessor`

The `family_id` claim is used first; when it is absent the accessor falls back to `Users.FamilyId` (tokens minted before a family existed). Unauthenticated callers get `InvalidCredentialsException` (401); accounts with no family get `NotFoundException`, which the first-time profile save catches to create and link a family. The value is cached per request scope so nested MediatR sends share one lookup.

### 3. Ownership is a 404, never a 403

Every weekend, block and errand handler adds `w.FamilyId == familyId` to its query (block and errand handlers load the weekend through `Blocks.Any(...)` / `Errands.Any(...)`). Another family's id is indistinguishable from a non-existent one, so the API leaks nothing about what exists. `GetSharedWeekendQuery` is the single unscoped read and is used only by the two anonymous capability routes.

### 4. Every account owns a family

Registration already created one; the seeder now does too (`UserSeeder` creates an empty family when no household matches), and the first profile save links the caller when their account has none. The seeded admin joins the Port Credit household.

## Consequences

- API tests sign in through `SignedInClient` (register → set family/role in the database → re-login) instead of anonymous clients; `WeekendOwnershipTests` and `AuthorizationPolicyTests` pin the behaviour.
- A stale `family_id` claim survives for up to fifteen minutes after an account is re-pointed at another family; `POST /api/auth/refresh` re-mints the claim.
- The Angular app must hold a session before calling any catalog endpoint; the guarded routes already guarantee that.
