# 46 · Couples dates: the backend

This is the second of three videos on couples dates in Saturdaze. The first showed the product. This one walks the backend: the requirement and the architecture decision, the new aggregate, the endpoints, the planner that chooses a restaurant and an activity, the workflow that keeps the family weekend in step, the breakfast slot, and the tests that prove all of it.

## The requirement and the decision

Everything starts in the specs. The high-level requirement, L1 dash zero four two, says a parent can have Saturdaze pre-plan a date for two adults: breakfast, lunch or dinner on Saturday or Sunday, at a restaurant that serves that meal, with an optional nearby activity, about two to three hours in all. It must never clash with the couple's commitments, the weekend must plan around it, and Saturdaze books nothing. Seven detailed requirements, L2 two nineteen to two twenty-five, refine it with acceptance criteria, and each one has a test.

The architecture decision is ADR dash zero two five. Its first decision is the big one: a date is its own aggregate tied to a weekend, not a set of flagged itinerary blocks. A date has attendees, a meal, rejected restaurants, a regenerate count and its own lifecycle, none of which belong on a block. The second decision follows from it: the weekend sees the date as one locked block of a new kind, Date. Every existing path already treats a locked block as fixed, so the planner needed no new input.

## The aggregate

The entity is CoupleDate in the Domain project. It carries the family and weekend ids, the day and meal, start and end time from the first drive to the last, the two attendee ids, the restaurant, an optional activity, a flag for an activity the couple dropped, the restaurant and activity ids they swapped away, the planned steps as JSON, a regenerate count and a created timestamp. A unique index on weekend, day and meal holds one date per meal per day. Two enums grew: MealSlot gains Breakfast as value three, after the existing values so stored integers keep their meaning, and BlockKind gains Date as value eight. One migration, AddCoupleDates, adds the table and nothing else changes in the schema.

## The endpoints

DatesController lives under api slash weekends slash the weekend id slash dates, authenticated by default. It has no rules of its own; every action sends a MediatR request. GET lists the weekend's dates with the family's adults and whether a date can be planned. POST plans one, or returns the existing date for that meal and day, the same idempotency the weekend has. PUT moves it. Then four small actions: regenerate, swap restaurant, swap activity, and DELETE on the activity to drop it. DELETE on the date cancels it with a two oh four. Every handler loads the weekend and the date by id and by the caller's family, so another family's ids are simply not found.

## Who can go, and when

DateRules holds the small rules. DateAttendees resolves the request into two people: with no ids it takes the two oldest adults, or refuses with a message that a date needs two adults, eighteen or over. Named ids must be exactly two different members of the caller's family, each an adult. DateWindow refuses a weekend that is already past or more than one weekend ahead. And DateBusyTime builds what the date may not overlap: commitments for everyone or for either attendee, calendar commitments, the day's locked blocks, and the day's other dates. A swim lesson that is only for a child does not block the parents' breakfast.

## The planner

DatePlanner is deterministic and pure: the same request always plans the same date. It reads the same planner context the weekend planner uses, home, drive times, profile, preferences, calendar commitments and sunsets. Each meal has a window: breakfast eight to ten thirty, lunch eleven thirty to two, dinner five thirty to nine, with a ninety-minute meal inside it.

First it ranks the restaurants of that meal: within the family's maximum drive, approved, not disliked by name or style, not excluded by an observance, and not one swapped away from this date. A restaurant the family locked for that day and meal comes first, then liked tags, then up votes minus down votes, then the shortest drive, then the name. If nothing passes, it throws a conflict, no restaurant fits, with a message that names the meal and says what to try.

Then it walks the ranked list and, for each restaurant, tries meal starts every fifteen minutes from the start of the window. The first start whose whole span, drive there to drive home, avoids every busy interval wins. If restaurants pass but no start fits, the conflict is date clash, naming what is in the way. Nothing is ever invented.

Finally the activity: sixty minutes after breakfast or lunch, before dinner, within fifteen minutes of the restaurant, chosen with the weekend planner's candidate filter evaluated for the two adults, nearest first, open for the visit and back before sunset outdoors. If none fits, the date is just the meal. Each step gets a reason: near home, locked by family vote, two votes up, five minutes from the restaurant.

## Keeping the weekend in step

DateWorkflow holds the steps every handler shares. It loads the context, the family's votes and lock, runs the planner, and only then writes the plan onto the date, so a refused plan leaves the date exactly as it was. It removes the weekend's old Date block for that date and adds one locked block from the first drive to the last, titled the meal, date at, the restaurant, with a reason that names who is going and, when children stay home, kids need care and the window.

Then it calls WeekendReplanner, replan day, for each affected day, both days on a move across days. That method keeps the other day wholesale and, on this day, only the locked blocks, then plans the rest again. The day's regenerate uses the same method now. The weekend planner's build fixed blocks already carried locked blocks of any kind, so meals and outings go around the date without new code.

Three guards keep the block fixed. The lock handler refuses to unlock a Date block with a conflict, date locked. Unlocking a whole day leaves it locked. And repeat and remix leave Date blocks out, because the date belongs to its own weekend. One subtle change in the weekend planner: a Date block may overlap a commitment whose attendees are named, since that commitment is for other people and the date was already planned clear of its own.

## Breakfast

Breakfast is a meal slot now. PlannerTimes has a breakfast window. The seed files add breakfast places keyed by name and slot, so re-seeding is idempotent. The ingestion prompt lists Breakfast among the slots, and the parser and upserter already accepted any defined slot. Locking a breakfast restaurant places the meal at eight thirty, and the slot check now splits the day at eleven and at three, so a breakfast lock never takes the lunch block. The family weekend planner still reserves only lunch and dinner; breakfast reaches the weekend only through a date or an explicit lock.

## The tests

Every slice was built test-first. Seven test classes under Saturdaze API Tests, Dates, drive the real API on an in-memory SQLite database: breakfast slot, plan date, date scope, date fits weekend, change date, date profile and past date, thirty-four tests in all, each tracing to an acceptance criterion. DatePlannerTests in the Application tests covers the planner alone, with a tiny catalog it builds by hand. No test needs a database server.

## Recap

A date is its own aggregate, and the weekend sees it as one locked block. The planner reuses the weekend planner's context and rules, ranks restaurants by lock, likes, votes and drive, finds the first start that avoids busy time, and adds a nearby activity when one fits. The workflow rewrites the block and re-plans only the affected days. Breakfast is a slot, and thirty-four API tests plus the planner tests prove every criterion. The last video shows the frontend and the end-to-end tests.
