# 06 · Build your own production token system

> **Runtime:** ~9.6 min · **Audience:** developers setting up a design system for a new product · **Prerequisites:** videos [01](../01-design-tokens-what-and-why/README.md)-[05](../05-consuming-tokens/README.md)

**Video:** [06-build-your-own-token-system.mp4](06-build-your-own-token-system.mp4) · [Slides](slides.html) · **Audio:** [06-build-your-own-token-system.mp3](06-build-your-own-token-system.mp3) · [Transcript](script.md)

## Why this video exists

The series closes by turning the Saturdaze system into a repeatable recipe: ten steps from an empty folder to typed tokens, a generated stylesheet, a CI check and runtime theming, each mapped to the Saturdaze file to copy.

## Learning objectives

By the end, the viewer can:

- Choose token categories and borrow a naming model, and record the decision.
- Write `types.ts`, the global layer, the alias generators and `createLightTheme`.
- Write a serialiser with tests, and a generator script with write and check modes.
- Wire the stylesheet into the build and the check into CI.
- Migrate existing styles by CSS property, and add runtime theming and docs.
- Avoid the common pitfalls (value names, globals in components, hand edits, dark-theme copy-paste).

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Where do I start? | Decisions and an ADR, then `types.ts`. |
| How do I seed a brand ramp? | Anchor the few drawn colours at steps (e.g. 70/80/160) and interpolate. |
| How do I migrate old variables? | By CSS property (background → background token, color → foreground, border → stroke); values unchanged. |
| How would a dark theme work? | `createDarkTheme(brand)` picking different ramp steps; shadows from shadow-colour tokens. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `docs/adr/ADR-013-fluent-design-tokens.md` | Recording the naming decision. |
| `frontend/projects/components/src/lib/tokens/types.ts` | Template for step 2. |
| `tokens/global/brandColors.ts` | Template for the ramp. |
| `tokens/alias/lightColor.ts`, `lightColorPalette.ts` | Templates for step 4. |
| `tokens/utils/*`, `tokens/themes/*` | Templates for step 5. |
| `tokens/themeToCss.ts`, `tokens/tokens.spec.ts` | Templates for step 6. |
| `frontend/scripts/generate-tokens.mjs` | Template for step 7. |
| `.github/workflows/ci.yml` | Step 8. |
| `frontend/projects/components/src/lib/theme-provider/theme-provider.ts` | Step 10. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:31 | Introduction | The ten-step road map. |
| 00:32-01:13 | Step 1 | Scope, names, borrow a model, ADR. |
| 01:13-02:01 | Step 2 | `types.ts`. |
| 02:02-02:46 | Step 3 | Global layer and the brand ramp. |
| 02:47-03:24 | Step 4 | Alias generators, pairing. |
| 03:25-04:04 | Step 5 | Shadows, `createLightTheme`, themes. |
| 04:05-04:48 | Step 6 | Serialiser and five tests. |
| 04:49-06:10 | Step 7 | Generator script, npm scripts, first run. |
| 06:11-06:39 | Step 8 | Build wiring and CI. |
| 06:40-07:24 | Step 9 | Migration by CSS property; rules. |
| 07:24-08:03 | Step 10 | Provider and docs from the theme. |
| 08:03-08:55 | Pitfalls | Seven mistakes. |
| 08:56-09:37 | Recap | Things to remember; close. |

## Demo commands

```sh
# Start from the Saturdaze files
cp -r frontend/projects/components/src/lib/tokens  <your-lib>/tokens
cp frontend/scripts/generate-tokens.mjs            <your-app>/scripts/
# then edit paths and theme names, and run:
node scripts/generate-tokens.mjs
node scripts/generate-tokens.mjs --check
```

## Pitfalls

- Naming tokens by value.
- Letting components read global palettes.
- Hand-editing generated files.
- Skipping Prettier in the generator.
- `var()` in media queries.
- Wrapping the whole app in the runtime provider.
- Building a dark theme by copying the light one.

## References

- [Fluent UI design tokens](https://fluent2.microsoft.design/design-tokens)
- [Fluent UI tokens package (`@fluentui/tokens`)](https://github.com/microsoft/fluentui/tree/master/packages/tokens)
- [Node.js: Running TypeScript natively](https://nodejs.org/en/learn/typescript/run-natively)
