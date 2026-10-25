# ADR-024 — The family owner is a member of their own family

**Status:** Accepted
**Date:** 2026-10-25
**Implements:** L2-214, L2-215, L2-216, L2-217, L2-218; amends L2-001, L2-124, L2-128, L2-129, L2-165, L2-168.
**Related:** [ADR-016](ADR-016-family-ownership-and-member-sign-in.md), [ADR-019 Google](ADR-019-sign-in-with-google.md), [ADR-019 platform invitations](ADR-019-platform-invitations-and-prospect-families.md), [ADR-007](ADR-007-refresh-token-session-lifecycle.md).

## Context

ADR-016 made the account that creates a family its owner (`Family.OwnerUserId`) and let members sign in through a `FamilyMember` linked by `FamilyMember.UserId`. Nothing ever created a member for the owner. "Who's in" lists `FamilyMember` rows only, so the owner was missing from it: an invited member saw everyone but the person who invited her, the owner did not see themselves, and the planner planned without the owner's age. The owner showed up only as an email address in the non-owner subtitle.

## Decisions

### 1. The owner's member is an ordinary member linked by `UserId`

The owner is a `FamilyMember` whose `UserId` is the owner's account, exactly like an invited member who accepted (L2-127). No column, table or migration is added: `FamilyMember.UserId` and its unique filtered index (`[UserId] IS NOT NULL`) already exist from ADR-016, so an account links to at most one member and the database refuses a second. `FamilyProfileMapper` already reports such a member as `access: Account` with the account's email, so the owner's row reads "{name} · {Parent|Kid} · {age} · Signs in as {email}" for every account in the family with no new mapping. The planner reads members as before and so plans for the owner too.

`GET /api/family` gains `selfMemberId`: the member linked to the caller's own account, or `null`. It is the one fact the client needs both to recognise the owner's own row (no Remove, L2-218) and to know the owner still has to add themselves (L2-217). It is computed per caller from the members already loaded; nothing new is stored.

### 2. The name and age are captured on the create-account form

`/create-account` asks for "Your first name" and "Your age", and `POST /api/auth/register` carries them as `ownerName` and `ownerAge`. `RegisterUserCommandHandler` creates the owner's member with the family, in the same save. This is the one place a person starting a family types anything about themselves, so asking there costs a field each and needs no new screen.

The other ways to start a family have no such form, and the design does not add one:

- **Google sign-in** (ADR-019) creates the account from a Google ID token. The token carries a name but never an age, and age is required for a member.
- **Platform-invitation acceptance** (ADR-019) may land the owner in a prospect family whose members an administrator already described, one of whom is probably the invitee. Adding a second row would duplicate them; linking one would be a guess.
- **The first profile save of an account with no family** (ADR-016) has no person-shaped input.

Those owners meet the "Add yourself" row (decision 4) on the wizard's "Who's in?" step, which a new account reaches straight after signing up (L2-165), and on `/family`.

The API keeps both fields optional, as a pair: a request with neither still registers (the API tests and any older client keep working); a request with only one is refused with 400. The form always sends both.

### 3. No backfill

No migration creates or links members for existing families. The system cannot know an owner's name or age, and a listed member whose name matches the owner's (the seeded "Quinn" and quinntynebrown@gmail.com, say) proves nothing about who signs in, so it is not linked automatically either. Existing owners link themselves through decision 4.

`UserSeeder` may link a seeded account to a named seeded member when `users.json` says so (`memberName`). That is seed data stating a fact about a test household, not an inference about production data, and it stays idempotent: it links only a member with no account to an account with no member.

### 4. "This is me": add yourself or claim a member

Two owner-only requests link the caller (`FamilyOwnership.EnsureOwnerAsync`, so an ownerless family lets any of its accounts, as ADR-016 decision 1 does):

- `POST /api/family/members` with `self: true` adds a member linked to the caller instead of inviting anyone. `self` and `email` are mutually exclusive (400). No invitation and no email are created.
- `POST /api/family/members/{id}/claim` links an existing member of the caller's family (404 otherwise) that has no account and no outstanding invitation (`409 member_has_access` otherwise). An invited member is someone else's to accept; claiming them would hijack the invitation.

Either answers `409 already_in_family` when the caller already has a linked member. The owner's own row is then protected by rules that already exist: `RemoveFamilyMemberCommand` refuses it (`cannot_remove_owner`) and the profile save refuses to drop a member with an account (`member_has_access`), while renaming or re-ageing it by id keeps the link.

On the client, the "Add yourself" row heads the owner view of "Who's in" while `isOwner` and `selfMemberId` is `null`. D17b gains a "This is me" checkbox (not a third segmented option, which wraps at phone width) and D17 an "Is this you?" field with a "This is me" button for a member with no access, both only while the owner is unlinked.

### 5. The non-owner subtitle names the owner

With the owner's row on the list, a non-owner's subtitle reads "Only {owner's name} can change who's in." The client finds the owner's member as the `Account` member whose email is `ownerEmail`; when there is none it keeps the email (L2-124 AC4).

## Consequences

- An owner who registers through the form is in "Who's in" from the first screen of the wizard; every account in the family sees them.
- Owners from before this change, and owners who came through Google or an invitation, see one extra row until they add or claim themselves. Nothing changes for them until they do.
- The visual baselines of the family members section change (the seeded owner's row now signs in as them) and must be re-captured from the mocks (ADR-010).
- Deferred: letting a non-owner relink their own account to a different row, transferring ownership, and any per-member display name or avatar beyond what members already have.
