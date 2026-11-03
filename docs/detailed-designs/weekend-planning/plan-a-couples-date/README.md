# Plan a couple's date

## Overview

Saturdaze is a web application that plans personalized family weekends. This feature lets the two adults of a family have Saturdaze pre-plan a date for themselves alongside the family weekend: breakfast, lunch or dinner on Saturday or Sunday, at a restaurant that serves that meal, with an optional nearby activity, fitted around their commitments, while the children stay on the family plan (L1-042).

*date* — a `CoupleDate`: two adults, one meal on one day of one weekend, its restaurant, its optional activity and its steps (drives, meal, activity) in time order

*date block* — the single locked itinerary block of kind `Date` that stands for a date on the family weekend; the family plan pauses for its window

*busy time* — what a date may not overlap on its day: commitments for everyone or for either attendee, calendar commitments, the weekend's locked blocks and the day's other dates

*kids need care* — the members under 18 who are not on the date, and the date's window, shown so the family can arrange care; Saturdaze books nothing

The deterministic planner stays the authority (L1-041, ADR-023): `DatePlanner` chooses from the catalogs with the rules `WeekendPlanner` uses, and the weekend planner treats the date block as a fixed block. Agents do not draft dates in this version (ADR-025, decision 5).

## Description

**Model.** `CoupleDate` (Domain) is its own aggregate tied to a weekend (ADR-025, decision 1): `Id`, `FamilyId`, `WeekendId` (cascade delete with the weekend), `Day` (`DayOfWeekend`), `Meal` (`MealSlot`), `StartTime` and `EndTime` (first drive to last drive), `AttendeeMemberIds` (`List<Guid>`, delimited like `Commitment.AttendeeMemberIds`), `RestaurantId`, `ActivityId` (nullable), `ActivityDropped`, `RejectedRestaurantIds` and `RejectedActivityIds` (delimited), `StepsJson` (the planned steps with their titles, times, reasons and stops, serialized like `WeekendDraft.PicksJson`, so the record survives catalog edits), `RegenerateCount` and `CreatedUtc`. A unique index on `(WeekendId, Day, Meal)` holds one date per meal per day. `MealSlot` gains `Breakfast = 3` and `BlockKind` gains `Date = 8`, both stored as integers, so existing rows are untouched. Migration `AddCoupleDates` creates `CoupleDates`.

**API.** `DatesController` (`api/weekends/{weekendId}/dates`, authenticated, ADR-008) sends MediatR requests and holds no rules:

| Endpoint | Request | Result |
| --- | --- | --- |
| `GET …/dates` | `GetDatesQuery` | `CoupleDatesDto { dates, adults, canPlan, reason }` |
| `POST …/dates` | `PlanDateCommand(day, meal, attendeeMemberIds?)` | `CoupleDateDto`, existing one if the meal and day already have a date (ADR-003) |
| `PUT …/dates/{dateId}` | `ChangeDateCommand(Move, day, meal)` | `CoupleDateDto`; 409 `date_slot_taken` |
| `POST …/dates/{dateId}/regenerate` | `ChangeDateCommand(Regenerate)` | `CoupleDateDto` |
| `POST …/dates/{dateId}/swap-restaurant` | `ChangeDateCommand(SwapRestaurant)` | `CoupleDateDto`; 409 `no_restaurant_fits` |
| `POST …/dates/{dateId}/swap-activity` | `ChangeDateCommand(SwapActivity)` | `CoupleDateDto`; 409 `no_activity_fits` |
| `DELETE …/dates/{dateId}/activity` | `ChangeDateCommand(DropActivity)` | `CoupleDateDto` |
| `DELETE …/dates/{dateId}` | `CancelDateCommand` | 204 |

Every handler resolves the family with `ICurrentFamilyAccessor` and loads the weekend and date by id **and** family; anything else is `NotFoundException` (404). `PlanDateCommand`, `ChangeDateCommand` and `CancelDateCommand` implement `IChangesItinerary`, so a connected Google Calendar follows the date block (ADR-022).

**Validation.** `PlanDateCommandValidator` and `ChangeDateCommandValidator` (FluentValidation) reject an unknown meal or day (400). `DateAttendees.Resolve()` turns the request into two members: named ids must be exactly two distinct ids (400), each a member of the caller's family (404 otherwise, so a probe learns nothing) and 18 or over (400); without ids it takes the two oldest adults, or 400 "A date needs two adults (18 or over)". `DateWindow.Check()` refuses a weekend before `GetCurrentWeekendQueryHandler.ResolveUpcomingSaturday(today)` or more than seven days after it (400 on `weekendId`).

**Planning.** `DatePlanner.Plan(DateRequest)` is deterministic and pure. Its input carries the `PlannerContext` from `PlannerInputLoader.LoadAsync()` (home, family drive times, profile, preferences, calendar commitments, sunsets), the attendees, the day and meal, the busy intervals, the family's votes and the restaurant locked for that day and meal, and the rejected ids. It:

1. Ranks the restaurants of the meal that pass `DatePlanner.RestaurantExclusion()` (drive within `MaxDriveMinutes`, `WifeApproved`, not disliked by name or style, no excluded theme in name or style): a locked one first, then +3 per liked tag matched, then up votes minus down votes, then the family drive time, then the name. None passes → `ConflictException("no_restaurant_fits", "No breakfast spot fits …")`.
2. For each ranked restaurant, tries meal starts every 15 minutes from the window's start (`DateTimes.Window(meal)`: breakfast 8:00–10:30, lunch 11:30–14:00, dinner 17:30–21:00; the 90-minute meal inside the window) and takes the first whose span, drive there to drive home, overlaps no busy interval. When restaurants pass but none fits → `ConflictException("date_clash", "… clashes with {title}")`.
3. Unless the activity was dropped, adds a 60-minute activity after the meal (breakfast, lunch) or before it (dinner): candidates from `CandidateFilter.Exclusion()` evaluated for the attendees only (so ages are the adults'), kind activity, not rejected, within 15 minutes of the restaurant by `TravelEstimator`, ordered by distance then name; the first whose visit sits inside its opening hours, ends by sunset outdoors, and whose new span still avoids busy time. None → no activity, and the date is just the meal.
4. Builds the steps: "Drive to …", the meal ("Dinner at {name}", reason from the ranking: "locked by family vote", "2 votes up", "near home"), the transfer as part of the activity's reason ("5 min from {restaurant}"), the activity, "Drive home from …".

Busy intervals come from `DateBusyTime.For(context, weekend, day, attendees, exceptDateId)`: commitments that day whose `AttendeeMemberIds` is empty or contains an attendee; calendar commitments; locked blocks on that day except `Date` blocks; and the other dates' blocks on that day.

**Fitting the weekend.** `DateWeekendSync.ApplyAsync(weekend, date, ct)` removes the weekend's old `Date` block for the date (by `RefId`) and adds one locked block of kind `Date` from `StartTime` to `EndTime`, titled "{Meal} date at {restaurant}", reason "{names}" plus "; kids need care {start}–{end}" when children stay home, no `Stop` (so `ItineraryTravel` leaves the family's journey at home). It then calls `WeekendReplanner.ReplanDayAsync(weekend, familyId, day, ct)` for each affected day (both days on a move across days), which keeps the other day and the day's locked blocks, re-plans the rest with `IWeekendPlanner.Plan()` and saves; `RegenerateWeekendDayCommandHandler` now calls it too. `WeekendPlanner.BuildFixedBlocks()` already carries locked blocks of any kind, so meals and outings go around the date. Cancelling removes the block and re-plans the day. To keep the date block fixed: `LockBlockCommandHandler` refuses to unlock it (409 `date_locked`), `LockWeekendDayCommandHandler` keeps it locked when a day is unlocked, `BlockSwapper` already refuses non-activity blocks, and `ReuseWeekendCommandHandler` leaves `Date` blocks out of a repeated or remixed weekend.

**Breakfast.** `PlannerTimes` gains the breakfast window. Seeds (`Saturdaze.Cli/Seed/Data/restaurants.json` and the API tests' seed) add breakfast places keyed by `(Name, Slot)`, so re-seeding is idempotent. `IngestionPrompts` lists "Breakfast" among the slots; the parser and upserter already accept any defined `MealSlot`. `LockRestaurantCommandHandler` places a breakfast lock at 8:30 and its `IsSlot()` splits the day at 11:00 and 15:00, so a breakfast lock never takes the lunch block. `WeekendPlanner.ReserveMeals()` still plans only lunch and dinner.

**Past.** `GetWeekendHistoryQueryHandler` loads the page's dates and maps `WeekendSummaryDto.Dates` (`DateSummaryDto`: day, meal, restaurant name, attendee names). Rating stays per weekend (L2-026).

**Frontend.** The `api` library adds `couple-date.dto.ts`, `couple-date-view.ts`, `DATE_SERVICE` (`date.service.contract.ts`, `date.service.ts`: `list`, `plan`, `move`, `regenerate`, `swapRestaurant`, `swapActivity`, `dropActivity`, `cancel`) and maps `kind` `Date` blocks in `weekend-projection.ts` (icon `heart`, chips "Date" primary and "Kids need care {window}" warn, not swappable or lockable, opening the date's screen). `MealSlot` gains `Breakfast`, and `/ideas/food` gets a "Breakfast" filter. On `WeekendPage` "Plan a date" opens `PlanDateDialog` (D38/D38b) with the result of `GET …/dates`; confirming plans the date and navigates to `/weekend/dates/:id`. `DatePage` (route `weekend/dates/:id`, under the Weekend nav item) shows the header, the care banner, the steps, and the actions that open `SwapRestaurantDialog` (D39), `DateActivityDialog` (D40), `MoveDateDialog` (D41), and `confirmWith` for regenerate (D42) and cancel (D43). A 409's `detail` shows in a warn banner. `PastPage` shows each weekend's date line. No component in `components` changes: `sd-block`, `sd-chip`, `sd-seg-radio` and `sd-banner` cover it.

**Tests.** `Saturdaze.Api.Tests/Dates/` drives the API (one class per slice), `Saturdaze.Application.Tests` covers `DatePlanner` alone, and `e2e/tests/couple-date.spec.ts` with the `DatePage` and `WeekendPage` page objects runs the UI in Chromium.

## Requirements

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-219` | `L1-042`, `L1-003`, `L1-005` | Plan a date for two adults: meal, day, default attendees, 90-minute meal in its window, steps, one date per meal per day, idempotent re-ask, `GET …/dates`. |
| `L2-220` | `L1-042`, `L1-005`, `L1-031` | Breakfast is a meal slot in the catalog, seed, ingestion, locks and food ideas. |
| `L2-221` | `L1-042`, `L1-037`, `L1-012` | Two adults of the caller's family on the current or next weekend; 400, 404, 409. |
| `L2-222` | `L1-042`, `L1-003`, `L1-040` | No clash with the attendees' busy time; the date block; the weekend planned around it; kids need care. |
| `L2-223` | `L1-042`, `L1-004` | The optional activity; swap restaurant, swap or drop activity, move, regenerate, cancel. |
| `L2-224` | `L1-042`, `L1-041` | The family's drive, approvals, dislikes, observances, likes, votes and locks; no invented places; 409 `no_restaurant_fits`. |
| `L2-225` | `L1-042`, `L1-034`, `L1-011` | "Plan a date" on `/weekend`, the date block, `/weekend/dates/{id}`, its dialogs and states, and `/past`. |

## Diagrams

### Components

The component view shows the date endpoints, their handlers, the date planner beside the weekend planner, and the sync that keeps the weekend's date block and re-plans the day.

![C4 component view for planning a couple's date](diagrams/c4-component.png)

### Class structure

The class view shows the `CoupleDate` aggregate, its steps, the planner's request and the services that keep the weekend in step.

![Class diagram for planning a couple's date](diagrams/class-structure.png)

### Behaviour — plan a date

This sequence traces `L2-219`, `L2-221`, `L2-222` and `L2-224`: validation, attendees, busy time, the planner's choice and the weekend planned around the new date block.

![Sequence diagram for planning a date](diagrams/sequence-plan-date.png)

### Behaviour — change or cancel a date

This sequence traces `L2-223`: every change re-plans the date with what was rejected, rewrites the date block and re-plans the affected days.

![Sequence diagram for changing a date](diagrams/sequence-change-date.png)
