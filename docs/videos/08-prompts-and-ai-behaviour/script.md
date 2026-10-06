# 08 · Prompts and AI behaviour, end to end

In the first video you saw where AI lives in Saturdaze: catalog ingestion asks Claude to research the web and return rows as JSON. This video is about steering that behaviour. You will see exactly what text the model receives, how that text is built from code and configuration, which parts you may change freely, and which parts are a contract with the parser and the database. Then we change the model's behaviour for real, the way this repository expects: test first, then the prompt, then a dry run.

## What you will be able to do

By the end of this video you should be able to do four things.

- Read `IngestionPrompts` and explain every sentence the model is sent.
- Change what the model is asked to find, and prove the change with a unit test and a dry run.
- Change the home location, drive radius, model, search budget and token ceiling without touching code.
- Recognise the schema as a contract and know the three places that must move together when it changes.

## Three layers of behaviour

It helps to think of AI behaviour in Saturdaze as three layers, from most to least editable.

The first layer is the prompt wording in `IngestionPrompts`, in the Application project's Ingestion folder. That is content. Changing it is a one file change you can review in isolation, and the class comment says exactly that.

The second layer is the context the prompt is filled with: the home location name and the drive radius come from configuration, and the weekend date comes from the clock. You change those in `appsettings.json` or with environment variables. No code.

The third layer is the model knobs in `ClaudeWebSearchOptions`: which deployment to call, how many web searches it may run, how many output tokens it may write, and how patiently to retry. Also configuration.

And there is one thing that looks like a prompt but is not: the JSON schema at the end of each system prompt. That schema is a contract. The parser validates against it and the upserter maps it onto database columns. We will come back to that.

## Anatomy of the system prompt

Open `IngestionPrompts`. The method `BuildSystemPrompt` takes an `IngestionType` and an `IngestionContext` and returns one string with four parts.

Part one is the preamble, shared by all three catalog types. It tells the model it is a meticulous local events researcher curating a weekend catalog for a family living at the home location. It restricts results to roughly the configured drive time. It says to strongly prefer family and kid friendly options. It names the `web_search` tool and says to find real, currently listed results from venue, tourism board, municipal and farm websites. And it ends with the two most important sentences in the whole system: verify each row against a real page before including it, and never invent a venue, date, or URL.

Part two is type specific. For events, it asks for time bounded things happening on or near this weekend and the following weekend, both dates spelled out, and it excludes adults only events and ticketed concerts over fifty dollars per adult. For activities, it asks for mostly evergreen places, explains the indoor flag, and lists the six allowed weather tags. For restaurants, it defines the two meal slots, defines the `wifeApproved` flag as relaxed, quality, not too loud places a discerning adult would return to, and asks for a short note.

Part three is the output instruction. Return only a single JSON array as the final message. No prose, no markdown fences, no commentary. It also defines three fields every catalog type shares: latitude and longitude as decimal degrees of the venue, and address as its street address. And it ends with the rule to omit any row you cannot fully populate and verify.

Part four is the schema itself, written as a one line JSON example with the type of every field.

The user prompt, from `BuildUserPrompt`, is deliberately tiny: one sentence naming the catalog type, the location, and for events the weekend date, ending with return the JSON array only. All the weight is in the system prompt, which is where Claude expects standing instructions.

## The schema is a contract

Here is why the schema is not just wording. After Claude answers, `IngestionResultParser` scans the text for a JSON array and validates each object. For an event it requires `name`, `startsOn` and `location`, and defaults `endsOn` to the start date. For an activity it requires only `name`. For a restaurant it requires `name` and a `slot` that parses as Lunch or Dinner. A row missing a required field is rejected and counted, and the rest of the batch still goes through.

Then `CatalogUpserter` copies the remaining fields onto the entity, truncating descriptive fields to their column lengths: names to two hundred characters for events and one hundred sixty for the others, categories to eighty, URLs to five hundred, activity descriptions to two thousand, restaurant notes to five hundred.

The location fields show how a field is added properly. The payload reader builds a location only when both coordinates are present and within range, trims the address to three hundred characters, and the upserter merges the result onto the entity. The prompt, the reader and the entity all changed together.

So if you want the model to return a new field, say a ticket price, that is the same three place change: the schema line in the prompt, a reader in the parser or upserter, and a property on the entity with a migration. If you only change the prompt, the new field arrives in the JSON and is silently ignored. If you rename a required field in the prompt without changing the parser, every row is rejected and the audit row says partial success or zero items. Keep the three in lock step.

## Changing behaviour the repository way

Let's make a real change. Suppose the family keeps getting chain restaurants and wants independents. This repository requires acceptance test driven development for behaviour changes, so we start with the test, not the prompt.

Open `IngestionPromptsAndTypesTests` in the Application test project. There is already a test called restaurant prompt names the meal slots. Add a new fact next to it: build the restaurant system prompt with the shared test context and assert that it contains the word chain. Run the Application tests. The new test fails, because the current prompt never mentions chains. That failure is the proof you were testing the right thing.

Now open `IngestionPrompts` and, in the restaurants branch, add one sentence after the notes instruction: prefer independent restaurants and exclude chains with more than twenty locations. Run the tests again. Green.

Next, a dry run. Load the Foundry key into your shell and run `saturdaze ingest --type restaurants --dry-run`. The runner still calls Claude and still parses the answer, but writes nothing. Read the log line: it tells you how many rows were parsed as valid, how many were considered and how many were rejected. If chains still appear, sharpen the wording and run again. Each dry run costs tokens, so make the wording precise rather than iterating ten times.

When you are happy, run without the flag. Rows are upserted on their natural key, so the next scheduled pass simply refreshes them.

One caution. The commit message and the pull request should say what behaviour changed and why, because prompt wording is invisible in a diff review unless you call it out.

## Changing the context without code

The preamble is filled from two configuration values. `Saturdaze:HomeLocation:Name` is the place name the model sees, and it defaults to Port Credit, Mississauga, Ontario if the setting is blank. `Saturdaze:Ingestion:MaxDriveMinutes` is the drive radius, two hundred by default.

Both live in the command line tool's and the Worker's `appsettings.json`, and both can be overridden with environment variables using the double underscore convention. For example, setting `Saturdaze__Ingestion__MaxDriveMinutes` to ninety tightens the search to a ninety minute radius for that process only.

Remember that the radius is prompt guidance, not a geographic filter. The code never checks the coordinates of a returned venue. If you need a hard limit, that is a parser change, not a prompt change.

## Changing the model knobs

The third layer is the `Claude` section under `Saturdaze:Ingestion`.

- `Model` is the deployment name on Foundry, `claude-sonnet-5` by default. On Foundry the name must match a deployment that exists on your resource, so changing models means creating a deployment first. Video nine covers that. On Anthropic it is the model identifier.
- `MaxSearches` caps the web searches per request, five by default. More searches mean better verification and more input tokens.
- `MaxTokens` is the output ceiling, `4096` by default. The JSON array is small, so this is ample. Set it too low and the array gets cut off mid row.
- `MaxContinuationTurns` is how many times the client will continue a `pause_turn` answer, three by default.
- `RetryDelaySeconds` is the back off before the single retry, thirty seconds by default.

All of these bind from configuration, so an environment variable such as `Saturdaze__Ingestion__Claude__Model` changes the deployment without a rebuild.

## Reading the results

After any pass, dry or real, you have two sources of truth. The console log prints one line per type with status, counts, search count and tokens. And for real runs, the `IngestionRun` table keeps the same numbers permanently, plus the first error message when something failed.

Watch three numbers. Considered versus rejected tells you whether the model understood the schema. Web search count tells you whether it actually verified rows or answered from memory. Input tokens tell you what the pass cost.

## Pitfalls

- An empty or unparseable answer is a success with zero items, not a failure. If a pass succeeds with zero rows considered, suspect a truncated answer or a broken schema line, not a quiet week.
- The model sometimes wraps the array in prose or fences despite the instruction. The parser tolerates that, so do not spend tokens fighting it.
- Never add member names, ages or preferences to `IngestionContext`. The record is PII free by design, and the prompt tests pin the context it carries.
- Numbers that arrive as strings are tolerated by the payload reader, and dates are read as year, month, day first and then as anything .NET can parse as a date. A date it cannot read rejects the row.
- Changing the model name only on Foundry, or only in configuration, gives you a four oh four from the endpoint. Both sides must agree.

## Things to remember

- Behaviour has three layers: prompt wording in code, context from configuration, model knobs from configuration.
- The schema is a contract between the prompt, the parser and the upserter. Move all three together.
- Change wording test first, then run `--dry-run`, then run for real.
- Dry runs still cost tokens; precise wording beats many iterations.
- A zero item success is a warning sign.

Next, we leave the code and go to Azure: creating the Microsoft Foundry resource and the Claude deployment that this client talks to.
