# 07 · How Saturdaze uses AI through Microsoft Foundry

Saturdaze is a family weekend planner. Most of it is ordinary code: a .NET API, an Angular app, a SQL database and a weather client. But one part of it asks a large language model to go and research the real world. This video walks that part end to end, so you know exactly where AI lives in the solution, what it is allowed to do, and where the knobs are. It is the first of four videos in this series, videos seven to ten of the Saturdaze catalogue. The next three go deeper into prompts, into provisioning the Azure side, and into configuring the .NET solution.

## What you will be able to answer

By the end of this video you should be able to answer four questions.

- Where in the codebase does Saturdaze call a model, and where does it not?
- What happens, step by step, from a trigger to a row in the database?
- Why does the call go to Microsoft Foundry instead of straight to Anthropic?
- Which safety rails stop a bad prompt or a bad schedule from running up a bill?

You do not need to know Azure or Claude to follow along. If you can read C sharp and a JSON file, you are ready.

## The one place AI is used

As of October 2026, the only place Saturdaze calls a model is catalog ingestion. Everything a family sees on the weekend plan comes from three shared catalogs: local events, activities and restaurants. Those catalogs need fresh rows every week, and nobody wants to type them in by hand.

So the application asks Claude to research the web and return rows in a strict JSON shape. The planner that builds a weekend itinerary from those rows is plain deterministic code. It never talks to a model. That boundary matters: if the model is slow, down, or wrong, the family's existing plan still works. Only the refresh of the catalogs is affected.

Keep that picture in mind. AI is a data supplier at the edge of the system, not the decision maker in the middle.

## The pipeline, end to end

Let's follow one pass through the pipeline. There are three ways to start it, and all three run the same code.

- The command line tool: `saturdaze ingest --type events`, with an optional `--dry-run` flag.
- The `Saturdaze.Worker` service, which runs a cron schedule and defaults to Fridays at eight in the morning UTC.
- An Azure App Service web job that simply calls the same command line tool.

Whichever trigger fires, it resolves an `IngestionRunner` from dependency injection and calls `RunAsync` with the list of catalog types. The runner lives in the Application project, in the Ingestion folder.

For each type, the runner first builds a small context record called `IngestionContext`. It holds three things: the family's home location name, the maximum drive time in minutes, and the date of the upcoming Saturday. Nothing else. No member names, no ages, no preferences. That is deliberate, so no personal data ever reaches the model.

Next the runner asks `IngestionPrompts` for two strings: a system prompt and a user prompt. The system prompt describes the researcher persona, the drive radius, the rule to verify every row against a real web page, and the exact JSON schema to return. The user prompt is a one sentence request for that catalog type. We will spend the whole of video eight on these prompts.

Then the runner hands both prompts to `IWebSearchClient` and calls `SearchAsync`. That interface is defined in Application, so the runner can be unit tested with a fake. The real implementation is `ClaudeWebSearchClient` in the Infrastructure project.

The client sends one HTTP POST to the path `v1/messages`, relative to a base address. The body carries the model name, a token ceiling, the system prompt, the user message, and one tool definition: the server side web search tool, `web_search_20250305`, with a cap on how many searches the model may run. Claude does the research loop on its own, visiting venue sites, tourism boards and municipal pages, and finally answers with text that should be nothing but a JSON array.

The client pulls the text blocks out of the response and reads the usage block: input tokens, output tokens and how many web searches were made. If Claude answers with a stop reason of `pause_turn`, meaning it needs another turn to finish searching, the client replays the conversation and continues, up to a bounded number of times.

Back in the runner, `IngestionResultParser` finds the JSON array in the text, even if the model wrapped it in prose or markdown fences, and validates each row on its own. One bad row never sinks the batch. Then `CatalogUpserter` writes the good rows into the matching table, matching on a natural key so a re-run updates rows in place instead of duplicating them.

Finally the runner closes an audit row in the `IngestionRun` table with the status, the counts of rows considered, upserted and rejected, the token usage and the search count. Nothing in the product reads that table. It exists so you can see what a pass cost and how well it went.

## Why Microsoft Foundry

So where does that HTTP POST actually go? By default it goes to Microsoft Foundry, the Azure service that sells Claude through the Azure Marketplace. The decision is recorded in `ADR-011`, in the docs folder, and the reasoning is simple.

Foundry serves the same Claude Messages API that Anthropic does. The URL is different, but the request body, the headers and the response are the same. Saturdaze already runs on Azure, in a resource group called `saturdaze-rg`, so sending Claude traffic through Foundry puts the whole app on one bill and one cost view.

Two details shaped the setup. First, region. Claude is not offered in the Canadian region where the rest of the app lives, so the Foundry resource sits in `eastus2`. Second, hosting. Foundry offers each Claude model in two versions, and version two is hosted on Azure end to end. The deployment Saturdaze uses is `claude-sonnet-5`, version two.

Anthropic is kept as a fallback. Flip one setting, `Provider`, to `Anthropic`, supply the Anthropic key instead, and the exact same code talks to `api.anthropic.com`. Nothing else changes.

## How the layers fit

If you have read the architecture notes, you know the backend has a strict dependency direction: Domain, then Application, then Infrastructure, then the API and the hosts. Ingestion respects that.

- Domain owns the `IngestionRun` entity and the `IngestionType` and `IngestionStatus` enums.
- Application owns the workflow: `IngestionRunner`, `IngestionPrompts`, `IngestionResultParser`, `CatalogUpserter`, and the `IWebSearchClient` contract.
- Infrastructure owns the provider: `ClaudeWebSearchClient`, `ClaudeWebSearchOptions`, and one extension method, `AddIngestion`, that registers the whole pipeline.
- The hosts, meaning the command line tool and the Worker, just call `AddInfrastructure` and `AddIngestion` and then ask for the runner.

That split is why the model can be swapped, mocked, or pointed at a different provider without touching the workflow.

## The safety rails

A model that can browse the web and a scheduler that can run it unattended is a recipe for a surprise bill. Saturdaze has five rails.

- Dry run. With `--dry-run`, the model is still called and the response is still parsed, but nothing is written: no catalog rows, no audit row. This is how you tune a prompt safely.
- A daily budget. `MaxRunsPerDayPerType` defaults to forty-eight. Once that many audit rows exist for a type on the current UTC day, the runner refuses to start another pass and records a failed run that says why.
- Bounded searches and tokens. `MaxSearches` defaults to five and `MaxTokens` to `4096`, so one request cannot wander for an hour.
- One retry, not many. On a rate limit or a server error, the client waits thirty seconds and tries exactly once more. Then it fails the pass and the runner records the error.
- Lazy failure. If the Foundry resource name or the key is missing, nothing breaks at startup. The first search throws a clear `ClaudeApiException`, so commands like `saturdaze migrate` keep working on a machine with no AI configuration at all.

For scale, one real events pass used about `129K` input tokens because web search results count as input. That number is why the budget and the search cap exist.

## Things to remember

- AI in Saturdaze means catalog ingestion, and only that. The planner is deterministic.
- The flow is trigger, runner, prompts, Claude with web search, parser, upserter, audit row.
- Claude is reached through Microsoft Foundry by default, with Anthropic one setting away.
- The contract lives in Application, the provider in Infrastructure, so the model is swappable.
- Dry run, a daily budget, search and token caps, one retry and lazy failure keep the bill boring.

In the next video we open `IngestionPrompts` and change what the model is asked to do, then prove the change with a dry run and a unit test.
