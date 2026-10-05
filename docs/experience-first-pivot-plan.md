# Experience-First Pivot Plan

> Status: proposal · 2026-09-11
>
> Source: Daniel Pink, LinkedIn post *"If you optimize your life long enough,
> you forget to live it"* (activity 7504221071001321473), citing Van Boven, L.,
> & Gilovich, T. (2003). *To do or to have? That is the question.* Journal of
> Personality and Social Psychology, 85(6), 1193–1202.

## 1. The idea being applied

Pink's post makes three claims:

1. **Experiences beat things** on both happiness *and* perceived value, for
   purchases over $100.
2. **Experiences appreciate; things depreciate.** "A jacket becomes furniture
   in your closet within a month. A trip becomes a story you tell for twenty
   years, and it usually improves in the telling."
3. **The decision rule:** "When the choice is close, buy the one you will
   still be talking about."

Framing line: *"If you optimize your life long enough, you forget to live it."*

Caveat: only the written post and top comments were read; the attached video
has no transcript on the page. The post text reads as the video's script.

## 2. Where Saturdaze sits today: it is an optimizer

The planner describes itself as "rule-based, deterministic." What it actually
maximizes:

| Observation | Where |
| --- | --- |
| **Fit, not memory.** The score rewards weather fit (+2/+3), drive fit (−2), age fit (+2), recency (−4/−1), and liked-tag matches. Nothing asks "will this become a story?" | `backend/src/Saturdaze.Application/Planning/WeekendPlanner.cs` — `ScoreActivities` |
| **Every gap gets filled.** Any gap ≥ 90 min receives an activity. Downtime is a *residual*, labelled "N-min open slot." Whitespace is what's left after optimization, never the goal. | `PlannerTimes.cs:16` (`ActivityMinGapMinutes`), `WeekendPlanner.cs` — `FillDowntime` |
| **Ties go to a coin flip.** Equal-scoring activities are picked by seeded RNG. Pink's rule says ties should break toward the one you'll still be talking about. | `WeekendPlanner.cs` — `topCandidates[rng.Next(...)]` in `PlanDay` and `PickActivityForGap` |
| **The feedback loop is dead-ended.** `Weekend.Rating` is stored and displayed on Saved but never read by the planner. L1-010 promises "low-rated → avoid repeating," yet `RecencyScore` is the only history signal and treats a 5★ Zoo trip and a 1★ Zoo trip identically. | `Saturdaze.Domain/Entities/Weekend.cs:23`; planner has zero references to `Rating` |
| **Errands are first-class; memories aren't.** There is a `ShoppingErrand` entity and a dedicated placement algorithm. There is no entity for "what we'll remember." The user guide says it plainly: "no memory notes feature today." | `WeekendPlanner.cs` — `PlaceErrand`; `docs/user-guide/09-saved-weekends.md` |
| **Meals are logistics.** Restaurant choice is `WifeApproved` + closest drive to the anchor activity. A meal is fuel between blocks, not part of the experience. | `WeekendPlanner.cs` — `PlaceMeals` |
| **Budget is inert.** `Family.BudgetEnabled` exists but the planner ignores it. | `Saturdaze.Domain/Entities/Family.cs:11` |
| **The only nod to Pink is `TryNew`.** The +3 novelty bonus is the one place the planner values something other than fit. It is a toggle, not a philosophy. | `WeekendPlanner.cs` — `ScoreActivities`, try-new branch |

The seed data reinforces this. The Brown family's preferences are *categories*
(Parks, Zoo, Rec Room) and *constraints* (no camping, no drives > 60 min).
Nothing captures "what did we love."

## 3. The pivot: from weekend optimizer to weekend memory-maker

Keep the constraint solver. Fixed commitments, weather, age fit, and drive
times are hygiene that keep a plan *feasible*. Change the **objective
function** and close the **feedback loop**.

### 3.1 Change what the score rewards

Add a memorability axis to `Activity` — *story potential* — the product of:

- **distinctiveness** — how unlike the weekly routine it is;
- **shared-ness** — whether the whole family does it together;
- **novelty** — already partially present via `TryNew`.

The Lavender Farm at a 45-minute drive currently loses points for drive fit;
under Pink's rule it may be the weekend's one story.

### 3.2 Break ties toward the story

The smallest, highest-leverage change in the codebase: replace the RNG
tie-break with "prefer the candidate never done / done longest ago / highest
story potential." That is Pink's rule, encoded. Determinism is preserved — the
seeded RNG still resolves whatever ties remain.

### 3.3 Make the rating matter — and ask it later

The study's key finding is that experiences *improve in the telling*, so the
interesting rating is not Sunday night's but the one two weeks later.

- Add a delayed "how do you remember it?" prompt.
- Feed `Rating` into `ScoreActivities`: 5★ activities' *category and shape*
  (long outing, far drive, whole-family) get promoted; 1–2★ get demoted harder
  than recency alone.

### 3.4 Plan whitespace on purpose

Flip `FillDowntime` from residual to intentional:

- Add a `BlockKind` such as `Unscheduled` with the reason "nothing planned — on
  purpose."
- Add a planner mode, **one big thing**: one anchor experience per weekend,
  everything else protected.

This is the direct answer to "if you optimize long enough, you forget to live."

### 3.5 Reframe errands and budget as the "jacket"

Pink's study is about > $100 purchases. When `BudgetEnabled` is on, frame it as
an *experience* budget ("spend it on the Zoo, not the errand"). Surface the
trade-off the optimizer currently hides: *"Slotting this Costco run Saturday
morning costs you the lavender farm."*

### 3.6 Turn Saved into a storybook

Saved is currently an audit trail (date range, rating, regenerate count,
"avoid repeating"). Pivot it into a family memory log. After each weekend, one
prompt — *"What's the one thing you'll tell someone about?"* — stored on
`Weekend` (the `Notes` field already exists and is barely used). Over a year
that becomes the product's real value: the twenty-year stories, not the
schedules.

### 3.7 Change the front door

The hero button says **Plan This Weekend**. The pivoted app asks **What will
you remember?** — and each day card's "highlight" becomes the story hook, not
the top-scoring activity.

## 4. What not to change

- **Keep the constraint layer and determinism.** ADR-003 idempotency, the
  seeded RNG, and block locking stay. The pivot is what the planner
  *maximizes*, not how it solves.
- **Don't over-read the study.** It is about purchases, not schedules. A family
  with a five-year-old still needs structure, and for a tired parent "a
  Saturday of nothing" can *be* the memorable weekend. Whitespace-on-purpose
  (§3.4) is the guardrail against turning "memorable" into a new thing to
  optimize.

## 5. Sequencing

| Tier | Change | Scope |
| --- | --- | --- |
| 1 | Tie-break toward story potential; downtime with intent; `Rating` feeds `ScoreActivities` | ~1 weekend, all in `WeekendPlanner.cs` plus one enum value |
| 2 | Post-weekend story prompt + delayed rating; Saved → storybook | Domain field, one CDK dialog, Saved page |
| 3 | "One big thing" mode; experience budget; home-screen reframe | New planner mode, home hero, user-guide rewrite |

Each tier should land with an ADR (planner objective change) and updates to
`docs/specs/L1.md` / `L2.md` and the affected user-guide chapters
(`03-planning-your-weekend.md`, `09-saved-weekends.md`).
