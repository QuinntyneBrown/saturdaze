# 47 · Coding sdThemeProvider: a directive that re themes a subtree

> **Runtime:** ~6.7 min · **Audience:** developers who know basic Angular and want to build components in this library · **Prerequisites:** [Consuming tokens](../../05-consuming-tokens/README.md)

**Video:** [theme-provider.mp4](theme-provider.mp4) · [Slides](slides.html) · **Audio:** [theme-provider.mp3](theme-provider.mp3) · [Transcript](script.md)

## Why this video exists

`[sdThemeProvider]` is the library's only pure directive with no view: it writes a partial theme onto its host as CSS custom properties, Fluent `FluentProvider` style. It is the cleanest example in the codebase of a justified `effect()`, a required aliased signal input, and dependencies from `inject()`.

## Learning objectives

By the end, the viewer can:

- Write a standalone attribute directive (`selector: '[sdThemeProvider]'`).
- Use `input.required<PartialTheme>({ alias: 'sdThemeProvider' })` and explain both options.
- Inject `ElementRef` and `Renderer2` with `inject()`.
- Explain the effect that sets new and removes stale custom properties with `RendererStyleFlags2.DashCase`.
- Explain why a host style binding can't do this (dynamic property names).
- Test a directive through a host component and a signal, awaiting `whenStable()`.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why is `applied` not a signal? | Nothing reads it reactively; it is bookkeeping for the next run. |
| Why `DashCase`? | Custom property names must be written literally. |
| Why no app usage? | The root already has the theme from `_tokens.scss`; the directive is for sections that must differ. |
| What does the second test prove? | Keys missing from a new theme are removed. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/components/src/lib/theme-provider/theme-provider.ts` | Decorator, `inject()`, input, effect. |
| `frontend/projects/components/src/lib/tokens/themeToCss.ts` | `themeToCssVariables`. |
| `frontend/projects/components/src/lib/tokens/types.ts` | `PartialTheme`. |
| `frontend/projects/components/stories/src/ThemeProvider/ThemeProviderDefault.stories.ts` | Partial override on one card. |
| `frontend/projects/components/src/lib/theme-provider/theme-provider.spec.ts` | Host component and both tests. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:50 | Introduction | A directive, not a component; where it is used. |
| 00:51-01:23 | Decorator | Attribute selector; intended use. |
| 01:24-02:02 | inject() | Host, renderer, `applied`. |
| 02:03-02:42 | Input | `input.required` with `alias`. |
| 02:43-04:35 | Effect | The effect, the helper, the two loops, why this shape, the cascade. |
| 04:36-05:49 | Spec | Host component, `whenStable`, two tests. |
| 05:50-06:44 | Recap | Pitfalls, things to remember, preview of `sd-toggle`. |

## Demo commands

```sh
cd frontend
npx ng test components     # runs the components library specs, theme-provider.spec.ts included
npm run storybook          # open ThemeProvider → Default and Rebrand
```

## Pitfalls

- Wrapping the app root in `[sdThemeProvider]`.
- Overriding raw values that no component reads instead of roles.
- Asserting before the effect has flushed in tests.

## References

- [Angular: Attribute directives](https://angular.dev/guide/directives/attribute-directives)
- [Angular: Effects](https://angular.dev/guide/signals#effects)
- [Angular: Renderer2](https://angular.dev/api/core/Renderer2)
- `docs/adr/ADR-013-fluent-design-tokens.md`
