# 29 · Design drift D34: one clock

> **Runtime:** ~4.5 min · **Audience:** contributors to the mocks, api library and components · **Prerequisites:** videos 02 and 03

**Video:** [29-time-format-d34.mp4](29-time-format-d34.mp4) · [Slides](slides.html) · **Audio:** [29-time-format-d34.mp3](29-time-format-d34.mp3) · [Transcript](script.md) · [Clips](clips/clips.mjs)

## Why this video exists

Drift D34 (issue 72): the timeline wrote times on a 24-hour clock ("18:15"), dialog subtitles on a 12-hour clock with no am or pm ("11:00 to 1:00"), ranges three ways, and admin timestamps two ways. The mocks, the api library and the specs now share one rule: a 12-hour clock with lowercase am or pm, ranges as "11:00am to 1:00pm", admin timestamps as "6 Oct 2026, 2:02pm UTC".

## Learning objectives

By the end, the viewer can:

- State the one time format and the range format.
- Explain why code compares `startMinutes` and never the display text.
- Follow the fix through `format.ts`, the specs and the mocks.

## Key questions

| Question | What a strong answer includes |
|----------|-------------------------------|
| Which criterion? | No single WCAG criterion; ambiguity ("11:00 to 1:00") and two clocks on one screen. |
| What nearly broke? | The restaurant section parsed `BlockRow.time` to pick lunch or dinner; "1:00pm" failed the parse. |
| What replaced the parse? | `BlockRow.startMinutes`, minutes since midnight. |

## Code / assets on screen

| File | What to show |
|------|--------------|
| `frontend/projects/api/src/lib/api/format.ts` | `clock12`, the new `timeRange`; `hhmm` removed. |
| `frontend/projects/api/src/lib/models/block-row.ts` | `time` for people, `startMinutes` for code. |
| `frontend/projects/api/src/lib/services/restaurant.service.ts` | `slotOf` reads `block.startMinutes`. |
| `frontend/projects/api/src/lib/services/admin-audit.service.ts` | `utcWhen` and `utcStamp`. |
| `e2e/tests/weekend.spec.ts` | The acceptance test: "9:00am", "10:30am". |
| `docs/design-system/foundations/content.html` | The rule, and the D34 note removed. |

## Run sheet

| Time | Segment | Content |
|------|---------|---------|
| 00:00-00:29 | Introduction | What the video covers. |
| 00:29-01:09 | What drifted | Two clocks, three range styles, two admin formats. |
| 01:09-01:44 | Why it matters | Ambiguity and conversion. |
| 01:44-03:24 | The fix | The rule, format.ts, startMinutes, tests, mocks, drift log. |
| 03:24-03:53 | Before and after | Landing page sample weekend, production builds. |
| 03:53-04:17 | Recap | Four things to remember. |

## Demo commands

```sh
cd frontend && npx ng test api --watch=false
cd e2e && npx playwright test tests/weekend.spec.ts --project=desktop
python -I .claude/skills/extracting-design-systems/scripts/check_design_system.py docs/design-system
# clips: build the app at the commit before the fix and at the fix, serve on :4401 and :4402
node tools/video-record/record-clips.mjs docs/videos/29-time-format-d34
```

## Pitfalls

- Never parse a display string back into data; carry the number alongside it.
- A range needs am or pm on both ends, or "11:00 to 1:00" is ambiguous.
- Admin timestamps are UTC; keep the "UTC" suffix.

## References

- ADR-010 and ADR-013 in `docs/adr/`.
