# Bug 009 — `SavedService` still returns hand-authored data; not HTTP-backed

## Symptom

The "Saved weekends" page renders the same three weekends (Bronte Creek
+ Rec Room, Stay-home reset, Zoo + lavender preview) regardless of what's
in the database. Marking any past weekend as a favourite via the API has
no effect on the page.

## Root cause

`projects/api/src/lib/services/saved.service.ts` returns a module-level
`DEMO_VIEW` constant. The backend supports `GET /api/weekends/history`
returning `WeekendSummaryDto[]`, but no client code calls it.

There's a deeper issue too: the page expects a `SavedView` with filter
chips, a `recent` list of cards (date / title / rating / highlights /
favourite), and an `avoid` list with title / subtitle / icon. The
backend's `WeekendSummaryDto` has only `(Id, WeekendOf, IsFavourite,
RegenerateCount, BlockCount, ActivityHighlights[])` — no rating, no
title, no "avoid" concept. The mapping is non-trivial and the data
model is incomplete.

## Impact

- Family changes are not reflected in saved history.
- Re-running the seeder + planner has no observable effect on this page.
- Goal acceptance criteria ("data is persisting to the database and
  coming from the database") is partially false.

## Fix

Two-step:

1. **Domain model gap.** Add `Title` (denormalised highlight name) and
   `Rating` (user-supplied 1–5) to the `Weekend` entity. Surface them in
   `WeekendSummaryDto`. The "avoid" list is presentation-only and can
   stay client-side (a chip on history rows the user wants to skip).
2. **Wire the service.** Rewrite `SavedService.list()` to call
   `GET /api/weekends/history?take=20`. Map each row to a `SavedWeekend`
   and split into `recent` + `avoid` by a rating threshold.

Until step 1 lands, the page can render zero history on a fresh DB — at
which point it should fall through to the `sd-empty` state.

## Status

- Logged: 2026-05-16
- Pending. The page renders correctly against the mocks today only
  because `DEMO_VIEW` was hand-authored to match the visual reference.
