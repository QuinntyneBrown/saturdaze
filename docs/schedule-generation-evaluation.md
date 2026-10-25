# Schedule generation evaluation — 2026-10-25

An exploratory test of weekend planning against a realistic family, to find
what limits plan quality and what to change. Twenty generations were run
(plus one workaround run) through the real API; every observation below is
from an actual response or the planner source.

## Test family

| Field | Value | How it was entered |
|---|---|---|
| Home | 2091 Hurontario St, Mississauga L5A 4E6 | `homeLocation` text (no coordinates field) |
| Members | Dad 45, Mom 43, Daughter 10, Daughter 6 | members |
| Faith | Christian family; don't celebrate Halloween | `Dislike: Halloween` (the only available lever) |
| Commitments | Aqua Tots, Heartland: 6yo Sun 16:20–16:50, 10yo Sun 17:00–17:30 | two family commitments (no owner, no location) |
| Max drive | 2 hours | **not expressible** — no family setting exists |

## Method

- API started with `eng/Start-E2eApi.ps1` (SQLite, seeded). A new account and
  family was registered per scenario so history didn't leak between runs,
  except where history was the subject (runs 12–13).
- Runs 1–3 used the stock catalog (8 activities, 8 restaurants of which 7 are
  eligible, no events on the
  test weekends — the same size as the local LocalDB catalog; no ingestion had
  ever run).
- Runs 4–21 added a supplementary catalog researched on the web on 2026-10-25:
  12 real venues (Kariya Park, Rattray Marsh, Playdium, Funday!, Central
  Library, Bradley Museum, PAMA, Ripley's, ROM, Kelso, Niagara Falls, Great Wolf
  Lodge) and 9 dated events (Halloween in the Village, Happily Ever Haunts,
  Nights of Lights & Pumpkinville, Park your Pumpkin, TSO Symphony
  Spooktacular, Día de los Muertos Drag Brunch, Sunday Antique Market, Harry
  Potter: Visions of Magic, Royal Agricultural Winter Fair). Drive minutes were
  computed from the geocoded home (43.5711, -79.6024) with the app's own
  `TravelEstimator` formula. Venue coordinates are approximate.
- Weather was live Open-Meteo for the *configured* home (Port Credit):
  Sat Oct 31 rain/cool, Sun Nov 1 mild; Sat Nov 7 cool, Sun Nov 8 rain/cool;
  Nov 14 unavailable (beyond the forecast range).
- Halloween is Saturday Oct 31; clocks fall back Sunday Nov 1, so sunset is
  about 5:05 pm on both test weekends.

## Results

| # | Scenario | Outcome | What it showed |
|---|---|---|---|
| 1 | Baseline, stock catalog, Oct 31 | Plan | Sat: one 2 h activity (kids' theatre at **09:05**), then 7.5 h of downtime. Sun: Rec Room, swims, then **the same theatre again** 17:35–19:25; no Sunday dinner. |
| 2 | Regenerate run 1 | Plan | Ontario Science Centre 4 h (closed its Don Mills building in 2024); Toronto Zoo 5 h; Riverwood Conservancy 17:38–19:22, **after dark**. Response carried 30 blocks, only 16 unique. |
| 3 | + Sunday church 10:00–11:30 | Plan | **"Lunch" placed 09:00–10:00**; lavender farm (best May–July) on Nov 1. |
| 4 | Enriched catalog, Oct 31 | Plan | Saturday identical to run 1 despite 12 new venues. Events list returned **5 Halloween-themed events** to a family that dislikes Halloween, plus a stock "Strawberry-picking opens" re-dated to Oct 31. |
| 5 | Regenerate + duplicate check | Plan | Response 32 blocks / 17 unique; `GET` 17 → duplication is in the regenerate **response only**. |
| 6 | Regenerate again | Plan | PAMA, Bradley Museum, Rattray Marsh 17:40–19:10 (dark). Saturday afternoon still 270 min downtime. |
| 7 | Church + swims, Nov 7 | Plan | ROM then 3.5 h downtime. **Royal Winter Fair (26 min, on that weekend) never considered** — the planner ignores events. |
| 8 | Like Animals, Museum, Indoor Fun | Plan | A like is worth +1 vs. +3 for weather fit, so likes barely steer. Sunday lunch at 09:00 again. |
| 9 | Like Park, Short hikes; Dislike Indoor | Plan | Library (indoor) chosen: a dislike is a text match, not the indoor flag. |
| 10 | Like Niagara (est. 106 min each way) | Plan | 3.5 h of driving on Saturday, lunch at **16:32**. `/api/activities?maxDriveMinutes=120` returned all 20 — no family drive limit anywhere. |
| 11 | Try something new on | Plan | Same as run 4 for a new family; **every** activity reason says "first time trying this". |
| 12 | Rate Oct 31 1★, plan Nov 7 | Plan | ✓ None of the 1★ weekend's activities repeated. |
| 13 | Plan Nov 14 after Nov 7 | Plan | ✓ No repeats from the prior weekend; closed Science Centre chosen again. |
| 14 | Sat birthday party (10yo only) 13:00–16:00 | Plan | Whole family blocked; **lunch 18:50 and dinner 19:50 back to back**; no drive to the party. |
| 15 | Swims overlap (16:20–16:50, 16:30–17:00) | **400** | "Commitments on the same day must not overlap." Two parents could split this; the model can't say so. |
| 16 | + 60 min Costco errand, regenerate | Plan | Errand at 18:30–19:50 after dinner; lunch at 15:50. |
| 17 | Lock Saturday, regenerate Sunday | Plan | ✓ Saturday untouched; Sunday picked the same activities (only the restaurant changed). |
| 18 | Grandparents visiting (72, 75) | Plan | Identical to run 7 — nothing considers mobility or pace. |
| 19 | Ideas: add Royal Fair; preview Halloween events | Plan | Fair placed for a fixed 2 h at 09:26; it replaced the Zoo but left "Lunch — close to Toronto Zoo" at 15:50 and an unfilled 4 h hole. "Park your Pumpkin" (really 6–8 pm) previewed at 09:10; Halloween events allowed for this family. |
| 20 | Busy Sunday (church, lunch at Grandma's) + budget on | Plan | **Lunch placed 11:30 right before "Lunch at Grandma's" 12:30**; budget toggle has no effect. |
| 21 | Workaround for 15: one merged swim block | Plan | Works; Kariya Park 17:05–18:35, after dark. |

Raw responses for every run are kept outside the repo (scratchpad `runs/`).

## What limits plan quality today

### Planner defects (reproducible, independent of configuration)

1. **One activity per gap.** `PlanDay` picks a single activity per free gap, so
   a free 12-hour Saturday gets one 2–4 h outing and 4–7 h of "Downtime"
   (runs 1, 4, 6, 7, 18, 20).
2. **Same activity on both days.** The `rejected` set is per day, so the
   Living Arts Centre appears Saturday and Sunday (runs 1, 3).
3. **Meals placed anywhere.** When the lunch window is taken, `FindMealSlot`
   falls back to the free hour nearest the window across the whole day — lunch
   at 09:00 (runs 3, 8), 15:50 (16), 16:32 (10), 18:50 followed by dinner at
   19:50 (14), and a lunch an hour before a "Lunch at Grandma's" commitment (20).
4. **No Sunday dinner**, even when the plan fills Sunday until 19:30 with a
   6- and 10-year-old (every run).
5. **Events are never planned.** `PlannerInputs.Events` is loaded but unused by
   `WeekendPlanner`; events only reach a plan by hand through Ideas (run 19).
6. **No hours, times, seasons or daylight.** Activities have a duration but no
   opening hours or season; events have dates but no times. Result: theatre at
   9 am, a lavender farm in November, an evening pumpkin walk previewed for the
   morning, and outdoor parks after sunset (runs 1–3, 19, 21).
7. **No travel to commitments.** Swims at Heartland (~13 min each way) and the
   birthday party get no drive blocks; the activity after swim is timed from
   home.
8. **Restaurant choice ignores geography.** The lunch spot is chosen by the
   difference in `DriveMinutes` from home, not distance from the previous stop,
   and reasons like "close to Toronto Zoo" survive after the Zoo is replaced
   (run 19).
9. **Regenerate response duplicates blocks.** `WeekendReplanner` calls
   `_db.ItineraryBlocks.Add(block)` with `WeekendId` set (EF relationship
   fix-up adds the block to the tracked `weekend.Blocks`) and then
   `weekend.Blocks.Add(block)` again. Stored data is correct; the returned DTO
   has each new block twice (runs 2, 5).
10. **Try-new reason is unconditional.** `BuildActivityReason` adds "first time
    trying this" to every activity when the toggle is on (run 11).
11. **Low regenerate variety.** Ties are broken by name then a seeded pick, so a
    larger catalog didn't change Saturday (run 4 = run 1) and day-regenerate
    reselects the same activities (run 17).

### Data defects

- The catalog is tiny (8 activities locally; ingestion has never run here).
- Stale entries: the Ontario Science Centre is still planned; a "Strawberry-picking
  opens" seed event is re-anchored to whatever the current weekend is (Oct 31).
- `DriveMinutes` is stored per catalog row relative to the one configured home
  (Port Credit), so every family sees Port Credit drive times. The forecast is
  also for the configured home.

### Configuration gaps (what this family could not express)

| Need | Today | Gap |
|---|---|---|
| Home location | Free text; `HomeCoordinates` only set by the seeder | Address isn't geocoded; drive times and weather ignore it |
| Max drive 2 h | Nothing (ingestion uses a global 200 min; `/events` defaults to 120 min as a query param) | Niagara (3.5 h round trip) planned freely |
| "Don't celebrate Halloween" | `Dislike` = substring match on name/description/category/tags | Misses "Park your Pumpkin", "Symphony Spooktacular"; not applied to events, Ideas or the events list |
| Faith / Sunday worship | A commitment named "Church" | No notion of observances, Sabbath pace, or faith-friendly alternatives |
| Who attends a commitment | Family-wide only | Can't split parents (run 15), can't leave one child at a party (run 14) |
| Commitment location | None | No travel time, no "plan near Heartland" |
| Kid bedtimes / day window | Fixed 09:00–21:00, Sunday wind-down 19:30 | 6-year-old's evening, Sunday dinner at home |
| Budget | Toggle with no effect | No prices in the catalog |
| Interests | Family-wide likes worth +1 | No per-member interests; weather always outweighs likes |
| Indoor/outdoor preference | Dislike "Indoor" is text | No structured setting |
| Pace | None | No "one big outing", "slow Sunday", "max stops/day" |
| Mobility | None | Grandparents, strollers |

## Recommendations

### 1. More configuration for the family

In order of impact for this family:

1. **Geocode the home address** on save and compute drive times per family
   from coordinates (a routing provider later), and fetch weather for the
   family's home. Everything downstream depends on it.
2. **Max drive time** as a family setting, applied to activities, events,
   Ideas and ingestion.
3. **Richer commitments**: attendees (member IDs), location, and optional
   "one adult needed". This unlocks overlapping kid commitments, split plans
   (one parent at the party, the other with the 6-year-old), travel blocks to
   Heartland, and anchoring nearby activities.
4. **Observances and content themes** instead of free-text dislikes: e.g.
   "Doesn't celebrate Halloween" excludes the theme `halloween` (which ingestion
   tags — pumpkin walks, haunts, "spooktacular"), applied everywhere events or
   activities surface. Pair it with "Sunday worship" as a first-class setting
   (time, travel, a slower Sunday) and an opt-in to faith-friendly events
   (church harvest fairs, Christmas concerts).
5. **Day shape**: start time, youngest child's bedtime, "dinner at home on
   Sunday", meals out per weekend, and pace (max outings per day, one free
   morning).
6. **Structured preferences**: indoor/outdoor leaning, categories, per-member
   interests, with weights that can beat weather fit.
7. **Budget with data**: price tier per activity and event, plus a weekend
   budget; otherwise remove the toggle.

### 2. Different options

- **Fix the planner defects above first** — multiple activities per long gap,
  cross-day dedupe, meal windows with a sensible fallback (skip, picnic or eat at
  home rather than lunch at 9 am), Sunday dinner, travel to commitments, and
  geo-based restaurant choice. These matter more than any new setting.
- **Treat events as first-class candidates** with start/end times and a
  "this weekend only" bonus; the Royal Winter Fair and Harry Potter exhibit were
  the best fits on Nov 7 and were invisible to the planner.
- **Offer 2–3 plan shapes per weekend** instead of one: *Close to home*
  (≤ 20 min), *Big day out* (one destination up to the drive limit), and
  *Rainy-day* — and let the family mix days across shapes.
- **Season, hours and daylight awareness**: open months and hours on
  activities, times on events, and no outdoor block ending after sunset in
  winter.
- **Re-flow after edits**: when Ideas replaces a block, re-place meals and
  downtime around it.

### 3. Agentic schedule development instead of web search?

Today a grounded web search fills **one global catalog** (one configured home,
200 min radius) on a schedule, and a deterministic rule engine plans from it.
The tests show the bottleneck is less "web search vs. agent" than that neither
stage reasons about *this* family: the catalog has no times, seasons, prices or
themes, and the planner ignores events and commitment context.

Recommended path — a hybrid, not a replacement:

1. **Keep the deterministic planner as the constraint solver and validator.**
   It is fast, testable, idempotent (ADR-003) and good at hard rules
   (commitments, travel, meals, bedtimes). Fix its defects.
2. **Upgrade ingestion's schema and scope**: run it per home region (cluster
   families by geocoded home and drive limit), and require event start/end
   times, opening hours, season, price tier, age range, content themes and a
   verified URL. This is a prompt and schema change in `IngestionPrompts` and
   `CatalogUpserter`, with high payoff.
3. **Add an agentic weekly curator per family** (fits the existing Friday
   preview): an agent with tools — family profile, catalog search, web search
   for gaps, weather, drive time, and the planner's validator — that shortlists
   and ranks candidates for *this* family. It catches what keyword rules can't
   ("Park your Pumpkin" is Halloween-themed; plan near Heartland after swim; a
   church harvest fair as a Halloween alternative), checks this weekend's hours,
   and feeds the deterministic planner. Persist its output so plans stay
   idempotent and reproducible.
4. **Later, conversational edits** ("make Saturday lighter", "something for
   the 10-year-old while the 6-year-old naps") through the same tools.

Risks to manage: cost per family per week (cache shared regional research,
cap tool calls), latency (run before the weekend, not on request), hallucinated
venues (verified URLs only; the validator rejects impossible blocks), and
testability (fake tools and recorded responses in tests, as ADR-020 does for
the database).

## Next steps

Each production change above needs a requirement, a detailed design and a mock
before implementation, then ATDD slices (AGENTS.md). Suggested order:

1. Planner defects 1–4, 7 and 9 (no new configuration needed).
2. Geocoded home, per-family drive times and weather, family max drive.
3. Commitment attendees and location.
4. Ingestion schema: times, hours, season, price, themes; observance filtering.
5. Events in the planner; plan shapes.
6. Agentic curator spike behind a flag.
