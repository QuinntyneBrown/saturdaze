# Agent draft trigger

`draft` is a triggered WebJob beside `ingest` on the API's B1 plan (ADR-017, ADR-023). It runs
`saturdaze draft-weekends` on the NCRONTAB schedule in `settings.job`, in **UTC**:
`0 0 12 * * 5` is **Fridays at 12:00 UTC** (08:00 in Toronto in summer, 07:00 in winter), four
hours after `ingest` refreshes the shared catalogs and ahead of the Friday preview.

`draft-weekends` drafts the upcoming weekend with the agents for every family with the Friday
preview on, skipping a family whose weekend the agents drafted in the last six days. Each run is
an `AgentRun` row (Saturdaze Admin → Agent runs) with its outcome, usage, cost and trace id. A
family the agents cannot draft keeps the planner's weekend and sees why. The job exits 1 when a
run failed with an error, so the WebJob's history shows it.

`deploy.yml` publishes `Saturdaze.Cli` into `cli/` next to `run.sh` and ships the folder as
`App_Data/jobs/triggered/draft/` in the API zip; the `webjob` job fails when the deployed app does
not list both `ingest` and `draft`.

## On demand

On-demand drafts ("Draft with agents" on the Weekend page) do not use this job: the API queues
them and its `AgentDraftQueueProcessor` runs them one at a time. To run the Friday pass now:
Web App → WebJobs → `draft` → Run, or locally:

```bash
SATURDAZE_CONNECTION="Server=...;Database=Saturdaze;..." \
Saturdaze__AgentPlanning__Enabled=true \
Saturdaze__AgentPlanning__FoundryResource=sd-ai-uofnt2 \
ANTHROPIC_FOUNDRY_API_KEY="<foundry-key>" \
saturdaze draft-weekends
```

## Settings

`Saturdaze:AgentPlanning` (see `docs/detailed-designs/weekend-planning/plan-with-agents`): `Enabled`,
`Auth` (`Key` or `ManagedIdentity`), `FoundryResource`, the role models, `MaxCriticRounds`,
`RunTimeoutSeconds`, the per-run caps, `MaxRunsPerDay`, `MonthlySpendCapUsd` and the prices.
