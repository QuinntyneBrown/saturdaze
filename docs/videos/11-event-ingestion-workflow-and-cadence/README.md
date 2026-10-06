# 11 · Event ingestion: the suggested workflow and cadence

> **Runtime:** ~10 min · **Audience:** operators and developers who run catalog ingestion · **Prerequisites:** video 07 (the ingestion pipeline); videos 09-10 if you are also standing up Foundry

**Video:** [11-event-ingestion-workflow-and-cadence.mp4](11-event-ingestion-workflow-and-cadence.mp4) · [Slides](slides.html) · **Audio:** [11-event-ingestion-workflow-and-cadence.mp3](11-event-ingestion-workflow-and-cadence.mp3) · [Transcript](script.md)

## Why this video exists

Videos 07-10 explain how ingestion works and how to configure it, but not how to *operate* it: how often to run it, when, and what to do around each run. This video derives a weekly rhythm for the events catalog from the code (the window one pass researches and the window the events page reads), recommends slower cadences for activities and restaurants, and gives a morning-after checklist built on the `IngestionRuns` audit rows. Recommendations are labelled as such; repository defaults are stated as defaults.

## Learning objectives

By the end, the viewer can:

- Explain why one events pass covers two weekends and why that makes a weekly cadence sufficient.
- Read the default cron `0 0 8 * * 5` and explain why Friday 08:00 UTC sits ahead of the planning window.
- Configure a split cadence: events weekly on the long-lived Worker, activities and restaurants on a run-once job.
- Walk the weekly workflow: deliberate dry run, scheduled pass, audit check, moderation, recovery.
- Interpret `IngestionRuns` statuses, including the "succeeded with zero items" quiet failure.

## Key questions

| Question | What a strong answer includes |
|----------|-------------------------------|
| Why is weekly enough for events? | `ResolveUpcomingSaturday` anchors the pass; the events prompt asks for that weekend and the following one, so every weekend is researched twice (seeded, then corrected). The events page reads Fri-Sun plus 14 days after Sunday. |
| Why Friday 08:00 UTC? | Default in `IngestionScheduleOptions` and `settings.job`; 04:00 Toronto in daylight time; after organizers publish, before Friday-evening planning. |
| Why split the cadence? | Activities are "not date-bound", restaurants change slowly, and one events pass used ~129K input tokens (ADR-011). Suggested: events weekly, activities monthly + season change, restaurants quarterly. |
| How do you wire it? | One Worker has one `Cron` and one `Types`; run a second, `RunOnceThenExit` job for slow catalogs. `run.sh` hard-codes `--type all`. One scheduler per catalog; no distributed lease. |
| What do you check after a pass? | Newest `IngestionRuns` rows: status, items upserted/rejected, tokens, searches. Zero items is an alert; a stuck Running row never closes. |
| How do you recover? | Read `ErrorMessage`, fix configuration if needed, rerun `saturdaze ingest --type events`; natural-key upserts make reruns safe; the budget (48/day/type) leaves room. |

## Code / assets on screen

| File | What to show |
|------|--------------|
| `backend/src/Saturdaze.Application/Weekends/GetCurrentWeekendQueryHandler.cs` | `ResolveUpcomingSaturday` |
| `backend/src/Saturdaze.Application/Ingestion/IngestionPrompts.cs` | Events prompt: `weekend` and `nextWeekend` |
| `docs/detailed-designs/discovery/discover-local-events/README.md` | Fri-Sun plus 14-day coming-soon window |
| `backend/src/Saturdaze.Worker/IngestionScheduleOptions.cs` | Default cron and its "Friday-6pm weekend plan" comment |
| `backend/src/Saturdaze.Worker/appsettings.json` | `Schedule` section (`Cron`, `Types`, `RunOnceThenExit`) |
| `backend/deploy/webjobs/ingest/settings.job`, `run.sh` | NCRONTAB schedule, `is_singleton`, `--type all` |
| `docs/adr/ADR-011-claude-via-microsoft-foundry.md` | ~129K input tokens per events pass |
| `backend/src/Saturdaze.Domain/Entities/IngestionRun.cs` | Audit fields |
| `backend/src/Saturdaze.Application/Ingestion/CatalogUpserter.cs` | Event natural key |
| `docs/detailed-designs/operations/schedule-catalog-ingestion/README.md` | No lease, run-once exit code, open Running rows |

## Run sheet

| Time | Segment | Content |
|------|---------|---------|
| 00:00-00:36 | Introduction | What this video adds; default vs suggested |
| 00:36-01:00 | Questions | Four questions |
| 01:00-02:11 | The window | `ResolveUpcomingSaturday`, two-weekend prompt, read side, rolling overlap |
| 02:11-03:21 | Why Friday | Cron fields, UTC vs Toronto, why not Monday or Saturday |
| 03:21-04:43 | Cadence | `all` default, per-catalog cadence, midweek top-up, cost |
| 04:43-05:44 | Wiring | One Worker per schedule, run-once job, WebJob and singletons |
| 05:44-06:48 | Weekly workflow | Dry run, scheduled pass, audit query, moderation |
| 06:48-07:35 | Audit rows | Status patterns, quiet failure, stuck Running |
| 07:35-08:30 | Recovery | Natural key, recovery steps, run-once exit code |
| 08:30-09:12 | Pitfalls | Moved events, no pruning, moving home, dry run skips DB |
| 09:12-09:55 | Recap | Things to remember; watch two Fridays of audit rows |

## Demo commands

```bash
# Tune after a prompt or setting change (calls the model, writes nothing, still costs tokens)
dotnet run --project backend/src/Saturdaze.Cli -- ingest --type events --dry-run

# Manual rerun after a failed pass (upserts on the natural key; safe to repeat)
dotnet run --project backend/src/Saturdaze.Cli -- ingest --type events

# Worker for events only, weekly (default cron)
Saturdaze__Ingestion__Schedule__Types=events dotnet Saturdaze.Worker.dll

# One-shot job for the slow catalogs, triggered by an external scheduler
Saturdaze__Ingestion__Schedule__RunOnceThenExit=true \
Saturdaze__Ingestion__Schedule__Types=activities,restaurants \
dotnet Saturdaze.Worker.dll
```

```sql
-- Friday-morning check (Type: 0 Events, 1 Activities, 2 Restaurants;
-- Status: 0 Running, 1 Succeeded, 2 PartialSuccess, 3 Failed)
SELECT TOP 6 Type, Status, StartedUtc, FinishedUtc,
       ItemsConsidered, ItemsUpserted, ItemsRejected,
       InputTokens, WebSearchCount, ErrorMessage
FROM IngestionRuns
ORDER BY StartedUtc DESC;
```

## Pitfalls

- Running every catalog daily: each weekend is already researched twice by a weekly events pass, and activities/restaurants barely change.
- Two schedulers for the same catalog: there is no distributed lease, so passes can overlap.
- Trusting the scheduler's exit status: a run-once pass exits cleanly even when a catalog fails.
- Treating "Succeeded, 0 items" as fine: empty or unparseable output can produce it.
- Expecting a moved event to update in place: the start date is part of the natural key, so a new row is inserted.
- Reading total `LocalEvents` row count as this weekend's supply: nothing prunes past events.

## References

- `docs/adr/ADR-011-claude-via-microsoft-foundry.md`
- `docs/detailed-designs/discovery/ingest-catalogs/README.md`
- `docs/detailed-designs/operations/schedule-catalog-ingestion/README.md`
- `docs/detailed-designs/discovery/discover-local-events/README.md`
- `docs/detailed-designs/discovery/moderate-event-submissions/README.md`
- `backend/deploy/webjobs/ingest/README.md`
- [Azure WebJobs: NCRONTAB expressions](https://learn.microsoft.com/azure/app-service/webjobs-create#ncrontab-expressions)
