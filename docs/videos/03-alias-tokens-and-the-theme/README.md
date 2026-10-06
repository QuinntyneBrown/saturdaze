# 03 · Alias tokens and the theme

> **Runtime:** ~8.4 min · **Audience:** frontend developers building or maintaining the design system · **Prerequisites:** [Video 02](../02-global-tokens/README.md); TypeScript template literal types are explained in the video

**Video:** [03-alias-tokens-and-the-theme.mp4](03-alias-tokens-and-the-theme.mp4) · [Slides](slides.html) · **Audio:** [03-alias-tokens-and-the-theme.mp3](03-alias-tokens-and-the-theme.mp3) · [Transcript](script.md)

## Why this video exists

Alias tokens are where design decisions live, and `createLightTheme(brand)` is what makes re-branding a one-argument change. This video explains both, plus shadows and responsive overrides.

## Learning objectives

By the end, the viewer can:

- Read `generateColorTokens(brand)` and say which ramp step each brand role uses.
- Explain the computed roles (`colorBrandBackgroundHover` via `color-mix`, the brand gradient).
- Explain the `roles()` helper and the Background1/Foreground1 pairing rule.
- Explain how template literal types check generated token names.
- Walk through `createLightTheme` and why the theme is flat and typed as `Theme`.
- Re-brand with a new ramp and read the responsive overrides.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why generate aliases from a function? | The brand ramp is an argument, so every brand role follows a new ramp. |
| How are generated names type-checked? | `Record<\`colorPalette${PaletteName}${PaletteRoles}\`, string>` — 24 known keys. |
| Why is the theme flat? | Each key maps 1:1 to a custom property name; no translation. |
| What does a responsive override do? | Retunes a few tokens inside a media query so components never branch. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/components/src/lib/tokens/alias/lightColor.ts` | Neutral roles, brand roles, computed roles, shadow colours. |
| `tokens/alias/lightColorPalette.ts` | `roles()`, the two tables, the pairing comment. |
| `tokens/types.ts` | `PaletteRoles`, `PaletteName`, `ColorPaletteTokens`. |
| `tokens/utils/shadows.ts` | `createShadowTokens`. |
| `tokens/utils/createLightTheme.ts` | The assembly (global spreads condensed on screen). |
| `tokens/themes/lightTheme.ts`, `tokens/themes/responsive.ts` | The one-line theme and the overrides. |
| `tokens/tokens.spec.ts` | "re-brands every brand role from a new ramp". |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:25 | Introduction | From raw values to roles. |
| 00:26-00:49 | Alias tokens | Role + picked value; computed by a function. |
| 00:50-01:51 | Colour roles | Neutral foregrounds, backgrounds; comment each role. |
| 01:52-02:49 | Brand roles | Steps 80/70/160; `color-mix` hover; gradient; shadow colours. |
| 02:50-03:53 | Palette and status | `roles()` helper, tables, pairing rule. |
| 03:54-04:32 | Types | Template literal types. |
| 04:32-05:04 | Shadows | Elevation from shadow colours. |
| 05:05-06:09 | Assembling | `createLightTheme`; flat and complete. |
| 06:10-06:52 | Re-brand | `saturdazeLightTheme`; spec and story re-brands. |
| 06:53-07:41 | Responsive | Overrides per media query. |
| 07:42-08:26 | Recap | Things to remember; preview of video 04. |

## Demo commands

```sh
cd frontend
npm test -- --watch=false   # as CI runs it; includes tokens/tokens.spec.ts (five token specs)
```

## Pitfalls

- Writing a literal colour in an alias instead of reading the brand argument.
- Forgetting to spread a new group in `createLightTheme` (the `Theme` return type catches it).
- Retuning a key in `responsive.ts` that the theme doesn't define (the spec catches it).

## References

- [MDN: `color-mix()`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix)
- [TypeScript handbook: Template literal types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html)
- [Fluent UI tokens package (`@fluentui/tokens`)](https://github.com/microsoft/fluentui/tree/master/packages/tokens)
