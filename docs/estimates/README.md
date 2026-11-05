# Estimates

- Overall effort: 243 days
- Complete: 94%

| Subsystem | Effort | Complete |
|---|---|---|
| [weekend-planning](weekend-planning.md) | 60 days | 93% |
| [identity-and-access](identity-and-access.md) | 48 days | 96% |
| [family-profile](family-profile.md) | 22 days | 100% |
| [weather](weather.md) | 3 days | 80% |
| [discovery](discovery.md) | 47 days | 96% |
| [administration](administration.md) | 32 days | 95% |
| [operations](operations.md) | 13 days | 68% |
| [web-experience](web-experience.md) | 11 days | 84% |
| [design-system](design-system.md) | 7 days | 100% |

## Roadmap

1. weekend-planning: agent-drafted weekends against the Foundry deployment (role grant, first ASSERT before-and-after run, then AGENT_PLANNING_ENABLED), and the visual baselines on the Windows reference machine for calendar sync and for the owner's own row (Who's in, create-account, the D17 This is me specimens)
2. weekend-planning: couples dates — render the plan-a-couples-date diagrams (PlantUML was not available where it was built), visual baselines for the date block and date screen, and agent-drafted dates (deferred, ADR-025)
3. weather and weekend-planning: production config warning, no-slot errand feedback, cover and map polish
4. discovery: image srcset and place-imagery edge cases, add-idea-to-day edge cases
5. administration and operations: CLI migrate and ingest tests, admin CORS, worker host tests, p95 performance budgets
6. identity-and-access and web-experience: public-route and Swagger hardening review, full accessibility sweep
