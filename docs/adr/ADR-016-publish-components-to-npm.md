# ADR-016 — Publish the components library to npm on every library change

**Status:** Accepted
**Date:** 2026-10-07
**Related:** [ADR-012](ADR-012-storybook-design-system.md), [ADR-013](ADR-013-fluent-design-tokens.md).

## Context

The `components` library (`frontend/projects/components`) was consumed only inside the workspace, through the `components` tsconfig path alias. We want it available outside the repository as an npm package, released automatically. Every push to `main` that changes the library should produce a new version, with no manual release step.

Four constraints shaped the design:

- The bare npm name `components` is taken.
- `main` is protected by required status checks, so a workflow cannot push a version-bump commit back to it without a bypass token.
- Commit messages are mixed. Some are conventional (`feat(admin): …`) and many are plain sentences.
- The SCSS foundations (`styles/index.scss`: tokens, breakpoints, base page styles) were not part of the build output, and the library's peer dependencies listed only `@angular/common` and `@angular/core`, although the source also imports `@angular/cdk`, `@angular/forms`, `@angular/router` and `@angular/platform-browser`.

## Decision

1. **Name.** The package is `@saturdaze/components`, public, under the `saturdaze` npm org. Inside the workspace it stays `components` (the tsconfig alias), so no source imports change.
2. **Package contents.** `ng-package.json` copies `src/lib/styles/*.scss` to `styles/`, and `package.json` exports them as `@saturdaze/components/styles` (the `sass` condition). The peer dependencies list every Angular package the source imports.
3. **Versions are computed, never committed.** The source `package.json` stays at `0.0.0`. `frontend/scripts/next-components-version.mjs` picks the base version, the highest of:
   - the last `components-v*` git tag
   - the version on npm
   - the source version

   It reads the non-merge commits since that tag that touch the packaged paths (`src/`, `package.json`, `ng-package.json`, `README.md`). The bump follows conventional commits:
   - `type!:` or a `BREAKING CHANGE:` footer → major
   - `feat:` → minor
   - anything else → patch

   With no such commits there is no release. A package that is not on npm yet starts at `0.1.0`.
4. **Workflow.** `.github/workflows/publish-components.yml` runs on pushes to `main` that touch the packaged paths, and on manual dispatch. Runs are serialized in one concurrency group. Each run:
   - works out the version
   - checks the tokens, then builds and unit-tests the library
   - stamps the version into `dist/components/package.json`
   - publishes, then pushes the `components-v<version>` tag

   Story and Storybook changes do not release.
5. **Trusted publishing.** The workflow publishes through npm trusted publishing (GitHub OIDC, `id-token: write`) with provenance, so no npm token is stored in the repository. This needs npm ≥ 11.5.1, so the workflow upgrades npm after `npm ci` and before publishing.

## Consequences

- Library changes reach npm minutes after merging, with a provenance attestation that links each version to its commit and workflow run.
- Commit messages now carry release meaning. Plain-sentence commits release as patches, so a new feature or a breaking change needs a `feat:` or `!` message to bump correctly. A merge commit's own subject is ignored, but a squash merge's subject (the PR title) counts.
- Because the base is the highest of tag, npm and source, a run whose publish succeeded but whose tag push failed still moves forward instead of colliding. Its next run may publish already-released commits again under a new patch version.
- Trusted publishing can only be configured on a package that already exists. The first release (`0.1.0`) is published by hand, and then `publish-components.yml` is registered as the package's trusted publisher on npmjs.com, with token publishing disallowed.
- Consumers style the CDK dialog panel classes (`sd-dialog-panel`, `sd-dialog-backdrop`) themselves; those rules still live in the Saturdaze app's `styles.scss`.
