# ADR-017 — Production hosting on the cheapest SLA-backed tiers, provisioned by Bicep on every push to main

**Status:** Accepted
**Date:** 2026-10-19
**Category:** operations
**Deciders:** Quinntyne Brown
**Related:** [ADR-011](ADR-011-claude-via-microsoft-foundry.md) (Claude on Foundry), [ADR-014](ADR-014-separate-admin-application.md) (admin app), [ADR-015](ADR-015-public-curated-photo-storage.md) (curated photos), L2-041, L2-123, [ingestion triggers](../../backend/deploy/webjobs/ingest/README.md).

## Context

Saturdaze serves two or three families. The stack (API, SQL, three Static Web Apps, Claude on Foundry) was created by hand, and the App Service was torn down between active periods to save money. `deploy.yml` coped by probing for the Web App and skipping the deploy chain when it was gone, so a push to `main` did not reliably produce a running system. Four long-lived secrets (a connection string and three Static Web App tokens) lived only in GitHub, and the Foundry key had to be copied into the Web App by hand, so the AI side of the app worked locally but not in Azure.

The ask is production-grade hosting at the lowest cost that still is production-grade, with every environment detail — including the Claude configuration — applied automatically.

## Decision

1. **One Bicep template owns the stack.** `eng/infra/main.bicep` declares the App Service plan and Web App, the SQL server and database, the three Static Web Apps, the Foundry account and Claude deployment (`eng/foundry/claude.bicep`, now a module), a Log Analytics workspace with Application Insights, and a monthly budget. `deploy.yml` runs it on every push to `main` before deploying code; it converges, so a missing resource is created and an existing one is left alone. `eng/Bootstrap-Azure.ps1` runs it once by hand so the resources exist before the first push.
2. **Tiers.** The cheapest tier of each service that carries an SLA and the features the app depends on:
   - App Service **Linux Basic B1** (≈ US$13/month). Free and Shared have no SLA and no Always On, and the scheduled ingestion WebJob needs Always On to fire.
   - Azure SQL **Basic** (5 DTU, 2 GB, 7-day point-in-time restore, locally redundant backups, ≈ US$5/month). The serverless free offer auto-pauses and resumes in about a minute, which three users would notice.
   - Static Web Apps **Free** for the family app, the admin app and the design system. Free has no SLA; `swaSkuName` flips all three to Standard (US$9 each) when one is wanted.
   - Log Analytics / Application Insights pay-as-you-go with a 0.5 GB daily cap; at this traffic it sits inside the free 5 GB a month.
   - Foundry Claude on Global Standard: no fixed cost, tokens billed per use (ADR-011). The `MaxRunsPerDayPerType` circuit-breaker and the weekly cron bound the spend.
   - A **budget** on the resource group e-mails at 80 % and 100 % of the configured amount.
   Expected total: roughly US$18–20 a month plus Claude tokens, before the CAD conversion on the subscription.
3. **The AI features are configured by the template.** The Web App's settings carry `Saturdaze__Ingestion__Claude__Provider=Foundry`, the Foundry resource and deployment names, and `ANTHROPIC_FOUNDRY_API_KEY` read from the account with `listKeys()` at deployment time. Rotating the key is a re-deploy; nothing is copied by hand.
4. **Ingestion runs as a triggered WebJob on the same plan** (option 3 in the ingestion README). `deploy.yml` publishes `Saturdaze.Cli` into `App_Data/jobs/triggered/ingest/cli/` beside `run.sh` and `settings.job`, inside the API zip. `WEBJOBS_IDLE_TIMEOUT` is raised to an hour because a pass prints nothing while Claude searches. No Container App or Worker host is needed until the schedule outgrows one instance.
5. **Identity, not stored tokens.** GitHub Actions signs in with OpenID Connect (the `AZURE_CLIENT_ID`/`TENANT_ID`/`SUBSCRIPTION_ID` secrets name the app registration; there is no client secret). Static Web App deployment tokens are read with `az staticwebapp secrets list` at run time; the connection string is composed from the SQL outputs and the `SQL_ADMIN_LOGIN`/`SQL_ADMIN_PASSWORD` secrets. The remaining GitHub secrets are the ones the application itself needs: SQL admin credentials, the JWT signing key and the photo-URL signing key.
6. **Uploads live outside `wwwroot`.** `Saturdaze__Photos__Directory`, `Saturdaze__CuratedPhotos__Directory` and `Saturdaze__Email__PickupDirectory` point under `/home/data/`, the plan's persistent share, so the clean zip deploy never deletes family photos.
7. **Migrations run from the GitHub runner through a temporary firewall rule.** The SQL server admits Azure services; the migration job adds a rule for the runner's address named after the run id and removes it in an `always()` step. Private endpoints would cost more than the database.

## Options Considered

### Option 1: Bicep on every push, cheapest SLA-backed tiers (chosen)
- **Pros:** A push to `main` always yields a running stack; the environment is reviewable in the repo; tearing down and recreating is `az group delete` and the next push; the AI configuration cannot drift.
- **Cons:** The template runs on every push (about a minute when nothing changes). SQL authentication stays username/password for the CLI's sake.

### Option 2: Keep the probe-and-skip workflow and provision by hand
- **Pros:** No new files.
- **Cons:** The failure mode that prompted this ADR: a green workflow that deployed nothing, and a Foundry key that never reached Azure.

### Option 3: Free/Shared App Service and the SQL free offer
- **Pros:** Near zero fixed cost.
- **Cons:** No SLA, no Always On (so no scheduled ingestion), 60 CPU-minutes a day on Free, and a resume delay on the paused database. Not production.

### Option 4: Container Apps for the API and a Container Apps Job for ingestion
- **Pros:** Scale to zero; the Worker's one-shot mode maps directly to a Job.
- **Cons:** A container registry, image builds and cold starts for three users; the consumption plan is not cheaper than B1 once the API must stay warm.

### Option 5: Azure Developer CLI (`azd`) instead of plain Bicep + Actions
- **Pros:** Scaffolding and `azd up`.
- **Cons:** Another tool to install and learn; the repo already has working Actions, and the Bicep is the same either way.

## Consequences

### Positive
- Every push to `main` provisions, deploys and smoke-tests the whole stack, Claude included.
- Three GitHub secrets retired (`SATURDAZE_CONNECTION`, `SWA_DEPLOYMENT_TOKEN`, `SWA_ADMIN_DEPLOYMENT_TOKEN`, `SWA_DESIGN_SYSTEM_DEPLOYMENT_TOKEN`).
- Costs are visible in one template and bounded by a budget alert.

### Negative
- The SQL admin password is reset to the GitHub secret on every deployment; the two must be changed together (the bootstrap script keeps them in step).
- A Static Web App created under a new name does not inherit `saturdaze.app`; the `appCustomDomain` parameter binds it once DNS validates, and the old app is deleted by hand.
- `az webapp deploy --clean` removes anything written under `wwwroot` by the previous release, including Serilog's `logs/` files. Application Insights holds the history.

### Risks
- Resource names are fixed in `main.bicepparam`; a name taken elsewhere in Azure (Web App and SQL server names are global) fails the deployment with a clear error.
- The Marketplace attestation on the Claude deployment must name the real organization; `FOUNDRY_ORGANIZATION_NAME` is a repository variable, not a secret, so it is visible to collaborators.

## Implementation Notes

- First time: `pwsh ./eng/Bootstrap-Azure.ps1 -OrganizationName "<legal name>" -BudgetAlertEmail <you>`. It creates the OIDC app registration, writes `.deploy/azure.env`, pushes the GitHub secrets and variables with `gh` when available, shows a what-if and deploys.
- Afterwards: push to `main`. The run summary lists every host name and the CORS origins.
- Change a tier: edit `eng/infra/main.bicepparam` (`apiSkuName`, `sqlSkuName`, `swaSkuName`) and push.
- Bind the domain: set the `APP_CUSTOM_DOMAIN` repository variable to `saturdaze.app` after its TXT record exists.
- Run ingestion now: Web App → WebJobs → `ingest` → Run, or `saturdaze ingest --type all` locally with the key from `.deploy/azure.env`.
- Tear down to save money: `az group delete -n saturdaze-rg`, then `az cognitiveservices account purge` for the Foundry account (ADR-011). The next push rebuilds everything except the data.

## References

- [App Service pricing](https://azure.microsoft.com/pricing/details/app-service/linux/) · [Azure SQL DTU purchasing model](https://learn.microsoft.com/azure/azure-sql/database/service-tiers-dtu) · [Static Web Apps plans](https://learn.microsoft.com/azure/static-web-apps/plans)
- [Run background tasks with WebJobs](https://learn.microsoft.com/azure/app-service/webjobs-create) — Always On and Linux notes
- [Use GitHub Actions to connect to Azure with OpenID Connect](https://learn.microsoft.com/azure/developer/github/connect-from-azure-openid-connect)
- [Bicep parameters files (`.bicepparam`)](https://learn.microsoft.com/azure/azure-resource-manager/bicep/parameter-files)
