# 40 · Design drift D45: focus that follows what you see

> **Runtime:** ~3.5 min · **Audience:** contributors to the mocks and the page header · **Prerequisites:** videos 02 and 03

**Video:** [40-primary-first-order-d45.mp4](40-primary-first-order-d45.mp4) · [Slides](slides.html) · **Audio:** [40-primary-first-order-d45.mp3](40-primary-first-order-d45.mp3) · [Transcript](script.md) · [Clips](clips/clips.mjs)

## Why this video exists

Drift D45 (issue 83): the generating Weekend mock put the primary page action (Share) last in the DOM while CSS `order: -1` draws it first on phones, so focus order differed from visual order (WCAG 2.4.3). The design system's resolution: primary first in the DOM, as the Angular `sd-page-header` already does. The mock now matches; a regression test locks the app's order.

## Learning objectives

By the end, the viewer can:

- Explain why CSS `order` cannot fix focus order.
- Find the mock change and the component that already projects the primary first.
- Read the regression test and its page-object member.

## Key questions

| Question | What a strong answer includes |
|----------|-------------------------------|
| Which criteria? | WCAG 2.2 2.4.3 Focus Order and 1.3.2 Meaningful Sequence. |
| Why no product change? | `sd-page-header` projects `slot="primary"` first; only the mock drifted. |
| Why enable the buttons in the clip? | Disabled buttons are skipped by Tab; the clip enables them as they are once the plan is ready. |

## Code / assets on screen

| File | What to show |
|------|--------------|
| `docs/mocks/pages/weekend.generating.html` | Share before Add to calendar. |
| `frontend/projects/components/src/lib/page-header/page-header.html` | Primary slot first. |
| `e2e/tests/weekend.spec.ts`, `e2e/pages/base.page.ts` | The regression test and `headerActionNames()`. |

## Run sheet

| Time | Segment | Content |
|------|---------|---------|
| 00:00-00:26 | Introduction | What the video covers. |
| 00:26-01:05 | What drifted | The mock's DOM vs the phone layout. |
| 01:05-01:30 | Why it matters | 2.4.3 and 1.3.2. |
| 01:30-02:30 | The fix | The mock, the notes, the test. |
| 02:30-03:06 | Before and after | Tab on a phone-width screen. |
| 03:06-03:32 | Recap | Four things to remember. |

## Demo commands

```sh
cd e2e && npx playwright test tests/weekend.spec.ts --project=desktop -g "primary action comes first"
python -I .claude/skills/extracting-design-systems/scripts/check_design_system.py docs/design-system
# clips: copies of docs/mocks from main and from the fix, served on :4401 and :4402
node tools/video-record/record-clips.mjs docs/videos/40-primary-first-order-d45
```

## Pitfalls

- The first Tab stop on the mock is its skip link; press Tab until focus is in the header actions.
- Phone clips set `viewports` in `clips.mjs`; the deck needs no special markup.

## References

- [WCAG 2.2 Understanding 2.4.3 Focus Order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html)
- ADR-009 in `docs/adr/`.
