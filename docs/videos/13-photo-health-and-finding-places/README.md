# 13 · Photo health and finding places

> **Runtime:** ~5.9 min · **Audience:** curators and developers of Saturdaze Admin · **Prerequisites:** video 12

**Video:** [13-photo-health-and-finding-places.mp4](13-photo-health-and-finding-places.mp4) · [Slides](slides.html) · **Audio:** [13-photo-health-and-finding-places.mp3](13-photo-health-and-finding-places.mp3) · [Transcript](script.md) · [Clips](clips/clips.mjs)

## Why this video exists

The admin home (Photo health, A2, L2-112) and the Places screen (A3, L2-113) are where every session starts. Both rest on one evaluation, `PhotoHealth.Flags`, so the numbers agree with the lists they open. This video shows both screens recorded live and the code that keeps them consistent.

## Learning objectives

By the end, the viewer can:

- Name the four health flags and what each means for a family.
- Explain why a blocked primary never counts as "a photo that shows".
- Use the stat-card links, search, filters and sort to find places that need work.
- Explain why the Places filters live in the query string, and how the default sort is defined.

## Key questions

| Question | What a strong answer includes |
|----------|-------------------------------|
| What are the flags? | `no-photo`, `blocked-url`, `unreviewed`, `missing-alt`, judged on the primary photo, worst first (`PhotoHealth.Flags`). |
| What makes a URL blocked? | `PlacePhotoReader.IsAllowed`: not HTTPS, or origin not in `Saturdaze:Images:AllowedOrigins`, the same rule the family app projects through. |
| Why do card counts match the list? | `GetPhotoHealthQueryHandler` and `ListAdminPlacesQueryHandler` both call `PhotoHealth.Flags`; links go to `/places?kind=…&flag=…`. |
| What is the default sort? | `PhotoHealth.Severity` then name, ignoring case: no photo, blocked, unreviewed, missing alt, healthy. |
| Why the query string? | The page reads its query from `queryParamMap` and writes changes through the router; health links work and views are shareable. |

## Code / assets on screen

| File | What to show |
|------|--------------|
| `backend/src/Saturdaze.Domain/Entities/PhotoHealth.cs` | `Flags`, `Severity` |
| `backend/src/Saturdaze.Application/Photos/PlacePhotoReader.cs` | `IsAllowed` |
| `backend/src/Saturdaze.Application/Admin/Photos/GetPhotoHealthQueryHandler.cs` | The counting loop |
| `frontend/projects/admin/src/app/pages/places/places.page.ts` | URL as the source of truth, debounced search |
| `backend/src/Saturdaze.Application/Admin/Photos/ListAdminPlacesQueryHandler.cs` | Flag/source filters and the sort |
| `clips/health.mp4`, `worst-first.mp4`, `drill-down.mp4`, `search.mp4`, `filters.mp4` | Screen recordings |

## Run sheet

| Time | Segment | Content |
|------|---------|---------|
| 00:00-00:34 | Introduction | Two screens, one evaluation |
| 00:35-02:05 | Health flags | The four flags, `IsAllowed`, severity |
| 02:06-03:17 | Photo health | Stat cards, worst first, drill-down links, the counting loop |
| 03:18-05:14 | Places | Search, filters, sort; URL state; the server's default sort |
| 05:15-05:56 | Recap | Things to remember; next video |

## Demo commands

```powershell
node tools/video-record/record-clips.mjs docs/videos/13-photo-health-and-finding-places
# The same queries by hand (admin bearer token required):
#   GET /api/admin/photo-health
#   GET /api/admin/places?kind=Restaurant&flag=no-photo
```

## Pitfalls

- An image origin missing from `Saturdaze:Images:AllowedOrigins` makes every photo on it count as blocked.
- The events card counts only events starting today or later.
- Filters combine: clear a chip before concluding a place is missing.

## References

- `docs/specs/L2.md` (L2-112, L2-113); `docs/detailed-designs/administration/manage-place-photos/README.md`
- [Angular `ActivatedRoute`](https://angular.dev/api/router/ActivatedRoute)
