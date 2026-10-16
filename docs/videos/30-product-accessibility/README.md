# 30 · Product accessibility: expose state and preserve focus

> **Runtime:** ~4.9 min · **Audience:** Saturdaze contributors · **Prerequisites:** familiarity with the Angular app and the Family page

**Video:** [30-product-accessibility.mp4](30-product-accessibility.mp4) · [Slides](slides.html) · **Audio:** [30-product-accessibility.mp3](30-product-accessibility.mp3) · [Transcript](script.md) · [Clips](clips/clips.mjs)

## Why this video exists

Issue 85 groups four accessibility gaps that made existing interface state difficult to discover: the Admin navigation lacked a named landmark, a field could describe both an error and a hidden hint, duplicate Likes and Dislikes had no useful feedback, and the skip link did not retain the current route. This walkthrough traces the fixes from the components to behavior-focused acceptance coverage.

The before clip was recorded from pre-fix `origin/main` at commit `8d188290`; issue #85 was subsequently closed by #143. The after clip demonstrates the additional paired-list feedback and route-aware skip-link behavior in this follow-up.

## Learning objectives

By the end, the viewer can:

- Explain why named navigation and visible-only field descriptions matter to assistive technology.
- Describe how the chip editor prevents duplicates within and across paired lists while announcing outcomes.
- Explain how a skip link preserves route and query context while moving focus to the main content.
- Locate the acceptance tests that verify these behaviors.

## Key questions

| Question | What a strong answer includes |
|----------|-------------------------------|
| How does Admin navigation become a landmark? | The navigation host has the `navigation` role and an `Admin` accessible name. |
| Which field message is referenced? | The visible error takes precedence; otherwise, the visible hint is referenced. |
| How are duplicate tags handled? | Trim and compare without case, keep rejected input, identify the conflicting list, and announce additions and removals. |
| What does the skip link preserve? | The current pathname and query string; activating it still focuses `main` without navigating away. |

## Code / assets on screen

| File | What to show |
|------|--------------|
| `frontend/projects/components/src/lib/admin-nav/admin-nav.ts` | The named navigation landmark on the component host. |
| `frontend/projects/components/src/lib/text-input/text-input.ts` | Error-first `aria-describedby` selection. |
| `frontend/projects/components/src/lib/chip-input/chip-input.ts` and `chip-input.html` | Paired-list conflict handling and the polite status message. |
| `frontend/projects/components/src/lib/skip-link/skip-link.ts` | Route and query tracking, route-change updates, and focus behavior. |
| `frontend/projects/saturdaze/src/app/dialogs/likes-dialog/likes-dialog.html` | The opposite list supplied to each chip input. |
| `e2e/tests/admin/landmarks.spec.ts` | Named Admin navigation landmark acceptance check. |
| `e2e/tests/family.spec.ts` and `e2e/tests/skip-link.spec.ts` | Paired-list feedback, route preservation, and keyboard focus outcomes. |

## Run sheet

| Time | Segment | Content |
|------|---------|---------|
| 00:00-00:18 | Introduction | The goal: expose interface state and keep navigation context. |
| 00:18-00:58 | The four gaps | Landmarks, field descriptions, chip conflicts, and skip-link routes. |
| 00:58-01:42 | Make information perceivable | Admin navigation naming and visible-only text-field descriptions. |
| 01:42-02:26 | Keep chip edits clear | Own-list and paired-list duplicate checks, retained drafts, and announcements. |
| 02:26-03:03 | Preserve skip-link context | Route/query updates and direct focus to the main content. |
| 03:03-03:48 | Before and after | The Family dialog against the baseline and fixed builds. |
| 03:48-04:27 | Prove the behavior | Responsive Admin, Family, and skip-link acceptance coverage. |
| 04:27-04:51 | Recap | Four implementation rules. |

## Demo commands

Set `SATURDAZE_CONNECTION` to your local SQL connection from the repository setup, then start the API and both Angular apps in separate terminals. Build the baseline from commit `8d188290` (the pre-#143 main snapshot) and the fix from this branch with the development configuration so each uses the local API. Do not reset the development database: the recording only opens the Likes dialog and does not save.

```sh
# API terminal; SATURDAZE_CONNECTION must point to your local development database
ASPNETCORE_ENVIRONMENT=Development ConnectionStrings__Saturdaze="$SATURDAZE_CONNECTION" dotnet run --project backend/src/Saturdaze.Api --urls http://localhost:5100

# Baseline app terminal
git worktree add --detach /tmp/saturdaze-85-before 8d188290
ln -s "$PWD/frontend/node_modules" /tmp/saturdaze-85-before/frontend/node_modules
(cd /tmp/saturdaze-85-before/frontend && npm start -- --host 0.0.0.0 --port 4201)

# Fixed app terminal
(cd frontend && npm start -- --host 0.0.0.0 --port 4202)

node tools/video-record/record-clips.mjs docs/videos/30-product-accessibility
node tools/video-audio/generate-audio.mjs docs/videos/30-product-accessibility --dry-run
node tools/video-audio/generate-audio.mjs docs/videos/30-product-accessibility --spoken
node tools/video-audio/generate-audio.mjs docs/videos/30-product-accessibility
node tools/video-build/build-video.mjs docs/videos/30-product-accessibility --check
node tools/video-build/build-video.mjs docs/videos/30-product-accessibility --slides-only
node tools/video-build/build-video.mjs docs/videos/30-product-accessibility
```

## Pitfalls

- `aria-describedby` should point to a message a person can currently see, not stale or hidden guidance.
- Comparing only within Likes or Dislikes still allows contradictory preferences across the two lists.
- A skip link should move focus without dropping the route or query string, and client-side navigation must update its destination.
- The before/after clips use the same seeded profile and do not save edits; do not run the family demo reset against the development database.

## References

- [WCAG 2.2: Bypass Blocks](https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html)
- [WCAG 2.2: Info and Relationships](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html)
- [WCAG 2.2: Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)
- [Issue 85](https://github.com/QuinntyneBrown/saturdaze/issues/85)
