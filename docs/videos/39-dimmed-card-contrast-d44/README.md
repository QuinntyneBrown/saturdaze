# 39 · Design drift D44: stepping back without fading out

> **Runtime:** ~4 min · **Audience:** contributors to the mocks, design system and components · **Prerequisites:** videos 02, 03 and 27

**Video:** [39-dimmed-card-contrast-d44.mp4](39-dimmed-card-contrast-d44.mp4) · [Slides](slides.html) · **Audio:** [39-dimmed-card-contrast-d44.mp3](39-dimmed-card-contrast-d44.mp3) · [Transcript](script.md) · [Clips](clips/clips.mjs)

## Why this video exists

Drift D44 (issue 82): `.card--dimmed` (60%), `.card--muted` (85%) and `.block--done` (60%) used opacity, taking meta text below 4.5:1 (about 2.5:1 dimmed, 4.4:1 muted). The design system had already muted `.block--done` with colour and a strikethrough and left the cards as an open item; this change closes it everywhere: dimmed cards take a sunk surface, a secondary-ink title and a faded photo; muted cards a dashed accessible edge; done blocks a neutral disc and a struck-through title.

## Learning objectives

By the end, the viewer can:

- Explain why opacity cannot be how a card steps back (WCAG 1.4.3).
- Describe the new dimmed, muted and done treatments and which token each reads.
- Read the acceptance test and the on-screen contrast measurement.

## Key questions

| Question | What a strong answer includes |
|----------|-------------------------------|
| Which criterion? | WCAG 2.2 1.4.3 Contrast (Minimum), AA, 4.5:1; the requirement is L2-038. |
| Why is the photo still faded? | A photo is not text; only the text must keep 4.5:1. |
| How was it measured? | The clip blends the card's opacity into both text and surface in the page and prints the ratio: 2.63:1 before, 5.35:1 after. |

## Code / assets on screen

| File | What to show |
|------|--------------|
| `frontend/projects/components/src/lib/food-card/food-card.scss` | The dimmed state. |
| `frontend/projects/components/src/lib/event-card/event-card.scss`, `card/card.scss`, `block/block.scss` | Muted, generic dimmed and done. |
| `docs/mocks/styles/app.css`, `docs/design-system/assets/components.css` | The same three rules. |
| `e2e/tests/ideas-food.spec.ts` | The contrast acceptance test. |

## Run sheet

| Time | Segment | Content |
|------|---------|---------|
| 00:00-00:26 | Introduction | What the video covers. |
| 00:26-01:03 | What drifted | Three opacity states. |
| 01:03-01:31 | Why it matters | WCAG 1.4.3. |
| 01:31-02:54 | The fix | The rule, three places, the test. |
| 02:54-03:30 | Before and after | Dimmed Dinner pick measured live. |
| 03:30-03:57 | Recap | Four things to remember. |

## Demo commands

```sh
cd frontend && npx ng test components --watch=false
cd e2e && npx playwright test tests/ideas-food.spec.ts --project=desktop -g "stepped-back"
python -I .claude/skills/extracting-design-systems/scripts/check_contrast.py docs/design-system/tokens/tokens.css
# clips: development builds of main and the fix, served on :4401 and :4402, API on :5100
node tools/video-record/record-clips.mjs docs/videos/39-dimmed-card-contrast-d44
```

## Pitfalls

- The dimmed state needs a locked dinner; the clips and the test lock Saturday's through the API (there is no unlock in v2).
- Two other Food e2e tests (page header, the D12 lock dialog) fail on `main` too.

## References

- [WCAG 2.2 Understanding 1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- ADR-010 and ADR-013 in `docs/adr/`.
