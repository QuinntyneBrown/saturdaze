# 24 · Design drift D02: a primary button you could not read

> **Runtime:** ~4.5 min · **Audience:** contributors to the mocks, tokens and components · **Prerequisites:** videos 02 and 03

**Video:** [24-primary-button-contrast-d02.mp4](24-primary-button-contrast-d02.mp4) · [Slides](slides.html) · **Audio:** [24-primary-button-contrast-d02.mp3](24-primary-button-contrast-d02.mp3) · [Transcript](script.md) · [Clips](clips/clips.mjs)

## Why this video exists

Drift D02 (issue 40): the primary button put a white label on coral `#E07856`, 3.00:1, below the 4.5:1 WCAG 1.4.3 needs for 14px text. The design system resolved it with `--colorBrandBackground` `#BF5130` (4.74:1) and kept `#E07856` as `--colorBrandBackgroundStatic` for the brand mark; the mocks and the product now match.

## Learning objectives

By the end, the viewer can:

- Explain why white on `#E07856` fails 1.4.3 and what the new fill achieves.
- Follow the fix through the mocks, the TypeScript theme and the components.
- Tell which coral belongs behind text and which is decorative only.

## Key questions

| Question | What a strong answer includes |
|----------|-------------------------------|
| Which criterion? | WCAG 2.2 1.4.3 Contrast (Minimum), AA: 4.5:1 for normal text. |
| Where do token values change? | `frontend/projects/components/src/lib/tokens/`, then `npm run tokens` (ADR-013). |
| What keeps `#E07856`? | The brand mark (`colorBrandBackgroundStatic`), underline, focus ring and brand icons. |

## Code / assets on screen

| File | What to show |
|------|--------------|
| `docs/mocks/styles/tokens.css`, `app.css` | `--sd-primary-fill` and `.btn--primary`. |
| `frontend/projects/components/src/lib/tokens/global/brandColors.ts` | Ramp steps 80 and 90. |
| `frontend/projects/components/src/lib/tokens/alias/lightColor.ts` | Brand aliases and `colorBrandBackgroundStatic`. |
| `frontend/projects/components/src/lib/top-bar/top-bar.scss` | Brand mark on the static token. |
| `docs/design-system/README.md` | D02 row removed. |

## Run sheet

| Time | Segment | Content |
|------|---------|---------|
| 00:00-00:27 | Introduction | What the video covers. |
| 00:27-01:47 | What drifted, why | 3.00:1 vs 4.74:1, WCAG 1.4.3. |
| 01:47-03:37 | The fix | Mocks, theme, components, baselines, drift log. |
| 03:37-04:04 | Before and after | Landing and sign-in, production builds. |
| 04:04-04:32 | Recap | Four things to remember. |

## Demo commands

```sh
cd frontend && npm run tokens:check
node docs/mocks/.check.mjs
# clips: build the app at the commit before the fix and at the fix, serve on :4401 and :4402
node tools/video-record/record-clips.mjs docs/videos/24-primary-button-contrast-d02
```

## Pitfalls

- Do not put text on `--colorBrandBackgroundStatic`.
- Do not edit `_tokens.scss` or `tokens.ts` by hand; change the theme and regenerate.

## References

- [WCAG 2.2 Understanding 1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- ADR-010 and ADR-013 in `docs/adr/`.
