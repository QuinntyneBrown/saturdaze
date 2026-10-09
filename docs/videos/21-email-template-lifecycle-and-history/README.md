# 21 · Email template lifecycle and history

> **Runtime:** ~6.1 min · **Audience:** administrators and developers of Saturdaze Admin · **Prerequisites:** videos 19 and 20

**Video:** [21-email-template-lifecycle-and-history.mp4](21-email-template-lifecycle-and-history.mp4) · [Slides](slides.html) · **Audio:** [21-email-template-lifecycle-and-history.mp3](21-email-template-lifecycle-and-history.mp3) · [Transcript](script.md) · [Clips](clips/clips.mjs)

## Why this video exists

A template moves from draft to active to archived, can be deleted, and keeps a revision for every change (L2-129, L2-130). This last video of the series shows those flows in A9, AD8 and AD9, the rules the API enforces for system templates, and the contract a future sender will rely on.

## Learning objectives

By the end, the viewer can:

- Move a template between Draft, Active and Archived, and explain what each status means.
- Explain why system templates offer neither Archive nor Delete, and where that is enforced.
- Choose between Archive and Delete, knowing what Delete takes with it.
- Read a template's history and bring back an older version without rewriting the past.
- State what a sender must do with a template.

## Key questions

| Question | What a strong answer includes |
|----------|-------------------------------|
| What does a status change do? | `POST …/{id}/status { status, version }`; version + 1; a `Status` revision; same status writes nothing; stale version → `template_stale`. |
| What can't a system template do? | Any status but Active, or deletion: 400 `system_template`, in the API as well as the screen. |
| What does Delete remove? | The template and, by cascade, its revisions; a log line keeps the key, id and administrator. |
| What is a revision? | Version, action (create, edit, status), status, name, subject, preheader, bodies, sample data, UTC time, administrator; written in the same save as the change. |
| How is an old version restored? | Load into editor puts it in the form unsaved; Save makes it the next version. |
| What does a sender need? | Look up by key, require Active, render with `EmailTemplateRenderer` and real values. |

## Code / assets on screen

| File | What to show |
|------|--------------|
| `backend/src/Saturdaze.Application/Admin/EmailTemplates/ChangeEmailTemplateStatusCommand.cs` | System rule, version check, no-op, revision |
| `backend/src/Saturdaze.Application/Admin/EmailTemplates/DeleteEmailTemplateCommand.cs` | Cascade and log line |
| `backend/src/Saturdaze.Application/Admin/EmailTemplates/EmailTemplateRevisionWriter.cs` | The snapshot |
| `backend/src/Saturdaze.Api/Controllers/AdminEmailTemplatesController.cs` | The nine routes |
| `clips/lifecycle.mp4`, `system.mp4`, `delete.mp4`, `history.mp4` | Screen recordings |

## Run sheet

| Time | Segment | Content |
|------|---------|---------|
| 00:00-00:27 | Introduction | What the video covers |
| 00:28-01:39 | Draft, active, archived | Statuses, a recorded walk through all three, the endpoint |
| 01:40-02:08 | System templates | Always active, enforced in the API |
| 02:09-02:54 | Deleting | AD8, cascade, the log line |
| 02:55-04:28 | Revision history | The snapshot, AD9, loading v1, the API |
| 04:29-05:17 | What a sender needs | Key, Active, the renderer; later capabilities |
| 05:18-06:05 | Recap | Things to remember; end of series |

## Demo commands

```sh
export SD_EMAIL_DEMO_CONNECTION="…;Database=SaturdazeEmailDemo;…"
export SD_DEMO_RESET="node tools/video-record/email-demo/reset.mjs"
node tools/video-record/record-clips.mjs docs/videos/21-email-template-lifecycle-and-history
```

## Pitfalls

- Delete cannot be undone and takes the history with it; prefer Archive unless the template must go.
- A status change bumps the version: an editor open elsewhere goes stale and must Reload.
- Loading a revision does not restore the description; revisions snapshot the content and name.

## References

- `docs/specs/L2.md` (L2-129, L2-130); `docs/detailed-designs/administration/manage-email-templates/README.md`
- Mocks: `docs/mocks/pages/admin.email.html`, `docs/mocks/pages/dialogs.html#dialog-admin-delete-template`, `#dialog-admin-template-history`
