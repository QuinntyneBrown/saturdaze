# 04 · The generator: generate-tokens.mjs

> **Runtime:** ~9.6 min · **Audience:** frontend developers maintaining or building a token pipeline · **Prerequisites:** [Video 03](../03-alias-tokens-and-the-theme/README.md); Node ES modules

**Video:** [04-the-token-generator.mp4](04-the-token-generator.mp4) · [Slides](slides.html) · **Audio:** [04-the-token-generator.mp3](04-the-token-generator.mp3) · [Transcript](script.md)

## Why this video exists

`frontend/scripts/generate-tokens.mjs` is the bridge between the TypeScript theme and the CSS every component reads, and the reason CI can reject stale or hand-edited token files. This video reads it top to bottom, together with `themeToCss.ts`.

## Learning objectives

By the end, the viewer can:

- Explain why the baseline theme is a generated static stylesheet rather than runtime JavaScript.
- Explain how Node imports the TypeScript sources (native type stripping + a `registerHooks` resolve hook).
- Read `themeToCssVariables`, `block` and `themeToCss`, and the spec that pins their output.
- Explain how the SCSS and `tokens.ts` strings are built, and why both are formatted with Prettier.
- Explain write mode vs `--check` mode and the CI step "Design tokens up to date".
- Change a token end to end.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why generate instead of setting properties at runtime? | First paint has every token; single source of truth; typed `tokens` object for free. |
| How does Node load the `.ts` theme? | Type stripping (default from Node 22.18); the hook appends `.ts` to extensionless relative imports. |
| Why Prettier inside the generator? | CI runs `prettier --check`; formatting the output makes it stable and avoids a fight. |
| What does `--check` do? | Writes nothing, prints stale files, exits 1. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/package.json` | `tokens` and `tokens:check` scripts. |
| `frontend/scripts/generate-tokens.mjs` | Header, resolve hook, loading, banner, SCSS/TS strings, outputs, Prettier, write/check loop. |
| `frontend/projects/components/src/lib/tokens/themeToCss.ts` | `themeToCssVariables`, `block`, `themeToCss`. |
| `frontend/projects/components/src/lib/tokens/tokens.spec.ts` | "serialises a theme to custom properties and media blocks". |
| `.github/workflows/ci.yml` | Format, lint, "Design tokens up to date". |
| `frontend/projects/components/src/lib/styles/index.scss`, `frontend/projects/saturdaze/src/styles.scss`, `frontend/angular.json` | How the partial reaches the page. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:28 | Introduction | What the script is for. |
| 00:28-01:19 | Why generate | Performance, one source, typed object. |
| 01:20-01:45 | Running it | The two npm scripts. |
| 01:46-02:16 | Header comment | What it writes; the type-stripping note. |
| 02:17-03:17 | TS in Node | Type stripping; the resolve hook. |
| 03:17-03:53 | Loading | `lib`, `load`, top-level await. |
| 03:53-05:15 | Serialiser | `themeToCssVariables`, `block`, `themeToCss`, pinned test. |
| 05:15-06:21 | Building files | Banner, SCSS string, `tokens.ts` string, outputs. |
| 06:22-06:51 | Prettier | Stable output. |
| 06:52-07:33 | Write/check | The loop and `process.exit(1)`. |
| 07:34-07:58 | CI | The workflow step. |
| 07:59-08:31 | Wiring | `index.scss`, `styles.scss`, include paths. |
| 08:32-08:51 | Workflow | Changing a token. |
| 08:52-09:33 | Recap | Things to remember; preview of video 05. |

## Demo commands

```sh
cd frontend
npm run tokens
npm run tokens:check && echo up to date
git diff projects/components/src/lib/styles/_tokens.scss projects/components/src/lib/tokens/tokens.ts
```

## Pitfalls

- Hand-editing `_tokens.scss` or `tokens.ts` (CI fails with "is out of date — run `npm run tokens`").
- Running the script on a Node without type stripping (it needs Node 22.18+ or 23.6+).
- Writing generated output without Prettier, so `format:check` and the generator disagree.

## References

- [Node.js: Running TypeScript natively](https://nodejs.org/en/learn/typescript/run-natively)
- [Node.js: `module.registerHooks()`](https://nodejs.org/api/module.html#moduleregisterhooksoptions)
- [Prettier API](https://prettier.io/docs/api)
