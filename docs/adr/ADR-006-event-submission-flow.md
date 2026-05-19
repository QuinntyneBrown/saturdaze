# ADR-006 — User-contributed events use a moderated separate-table flow

**Status:** Accepted
**Date:** 2026-05-18
**Implements:** [L1-018](../specs/L1.md#l1-018-user-contributed-local-events) and [L2-046 → L2-050](../specs/L2.md).
**Plan:** [User-Contributed Local Events — Implementation Plan](../user-contributed-events-plan.html).

## Context

The events catalogue was previously a curated read-only table seeded from `local-events.json`. Families could see what we put there and nothing else. Three design choices were on the table when adding user submissions; this ADR records what we picked and why.

## Decisions

### 1. Submitter notification: status visible in their feed only

Rejected:
- A new `Notifications` table + an unread-count badge in the top bar.
- Email delivery via the existing forgot-password plumbing (currently a dev-stub anyway).

Chosen:
- The submitter sees their own pending submission on `/events` with a **Pending review** chip; once approved it becomes a normal event card; once rejected it disappears and the moderator's reason is visible on the `/mine` endpoint.

**Why:** matches the radically-simple ethos — no background jobs, no provider integration, zero new tables for a feature whose primary signal is *did the event become public yet*. The submitter is already returning to `/events` to see what's on the weekend; they'll notice. If notification needs grow (regenerate-finished, share-accepted, etc.), the right move is a proper notifications subsystem, not an event-submission-specific hack.

### 2. Admin entry point: link inside Profile when `role === 'Admin'`

Rejected:
- A fifth tab on the bottom-nav. Breaks the fixed-4 contract; reduces tap-target size for the four 99% items so the 1% admin item is reachable.
- A URL-only `/admin/events` with no UI affordance. Cheap, but harder to discover for new admins.

Chosen:
- The Profile page renders an **Admin tools → Event moderation** list-item, gated by `session.user()?.role === 'Admin'`. Bottom-nav unchanged.

**Why:** admins are a tiny minority of users and they're not on `/admin/events` daily. Burying it inside Profile keeps the primary UI focused on family-planning while still being one tap away when an admin opens the app.

### 3. Data model: separate `EventSubmissions` table; copy into `LocalEvents` on approve

Rejected:
- A `Status` column on the existing `LocalEvents` table. Every read path (`GET /api/events`, planner suggestions, daily-rhythm hints) would need a `WHERE Status = Approved` filter, and the public DTO would gain a field nobody outside moderation cares about.

Chosen:
- New `EventSubmissions` table with full moderation metadata (`SubmittedByUserId`, `SubmittedAtUtc`, `Status`, `ReviewedByUserId`, `ReviewedAtUtc`, `RejectionReason`, `PublishedEventId`). On approve, the handler creates a new `LocalEvents` row and back-links via `PublishedEventId`.

**Why:** the public read path stays a one-table query and the public DTO doesn't change shape. The moderation table can grow independent fields without affecting the catalogue (e.g. submitter agreement to terms, anti-spam fingerprints, future appeal workflow). The "duplicate" of the row on approve is fine — events are immutable curated content once approved.

## Consequences

- A `LocalEvents` row whose `Id` lives in some `EventSubmissions.PublishedEventId` is now a normal curated row. There's no UI distinction once approved, which is the point.
- Re-approving an already-approved submission is a no-op. Approving a previously-rejected submission throws `409 conflict` — moderators must un-reject first (not implemented yet; YAGNI until requested).
- Drive-time auto-calculation is not part of this flow; admins set `DriveMinutes` when approving (or leave it null so the public card omits the drive chip). Building geocoding into the submission form is a future change.
- No email or push lands when a submission is approved or rejected. If a submitter never returns to `/events`, they will never see the outcome. We accept that for v1.
