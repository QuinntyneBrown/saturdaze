# 14 · Managing a place's photos

> **Runtime:** ~6.7 min · **Audience:** curators and developers of Saturdaze Admin · **Prerequisites:** videos 12-13

**Video:** [14-managing-a-places-photos.mp4](14-managing-a-places-photos.mp4) · [Slides](slides.html) · **Audio:** [14-managing-a-places-photos.mp3](14-managing-a-places-photos.mp3) · [Transcript](script.md) · [Clips](clips/clips.mjs)

## Why this video exists

The Place photos screen (A4) is where a curator works on one place: the slot previews, the photo tiles, Make primary (AD4), Edit details (AD3) and Remove (AD5). This video records each action live and shows the handlers behind them, including the two-step primary write and the lock every admin change applies (L2-114, L2-117, L2-118, L2-119, L2-121).

## Learning objectives

By the end, the viewer can:

- Read the Place photos screen: cover impact, slot previews, tile badges and details.
- Explain how exactly one primary is kept, in the domain and in the database.
- Edit photo details and explain which fields are mandatory and why the URL is immutable.
- Remove a primary photo and explain `next_primary_required` and `next_primary_invalid`.
- Explain what `AdminPhotoTouch` does and why it matters to seeding and ingestion.

## Key questions

| Question | What a strong answer includes |
|----------|-------------------------------|
| What is the cover impact? | The number of weekends whose `CoverSource = Stop` cover follows the place; a number only, no weekend or family ids (ADR-008). |
| How is one primary guaranteed? | `PlacePhotoSet.MarkPrimary` plus a filtered unique index; `PrimaryPhotoWriter` clears first, then promotes, in two saves. |
| What can Edit change? | Alt text, attribution, licence; attribution and licence required (validator → 400); the command has no URL. |
| What does removing a primary need? | `nextPrimaryId` (a sibling or `none`); default in the dialog: first curated, else first reviewed provider; curated file deleted by `StorageKey`. |
| What does every admin change do? | `AdminPhotoTouch`: `AdminLocked = true`, `Reviewed`, `UpdatedAt`, `UpdatedBy`; audit entry written. |

## Code / assets on screen

| File | What to show |
|------|--------------|
| `backend/src/Saturdaze.Application/Admin/Photos/AdminPhotoDtos.cs` | `AdminPhotoDto`, `PlacePhotosDto` |
| `backend/src/Saturdaze.Application/Admin/Photos/MakePhotoPrimaryCommandHandler.cs` | Touch, audit, write |
| `backend/src/Saturdaze.Domain/Entities/PlacePhotoSet.cs`, `.../Admin/Photos/PrimaryPhotoWriter.cs` | One rule, two saves |
| `backend/src/Saturdaze.Application/Admin/Photos/AdminPhotoTouch.cs` | The lock |
| `backend/src/Saturdaze.Application/Admin/Photos/EditPhotoDetailsCommand.cs` | Validator |
| `backend/src/Saturdaze.Application/Admin/Photos/RemovePhotoCommandHandler.cs` | Next-primary rules |
| `clips/place.mp4`, `tiles.mp4`, `make-primary.mp4`, `edit.mp4`, `remove.mp4` | Screen recordings |

## Run sheet

| Time | Segment | Content |
|------|---------|---------|
| 00:00-00:41 | Introduction | What you can do with a place's photos |
| 00:42-02:11 | Place photos | Header and cover impact, slot previews, tiles, the DTO |
| 02:12-03:51 | Primary | Make primary dialog, handler, two-step write, `AdminPhotoTouch` |
| 03:51-04:59 | Edit | Missing alt text, the Edit dialog, the validator |
| 04:59-05:57 | Remove | Choosing the next primary; the handler's guards |
| 05:58-06:43 | Recap | Things to remember; next video |

## Demo commands

```powershell
$env:SD_DEMO_RESET = "node tools/video-record/admin-demo/reset.mjs"
node tools/video-record/record-clips.mjs docs/videos/14-managing-a-places-photos
```

## Pitfalls

- Setting a new primary in the same save that clears the old one trips the filtered unique index.
- Removing a primary without `nextPrimaryId` is a 400 by design; pass `none` to leave no photo.
- An edit locks the photo: seeding will no longer refresh its details.

## References

- `docs/specs/L2.md` (L2-114, L2-117, L2-118, L2-119, L2-121)
- `docs/detailed-designs/administration/manage-place-photos/README.md`
- [EF Core filtered indexes](https://learn.microsoft.com/ef/core/modeling/indexes#index-filter)
