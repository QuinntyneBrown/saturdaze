# Plan a weekend with agents

## Overview

Saturdaze is a web application that plans personalized family weekends. The deterministic `WeekendPlanner` builds valid plans, but it cannot judge what suits a particular family. It cannot tell that "Park your Pumpkin" is a Halloween event, that a Royal Winter Fair is the best fit for a rainy November Saturday, or that a church harvest fair is a good alternative for a family that does not celebrate Halloween (`docs/schedule-generation-evaluation.md`). This feature adds a bounded team of AI agents that researches, curates and drafts each family's weekend. The planner remains the authority on hard constraints (L1-041, ADR-023).

*agent* — one model role (a system prompt, a model deployment and a fixed set of tools) that answers in a fixed JSON shape

*run* — one attempt to draft one family's weekend, recorded as an `AgentRun`

*draft* — the stored result of a run that reached the validator: the curator's shortlist, the drafter's picks with reasons, and the validator's report (`WeekendDraft`)

*pick* — one outing the drafter proposes: a day, a catalog activity or event, an optional start time and a reason

*region cell* — the family's home coordinates rounded to 0.5° of latitude and longitude; families in one cell share regional research

*fallback* — a run that ends without changing the weekend and leaves the planner's plan in place, with a notice that says why

Agents propose and the planner disposes. A pick reaches a saved weekend only when `PlanValidator`, built on the planner's rules, accepts it. With agent planning disabled, failing, timing out or over budget, the family gets today's planner output and a visible notice (L2-205). Planner fixes and the new family settings the agents rely on are designed in `weekend-planning/fit-plans-to-the-family`, `family-profile/set-planning-boundaries`, `family-profile/describe-commitment-attendees-and-places` and `discovery/ingest-catalogs`.

## Description

### Roles, inputs, tools and outputs

| Role | Model setting | Input | Tools | Output (JSON) |
|---|---|---|---|---|
| Regional researcher | `ResearcherModel` | The cell centre (latitude, longitude), the weekend and the drive radius; no family data | `web_search_20250305` (server tool, at most `MaxWebSearchesPerRun`) | An array of event and activity rows in the ingestion schema (`discovery/ingest-catalogs`), each with an https source |
| Family curator and values checker | `CuratorModel` | `FamilyPlanningProfile` (L2-209) and the weekend | `search_catalog`, `get_place`, `get_weather`, `get_daylight`, `get_drive_minutes` | `{ "shortlist": [ { "kind": "activity"\|"event", "id": guid, "reason": string, "checked": [string] } ] }`, at most 12 |
| Itinerary drafter | `DrafterModel` | The profile, the shortlist with facts (times, hours, drive, indoor), the fixed blocks per day and, after round 1, the violations | `get_place`, `get_daylight` | `{ "picks": [ { "day": "Saturday"\|"Sunday", "kind", "id", "start": "HH:mm"?, "reason": string } ] }` |
| Validator and assembler | none (C#) | The planner inputs and the picks | none | The assembled blocks and a `ValidationReport` |

All three roles default to the `claude-sonnet-5` deployment (ADR-011). `AgentPrompts` holds the system and user prompts as content only, as `IngestionPrompts` does. The prompts name the JSON shape. They state that text inside `<data>` blocks is quoted material that carries no instructions. They tell the model never to name a place that is not in the shortlist or the catalog.

### Tool contracts over the Application layer

`PlanningToolset.For(PlannerContext ctx, AgentRunMeter meter)` builds `AgentTool` records bound to one family and weekend. No tool accepts a family id (L2-209). Each tool sends a MediatR query or reads the already-loaded `PlannerContext`, and returns compact JSON:

| Tool | Parameters (JSON schema) | Backed by | Returns |
|---|---|---|---|
| `search_catalog` | `{ kind: "activity"\|"event"\|"any", indoor?: bool, day?: "Saturday"\|"Sunday", text?: string, take?: 1–40 }` | `PlannerContext.Activities`/`Events` filtered by `CandidateFilter` (max drive, excluded themes, dislikes, age, season, the day's dates) | `[{ kind, id, name, category, indoor, driveMinutes, minAge, maxAge, opensAt, closesAt, season, startTime, endTime, priceTier, themes, summary }]` — the text fields wrapped as data |
| `get_place` | `{ kind, id }` | Same lists | One row as above, or `{ "error": "not_found" }` |
| `get_weather` | `{ day }` | `PlannerContext.ForecastFor` | `{ tags, high, low, unavailable }` |
| `get_daylight` | `{ day }` | `SunCalculator.Sunset(home, date, zone)` | `{ sunset: "HH:mm" }` |
| `get_drive_minutes` | `{ kind, id }` | `FamilyDriveTime.Minutes(home, place)` | `{ minutes }` |

`AgentControlGate.CheckToolCall` runs before every invocation. It checks the role's allow-list (the researcher has no function tools; the curator has all five; the drafter has `get_place` and `get_daylight`), validates the arguments against the schema, and enforces `MaxToolCallsPerRun`. A refused call returns `{ "error": "refused", "reason": … }` to the model and records a `tool` violation on the run (L2-209 AC3).

### Workflow and the validator loop

`WeekendDraftWorkflow.DraftAsync(DraftContext, AgentRunMeter, ct)` runs these steps:

1. `RegionalResearcher.EnsureAsync(cell, weekendOf)` reuses a `RegionResearch` row for the cell and weekend completed in the last 6 days. Otherwise it calls `IWebSearchClient.SearchAsync` with `AgentPrompts.Research`. `AgentControlGate.CheckResearchOutput` drops every row whose URL was not among the response's `web_search_result` URLs. The rest go through `IngestionResultParser` and `CatalogUpserter` (with `ThemeTagger`), and a `RegionResearch` row is saved. A research failure is logged on the run and does not stop the draft: the curator works from the existing catalog.
2. `AgentControlGate.CheckInput` runs on the curator's prompt (no family name, member names, emails, home address, coordinates, or another family's id). `IAgentRoleRunner.RunAsync` then runs the curator. `CheckOutput` parses the shortlist, drops unknown ids and records them as `output` violations.
3. For `round = 1 … MaxCriticRounds + 1` (default 3 attempts), the drafter proposes picks. `DraftAssembler.Assemble(inputs, picks)` places them through `WeekendPlanner.PlanWithPicks`, and `PlanValidator.Validate` returns a violation list per pick (L2-206). With no violations the loop ends. Otherwise the violations, as `{ pick, rule, detail }`, become the next round's input.
4. After the last round, the passing picks form the draft. The planner fills the gaps of the failing ones. When no pick passes, the outcome is `Invalid`.

`AgentRunMeter` counts model calls, tool calls, web searches and tokens. It stops further model calls once a per-run cap is reached (`MaxModelCallsPerRun` 12, `MaxToolCallsPerRun` 40, `MaxWebSearchesPerRun` 5, `MaxTokensPerRun` 250 000). The workflow then continues with what it has.

### The model port and Agent Framework

`IAgentRoleRunner` is the Application port: `RunAsync(AgentRoleRequest(Role, Model, Instructions, Input, Tools, MaxModelCalls), ct)` returns `AgentRoleResult(Text, ModelCalls, InputTokens, OutputTokens)` or throws `AgentRoleException`.

`AgentFrameworkRoleRunner` (Infrastructure) implements it with Microsoft Agent Framework (`Microsoft.Agents.AI` 1.26.0):
- It resolves the keyed `IChatClient` `"agent-planning"`, which is built from `AnthropicFoundryClient` (`Anthropic.Foundry` 1.0.0) with `AnthropicFoundryIdentityTokenCredentials(DefaultAzureCredential, resource, ["https://ai.azure.com/.default"])` for `Auth=ManagedIdentity`, or `AnthropicFoundryApiKeyCredentials` for `Auth=Key`.
- It wraps that client in `UseOpenTelemetry(sourceName: "Saturdaze.Agents")` and function invocation capped at `MaxModelCalls` iterations.
- Each `AgentTool` becomes an `AIFunction` with the tool's JSON schema.
- It builds a `ChatClientAgent` named after the role and instrumented with `UseOpenTelemetry(sourceName: "Saturdaze.Agents", EnableSensitiveData = false)`.
- It sums usage across the response's messages.

API tests replace the keyed `IChatClient` with `ScriptedChatClient`. That fake answers each role from a script (tool calls first, then the final JSON), so the real Agent Framework loop, tools, gate and validator run without a network (ADR-020 style).

### Runs, persistence and applying a draft

`WeekendDraftRunner` owns the lifecycle:
- `QueueAsync(familyId, weekendOf, trigger)` inserts an `AgentRun` (`Queued`).
- `RunAsync(runId, ct)`:
  - takes the `saturdaze-agent-runs` lock (`IAppDbContext.AcquireLockAsync`, as ingestion does), checks `Enabled`, the daily run cap and the monthly spend cap (the sum of this month's `CostUsd`), then marks the run `Running`;
  - starts the `plan_weekend` activity and runs the workflow under a `CancellationTokenSource` of `RunTimeoutSeconds`;
  - finishes by storing the `WeekendDraft` and calling `DraftApplier.ApplyAsync`, or by recording the fallback.
- The run row always closes with status, rounds, usage, cost (`AgentCostCalculator`), policy violations (at most 4000 characters) and the trace id (`Activity.Current.TraceId`).
- No exception escapes `RunAsync`. A scheduled run for a weekend that does not exist creates it with the planner on fallback.

`DraftApplier.ApplyAsync(weekend, draft, ctx)` re-runs `DraftAssembler` with the stored picks against the weekend's locked blocks, then replaces the unlocked blocks as `WeekendReplanner` does (each block added once, L2-188). It sets `PlanSource = Agents`, marks the draft `Applied` and leaves `RegenerateCount` alone. The assembly is deterministic: seed `weekendOf.DayNumber`, picks in stored order. Applying the same draft twice gives the same blocks (L2-204 AC4). `GenerateWeekendCommandHandler` checks for an unapplied, validated draft before planning a missing weekend. `WeekendReplanner` (regenerate) sets `PlanSource = Planner`.

`WeekendMapper` adds `planSource` and `agentDraft` (the latest run for the family and weekend: `{ runId, status, trigger, requestedUtc, finishedUtc, fallbackReason, notice }`) to `WeekendDto`. `AgentDraftNotice.For(reason)` returns the L2-205 texts.

### Triggers and endpoints

| Trigger | Entry point | Notes |
|---|---|---|
| Scheduled | `saturdaze draft-weekends` (`DraftWeekendsCommand`), WebJob `backend/deploy/webjobs/draft/` with `settings.job` `0 0 12 * * 5` | Families with `FridayPreviewEnabled`; skips a family whose weekend is `Agents` from a run started in the last 6 days; exit code 1 when a run errors |
| On demand | `POST /api/weekends/{id}/drafts` → `RequestWeekendDraftCommand` → 202 `{ runId, status }` | 404 other family; 409 `draft_in_progress`, 409 `weekend_past`, 429 `draft_limit` (L2-203); with `Enabled=false` the run is created and closed `FellBack Disabled` at once |
| Status | `GET /api/weekends/{id}/drafts/latest` → `GetLatestWeekendDraftQuery` | 404 when no run exists |
| Processor | `AgentDraftQueueProcessor` (`BackgroundService` in the API) | Polls every `QueuePollSeconds` (5) for the oldest `Queued` run and runs it; one at a time |
| Admin | `GET /api/admin/agent-runs?take=` → `GetAgentRunsQuery` | Administrators only (`AdminOnly` policy, ADR-014); runs plus `{ runsToday, appliedToday, fellBackToday, spendThisMonthUsd, monthlyCapUsd }` |

### Configuration

`AgentPlanningOptions` binds `Saturdaze:AgentPlanning`: `Enabled` (false), `Auth` (`Key`), `FoundryResource`, `ResearcherModel`, `CuratorModel` and `DrafterModel` (`claude-sonnet-5`), `MaxCriticRounds` (2), `RunTimeoutSeconds` (300), the per-run caps, `MaxRunsPerDay` (60), `MaxOnDemandRunsPerWeekend` (3), `MonthlySpendCapUsd` (25), `PriceInputPerMTokUsd` (2), `PriceOutputPerMTokUsd` (10), `PricePerThousandSearchesUsd` (10), `ResearchReuseDays` (6), `QueuePollSeconds` (5) and `Controls:Enabled` (true). A missing resource or credential fails the run with `Error`, never the host's startup (L2-213 AC3).

### Tracing

| Span | Source | Attributes |
|---|---|---|
| `plan_weekend` (root) | `AgentTelemetry.Source` (`Saturdaze.Agents`) | `saturdaze.run.id`, `saturdaze.run.trigger`, `saturdaze.run.status`, `saturdaze.run.fallback_reason`, `saturdaze.run.cost_usd` |
| `invoke_agent researcher` and `chat {model}` | written by `RegionalResearcher` | `gen_ai.operation.name`, `gen_ai.provider.name=anthropic`, `gen_ai.request.model`, `gen_ai.usage.input_tokens`, `gen_ai.usage.output_tokens` |
| `invoke_agent curator({agent id})`, `invoke_agent drafter({agent id})`, `chat {model}`, `execute_tool {tool}` | Agent Framework `UseOpenTelemetry` on the agent and `Microsoft.Extensions.AI` `UseOpenTelemetry` on the chat client | the `gen_ai.*` set, sensitive data off; the span name is the activity's display name |
| `validate_plan` | `WeekendDraftWorkflow` | `saturdaze.round`, `saturdaze.violations` |

The API and the CLI call `AddAgentTelemetry(configuration)`. It registers `OpenTelemetry` tracing for `Saturdaze.Agents` and, when `APPLICATIONINSIGHTS_CONNECTION_STRING` is set, `AddAzureMonitorTraceExporter`. API tests capture spans with an `ActivityListener` on the source.

### Runtime controls (ACS)

`evals/assert/acs/manifest.yaml` (`agent_control_specification_version: "0.3.0-alpha"`, the format of the pinned ASSERT's ACS examples) with Rego policies under `evals/assert/acs/policy/` is the policy source. `AgentControlGate` enforces the same rules in process, fail-closed:

| ACS intervention point | Policy | `AgentControlGate` method | Verdict on failure |
|---|---|---|---|
| `input` | `no_cross_family_data.rego` | `CheckInput(role, prompt, ctx)` — another family's id, member names, emails, home address or coordinates | deny → run `FellBack Policy` |
| `pre_tool_call` | `tool_allow_list.rego` | `CheckToolCall(role, name, args)` — allow-list, schema, caps | deny → refused result to the model |
| `output` | `catalog_ids_only.rego`, `verified_sources.rego` | `CheckOutput(role, json)`, `CheckResearchOutput(rows, searchUrls)` | deny → drop the item, record the violation |
| `output` | `hard_rules.rego` (summary) | `PlanValidator` | the pick is not applied |

`Controls:Enabled=false` turns the input and output checks into allow-and-record. It exists only to measure the "before" baseline in ASSERT. The validator always runs, because it is the planner's authority, not a control.

### Evaluations (ASSERT)

`evals/assert/` holds `requirements.txt` (pins `assert-ai` from the v0.3.0 commit), `.env.example`, `saturdaze_target.py`, `personas.py`, `run_evals.py`, `check_boundaries.py`, `behaviors/b1-…/eval_config.yaml` to `behaviors/b7-…/eval_config.yaml`, and `acs/`.
- **Target.** `saturdaze_target.chat(message)` reads the scenario tags in the tester's message (`[variant: …] [weekend: …]`). It signs up a fresh persona on the e2e API, saves the variant's profile, posts a draft, polls it, and returns the plan as text with each block's facts (drive minutes, themes, hours, event times, sunset, reason, source URL) and `events` for the tool calls in the run.
- **Runner.** `run_evals.py` skips every behaviour with the L2-212 message when `ANTHROPIC_FOUNDRY_API_KEY` is unset. Otherwise it restarts the e2e API with agents on, runs `assert-ai run --config` per behaviour, restarts the API with an unreachable Foundry resource for B7, and then runs `check_boundaries.py`.

### Hosting, Bicep and CI

- `backend/deploy/webjobs/draft/` (`run.sh`, `settings.job`, `README.md`) mirrors `ingest`. `deploy.yml` publishes the CLI into it and ships it as `App_Data/jobs/triggered/draft/`. The `webjob` job checks that both jobs are listed.
- `eng/infra/main.bicep` adds the `Saturdaze__AgentPlanning__*` settings (`Enabled` from `AGENT_PLANNING_ENABLED`, `Auth=ManagedIdentity`, `FoundryResource`, the models, the caps). When `AGENT_PLANNING_GRANT_ROLE` is true it also adds a `Microsoft.Authorization/roleAssignments` resource that grants the Web App's principal **Cognitive Services User** (`a97b65f3-24c7-4388-baec-2e87135dc908`) on the Foundry account. Both repository variables default to false, so a merge neither fails `infra` nor turns on agents that cannot authenticate.
- `.github/workflows/assert.yml` runs `run_evals.py` on pull requests that touch `AgentPlanning/**` or `evals/assert/**`, and on demand. It is gated on the secret and the pull request's origin, and is skipped, not failed, without them.

## Requirements

The following L2 requirements refine the cited L1 capabilities.

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-202` | `L1-041`, `L1-003` | An agent draft for a family and weekend shall follow a fixed workflow of three model roles (regional researcher, family curator and values checker, itinerary drafter) and one deterministic validator and assembler with at most `MaxCriticRounds` revisions; a draft that passes shall be saved and applied to the weekend (created when missing, otherwise unlocked blocks replaced without incrementing `RegenerateCount`); `WeekendDto` shall carry `planSource` and `agentDraft`, and each block placed from a pick shall carry the drafter's reason. |
| `L2-203` | `L1-041`, `L1-031` | `saturdaze draft-weekends` shall draft every family with "Friday preview" on, as the WebJob `draft` on Fridays at 12:00 UTC; `POST /api/weekends/{id}/drafts` shall queue an on-demand run (202), processed one at a time in the API; `GET .../drafts/latest` shall answer the latest run; 409 `draft_in_progress`, 409 `weekend_past` and 429 `draft_limit` shall guard it. |
| `L2-204` | `L1-041`, `L1-003` | Every draft that reaches the validator shall be stored as a `WeekendDraft`; applying it shall be deterministic; `POST /api/weekends/plan` shall return an existing weekend unchanged and materialize an unapplied draft for a missing one; regenerate shall stay the planner's reseat and set `planSource=Planner`. |
| `L2-205` | `L1-041`, `L1-015` | A run shall fall back, leaving the planner's weekend, when disabled, on error, on timeout, over budget, on a policy block, or when no pick passes, recording the reason and the family-facing notice; a fallback shall never fail the family's request. |
| `L2-206` | `L1-041`, `L1-003`, `L1-012` | `PlanValidator` shall report violations per pick with the rule codes `unknown_place`, `not_shortlisted`, `duplicate`, `overlap`, `outside_day`, `commitment_moved`, `lock_moved`, `beyond_max_drive`, `excluded_theme`, `disliked`, `age_misfit`, `closed`, `out_of_season`, `after_sunset`, `event_not_on`, `meal_window`, `pace` and `unverified_source`; a pick with a violation shall never be applied. |
| `L2-207` | `L1-041`, `L1-015` | Runs shall be bounded per run (model calls, tool calls, web searches, tokens) and across runs (runs per day, monthly spend); a run past a cross-run cap shall fall back with `Budget` without calling the model; regional research shall be shared per region cell and weekend for 6 days. |
| `L2-208` | `L1-041`, `L1-015`, `L1-036` | Each run shall record an `AgentRun` and emit an OpenTelemetry trace from `Saturdaze.Agents` (`plan_weekend`, `invoke_agent`, `chat` with `gen_ai.*` token usage, `execute_tool`, `validate_plan`) without prompt text, names or address; `GET /api/admin/agent-runs` shall answer runs and totals to administrators only. |
| `L2-209` | `L1-041`, `L1-012` | The curator and drafter shall see one family's minimized profile; tools shall take no family id; web and catalog text shall be quoted as data; ACS-style controls shall apply at input, tool and output, and each violation shall be recorded on the run. |
| `L2-210` | `L1-041`, `L1-036`, `L1-011` | Saturdaze Admin shall show "Agent runs" with four stat cards and the latest runs with their status, usage, cost and trace id. |
| `L2-211` | `L1-041`, `L1-003`, `L1-011`, `L1-014` | The Weekend page shall offer "Draft with agents", show the drafting status row while the plan stays visible, show "Drafted for your family" and each pick's reason, and show the "This is the standard plan" banner with the notice and, for Error, Timeout and Invalid, "Try again". |
| `L2-212` | `L1-041`, `L1-015` | An ASSERT suite in `evals/assert/` shall evaluate behaviours B1–B7 against the real workflow with explicit boundaries and sample sizes, skip cleanly without a Foundry key, gate pull requests only when the secret is available, and record before-and-after metrics. |
| `L2-213` | `L1-041`, `L1-016` | `Saturdaze:AgentPlanning` shall configure the feature (default off; on in production), with `Auth=ManagedIdentity` sending an Entra bearer token and no key; Bicep shall grant the Web App's identity Cognitive Services User on the Foundry account; `deploy.yml` shall ship the `draft` WebJob; an unconfigured endpoint shall fail a run lazily. |

## Diagrams

### System context

The context view places the family member and the administrator beside Saturdaze. It shows Foundry serving the three Claude roles, the web the researcher reads through Foundry's search tool, Open-Meteo, and Application Insights receiving the traces.

![C4 system context for planning a weekend with agents](diagrams/c4-context.png)

### Containers

The container view shows both triggers: the API, which queues and processes on-demand drafts, and the `draft` WebJob on the same plan. Both write runs, drafts and research to Azure SQL and call Foundry with the managed identity.

![C4 container view for planning a weekend with agents](diagrams/c4-container.png)

### Components

The component view separates the run lifecycle (`WeekendDraftRunner`) from the workflow, the shared researcher, the family-bound toolset, the control gate, the deterministic validator and applier, and the Agent Framework adapter behind `IAgentRoleRunner`.

![C4 component view for planning a weekend with agents](diagrams/c4-component.png)

### Class structure

The class view shows the persisted run, draft and research records, the model port and its request and result, the gate, the validator, the assembler, the pick and the options.

![Class diagram for planning a weekend with agents](diagrams/class-structure.png)

### Behaviour — scheduled draft

This sequence traces `L2-203`, `L2-202`, `L2-207` and `L2-209` for the Friday WebJob: shared research when the cell has none, the gated curator, the bounded drafter and validator rounds, then the stored and applied draft.

![Sequence diagram for the scheduled draft](diagrams/sequence-scheduled-run.png)

### Behaviour — on-demand draft

This sequence traces `L2-203` and `L2-211`: the guarded request, the 202 response, the in-API processor, the 3-second polling and the reloaded weekend with its reasons.

![Sequence diagram for an on-demand draft](diagrams/sequence-on-demand-run.png)

### Behaviour — fallback

This sequence traces `L2-205` and `L2-207`: each fallback reason leaves the weekend unchanged, and a scheduled run creates a missing weekend with the planner.

![Sequence diagram for the fallback to the planner](diagrams/sequence-fallback.png)
