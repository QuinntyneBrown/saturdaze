# 35 · Design drift D40: a stop that says "Stop"

> **Runtime:** ~3.5 min · **Audience:** contributors to the mocks, components and e2e tests · **Prerequisites:** videos 02 and 03

**Video:** [35-stop-disc-name-d40.mp4](35-stop-disc-name-d40.mp4) · [Slides](slides.html) · **Audio:** [35-stop-disc-name-d40.mp3](35-stop-disc-name-d40.mp3) · [Transcript](script.md) · [Clips](clips/clips.mjs)

## Why this video exists

Drift D40 (issue 78): numbered stop discs carried `aria-label="Stop 2"` on a `<span>`, which assistive technology ignores. The design system's resolution, now shipped (L2-137): a visually hidden "Stop " before the number, so the disc reads "Stop 2" and looks unchanged.

## Learning objectives

By the end, the viewer can:

- Explain why an `aria-label` on a plain `<span>` does not name it.
- Show the fix in the mock and in `sd-block`.
- Say how tests find a stop now ("Stop 2", not "2").

## Key questions

| Question | What a strong answer includes |
|----------|-------------------------------|
| Which criteria? | WCAG 2.2 1.3.1 Info and Relationships, 4.1.2 Name, Role, Value. |
| Why does the clip show a tree? | The disc looks identical before and after; the change is in the accessibility tree (Playwright `ariaSnapshot`). |
| What changed in the tests? | `stopBlock(n)` and the disc assertion match "Stop n"; a new test asserts text and no `aria-label`. |

## Code / assets on screen

| File | What to show |
|------|--------------|
| `docs/specs/L2.md` | L2-137. |
| `docs/mocks/pages/weekend.html` | The disc with the visually hidden "Stop ". |
| `frontend/projects/components/src/lib/block/block.html` | The `sd-visually-hidden` span. |
| `e2e/tests/weekend-map.spec.ts`, `e2e/pages/weekend.page.ts` | The acceptance test and `stopBlock(n)`. |

## Run sheet

| Time | Segment | Content |
|------|---------|---------|
| 00:00-00:22 | Introduction | What the video covers. |
| 00:22-00:54 | What drifted | The aria-label on a span. |
| 00:54-01:23 | Why it matters | 1.3.1 and 4.1.2. |
| 01:23-02:35 | The fix | Requirement, mock, component, tests. |
| 02:35-03:05 | Before and after | The accessibility tree for the first stop. |
| 03:05-03:29 | Recap | Four things to remember. |

## Demo commands

```sh
cd frontend && npx ng test components --watch=false
cd e2e && npx playwright test tests/weekend-map.spec.ts --project=desktop
# clips: development builds of main and the fix, served on :4401 and :4402, API on :5100
node tools/video-record/record-clips.mjs docs/videos/35-stop-disc-name-d40
```

## Pitfalls

- Playwright's `toHaveText` reads text content, so the hidden "Stop " counts.
- Do not hide the word with `display: none`; assistive technology would skip it too.

## References

- [WCAG 2.2 Understanding 1.3.1 Info and Relationships](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html)
- ADR-009 and ADR-010 in `docs/adr/`.
