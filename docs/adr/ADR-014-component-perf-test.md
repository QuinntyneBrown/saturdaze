# ADR-014 — Component perf test modelled on Fluent UI's perf-test

**Status:** Accepted
**Date:** 2026-10-06
**Related:** [ADR-012](ADR-012-storybook-design-system.md), [ADR-013](ADR-013-fluent-design-tokens.md).

## Context

The `components` library is rendered hundreds of times per screen (blocks, chips and icons on the Weekend plan; cards on Ideas), but nothing measured what a component costs to render. A change that doubles `sd-chip`'s creation cost would pass every functional and visual test.

Fluent UI, whose docsite and token model we already follow (ADR-012, ADR-013), answers this with [`apps/perf-test`](https://github.com/QuinntyneBrown/fluentui/tree/master/apps/perf-test): a scenario app that renders each component many times, a runner (flamegrill on Puppeteer) that profiles it in Chromium, and a per-PR comparison against the base branch.

## Decision

Port that design to Angular:

1. **Scenario app.** `frontend/projects/perf-test` is an Angular application in the workspace. Each file in `src/scenarios/` default-exports a standalone component rendering one realistic instance, with an optional `decorator` export that wraps all iterations once. `src/renderer.ts` is the counterpart of Fluent's renderer: it reads `?scenario=&iterations=&renderType=`, renders with `createComponent` under zoneless change detection, and appends `#render-done` carrying a `performance.measure` duration. Render types keep Fluent's names: `mount`, `virtual-rerender` (change detection on one instance) and `virtual-rerender-with-unmount` (create, render, destroy).
2. **Runner.** `e2e/perf-test/perf-test.mjs` replaces flamegrill with Playwright's Chromium (already the only browser we test in) and the CDP `Profiler` domain. It serves the build, loads each scenario with the profiler running from before navigation, and keeps the render time, non-idle ticks and the `.cpuprofile` of the median run. Config mirrors Fluent's `config/perf-test`: per-scenario iterations, per-scenario render types, excluded scenarios.
3. **Baseline comparison.** With `--baseline`, the PR and baseline builds are loaded alternately (after a warm-up each) so machine drift affects both. A row is flagged when the median render time is more than 10% and 1 ms slower **and** the runs do not overlap; same-build runs on one machine vary by 5–15%, and the overlap rule keeps an A/A comparison clean.
4. **CI.** `.github/workflows/perf-test.yml` runs on PRs touching `frontend/`, builds the base branch in a worktree (reusing `node_modules` when the lockfile is unchanged), and writes the report to the job summary with the profiles as an artifact. It is report-only, like Fluent's, and not a required check. Builds use `NG_BUILD_MANGLE=0` so profiles name real functions.

## Consequences

- Render-cost changes in the component library are visible on every PR, with a profile to explain them.
- These are measurements, not tests: they assert no behavior, so ATDD and the "no architecture tests" rule are untouched. Nothing gates a merge on them; a flagged row needs a person to read the profile.
- A scenario is a few lines per component; scenarios exist for the atoms, form controls, cards, `sd-block`, a whole `sd-day`, and `[sdThemeProvider]`. New components should add one.
- The PR job roughly doubles frontend build time on PRs (two `ng build perf-test`s plus ~2 minutes of measurement).
