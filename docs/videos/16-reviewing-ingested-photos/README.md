# 16 · Reviewing ingested photos

> **Runtime:** ~5.8 min · **Audience:** curators and operators of catalog ingestion · **Prerequisites:** video 14; video 07 for the ingestion pipeline

**Video:** [16-reviewing-ingested-photos.mp4](16-reviewing-ingested-photos.mp4) · [Slides](slides.html) · **Audio:** [16-reviewing-ingested-photos.mp3](16-reviewing-ingested-photos.mp3) · [Transcript](script.md) · [Clips](clips/clips.mjs)

## Why this video exists

Ingestion stores provider photos nobody chose. This video covers the loop around them (L2-120, L2-121): the Review queue (A5) with Keep, Make primary and Reject (AD6), how a rejection is remembered so ingestion never stores the address again, the Ingestion photo skips screen (A6), and how seeding honours administrator locks.

## Learning objectives

By the end, the viewer can:

- Explain where unreviewed provider photos come from and why families may already see them.
- Review a photo with Keep, Make primary or Reject, and say what each does to the data.
- Explain how `RejectedPlacePhoto` and `CatalogUpserter` make a rejection stick.
- Read the Ingestion photo skips screen.
- Explain how `SeedPhotos.Apply` and ingestion respect `AdminLocked`.

## Key questions

| Question | What a strong answer includes |
|----------|-------------------------------|
| Why can an unreviewed photo be live? | Ingestion makes the first stored photo primary when a place has none; the health screen flags it. |
| What do the three decisions do? | Keep: reviewed + locked. Primary: also the only primary (cover impact shown first). Reject: row deleted, `RejectedPlacePhoto` recorded, default primary restored if it was primary. |
| How does a rejection stick? | `CatalogUpserter` loads the place's rejected URLs and skips matches with "previously rejected" in the run's skip reasons. |
| What does the skips screen show? | Runs newest first: type, UTC start, status; place, reason, address; links only for places that exist uniquely. |
| How does seeding behave? | Locked photos keep their details; a locked primary keeps the place's primary; seeding stays idempotent. |

## Code / assets on screen

| File | What to show |
|------|--------------|
| `backend/src/Saturdaze.Application/Ingestion/CatalogUpserter.cs` | `Unreviewed` on create; the rejected-URL check |
| `backend/src/Saturdaze.Application/Admin/Photos/ReviewPhotoCommandHandler.cs` | The decision switch; `RejectAsync` |
| `backend/src/Saturdaze.Domain/Entities/RejectedPlacePhoto.cs` | The remembered address |
| `backend/src/Saturdaze.Application/Admin/Photos/ListIngestionPhotoSkipsQueryHandler.cs` | The `SkipLine` pattern |
| `backend/src/Saturdaze.Cli/Seed/SeedPhotos.cs` | `AdminLocked` checks |
| `clips/queue.mp4`, `reject.mp4`, `skips.mp4` | Screen recordings |

## Run sheet

| Time | Segment | Content |
|------|---------|---------|
| 00:00-00:39 | Introduction | The review loop |
| 00:40-01:18 | Provider photos | Review state; why unreviewed photos can be live |
| 01:19-02:31 | Review queue | Keep, Make primary; one endpoint |
| 02:32-03:45 | Rejections stick | Reject with a reason; `RejectAsync`; the upserter check |
| 03:46-04:34 | Photo skips | The skips screen; one line format at both ends |
| 04:35-05:06 | Seeding | `SeedPhotos.Apply` and the lock |
| 05:07-05:50 | Recap | Things to remember; next video |

## Demo commands

```powershell
$env:SD_DEMO_RESET = "node tools/video-record/admin-demo/reset.mjs"
node tools/video-record/record-clips.mjs docs/videos/16-reviewing-ingested-photos
```

The restaurants run on the skips screen is staged by the clip's setup (`stageIngestionRun` in `tools/video-record/admin-demo/demo-env.mjs`) with exactly the line `CatalogUpserter` writes, because only a live Claude run would produce it.

## Pitfalls

- Reviewing an already reviewed photo is a 409 `already_reviewed`.
- Rejecting a place's only photo leaves it with no photo; that is intended.
- A rejection is per place and per exact URL: the same image at another address is a new candidate.

## References

- `docs/specs/L2.md` (L2-120, L2-121); `docs/detailed-designs/administration/review-ingested-photos/README.md`
- Video 07: [How Saturdaze uses AI](../07-how-saturdaze-uses-ai/README.md); video 11: [ingestion cadence](../11-event-ingestion-workflow-and-cadence/README.md)
