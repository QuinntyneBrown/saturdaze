# Bug 005 — `GET /api/weekends/current` returns 404 on a fresh database

## Symptom

```
GET /api/weekends/current
HTTP/1.1 404 Not Found
{
  "detail": "No weekend planned for 2026-05-16. POST /api/weekends/plan to create one."
}
```

The Home page assumes there is *always* a current weekend to render —
greeting, forecast strip, day cards, anticipations, quick actions. The
service contract returning 404 means a freshly seeded box has nothing for
the Home page to render.

## Root cause

The `GenerateWeekend` command is only invoked when the user explicitly
plans. No background job, no seed step, no auto-plan-on-first-load.

## Impact

The "first time you open the app" path described in
`docs/user-guide/01-getting-started.md` is broken: there's no weekend to
look at until the user taps **Plan This Weekend**. Today that button does
nothing either (see bug 003), so the loop is closed only in code that
doesn't exist yet.

## Fix

Pick ONE of:

1. **Auto-plan on first load.** The Home page, on mount, calls
   `GET /api/weekends/current`. On 404, it calls
   `POST /api/weekends/plan` with the upcoming Saturday and re-fetches.
   The page renders a loading state in between.
2. **Seed includes a sample weekend.** The `seed` CLI command, after
   inserting catalog + family rows, also runs the planner once for the
   upcoming Saturday so `GET /api/weekends/current` is never empty.

Option 1 fits the user-guide narrative (first tap creates the weekend).
Option 2 keeps integration testing simpler. They are not mutually
exclusive.

## Status

- Logged: 2026-05-16
- Pending.
