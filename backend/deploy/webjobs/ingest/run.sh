#!/usr/bin/env bash
# Azure App Service *triggered* WebJob entry point.
#
# This is the zero-extra-infrastructure trigger described in
# docs/detailed-designs/01-schedule-ingestion: a triggered WebJob co-located
# with the API on the existing App Service plan, fired on the cron in
# settings.job, that simply invokes the `saturdaze` admin tool's `ingest`
# command. It is an alternative to running Saturdaze.Worker as its own
# long-lived service / container.
#
# Required App Service application settings (never commit these):
#   ANTHROPIC_API_KEY     - Anthropic API key (secret)
#   SATURDAZE_CONNECTION  - SQL connection string
set -euo pipefail

# Prefer the globally-installed dotnet tool; fall back to a published CLI dll
# shipped next to this script (set SATURDAZE_CLI_DLL to override).
if command -v saturdaze >/dev/null 2>&1; then
  exec saturdaze ingest --type all
elif [[ -n "${SATURDAZE_CLI_DLL:-}" && -f "${SATURDAZE_CLI_DLL}" ]]; then
  exec dotnet "${SATURDAZE_CLI_DLL}" ingest --type all
else
  echo "Could not find the 'saturdaze' tool on PATH or SATURDAZE_CLI_DLL." >&2
  echo "Install with: dotnet tool install --global Saturdaze.Cli" >&2
  exit 1
fi
