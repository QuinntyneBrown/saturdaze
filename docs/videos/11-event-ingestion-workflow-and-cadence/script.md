# 11 · Event ingestion: the suggested workflow and cadence

Videos seven to ten showed how Saturdaze asks Claude to research local events, and how to wire it up. This video answers the operator's question that comes next: how often should you run it, when, and what should you do around each run? You will get a recommended weekly rhythm for the events catalog, a slower rhythm for activities and restaurants, and a short checklist for the morning after each pass. Everything here is grounded in the code as of October 2026. Where something is my recommendation rather than a repository default, I will say so.

## What you will be able to answer

By the end of this video you should be able to answer four questions.

- Why does the events catalog refresh on Friday morning, and why is once a week enough?
- What does one week of the ingestion workflow look like, step by step?
- Why should events, activities and restaurants run on different cadences?
- What do you check after a pass, and what do you do when one fails?

## What one pass actually covers

Start with the window, because the cadence falls out of it. When an events pass starts, the runner computes the upcoming Saturday with `ResolveUpcomingSaturday`. On a weekday that is the next Saturday. On a Saturday it is today, and on a Sunday it is yesterday.

The events system prompt then asks Claude for events on or near that weekend and the following weekend. So one pass researches two weekends: this one and the next.

Now look at the reading side. The events page calls `GET /api/events`, and `GetLocalEventsQueryHandler` returns events overlapping Friday to Sunday, plus a coming soon list of anything starting within fourteen days after Sunday.

Put those together and you get a rolling overlap. Every weekend is researched twice: once a week early, as the weekend after, and again on its own Friday, as this weekend. The first pass seeds it; the second pass catches late announcements and corrections. That double look is why a weekly cadence is enough for events, and why running daily mostly buys you duplicated spend.

## Why Friday at eight

The repository default is the cron expression zero, zero, eight, star, star, five. It is a six field expression with seconds first, so it reads: second zero, minute zero, hour eight, any day of the month, any month, day of week five, which is Friday. The Worker evaluates it in UTC, and the WebJob's `settings.job` uses the same expression, also in UTC.

Eight in the morning UTC is four in the morning in Toronto during daylight time, and three in the morning in winter. That is deliberate. The pass finishes before anyone is awake, and the comment on `IngestionScheduleOptions` puts it plainly: the morning before the Friday six p.m. weekend plan. Families open the app on Friday evening, and the catalog they see was refreshed that same morning.

Why not Saturday morning? Because by then families have already planned. And why not Monday? Because most community calendars, markets and pop ups publish their weekend details late in the week. Friday morning is the latest point that is still ahead of the planning window.

## The suggested cadence by catalog

Here is my recommendation. Out of the box, the Worker's `Types` setting is `all`, and the WebJob's `run.sh` runs `ingest --type all`, so all three catalogs refresh every Friday. That is a safe default, but it is not the best fit, because the three catalogs age at very different speeds.

- Events are time bound. Refresh them weekly, Friday at eight UTC. Keep the default.
- Activities are evergreen. The prompt itself says they are not date bound and should be worth doing across the season. Refresh them monthly, and always at the start of a new season.
- Restaurants change slowly. Refresh them quarterly, or when someone reports a closure.

An optional extra: if a Friday pass keeps coming back thin, add a midweek top up for events only, for example Tuesday at eight UTC, which is zero, zero, eight, star, star, two. Add it because the audit rows show a gap, not by default.

Why bother splitting? Cost. Web search results count as input tokens, and ADR eleven records that one events pass used about one hundred and twenty nine thousand input tokens. Activities and restaurants are similar searches. Running them weekly triples the bill for rows that barely change.

## How to wire a split schedule

One Worker instance has exactly one `Cron` and one `Types` list. So a split cadence means two schedules, both calling the same runner.

The simplest shape is this. Keep the long lived `Saturdaze.Worker` with `Types` set to `events` and the Friday cron. Then add a second, one shot job for the slow catalogs: the same Worker image with `RunOnceThenExit` set to true and `Types` set to activities and restaurants, triggered monthly by an external scheduler such as an Azure Container Apps job or a Kubernetes cron job.

If you use the App Service WebJob instead, remember that `run.sh` hard codes `--type all`. You would need a second WebJob folder, or a change to the script, before it can run events alone. And whichever host you choose, run only one scheduler per catalog. There is no distributed lease across replicas; the WebJob's `is_singleton` flag and a single Worker replica are what keep passes from overlapping.

## The weekly workflow

Here is one week, step by step.

- Step one, only when you changed a prompt or a setting: run a dry run earlier in the week, `saturdaze ingest --type events --dry-run`. It calls the model and parses the answer but writes nothing. It is not free, so do it on purpose, not as a habit.
- Step two, Friday at eight UTC: the scheduled pass runs. The runner opens a Running row in `IngestionRuns`, calls Claude, parses, upserts and closes the row.
- Step three, Friday morning: read the newest audit rows. You want status Succeeded or PartialSuccess, a sensible number of items upserted, and token and search counts in the usual range.
- Step four, before Friday evening: clear the moderation queue at review submissions, so approved community events sit alongside the ingested ones for the weekend.
- Step five, only if step three found a problem: fix the cause, then rerun the events pass by hand.

## Reading the audit row

Every non dry pass leaves one row per catalog in `IngestionRuns`. Four patterns matter.

- Succeeded with a steady number of items upserted is a healthy week.
- PartialSuccess means some rows were rejected by the parser. A few rejections are normal. A spike means the prompt and the schema have drifted.
- Succeeded with zero items is the quiet failure. Empty or unparseable output can still produce a successful zero item result, so treat zero as an alert, not as good news.
- Failed carries an error message. If it says the daily run budget was reached, something is triggering far too often.

And a row stuck in Running means the process was cancelled mid pass. It will never close on its own.

## Recovering from a failed pass

The good news is that rerunning is safe. `CatalogUpserter` matches events on a natural key of name, start date and location, so a second pass updates rows in place instead of duplicating them.

So the recovery is short. Read the error message. If it was a transient provider error, the client already retried once after thirty seconds, so wait a little and run `saturdaze ingest --type events` by hand. If it was configuration, such as a missing key, fix that first. The daily budget, `MaxRunsPerDayPerType`, defaults to forty eight, so a handful of manual reruns will never hit it.

One more trap with the one shot job: a run once pass does not set a non zero exit code when a catalog fails. Your external scheduler will report success. Check the audit rows, not the scheduler's green tick.

## Pitfalls

- The natural key includes the start date. If an organizer moves an event, the next pass inserts a second row rather than moving the first one.
- Nothing prunes past events. They stay in the table, and the date filter in the events query hides them. That is harmless, but do not read the row count as the size of this weekend.
- Changing `HomeLocation` or `MaxDriveMinutes` changes what the next pass researches. Old rows from the previous area stay, with drive times measured from the old home.
- A dry run does not test the database. It skips the upserter, so field length problems only show up on a real pass.

## Things to remember

- One events pass researches two weekends, so every weekend gets looked at twice. Weekly is enough.
- Friday at eight UTC lands after organizers publish and before families plan.
- Split the cadence: events weekly, activities monthly and at each season change, restaurants quarterly.
- Every Friday, read the audit rows. Zero items is an alert.
- Reruns are safe because of the natural key, and cheap to guard because of the daily budget.

That is the operating rhythm. If you change the schedule, change it in configuration, watch the first two Fridays of audit rows, and let the numbers tell you whether you need that midweek top up.
