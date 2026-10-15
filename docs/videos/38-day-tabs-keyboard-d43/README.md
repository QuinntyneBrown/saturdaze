# 38 · Design drift D43: the day tabs, by keyboard

> **Runtime:** ~3.8 min · **Audience:** contributors to the mocks and components · **Prerequisites:** videos 02 and 03

**Video:** [38-day-tabs-keyboard-d43.mp4](38-day-tabs-keyboard-d43.mp4) · [Slides](slides.html) · **Audio:** [38-day-tabs-keyboard-d43.mp3](38-day-tabs-keyboard-d43.mp3) · [Transcript](script.md) · [Clips](clips/clips.mjs)

## Why this video exists

Drift D43 (issue 81): the Weekend mock's Saturday/Sunday tabs responded to clicks only (no arrow keys, no roving `tabindex`), and the app's `sd-segments` lacked Home and End. The design system's resolution, now shipped (L2-139): the APG Tabs keyboard model with automatic activation.

## Learning objectives

By the end, the viewer can:

- State the keyboard model: one Tab stop, arrows with wrap, Home and End, selection follows focus.
- Find the mock's script and the component's key handler.
- Say what the acceptance test asserts and where it failed first.

## Key questions

| Question | What a strong answer includes |
|----------|-------------------------------|
| Which criteria? | WCAG 2.2 2.1.1 Keyboard, 4.1.2 Name, Role, Value. |
| What did the app already do? | Roving `tabindex` and ← → with wrap (L2-104 AC4); only Home and End were missing. |
| What does the "before" clip show for Home and End? | The page scrolls (the browser default) while Sunday stays selected. |

## Code / assets on screen

| File | What to show |
|------|--------------|
| `docs/specs/L2.md` | L2-139. |
| `docs/mocks/app.js` | The `keydown` handler and `tabindex` updates. |
| `frontend/projects/components/src/lib/segments/segments.ts` | `onKeydown` with Home and End. |
| `e2e/tests/weekend.spec.ts` | The keyboard acceptance test. |

## Run sheet

| Time | Segment | Content |
|------|---------|---------|
| 00:00-00:24 | Introduction | What the video covers. |
| 00:24-01:02 | What drifted | The mock and the app. |
| 01:02-01:30 | Why it matters | 2.1.1 and 4.1.2. |
| 01:30-02:51 | The fix | Requirement, mock, component, test. |
| 02:51-03:25 | Before and after | Keys pressed on the Weekend tabs. |
| 03:25-03:49 | Recap | Four things to remember. |

## Demo commands

```sh
cd frontend && npx ng test components --watch=false
cd e2e && npx playwright test tests/weekend.spec.ts --project=desktop -g "APG keyboard"
# clips: development builds of main and the fix, served on :4401 and :4402, API on :5100
node tools/video-record/record-clips.mjs docs/videos/38-day-tabs-keyboard-d43
```

## Pitfalls

- Wait for the dev server to finish its first compile before trusting a red test.
- Home and End scroll the page unless the tab handler calls `preventDefault`.

## References

- [WAI-ARIA Authoring Practices: Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)
- ADR-009 and ADR-010 in `docs/adr/`.
