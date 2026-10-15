# 36 · Design drift D41: the dividers that disappeared

> **Runtime:** ~2.9 min · **Audience:** contributors to the mocks and design system · **Prerequisites:** videos 02 and 03

**Video:** [36-list-dividers-d41.mp4](36-list-dividers-d41.mp4) · [Slides](slides.html) · **Audio:** [36-list-dividers-d41.mp3](36-list-dividers-d41.mp3) · [Transcript](script.md) · [Clips](clips/clips.mjs)

## Why this video exists

Drift D41 (issue 79): `.list__item:last-child { border-bottom: 0 }` matched every action row (each is the last child of its own `<li>`), so Family and the confirmation dialogs lost all row dividers in the mocks. The design system's resolution, now applied to the mocks: set the divider on `.list > li:not(:last-child) > .list__item`.

## Learning objectives

By the end, the viewer can:

- Explain why a `:last-child` rule on a row inside its own `<li>` matches every row.
- State the selector that restores the dividers.
- Say why the app's `sd-list-item` needed no change.

## Key questions

| Question | What a strong answer includes |
|----------|-------------------------------|
| Which criterion? | None; it is about scanning and matching the design system. |
| Why no acceptance test? | A CSS fix in the static mocks, which are design artifacts (AGENTS.md). |
| Why was the app fine? | `sd-list-item` draws its divider from its host being the last child. |

## Code / assets on screen

| File | What to show |
|------|--------------|
| `docs/mocks/styles/app.css` | The new `.list > li:not(:last-child) > .list__item` rule. |
| `frontend/projects/components/src/lib/list-item/list-item.scss` | The host-based divider. |
| `docs/design-system/components/list.html` | The reworded note. |

## Run sheet

| Time | Segment | Content |
|------|---------|---------|
| 00:00-00:25 | Introduction | What the video covers. |
| 00:25-01:07 | What drifted | The last-child rule and the markup. |
| 01:07-01:32 | Why it matters | Scanning; design system already fixed. |
| 01:32-02:11 | The fix | One rule; the app was right. |
| 02:11-02:36 | Before and after | The Family mock. |
| 02:36-02:56 | Recap | Four things to remember. |

## Demo commands

```sh
python -I .claude/skills/extracting-design-systems/scripts/check_design_system.py docs/design-system
# clips: copies of docs/mocks from main and from the fix, served on :4401 and :4402
node tools/video-record/record-clips.mjs docs/videos/36-list-dividers-d41
```

## Pitfalls

- A `:last-child` rule is only safe when the row is a direct child of the list.
- The mocks' baselines (ADR-010) are captured from the mocks, so a mock stylesheet change moves them.

## References

- ADR-009 and ADR-010 in `docs/adr/`.
