# ADR-012 — Storybook replaces the standalone design-system catalog

**Status:** Accepted
**Date:** 2026-10-05
**Related:** [ADR-009](ADR-009-v2-responsive-shell.md), [ADR-010](ADR-010-visual-parity-policy.md). Supersedes L1-019 → L1-030 / L2-051 → L2-076 as originally written (see [L1](../specs/L1.md), [L2](../specs/L2.md)).

## Context

`design-system/` was a standalone Vite app: 29 hand-written native Custom Elements (`assets/components/sd-*.js`), its own `tokens.css`, a JSON manifest, a custom documentation shell (router, search, playground, dialog launcher, pattern iframes), a contract validator and a Playwright suite. By rule it had no dependency on the rest of the repository.

That rule made it a second implementation. The app ships the Angular `components` library (≈50 standalone `sd-*` components), not the catalog's Custom Elements, so the catalog documented components nobody used: its button had `secondary` where the real one has `quiet`/`ghost`/`text`, it had no `sd-day`, `sd-block`, `sd-past-card` or form controls, and `_tokens.scss` had to "mirror" `tokens.css` by hand. Every visual change landed twice or drifted.

## Decision

Document the real library with Storybook, laid out like the Fluent UI v9 docsite.

1. **Storybook is a builder target on the `components` project** (`angular.json` → `storybook` / `build-storybook`, `@storybook/angular` 10, zoneless, compodoc for the API tables). Run with `npm run storybook` / `npm run build-storybook` from `frontend/`; output goes to `frontend/dist/storybook`.
2. **Layout follows Fluent UI's docsite.** `.storybook/` holds `main.ts`, `preview.ts`, a branded `theme.ts` + `manager.ts` + `manager-head.html`, and static branding in `public/`. Content lives in `projects/components/stories/src/`:
   - `Concepts/` — Introduction and Developer guides (Quick Start, Styling Components, Accessibility, Writing Stories) as MDX;
   - `Theme/` — Colors, Typography, Spacing, Border Radii, Shadows, Motion, Layout, rendered from `_tokens.scss` itself (`?raw` import) and painted with the live `var(--sd-*)` properties;
   - `<Component>/` — `index.stories.ts` (meta + re-exports, the only file globbed), one `<Component><Story>.stories.ts` per example, and `<Component>Description.md` / `<Component>BestPractices.md` joined into the autodocs description;
   - `Patterns/` — whole-screen compositions (shell, weekend plan, ideas, auth, family, dialogs) replacing the old pattern and dialog catalogs.
3. **Stories render with the app's globals.** `.storybook/storybook.scss` `@use`s the same `styles` entry and CDK overlay CSS as `projects/saturdaze/src/styles.scss`; a router with hash location and a catch-all route is provided so in-app `href`s stay inside the preview iframe.
4. **`_tokens.scss` is the single token source.** The catalog's `tokens.css`, manifest, validator and Playwright suite are deleted with the folder.
5. **Gates and hosting.** `ci.yml` builds Storybook on every PR (a story that binds a removed input fails the build). `deploy-storybook.yml` builds and uploads `frontend/dist/storybook` to the same Static Web App and token (`SWA_DESIGN_SYSTEM_DEPLOYMENT_TOKEN`) the catalog used.

## Consequences

- One implementation: a component change is documented by the stories next to it; drift shows up as a failed Storybook build or an obviously wrong story.
- The catalog's "copy the folder anywhere" property is gone — the docsite depends on the Angular workspace by design.
- The bespoke catalog features map onto Storybook built-ins: playground → Controls, variant matrix → per-variant stories, viewport switcher → the viewport toolbar (xsmall/mobile/tablet/desktop, matching the Playwright projects), search → the sidebar search, accessibility checks → `@storybook/addon-a11y`.
- Visual parity is still judged against `docs/mocks-v2` by the e2e suite (ADR-010); Storybook is documentation, not the baseline.
