# Generate the current weekend

## Overview

Saturdaze is a web application that plans personalized family weekends. Weekend generation assembles Saturday and Sunday into one persisted plan tailored to the family profile, catalogue, history, and forecast.

*current weekend* — existing or on-demand plan for the current or next upcoming Saturday

`GetCurrentWeekendQueryHandler` returns the plan for the upcoming Saturday and delegates creation when none exists. `GenerateWeekendCommandHandler` gathers planner inputs and persists one `Weekend` per family and date.

## Description

`WeekendPage` reads `WeekendPlanService.getWeekend(): Signal<WeekendView>`. `loadCurrent()` calls `GET /api/weekends/current`; `plan(weekendOfIso)` explicitly requests a date.

`GetCurrentWeekendQueryHandler` resolves the upcoming Saturday using `IDateTimeProvider.Today`, defaulting to America/Toronto in the API. It returns the owned plan or dispatches generation.

`GenerateWeekendCommandHandler` resolves family ownership, uses `PlannerInputLoader` for family, catalog, forecast, and historical activity inputs, and persists one Weekend for each family/date.

`WeekendPlanner.Plan()` creates Saturday and Sunday blocks around commitments, meal windows, drives, downtime, and available activities. `WeekendForecastService` supplies configured-coordinate forecasts.

`WeekendPage.share()` calls `WeekendPlanService.createShareLink()`, which posts to the owner-scoped share endpoint, and opens `ShareDialog` with the returned URL. `ShareWeekendCommandHandler` stores a `WeekendShare` holding only the SHA-256 hash of a random 32-byte token, valid for 7 days as the dialog says; "Stop sharing" calls `DELETE /api/weekends/{id}/share`, and `StopSharingWeekendCommandHandler` revokes every share of the weekend (L2-086 AC5, AC6). `SharedWeekendPage` reads `/api/weekends/shared/{token}` through `SHARED_WEEKEND_SERVICE` from `/sample-weekend?share=...`; `GetSharedWeekendQueryHandler` resolves the token hash, refusing unknown, expired or stopped links with 404, and the controller answers with `SharedWeekendDto`, which leaves out notes, errands, home, rating, favourite, regeneration count, block reasons, errand blocks and directions links that start at home (L2-086 AC7, AC8). `CalendarDialog` downloads the signed-in, family-scoped `/api/weekends/{id}/calendar.ics` as a file through `calendarFile()`; a share viewer's calendar is the anonymous `/api/weekends/shared/{token}/calendar.ics`. Neither carries block reasons (L2-086 AC9). `SharedWeekendDto.From()` titles calendar blocks (L2-177) "Busy" so a personal event title never reaches a share viewer. A family-wide, read-only subscription link to the current weekend, `GET /api/calendar/feed/{token}.ics`, is designed in `identity-and-access/connect-calendar` (L2-179), and keeping the weekend in a connected Google Calendar in `weekend-planning/sync-weekend-to-calendar` (L2-176); neither changes the export or the share link's calendar.

The Weekend screen layout follows `docs/mocks/pages/weekend.html` since 2026-10-06: a cover photo, Saturday | Sunday tabs, and the selected day beside its map. `weekend-planning/map-itinerary-and-travel-legs` designs the tabs, numbered stops, travel legs, and map; `weekend-planning/choose-weekend-cover-photo` designs the cover and the Open Graph share preview. The current `WeekendPage` still renders both days side by side until those designs are implemented.

## Requirements

The following L2 requirements refine the cited L1 capabilities. Implementation gaps stated in Description do not waive these obligations.

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-012` | `L1-003` | `POST /api/weekends/plan` shall create a new `Weekend` row for the requested weekend date with blocks across Saturday and Sunday, including activities, meals, drives, downtime, and any commitments from the family profile. |
| `L2-013` | `L1-003` | `GET /api/weekends/current` shall return the family's plan for the current or next upcoming Saturday, generating one on demand if absent. |
| `L2-086` | `L1-003`, `L1-012` | An authenticated owner shall be able to create a read-only weekend share link and stop sharing it. A share link shall carry a random token stored only as a hash, last 7 days, and stop working once sharing stops. The shared-weekend and shared calendar endpoints shall accept the share token anonymously and return only what a read-only viewer needs; the owner's own calendar export shall require sign-in. |

## Diagrams

### System context

The context view identifies the family member using the capability and the Saturdaze system that owns the weekend state.

![C4 system context for generating the current weekend](diagrams/c4-context.png)

### Containers

The container view follows the interaction from the Angular web application through the API to SQL Server.

![C4 container view for generating the current weekend](diagrams/c4-container.png)

### Components

The component view names the page, client service, controller, handler, domain type, and persistence boundary involved in the slice.

![C4 component view for generating the current weekend](diagrams/c4-component.png)

### Class structure

The class view shows the request path and the state relationships used by the feature.

![Class diagram for generating the current weekend](diagrams/class-structure.png)

### Behaviour — load or generate the current weekend

The sequence view traces the primary behaviour to `L2-012` and `L2-013`. Its alternate path preserves valid existing state when the request cannot proceed.

![Sequence diagram for generating the current weekend](diagrams/sequence-generate.png)

### Behaviour — share a weekend and export its calendar

This sequence records the current implementation, including its failure boundary.

![Sequence — share a weekend and export its calendar](diagrams/sequence-share.png)
