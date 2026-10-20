# ADR-019 — Platform invitations carry a sample weekend planned for a prospect family

**Status:** Accepted
**Date:** 2026-10-20
**Category:** administration, identity-and-access
**Deciders:** Quinntyne Brown
**Implements:** L2-157, L2-158, L2-159, L2-160, L2-161 (L1-038).
**Related:** [ADR-003](ADR-003-idempotent-generate-weekend.md) (planner idempotency), [ADR-014](ADR-014-separate-admin-application.md) (admin application), [ADR-016](ADR-016-family-ownership-and-member-sign-in.md) (invitation tokens, ownership), L2-142 (account mail).

## Context

Saturdaze had two ways in: registering, and an invitation from the owner of a family (ADR-016). Neither lets the people running Saturdaze reach a family that has not signed up, and neither shows a family what the planner would do for them before they commit. L1-038 asks for both: an administrator invites one or more addresses from Saturdaze Admin, and can plan a weekend for the prospective family first so the invitation opens on a plan made for them.

## Decision

1. **A prospect is a real family with no account.** `Prospect` points at an ordinary `Family` row (members, likes, home, `OwnerUserId` null) and at an ordinary `Weekend` row. The planner, the forecast, travel legs and the weekend mapper run unchanged on it; nothing in planning knows about prospects. Family-scoped endpoints cannot reach it because no `User.FamilyId` points at it until it is claimed. The administrator shapes the weekend with the family's own rules through `WeekendReplanner` and `BlockSwapper`, services extracted from the regenerate and swap handlers so the admin and family paths share one implementation.
2. **Platform invitations are a separate table from family invitations.** `PlatformInvitation` records the address, the token hash, the optional prospect, the inviting administrator, a 14-day expiry, acceptance and revocation. A family invitation (ADR-016) links an existing member of an existing family; a platform invitation creates a family or claims a prospect. Keeping them apart keeps each resolver and each accept path simple. Status (`Pending`, `Accepted`, `Expired`, `Revoked`) is derived at read time, never stored.
3. **Tokens follow ADR-016 decision 3.** Only a SHA-256 hash is stored; the raw token lives in the email and in the link returned once to the administrator, who is entitled to invite that person. Links are single use. A revoked or accepted link answers `token_invalid`, an expired one `token_expired`, and nothing else is revealed.
4. **Email is the delivery path, the outbox is the mechanism.** The handler saves first and enqueues one message per address through `IEmailOutbox` (L2-142), so the request never waits on SMTP and a delivery failure never fails it. The batch is all-or-nothing: an address that already signs in or already holds a pending invitation refuses the whole request before any row or message exists, so an administrator never half-sends.
5. **The first invitee claims the prospect; later invitees join it.** Accepting an invitation that carries an unclaimed prospect sets `Family.OwnerUserId` to the new account and marks the prospect claimed; the sample weekend is simply the family's weekend from then on. A second address invited with the same prospect joins that family as a member without ownership, the same relationship ADR-016 gives an invited member. An invitation without a prospect creates an empty family owned by the account, as registration does, minus the verification email: the link already proved the address.
6. **The join page is a site-shell page in the family application.** `/join?token=…` renders the sample weekend read-only through the `SharedWeekendDto` projection (L2-086 AC7) beside the create-account card, so an anonymous visitor sees exactly what a share-link viewer may see and nothing more.

## Options Considered

### Option 1: A prospect is a family with no account (chosen)
- **Pros:** No second planner input, no second weekend shape; claiming is two column writes; the sample is the family's weekend afterwards.
- **Cons:** Prospect families accumulate when invitations expire unaccepted. A clean-up command is left for later.

### Option 2: Store the sample weekend as a document on the invitation
- **Pros:** No family rows until acceptance.
- **Cons:** A second rendering path for the days, no swap or lock without re-implementing planner state, and the plan would have to be re-created on acceptance.

### Option 3: Extend `FamilyInvitation` with a nullable prospect
- **Pros:** One table.
- **Cons:** The family resolver, the member link and the accept handler would branch on every step; the two invitations have different owners, lifetimes and outcomes.

## Consequences

### Positive
- The administrator's "customize" is the family's own regenerate, swap and lock; there is no admin-only planning logic to keep in step.
- One invitation per address keeps revocation, acceptance and expiry per person.

### Negative
- A prospect whose invitations all expire keeps its family and weekend rows; `saturdaze` gains no clean-up command in this change.
- `Prospect` references `Weekend` and `Family` with restricted deletes, so deleting either row needs the prospect removed first.

### Risks
- An invitee who already registered with the same address cannot accept (409 `email_in_use`); the administrator sees the refusal at send time when the account already exists, but not when it is created between sending and accepting. The join page shows the error and offers sign-in.
