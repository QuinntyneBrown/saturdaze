# 19 · Email templates: the catalog and new templates

> **Runtime:** ~6.7 min · **Audience:** administrators and developers of Saturdaze Admin · **Prerequisites:** video 12 (the admin app); video 18 helps (account emails)

**Video:** [19-email-templates-catalog-and-new.mp4](19-email-templates-catalog-and-new.mp4) · [Slides](slides.html) · **Audio:** [19-email-templates-catalog-and-new.mp3](19-email-templates-catalog-and-new.mp3) · [Transcript](script.md) · [Clips](clips/clips.mjs)

## Why this video exists

Saturdaze Admin now manages the email templates Saturdaze sends (L1-037). This first video of three explains what a template is, the two system templates `saturdaze seed` creates (L2-124), the Email templates screen (A8, L2-125), and creating or duplicating a template through AD7 (L2-126).

## Learning objectives

By the end, the viewer can:

- Name a template's content, its key, category and status, and which of them never change.
- Explain why the two account templates are system templates and what that forbids.
- Find a template by category, status or search, and share a filtered list.
- Create a template from its category's starter, or duplicate an existing one.

## Key questions

| Question | What a strong answer includes |
|----------|-------------------------------|
| What is a template? | Subject, preheader, HTML and text bodies with `{{placeholders}}`; key (unique, fixed, `^[a-z0-9]+(?:[.-][a-z0-9]+)*$`, 100 chars); category (5, fixed); status (Draft, Active, Archived); sample data; system flag; version. |
| Where do system templates come from? | `EmailTemplateSeeder` reads `email-templates.json`, inserts missing keys only, Active, version 1, author "Saturdaze". |
| What can't a system template do? | Be archived or deleted, or drop `{{verificationLink}}` / `{{resetLink}}` from either body. |
| What does a new template start with? | `EmailTemplateStarters.For(category)`; marketing carries `{{unsubscribeUrl}}` in both bodies; Draft, version 1, first revision written. |
| What does Duplicate copy? | Subject, preheader, bodies, sample data; category locked; new key; never the system flag. |

## Code / assets on screen

| File | What to show |
|------|--------------|
| `backend/src/Saturdaze.Domain/Entities/EmailTemplate.cs` | Key, category, status, version |
| `backend/src/Saturdaze.Cli/Seed/EmailTemplateSeeder.cs`, `Seed/Data/email-templates.json` | Insert-only seeding |
| `backend/src/Saturdaze.Application/Admin/EmailTemplates/EmailTemplateStarters.cs` | Starter subjects |
| `backend/src/Saturdaze.Application/Admin/EmailTemplates/CreateEmailTemplateCommand.cs` | Key check, starter or duplicate, first revision |
| `clips/list.mp4`, `new.mp4`, `taken.mp4`, `duplicate.mp4` | Screen recordings |

## Run sheet

| Time | Segment | Content |
|------|---------|---------|
| 00:00-01:04 | Introduction | The gap video 18 left; the five kinds of email; nothing sends yet |
| 01:05-01:58 | What a template is | Content, placeholders, key, category, status, version |
| 01:59-02:45 | System templates | Seeder, insert only, what they keep |
| 02:46-03:35 | The list | Rows, chips, filters in the URL, search |
| 03:36-04:42 | Creating | AD7, key suggestion, starters, a taken key |
| 04:43-05:14 | Duplicating | Copy of …, locked category, ordinary draft |
| 05:15-05:48 | Under the hood | List and create endpoints |
| 05:49-06:42 | Recap | Things to remember; next video |

## Demo commands

```sh
# A separate demo database; the API under recording must use the same one.
export SD_EMAIL_DEMO_CONNECTION="Server=(localdb)\\MSSQLLocalDB;Database=SaturdazeEmailDemo;Trusted_Connection=True;TrustServerCertificate=True"
export SD_DEMO_RESET="node tools/video-record/email-demo/reset.mjs"
node tools/video-record/record-clips.mjs docs/videos/19-email-templates-catalog-and-new
```

See `tools/video-record/email-demo/README.md` for starting the API against the demo database.

## Pitfalls

- A key cannot be renamed later; choose it for the sender that will look it up (`notify.weekend-ready`, not `test2`).
- Reseeding never restores a system template's original wording; that is deliberate (an administrator's edit wins).
- Nothing sends a template yet (drift audit G01); Active means available to a future sender.

## References

- `docs/specs/L2.md` (L2-124 to L2-126); `docs/detailed-designs/administration/manage-email-templates/README.md`
- Mocks: `docs/mocks/pages/admin.emails.html`, `docs/mocks/pages/dialogs.html#dialog-admin-new-template`
