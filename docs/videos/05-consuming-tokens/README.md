# 05 · Consuming tokens: SCSS, TypeScript and the theme provider

> **Runtime:** ~7.8 min · **Audience:** anyone writing component styles in this repo · **Prerequisites:** [Video 03](../03-alias-tokens-and-the-theme/README.md); [Video 04](../04-the-token-generator/README.md) helps

**Video:** [05-consuming-tokens.mp4](05-consuming-tokens.mp4) · [Slides](slides.html) · **Audio:** [05-consuming-tokens.mp3](05-consuming-tokens.mp3) · [Transcript](script.md)

## Why this video exists

The token system only stays consistent if every consumer follows the same rules. This video shows real component stylesheets, the Storybook manager theme and the `[sdThemeProvider]` directive, and collects the consumer rules in one place.

## Learning objectives

By the end, the viewer can:

- Choose a token by role in a component stylesheet (button, disc).
- Use fill/ink pairs (`…Background1` + `…Foreground1`) for contrast by construction.
- Build composite values (focus ring) from smaller tokens.
- Tell a theme token from a `--sd-` component knob.
- Explain why breakpoints live in `_breakpoints.scss` and must match `responsive.ts`.
- Choose between `saturdazeLightTheme` (values) and `tokens` (live `var()` references) in TypeScript.
- Use `[sdThemeProvider]` with a partial theme or `createLightTheme(ramp)`.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| How do I pick a colour token? | Name the job (text, fill, border) and use the token for that role, never a hex value. |
| Why can't breakpoints be custom properties? | Media query conditions can't read `var()`; Sass variables + `respond-to()` instead. |
| When do I use the theme provider? | Only for a subtree that must look different; the root already has the theme. |
| What does the provider do on change? | Sets the new properties and removes ones the new theme no longer sets. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/components/src/lib/button/button.scss` | Primary/quiet variants, transitions, `--sd-btn-h`. |
| `frontend/projects/components/src/lib/disc/disc.scss` | Fill/ink pairs. |
| `frontend/projects/components/src/lib/toggle/toggle.scss` | Focus ring from two tokens. |
| `frontend/projects/components/src/lib/sitebar/sitebar.scss` | Layout tokens. |
| `frontend/projects/components/src/lib/styles/_breakpoints.scss` | Breakpoint variables and `respond-to()`. |
| `frontend/projects/components/.storybook/theme.ts` | Manager theme from `saturdazeLightTheme`. |
| `frontend/projects/components/src/lib/theme-provider/theme-provider.ts` | The effect that writes/removes properties. |
| `frontend/projects/components/stories/src/ThemeProvider/ThemeProviderRebrand.stories.ts` | Forest-green re-brand. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:25 | Introduction | The consumer side. |
| 00:26-01:21 | By role | Button variants, motion tokens, the role rule. |
| 01:22-02:00 | Pairs | Disc fill/ink pairs. |
| 02:01-02:24 | Composite values | Focus ring. |
| 02:25-02:59 | Knobs | `--sd-btn-h` vs theme tokens. |
| 03:00-04:00 | Layout | Site bar, breakpoints, the duplication to keep in sync. |
| 04:01-05:02 | TypeScript | Storybook manager theme; value vs reference. |
| 05:03-05:47 | Theme provider | The directive and the cascade. |
| 05:48-06:40 | Using it | Partial theme, re-brand story, notes. |
| 06:41-07:13 | Rules | Consumer rules. |
| 07:13-07:49 | Recap | Things to remember; preview of video 06. |

## Demo commands

```sh
cd frontend
npm run storybook                                   # open ThemeProvider → Rebrand
grep -rn "#[0-9a-fA-F]\{6\}" projects/components/src/lib --include=*.scss | grep -v _tokens.scss   # look for stray hex values
```

## Pitfalls

- Picking a token because its value matches today rather than its role.
- Using a fill without its paired ink.
- Adding a breakpoint to `_breakpoints.scss` but not `responsive.ts` (or the reverse).
- Wrapping the app root in `[sdThemeProvider]`.

## References

- [MDN: Using CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [Storybook: Theming](https://storybook.js.org/docs/configure/user-interface/theming)
- `docs/adr/ADR-013-fluent-design-tokens.md`
