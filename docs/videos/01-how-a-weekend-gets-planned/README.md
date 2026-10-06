# 01 · How a Weekend Gets Planned

> **Runtime:** ~8 min · **Audience:** contributors new to the Saturdaze codebase (backend or frontend) · **Prerequisites:** basic C#/ASP.NET Core and Angular; the repo cloned

**Video:** [01-how-a-weekend-gets-planned.mp4](01-how-a-weekend-gets-planned.mp4) · [Slides](slides.html) · **Audio:** [01-how-a-weekend-gets-planned.mp3](01-how-a-weekend-gets-planned.mp3) · [Transcript](script.md)

## Why this video exists

Planning a weekend is the core of Saturdaze, and most questions about the product come down to "why did the planner put that there?". The answer runs through four layers and two ADRs. This video follows one tap on **Plan weekend** from the Angular page to `WeekendPlanner`, so a new contributor knows where each rule lives and which ones are deliberate.

## Learning objectives

By the end, the viewer can:

- trace `POST /api/weekends/plan` from `weekend.page.ts` through `WeekendPlanService`, `WeekendsController` and `GenerateWeekendCommandHandler` to `WeekendPlanner`;
- explain why re-posting `plan` returns the existing weekend (ADR-003) and name the endpoint that does re-plan;
- list the planner's inputs and say where they are loaded (`PlannerInputLoader`);
- describe the per-day pipeline (fixed blocks → gaps → activities → meals/errand/downtime) and its bounds in `PlannerTimes`;
- predict an activity's score from the disqualifiers and point rules, and explain why plans are reproducible (the seed).

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| What happens when the same weekend is planned twice? | The handler finds the existing `(FamilyId, WeekendOf)` weekend and returns it unchanged with a fresh forecast; `POST /api/weekends/{id}/regenerate` is the explicit reseat (ADR-003); covered by `Plan_is_idempotent_per_family_and_date`. |
| Which data does the planner see? | Family members, commitments and preferences; all activities; approved restaurants; events overlapping the weekend; the forecast; earlier weekends' activity history; a seed (`WeekendOf.DayNumber` on first plan). |
| How does the planner fill an empty afternoon? | Gaps ≥ 90 min get scored activities: disqualifiers first (duration, drives + 30 min, disliked tag, 2+ members out of age range), then weather/drive/age/recency/try-new/liked-tag points; ties by name, then a seeded random pick among the top scores. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/saturdaze/src/app/pages/weekend/weekend.page.ts` | `plan()` calling `weekendService.plan(upcomingSaturdayIso())`; `inject(WEEKEND_PLAN_SERVICE)` |
| `frontend/projects/api/src/lib/services/weekend-plan.service.contract.ts` | `IWeekendPlanService` and the `WEEKEND_PLAN_SERVICE` injection token |
| `frontend/projects/saturdaze/src/app/app.config.ts` | `{ provide: WEEKEND_PLAN_SERVICE, useExisting: WeekendPlanService }` |
| `frontend/projects/api/src/lib/services/weekend-plan.service.ts` | the `http.post` to `/api/weekends/plan` |
| `backend/src/Saturdaze.Api/Controllers/WeekendsController.cs` | the one-line `Plan` action |
| `backend/src/Saturdaze.Application/Weekends/GenerateWeekendCommandValidator.cs` | the Saturday rule |
| `backend/src/Saturdaze.Application/Weekends/GenerateWeekendCommandHandler.cs` | family scope, the ADR-003 early return, the seed |
| `docs/adr/ADR-003-idempotent-generate-weekend.md` | the decision quote |
| `backend/src/Saturdaze.Application/Planning/PlannerInputLoader.cs` | what is loaded |
| `backend/src/Saturdaze.Application/Planning/WeekendPlanner.cs` | `Plan`, `PlanDay`, `ScoreActivities`, `ForecastFor` |
| `backend/src/Saturdaze.Application/Planning/PlannerTimes.cs` | day bounds, meal windows, minimum gaps |
| `backend/src/Saturdaze.Application/Weekends/RegenerateWeekendCommandHandler.cs` | kept locked blocks and the new seed |
| `backend/tests/Saturdaze.Api.Tests/Weekends/WeekendsControllerTests.cs` | `Plan_is_idempotent_per_family_and_date`, `Plan_with_non_saturday_returns_400` |

## Run sheet

Times are estimated at 150 wpm until the audio is synthesized; re-run `--check` afterwards for exact times.

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:43 | Introduction | What a planned weekend looks like; the five stops of one request |
| 00:43-01:02 | Questions | The three questions the video answers |
| 01:02-02:15 | The request | Page → token → service → one-line controller → Saturday validator |
| 02:15-03:19 | Idempotency | Family scope, the ADR-003 early return, regenerate as the reseat |
| 03:19-04:07 | Inputs | `PlannerInputLoader`, the seed, neutral weather fallback |
| 04:07-05:14 | Day pipeline | `Plan` → `PlanDay` four steps; `PlannerTimes` |
| 05:14-06:32 | Scoring | Disqualifiers, the point table, tie-break + seeded pick |
| 06:32-06:55 | Regenerate | Locked blocks kept, commitments rebuilt, seed + 31 × count |
| 06:55-07:26 | Pitfalls | Logic placement, randomness, family scope, planner constants |
| 07:26-08:04 | Recap | Four things to remember; preview of video 02 |

## Demo commands

```powershell
# Exercise the flow from the API tests (Plan_is_idempotent_per_family_and_date and friends)
dotnet test .\backend\tests\Saturdaze.Api.Tests --filter "FullyQualifiedName~WeekendsControllerTests"

# Planner unit tests
dotnet test .\backend\tests\Saturdaze.Application.Tests --filter "FullyQualifiedName~Planning"
```

Rebuild this video's media from the repository root:

```sh
node tools/video-audio docs/videos/01-how-a-weekend-gets-planned --dry-run
AZURE_SPEECH_KEY=... node tools/video-audio docs/videos/01-how-a-weekend-gets-planned
node tools/video-build docs/videos/01-how-a-weekend-gets-planned --check
node tools/video-build docs/videos/01-how-a-weekend-gets-planned --slides-only
node tools/video-build docs/videos/01-how-a-weekend-gets-planned
```

## Pitfalls

- Making `plan` re-plan an existing weekend breaks ADR-003 and the idempotency API test; use `regenerate`.
- Planning logic in `WeekendsController` or `WeekendPage` instead of the handler or planner.
- `System.Random` or the clock inside the planner; randomness goes through `IRandomSource` so plans stay reproducible.
- A new query in a handler that forgets the current family id (ADR-008).
- Changing planner bounds inline instead of in `PlannerTimes`.

## References

- [ADR-003 — `GenerateWeekendCommand` is idempotent](../../adr/ADR-003-idempotent-generate-weekend.md)
- [ADR-008 — per-user family scoping](../../adr/ADR-008-per-user-family-scoping-and-auth-fallback.md)
- [Level 2 specification](../../specs/L2.md)
- [MediatR](https://github.com/jbogard/MediatR) · [FluentValidation](https://docs.fluentvalidation.net/) · [Angular dependency injection](https://angular.dev/guide/di)
- [Open-Meteo API](https://open-meteo.com/en/docs)
