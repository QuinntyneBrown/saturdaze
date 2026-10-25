# ADR-023 — Weekends are drafted by a bounded team of agents and disposed of by the planner

**Status:** Accepted
**Date:** 2026-10-25
**Category:** architecture
**Deciders:** Quinntyne Brown
**Related:** [ADR-003](ADR-003-idempotent-generate-weekend.md) (idempotent generate), [ADR-008](ADR-008-per-user-family-scoping-and-auth-fallback.md) (family scoping), [ADR-011](ADR-011-claude-via-microsoft-foundry.md) (Claude on Foundry), [ADR-017](ADR-017-production-hosting-and-continuous-deployment.md) (hosting), [ADR-020](ADR-020-tests-run-without-a-database-server.md) (tests without a database server), [schedule generation evaluation](../schedule-generation-evaluation.md), [plan-with-agents design](../detailed-designs/weekend-planning/plan-with-agents/README.md), L1-041, L2-184 → L2-213.

## Context

`docs/schedule-generation-evaluation.md` ran 21 weekend generations for a real family (Christian, doesn't celebrate Halloween, two daughters with Sunday swims at Heartland, a two-hour drive limit). The deterministic `WeekendPlanner` produced valid but poor plans. It put one activity in each free gap and planned the same one on both days. Meals landed at any hour, and Sunday had no dinner. It never planned events, drove nowhere for commitments, and offered Halloween-themed events to a family that dislikes Halloween. Its keyword rules cannot tell that "Park your Pumpkin" or "Symphony Spooktacular" is a Halloween event, that a lavender farm is out of season in November, or that a church harvest fair is a good alternative.

The recommendation was a hybrid: fix the planner and keep it as the authority on hard constraints, enrich the catalog, and add an agent per family that researches and curates candidates for *this* family. This ADR decides how that agent work is built, hosted, secured, observed, evaluated and paid for.

Constraints:
- **Planner authority.** Agents may propose, but only plans that pass the planner's rules are saved. With the agents off, failing or over budget, today's behaviour must remain.
- **Idempotency.** `POST /api/weekends/plan` returns the existing weekend (ADR-003). Model output is not reproducible, so it has to be stored.
- **Cost.** The resource group's budget is US$40 a month (`eng/infra/main.bicep`). The stack costs about US$18–20 before Claude tokens.
- **Hosting.** One Linux B1 App Service plan; ingestion already runs there as a triggered WebJob (ADR-017).
- **Tests.** Tests never call Foundry, Claude or the web (ADR-020 style: fakes at the boundary).
- **Preview status.** Anything still in preview sits behind configuration with a non-preview fallback.

## What was checked (2026-10-25)

| Source | Finding |
|---|---|
| nuget.org flat-container index | `Microsoft.Agents.AI`, `.Abstractions`, `.Workflows` and `.Anthropic` are **1.26.0, stable** (Anthropic connector stable since 1.24.0). `Microsoft.Agents.AI.Foundry` and `.Foundry.Hosting` are **preview**. `Anthropic` (official C# SDK) 13.3.0 and `Anthropic.Foundry` 1.0.0 are stable. `Azure.Identity` 1.21.0, `Azure.Monitor.OpenTelemetry.Exporter` 1.10.0 stable. |
| [Agent Framework at Build 2026](https://devblogs.microsoft.com/agent-framework/microsoft-agent-framework-at-build-2026-announce/) | Agent Framework reached 1.0 GA on 2026-04-02. |
| [Anthropic provider for Agent Framework](https://learn.microsoft.com/agent-framework/integrations/by-component/model-providers/anthropic) | `AnthropicClient.AsAIAgent(model, instructions, name, tools)`; function tools and MCP are supported. **The .NET connector does not support the web-search server tool.** |
| [Agent Framework observability](https://learn.microsoft.com/agent-framework/agents/observability) | `.AsBuilder().UseOpenTelemetry(sourceName, c => c.EnableSensitiveData = false)` emits `invoke_agent`, `chat` and `execute_tool` spans with `gen_ai.*` attributes, including token usage. |
| [Sequential orchestration](https://learn.microsoft.com/agent-framework/workflows/orchestrations/sequential) | `AgentWorkflowBuilder.BuildSequential([...])` passes one conversation from agent to agent. It has no slot for a deterministic critic between turns. |
| [Use Claude in Foundry](https://learn.microsoft.com/azure/foundry/foundry-models/how-to/use-foundry-models-claude) | `/anthropic/v1/messages` accepts `Authorization: Bearer` with scope `https://ai.azure.com/.default`; a 403 means the **Cognitive Services User** role (`a97b65f3-24c7-4388-baec-2e87135dc908`) is missing. Azure-hosted Claude supports only `web_search_20250305`. |
| [Claude models in Foundry](https://learn.microsoft.com/azure/foundry/foundry-models/concepts/claude-models) | `claude-sonnet-5` and `claude-haiku-5-5` are GA hosted on Azure. |
| Anthropic SDK source (`src/Anthropic.Foundry`) | `AnthropicFoundryClient` takes `AnthropicFoundryApiKeyCredentials` or `AnthropicFoundryIdentityTokenCredentials(TokenCredential, resource, scopes)`. |
| Anthropic pricing (first-party rates, which Foundry bills through the Marketplace) | `claude-sonnet-5` US$2 / US$10 per million input / output tokens; `claude-haiku-5-5` US$0.10 / US$0.50; web search US$10 per 1,000 searches. |
| [Foundry Hosted Agents](https://learn.microsoft.com/agent-framework/hosting/foundry-hosted-agent) | GA, billed per vCPU-hour and GiB-hour of container time; the .NET hosting package is preview. |
| [Container Apps jobs](https://learn.microsoft.com/azure/container-apps/jobs) | GA; billed per execution second; needs an image and a registry. |
| [Guided guardrail setup](https://learn.microsoft.com/azure/foundry/guardrails/guided-set-up) | Applies to agents built in Foundry Agent Service; Foundry adds no content filter to direct Claude Messages calls. |
| [Agent Control Specification](https://aka.ms/AgentControlSpecification), [agent-governance-toolkit](https://github.com/microsoft/agent-governance-toolkit) | YAML manifest (`agent_control_specification_version`) plus Rego/Cedar policies; intervention points `input`, `pre_tool_call`, `post_tool_call`, `output` and others; verdicts allow / deny / transform; fail-closed. **Public preview.** The .NET engine `ResponsibleAI.AgentControlSpec` is 0.4.0-beta.1 over a native library. |
| [ASSERT](https://github.com/responsibleai/ASSERT) | v0.3.0 (commit `04b713fe73879208369750b3bd5ad53544f3eecc`), Python ≥ 3.11. One behaviour per `eval_config.yaml`; the permissible boundary lives in `behavior.description`; sample size is `pipeline.test_set.*.sample_size`. Targets: LiteLLM model, Python callable (`module:function`), HTTP endpoint. Results under `artifacts/results/<suite>/<run>/` with `metrics.json` (`policy_violation_rate`, …). `assert-ai acs generate|validate` derives and checks ACS policies (needs `opa`). |
| [assert-ai-action](https://github.com/responsibleai/assert-ai-action) | `v1.0.4` (`4e22663a2b47db41712a01fb70cd66534410662e`). Its `assert-ai-version` input defaults to 0.1.0, so it must be set. |

## Decision

1. **The planner stays the authority; agents propose.** The work is split into three model roles and one deterministic step (L2-202):
   - **Regional researcher** — Claude with `web_search_20250305`. It finds what is on in the family's *region cell* (home coordinates rounded to 0.5°) for the weekend. Its rows pass the ingestion parser and are upserted into the shared catalog. It runs once per cell and weekend and is shared by every family in that cell (L2-207).
   - **Family curator and values checker** — an Agent Framework agent. Its read-only tools cover the catalog, weather, daylight and drive times, all bound to the run's family. It returns a shortlist of at most 12 catalog ids, each with a reason and the values it was checked against.
   - **Itinerary drafter** — an Agent Framework agent. From the shortlist it returns picks (`day`, `kind`, `id`, optional `start`, `reason`), up to the family's pace.
   - **Validator and assembler** — deterministic C#. `WeekendPlanner` places the picks as anchored outings and fills meals, drives, errands and downtime. `PlanValidator` checks the 17 hard rules of L2-206. Violations go back to the drafter for at most `MaxCriticRounds` (2) revisions. Picks that still fail are dropped, and the planner fills their gaps.
2. **Orchestration is a plain sequential workflow in the Application layer; roles are Agent Framework agents.** `WeekendDraftWorkflow` runs the steps in order with a bounded critic loop. Each model role goes through `IAgentRoleRunner`. `AgentFrameworkRoleRunner` (Infrastructure) implements it with `ChatClientAgent`, whose model is the official Anthropic SDK's `IChatClient` (`Anthropic` 13.3.0 + `Anthropic.Foundry` 1.0.0). The researcher keeps the raw Messages API path of `ClaudeWebSearchClient`, because the .NET Anthropic connector has no web-search server tool. Agent Framework Workflows (`AgentWorkflowBuilder`) are not used for now: the critic is deterministic code over structured state rather than an agent, and the round limit and fallback rules are simplest and most testable as C#.
3. **Hosting: a triggered WebJob beside `ingest` plus an in-API queue.**
   - **Scheduled.** `saturdaze draft-weekends` runs as the WebJob `draft` on Fridays at 12:00 UTC, after the 08:00 UTC ingestion and ahead of the Friday preview.
   - **On demand.** `POST /api/weekends/{id}/drafts` queues an `AgentRun`. `AgentDraftQueueProcessor`, a hosted service in the API, runs queued drafts one at a time.
   - Both paths run the same `WeekendDraftRunner`. Nothing new is provisioned.
4. **Models.** Every role uses the existing `claude-sonnet-5` deployment (ADR-011). The role models are separate settings (`ResearcherModel`, `CuratorModel`, `DrafterModel`), so the curator and drafter can move to a `claude-haiku-5-5` deployment (GA on Azure, about 1/20 of the token price) once evaluations show the same quality. That needs one more deployment in `eng/foundry/claude.bicep`; it is not made here.
5. **Authentication: managed identity to Foundry for agent planning.**
   - **Production.** `Saturdaze:AgentPlanning:Auth=ManagedIdentity` in production. The API's system-assigned identity, which the WebJob shares, gets **Cognitive Services User** on the Foundry account. The SDK sends a bearer token for `https://ai.azure.com/.default` from `DefaultAzureCredential`.
   - **Local and fallback.** `Auth=Key` keeps working with `ANTHROPIC_FOUNDRY_API_KEY`.
   - **Ingestion.** It stays on the key (ADR-011 decision 3) until it is moved in a separate change; the key setting stays in the template.
6. **Tracing: OpenTelemetry to the existing Application Insights.**
   - **Spans.** One activity source, `Saturdaze.Agents`, carries `plan_weekend` (root), `invoke_agent {role}`, `chat {model}`, `execute_tool {tool}` and `validate_plan`. Agent spans come from Agent Framework's `UseOpenTelemetry(sourceName: "Saturdaze.Agents")` with `EnableSensitiveData = false`; the researcher's spans are written by hand with the same `gen_ai.*` attributes.
   - **Export.** The API and the CLI register the OpenTelemetry tracer for that source and the Azure Monitor exporter when `APPLICATIONINSIGHTS_CONNECTION_STRING` is set.
   - **Redaction.** No span carries prompts, completions, names or addresses (L2-208).
7. **Runtime controls follow ACS's checkpoints and verdicts, enforced by a built-in gate.**
   - **Checkpoints.** `AgentControlGate` (Application) enforces three intervention points of the Agent Control Specification, fail-closed with allow / deny verdicts: `input` (no other family's identifiers, no names, no address in a prompt), `pre_tool_call` (per-role tool allow-list, argument schema, call caps) and `output` (role JSON schema, catalog ids only, research URLs present in the run's search results, validator).
   - **Policy source.** The policies are written as an ACS manifest with Rego policies under `evals/assert/acs/`. They are checked offline with `assert-ai acs validate` against ASSERT's recorded violations, and the gate mirrors them rule for rule (mapping table in the design).
   - **Why not the ACS engine.** The .NET engine (`ResponsibleAI.AgentControlSpec` 0.4.0-beta.1, native library, public preview) is not taken as a runtime dependency. `AgentPlanning:Controls:Enabled` (default true) exists only so the "before" ASSERT baseline can be measured.
8. **Idempotency by persistence.**
   - **Storing.** A validated draft is stored as a `WeekendDraft` (shortlist, picks with reasons, validator report).
   - **Applying.** It is applied deterministically: replacing unlocked blocks as a regenerate does, without incrementing `RegenerateCount`, and setting `Weekend.PlanSource=Agents`.
   - **Re-posting.** `POST /api/weekends/plan` returns the existing weekend unchanged. For a missing weekend with a stored, unapplied draft, it materializes that draft.
   - **Regenerating.** `regenerate` stays the planner's explicit reseat (ADR-003).
9. **Evaluation: ASSERT locally and as a CI gate; Foundry evaluators deferred.**
   - **Suite.** `evals/assert/` pins ASSERT 0.3.0 by commit and holds one `eval_config.yaml` per behaviour B1–B7 (L2-212), each with a "Permissible boundary" paragraph and a sample size.
   - **Target.** The target is a Python callable that drives the real workflow through the e2e API (`eng/Start-E2eApi.ps1`) with the real Foundry deployment. The judge and tester use Foundry Claude through LiteLLM (`azure_ai/claude-sonnet-5`).
   - **No key.** Without a key, every behaviour prints a skip message and exits 0.
   - **CI.** `.github/workflows/assert.yml` runs `evals/assert/run_evals.py` on pull requests that touch agent code or the suite, and on demand, only when the Foundry secret is present and the pull request is not from a fork. `check_boundaries.py` enforces the absolute boundaries. `responsibleai/assert-ai-action` (v1.0.4, `4e22663a…`) was the first plan. It is not used, because the target needs a per-behaviour environment and B7 needs the API restarted with failing tools, which a single action invocation cannot do.
   - **Deferred.** Foundry evaluators, User Simulation, multi-turn evaluation, intelligent sampling, traces-to-dataset, Agent Optimizer, ROI for agents and Purview runtime DLP are follow-ups.
10. **Cost model and circuit-breakers (L2-207).**
    - **Per-run caps.** 12 model calls, 40 tool calls, 5 web searches, 250,000 tokens, 300 seconds.
    - **Cross-run caps.** 60 runs a UTC day (counted under a lock, as ingestion does), 3 on-demand runs per weekend, and a US$25 monthly spend cap computed from recorded usage at configured prices. A run that would pass a cap falls back with `Budget` before any model call.
    - **Expected spend.** At `claude-sonnet-5` prices, a family draft is about 40,000 input and 4,000 output tokens (≈ US$0.12). A shared regional research is about 130,000 input tokens plus 5 searches (≈ US$0.31). Three families in one cell, weekly, cost about US$2 a month, well inside the budget.
11. **Fallback is a first-class outcome.** Disabled, Error, Timeout, Budget, Policy and Invalid each leave the planner's weekend in place, with a family-facing notice (L2-205). The scheduled run creates the weekend with the planner when it does not exist, so a family never wakes up to nothing.

## Options Considered

### Orchestration

#### Option A: Sequential C# workflow, Agent Framework agents per role (chosen)
- **Pros:** The deterministic critic, round limit and fallbacks are ordinary code under test. It uses the GA Agent Framework for the tool-calling loop, OpenTelemetry and the `IChatClient` seam, which makes the model replaceable with a scripted fake in API tests. One small Application-layer port keeps the layers clean.
- **Cons:** Two model paths: the researcher stays on raw HTTP for web search. If the graph grows, a later move to Agent Framework Workflows is a refactor.

#### Option B: Agent Framework Workflows (sequential or group chat)
- **Pros:** Built-in graph, checkpointing and workflow spans.
- **Cons:** The critic is not an agent. Sequential and group-chat builders pass a conversation, not validated structured state, and expressing a bounded validator loop needs custom executors. Some workflow telemetry wiring for `BuildSequential` could not be confirmed in the docs.

#### Option C: Claude Agent SDK
- **Pros:** A batteries-included harness.
- **Cons:** It is built around Claude Code's file and shell tools, adds a process boundary for a .NET app, and none of its built-in tools are needed.

#### Option D: Plain Messages API tool use, hand-written loop
- **Pros:** No new dependencies; matches `ClaudeWebSearchClient`.
- **Cons:** It re-implements the tool loop, telemetry and function schemas that Agent Framework and `Microsoft.Extensions.AI` already provide as GA.

### Hosting

#### Option A: Triggered WebJob plus in-API queue on the B1 plan (chosen)
- **Pros:** No new resource and no cold start. It is the same pattern ingestion already proves in production (ADR-017).
- **Cons:** Agent runs share one core with the API. At this scale that is minutes a week.

#### Option B: Foundry Hosted Agents
- **Pros:** GA hosting with Foundry tracing and guardrails.
- **Cons:** The .NET hosting package is preview. It bills container hours on top of B1, and it would move the validator, which needs the database, to another host.

#### Option C: Container Apps job
- **Pros:** Scale to zero, per-second billing.
- **Cons:** A registry and image builds. ADR-017 rejected Container Apps at this scale, and nothing here changes that.

### Runtime controls

#### Option A: Built-in gate mirroring an ACS manifest (chosen)
- **Pros:** No preview runtime dependency. The checkpoints and verdicts match the specification, and the manifest is still validated by ASSERT.
- **Cons:** Two expressions of the same rules (C# and Rego) to keep in step, mitigated by the mapping table and `acs validate`.

#### Option B: `ResponsibleAI.AgentControlSpec` engine in process
- **Pros:** Policies enforced from the manifest itself.
- **Cons:** Public preview, beta version, native library on Linux App Service; anything in preview needs a non-preview fallback (Context).

## Consequences

### Positive
- Plans fit the family: values, drive limit, commitments with travel, meals in their windows, hours, seasons and daylight. Each pick says why.
- No agent output reaches a saved weekend without passing the planner's rules, so the worst case is today's plan.
- The planner defects are fixed for every family, with or without agents.
- Every run is auditable (`AgentRun`), traced to Application Insights, and bounded in cost.

### Negative
- More moving parts: three roles, a queue, a WebJob and a policy gate.
- The researcher writes into the shared catalog, so a bad research row affects every family in the cell until the next run (mitigated by the verified-URL rule and the parser).
- Two copies of the control rules (C# and Rego).

### Risks
- Foundry's shared Claude quota (ADR-011). Agent planning falls back cleanly on 429 after the SDK's retries.
- The role assignment needs `Microsoft.Authorization/roleAssignments/write`. The deploying principal must hold Owner, User Access Administrator or Role Based Access Control Administrator on the Foundry account. So that a merge cannot fail the `infra` job or turn on agents that cannot authenticate, both are behind repository variables that default to false: `AGENT_PLANNING_GRANT_ROLE` adds the assignment and `AGENT_PLANNING_ENABLED` turns the feature on. They are set once the grant is possible and the ASSERT run against the deployment has passed.
- Model drift on `claude-sonnet-5` can change behaviour; the ASSERT gate catches regressions only where the secret is configured.

## Implementation Notes

- Feature flag: `Saturdaze__AgentPlanning__Enabled=true` (set by `eng/infra/main.bicep`); off by default elsewhere.
- Run a scheduled pass now: Web App → WebJobs → `draft` → Run, or `saturdaze draft-weekends` locally with the key.
- Evaluations: `evals/assert/README.md`.
- Turning it off in production: set the app setting to `false`; families keep their drafted weekends, and new drafts fall back with the Disabled notice.

## References

- [Microsoft Agent Framework](https://learn.microsoft.com/agent-framework/) · [Anthropic provider](https://learn.microsoft.com/agent-framework/integrations/by-component/model-providers/anthropic) · [Observability](https://learn.microsoft.com/agent-framework/agents/observability)
- [Use Claude models in Foundry](https://learn.microsoft.com/azure/foundry/foundry-models/how-to/use-foundry-models-claude) · [Built-in roles: AI + machine learning](https://learn.microsoft.com/azure/role-based-access-control/built-in-roles/ai-machine-learning)
- [Microsoft's open trust stack (Build 2026)](https://devblogs.microsoft.com/foundry/build-2026-open-trust-stack-ai-agents/) · [ASSERT](https://github.com/responsibleai/ASSERT) · [assert-ai-action](https://github.com/responsibleai/assert-ai-action) · [Agent Control Specification](https://aka.ms/AgentControlSpecification)
- [OpenTelemetry semantic conventions for generative AI](https://opentelemetry.io/docs/specs/semconv/gen-ai/)
