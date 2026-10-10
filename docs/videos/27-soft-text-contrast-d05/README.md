# 27 · Design drift D05: soft text on wells

> **Runtime:** ~5.5 min · **Audience:** contributors to the mocks, tokens and components · **Prerequisites:** videos 02, 03 and 26

**Video:** [27-soft-text-contrast-d05.mp4](27-soft-text-contrast-d05.mp4) · [Slides](slides.html) · **Audio:** [27-soft-text-contrast-d05.mp3](27-soft-text-contrast-d05.mp3) · [Transcript](script.md) · [Clips](clips/clips.mjs)

## Why this video exists

Drift D05 (issue 43): secondary text on chips, wells and segments was `--sd-ink-soft` `#6B7280`, 4.22:1 on `--sd-surface-2`, below the 4.5:1 WCAG 1.4.3 needs. The design system resolved it with `--colorNeutralForeground2` `#5B6270` (5.35:1 on wells, 6.13:1 on white); the mocks and the product now match.

## Learning objectives

By the end, the viewer can:

- Explain why secondary text on a well is held to 4.5:1 and why `#6B7280` failed there.
- Follow the fix through the mocks and the TypeScript theme.
- Place the three text roles in order: content, secondary, hint.

## Key questions

| Question | What a strong answer includes |
|----------|-------------------------------|
| Which criterion? | WCAG 2.2 1.4.3 Contrast (Minimum), AA, 4.5:1 for text. |
| Where do token values change? | `frontend/projects/components/src/lib/tokens/`, then `npm run tokens` (ADR-013). |
| Why did no component change? | They read `colorNeutralForeground2` by role; only the select chevron had a literal hex. |

## Code / assets on screen

| File | What to show |
|------|--------------|
| `docs/mocks/styles/tokens.css` | `--sd-ink-soft` #5B6270. |
| `frontend/projects/components/src/lib/tokens/global/colors.ts` | `slate[40]` `#5b6270`; `slate[46]` removed. |
| `frontend/projects/components/src/lib/tokens/alias/lightColor.ts` | `colorNeutralForeground2: slate[40]`. |
| `frontend/projects/components/src/lib/select/select.scss` | The chevron's inline stroke. |
| `e2e/tests/soft-text.spec.ts` | The acceptance test. |
| `docs/design-system/README.md` | D05 row removed. |

## Run sheet

| Time | Segment | Content |
|------|---------|---------|
| 00:00-00:37 | Introduction | What the video covers. |
| 00:37-01:36 | What drifted | Three ink strengths; where the soft grey was used. |
| 01:36-02:35 | Why it matters | 4.22:1 vs 5.35:1 on wells, WCAG 1.4.3. |
| 02:35-04:17 | The fix | Mocks, theme, acceptance test, baselines, drift log. |
| 04:17-05:02 | Before and after | Legal, sign-in and landing, production builds. |
| 05:02-05:35 | Recap | Four things to remember. |

## Demo commands

```sh
cd frontend && npm run tokens:check
node docs/mocks/.check.mjs
cd e2e && npx playwright test tests/soft-text.spec.ts --project=desktop
# clips: build the app at the commit before the fix and at the fix, serve on :4401 and :4402
node tools/video-record/record-clips.mjs docs/videos/27-soft-text-contrast-d05
```

## Pitfalls

- Passing on white is not enough: check secondary text against the darkest surface it sits on, the wells.
- Do not edit `_tokens.scss` or `tokens.ts` by hand; change the theme and regenerate.
- Literal colours inside inline SVG (the select chevron) do not follow a token; change them by hand.

## References

- [WCAG 2.2 Understanding 1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- ADR-010 and ADR-013 in `docs/adr/`.
