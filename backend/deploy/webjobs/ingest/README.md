# Ingestion triggers

Catalog ingestion (`LocalEvents` / `Activities` / `Restaurants`, refreshed from a
grounded Claude web search) can be triggered three ways. All three run the same
`IngestionRunner`, so the behaviour is identical — only the *cadence owner*
differs. Pick one.

## 1. `Saturdaze.Worker` as a long-lived service (recommended)

A .NET Worker Service (`backend/src/Saturdaze.Worker`) that owns its own cron
schedule via the dependency-free `CronSchedule`. Deploy as a container, a
systemd unit, an Azure Container App, or a Kubernetes Deployment.

```bash
SATURDAZE_CONNECTION="Server=...;Database=Saturdaze;..." \
ANTHROPIC_API_KEY="sk-ant-..." \
dotnet Saturdaze.Worker.dll
```

Schedule is configured under `Saturdaze:Ingestion:Schedule` (cron, types,
`RunOnStartup`, `RunOnceThenExit`). Default: Fridays 08:00 UTC.

## 2. `Saturdaze.Worker` as a one-shot container job

Set `Saturdaze__Ingestion__Schedule__RunOnceThenExit=true` and let an external
scheduler (Kubernetes `CronJob`, Azure Container Apps Job) own the cadence. The
process runs one pass and exits.

## 3. Azure App Service triggered WebJob (this folder)

The zero-extra-infrastructure option from the design doc: a triggered WebJob
co-located with the API, defined by `settings.job` (the cron) and `run.sh`
(which invokes `saturdaze ingest --type all`). Ship the contents of this folder
under `App_Data/jobs/triggered/ingest/` in the API deployment package.

## On-demand (any of the above, plus the CLI)

```bash
saturdaze ingest --type events            # one catalog
saturdaze ingest --type all --dry-run     # tune the prompt, write nothing
```

## Secrets

`ANTHROPIC_API_KEY` is read from the environment and is never logged, echoed by
`--dry-run`, or committed to the repo.
