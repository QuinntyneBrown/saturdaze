# 08 · Prompts and AI behaviour, end to end

> **Runtime:** ~12 min · **Audience:** developers who will tune what the model is asked to find · **Prerequisites:** video 07, able to run `dotnet test` and the CLI

**Video:** [08-prompts-and-ai-behaviour.mp4](08-prompts-and-ai-behaviour.mp4) · [Slides](slides.html) · **Audio:** [08-prompts-and-ai-behaviour.mp3](08-prompts-and-ai-behaviour.mp3) · [Transcript](script.md)

## Why this video exists

"Change the AI behaviour" means different things: rewording the prompt, moving the home location, picking another model, or asking for a new field. Each is a different kind of change with a different blast radius. This video shows the exact text Claude receives, how it is assembled from `IngestionPrompts`, `IngestionContext` and `ClaudeWebSearchOptions`, and walks one behaviour change through the repository's ATDD rule (test first, then prompt, then `--dry-run`).

## Learning objectives

By the end, the viewer can:

- Explain each part of `BuildSystemPrompt` (preamble, type-specific rules, output instruction, schema) and `BuildUserPrompt`.
- Change prompt wording with a failing test first, then verify with a dry run.
- Change home location, drive radius, model deployment, search budget, token ceiling and retry via configuration or environment variables.
- Treat the schema as a contract shared by prompt, `IngestionResultParser` and `CatalogUpserter`, and list the three places a new field touches.
- Read dry-run output and `IngestionRun` numbers to judge whether a prompt change worked.

## Key questions

| Question | What a strong answer includes |
|----------|-------------------------------|
| Where is the prompt text? | `backend/src/Saturdaze.Application/Ingestion/IngestionPrompts.cs`, static methods `BuildSystemPrompt` and `BuildUserPrompt`; content, not logic. |
| What values are substituted? | `IngestionContext`: `HomeLocation` (from `Saturdaze:HomeLocation:Name`, fallback "Port Credit, Mississauga, ON"), `MaxDriveMinutes` (from `Saturdaze:Ingestion:MaxDriveMinutes`, default 200), `ThisWeekend` (upcoming Saturday from the clock). Nothing personal. |
| Which fields are required per type? | Events: `name`, `startsOn`, `location` (`endsOn` defaults to start). Activities: `name`. Restaurants: `name`, `slot` ∈ Lunch/Dinner. `latitude`, `longitude`, `address` are shared and optional: a location is stored only when both coordinates are present and in range. |
| How do I change a prompt safely? | Add a failing assertion in `IngestionPromptsAndTypesTests`, edit the prompt, go green, then `saturdaze ingest --type <t> --dry-run`, then run for real. |
| Which knobs are configuration only? | `Model`, `MaxSearches`, `MaxTokens`, `MaxContinuationTurns`, `RetryDelaySeconds` under `Saturdaze:Ingestion:Claude`; `MaxDriveMinutes` under `Saturdaze:Ingestion`; `Saturdaze:HomeLocation:Name`. |
| Why did a pass succeed with zero items? | Empty or unparseable text is a zero-item success; suspect `MaxTokens` truncation or a broken schema line. |

## Code / assets on screen

| File | What to show |
|------|--------------|
| `backend/src/Saturdaze.Application/Ingestion/IngestionPrompts.cs` | Preamble, output instruction, events/restaurants branches, `BuildUserPrompt` |
| `backend/src/Saturdaze.Application/Ingestion/IngestionRecords.cs` | `IngestionContext` |
| `backend/src/Saturdaze.Application/Ingestion/IngestionResultParser.cs` | `TryBuildEvent`, `TryBuildActivity`, `TryBuildRestaurant` |
| `backend/src/Saturdaze.Application/Ingestion/CatalogUpserter.cs` | Field mapping and `Truncate` lengths |
| `backend/src/Saturdaze.Application/Ingestion/IngestionRunner.cs` | Context construction; dry-run log line |
| `backend/src/Saturdaze.Infrastructure/Ingestion/ClaudeWebSearchOptions.cs` | `Model`, `MaxSearches`, `MaxTokens`, `MaxContinuationTurns`, `RetryDelaySeconds` |
| `backend/tests/Saturdaze.Application.Tests/Ingestion/IngestionPromptsAndTypesTests.cs` | Existing prompt tests; where the new one goes |
| `backend/src/Saturdaze.Cli/appsettings.json` | `HomeLocation` and `Ingestion` sections |

## Run sheet

| Time | Segment | Content |
|------|---------|---------|
| 00:00-00:40 | Introduction | Steering behaviour; test → prompt → dry run |
| 00:40-01:25 | What you will be able to do | Four outcomes |
| 01:25-02:45 | Three layers of behaviour | Prompt wording, context, knobs; schema is a contract |
| 02:45-05:15 | Anatomy of the system prompt | Preamble, type rules, output instruction, schema; user prompt |
| 05:15-06:45 | The schema is a contract | Parser required fields, upserter truncation, three-place change |
| 06:45-08:50 | Changing behaviour the repository way | Failing test, prompt edit, dry run, real run, PR note |
| 08:50-09:35 | Changing the context without code | HomeLocation name, MaxDriveMinutes, env override, guidance not filter |
| 09:35-10:40 | Changing the model knobs | Model, MaxSearches, MaxTokens, MaxContinuationTurns, RetryDelaySeconds |
| 10:40-11:10 | Reading the results | Console line and IngestionRun; three numbers to watch |
| 11:10-11:45 | Pitfalls | Zero-item success, fences, PII, dates, model name mismatch |
| 11:45-12:00 | Things to remember | Recap and preview of video 09 |

## Demo commands

```bash
# 1. Test first (fails until the prompt changes)
dotnet test backend/tests/Saturdaze.Application.Tests --filter FullyQualifiedName~IngestionPromptsAndTypesTests

# 2. Dry run against Foundry (key from .deploy/azure.env; never echo it)
export ANTHROPIC_FOUNDRY_API_KEY="$(grep '^ANTHROPIC_FOUNDRY_API_KEY=' .deploy/azure.env | cut -d= -f2-)"
dotnet run --project backend/src/Saturdaze.Cli -- ingest --type restaurants --dry-run

# 3. Real run
dotnet run --project backend/src/Saturdaze.Cli -- ingest --type restaurants

# Configuration overrides for one process
Saturdaze__Ingestion__MaxDriveMinutes=90 \
Saturdaze__Ingestion__Claude__MaxSearches=3 \
dotnet run --project backend/src/Saturdaze.Cli -- ingest --type events --dry-run
```

## Pitfalls

- Renaming a required schema field only in the prompt rejects every row.
- Adding a field only in the prompt is silently ignored by the upserter.
- `--dry-run` still calls the model and costs tokens.
- `Model` on Foundry is a deployment name; it must exist on the resource (video 09).
- The drive radius is guidance to the model, not a geographic filter in code.

## References

- `docs/detailed-designs/discovery/ingest-catalogs/README.md`
- `AGENTS.md` ("Incremental Implementation and ATDD")
- [Anthropic: system prompts](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/system-prompts)
- [Anthropic: web search tool](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/web-search-tool)
- [.NET configuration: environment variables and the `__` separator](https://learn.microsoft.com/dotnet/core/extensions/configuration-providers#environment-variable-configuration-provider)
