# ADR-010 — Visual parity policy: mocks-v2 as the baseline, masks for live data

**Status:** Accepted
**Date:** 2026-09-02
**Related:** [ADR-009](ADR-009-v2-responsive-shell.md), [docs/mocks-v2/README.md](../mocks-v2/README.md).

## Context

The v1 visual suite captured 177 baselines from the static mocks and compared the running app against them pixel for pixel. It never passed after the first week: the planner picks different activities every run, the weather is live, dates move every weekend, and no rule said which regions were allowed to differ. Every failure looked the same, so nobody read them.

The v2 suite keeps the idea (the mocks are the design, the app must match them) and adds the missing rule.

## Decisions

### 1. Baselines come from `docs/mocks-v2`, captured by the same config

`npm run baseline` (`SD_BASELINE=1`) serves `docs/mocks-v2` on `:5173` and writes the snapshots; the normal run serves the Angular app on `:4200` and compares. Both use the same project names (mobile 390×844, tablet 820×1180, desktop 1440×900) so they read and write the same files. Baselines are re-captured only when an intentional design change has landed in the mocks.

### 2. Three tiers of comparison

| tier | what is compared | examples |
| --- | --- | --- |
| **Full page, exact** | screens whose copy is fixed or seed-derived | landing, legal, sign-in, create-account, the reset-password and verify-email states, the dialogs gallery, the empty states |
| **Element, masked** | components whose layout is fixed but whose content is live | the top bar and bottom nav (the P4 entry gate), a `sd-day` header, a `sd-block` row, a food card, a past card, the family sections |
| **Not compared** | planner-driven content as a whole | the full Weekend page, the Ideas grids |

Masks cover dated and weather-driven regions: `.day__meta`, `.date-tile`, `.card__meta`, `.card__eyebrow`, `.submitter`, `.prose__updated`, `.page-header__subtitle`, the account card's `.list__sub`, and dated `.dialog__sub` lines. Behaviour specs, not screenshots, assert the planner-driven content (a Saturday and a Sunday exist, commitments are present and locked, the errand lands on the chosen day).

### 3. Tolerance is fixed; parity failures are fixed in components

`maxDiffPixelRatio: 0.005`, `threshold: 0.05`, animations disabled. A diff is a component bug (a host element adding a box, a wrong token, a missed modifier) or a deliberate design change that must first land in the mocks. The tolerance is never loosened to make a run pass, and a mask is never widened to hide a layout difference.

### 4. Static states through the dev override

Mock states that the backend cannot be driven into on demand (`weekend?state=empty|generating`, `past?state=empty`, `review-submissions?state=empty`, `sign-in?state=error`, `reset-password?state=sent|new|done|expired`, `verify-email?state=sent|verifying|verified|expired`) are rendered by the app's `?state=` override, which exists only in development builds. The mocks carry the same states as separate pages or `#state-*` sections, so the comparison stays one-to-one.

### 5. The shell gate runs first

`shell.visual` (top bar at tablet and desktop, bottom nav at mobile) runs before any other visual spec. If the shell drifts, every page drifts with it, and the fix belongs in the shell components.

## Consequences

- Around 85 visual tests over ~215 baselines, each with a stated reason for what it compares.
- A green visual run means the app matches the design where the design is fixed; it does not claim the weekend content is right, which is the behaviour suite's job.
- Adding a screen means adding its mock, its baseline, and deciding its tier in the spec.
