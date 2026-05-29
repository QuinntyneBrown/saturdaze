# Detailed Designs — Index

Living catalogue of detailed software design documents for Saturdaze. Each entry is a single feature, scoped tightly, with C4 / class / sequence diagrams rendered to PNG inline. Designs are radically simple by mandate — see each document's introduction.

| #   | Feature                                                | Status | Description                                                                                                                                       |
| --- | ------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | [Schedule Ingestion](01-schedule-ingestion/README.md) | Implemented | How fresh `LocalEvent` / `Activity` / `Restaurant` rows enter the catalogs. Replaces hand-curated JSON seeds with AI-driven deep research (Claude + `web_search`), run by the `saturdaze ingest` CLI and the `Saturdaze.Worker` cron service. |
| 02  | [Daily Rhythm](02-daily-rhythm/README.md)             | Draft  | Make the Profile page's Daily Rhythm section real: per-family out-the-door / back-home anchors and per-member nap windows that the planner reserves as locked blocks. |
