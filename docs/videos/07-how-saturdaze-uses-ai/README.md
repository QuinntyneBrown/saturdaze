# 07 · How Saturdaze uses AI through Microsoft Foundry

> **Runtime:** ~10 min · **Audience:** developers and operators new to the repo, no Azure or Claude experience needed · **Prerequisites:** can read C# and JSON

**Video:** [07-how-saturdaze-uses-ai.mp4](07-how-saturdaze-uses-ai.mp4) · [Slides](slides.html) · **Audio:** [07-how-saturdaze-uses-ai.mp3](07-how-saturdaze-uses-ai.mp3) · [Transcript](script.md)

## Why this video exists

Saturdaze calls a large language model in exactly one place: catalog ingestion. New contributors either assume AI is everywhere or cannot find it at all. This video draws the boundary, follows one ingestion pass from trigger to database row, explains why the call goes through Microsoft Foundry (ADR-011), and names the cost rails. It is the entry point for the series; videos 08-10 go deeper into prompts, Azure provisioning and .NET configuration.

## Learning objectives

By the end, the viewer can:

- Point at the single subsystem that calls a model and explain why the planner never does.
- Narrate the pipeline: trigger → `IngestionRunner` → `IngestionPrompts` → `IWebSearchClient` → `ClaudeWebSearchClient` → Foundry → `IngestionResultParser` → `CatalogUpserter` → `IngestionRun`.
- State why Foundry is the default provider and how Anthropic remains a fallback.
- Name the five safety rails (dry run, daily budget, search/token caps, single retry, lazy failure).

## Key questions

| Question | What a strong answer includes |
|----------|-------------------------------|
| Where does Saturdaze use AI? | Only catalog ingestion (events, activities, restaurants). The weekend planner is deterministic. |
| What goes to the model? | A system prompt + user prompt built from `IngestionContext` (home location name, max drive minutes, upcoming Saturday). No member data. |
| How does the request reach Claude? | One `POST v1/messages` with the `web_search_20250305` tool, to `https://<resource>.services.ai.azure.com/anthropic/` by default, or `https://api.anthropic.com/` when `Provider` is `Anthropic`. |
| What comes back and where does it go? | Text containing a JSON array → parsed per row → upserted on a natural key → audited in `IngestionRun` with token and search usage. |
| What stops runaway cost? | `--dry-run`, `MaxRunsPerDayPerType` (48), `MaxSearches` (5), `MaxTokens` (4096), one retry after 30 s, lazy failure when unconfigured. |

## Code / assets on screen

| File | What to show |
|------|--------------|
| `backend/src/Saturdaze.Application/Ingestion/IngestionRunner.cs` | `RunAsync` building `IngestionContext`; `RunOneAsync` calling prompts, client, parser, upserter |
| `backend/src/Saturdaze.Application/Ingestion/IngestionRecords.cs` | `IngestionContext` record (PII-free) |
| `backend/src/Saturdaze.Application/Ingestion/IWebSearchClient.cs` | The contract and `WebSearchResult` |
| `backend/src/Saturdaze.Infrastructure/Ingestion/ClaudeWebSearchClient.cs` | `BuildRequestBody` with the `web_search_20250305` tool; `BuildRequest` headers |
| `backend/src/Saturdaze.Infrastructure/Ingestion/ClaudeWebSearchOptions.cs` | `ResolveBaseUri`, provider enum |
| `backend/src/Saturdaze.Application/Ingestion/IngestionOptions.cs` | `MaxRunsPerDayPerType` |
| `backend/src/Saturdaze.Domain/Entities/IngestionRun.cs` | Audit fields |
| `docs/adr/ADR-011-claude-via-microsoft-foundry.md` | Decision summary |

## Run sheet

| Time | Segment | Content |
|------|---------|---------|
| 00:00-00:40 | Introduction | What the video covers; series map |
| 00:40-01:25 | What you will be able to answer | Four questions |
| 01:25-02:30 | The one place AI is used | Catalogs vs planner; AI as data supplier |
| 02:30-05:40 | The pipeline, end to end | Triggers, runner, context, prompts, client, Foundry call, parser, upserter, audit |
| 05:40-06:50 | Why Microsoft Foundry | ADR-011: same API, one bill, eastus2, model version 2, Anthropic fallback |
| 06:50-07:45 | How the layers fit | Domain / Application / Infrastructure / hosts |
| 07:45-09:20 | The safety rails | Dry run, budget, caps, retry, lazy failure, 129K tokens |
| 09:20-10:00 | Things to remember | Recap and preview of video 08 |

## Demo commands

```bash
# Tune or inspect without writing anything (needs ANTHROPIC_FOUNDRY_API_KEY in the environment)
dotnet run --project backend/src/Saturdaze.Cli -- ingest --type events --dry-run

# Refresh every catalog (writes catalog rows and IngestionRun audit rows)
dotnet run --project backend/src/Saturdaze.Cli -- ingest --type all

# Unit tests that cover the pipeline without any network
dotnet test backend/tests/Saturdaze.Application.Tests --filter FullyQualifiedName~Ingestion
dotnet test backend/tests/Saturdaze.Infrastructure.Tests --filter FullyQualifiedName~Ingestion
```

## Pitfalls

- Expecting the planner to call a model. It does not; only ingestion does.
- Treating `--dry-run` as free. It skips writes, but it still calls the model and still costs tokens.
- Forgetting that web search results count as input tokens. One events pass used about 129K.
- Looking for a daily-budget or retry setting in the API project. Both live under `Saturdaze:Ingestion`, bound by `AddIngestion` in Infrastructure.

## References

- `docs/adr/ADR-011-claude-via-microsoft-foundry.md`
- `docs/detailed-designs/discovery/ingest-catalogs/README.md`
- `docs/detailed-designs/operations/schedule-catalog-ingestion/README.md`
- [Claude models in Microsoft Foundry](https://learn.microsoft.com/azure/foundry/foundry-models/concepts/claude-models)
- [Anthropic Messages API: web search tool](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/web-search-tool)
