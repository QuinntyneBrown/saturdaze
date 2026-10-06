# 01 · How a Weekend Gets Planned

When a family opens Saturdaze and taps Plan weekend, they get a Saturday and a Sunday laid out hour by hour. Soccer practice sits where it always sits, there's an indoor activity because it's going to rain, lunch lands around noon, and the leftover gaps say Downtime. In this video you'll follow that one tap all the way through the code: the Angular page, the API service, the controller, the command handler, and the planner that actually chooses the blocks. By the end you'll know where to look when someone asks why the planner picked something, and which parts you shouldn't touch without reading an ADR first.

## What you'll be able to answer

Keep three questions in mind. First, what happens when the same weekend is planned twice? Second, what goes into a plan: which data does the planner see? Third, how does the planner decide what fills an empty afternoon? Everything in this video answers one of those three.

## From the button to the handler

Start on the frontend. The Weekend page lives in the `saturdaze` app, in `weekend.page.ts`. Its plan method sets a busy flag and calls plan on the weekend service, passing the upcoming Saturday as an ISO date string.

Notice what the page injects. It doesn't import the concrete service class. It injects `WEEKEND_PLAN_SERVICE`, an injection token defined next to the `IWeekendPlanService` contract in the `api` library. The concrete `WeekendPlanService` is bound to that token in `app.config.ts`. That's a project-wide rule: pages depend on the token, so tests can swap in a fake.

The service posts to the plan endpoint with a body containing one field, `weekendOf`. On the backend, `WeekendsController` handles that route, and the action is one line long. It hands a `GenerateWeekendCommand` to MediatR's `ISender` and returns the result. That's deliberate: controllers stay thin and business rules live in handlers.

Before the handler runs, a validation behavior runs `GenerateWeekendCommandValidator`, which has exactly one rule: the date must be a Saturday. Send a Friday and the exception-handling middleware turns that into a four hundred, Bad Request. There's an API test for exactly that case.

## Planning twice returns the same weekend

Now the handler, `GenerateWeekendCommandHandler`. The first thing it does is resolve the current family from the signed-in user. Every query after that is scoped by family id, so one family can never plan, or even see, another family's weekend.

The second thing it does is the most important rule in this flow. It looks for an existing weekend for this family and this Saturday. If one exists, it returns it unchanged, with a fresh forecast, and stops. That's ADR-003. The reasoning is simple: the app's natural flow is "open the app, show a weekend", and an existing weekend may hold locked blocks and favourites the family cares about. Re-posting to plan must never clobber that.

If you want a new plan, that's a separate, explicit endpoint: post to the weekend's regenerate route. The API test `Plan_is_idempotent_per_family_and_date` posts twice and asserts the ids match. If you're tempted to make plan re-plan, read ADR-003 first and expect that test to fail.

## What the planner sees

When no weekend exists, the handler asks `PlannerInputLoader` to gather everything. It loads the family with its members, commitments and preferences; the whole activity catalog; the approved restaurants and the local events that overlap the weekend; the weather forecast for both days; and the family's activity history from earlier weekends.

That bundle becomes a `PlannerInputs` record, with one more field: a seed. On a first plan, the seed is the Saturday's day number. Hold on to that, because it's why planning is repeatable.

The weather comes through the Open-Meteo client. If the provider fails, the forecast for that day is marked unavailable and the planner treats the day as neutral. A weather outage costs you the weather bonus, not the plan.

## The day pipeline

`WeekendPlanner` lives in the Planning folder of the Application project. Its plan method runs the same pipeline twice, once for Saturday and once for Sunday. Here are the steps.

- One: build the fixed blocks. Recurring commitments for that day become blocks that are always locked, with the reason "fixed commitment". If two commitments overlap, the planner throws a conflict instead of guessing.
- Two: compute the gaps between fixed blocks. The day runs from nine in the morning to nine at night, but Sunday ends at seven thirty for wind-down.
- Three: for every gap of at least ninety minutes, score the activities and pick a winner, adding drive blocks on either side.
- Four: place lunch and dinner inside their windows, add the errand on Saturday if there is one, and fill any free range of thirty minutes or more with Downtime.

Finally every block gets a sort order by start time. All of those numbers live in one place, `PlannerTimes`, so tests and code agree on them.

## Scoring an activity

Scoring is where most "why did it pick that" questions end up, so it's worth knowing by heart. First come the disqualifiers. An activity is skipped if it's already picked, if it doesn't fit the gap, if both drives plus thirty minutes of actual activity don't fit, if it matches a disliked tag, or if two or more family members fall outside its age range.

Then the points. Rain or snow and an indoor activity: plus three. Sunny or warm and an outdoor activity: plus two. Round-trip drive longer than forty percent of the gap: minus two. Everyone in the age range: plus two. Done last weekend: minus four; within the last four weekends: minus one. Try-new turned on and never done before: plus three. And one point per liked tag.

The list is sorted by score, ties broken by name, and then the seeded random source picks among the top scorers. That combination is the trade-off: the result feels varied, but the same inputs and the same seed always give the same weekend. That's what makes the planner unit-testable, and it's why a bug report needs the date and the family's data to reproduce.

## Regenerate changes the seed, not the rules

Regenerate runs the same planner with two differences. It keeps the blocks the family locked, apart from commitments, which are rebuilt fresh. And it bumps the weekend's regenerate count and uses the day number plus thirty-one times that count as the new seed. Same rules, different dice. There's also a per-day regenerate that leaves the other day untouched.

## Pitfalls

- Don't put planning logic in the controller or the Angular page. It belongs in the handler or the planner, where the tests are.
- Don't reach for `System.Random` or the clock inside the planner. Randomness goes through the seeded source so plans stay reproducible.
- Don't forget the family scope when you add a query. Load by the current family id, every time.
- And don't change planner numbers inline. Change `PlannerTimes`, then run the planner tests in the Application test project.

## Recap

Things to remember. Plan is idempotent: posting twice returns the same weekend, and regenerate is the explicit reseat. The page depends on an injection token, the controller is one line, and the handler owns the rules. The planner fixes commitments first, fills gaps of ninety minutes or more by score, then adds meals, errands and downtime. And a seeded random source makes every plan reproducible.

Next time, we'll look at the other half of the weekend: locking, swapping and per-day regeneration, and how the frontend keeps the screen in sync while they run.
