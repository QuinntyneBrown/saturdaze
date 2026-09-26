# ADR-011 — Catalog ingestion calls Claude through Microsoft Foundry

**Status:** Accepted
**Date:** 2026-09-26
**Category:** integration
**Deciders:** Quinntyne Brown
**Related:** [ingest-catalogs design](../detailed-designs/discovery/ingest-catalogs/README.md), [schedule-catalog-ingestion design](../detailed-designs/operations/schedule-catalog-ingestion/README.md), L2-078.

## Context

Catalog ingestion (`saturdaze ingest`, `Saturdaze.Worker`) refreshes events, activities and restaurants by asking Claude to research the web. `ClaudeWebSearchClient` sent one `POST /v1/messages` with the server-side `web_search_20250305` tool to `api.anthropic.com`, authenticated with `ANTHROPIC_API_KEY`. That meant a separate Anthropic account and bill next to the Azure subscription that already hosts everything else (`saturdaze-rg`, Pay-As-You-Go, billed in CAD).

Microsoft Foundry sells Claude through Azure Marketplace and serves the same Messages API at `https://<resource>.services.ai.azure.com/anthropic/v1/messages`. It takes the same `x-api-key` and `anthropic-version: 2023-06-01` headers. Azure-hosted Claude supports exactly one web-search tool version, `web_search_20250305`, which is the one the client already sends. Nothing in the request body or response parsing has to change.

Two constraints shaped the details:
- **Region.** Claude isn't offered in `canadacentral`, where `saturdaze-rg` lives. It is offered in `eastus2`, which already hosts the two Static Web Apps.
- **Hosting.** Foundry offers each Claude model in two versions. Version 1 runs on Anthropic's infrastructure; version 2 is "Hosted on Azure" end to end. The previous default model, `claude-sonnet-4-6`, is only available as version 1.

## Decision

1. **Foundry is the default provider.** `ClaudeWebSearchOptions.Provider` defaults to `Foundry`. The base URL derives from `FoundryResource` (`sd-ai-uofnt2`) as `https://sd-ai-uofnt2.services.ai.azure.com/anthropic/`. A trailing `/` is always enforced; without it the relative `v1/messages` drops the `/anthropic` segment and returns a 404.
2. **Model.** The deployment is `claude-sonnet-5`, model version 2 (Hosted on Azure), on Global Standard with 80K TPM (the subscription's full quota; capacity is free and tokens are billed per use). `versionUpgradeOption: NoAutoUpgrade` keeps an automatic upgrade from moving the deployment to a different hosting model.
3. **Key-only authentication.** The client keeps sending `x-api-key`. The Foundry key comes from `ANTHROPIC_FOUNDRY_API_KEY`, the variable name the Anthropic SDKs and Claude Code use for Foundry. Only the selected provider's variable is read, so an `ANTHROPIC_API_KEY` exported for other tools is never sent to Foundry. Locally the key lives in the gitignored `.deploy/azure.env`.
4. **Anthropic stays available as a fallback.** `Provider: Anthropic` with `ANTHROPIC_API_KEY` restores the previous behaviour with no code change, for example if Foundry's shared Claude quota runs out.
5. **Provisioning is scripted.** `eng/Deploy-Foundry.ps1` deploys `eng/foundry/claude.bicep` (an AIServices account plus the deployment) and stores the key. The deployment's `modelProviderData` attestation (organization, country `CA`, industry) accepts the Anthropic Marketplace offer non-interactively.
6. **An unconfigured endpoint fails lazily.** An unresolved endpoint or missing key throws `ClaudeApiException` on the first search, not at startup. The CLI registers ingestion for every command, so `migrate` and `seed` must keep working without Foundry settings.

## Options Considered

### Option 1: Claude on Foundry, key authentication (chosen)
- **Pros:** Billing and resources stay in Azure. The Messages API is identical, so the change is configuration plus endpoint and key selection. Verified live: a dry run parsed events after 5 searches. The Anthropic path remains one setting away.
- **Cons:** It's a long-lived key rather than an identity. The resource sits outside the resource group's region. It adds a Marketplace subscription to the Azure account.

### Option 2: Claude on Foundry, Microsoft Entra ID authentication
- **Pros:** Keyless: `az login` locally and managed identity once a host runs in Azure. Per-principal access control through `Cognitive Services User`.
- **Cons:** It needs the Azure.Identity package, a token fetch in the client, and role assignments. It also gains little while ingestion runs from a developer machine and no Azure host (App Service or Container App) exists. It's deferred, not rejected.

### Option 3: Foundry Agent Service web search (Bing grounding) with a non-Claude model
- **Pros:** It's Microsoft's own grounding tool, and it works with Azure OpenAI models.
- **Cons:** The request and response shapes differ, so it needs a new `IWebSearchClient` implementation and prompt re-tuning. Bing grounding data leaves the Azure compliance boundary and is billed separately.

### Option 4: Keep calling Anthropic directly
- **Pros:** No change, and new API features arrive first.
- **Cons:** A second vendor account and bill, outside Azure cost management.

## Consequences

### Positive
- One bill and one cost-management view for the whole app.
- Request, retry and parsing code are unchanged; the new code is endpoint and key resolution, unit-tested with a fake environment.
- `claude-sonnet-5` version 2 runs on Azure infrastructure end to end.

### Negative
- `sd-ai-uofnt2` is the only resource outside `canadacentral`.
- Rotating the key means re-running `eng/Deploy-Foundry.ps1` or updating `.deploy/azure.env` and any host settings.
- Foundry can trail Anthropic on new tool versions; only `web_search_20250305` is supported on Azure-hosted deployments.

### Risks
- Global Standard Claude quota is shared and has been exhausted for other tenants. The fallback is `Provider: Anthropic`.
- Web search inflates input tokens; one events pass used about 129K input tokens. The `MaxRunsPerDayPerType` circuit-breaker bounds the spend.
- The Bicep type definitions don't yet list `modelProviderData` (warning BCP037, suppressed on that line). The resource provider accepts it, as the official starter kit relies on.

## Implementation Notes

- Provision or re-converge: `pwsh .\eng\Deploy-Foundry.ps1 -OrganizationName "<legal name>"`. It's idempotent and never prints the key.
- Local run: load `ANTHROPIC_FOUNDRY_API_KEY` from `.deploy/azure.env`, then `saturdaze ingest --type events --dry-run`.
- Switch to Anthropic: set `Saturdaze__Ingestion__Claude__Provider=Anthropic` and `ANTHROPIC_API_KEY`, and change `Model` if the Anthropic id differs.
- Tear down: delete the `claude-sonnet-5` deployment and the `sd-ai-uofnt2` account, then purge the soft-deleted account (`az cognitiveservices account purge`) so it doesn't keep holding quota.

## References

- [Claude models in Microsoft Foundry](https://learn.microsoft.com/azure/foundry/foundry-models/concepts/claude-models)
- [Deploy and use Claude models in Microsoft Foundry](https://learn.microsoft.com/azure/foundry/foundry-models/how-to/use-foundry-models-claude)
- [Region availability by deployment type](https://learn.microsoft.com/azure/foundry/foundry-models/concepts/models-from-partners#region-availability-by-deployment-type)
- [Deploy Claude models using Bicep or Terraform](https://learn.microsoft.com/azure/developer/ai/how-to/deploy-claude-foundry) and the [Claude on Foundry starter kit](https://github.com/Azure-Samples/claude)
