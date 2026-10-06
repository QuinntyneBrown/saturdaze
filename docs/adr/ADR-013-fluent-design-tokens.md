# ADR-013 — Design tokens follow the Fluent UI v9 token model

**Status:** Accepted
**Date:** 2026-10-06
**Related:** [ADR-009](ADR-009-v2-responsive-shell.md), [ADR-010](ADR-010-visual-parity-policy.md), [ADR-012](ADR-012-storybook-design-system.md). Amends ADR-012 §4.

## Context

`_tokens.scss` was a hand-written list of `--sd-*` custom properties named by **value family** (`--sd-primary`, `--sd-ink-soft`, `--sd-fs-sm`). One name served every role: `--sd-primary` was the coral button fill, coral text, a coral border and the focus ring. Nothing could be themed per role, TypeScript (stories, the Storybook manager theme) had to copy hex values by hand, and the Storybook Theme pages regex-parsed the SCSS to document it.

The Storybook docsite already follows Fluent UI v9's layout (ADR-012); its token package, [`@fluentui/tokens`](https://github.com/QuinntyneBrown/fluentui/tree/master/packages/tokens), solves exactly these problems.

## Decision

Model the tokens on `@fluentui/tokens`, in `frontend/projects/components/src/lib/tokens/`:

1. **Three layers.** `global/` holds raw values — a 16-step coral `brandSaturdaze` ramp, named palettes (`slate`, `cream`, `sun`, `forest`, …) and the type, spacing, radius, stroke, motion, layout and z ramps. `alias/` computes semantic colours from them (`generateColorTokens(brand)`, palette and status tokens). `utils/createLightTheme(brand)` assembles one flat, typed `Theme`; `themes/` exports `saturdazeLightTheme` plus the responsive retunes.
2. **Fluent names and roles.** Theme keys *are* the custom property names, unprefixed camelCase as in Fluent: `--colorNeutralForeground1`, `--colorBrandBackground`, `--colorBrandStroke1`, `--spacingHorizontalM`, `--borderRadiusMedium`, `--shadow16`, `--durationFast`, `--curveEasyEase`. Components pick tokens by role, so a value shared by several roles is still several tokens. Saturdaze-only concepts get Fluent-shaped names: `colorPalette{Sun,Sky,Leaf,Indoor}*` with Fluent's palette roles, `colorStatusSuccess*` (forest) and `colorStatusDanger*` (terracotta), unitless `lineHeight{Tight,Snug,Normal}`, `layout*` and `zIndex*`.
3. **Generated stylesheet.** `npm run tokens` renders the theme into `styles/_tokens.scss` (`:root` + `@media` retunes) and the typed `tokens` object (`tokens.colorBrandBackground === 'var(--colorBrandBackground)'`). Both are marked *do not edit*; CI runs `npm run tokens:check`. This is the build-time half of what Fluent's `FluentProvider` does at runtime, so first paint never waits on script.
4. **Runtime theming.** `[sdThemeProvider]` writes a `PartialTheme` (or a full `createLightTheme(brand)`) onto its host as custom properties, re-theming a subtree like `FluentProvider`.
5. **Single vocabulary.** Every `--sd-*` theme token in `frontend/projects` was migrated, by CSS property, to its role token (e.g. `color: var(--sd-primary)` → `--colorBrandForeground1`, `background:` → `--colorBrandBackground`, `border-color:` → `--colorBrandStroke1`; `outline: var(--sd-focus-ring)` → `var(--strokeWidthThick) solid var(--colorStrokeFocus2)`). Component-scoped knobs that are part of a component's API (`--sd-btn-h`, `--sd-btn-w`, `--sd-list-pad-x`, `--sd-chrome-bottom` from ADR-005) keep their `--sd-` prefix. `docs/mocks` keeps its own `tokens.css`; it is the static design reference, not a consumer.
6. **Docs from the theme.** The Storybook Theme pages and the manager theme import `saturdazeLightTheme` instead of parsing SCSS or copying hex values; `Theme/Overview` documents the layers.

## Consequences

- Values are unchanged: every migrated token resolves to the value it had, and all Storybook stories render pixel-identically to the pre-migration build. ADR-010 baselines need no update.
- Adding a colour means adding an alias token to the theme and regenerating; editing `_tokens.scss` by hand fails CI.
- A re-brand or a scoped theme is a new ramp passed to `createLightTheme`, not a stylesheet fork. A dark theme would be a `createDarkTheme(brand)` alongside it.
- Token names are longer than the `--sd-*` shorthands, and they differ from `docs/mocks` — the mocks' class names, not their custom properties, are the parity contract (ADR-009).
