# 30 · Design drift D35: a button that tells you what is missing

> **Runtime:** ~4.3 min · **Audience:** contributors to the mocks, components and dialogs · **Prerequisites:** videos 02 and 03

**Video:** [30-submit-stays-enabled-d35.mp4](30-submit-stays-enabled-d35.mp4) · [Slides](slides.html) · **Audio:** [30-submit-stays-enabled-d35.mp3](30-submit-stays-enabled-d35.mp3) · [Transcript](script.md) · [Clips](clips/clips.mjs)

## Why this video exists

Drift D35 (issue 73): Suggest an event (D10) and Add a family member (D17, add) disabled their primary action until the form was valid, and D10's button was a generic "Submit". The design system's resolution, now shipped (L2-134): the action stays enabled, a failed press shows a focused error summary whose lines link to the invalid fields, and the label names the action ("Send suggestion").

## Learning objectives

By the end, the viewer can:

- Explain why a disabled primary action fails keyboard and screen-reader users.
- Describe the error-summary behaviour: alert, focus, one link per problem, lines clear as fields are fixed.
- Follow the fix through L2-134, the mock, `sd-error-summary` and the two dialogs.

## Key questions

| Question | What a strong answer includes |
|----------|-------------------------------|
| Which criteria? | WCAG 2.2 3.3.1 Error Identification, 3.3.3 Error Suggestion, 4.1.3 Status Messages. |
| How do lines leave the summary? | `problems` is a `computed` over the field values once a press was attempted. |
| Why does edit mode still gate Save? | The issue scopes D10 and D17 (add); the edit dialog's drift records are separate. |

## Code / assets on screen

| File | What to show |
|------|--------------|
| `docs/specs/L2.md` | L2-134. |
| `docs/mocks/styles/app.css` | `.error-summary`. |
| `frontend/projects/components/src/lib/error-summary/error-summary.ts` | The component and `problemSelected`. |
| `frontend/projects/saturdaze/src/app/dialogs/submit-event-dialog/submit-event-dialog.ts` | `attempted`, `problems`, `focusField`. |
| `e2e/tests/ideas-events.spec.ts` | The D10 acceptance test. |

## Run sheet

| Time | Segment | Content |
|------|---------|---------|
| 00:00-00:21 | Introduction | What the video covers. |
| 00:21-00:49 | What drifted | Two dialogs, two disabled buttons. |
| 00:49-01:23 | Why it matters | Tab order, WCAG, naming the action. |
| 01:23-02:46 | The fix | Requirement, mock, component, dialogs. |
| 02:46-03:51 | Before and after | Four clips against the local API. |
| 03:51-04:15 | Recap | Four things to remember. |

## Demo commands

```sh
cd frontend && npx ng test saturdaze --watch=false
cd e2e && npx playwright test tests/ideas-events.spec.ts tests/family.spec.ts --project=desktop
# clips: development builds of main and the fix, served on :4401 and :4402, API on :5100
node tools/video-record/record-clips.mjs docs/videos/30-submit-stays-enabled-d35
```

## Pitfalls

- Do not zoom the page while recording: zoom shifts the pointer's hit targets.
- Keep the problem list derived from the values; a hand-maintained list drifts from the fields.
- The summary lines and the field errors are the same sentences, or the two disagree.

## References

- [WCAG 2.2 Understanding 3.3.1 Error Identification](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html)
- ADR-010, ADR-012 and ADR-013 in `docs/adr/`.
