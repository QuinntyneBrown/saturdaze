# 28 · Design drift D06: control edges

> **Runtime:** ~6.5 min · **Audience:** contributors to the mocks, tokens and components · **Prerequisites:** videos 02, 03 and 27

**Video:** [28-control-edge-contrast-d06.mp4](28-control-edge-contrast-d06.mp4) · [Slides](slides.html) · **Audio:** [28-control-edge-contrast-d06.mp3](28-control-edge-contrast-d06.mp3) · [Transcript](script.md) · [Clips](clips/clips.mjs)

## Why this video exists

Drift D06 (issue 44): field borders and the off switch track were `--sd-line-strong`, ink at 16%, 1.36:1 on every surface, below the 3:1 WCAG 1.4.11 needs. The design system resolved it with `--colorNeutralStrokeAccessible` `#80868F` (3.67:1 on white, 3.20:1 on wells); the mocks and the product now match, for fields, the switch, resting filter chips and vote buttons, and the dashed add and upload edges.

## Learning objectives

By the end, the viewer can:

- Explain why a control's edge is held to 3:1 and why the 16% line failed.
- Follow the fix through the mocks, the TypeScript theme and the components.
- Tell a decorative edge from one a person has to find.

## Key questions

| Question | What a strong answer includes |
|----------|-------------------------------|
| Which criterion? | WCAG 2.2 1.4.11 Non-text Contrast, AA, 3:1 for what identifies a control or its state. |
| Where do token values change? | `frontend/projects/components/src/lib/tokens/`, then `npm run tokens` (ADR-013). |
| Why did grab handles and empty stars not change? | They moved to `colorNeutralForegroundDisabled`, which keeps `#9ca3af`, the mocks' `--sd-ink-disabled`. |
| Why is the quiet button unchanged? | It is drift D28, fixed separately. |

## Code / assets on screen

| File | What to show |
|------|--------------|
| `docs/mocks/styles/tokens.css` | `--sd-line-control` #80868F. |
| `docs/mocks/styles/app.css` | Field, chip input, switch track, filter chip, vote button, ghost row, upload tile. |
| `frontend/projects/components/src/lib/tokens/global/colors.ts` | `slate[53]` `#80868f`. |
| `frontend/projects/components/src/lib/tokens/alias/lightColor.ts` | `colorNeutralStrokeAccessible: slate[53]`, `colorNeutralForegroundDisabled: slate[65]`. |
| `frontend/projects/components/src/lib/toggle/toggle.scss` | The off track. |
| `e2e/tests/control-edges.spec.ts` | The acceptance test. |
| `docs/design-system/README.md` | D06 row removed. |

## Run sheet

| Time | Segment | Content |
|------|---------|---------|
| 00:00-00:29 | Introduction | What the video covers. |
| 00:29-01:25 | What drifted | Two line tokens; where the 16% line was used. |
| 01:25-02:48 | Why it matters | 1.36:1 vs 3.20:1, WCAG 1.4.11; decorative vs control edges. |
| 02:48-05:09 | The fix | Mocks, theme, components, acceptance test, baselines, drift log. |
| 05:09-05:58 | Before and after | Sign-in and create account, production builds. |
| 05:58-06:31 | Recap | Four things to remember. |

## Demo commands

```sh
cd frontend && npm run tokens:check
node docs/mocks/.check.mjs
cd e2e && npx playwright test tests/control-edges.spec.ts --project=desktop
# clips: build the app at the commit before the fix and at the fix, serve on :4401 and :4402
node tools/video-record/record-clips.mjs docs/videos/28-control-edge-contrast-d06
```

## Pitfalls

- An edge that only decorates can stay faint; an edge that tells a person where a control is cannot.
- Changing `colorNeutralStrokeAccessible` moves everything that reads it; move the disabled-looking uses to their own role first.
- Do not edit `_tokens.scss` or `tokens.ts` by hand; change the theme and regenerate.

## References

- [WCAG 2.2 Understanding 1.4.11 Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- ADR-010 and ADR-013 in `docs/adr/`.
