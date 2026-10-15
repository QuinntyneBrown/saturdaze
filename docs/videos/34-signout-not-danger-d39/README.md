# 34 · Design drift D39: signing out is not dangerous

> **Runtime:** ~3.2 min · **Audience:** contributors to the mocks and components · **Prerequisites:** videos 02 and 03

**Video:** [34-signout-not-danger-d39.mp4](34-signout-not-danger-d39.mp4) · [Slides](slides.html) · **Audio:** [34-signout-not-danger-d39.mp3](34-signout-not-danger-d39.mp3) · [Transcript](script.md) · [Clips](clips/clips.mjs)

## Why this video exists

Drift D39 (issue 77): Sign out on the admin gate was a danger button though nothing is destroyed. The design system's resolution, now shipped: a quiet warn-text button, as on Family.

## Learning objectives

By the end, the viewer can:

- Say what the danger style is reserved for.
- Find the gate's Sign out in the mock and in `sd-admin-gate`.
- Name the two attributes that give the quiet warn-text style.

## Key questions

| Question | What a strong answer includes |
|----------|-------------------------------|
| Which rule? | Danger confirms a destructive action in a dialog (D21); signing out destroys nothing. Adjacent to WCAG 2.2 3.2.4 Consistent Identification. |
| Why no new test? | Visual change, no new behaviour; the Admin e2e finds the button by name. |

## Code / assets on screen

| File | What to show |
|------|--------------|
| `docs/mocks/pages/admin.sign-in.html` | The gate's Sign out button. |
| `frontend/projects/components/src/lib/admin-gate/admin-gate.html` | `variant="quiet" warnText`. |
| `frontend/projects/saturdaze/src/app/pages/family/family.page.html` | The Family Sign out it now matches. |

## Run sheet

| Time | Segment | Content |
|------|---------|---------|
| 00:00-00:22 | Introduction | What the video covers. |
| 00:22-00:55 | What drifted | The gate and Family. |
| 00:55-01:34 | Why it matters | Danger is reserved. |
| 01:34-02:23 | The fix | Mock, component, docs. |
| 02:23-02:49 | Before and after | The admin gate for a non-administrator. |
| 02:49-03:09 | Recap | Four things to remember. |

## Demo commands

```sh
cd frontend && npx ng test components --watch=false
# clips: development builds of the admin app on main and on the fix, served on :4401 and :4402, API on :5100
node tools/video-record/record-clips.mjs docs/videos/34-signout-not-danger-d39
```

## Pitfalls

- The gate shows only for a signed-in non-administrator; the clips sign in as the seeded family account.

## References

- [WCAG 2.2 Understanding 3.2.4 Consistent Identification](https://www.w3.org/WAI/WCAG22/Understanding/consistent-identification.html)
- ADR-012 and ADR-013 in `docs/adr/`.
