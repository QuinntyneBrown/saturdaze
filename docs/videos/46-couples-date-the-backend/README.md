# 46 · Couples dates: the backend

> **Runtime:** ~9.5 min · **Audience:** backend developers joining the planner · **Prerequisites:** video 45; .NET, EF Core and MediatR basics

**Video:** [46-couples-date-the-backend.mp4](46-couples-date-the-backend.mp4) · [Slides](slides.html) · **Audio:** [46-couples-date-the-backend.mp3](46-couples-date-the-backend.mp3) · [Transcript](script.md)

Second of three videos on couples date planning (L1-042, ADR-025). Narrated with the free Kokoro voice from Hugging Face, no captions, a soca bed from Pixabay under it.

## Why this video exists

The date build added an aggregate, a controller, a planner, a workflow and a slot to the planning stack. This video explains each piece and, more importantly, why the weekend needed almost no new code to plan around a date.

## Learning objectives

By the end, the viewer can:

- Explain ADR-025's two main decisions: a date is its own aggregate, and the weekend sees it as one locked `Date` block
- Read `DatePlanner.Plan()`: the meal windows, the restaurant ranking, the first fitting start, the optional activity, and the two 409 codes
- Trace `DateWorkflow.PlanAsync()` through the block rewrite and `WeekendReplanner.ReplanDayAsync()`
- Say what breakfast changed: `MealSlot.Breakfast`, seeds, ingestion, locks, and what the family planner still does not do
- Find the test that proves each acceptance criterion
- Account for every other file the branch touched: the restaurant service, the admin test counts, the design cross-references and the estimates

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why not flag itinerary blocks as a date? | Attendees, meal, rejected places, regenerate count and a separate lifecycle belong on the date, not a block; one unique index holds one date per meal per day |
| How does the weekend plan around a date? | One locked `Date` block; `BuildFixedBlocks()` already keeps locked blocks; `ReplanDayAsync` re-plans only the affected day |
| What stops a date from clashing? | `DateBusyTime`: commitments for everyone or an attendee, calendar commitments, locked blocks, the day's other dates; a start every 15 minutes in the window until one fits |
| What does the family profile change? | Max drive, approval, dislikes, observances, likes, votes, locks; `no_restaurant_fits` when nothing passes |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `docs/specs/L1.md`, `docs/specs/L2.md` | L1-042; L2-219 → L2-225 |
| `docs/adr/ADR-025-couples-date-planning.md` | Decisions 1 and 2 |
| `backend/src/Saturdaze.Domain/Entities/CoupleDate.cs` | The aggregate |
| `backend/src/Saturdaze.Domain/Enums/MealSlot.cs`, `BlockKind.cs` | Appended values |
| `backend/src/Saturdaze.Api/Controllers/DatesController.cs` | The eight actions |
| `backend/src/Saturdaze.Application/Dates/DateRules.cs` | `DateAttendees.Resolve`, `DateWindow.Check`, `DateBusyTime.For` |
| `backend/src/Saturdaze.Application/Dates/DatePlanner.cs` | `Window`, `RankRestaurants`, the start loop, the activity |
| `backend/src/Saturdaze.Application/Dates/DateWorkflow.cs` | `PlanAsync`: the block rewrite |
| `backend/src/Saturdaze.Application/Weekends/WeekendReplanner.cs` | `ReplanDayAsync` |
| `LockBlockCommandHandler.cs`, `LockWeekendDayCommandHandler.cs`, `ReuseWeekendCommandHandler.cs`, `WeekendPlanner.cs` | The guards and `Splittable` |
| `LockRestaurantCommandHandler.cs` | The breakfast lock and `IsSlot` |
| `backend/tests/Saturdaze.Api.Tests/Dates/`, `Saturdaze.Application.Tests/Dates/DatePlannerTests.cs` | The tests |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00–00:22 | Introduction | What the video covers |
| 00:22–01:23 | Requirement and decision | L1-042, L2-219 → L2-225, ADR-025 decisions 1 and 2 |
| 01:23–02:08 | The aggregate | `CoupleDate`, the two enums, the migration |
| 02:08–02:46 | The endpoints | `DatesController` |
| 02:46–03:25 | Who can go, and when | `DateAttendees`, `DateWindow`, `DateBusyTime` |
| 03:25–05:11 | The planner | Windows, ranking, the first fitting start, the activity |
| 05:11–06:37 | Keeping the weekend in step | `DateWorkflow`, `ReplanDayAsync`, the guards |
| 06:37–07:12 | Breakfast | Slot, seeds, ingestion, locks |
| 07:12–07:39 | The tests | 34 API tests, `DatePlannerTests` |
| 07:39–08:52 | Everything else the branch touched | Restaurant service breakfast, admin test counts, upserter test, cross-reference paragraphs, estimates, mocks index, README |
| 08:52–09:25 | Recap | Things to remember |

## Demo commands

```powershell
dotnet test backend/Saturdaze.sln --filter "FullyQualifiedName~Dates" --nologo

$env:PYTHON = "python"; node tools/video-audio/generate-audio.mjs docs/videos/46-couples-date-the-backend --engine kokoro
node tools/video-build/build-video.mjs docs/videos/46-couples-date-the-backend --no-captions --music docs/videos/assets/music/en-la-playa-trinidad-and-tobago-soca.mp3
```

## Pitfalls

- `MealSlot.Breakfast = 3` and `BlockKind.Date = 8` are appended on purpose; inserting a value would re-label stored rows.
- A date never re-plans the other day; a move across days re-plans both.
- Regenerating the weekend keeps the date; only the date's own regenerate re-plans it.

## References

- `docs/adr/ADR-025-couples-date-planning.md`, `docs/adr/ADR-003-idempotent-generate-weekend.md`, `docs/adr/ADR-008-per-user-family-scoping-and-auth-fallback.md`, `docs/adr/ADR-020-*`
- `docs/detailed-designs/weekend-planning/plan-a-couples-date/README.md`
- Music: "En La Playa - Trinidad and Tobago Soca" by JuliusH, [Pixabay](https://pixabay.com/music/world-en-la-playa-trinidad-and-tobago-soca-4662/), Pixabay Content License
- Voice: Kokoro-82M, [hexgrad/Kokoro-82M on Hugging Face](https://huggingface.co/hexgrad/Kokoro-82M), via `kokoro-onnx`
