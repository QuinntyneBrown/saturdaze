# 26 · Design drift D04: hint text too faint to read

> **Runtime:** ~6 min · **Audience:** contributors to the mocks, tokens and components · **Prerequisites:** videos 02, 03 and 25

**Video:** [26-hint-text-contrast-d04.mp4](26-hint-text-contrast-d04.mp4) · [Slides](slides.html) · **Audio:** [26-hint-text-contrast-d04.mp3](26-hint-text-contrast-d04.mp3) · [Transcript](script.md) · [Clips](clips/clips.mjs)

## Why this video exists

Drift D04 (issue 42): hint text (placeholders, `field__req`, `block__dur`, `empty__note`, `auth__foot`, `site-footer`, `hero__note`, `list__trail`) was `--sd-ink-faint` `#9CA3AF`, 2.54:1 on white, 2.38:1 on the cream canvas and lower on wells, below the 4.5:1 WCAG 1.4.3 needs. The design system resolved it with `--colorNeutralForeground3` `#636A77` (4.75:1 on wells) and kept `#9CA3AF` for disabled things only; the mocks and the product now match.

## Learning objectives

By the end, the viewer can:

- Explain why placeholders, notes and footers are held to 4.5:1 and why `#9CA3AF` failed.
- Follow the fix through the mocks, the TypeScript theme and the components.
- Tell which token hint text reads and which grey is reserved for disabled and decorative things.

## Key questions

| Question | What a strong answer includes |
|----------|-------------------------------|
| Which criterion? | WCAG 2.2 1.4.3 Contrast (Minimum), AA, 4.5:1 for text. |
| Where do token values change? | `frontend/projects/components/src/lib/tokens/`, then `npm run tokens` (ADR-013). |
| What keeps `#9CA3AF`? | `--sd-ink-disabled` in the mocks and `colorNeutralStrokeAccessible` in the product: the grab handle, browser-frame dots and empty stars; never live text. |

## Code / assets on screen

| File | What to show |
|------|--------------|
| `docs/mocks/styles/tokens.css` | `--sd-ink-faint` #636A77 and the new `--sd-ink-disabled`. |
| `docs/mocks/styles/app.css` | Empty stars, grab handle and frame dots on `--sd-ink-disabled`; vote icon on `--sd-ink-soft`. |
| `frontend/projects/components/src/lib/tokens/global/colors.ts` | `slate[43]` `#636a77`. |
| `frontend/projects/components/src/lib/tokens/alias/lightColor.ts` | `colorNeutralForeground3: slate[43]`. |
| `frontend/projects/components/src/lib/stars/stars.scss`, `vote-row/vote-row.scss` | Non-text readers off the hint role. |
| `e2e/tests/hint-text.spec.ts` | The acceptance test. |
| `docs/design-system/README.md` | D04 row removed. |

## Run sheet

| Time | Segment | Content |
|------|---------|---------|
| 00:00-00:36 | Introduction | What the video covers. |
| 00:36-01:42 | What drifted | Three ink strengths; where the faint grey was used. |
| 01:42-02:36 | Why it matters | 2.38:1 vs 5.09:1 on the canvas, WCAG 1.4.3. |
| 02:36-04:41 | The fix | Mocks, theme, components, acceptance test, baselines, drift log. |
| 04:41-05:30 | Before and after | Create account, sign-in and landing, production builds. |
| 05:30-06:01 | Recap | Four things to remember. |

## Demo commands

```sh
cd frontend && npm run tokens:check
node docs/mocks/.check.mjs
cd e2e && npx playwright test tests/hint-text.spec.ts --project=desktop
# clips: build the app at the commit before the fix and at the fix, serve on :4401 and :4402
node tools/video-record/record-clips.mjs docs/videos/26-hint-text-contrast-d04
```

## Pitfalls

- Do not put `#9CA3AF` (or `colorNeutralStrokeAccessible`) on live text; it is for disabled and decorative things.
- Do not edit `_tokens.scss` or `tokens.ts` by hand; change the theme and regenerate.
- Until D05 darkens `colorNeutralForeground2`, hint text and soft labels are close in strength.

## References

- [WCAG 2.2 Understanding 1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- ADR-010 and ADR-013 in `docs/adr/`.
