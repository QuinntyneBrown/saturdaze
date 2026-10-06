## Project overview

Saturdaze is a full-stack family weekend planner that combines household preferences, recurring commitments, local activities and events, errands, and weather into practical weekend itineraries. The .NET backend owns planning, persistence, and authentication; the Angular frontend provides the app, and Playwright covers behavior and visual parity with the design reference.

## Repository layout

- `backend/` — .NET solution
- `frontend/` — Angular workspace (`saturdaze`, `api`, and `components`)
- `e2e/` — Playwright suite
- `frontend/projects/components/.storybook` + `stories/` — the design system: a Storybook docsite for the `components` library, laid out like the Fluent UI v9 docsite (ADR-012)
- `docs/mocks/` — static design reference
- `docs/adr/` — architecture decisions; read relevant ADRs before changing the areas they cover

See `README.md` for setup and development commands.

## Backend architecture

Layer dependency direction (strict):

- `Saturdaze.Domain` — entities + enums, zero deps
- `Saturdaze.Application` — MediatR handlers, validators, planner, DTO contracts, `IAppDbContext`
- `Saturdaze.Infrastructure` — `AppDbContext`, EF migrations, SQL Server, Open-Meteo client, auth services, seeder
- `Saturdaze.Api` — controllers, `Program.cs`, DI composition, Swagger, middleware
- `Saturdaze.Cli` — database migration, seeding, and reset commands

Non-obvious rules:

- Business rules live in handlers/domain services, not controllers.
- The API does **not** apply EF migrations on startup. Run `saturdaze migrate` explicitly.
- Seed data is idempotent and safe to re-run.
- `POST /api/weekends/plan` is idempotent: re-posting returns the existing weekend rather than throwing or re-planning (ADR-003). The explicit reseat is `POST /api/weekends/{id}/regenerate`.
- Authentication uses local JWTs; see ADR-007 before changing the auth flow.
- Endpoints require authentication by default. Preserve intentional anonymous access and Swagger middleware ordering when changing API auth (ADR-008).
- Keep request logging outside the exception-handling middleware so handled response statuses are logged correctly.
- Family-owned data must remain scoped to the current user's family; cross-family resources should not be exposed.

### Tests

API tests run sequentially because of shared logger state (ADR-002). Follow the existing test-project patterns when adding coverage.

## Frontend architecture

Workspace has three projects under `frontend/projects/`:

### Conventions enforced across the codebase

- Prettier (`frontend/.prettierrc`) owns formatting and angular-eslint (`frontend/eslint.config.js`) owns lint; CI fails on either. Run `npm run lint` and `npm run format:check` in `frontend/`. The husky pre-commit hook fixes staged frontend files.

- Component selectors use `sd-*`; TypeScript class, file, and folder names omit the `Sd` prefix.
- Components should preserve the mock design's BEM classes and accessible state semantics (ADR-009); e2e locators depend on that parity.
- Keep component styles encapsulated and global styles limited to shared foundations and utilities.
- **Design tokens follow Fluent UI v9 (ADR-013).** The TypeScript theme in `frontend/projects/components/src/lib/tokens/` is the source; `styles/_tokens.scss` and `tokens/tokens.ts` are generated — run `npm run tokens` in `frontend/` after changing it (CI runs `tokens:check`). Read tokens by role (`var(--colorBrandForeground1)` for text, `--colorBrandBackground` for fills, `--colorBrandStroke1` for borders), never hex values; component-scoped knobs keep the `--sd-` prefix.
- **Declare each `ng-content` slot once.** A component that renders `<a>` or `<button>` by condition puts its slots in one `<ng-template>` and renders it with `ngTemplateOutlet` in both branches (`sd-button`, `sd-ghost-row`, `sd-list-item`); slots repeated per `@if` branch project into one branch only. On the consumer side, a `@if` wrapping several `[slot=…]` nodes loses the slot (NG8011) — one `@if` per node.
- API services have a contract and injection token; app pages depend on the token, not the concrete implementation.
- **No inline forms in pages**. Button-triggered editing always opens a CDK Dialog (`frontend/projects/saturdaze/src/app/dialogs/`) or navigates to a screen.
- Use Angular CDK Dialog/Overlay for modal behavior; don't hand-roll modals.
- Every component has a story folder `frontend/projects/components/stories/src/<Name>/`: `index.stories.ts` (meta + re-exports; the only file Storybook globs), one `<Name><Story>.stories.ts` per example (`Default` first), and `<Name>Description.md` + `<Name>BestPractices.md` (ADR-012). Run `npm run build-storybook` from `frontend/` after changing a component's API; CI builds it on every PR.

### Bottom-nav iOS chrome handling

Read ADR-005 before changing bottom navigation or its safe-area/chrome behavior, and run the corresponding regression test.

## E2E architecture (Playwright)

- Read ADR-010 before changing visual regression coverage or snapshot policy. Run the relevant Playwright tests for UI changes; update baselines only for intentional design changes.

## Incremental Implementation and ATDD - mandatory

Mocks and the design system are design artifacts. ATDD does not apply to their
development. Do not write tests for mocks or the design system.

Every production feature implementation MUST invoke and follow the
`incremental-implementation` skill (`.claude/skills/incremental-implementation`
and `.agents/skills/incremental-implementation`) before any code is written,
combined with acceptance test-driven development (ATDD). Plan small,
reviewable slices, then complete one slice at a time: write Given-When-Then
acceptance criteria, write the acceptance test, and run it to prove it fails for
the expected reason BEFORE writing production code. Implement only what satisfies
that slice, refactor with tests green, and run the relevant regression checks.
Do not move to the next slice until those checks pass. No bulk implementation,
no tests added afterward, and no weakening tests to manufacture a pass. Keep
criteria, tests, and implementation aligned until the entire feature is complete.

Back end: integration tests against the API. Front end: Playwright, using the
Page Object Model - one page object per screen, owning the selectors and the
interactions. Tests state intent; page objects know the DOM. Never put a
selector in a test.

Run frontend tests in Chromium only. Do not configure or run Firefox, WebKit,
or any other browser for frontend testing.

### Never write architecture tests

Never add a test that asserts the shape of the codebase rather than its behavior:
no structure, layout, or naming tests; no banned-API scans; no traceability tests
that parse the specifications. Those constraints belong to the compiler, the
formatter, and review. A test suite exists to prove behavior.