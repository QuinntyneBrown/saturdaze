# 09 · Provision Claude in Microsoft Foundry on Azure

> **Runtime:** ~11 min · **Audience:** anyone who must create, verify, rotate or remove the Azure side of ingestion; no prior Azure AI experience · **Prerequisites:** an Azure subscription, `az`, `pwsh`, a clone of the repo

**Video:** [09-provision-claude-in-foundry.mp4](09-provision-claude-in-foundry.mp4) · [Slides](slides.html) · **Audio:** [09-provision-claude-in-foundry.mp3](09-provision-claude-in-foundry.mp3) · [Transcript](script.md)

## Why this video exists

The .NET client is only half of the integration. The other half is an Azure AI Foundry account, a Claude deployment and a key, provisioned by `eng/Deploy-Foundry.ps1` from `eng/foundry/claude.bicep` (ADR-011). This video explains what those objects are, why each template setting exists (region, model version, capacity, Marketplace attestation, upgrade pin, key auth), how to verify the endpoint before touching code, and how to rotate the key or tear everything down without leaving quota held.

## Learning objectives

By the end, the viewer can:

- Map account name → `https://<name>.services.ai.azure.com/anthropic/`, deployment name → `model` field, key → `x-api-key`.
- Run `pwsh ./eng/Deploy-Foundry.ps1 -OrganizationName "<legal name>"` and explain every parameter and output.
- Read `claude.bicep` and justify `eastus2`, `modelVersion: '2'`, `GlobalStandard` capacity 80, `modelProviderData`, `NoAutoUpgrade`, `disableLocalAuth: false`.
- Verify the deployment with a raw HTTP request and with `saturdaze ingest --type events --dry-run`.
- Rotate key1 and purge a soft-deleted account.

## Key questions

| Question | What a strong answer includes |
|----------|-------------------------------|
| What does the script create? | A `Microsoft.CognitiveServices/accounts` resource of kind `AIServices` (SKU `S0`) named `sd-ai-uofnt2` in `eastus2`, and a child deployment `claude-sonnet-5` (model `claude-sonnet-5`, version 2, `GlobalStandard`, capacity 80). |
| Why `eastus2`? | Claude is not offered in `canadacentral`, where `saturdaze-rg` lives. |
| Why model version 2? | Version 2 is hosted on Azure end to end; version 1 runs on Anthropic infrastructure. `NoAutoUpgrade` pins it. |
| What is `modelProviderData`? | The Anthropic Marketplace attestation (organization, country, industry). Sending it accepts the offer non-interactively; Bicep warns `BCP037` because its types lag the resource provider. |
| Where does the key go? | `.deploy/azure.env` as `ANTHROPIC_FOUNDRY_API_KEY`; gitignored; never printed. |
| How do I remove it? | Delete the deployment, delete the account, then `az cognitiveservices account purge` so the soft-deleted account releases quota. |

## Code / assets on screen

| File | What to show |
|------|--------------|
| `eng/foundry/claude.bicep` | Parameters (name, location, version, capacity, attestation); account resource; deployment resource; outputs |
| `eng/Deploy-Foundry.ps1` | Parameters; `az deployment group create`; key retrieval and `.deploy/azure.env` write |
| `.gitignore` | The `.deploy/` entry |
| `docs/adr/ADR-011-claude-via-microsoft-foundry.md` | Implementation notes: provision, local run, tear down |
| `backend/src/Saturdaze.Infrastructure/Ingestion/ClaudeWebSearchOptions.cs` | `ResolveBaseUri` trailing-slash rule (why the URL must end in `/`) |

## Run sheet

| Time | Segment | Content |
|------|---------|---------|
| 00:00-00:45 | Introduction | Why Azure objects must exist first; what the script does |
| 00:45-01:35 | What you will be able to do | Five outcomes |
| 01:35-02:25 | Before you start | Subscription, `az login`, `pwsh`, repo clone; no Anthropic account |
| 02:25-03:55 | The three objects you are creating | Account, deployment, key → URL, model field, header |
| 03:55-06:15 | Reading the Bicep template | Parameters, attestation, account, deployment, outputs |
| 06:15-07:50 | Running the deployment script | Command, three steps, idempotency, quota failure |
| 07:50-08:40 | Doing it in the portal instead | Equivalent clicks; why the script is better |
| 08:40-09:25 | Checking it works | Raw HTTP request; dry run |
| 09:25-10:05 | Rotating and tearing down | Regenerate key1; delete + purge |
| 10:05-10:40 | Pitfalls | Region, version 1, disableLocalAuth, trailing slash, un-purged account |
| 10:40-11:00 | Things to remember | Recap and preview of video 10 |

## Demo commands

```bash
# Sign in and pick the subscription
az login
az account set --subscription "<subscription id or name>"

# Provision (idempotent). Writes ANTHROPIC_FOUNDRY_API_KEY to .deploy/azure.env; never prints it.
pwsh ./eng/Deploy-Foundry.ps1 -OrganizationName "<legal organization name>"
# Options: -CountryCode CA -Industry technology -ResourceGroup saturdaze-rg -AccountName sd-ai-uofnt2 -Location eastus2 -Capacity 80 -NoKey

# Inspect what exists
az cognitiveservices account show -g saturdaze-rg -n sd-ai-uofnt2 --query "{endpoint:properties.endpoint,location:location,kind:kind}"
az cognitiveservices account deployment list -g saturdaze-rg -n sd-ai-uofnt2 -o table

# Raw smoke test (key read from the env file; not echoed)
KEY="$(grep '^ANTHROPIC_FOUNDRY_API_KEY=' .deploy/azure.env | cut -d= -f2-)"
curl -sS https://sd-ai-uofnt2.services.ai.azure.com/anthropic/v1/messages \
  -H "x-api-key: $KEY" -H "anthropic-version: 2023-06-01" -H "content-type: application/json" \
  -d '{"model":"claude-sonnet-5","max_tokens":32,"messages":[{"role":"user","content":"Say hello."}]}'

# End-to-end dry run through the .NET CLI
export ANTHROPIC_FOUNDRY_API_KEY="$KEY"
dotnet run --project backend/src/Saturdaze.Cli -- ingest --type events --dry-run

# Rotate key1, then refresh .deploy/azure.env
az cognitiveservices account keys regenerate -g saturdaze-rg -n sd-ai-uofnt2 --key-name key1 >/dev/null
pwsh ./eng/Deploy-Foundry.ps1 -OrganizationName "<legal organization name>"

# Tear down (delete, then purge so quota is released)
az cognitiveservices account deployment delete -g saturdaze-rg -n sd-ai-uofnt2 --deployment-name claude-sonnet-5
az cognitiveservices account delete -g saturdaze-rg -n sd-ai-uofnt2
az cognitiveservices account purge -g saturdaze-rg -n sd-ai-uofnt2 -l eastus2
```

## Pitfalls

- `canadacentral` has no Claude; the deployment fails.
- Model version 1 runs on Anthropic infrastructure; ADR-011 chose version 2 deliberately.
- `disableLocalAuth: true` breaks `x-api-key` authentication (401). Entra ID auth is deferred, not a toggle.
- A hand-typed base URL without the trailing `/` turns `v1/messages` into a 404; `ResolveBaseUri` adds it for the client, test tools do not.
- Soft-deleted accounts keep holding quota until purged.
- Portal names and menus change; the Bicep file is the durable description. Portal steps in the video are as of October 2026.

## References

- [Claude models in Microsoft Foundry](https://learn.microsoft.com/azure/foundry/foundry-models/concepts/claude-models)
- [Deploy and use Claude models in Microsoft Foundry](https://learn.microsoft.com/azure/foundry/foundry-models/how-to/use-foundry-models-claude)
- [Deploy Claude models using Bicep or Terraform](https://learn.microsoft.com/azure/developer/ai/how-to/deploy-claude-foundry)
- [Claude on Foundry starter kit (Azure-Samples/claude)](https://github.com/Azure-Samples/claude)
- [az cognitiveservices account](https://learn.microsoft.com/cli/azure/cognitiveservices/account)
- `docs/adr/ADR-011-claude-via-microsoft-foundry.md`
