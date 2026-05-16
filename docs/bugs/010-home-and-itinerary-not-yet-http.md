# Bug 010 — Home and Itinerary still use static `WeekendPlanService` data

## Symptom

The Home page ("This Weekend") and the Itinerary page render hand-authored
content from `projects/api/src/lib/services/weekend-plan.service.ts`. The
backend's `POST /api/weekends/plan` and `GET /api/weekends/current` are
never called.

## Root cause

The Home view shape (`WeekendOverview`: greeting, hero subtitle, forecast,
two day cards with chips, anticipations, quick actions, 5-block preview)
and the Itinerary view shape (`ItineraryView`: day header, chips, day
switcher, weekend totals, 10-block timeline) are far richer than the
current backend DTOs. The frontend types carry presentation concepts
(chip tones, icons, heuristic subtitles, "Lavender bloom peaks this
weekend") that the backend doesn't yet emit.

## Impact

- Plan-This-Weekend CTA is purely cosmetic — no command is sent.
- Lock-day / Regenerate / Swap actions are not wired.
- Day cards link to itinerary but the itinerary content doesn't reflect
  the family's actual upcoming plan.
- This is the bulk of the integration work still outstanding.

## Fix

Three layers, in order:

1. **Backend payload completeness.** Extend `WeekendDto` (or add a
   dedicated `WeekendOverviewDto`) to carry the full hero / forecast /
   day-card / anticipation / preview block set. Pull weather from the
   already-wired `IWeatherClient`. The anticipations are planner output —
   the planner needs to record them per weekend.
2. **HTTP wiring.** Rewrite `WeekendPlanService.getDemoOverview()` to
   call `GET /api/weekends/current`. On 404 (see
   [bug 005](005-no-current-weekend-on-fresh-db.md)) auto-plan and
   re-fetch. Same pattern for `getDemoItinerary()` against
   `GET /api/weekends/{id}` with the saturday/sunday day selector.
3. **Action commands.** Wire the Regenerate / Lock / Swap / Add-errand /
   Mark-favourite buttons to their corresponding command endpoints.

## Status

- Logged: 2026-05-16
- Pending — biggest remaining piece of the live-integration work.
