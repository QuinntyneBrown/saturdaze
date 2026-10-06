# 20 · Coding sd-disc: an icon in a coloured circle

> **Runtime:** ~6.8 min · **Audience:** developers who know basic Angular · **Prerequisites:** [Consuming tokens](../../05-consuming-tokens/README.md)

**Video:** [disc.mp4](disc.mp4) · [Slides](slides.html) · **Audio:** [disc.mp3](disc.mp3) · [Transcript](script.md)

## Why this video exists

`sd-disc` is almost entirely host bindings and tokens: a good first look at how a tiny presentational component maps typed signal inputs onto the mock's BEM modifiers, stays decorative for assistive technology, and uses fill/ink token pairs. It is reused by `sd-empty`, `sd-menu` and `sd-day`.

## Learning objectives

By the end, the viewer can:

- Export union types (`DiscTone`, `DiscSize`) for type-safe inputs under `strictTemplates`.
- Bind BEM modifier classes on the host from signals, and keep inputs off host attributes (ADR-009).
- Explain why `aria-hidden` is a static host attribute.
- Derive the glyph size with a protected `computed()`.
- Style tones with paired `…Background1`/`…Foreground1` tokens on `:host(.disc--…)`.
- Read and extend `disc.spec.ts`.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why no `input.required`? | Every input has a sensible default (`'sparkle'`, `'default'`, `'md'`). |
| Why are `tone`/`size` not host attributes? | Inputs stay inputs; only classes and ARIA state go on the host. Nothing read them (ADR-009). |
| Why is there no wrapper element? | The host is the circle; parents can add classes (e.g. `weather-disc`) directly. |
| How is contrast guaranteed? | Each tone uses a designed fill + ink pair from the theme. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/saturdaze/src/app/pages/family/family.page.html` | A leading disc in a list row. |
| `frontend/projects/saturdaze/src/app/pages/verify-email/verify-email.page.html` | An `xl` disc. |
| `frontend/projects/components/src/lib/disc/disc.ts` | Types, decorator, host bindings, inputs, `iconSize`. |
| `frontend/projects/components/src/lib/disc/disc.html` | The one-line template. |
| `frontend/projects/components/src/lib/disc/disc.scss` | `:host` circle, sizes, tone pairs. |
| `frontend/projects/components/src/lib/disc/disc.spec.ts` | Defaults, icon, tone loop, size scaling. |
| `docs/mocks/styles/app.css` | `.disc` rules the component mirrors. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:34 | Introduction | What the disc is; real usages. |
| 00:34-01:10 | Types | `DiscTone`, `DiscSize`. |
| 01:10-02:32 | Decorator | Static class and `aria-hidden`, modifier bindings, inputs stay inputs. |
| 02:32-03:29 | Inputs | Three inputs, `computed()` icon size, why no required/transform. |
| 03:29-03:50 | Template | One `sd-icon`, no wrapper. |
| 03:50-04:46 | Styles | Host circle, sizes, fill/ink pairs. |
| 04:46-05:56 | Spec | Setup and the four tests. |
| 05:56-06:11 | Pitfalls | Three mistakes. |
| 06:11-06:46 | Recap | Things to remember; preview of `sd-empty`. |

## Demo commands

```sh
cd frontend
npx ng test components --include='**/disc/disc.spec.ts'   # run the disc spec
npm run storybook                                           # Disc stories
```

## Pitfalls

- Relying on the disc alone to convey meaning (it is `aria-hidden`).
- Using a fill token without its paired ink.
- Adding a tone to `DiscTone` without its host binding and SCSS rule.

## References

- [Angular: Signal inputs](https://angular.dev/guide/components/inputs)
- [Angular: Host elements](https://angular.dev/guide/components/host-elements)
- `docs/adr/ADR-009-v2-responsive-shell.md`, `docs/adr/ADR-013-fluent-design-tokens.md`
