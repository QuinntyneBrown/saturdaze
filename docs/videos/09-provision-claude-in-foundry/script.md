# 09 · Provision Claude in Microsoft Foundry on Azure

The last two videos stayed inside the code. This one goes to Azure. Before the .NET solution can call Claude, something has to exist on the other end of that HTTP request: a Microsoft Foundry resource, a Claude deployment on it, and a key. Saturdaze scripts all of that so the setup is one command, but a beginner should understand what the command creates, why each setting is there, and how to check, rotate or tear it down. That is what this video gives you.

## What you will be able to do

By the end of this video you should be able to do five things.

- Explain what a Foundry account, a model deployment and a key are, and how they map to the URL the client calls.
- Run `eng/Deploy-Foundry.ps1` and know what each parameter means.
- Read `eng/foundry/claude.bicep` and recognise the settings that matter: region, model version, capacity, attestation and the upgrade pin.
- Find the endpoint and key afterwards, and rotate the key safely.
- Tear the whole thing down without leaving quota held.

## Before you start

You need four things.

- An Azure subscription with permission to create resources in a resource group. Saturdaze uses a group called `saturdaze-rg`.
- The Azure command line tool, invoked as `az`, signed in with `az login` and pointed at the right subscription.
- PowerShell seven, invoked as `pwsh`, because the deployment script is PowerShell and runs on Windows, macOS and Linux.
- A clone of the repository, because the script and the Bicep template live in the `eng` folder.

You do not need an Anthropic account. On Foundry, Claude is billed through Azure.

## The three objects you are creating

Think of the Azure side as three nested objects.

The first is the Foundry account. In Azure's resource model it is a Cognitive Services account of kind `AIServices`. Its name doubles as a custom subdomain, so the account named `sd-ai-uofnt2` is reachable at `sd-ai-uofnt2.services.ai.azure.com`. That is where the first half of the base URL comes from.

The second is the model deployment, a child of the account. A deployment has a name, a model, a model version and a capacity. The client sends the deployment name as the `model` field in every request, so the configuration value `Model` in the .NET solution must equal the deployment name. For Saturdaze both are `claude-sonnet-5`.

The third is the key. Every account has two keys, key one and key two, that authenticate as the account. The client sends one of them in the `x-api-key` header. Two keys exist so you can rotate: move clients to key two, regenerate key one, and nobody notices.

Put the three together and you get the full endpoint: the account's subdomain, then the path `/anthropic/`, then `v1/messages`, with the key in the header and the deployment name in the body.

## Reading the Bicep template

Open `eng/foundry/claude.bicep`. Bicep is Azure's declarative template language, and this file is short enough to read top to bottom.

The parameters come first. `accountName` defaults to `sd-ai-uofnt2`. `location` defaults to `eastus2`, and the comment explains why: Claude is not offered in Canadian regions, so this is the one resource that lives outside the group's home region. `deploymentName` and `modelName` both default to `claude-sonnet-5`. `modelVersion` defaults to two, which is the build hosted on Azure end to end; version one runs on Anthropic's infrastructure. `capacity` defaults to eighty, measured in thousands of tokens per minute. Capacity is free; you pay for tokens actually used.

Then come three attestation parameters: `organizationName`, `countryCode` and `industry`. Claude on Foundry is a Marketplace offer, and sending these values in the deployment accepts that offer for the subscription without clicking through a portal. They must describe your real organization. The template refuses an empty organization name because there is no sensible default.

The account resource sets the kind to `AIServices`, the SKU to `S0`, the custom subdomain to the account name, public network access on, and `disableLocalAuth` to false. That last one matters: local auth means key authentication, and the client uses keys. Turn it off and every request fails with a four oh one.

The deployment resource names the SKU `GlobalStandard` with the capacity, and the model with format Anthropic, the name and the version. It carries the attestation under `modelProviderData`, with a comment noting that Bicep's type definitions do not list that property yet, so the warning `BCP037` is suppressed on that line. It pins `versionUpgradeOption` to `NoAutoUpgrade`, so Azure never silently moves the deployment to a different hosting version. And it sets the content filter policy to the Microsoft default.

The outputs at the end return the base URL, the account name and the deployment name. The script prints two of them.

## Running the deployment script

Now open `eng/Deploy-Foundry.ps1`. From the repository root, run `pwsh ./eng/Deploy-Foundry.ps1 -OrganizationName` followed by your organization's legal name in quotes. The country code defaults to Canada and the industry to technology; override them if yours differ. Resource group, account name, location and capacity are parameters too, with the Saturdaze defaults.

The script does three things. First it calls `az deployment group create` with the Bicep file and the parameters, and waits. The first run takes a few minutes while the account is created and the Marketplace offer is accepted. Re-running is safe: Bicep converges on the same state, so you can treat the script as the way to repair or re-apply settings, not just create them.

Second, it prints the endpoint and the deployment name from the template outputs. The endpoint should read `https://sd-ai-uofnt2.services.ai.azure.com/anthropic/` with a trailing slash.

Third, unless you pass `-NoKey`, it reads key one with `az cognitiveservices account keys list` and writes it into `.deploy/azure.env` as `ANTHROPIC_FOUNDRY_API_KEY`. The `.deploy` folder is in `.gitignore`, so the key never lands in the repository, and the script never prints it. If the file already exists, only that one line is replaced.

If the deployment fails with a quota error, the shared Global Standard quota for Claude in that region is exhausted. Retry later, try a smaller capacity, or fall back to the Anthropic provider, which video ten covers.

## Doing it in the portal instead

If you prefer clicking, the same three objects can be made in the Azure portal. Create an Azure AI Foundry resource, choose `eastus2`, and give it the name you will put in configuration. Open it in the Foundry portal, go to the model catalog, pick Claude Sonnet five, choose the Azure hosted version, and deploy it with the default name. Accept the Marketplace terms when prompted. Then open the resource's keys and endpoint page to copy key one.

The portal path works, but the script is better for two reasons. It records every setting in a file you can review, and it is idempotent, so the next person can reproduce your environment exactly. Prefer the script, and if you did use the portal, run the script afterwards so the template matches reality.

## Checking it works

Before touching the .NET code, test the endpoint with a plain HTTP request. Any HTTP tool will do. Send a POST to the account's `/anthropic/v1/messages` path, with the key in `x-api-key`, the header `anthropic-version` set to `2023-06-01`, and a body naming the deployment with a tiny `max_tokens` and one user message that says hello. A two hundred response with a text block means all three objects line up.

Then run the real thing. Load the key from `.deploy/azure.env` into your shell, and run `saturdaze ingest --type events --dry-run`. The log should show a few web searches and a count of parsed rows. That was the live verification recorded in `ADR-011`: a dry run parsed events after five searches.

## Rotating and tearing down

Keys leak. When one does, regenerate it with `az cognitiveservices account keys regenerate` for key one, then re-run `eng/Deploy-Foundry.ps1` to refresh `.deploy/azure.env`, and update any host settings that carried the old value. The script is the single path for key distribution on purpose.

To remove everything, delete the `claude-sonnet-5` deployment, then delete the `sd-ai-uofnt2` account. Cognitive Services accounts are soft deleted, and a soft deleted account keeps holding its quota, so finish with `az cognitiveservices account purge` for the account name and location. Then delete the key line from `.deploy/azure.env`.

## Pitfalls

- Choosing `canadacentral` because that is where everything else is. Claude is not offered there; the deployment fails.
- Picking model version one by accident. It works, but it runs on Anthropic infrastructure rather than Azure's, and the ADR chose version two deliberately.
- Turning on `disableLocalAuth` for hygiene. It breaks key authentication, which the client depends on. Entra ID authentication is a deferred option, not a switch.
- Forgetting the trailing slash on the base URL. Without it the relative path `v1/messages` replaces the `/anthropic` segment and you get a four oh four. The options class enforces the slash for you, but hand typed URLs in a test tool do not.
- Leaving a soft deleted account un-purged, so the next deployment reports no quota.

## Things to remember

- Three objects: account, deployment, key. Account name plus `/anthropic/` is the base URL, deployment name is the `model` field, key is the header.
- `eng/foundry/claude.bicep` is the source of truth; `eng/Deploy-Foundry.ps1` applies it and stores the key in the gitignored `.deploy/azure.env`.
- Region `eastus2`, model version two, `NoAutoUpgrade`, key authentication on.
- Verify with a plain HTTP request, then with `saturdaze ingest --type events --dry-run`.
- Rotate through the script; tear down with delete and purge.

In the final video we return to the .NET solution and wire this endpoint and key into the command line tool, the Worker and the Azure hosts, and we see what every failure mode looks like.
