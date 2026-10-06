# 10 · Configure the .NET solution to use Foundry

> **Runtime:** ~10 min · **Audience:** developers and operators wiring the Foundry endpoint and key into local runs, the Worker and Azure hosts · **Prerequisites:** videos 07 and 09; a provisioned Foundry deployment and `.deploy/azure.env`

**Video:** [10-configure-the-dotnet-solution.mp4](10-configure-the-dotnet-solution.mp4) · [Slides](slides.html) · **Audio:** [10-configure-the-dotnet-solution.mp3](10-configure-the-dotnet-solution.mp3) · [Transcript](script.md)

## Why this video exists

Provisioning gives you an endpoint and a key; the solution still has to be told about them in every host, without ever committing the secret. This video explains the configuration binding in `AddIngestion`, the provider-specific key variable (`ANTHROPIC_FOUNDRY_API_KEY` / `ANTHROPIC_API_KEY`), the base-URL rules in `ResolveBaseUri`, the checked-in defaults, and the exact settings for a local run, the Worker container, a run-once job and the App Service WebJob. It closes with a failure-to-fix table so an operator can read an `IngestionRun` error and act.

## Learning objectives

By the end, the viewer can:

- Trace `Saturdaze:Ingestion:Claude` → `ClaudeWebSearchOptions` → `ResolveApiKey` / `ResolveBaseUri` → the typed `HttpClient`.
- Run `saturdaze ingest --dry-run` locally with the key loaded from `.deploy/azure.env`.
- Configure the Worker (daemon or `RunOnceThenExit`), and the App Service WebJob, with `SATURDAZE_CONNECTION` and `ANTHROPIC_FOUNDRY_API_KEY`.
- Override any setting per process with `Saturdaze__…` environment variables.
- Switch to `Provider: Anthropic` and back, and diagnose each error message.

## Key questions

| Question | What a strong answer includes |
|----------|-------------------------------|
| Where is the Claude section bound? | `IngestionServiceCollectionExtensions.AddIngestion`: `AddOptions<ClaudeWebSearchOptions>().Bind(...)` + `PostConfigure` that sets `ApiKey` from `ResolveApiKey`; `AddHttpClient` with `BaseAddress = ResolveBaseUri(...)` and a 5-minute timeout. |
| Which key variable is read? | Only the selected provider's: `ANTHROPIC_FOUNDRY_API_KEY` for Foundry, `ANTHROPIC_API_KEY` for Anthropic. Env wins over configured `ApiKey`. |
| Why does `saturdaze migrate` work without Foundry settings? | `ResolveBaseUri` returns null when Foundry has no resource name; the client throws `ClaudeApiException` on first search, not at startup. |
| How do I override a setting for one run? | `Saturdaze__Ingestion__Claude__MaxSearches=3` (colon → double underscore). |
| What do the Worker and WebJob need? | `SATURDAZE_CONNECTION` and `ANTHROPIC_FOUNDRY_API_KEY` from the platform's secret store; everything else from `appsettings.json`. |
| How do I switch to Anthropic? | `Saturdaze__Ingestion__Claude__Provider=Anthropic` plus `ANTHROPIC_API_KEY` (and `Model` if the id differs). |

## Code / assets on screen

| File | What to show |
|------|--------------|
| `backend/src/Saturdaze.Infrastructure/Ingestion/IngestionServiceCollectionExtensions.cs` | Bind, `PostConfigure`, `AddHttpClient` |
| `backend/src/Saturdaze.Infrastructure/Ingestion/ClaudeWebSearchOptions.cs` | `ResolveApiKey`, `ResolveBaseUri`, trailing slash |
| `backend/src/Saturdaze.Cli/appsettings.json` and `backend/src/Saturdaze.Worker/appsettings.json` | Checked-in defaults; no `ApiKey` |
| `backend/src/Saturdaze.Cli/Hosting/CliHostFactory.cs` | Configuration order: JSON → env → args |
| `backend/src/Saturdaze.Worker/Dockerfile` | Build and run commands with the two env vars |
| `backend/src/Saturdaze.Worker/IngestionScheduleOptions.cs` | `Enabled`, `Cron`, `Types`, `RunOnStartup`, `RunOnceThenExit` |
| `backend/deploy/webjobs/ingest/settings.job`, `run.sh`, `README.md` | WebJob cron and entry point; App Service settings |
| `backend/src/Saturdaze.Infrastructure/Ingestion/ClaudeWebSearchClient.cs` | The error messages quoted in the failure table |

## Run sheet

| Time | Segment | Content |
|------|---------|---------|
| 00:00-00:45 | Introduction | What gets configured where |
| 00:45-01:35 | What you will be able to do | Five outcomes |
| 01:35-04:05 | How the settings are bound | `AddIngestion`, `ResolveApiKey`, `ResolveBaseUri` |
| 04:05-05:00 | The checked in defaults | CLI and Worker `appsettings.json`; no key; API has no ingestion |
| 05:00-06:35 | Running locally | Provision, load key, run; env override; connection string |
| 06:35-07:35 | Configuring the Worker | Docker build/run, cron, run-once, secrets |
| 07:35-08:30 | Configuring the App Service web job | Folder, settings.job, App Service settings, packaging caveat |
| 08:30-09:00 | Switching to Anthropic and back | Two settings, no rebuild |
| 09:00-10:00 | Reading failures | Seven messages and their fixes |
| 10:00-10:25 | Things to remember | Recap and series close |

## Demo commands

```bash
# Local dry run (bash)
export ANTHROPIC_FOUNDRY_API_KEY="$(grep '^ANTHROPIC_FOUNDRY_API_KEY=' .deploy/azure.env | cut -d= -f2-)"
export SATURDAZE_CONNECTION="Server=localhost;Database=Saturdaze;Trusted_Connection=True;TrustServerCertificate=True"
dotnet run --project backend/src/Saturdaze.Cli -- ingest --type events --dry-run

# Per-process overrides
Saturdaze__Ingestion__Claude__MaxSearches=3 \
Saturdaze__Ingestion__Claude__FoundryResource=another-account \
dotnet run --project backend/src/Saturdaze.Cli -- ingest --type events --dry-run

# Worker container (from backend/)
docker build -f src/Saturdaze.Worker/Dockerfile -t saturdaze-worker .
docker run --rm -e SATURDAZE_CONNECTION="..." -e ANTHROPIC_FOUNDRY_API_KEY="..." saturdaze-worker
docker run --rm -e SATURDAZE_CONNECTION="..." -e ANTHROPIC_FOUNDRY_API_KEY="..." \
  -e Saturdaze__Ingestion__Schedule__RunOnceThenExit=true saturdaze-worker

# App Service application settings for the WebJob (values from your secret store)
az webapp config appsettings set -g saturdaze-rg -n <api-web-app> \
  --settings ANTHROPIC_FOUNDRY_API_KEY="@Microsoft.KeyVault(SecretUri=...)" SATURDAZE_CONNECTION="@Microsoft.KeyVault(SecretUri=...)"

# Anthropic fallback
export Saturdaze__Ingestion__Claude__Provider=Anthropic
export ANTHROPIC_API_KEY="..."
```

```powershell
# Local dry run (PowerShell)
$env:ANTHROPIC_FOUNDRY_API_KEY = (Select-String '^ANTHROPIC_FOUNDRY_API_KEY=' .deploy\azure.env).Line.Split('=', 2)[1]
dotnet run --project .\backend\src\Saturdaze.Cli -- ingest --type events --dry-run
```

## Pitfalls

- Putting `ApiKey` in `appsettings.json`. The binding allows it, the repository forbids it; use the environment.
- Exporting `ANTHROPIC_API_KEY` and expecting Foundry to use it. Only `ANTHROPIC_FOUNDRY_API_KEY` is read while `Provider` is `Foundry`.
- Expecting the API to ingest. `Saturdaze.Api` never calls `AddIngestion`.
- Assuming the deploy workflow publishes the Worker or WebJob. It publishes the API only; add the packaging step.
- A dry run still needs a connection string to start the host.

## References

- `backend/deploy/webjobs/ingest/README.md`
- `docs/detailed-designs/operations/schedule-catalog-ingestion/README.md`
- `docs/adr/ADR-011-claude-via-microsoft-foundry.md`
- [.NET configuration: environment variables](https://learn.microsoft.com/dotnet/core/extensions/configuration-providers#environment-variable-configuration-provider)
- [Options pattern in .NET](https://learn.microsoft.com/dotnet/core/extensions/options)
- [App Service: configure app settings](https://learn.microsoft.com/azure/app-service/configure-common)
- [App Service: Key Vault references](https://learn.microsoft.com/azure/app-service/app-service-key-vault-references)
- [WebJobs: triggered jobs and settings.job](https://learn.microsoft.com/azure/app-service/webjobs-create)
