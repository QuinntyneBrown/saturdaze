# Storybook docsite

**Traces to:** L1-019 → L1-026, L2-051 → L2-058 · **Decision:** [ADR-012](../../../adr/ADR-012-storybook-design-system.md), [ADR-013](../../../adr/ADR-013-fluent-design-tokens.md)

The design system is the Storybook docsite for the Angular `components` library. It replaces the standalone `design-system/` catalog, whose detailed designs were removed with it.

## Structure

```text
frontend/projects/components/
├── .storybook/
│   ├── main.ts              # stories glob (*.mdx, index.stories.ts), addons (docs, a11y), .md asset rule
│   ├── preview.ts           # compodoc JSON, router decorator, viewports, backgrounds, a11y errors, story sort
│   ├── manager.ts           # applies theme.ts; addon panel closed by default
│   ├── theme.ts             # Saturdaze-branded manager theme from the TypeScript token theme
│   ├── manager-head.html    # favicon, meta tags, sidebar polish
│   ├── storybook.scss       # global styles = the app's styles entry + CDK overlay CSS + overlay panel classes
│   ├── typings.d.ts         # *.md module declaration
│   └── public/              # saturdaze-wordmark.svg and saturdaze-logo.svg (favicon)
└── stories/src/
    ├── Concepts/            # Introduction + Developer/{QuickStart,StylingComponents,Accessibility,WritingStories}.mdx
    ├── Theme/               # Overview, Colors, Typography, Spacing, BorderRadii, Shadows, Motion, Layout (.mdx)
    │   └── components/      # tokens.js reads saturdazeLightTheme + responsiveOverrides from src/lib/tokens; TokenBlocks.js renders specimens
    ├── <Component>/         # index.stories.ts + <Component><Story>.stories.ts + Description/BestPractices.md
    └── Patterns/<Pattern>/  # whole-screen compositions of real components
```

## Build and runtime

1. `ng run components:build-storybook` runs compodoc over the library (`documentation.json`, git-ignored) and feeds it to `setCompodocJson` for the args tables.
2. Webpack compiles stories with the library's SCSS include path (`projects/components/src/lib`); `.md` imports load as strings through the `asset/source` rule.
3. Every story renders zoneless inside `applicationConfig({ providers: [provideRouter([{ path: '**', children: [] }], withHashLocation())] })` so in-app `href`s never rewrite `iframe.html`.
4. CI (`ci.yml` → `storybook`) builds on every PR, then runs `npm run test:storybook` in `e2e/` against the build. `deploy-storybook.yml` runs on `workflow_dispatch` and on pushes to `main` that touch the library or its build inputs, and uploads `frontend/dist/storybook` to the design-system Static Web App.
