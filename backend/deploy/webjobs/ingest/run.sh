#!/usr/bin/env bash
# Azure App Service *triggered* WebJob entry point.
#
# This is the zero-extra-infrastructure trigger option: a triggered WebJob
# co-located with the API on the existing App Service plan, fired on the cron in
# settings.job, that simply invokes the `saturdaze` admin tool's `ingest`
# command. It is an alternative to running Saturdaze.Worker as its own
# long-lived service / container.
#
# deploy.yml publishes Saturdaze.Cli into the `cli/` folder next to this script
# and ships the whole folder as App_Data/jobs/triggered/ingest/ inside the API
# package (ADR-017). The plan runs with Always On so the schedule fires, and
# WEBJOBS_IDLE_TIMEOUT is raised because a pass is quiet while Claude searches.
#
# Required App Service application settings (set by eng/infra/main.bicep, never committed):
#   ANTHROPIC_FOUNDRY_API_KEY - Microsoft Foundry key for the Claude deployment (secret)
#                           (for Anthropic direct instead: ANTHROPIC_API_KEY plus
#                            Saturdaze__Ingestion__Claude__Provider=Anthropic)
#   SATURDAZE_CONNECTION  - SQL connection string
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Prefer the CLI published next to this script, then a globally-installed
# dotnet tool, then an explicit SATURDAZE_CLI_DLL override.
if [[ -z "${SATURDAZE_CLI_DLL:-}" && -f "$here/cli/saturdaze.dll" ]]; then
  SATURDAZE_CLI_DLL="$here/cli/saturdaze.dll"
fi

if [[ -n "${SATURDAZE_CLI_DLL:-}" && -f "${SATURDAZE_CLI_DLL}" ]]; then
  exec dotnet "${SATURDAZE_CLI_DLL}" ingest --type all
elif command -v saturdaze >/dev/null 2>&1; then
  exec saturdaze ingest --type all
else
  echo "Could not find cli/saturdaze.dll next to this script, the 'saturdaze' tool on PATH, or SATURDAZE_CLI_DLL." >&2
  echo "Install with: dotnet tool install --global Saturdaze.Cli" >&2
  exit 1
fi
