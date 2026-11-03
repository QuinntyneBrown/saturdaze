# ADR-025 — Couples date planning

**Status:** Accepted
**Date:** 2026-11-03
**Implements:** L2-219, L2-220, L2-221, L2-222, L2-223, L2-224, L2-225 (L1-042); amends L2-011, L2-016, L2-019, L2-085.
**Related:** [ADR-003](ADR-003-idempotent-generate-weekend.md), [ADR-005](ADR-005-bottom-nav-device-chrome-clearance.md), [ADR-008](ADR-008-per-user-family-scoping-and-auth-fallback.md), [ADR-022](ADR-022-calendar-sync.md), [ADR-023](ADR-023-agentic-weekend-planning.md).

## Context

Saturdaze plans whole-family weekends: every block is for everyone in "Who's in", and meals are restaurant picks for lunch and dinner. Parents asked for time for just the two of them. A date has a different audience (two adults, not the family), a different shape (a meal, maybe a walk or a gallery, the drives) and a meal the planner never plans (breakfast). It must still fit the weekend: it may not clash with the attendees' commitments, and the family's plan has to make room for it.

## Decisions

### 1. A date is its own aggregate, tied to a weekend

`CoupleDate` is a table of its own with `WeekendId` (cascade delete), not a set of flagged `ItineraryBlock`s. A date has attendees, a meal, rejected restaurants and activities and a regenerate count, none of which belong on a block, and it has its own lifecycle (swap, move, regenerate, cancel) that must not be disturbed by the weekend's (regenerate, swap, lock). Its steps (drives, meal, activity) are stored as JSON on the date, like `WeekendDraft.PicksJson`: they are read whole and never queried. One unique index on `(WeekendId, Day, Meal)` enforces one date per meal per day.

### 2. The weekend sees one locked `Date` block

On the family weekend the date is a single block of the new kind `BlockKind.Date`, spanning the date, locked, with `RefId` = the date's id and no stop. Every existing path already treats a locked block as fixed: `WeekendPlanner.BuildFixedBlocks()`, `WeekendReplanner`, the day regenerate and the agents' `DraftApplier` keep it and plan around it, so the planner needed no new input. The family's day pauses for the date's window, which is what "the kids need care" means; the block's reason says so and the API returns who needs care. The block cannot be unlocked (`date_locked`), a day unlock leaves it locked, the swap path refuses it, and repeat and remix do not copy it, because the date belongs to its own weekend.

### 3. Idempotency follows ADR-003; regenerate is explicit

`POST /api/weekends/{id}/dates` returns the existing date for a meal and day that already has one, unchanged, as `POST /api/weekends/plan` does for a weekend. The explicit reseat is `POST …/dates/{dateId}/regenerate`. Regenerating the **weekend** never re-plans a date; it keeps the date block like any lock. Every change to a date re-plans only the affected day (both days on a move across days) through `WeekendReplanner.ReplanDayAsync()`, which keeps that day's locked blocks, so a date never reshuffles the other day.

### 4. The deterministic `DatePlanner` reuses the weekend planner's rules

`DatePlanner` reads the same `PlannerContext` (family home and drive times, profile, preferences, calendar commitments, sunsets) and applies the same `CandidateFilter` rules to activities, evaluated for the two attendees. Restaurants have no opening hours in the catalog, so the meal's window (breakfast 8:00–10:30, lunch 11:30–14:00, dinner 17:30–21:00) stands in for them; activities keep their hours and the sunset rule. When nothing fits, the API says why (409 `no_restaurant_fits` or `date_clash`) rather than inventing a place.

### 5. Agents do not draft dates yet

The planner handles dates first (ADR-023's rule that agents propose and the planner disposes would apply unchanged later). An agent-drafted weekend keeps any date block because it is locked. Agent-drafted dates are deferred.

### 6. A block on `/weekend` and its own screen, not a fifth navigation item

The four-item navigation is a fixed contract (`nav-key.ts`, ADR-005's chrome clearance is tuned for it). A date is part of a weekend, so its entry point is "Plan a date" on `/weekend`, it shows in its day's timeline, and its detail is a screen under the Weekend item, `/weekend/dates/{id}`. Every edit opens a CDK dialog; nothing is edited inline.

### 7. Breakfast is a meal slot, not a weekend meal

`MealSlot.Breakfast = 3` is added after the existing values so stored integers keep their meaning. The catalog, seeds, ingestion, votes, locks and `/ideas/food` accept it. The family weekend planner still reserves only lunch and dinner (L2-186); breakfast reaches the weekend only through a date or a family's explicit lock.

## Consequences

- A migration (`AddCoupleDates`) adds one table; nothing else in the schema changes.
- Calendar sync (ADR-022) writes the `Date` block like any other block; no date-specific event is written.
- Saturdaze books nothing: no restaurant, activity or childcare booking, and no payment.
- Deferred: dates outside a weekend, recurring date nights, dates for anyone but two adults, agent-drafted dates, reminders.
