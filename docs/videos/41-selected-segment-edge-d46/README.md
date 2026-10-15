# 41 · Design drift D46: a selected tab you can actually see

> **Runtime:** ~3.3 min · **Audience:** contributors to the mocks, design system and components · **Prerequisites:** videos 02, 03 and 28

**Video:** [41-selected-segment-edge-d46.mp4](41-selected-segment-edge-d46.mp4) · [Slides](slides.html) · **Audio:** [41-selected-segment-edge-d46.mp3](41-selected-segment-edge-d46.mp3) · [Transcript](script.md) · [Clips](clips/clips.mjs)

## Why this video exists

Drift D46 (issue 84): the selected segment of `segments` and `seg-radio` differed from the track only by a small luminance step (the pill's fill measured 1.15:1 on its track), below the 3:1 WCAG 1.4.11 asks for what shows a control's state. The design system's resolution, now shipped: a 1px `--colorNeutralStrokeAccessible` inner edge on the selected segment (3.20:1 on the track).

## Learning objectives

By the end, the viewer can:

- Say why the pill's shadow and fill are not enough to show state.
- Find the three places the edge is defined and the token each reads.
- Read the acceptance test that measures the edge against the track.

## Key questions

| Question | What a strong answer includes |
|----------|-------------------------------|
| Which criterion? | WCAG 2.2 1.4.11 Non-text Contrast, AA, 3:1. |
| What was measured? | Fill vs track 1.15:1 with no edge before; edge vs track 3.20:1 after (computed live in the clip). |
| Which controls? | `sd-segments` (Weekend day tabs, Legal's document switch) and `sd-seg-radio` (dialog choices). |

## Code / assets on screen

| File | What to show |
|------|--------------|
| `frontend/projects/components/src/lib/segments/segments.scss` | The inset edge. |
| `frontend/projects/components/src/lib/seg-radio/seg-radio.scss` | The same edge on the checked option. |
| `docs/mocks/styles/app.css` | `inset 0 0 0 1px var(--sd-line-control)`. |
| `e2e/tests/selected-segment-edge.spec.ts` | The acceptance tests. |

## Run sheet

| Time | Segment | Content |
|------|---------|---------|
| 00:00-00:23 | Introduction | What the video covers. |
| 00:23-00:58 | What drifted | Two segmented controls. |
| 00:58-01:26 | Why it matters | WCAG 1.4.11. |
| 01:26-02:26 | The fix | The edge, the test. |
| 02:26-02:55 | Before and after | Weekend day tabs, measured live. |
| 02:55-03:21 | Recap | Four things to remember. |

## Demo commands

```sh
cd frontend && npx ng test components --watch=false
cd e2e && npx playwright test tests/selected-segment-edge.spec.ts --project=desktop
# clips: development builds of main and the fix, served on :4401 and :4402, API on :5100
node tools/video-record/record-clips.mjs docs/videos/41-selected-segment-edge-d46
```

## Pitfalls

- Read the edge from `box-shadow`; the segment has no `border`, so a border assertion would miss it.
- Keep the soft shadow first and the inset edge second so the edge paints above it.

## References

- [WCAG 2.2 Understanding 1.4.11 Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- ADR-013 in `docs/adr/`.
