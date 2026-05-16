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
- **Fixed: 2026-05-16.**
  1. **HTTP wiring landed.** `WeekendPlanService` now injects `HttpClient`
     + `API_BASE_URL`, calls `GET /api/weekends/current` on construction,
     and exposes `getDemoOverview()` / `getDemoItinerary()` as signals
     populated from the resulting `WeekendDto`. The 404 case is closed
     server-side by [bug 005](005-no-current-weekend-on-fresh-db.md), so
     the client never has to special-case "no weekend planned."
  2. **Projection layer.** Two pure functions in the service —
     `projectOverview(dto)` and `projectItinerary(dto, activeDay)` — map
     the backend's `WeekendDto` / `ItineraryBlockDto` / `WeatherForecast`
     into the rich `WeekendOverview` / `ItineraryView` shapes the pages
     already consume. Mapping rules:
     - Weather chips, icons, and hero subtitle inferred from
       `WeatherForecast.tags`.
     - Day chips: first locked block ("9:00 swim"), aggregated drive
       minutes, outdoor/indoor inference from weather.
     - Stats: total blocks, total drive time, locked anchors. Spend
       estimate stays placeholder until the backend tracks it.
     - Block icon + tone derived from `BlockKind` enum.
     - Top activity highlight pulled from the first `Activity` block.
  3. **Action commands wired.** `WeekendPlanService` exposes
     `plan(weekendOfIso)`, `regenerate(id?)`, `markFavourite(fav, id?)`,
     `lockBlock(blockId, locked)`, `swapBlock(blockId)`, and
     `addErrand(description, minutes, id?)` — each posts/puts to the
     corresponding endpoint and triggers a refetch so the signals
     re-render. Pages can call them through DI without further wiring.
  4. **Day switcher.** `setActiveDay('Saturday'|'Sunday')` re-projects
     the cached DTO into the itinerary view without a refetch.
  5. **Anticipations** stay empty for now — the planner doesn't emit them
     yet. Tracked as a planner-side follow-up.
- Verified by: `ng build saturdaze` (clean), all 148 backend tests pass.
