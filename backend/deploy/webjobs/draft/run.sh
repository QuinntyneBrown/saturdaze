#!/usr/bin/env bash
# Azure App Service *triggered* WebJob entry point for agent-drafted weekends (ADR-023).
#
# Fires on the cron in settings.job — Fridays 12:00 UTC, four hours after the `ingest`
# job refreshes the catalogs and ahead of the Friday preview — and runs
# `saturdaze draft-weekends`, which drafts the upcoming weekend with the agents for
# every family with the Friday preview on. A family the agents cannot draft keeps the
# planner's weekend; the job exits 1 only when a run failed with an error.
#
# deploy.yml publishes Saturdaze.Cli into the `cli/` folder next to this script and
# ships the folder as App_Data/jobs/triggered/draft/ inside the API package (ADR-017),
# beside `ingest`. On-demand drafts do not use this job: the API runs them.
#
# Required App Service application settings (set by eng/infra/main.bicep, never committed):
#   SATURDAZE_CONNECTION                       - SQL connection string
#   Saturdaze__AgentPlanning__Enabled          - true in production
#   Saturdaze__AgentPlanning__Auth             - ManagedIdentity (the Web App's identity)
#   Saturdaze__AgentPlanning__FoundryResource  - the Foundry account, e.g. sd-ai-uofnt2
#   ANTHROPIC_FOUNDRY_API_KEY                  - the regional researcher's key (ingestion's client)
#   APPLICATIONINSIGHTS_CONNECTION_STRING      - where the agent traces go
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ -z "${SATURDAZE_CLI_DLL:-}" && -f "$here/cli/saturdaze.dll" ]]; then
  SATURDAZE_CLI_DLL="$here/cli/saturdaze.dll"
fi

if [[ -n "${SATURDAZE_CLI_DLL:-}" && -f "${SATURDAZE_CLI_DLL}" ]]; then
  exec dotnet "${SATURDAZE_CLI_DLL}" draft-weekends
elif command -v saturdaze >/dev/null 2>&1; then
  exec saturdaze draft-weekends
else
  echo "Could not find cli/saturdaze.dll next to this script, the 'saturdaze' tool on PATH, or SATURDAZE_CLI_DLL." >&2
  exit 1
fi
