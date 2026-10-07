# ADR-016 — Family ownership and member sign-in

**Status:** Accepted
**Date:** 2026-10-07
**Implements:** L2-124, L2-125, L2-126, L2-127, L2-128, L2-129.
**Related:** [ADR-007](ADR-007-refresh-token-session-lifecycle.md), [ADR-008](ADR-008-per-user-family-scoping-and-auth-fallback.md) (supersedes its decision 2's claim-first lookup).

## Context

Until now one account meant one family: registration created a `Family` and pointed the new `User.FamilyId` at it. `FamilyMember` rows were only names and ages that the planner reads. Nothing recorded who owned a family, and nothing stopped a second account that pointed at the same family (the seeded admin, test accounts) from rewriting its member list.

L1-037 asks for three things: the account creator owns the family; the owner invites members who sign in with their own credentials; and the owner adds members who never sign in, or removes members.

## Decisions

### 1. Ownership is a column on `Family`

`Family.OwnerUserId` (nullable, no foreign key, so `Users` and `Families` do not reference each other in a cycle) records the owner. Registration and the first profile save that creates a family set it. The migration backfills each existing family with its earliest-created account (`CreatedAtUtc`, then `Id`). `UserSeeder` sets it when it attaches a seeded account to a family that has no owner yet.

A family that still has no owner (one created by `FamilySeeder` and never claimed by an account) lets every account that belongs to it manage members. That keeps the shared seeded household usable by the API test suite and by legacy data, and it does not widen access for any family that has an owner.

Owner-only operations throw `ForbiddenException`, which the exception middleware maps to `403` ProblemDetails with code `owner_only`. A 403 is right here, unlike ADR-008's "ownership is a 404": the caller already belongs to the family and can see its members, so the response reveals nothing new.

### 2. A member's access is derived, not stored as a flag

`FamilyMember.UserId` (nullable, unique when set) links a member to the account they sign in with. A `FamilyInvitation` row (`FamilyMemberId` with a cascading foreign key, `Email`, `TokenHash`, `ExpiresAtUtc`, `AcceptedAtUtc`, `InvitedByUserId`) records an outstanding invite. `access` in the API is computed: `Account` when `UserId` is set, `Invited` when an unaccepted invitation exists, `None` otherwise. There is no "child" flag: a member added without an email is, by construction, one who cannot sign in.

### 3. Invitations are capability links that the owner shares

There is no email provider (the same reason `AuthController.DevDelivery` exists), so the invite response returns the raw token and the full link, built from `Saturdaze:Share:AppOrigin`, to the owner who created it, in every environment. The owner is entitled to add that person to the family, so handing the owner the link adds no capability. Only a SHA-256 hash of the token is stored (the refresh-token hashing in `IJwtTokenService`), so the link cannot be recovered later; the owner removes and re-invites instead. Invitations are single-use and expire after 7 days.

An email that already belongs to an account cannot be invited (`409 email_in_use`). Moving an existing account, with its own family and weekends, into another family is out of scope.

Accepting creates the account with `EmailVerifiedUtc` set (only the invited address could have received the link), links it to the member, marks the invitation accepted and issues tokens through `RefreshTokenIssuer`, exactly as registration does.

### 4. Removing a member with an account deletes the account

The member's account exists only because the owner invited it into the owner's family. Removing the member deletes the `User`; its refresh tokens, verification and reset tokens and avatar cascade. Detaching it instead would leave a login with no family, which would then silently create a new family on its first profile save.

### 5. The family lookup reads the database on every request

ADR-008 decision 2 used the `family_id` claim first, accepting that a stale claim lives for up to fifteen minutes. A removed member's access token would therefore keep reading the family for up to fifteen minutes. `CurrentUserFamilyAccessor` now reads `Users.FamilyId` by primary key once per request scope (it was already cached per scope) and treats a missing user as unauthenticated (`401`). The claim is still minted for clients but is no longer trusted for scoping.

### 6. Member-list changes are owner-only in both write paths

`POST /api/family/members` and `DELETE /api/family/members/{id}` are owner-only. `PUT /api/family` still saves everything else for every member of the family, but a non-owner whose payload changes the member list gets `403 owner_only`, and any caller whose payload drops an `Invited` or `Account` member gets `409 member_has_access`, so access is always revoked through the delete path.

## Consequences

- One extra primary-key read per authenticated request that touches family data.
- An invite link that the owner loses cannot be shown again; removing the pending member and inviting again issues a new one.
- Ownership cannot be transferred, and the owner cannot leave or delete the family. Both are left for a later requirement.
- The anonymous auth surface grows by `POST /api/auth/invitation` and `POST /api/auth/accept-invitation` (L2-008).
