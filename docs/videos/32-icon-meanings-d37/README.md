# 32 · Design drift D37: one icon, one meaning

> **Runtime:** ~3.8 min · **Audience:** contributors to the mocks, design system and components · **Prerequisites:** videos 02 and 03

**Video:** [32-icon-meanings-d37.mp4](32-icon-meanings-d37.mp4) · [Slides](slides.html) · **Audio:** [32-icon-meanings-d37.mp3](32-icon-meanings-d37.mp3) · [Transcript](script.md) · [Clips](clips/clips.mjs)

## Why this video exists

Drift D37 (issue 75): `star` meant both "rating" and "Make primary", and `arrow_right`, `arrow_left` and `chevron_right` drew the same chevron. The design system's resolution, now shipped: one meaning per icon. The arrows gain a shaft; a new `bookmark` marks the primary photo; the star keeps ratings and the Past tab.

## Learning objectives

By the end, the viewer can:

- State the one-meaning-per-icon rule and why a redraw must not reach unrelated rows.
- Name the three places an icon is defined and the paths that changed.
- Say which icon marks the primary photo and which marks a rating.

## Key questions

| Question | What a strong answer includes |
|----------|-------------------------------|
| Which criterion? | None exactly; it sits close to WCAG 2.2 3.2.4 Consistent Identification. |
| Why a new icon, not a variant of the star? | One meaning per icon: add a new one rather than lending an existing one a second job. |
| Why no new acceptance test? | A visual change with no new behaviour; the sprite-list unit test grows by one. |

## Code / assets on screen

| File | What to show |
|------|--------------|
| `frontend/projects/components/src/lib/icon/icon.ts` | `arrow_left`, `arrow_right`, `chevron_right`, `bookmark`. |
| `docs/mocks/app.js`, `docs/design-system/assets/icons.js` | The same definitions. |
| `frontend/projects/api/src/lib/services/admin-places.service.ts` | The Primary badge icon. |
| `docs/design-system/foundations/iconography.html` | The bookmark and the arrow captions. |

## Run sheet

| Time | Segment | Content |
|------|---------|---------|
| 00:00-00:22 | Introduction | What the video covers. |
| 00:22-01:05 | What drifted | The star and the arrows. |
| 01:05-01:40 | Why it matters | Consistent identification. |
| 01:40-02:45 | The fix | Three definitions, where the bookmark goes, the test, the docs. |
| 02:45-03:24 | Before and after | Photo health and Place photos in Saturdaze Admin. |
| 03:24-03:49 | Recap | Four things to remember. |

## Demo commands

```sh
cd frontend && npx ng test components --watch=false
# clips: development builds of the admin app on main and on the fix, served on :4401 and :4402, API on :5100
node tools/video-record/record-clips.mjs docs/videos/32-icon-meanings-d37
```

## Pitfalls

- Define an icon in all three places (mocks, design system, components) or they drift apart again.
- Clips sign in as `admin@saturdaze.ca` against the dev database; Bronte Creek must have two photos.

## References

- [WCAG 2.2 Understanding 3.2.4 Consistent Identification](https://www.w3.org/WAI/WCAG22/Understanding/consistent-identification.html)
- ADR-012 and ADR-013 in `docs/adr/`.
