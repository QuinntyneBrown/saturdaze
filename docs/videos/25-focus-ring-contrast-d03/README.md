# 25 · Design drift D03: a focus ring you could barely see

> **Runtime:** ~5 min · **Audience:** contributors to the mocks, tokens and components · **Prerequisites:** videos 02, 03 and 24

**Video:** [25-focus-ring-contrast-d03.mp4](25-focus-ring-contrast-d03.mp4) · [Slides](slides.html) · **Audio:** [25-focus-ring-contrast-d03.mp3](25-focus-ring-contrast-d03.mp3) · [Transcript](script.md) · [Clips](clips/clips.mjs)

## Why this video exists

Drift D03 (issue 41): the keyboard focus ring was `2px solid` coral `#E07856`, 2.81:1 on the cream canvas, below the 3:1 WCAG 1.4.11 needs and a risk for 2.4.7. The design system resolved it with `--colorStrokeFocus2` `#A04B2C` (5.56:1 on the canvas, 5.18:1 on wells); the mocks and the product now match.

## Learning objectives

By the end, the viewer can:

- Explain why a focus ring is held to 3:1 and why `#E07856` failed.
- Follow the fix through the mocks, the TypeScript theme and the components.
- Name the one token every focus ring and focused field border reads.

## Key questions

| Question | What a strong answer includes |
|----------|-------------------------------|
| Which criteria? | WCAG 2.2 1.4.11 Non-text Contrast (AA, 3:1) and 2.4.7 Focus Visible (AA). |
| Where do token values change? | `frontend/projects/components/src/lib/tokens/`, then `npm run tokens` (ADR-013). |
| What keeps `#E07856`? | The brand mark, underlines and coral icons; not the focus ring. |

## Code / assets on screen

| File | What to show |
|------|--------------|
| `docs/mocks/styles/app.css` | `--sd-focus-ring`, the field and chip-input focus borders. |
| `frontend/projects/components/src/lib/tokens/alias/lightColor.ts` | `colorStrokeFocus2: brand[70]`. |
| `frontend/projects/components/src/lib/stat-card/stat-card.scss` | The link ring on the focus token. |
| `e2e/tests/focus-ring.spec.ts` | The acceptance test. |
| `docs/design-system/README.md` | D03 row removed. |

## Run sheet

| Time | Segment | Content |
|------|---------|---------|
| 00:00-00:30 | Introduction | What the video covers. |
| 00:30-02:08 | What drifted, why | 2.81:1 vs 5.56:1, WCAG 1.4.11 and 2.4.7. |
| 02:08-04:03 | The fix | Mocks, theme, components, acceptance test, drift log. |
| 04:03-04:34 | Before and after | Tabbing through sign-in, production builds. |
| 04:34-05:04 | Recap | Four things to remember. |

## Demo commands

```sh
cd frontend && npm run tokens:check
node docs/mocks/.check.mjs
cd e2e && npx playwright test tests/focus-ring.spec.ts --project=desktop
# clips: build the app at the commit before the fix and at the fix, serve on :4401 and :4402
node tools/video-record/record-clips.mjs docs/videos/25-focus-ring-contrast-d03
```

## Pitfalls

- Do not draw a focus ring with `colorBrandStroke1`; it is the light brand coral.
- Do not edit `_tokens.scss` or `tokens.ts` by hand; change the theme and regenerate.

## References

- [WCAG 2.2 Understanding 1.4.11 Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- [WCAG 2.2 Understanding 2.4.7 Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html)
- ADR-010 and ADR-013 in `docs/adr/`.
