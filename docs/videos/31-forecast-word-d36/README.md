# 31 · Design drift D36: the forecast, in words

> **Runtime:** ~4.1 min · **Audience:** contributors to the mocks, api library and components · **Prerequisites:** videos 02 and 03

**Video:** [31-forecast-word-d36.mp4](31-forecast-word-d36.mp4) · [Slides](slides.html) · **Audio:** [31-forecast-word-d36.mp3](31-forecast-word-d36.mp3) · [Transcript](script.md) · [Clips](clips/clips.mjs)

## Why this video exists

Drift D36 (issue 74): on a day with stops, the forecast existed only in the `aria-hidden` weather disc; the meta line never said "sunny" (WCAG 1.1.1, 1.4.1). The design system's resolution, now shipped (L2-135): the day meta line names the weather first, "17 May · Sunny · 22° / 14° · 3 stops · 1 h 36 min driving".

## Learning objectives

By the end, the viewer can:

- Explain why a decorative icon cannot be the only carrier of the forecast.
- State the meta line format and the six weather words.
- Find where the app builds the line and the helper it reuses.

## Key questions

| Question | What a strong answer includes |
|----------|-------------------------------|
| Which criteria? | WCAG 2.2 1.1.1 Non-text Content and 1.4.1 Use of Color. |
| What if there is no forecast? | The word and the temperatures are omitted; the "Forecast pending" note stays for a day with no stops. |
| Where is the word chosen? | `weatherWordCapitalised` in `frontend/projects/api/src/lib/api/weather.ts`. |

## Code / assets on screen

| File | What to show |
|------|--------------|
| `docs/specs/L2.md` | L2-135. |
| `frontend/projects/api/src/lib/api/weekend-projection.ts` | `dayMeta`. |
| `frontend/projects/api/src/lib/api/weather.ts` | `weatherWordCapitalised`. |
| `e2e/tests/weekend.spec.ts` | The acceptance test for the meta line. |

## Run sheet

| Time | Segment | Content |
|------|---------|---------|
| 00:00-00:29 | Introduction | What the video covers. |
| 00:29-01:00 | What drifted | The disc, the meta line, the missing word. |
| 01:00-01:27 | Why it matters | WCAG 1.1.1 and 1.4.1. |
| 01:27-02:54 | The fix | Requirement, mocks, one line in dayMeta, tests. |
| 02:54-03:38 | Before and after | The Weekend page against the local API. |
| 03:38-04:06 | Recap | Four things to remember. |

## Demo commands

```sh
cd frontend && npx ng test api --watch=false
cd e2e && npx playwright test tests/weekend.spec.ts --project=desktop -g "meta line names"
# clips: development builds of main and the fix, served on :4401 and :4402, API on :5100
node tools/video-record/record-clips.mjs docs/videos/31-forecast-word-d36
```

## Pitfalls

- The forecast in the clips is live, so the weather word in the recording is whatever the forecast says that day.
- Select the day's tab before reading its meta line; the page shows one day at a time on narrow layouts.

## References

- [WCAG 2.2 Understanding 1.1.1 Non-text Content](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html)
- ADR-010 and ADR-013 in `docs/adr/`.
