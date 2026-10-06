# 17 · The photo activity log

> **Runtime:** ~4.4 min · **Audience:** curators and developers of Saturdaze Admin · **Prerequisites:** videos 14-16

**Video:** [17-the-photo-activity-log.mp4](17-the-photo-activity-log.mp4) · [Slides](slides.html) · **Audio:** [17-the-photo-activity-log.mp3](17-the-photo-activity-log.mp3) · [Transcript](script.md) · [Clips](clips/clips.mjs)

## Why this video exists

Every admin photo change is audited (L2-122). This short video explains what a `PhotoAuditEntry` holds, how `PhotoAuditWriter` commits it with the change, what each action records, and how the Activity log screen (A7) reads and filters it.

## Learning objectives

By the end, the viewer can:

- List what every audit entry records, and what it deliberately never records.
- Explain why the entry and the change commit together.
- Read the Activity log and filter it by place or administrator.

## Key questions

| Question | What a strong answer includes |
|----------|-------------------------------|
| What is recorded? | Admin id and email, UTC time, place kind and id, photo id, action (upload, addUrl, edit, primary, remove, review), before/after JSON. |
| What is never recorded? | The uploaded file's name or content; uploads record address, bytes and dimensions. |
| How is it written? | `PhotoAuditWriter.Write` adds the entry to the unit of work; the handler's save commits both; it refuses to write without an administrator. |
| How is it ordered? | `OccurredAt` then the database `Sequence`, newest first, 50 per page; place names looked up when read. |

## Code / assets on screen

| File | What to show |
|------|--------------|
| `backend/src/Saturdaze.Domain/Entities/PhotoAuditEntry.cs` | The entry |
| `backend/src/Saturdaze.Application/Admin/Photos/PhotoAuditWriter.cs` | `Write` |
| `backend/src/Saturdaze.Application/Admin/Photos/ListPhotoAuditQueryHandler.cs` | Filters, order, paging |
| `clips/log.mp4`, `filters.mp4` | Screen recordings |

## Run sheet

| Time | Segment | Content |
|------|---------|---------|
| 00:00-00:29 | Introduction | Questions the log answers |
| 00:30-02:13 | What gets recorded | The entry, the writer, before/after per action |
| 02:14-03:43 | Activity log | The screen, filters, the query |
| 03:44-04:24 | Recap | Things to remember; end of series |

## Demo commands

```powershell
$env:SD_DEMO_RESET = "node tools/video-record/admin-demo/reset.mjs"
node tools/video-record/record-clips.mjs docs/videos/17-the-photo-activity-log
# The clip setup makes six changes through the admin API as two administrators first.
```

## Pitfalls

- Changes made outside the admin API (seeding, ingestion, SQL) are not in this log; ingestion has `IngestionRuns`.
- Times are UTC; compare with local time deliberately.

## References

- `docs/specs/L2.md` (L2-122); `docs/detailed-designs/administration/manage-place-photos/README.md`
