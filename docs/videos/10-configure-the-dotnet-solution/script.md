# 10 · Configure the .NET solution to use Foundry

You now have a Foundry account, a Claude deployment and a key. This final video wires them into the .NET solution and into every place the solution runs: your laptop, the Worker container, and an Azure App Service web job. Along the way you will see exactly how configuration is bound, which environment variable names matter, how the key stays out of the repository, how to switch the provider to Anthropic, and what each failure looks like in the logs so you can fix it in minutes rather than hours.

## What you will be able to do

By the end of this video you should be able to do five things.

- Explain how `ClaudeWebSearchOptions` is bound from configuration and how the key is injected from the environment.
- Configure a local run of `saturdaze ingest` against Foundry, using the gitignored key file.
- Configure the Worker, a one shot container job, and an App Service web job with the right settings.
- Switch the provider to Anthropic with two settings and back again.
- Read an ingestion failure in the console or the `IngestionRun` table and name the fix.

## How the settings are bound

Everything the client needs sits under one configuration section, `Saturdaze:Ingestion:Claude`. It is bound onto `ClaudeWebSearchOptions` in the Infrastructure project by the extension method `AddIngestion`, in `IngestionServiceCollectionExtensions`.

Three lines do the work. The first binds the section, so `Provider`, `FoundryResource`, `Model`, `MaxSearches`, `MaxTokens` and the rest come straight from JSON or environment variables. The second is a post configure step that overrides `ApiKey` from the environment, through the static method `ResolveApiKey`. The third registers a typed HTTP client whose base address comes from `ResolveBaseUri`, with a five minute timeout because the model runs several searches inside one call.

Look at `ResolveApiKey`. It asks for exactly one environment variable, chosen by the provider: `ANTHROPIC_FOUNDRY_API_KEY` when the provider is Foundry, `ANTHROPIC_API_KEY` when it is Anthropic. If that variable is set and not blank, it wins. Otherwise the configured `ApiKey` is used. The point of reading only one variable is isolation: a developer who has `ANTHROPIC_API_KEY` exported for other tools never sends it to Foundry by accident. There is a unit test for exactly that case in the Infrastructure test project.

Now look at `ResolveBaseUri`. An explicit `BaseUrl` wins if set. Otherwise, for Anthropic the result is `api.anthropic.com`, and for Foundry it is built from `FoundryResource`: `https://` plus the resource name plus `services.ai.azure.com/anthropic/`. If Foundry is selected and the resource name is blank, the method returns null, the HTTP client has no base address, and the first search throws a clear exception. Startup never fails, which is why `saturdaze migrate` works in the deployment pipeline with no AI settings at all. Finally, the method appends a trailing slash if it is missing, because without it the relative path `v1/messages` would replace the `/anthropic` segment of the URL.

## The checked in defaults

Open `appsettings.json` in the command line project, and the one in the Worker project. Both contain the same `Ingestion` section. The `Claude` block sets `Provider` to `Foundry`, `FoundryResource` to `sd-ai-uofnt2`, `Model` to `claude-sonnet-5`, `MaxSearches` to five and `MaxTokens` to `4096`. Above it, `MaxDriveMinutes` is two hundred and `MaxRunsPerDayPerType` is forty-eight. The Worker file adds a `Schedule` block with the cron expression, the types, and the two run mode flags.

Notice what is not there. There is no `ApiKey`. The key is never checked in. It arrives only through the environment, in every host.

The API project does not call `AddIngestion` at all. The web API never ingests, so it has no Claude settings and does not need the key.

## Running locally

On your machine the flow is three steps.

First, provision, which video nine covered. `eng/Deploy-Foundry.ps1` wrote the key into `.deploy/azure.env`, a file that `.gitignore` excludes.

Second, load the key into your shell. In PowerShell, read the file and set `ANTHROPIC_FOUNDRY_API_KEY` from the line that starts with that name. In bash, export the same variable from the same line. Never echo it, never paste it into a settings file.

Third, run `dotnet run --project backend/src/Saturdaze.Cli -- ingest --type events --dry-run`. The command line host reads `appsettings.json`, then environment variables, then command line arguments, in that order, so anything you export overrides the file.

That also means you can override any setting for one run without editing JSON. .NET maps a colon in a configuration path to a double underscore in an environment variable name. So `Saturdaze__Ingestion__Claude__MaxSearches` set to three lowers the search budget for that process, and `Saturdaze__Ingestion__Claude__FoundryResource` points at a different Foundry account.

You also need a database connection for a real run, through `SATURDAZE_CONNECTION` or the `--connection` flag. A dry run still needs the connection string to start the host, even though it never writes.

## Configuring the Worker

The Worker is a .NET worker service with a `Dockerfile` in its project folder. Build the image from the backend folder so the shared build props are in context. Then run it with two environment variables: `SATURDAZE_CONNECTION` for the database and `ANTHROPIC_FOUNDRY_API_KEY` for Foundry. Everything else comes from the baked in `appsettings.json`.

By default the Worker is a long lived cron daemon. The checked in schedule, `0 0 8 * * 5`, is Fridays at eight in the morning UTC, ahead of the weekend planning window. Set `Saturdaze__Ingestion__Schedule__RunOnceThenExit` to true and the same image becomes a one shot job for a Kubernetes cron job or an Azure Container Apps job, where the external scheduler owns the cadence. Set `RunOnStartup` to true to get an immediate pass on first deploy. Set `Enabled` to false and the Worker idles.

Whatever hosts the container, the key should come from the platform's secret store, for example a Container Apps secret referenced by the environment variable, never from the image.

## Configuring the App Service web job

The third option needs no new infrastructure. The folder `backend/deploy/webjobs/ingest` holds `settings.job`, which carries the same Friday cron in the N crontab format App Service expects, and `run.sh`, which calls `saturdaze ingest --type all`. Ship that folder under `App_Data/jobs/triggered/ingest/` inside the API deployment package.

The web job runs in the API's App Service, so the settings live in the App Service application settings, which App Service exposes to processes as environment variables. Add `ANTHROPIC_FOUNDRY_API_KEY` and `SATURDAZE_CONNECTION` there, marking them as secrets or, better, as Key Vault references. Because they are environment variables, the same `ResolveApiKey` logic picks them up with no code change.

One caveat recorded in the design: the current deployment workflow publishes the API but does not yet publish the Worker or the web job folder. The hosting artifacts are in source and ready, but you must add the packaging step before the schedule is live in Azure.

## Switching to Anthropic and back

If Foundry's shared Claude quota runs dry, the fallback is two settings. Set `Saturdaze__Ingestion__Claude__Provider` to `Anthropic`, and set `ANTHROPIC_API_KEY` to an Anthropic key. The client now sends the same request to `api.anthropic.com`. If the model identifier differs on Anthropic, set `Saturdaze__Ingestion__Claude__Model` as well.

To switch back, remove or change those variables. Nothing is rebuilt, and no code changes, which is exactly what `ADR-011` promised.

## Reading failures

When ingestion fails, the runner catches the exception, records the pass as Failed with the message in `ErrorMessage`, and moves on to the next type. The console shows the same message. Here is what each one means.

- The Foundry endpoint is not configured. `FoundryResource` and `BaseUrl` are both blank. Set the resource name.
- `ANTHROPIC_FOUNDRY_API_KEY` is not configured. The variable is missing or blank in this process. Load it from `.deploy/azure.env` or the host's settings.
- Four oh one from the Claude API. The key is wrong, rotated, or local authentication is disabled on the account.
- Four oh four. The deployment name in `Model` does not exist on the resource, or a hand set `BaseUrl` lost its trailing slash.
- Four twenty-nine or a five hundred class error. The client already waited thirty seconds and retried once. If it still fails, quota or the service is the problem; try later or switch provider.
- Pause turn returned four times without completing. The model needed more search turns than `MaxContinuationTurns` allows. Raise it, or lower `MaxSearches`.
- Daily run budget reached. Forty-eight passes for that type already ran today. Usually a misfiring scheduler; check `IngestionRun` for the cadence.

Every one of these is also visible in the `IngestionRun` table with timestamps, so a scheduled failure at three in the morning is still diagnosable at nine.

## Things to remember

- One section, `Saturdaze:Ingestion:Claude`, bound by `AddIngestion`; the key is injected from the provider's own environment variable and never checked in.
- Locally: provision, load `ANTHROPIC_FOUNDRY_API_KEY` from `.deploy/azure.env`, run `saturdaze ingest --dry-run`.
- Worker and web job take the same two environment variables; override anything else with double underscore names.
- Provider swap is two settings, no rebuild.
- Failures land in the console and in `IngestionRun`; the message names the fix.

That completes the series. You know where AI lives in Saturdaze, how to steer it, how to stand up the Azure side, and how to configure every host. The next step is yours: pick a prompt change, write the failing test, and run your first dry run.
