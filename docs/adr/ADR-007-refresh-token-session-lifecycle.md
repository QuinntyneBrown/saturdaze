# ADR-007 — Refresh-token rotation and server-side sign-out

**Status:** Accepted
**Date:** 2026-09-01
**Implements:** [L2-002](../specs/L2.md#l2-002-user-login-returns-tokens-and-rotates-refresh), [L2-003](../specs/L2.md#l2-003-sign-out-revokes-the-active-refresh-token), [L2-007](../specs/L2.md#l2-007-remember-me-toggle-controls-token-persistence), [L2-033](../specs/L2.md#l2-033-refresh-tokens-rotate-and-track-creator-ip).
**Related:** [ADR-008](ADR-008-per-user-family-scoping-and-auth-fallback.md).

## Context

Login and registration minted a 14-day refresh token and returned it, but nothing ever consumed it: there was no refresh endpoint, no logout endpoint, and the Angular client threw the refresh token away and persisted only the 15-minute access token. Every session therefore ended after fifteen minutes with a bounce to `/login`, "remember me" was a fifteen-minute promise, and sign-out revoked nothing on the server. The detailed designs for sign-out and secure requests both recorded the gap as `<TO SUPPLY>`.

## Decisions

### 1. Rotation on `POST /api/auth/refresh`

- The body carries the raw refresh token; the server hashes it and looks up the row.
- A live row is revoked (`RevokedAtUtc`), a replacement row is issued, and the old row's `ReplacedByTokenId` points at it. The response is the same `AuthSuccessDto` shape as login, so the access token is re-minted with the user's *current* role and `family_id` claims.
- Missing, revoked and expired tokens all return `401 { code, message }` with `refresh_token_invalid`, `refresh_token_revoked` or `refresh_token_expired`. The only client recovery is a fresh sign-in.
- Reuse of a rotated token is **not** treated as theft (no "burn the whole token chain"). With two tabs racing the same token that policy signs the user out everywhere; a plain 401 for the loser is the better trade for a family planner.
- Login keeps multi-session semantics: signing in again does not revoke earlier sessions (L2-033 AC1 explicitly permits it). Password reset still revokes everything.
- Every timestamp on this path comes from `IDateTimeProvider`; only the JWT itself is stamped with the real clock. Tests pin the fake clock per test.

### 2. `POST /api/auth/logout` is anonymous and idempotent

The refresh token in the body is the credential. The access token is frequently already expired when the user taps Sign out, and a 401 there would make the interceptor bounce them to `/login` mid sign-out. Unknown or already-revoked tokens return 204 like any other, so the endpoint never reveals whether a token existed; when a bearer *is* present, a token belonging to a different user is ignored.

### 3. The client owns the silent refresh

`AuthToken` now carries `refreshToken`, persisted next to the access token in whichever storage tier remember-me selected. `SessionStore.refreshSession()` is single-flight; rehydrate refreshes when the access token is expired or within 60 seconds of expiry, otherwise it calls `/me`. The HTTP interceptor refreshes proactively inside that skew window, retries a request exactly once after a 401, and never refreshes for `/refresh` or `/logout` themselves. Before refreshing it re-reads storage so a newer pair another tab already persisted is adopted instead of burned.

### 4. `RefreshTokenIssuer` is the single minting site

Login, register, reset-password and refresh all issue through `RefreshTokenIssuer.Issue()`, which is where the 14-day lifetime, the SHA-256 hashing and the `CreatedByIp` capture live.

## Consequences

- `ReplacedByTokenId`, removed by the 2026-06 dead-code sweep as unused, is back by design (migration `AddRefreshTokenRotation`).
- Sessions survive as long as the refresh token does (14 days of inactivity), and sign-out is real.
- Reused refresh tokens surface as a 401 rather than as a security event; if the app ever handles anything more sensitive than weekend plans, revisit decision 1.
