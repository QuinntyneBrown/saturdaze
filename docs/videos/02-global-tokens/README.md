# 02 · Global tokens: the raw values

> **Runtime:** ~7.8 min · **Audience:** frontend developers building or maintaining the design system · **Prerequisites:** [Video 01](../01-design-tokens-what-and-why/README.md); TypeScript interfaces

**Video:** [02-global-tokens.mp4](02-global-tokens.mp4) · [Slides](slides.html) · **Audio:** [02-global-tokens.mp3](02-global-tokens.mp3) · [Transcript](script.md)

## Why this video exists

Every alias token and theme is built from the global layer. Knowing what each global file holds, and why its ramps are shaped the way they are, is the foundation for changing or extending the theme safely.

## Learning objectives

By the end, the viewer can:

- Explain why `types.ts` is written first and how annotated globals fail at compile time.
- Read the 16-step `brandSaturdaze` ramp and name the three steps the app uses (70, 80, 160).
- Distinguish `slate`, `slateAlpha` and the six `ColorVariants` palettes.
- Explain rank-based names (`fontSizeBase400`) and unitless line heights.
- Explain why the base spacing ramp is private and split into horizontal/vertical tokens.
- State the rule: components never read global values.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why sixteen brand steps when three are used? | The ramp is a scale alias tokens pick from; new roles need only an alias change. |
| Why may globals be named by value? | Only the alias layer reads them; job names arrive in the alias layer. |
| Why two spacing families with equal values? | Horizontal and vertical spacing are separate decisions; the private ramp prevents bypassing them. |
| Why are layout and z-index tokens? | So responsive overrides can retune them and components never hard-code them. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/components/src/lib/tokens/types.ts` | `FontSizeTokens`, `BorderRadiusTokens`, the `Theme` intersection. |
| `tokens/global/brandColors.ts` | The ramp and its comment about the three drawn values. |
| `tokens/global/colors.ts` | Header comment, `cream`/`sand`, `slate`, `slateAlpha`, the six palettes. |
| `tokens/global/fonts.ts` | Font stack, seven sizes, line heights, weights. |
| `tokens/global/spacings.ts` | Private ramp and the two exported families. |
| `tokens/global/borderRadius.ts`, `strokeWidths.ts`, `durations.ts`, `curves.ts`, `layout.ts` | Shape, motion, layout and z-index values. |
| `tokens/global/index.ts` | The single re-export. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:20 | Introduction | What the global layer is. |
| 00:21-01:06 | Types | Interfaces as the contract; compile-time checks; `Theme` intersection. |
| 01:06-02:06 | Brand ramp | 16 steps; 70/80/160; interpolation. |
| 02:06-03:43 | Palettes | Neutrals, slate by lightness, alphas, six palettes; value names allowed here. |
| 03:44-04:33 | Typography | Family, seven ranked sizes, unitless line heights, weights. |
| 04:33-05:29 | Spacing | Private 4px ramp; horizontal vs vertical. |
| 05:30-06:38 | Shape, motion, layout | Radii, strokes, durations, curve, layout and z-index. |
| 06:39-07:06 | The rule | One index; components never read globals. |
| 07:07-07:50 | Recap | Things to remember; preview of video 03. |

## Demo commands

```sh
cd frontend
grep -n "brand\[" projects/components/src/lib/tokens/alias/lightColor.ts   # which ramp steps are used
npm run tokens
```

## Pitfalls

- Exporting the base spacing ramp, so components bypass the axis decision.
- Putting pixel values in ramp names (`fontSize15`) — renames on every retune.
- Importing a palette (`sun`, `slate`) from a component.

## References

- [Fluent UI tokens package (`@fluentui/tokens`)](https://github.com/microsoft/fluentui/tree/master/packages/tokens)
- [TypeScript handbook: Interfaces](https://www.typescriptlang.org/docs/handbook/2/objects.html)
- `docs/adr/ADR-013-fluent-design-tokens.md`
