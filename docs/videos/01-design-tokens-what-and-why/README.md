# 01 · Design tokens: what they are and why

> **Runtime:** ~7.9 min · **Audience:** frontend developers new to design tokens · **Prerequisites:** basic CSS (custom properties) and TypeScript

**Video:** [01-design-tokens-what-and-why.mp4](01-design-tokens-what-and-why.mp4) · [Slides](slides.html) · **Audio:** [01-design-tokens-what-and-why.mp3](01-design-tokens-what-and-why.mp3) · [Transcript](script.md)

## Why this video exists

The Saturdaze token system (ADR-013) only makes sense once you have the mental model: tokens are named decisions, named by role, organised in layers, generated from TypeScript. This video builds that model before the rest of the series opens any code.

## Learning objectives

By the end, the viewer can:

- Define a design token as a name, a value and a role.
- Explain why `--sd-primary` doing four jobs made re-theming impossible.
- Read a Fluent UI v9 token name (category, concept, role, rank/state).
- Name the three layers (global, alias, theme) and what each may read.
- Trace a value from `tokens/*.ts` through `generate-tokens.mjs` to `_tokens.scss` and a component.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| What is a design token? | A named design decision: name (for code), value (for the browser), role (for people). |
| What problem does a token system solve? | One value per role, one source of truth, no copied hex values in TS or docs. |
| Why layers? | Globals hold raw values, aliases hold role decisions, the theme is one flat typed object; components only read aliases/ramps. |
| How does a value reach a pixel? | TS theme → `npm run tokens` → `:root` custom properties → `var(--role)` in components; `tokens:check` in CI. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `docs/adr/ADR-013-fluent-design-tokens.md` | Context: `--sd-*` names by value family; the four jobs of `--sd-primary`. |
| `frontend/projects/components/src/lib/styles/_tokens.scss` | The "DO NOT EDIT" banner and a `:root` declaration. |
| `frontend/projects/components/src/lib/tokens/` | Folder layout: `global/`, `alias/`, `themes/`, `utils/`, `types.ts`. |
| `frontend/scripts/generate-tokens.mjs` | Named only; covered in video 04. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:21 | Introduction | Series goal; this video is concepts only. |
| 00:22-00:35 | Questions | The four questions. |
| 00:36-01:57 | The problem | `--sd-primary` doing four jobs; three copies of the truth. |
| 01:58-02:59 | What a token is | Name, value, role; components never mention values; custom properties. |
| 03:00-03:58 | Naming | Fluent role + rank names; same value, separate decisions; the pattern. |
| 03:59-05:05 | Three layers | Global, alias, theme (progressive build); the golden rule. |
| 05:06-06:16 | Pipeline | TS → generator → `_tokens.scss` + `tokens.ts` → components; CI check; runtime provider. |
| 06:16-06:47 | In this repo | Exact paths and commands. |
| 06:48-07:15 | Series | Road map of videos 02-06. |
| 07:16-07:51 | Recap | Things to remember; preview of video 02. |

## Demo commands

```sh
cd frontend
npm run tokens          # regenerate _tokens.scss and tokens.ts
npm run tokens:check    # fail if either generated file is stale (CI)
```

## Pitfalls

- Naming a token after its value (`coral`, `primary`) instead of its job.
- Reading a global palette value from a component.
- Editing `_tokens.scss` or `tokens.ts` by hand — CI rejects it.

## References

- [Fluent UI design tokens](https://fluent2.microsoft.design/design-tokens)
- [MDN: Using CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- `docs/adr/ADR-013-fluent-design-tokens.md`
