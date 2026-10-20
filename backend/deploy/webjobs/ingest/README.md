# Ingestion triggers

Catalog ingestion (`LocalEvents` / `Activities` / `Restaurants`, refreshed from a
grounded Claude web search on Microsoft Foundry, ADR-011) can be triggered three ways. All three run the same
`IngestionRunner`, so the behaviour is identical — only the *cadence owner*
differs. Pick one.

## 1. `Saturdaze.Worker` as a long-lived service

A .NET Worker Service (`backend/src/Saturdaze.Worker`) that owns its own cron
schedule via the dependency-free `CronSchedule`. Deploy as a container, a
systemd unit, an Azure Container App, or a Kubernetes Deployment.

```bash
SATURDAZE_CONNECTION="Server=...;Database=Saturdaze;..." \
ANTHROPIC_FOUNDRY_API_KEY="<foundry-key>" \
dotnet Saturdaze.Worker.dll
```

Schedule is configured under `Saturdaze:Ingestion:Schedule` (cron, types,
`RunOnStartup`, `RunOnceThenExit`). Default: Fridays 08:00 UTC.

## 2. `Saturdaze.Worker` as a one-shot container job

Set `Saturdaze__Ingestion__Schedule__RunOnceThenExit=true` and let an external
scheduler (Kubernetes `CronJob`, Azure Container Apps Job) own the cadence. The
process runs one pass and exits.

## 3. Azure App Service triggered WebJob (this folder — what production runs, ADR-017)

`deploy.yml` publishes `Saturdaze.Cli` into `cli/` beside `run.sh` and
`settings.job` and ships the folder as `App_Data/jobs/triggered/ingest/` in the
API zip on every push to `main`; `eng/infra/main.bicep` supplies the Foundry
key and connection string as Web App settings and keeps Always On enabled so
the schedule fires. Nothing below needs doing by hand.

The zero-extra-infrastructure option from the design doc: a triggered WebJob
co-located with the API, defined by `settings.job` (the cron) and `run.sh`
(which invokes `saturdaze ingest --type all`). Ship the contents of this folder
under `App_Data/jobs/triggered/ingest/` in the API deployment package.

`settings.job` uses NCRONTAB in **UTC**. The checked-in schedule
`0 0 8 * * 5` means **Fridays at 08:00 UTC** so the shared catalogs refresh
ahead of the weekend-planning window without waiting until Saturday traffic.

## On-demand (any of the above, plus the CLI)

```bash
saturdaze ingest --type events            # one catalog
saturdaze ingest --type all --dry-run     # tune the prompt, write nothing
```

## Secrets

`ANTHROPIC_FOUNDRY_API_KEY` (the key of the `sd-ai-uofnt2` Foundry account) is read
from the environment and is never logged, echoed by `--dry-run`, or committed to the
repo. In Azure the template sets it on the Web App from the account itself; locally
`eng/Bootstrap-Azure.ps1` or `eng/Deploy-Foundry.ps1` writes it to `.deploy/azure.env`.

To call Anthropic directly instead, set `Saturdaze__Ingestion__Claude__Provider=Anthropic`
and `ANTHROPIC_API_KEY`; only the selected provider's variable is read.
