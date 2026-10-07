# ADR-014 — Admin tooling is a separate Angular application sharing the workspace libraries

**Status:** Accepted
**Date:** 2026-10-06
**Related:** [ADR-008](ADR-008-per-user-family-scoping-and-auth-fallback.md), [ADR-009](ADR-009-v2-responsive-shell.md), [ADR-012](ADR-012-storybook-design-system.md), [ADR-013](ADR-013-fluent-design-tokens.md), [ADR-015](ADR-015-public-curated-photo-storage.md). PRD: `docs/prd/admin-photo-management.md`.

## Context

The family app is meant to stay "radically simple": five screens, one primary action each (`docs/mocks/README.md`). The only administrative surface today is `/review-submissions`, which shares the family shell, bottom nav and bundle. Catalog photo management (L1-036) needs seven screens and six dialogs, a desktop-first layout with a side navigation, and a different audience: a curator working a few hours a week on a laptop. Putting that inside `projects/saturdaze` would grow the family bundle, mix two shells in one route table, and expose admin code to every family.

The workspace already separates the `components` and `api` libraries from the app, and the composition-root pattern (tokens bound in `app.config.ts`) means a second host can bind the same services.

## Decision

1. **A second application project**, `frontend/projects/admin`, generated with `prefix: sd`, standalone components, the same builder, budgets, lint and format configuration as `saturdaze`, and its own `public/staticwebapp.config.json`.
2. **Shared libraries, no copied code.** The admin app imports `components` and `api` through the existing path mappings. UI it needs that the family app does not have (`sd-admin-nav`, `sd-admin-gate`, `sd-stat-card`, `sd-photo-tile`, `sd-slot-preview`) is built in `components` with a Storybook story folder (ADR-012) so both apps can use it. Admin pages depend on `ADMIN_PLACES_SERVICE`, `ADMIN_PHOTOS_SERVICE` and `ADMIN_AUDIT_SERVICE` tokens bound in the admin composition root.
3. **Auth plumbing moves into `api`.** `authInterceptor`, `requireAuth`, `requireAnonymous` and `requireAdmin` leave `projects/saturdaze/src/app/auth/` for `projects/api/src/lib/auth/`, parameterised by an `AUTH_ROUTES` token (`signIn`, `home`). The family app's imports change; its behaviour and e2e specs do not.
4. **One identity, one API.** Administrators sign in with their Saturdaze account; every `/api/admin/*` endpoint carries `[Authorize(Policy = "Admin")]` on top of the global fallback (ADR-008). The client-side gate is a screen state, not a security boundary.
5. **Own host.** `deploy.yml` uploads `dist/admin/browser` to a separate Azure Static Web App with its own deployment token, after migrations, like the family app; the admin origin is added to `Cors:AllowedOrigins`. A separate host keeps admin code out of the family bundle and lets the admin origin be restricted later (SWA access restrictions) without touching the family app.
6. **Same tokens, different chrome.** The admin app loads the same foundation stylesheet and generated `_tokens.scss` (ADR-013). Its shell is a side navigation from 1024 px and a top bar below; the family app's bottom-nav chrome handling (ADR-005) does not apply. Admin mocks live beside the family mocks under `docs/mocks/pages/admin.*.html` as bare-shell pages.
7. **Same tests.** `e2e/` gains an `admin` Playwright project (Chromium only) with one page object per screen and dialog; API coverage lives in `Saturdaze.Api.Tests/Admin/`.

## Consequences

- CI lints, format-checks and builds two applications; `npm run build-storybook` covers the new components.
- `projects/saturdaze` keeps `/review-submissions` for now (PRD Q5); moving it is a later decision.
- A second deployment token (`SWA_ADMIN_DEPLOYMENT_TOKEN`) and a second Static Web App resource are needed before the admin job can deploy. Until they exist the job is skipped with a visible summary, like the API preflight.
- The two apps share one `SessionStore` implementation, so a session change (ADR-007) lands in both at once.
