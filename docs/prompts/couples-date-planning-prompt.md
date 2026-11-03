# Feature: Pre-plan a date for the couple (breakfast, lunch or dinner)

## Goal

Today Saturdaze plans only whole family weekends. The planner (`backend/src/Saturdaze.Application/Planning/`)
builds Saturday and Sunday itineraries for everyone in "Who's in". Meals are restaurant picks from the
`Restaurant` catalog, which has a `MealSlot` of only `Lunch` or `Dinner`
(`backend/src/Saturdaze.Domain/Enums/MealSlot.cs`). There is no way for the two adults to plan time for just
themselves.

What the user should get:

1. **Plan a date.** Alongside the weekend, a parent can ask Saturdaze to pre-plan a date for the couple. They
   pick the meal (breakfast, lunch or dinner) and the day (Saturday or Sunday of the current or next weekend).
   Saturdaze proposes a short outing: the meal at a restaurant that serves that meal, plus an optional
   nearby activity before or after it, for example a walk or a gallery, with travel time from home. A date is
   about two to three hours long by default.
2. **Who goes.** A date is for two adult members of the family (age 18 or over), chosen from "Who's in". By
   default it is the two oldest adults. If the family has fewer than two adults, the option is shown but
   disabled, with a short reason.
3. **It fits the weekend.** A date must not clash with the family's recurring commitments, calendar
   commitments (L1-040) or the weekend's existing blocks for the people on the date. When the family weekend
   is planned or regenerated, it plans around the date. The date shows on the weekend view as its own block,
   marked as a date, with who is going. Children stay on the family plan, and the weekend shows a "kids need
   care" note for that window. Saturdaze does not book childcare.
4. **Change it.** The couple can swap the restaurant, swap or drop the activity, move the date to another meal
   or day, or cancel it. Editing opens a CDK Dialog. There are no inline forms. Re-asking for a date that
   already exists returns the existing date instead of a new one, the same as weekends (ADR-003). A
   separate "regenerate" action reseats it.
5. **Respect the profile.** The date uses the family's home, maximum drive time, observances, liked and
   avoided places, restaurant votes and opening hours, as the weekend planner already does (L1-041).
6. **Past dates.** A planned date appears with its weekend on `/past`, and can be rated with the weekend.

Where this lives today:

- Weekend planning: `backend/src/Saturdaze.Application/Weekends/` (`GenerateWeekendCommandHandler.cs`,
  `RegenerateWeekendCommandHandler.cs`, `WeekendReplanner.cs`, `WeekendMapper.cs`) and
  `backend/src/Saturdaze.Api/Controllers/WeekendsController.cs`.
- The planner and its inputs: `backend/src/Saturdaze.Application/Planning/` (`WeekendPlanner.cs`,
  `PlannerInputLoader.cs`, `CandidateFilter.cs`, `PlannerTimes.cs`).
- Agent planning: `backend/src/Saturdaze.Application/AgentPlanning/` and ADR-023.
- Restaurants: `backend/src/Saturdaze.Domain/Entities/Restaurant.cs`, `RestaurantVote.cs`, `RestaurantLock.cs`,
  `backend/src/Saturdaze.Application/Restaurants/` and `RestaurantsController.cs`.
- Members: `backend/src/Saturdaze.Domain/Entities/FamilyMember.cs` (name, age, optional account).
- Frontend: the weekend page `frontend/projects/saturdaze/src/app/pages/weekend/`, food ideas
  `frontend/projects/saturdaze/src/app/pages/ideas-food/`, past `frontend/projects/saturdaze/src/app/pages/past/`,
  dialogs in `frontend/projects/saturdaze/src/app/dialogs/`, and the API contracts in `frontend/projects/api/`.
- Navigation has exactly four items (`frontend/projects/components/src/lib/shared/nav-key.ts`, a fixed
  contract). Do not add a fifth. Put the date entry point on `/weekend`, and optionally on `/ideas/food`.

What stays unchanged:

- Family weekend planning, idempotency (ADR-003) and the deterministic planner's authority over hard
  constraints (L1-041) stay as they are, apart from planning around a date.
- Existing lunch and dinner restaurant behaviour, votes and locks keep working.
- All date data is family-owned and scoped to the caller's family (ADR-008). No family sees another family's
  dates.
- The four-item navigation and the bottom-nav chrome behaviour (ADR-005).

## Finish the whole feature in one run. Do not stop. (CRITICAL)

- You are authorised to take this feature all the way: mocks, requirements, detailed design, an ADR,
  incremental test-first implementation, docs and estimates alignment, green tests and a PR. Go through every
  phase and every slice in one continuous run. Do not pause between phases to report, ask for approval, or
  wait for "continue".
- Do not end your turn until the "Done means" list at the bottom is fully true. A partial result, a plan, or
  "the next steps would be..." is not done.
- Where the repo's instructions say "stop and ask", treat this prompt as the confirmation in advance for
  everything in scope here. Choose the simplest option that fits the existing architecture, record it (an ADR
  or the design's open-questions section, if the repo has them), and keep going.
- If a shared library, component or design asset lacks something, that is not a reason to stop. Update it
  first, as the repo's rules require, then go on.
- When a test, build or command fails, find the root cause and fix it, then go on. Never weaken a test to make
  it pass, and never skip a step quietly.
- Only stop for a real blocker you cannot resolve yourself, such as missing credentials, or an action outside
  this repo that can't be undone, such as production deploys or data changes. If that happens, finish
  everything else first, then report the blocker clearly.
- Keep track of progress (a todo list), so that nothing gets left out after context is summarised.

## Rules (read first, binding)

- Follow `AGENTS.md` exactly, especially:
  - A requirement, a detailed design and a mock come before any production code. Use the
    `implementing-incrementally` skill with ATDD: write the failing acceptance test first, for each slice.
  - Back end: integration tests against the API in `backend/tests/Saturdaze.Api.Tests/` (start from the
    weekend and restaurant tests already there). Planner unit coverage goes in
    `backend/tests/Saturdaze.Application.Tests/`. Tests use per-fixture SQLite or EF InMemory, never a
    database server (ADR-020). API tests run sequentially (ADR-002).
  - Front end: Playwright in `e2e/tests/` (start from `weekend.spec.ts`, `weekend-states.spec.ts`,
    `ideas-food.spec.ts` and `past.spec.ts`), with the Page Object Model in `e2e/pages/` (`weekend.page.ts`,
    `ideas.page.ts`, `past.page.ts`, `dialogs.page.ts`). Never put a selector in a test. Run in Chromium only.
  - Never write architecture tests. Do not write tests for the mocks or the design system.
  - Business rules go in handlers and the planner, not controllers. Endpoints are authenticated by default
    (ADR-008). Family-owned data stays scoped to the current user's family.
  - The API does not apply migrations on startup. Add an EF migration in `Saturdaze.Infrastructure` for the
    new date entity and the `MealSlot.Breakfast` value. Keep the seed data idempotent, and seed some
    breakfast restaurants so the feature works out of the box and in e2e (`eng/Start-E2eApi.ps1`).
  - Frontend: `sd-*` selectors, keep the mock's BEM classes (ADR-009), Fluent v9 tokens by role (ADR-013), no
    inline forms in pages (editing opens a CDK Dialog in `frontend/projects/saturdaze/src/app/dialogs/`), and
    API services behind their contract and injection token. Each `ng-content` slot is declared once. Run
    `npm run lint` and `npm run format:check` in `frontend/`.
  - If a component's API changes, update its Storybook story folder and run `npm run build-storybook`. A new
    component also needs a story folder and a perf-test scenario (ADR-012, ADR-014).
  - Read ADR-003 (idempotent planning), ADR-022 (calendar sync) and ADR-023 (agentic planning) before
    designing. Read ADR-010 before changing visual baselines; update baselines only for intentional design
    changes.
- Work through the phases below **in order**, using the repo skill each phase names.
- Copy the house style of each folder. Read the existing neighbours before you write anything new.

## Phase 1: Mocks

- Update the static design reference in `docs/mocks/pages/`. Follow `docs/mocks/README.md` and the existing
  pages.
  - `weekend.html`: a "Plan a date" entry point, and the weekend with a planned date block (meal, restaurant,
    optional activity, travel, who is going) plus the "kids need care" note for that window.
  - A new `weekend.date.html` (or the closest house naming) for the date detail: the plan, why each pick was
    made, and the swap, move, regenerate and cancel actions.
  - `dialogs.html`: a "Plan a date" dialog (meal: breakfast, lunch, dinner; day; who is going) with its
    disabled state for fewer than two adults, and dialogs to swap the restaurant or activity and to confirm
    cancelling.
  - `ideas.food.html`: breakfast spots, and a "Plan a date here" action if you add that entry point.
  - `past.html`: a past weekend that included a date.
  - States to cover: no date yet, planning in progress, planned, no restaurant fits (with a clear fallback
    message), fewer than two adults.
- Keep the design system (`frontend/projects/components/stories/`, `docs/design-system/`) in step if a new
  pattern is needed, for example a "date" block variant. That work is design-only and gets no tests.

## Phase 2: Requirements (`engineering-requirements`)

- Add `L1-042: Couples Date Planning` to `docs/specs/L1.md`. Then add L2 requirements to `docs/specs/L2.md`,
  starting at L2-219 (L2-218 is the last). Suggested split:
  - Plan a date: meal (breakfast, lunch, dinner), day, the two adults, the default duration and the proposed
    shape (meal plus optional activity plus travel). Validation: two distinct adult members of the caller's
    family, a day within the current or next weekend, one date per meal slot per day.
  - Breakfast as a meal slot: the catalog, ingestion and food ideas support breakfast restaurants, with
    sensible default times (for example breakfast 8:00–10:30, lunch 11:30–14:00, dinner 17:30–21:00).
  - Fitting the weekend: no clash with commitments or calendar commitments for the attendees, the family
    weekend plans around the date on generate and regenerate, and the "kids need care" note.
  - Idempotency and change: re-asking returns the existing date, plus swap, move, regenerate and cancel, with
    their error responses (400 validation, 404 not in this family, 409 clash or duplicate).
  - Respecting the profile: home, drive time, observances, likes, avoids, votes and opening hours. No venue or
    URL is invented.
  - Showing it: the date on `/weekend` and with its weekend on `/past`.
- Cross-reference L1-003, L1-037 and L1-041 and their L2s rather than copying them.

## Phase 3: Detailed design (`writing-software-design-documents`)

- Add `docs/detailed-designs/weekend-planning/plan-a-couples-date/README.md`, following the neighbouring
  feature folders such as `generate-current-weekend` and `control-itinerary-blocks`. Update those neighbours,
  and `fit-plans-to-the-family` and `plan-with-agents`, where they change.
- Cover:
  - The domain model: a date entity (or a date-flagged block group) tied to a `Weekend`, its attendees, meal
    slot, day and blocks. Decide whether a date is its own aggregate or part of `Weekend`, and record why.
  - The API shape, for example `POST /api/weekends/{id}/dates` (idempotent), `GET`,
    `POST /api/weekends/{id}/dates/{dateId}/regenerate`, swap and move endpoints and `DELETE`, or the simplest
    equivalent that fits `WeekendsController`.
  - The planner change: a date planner that reuses `PlannerInputLoader` and `CandidateFilter`, and how the
    weekend planner treats a date as a fixed constraint. Say whether the agents (ADR-023) draft dates now or
    later.
  - Adding `MealSlot.Breakfast`, the migration and its effect on existing restaurant code and seeds.
  - The frontend service contract in `frontend/projects/api/`, the page and dialog changes, sequence diagrams,
    and the security rules (family scope, adults only).
- Record the main decisions as `docs/adr/ADR-025-couples-date-planning.md`: where a date lives in the model,
  how it interacts with weekend idempotency and regenerate, and why it is a block on `/weekend` and not a
  fifth nav item.

## Phase 4: Incremental implementation (`implementing-incrementally`, test-first)

- Plan thin vertical slices, for example:
  1. **API:** `MealSlot.Breakfast` with its migration and seeded breakfast restaurants. Food ideas return
     them.
  2. **API:** plan a date for two adults on a given weekend day and meal. It returns a meal block at a
     fitting restaurant with travel from home. Re-posting returns the same date.
  3. **API:** validation and scoping: fewer than two adults, a child chosen, a member from another family, a
     day outside the weekend, and a duplicate date (400, 404, 409).
  4. **API:** the date avoids the attendees' commitments and calendar commitments. Generating and
     regenerating the family weekend plans around it, and the weekend carries the "kids need care" window.
  5. **API:** the optional nearby activity, plus swap restaurant, swap or drop activity, move, regenerate and
     cancel.
  6. **UI:** the "Plan a date" dialog on `/weekend` and the planned date block with who is going.
  7. **UI:** the date detail and the swap, move, regenerate and cancel dialogs, with the empty, planning, no
     fit and fewer-than-two-adults states.
  8. **UI:** breakfast on `/ideas/food` (and "Plan a date here" if designed), and the date on `/past`.
- For each slice:
  - Write the Given-When-Then criteria.
  - Write the acceptance test, following the repo's test approach and locations.
  - Run it and show that it fails for the expected reason.
  - Implement the minimum that makes it pass, and refactor while the tests are green.
  - Run the regression checks, then commit.
- Regression checks:
  - Backend: `dotnet test backend/Saturdaze.sln`.
  - Frontend, from `frontend/`: `npm run lint`, `npm run format:check`, `npm run tokens:check` if tokens
    changed, the frontend unit specs, and `npm run build -- saturdaze --configuration development`.
  - Playwright: from `e2e/`, against the API started by `eng/Start-E2eApi.ps1`, run the relevant tests in
    Chromium.
  - `npm run build-storybook` if a component's API changed.
- When all slices are green, bring `docs/estimates/weekend-planning.md`, `docs/estimates/discovery.md` (for
  breakfast) and `docs/estimates/README.md` to their true state (`estimating-designs`). Keep the mocks,
  requirements, designs and ADR aligned with what was built.

## Deferred (not in scope)

- Booking restaurants or childcare, and any payment.
- Dates outside a weekend (weeknights), recurring date nights, and dates for anyone other than two adults of
  the family.
- Agent-drafted dates, if the design decides the planner handles dates first.
- Calendar sync of the date as its own event, beyond what weekend calendar sync already exports.
- Notifications or reminders about an upcoming date.

## Done means

- A parent can plan a breakfast, lunch or dinner date for two adults on Saturday or Sunday. It shows on
  `/weekend` as a date block with the restaurant, an optional activity, travel and who is going.
- The date avoids the attendees' commitments, the family weekend plans around it, and the kids' plan carries
  a "kids need care" note for that window.
- Re-asking returns the same date. Swap, move, regenerate and cancel all work through dialogs. Families with
  fewer than two adults see the option disabled with a reason. No family can see or change another family's
  date.
- Breakfast restaurants exist in the catalog and on `/ideas/food`. Past weekends show their date.
- All the new and existing tests pass: `dotnet test backend/Saturdaze.sln`, the frontend lint, format and unit
  specs, and the relevant Playwright tests in Chromium.
- The mocks, `docs/specs/L1.md`, `docs/specs/L2.md`, the detailed designs, ADR-025 and `docs/estimates/` agree
  with the code.
- The work is on a branch with a PR to `main`, following the repo's conventions. Fetch and rebase onto `main`
  first, because another session may have pushed to it.
- Only then end the run, with a short summary of what was built, the decisions made along the way, and
  anything deferred.
