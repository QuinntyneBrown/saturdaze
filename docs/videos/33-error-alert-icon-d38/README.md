# 33 · Design drift D38: errors that say warning, once

> **Runtime:** ~3.8 min · **Audience:** contributors to the mocks, components and pages · **Prerequisites:** videos 02, 03 and 32

**Video:** [33-error-alert-icon-d38.mp4](33-error-alert-icon-d38.mp4) · [Slides](slides.html) · **Audio:** [33-error-alert-icon-d38.mp3](33-error-alert-icon-d38.mp3) · [Transcript](script.md) · [Clips](clips/clips.mjs)

## Why this video exists

Drift D38 (issue 76): the sign-in error banner and field errors used the close glyph as a status icon, and the banner added `aria-live="assertive"` on top of `role="alert"`. The design system's resolution, now shipped (L2-136): the `alert` icon, and `role="alert"` alone.

## Learning objectives

By the end, the viewer can:

- Explain why a cross is the wrong status icon and why `role="alert"` needs no `aria-live`.
- List the four app changes: the alert icon, `sd-banner`, the text input error line, and the banner templates.
- Describe the acceptance test and its page-object members.

## Key questions

| Question | What a strong answer includes |
|----------|-------------------------------|
| Which criterion? | WCAG 2.2 4.1.3 Status Messages (and one meaning per icon). |
| Why drop `aria-live`? | `role="alert"` is an assertive live region; a second declaration risks a double announcement. |
| What do status banners use? | `role="status"`, also without `aria-live`. |

## Code / assets on screen

| File | What to show |
|------|--------------|
| `docs/specs/L2.md` | L2-136. |
| `frontend/projects/components/src/lib/banner/banner.ts` | No `aria-live` binding. |
| `frontend/projects/components/src/lib/text-input/text-input.html` | The error line draws `alert`. |
| `e2e/tests/sign-in.spec.ts`, `e2e/pages/auth-card.page.ts` | The acceptance test and `errorBannerIcon()`. |

## Run sheet

| Time | Segment | Content |
|------|---------|---------|
| 00:00-00:20 | Introduction | What the video covers. |
| 00:20-01:06 | What drifted | The cross and the double announcement. |
| 01:06-01:32 | Why it matters | One meaning per icon; WCAG 4.1.3. |
| 01:32-02:54 | The fix | Requirement, mocks, four app changes, tests. |
| 02:54-03:22 | Before and after | Sign-in after a wrong password. |
| 03:22-03:47 | Recap | Four things to remember. |

## Demo commands

```sh
cd frontend && npx ng test components --watch=false
cd e2e && npx playwright test tests/sign-in.spec.ts --project=desktop
# clips: development builds of main and the fix, served on :4401 and :4402, API on :5100
node tools/video-record/record-clips.mjs docs/videos/33-error-alert-icon-d38
```

## Pitfalls

- Do not set `aria-live` on an element that already has `role="alert"` or `role="status"`.
- Only error banners and field errors take the alert icon; chip-remove and dialog-close keep the cross.

## References

- [WCAG 2.2 Understanding 4.1.3 Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)
- ADR-012 and ADR-013 in `docs/adr/`.
