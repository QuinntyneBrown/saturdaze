# 20 · Editing and previewing email templates

> **Runtime:** ~8.2 min · **Audience:** administrators and developers of Saturdaze Admin · **Prerequisites:** video 19

**Video:** [20-editing-and-previewing-email-templates.mp4](20-editing-and-previewing-email-templates.mp4) · [Slides](slides.html) · **Audio:** [20-editing-and-previewing-email-templates.mp3](20-editing-and-previewing-email-templates.mp3) · [Transcript](script.md) · [Clips](clips/clips.mjs)

## Why this video exists

The editor (A9) is where template content is written, and the preview is where an administrator sees exactly what a sender would send. This video covers saving with the version check (L2-127), placeholders and sample data, the live preview and its renderer (L2-128), the two layers that keep administrator-written HTML inert, the placeholders a template must keep, and the stale-save flow.

## Learning objectives

By the end, the viewer can:

- Edit and save a template, and read what the version and the Unsaved changes chip mean.
- Write valid placeholders, use the six built-ins, and give the rest sample values.
- Read the preview at desktop and phone widths and as plain text, and spot a missing sample.
- Explain why template HTML cannot run script, in the API and in the admin app.
- Recover from a stale save.

## Key questions

| Question | What a strong answer includes |
|----------|-------------------------------|
| What is a valid placeholder? | `{{name}}`; letters, digits, underscores in dot-separated parts, each starting with a letter; spaces just inside the braces allowed; otherwise `invalid_placeholder`. |
| Which placeholders need no sample? | `appName`, `appUrl`, `recipientName`, `recipientEmail`, `unsubscribeUrl`, `currentYear`. |
| How is a preview rendered? | `EmailTemplateRenderer`: sample, else built-in, else empty; values HTML-encoded in the HTML body only; placeholders listed once with their source. |
| What keeps HTML inert? | `EmailTemplateRules.CheckHtml` on save and preview (`unsafe_html`); the preview's `<iframe sandbox="">` and CSP. |
| What must a template keep? | System: `{{verificationLink}}` / `{{resetLink}}`; marketing: `{{unsubscribeUrl}}`; both bodies; else `missing_placeholder`. |
| What stops lost updates? | The loaded `version` on every save, `template_stale` (409), `Version` as the EF concurrency token; Reload. |

## Code / assets on screen

| File | What to show |
|------|--------------|
| `backend/src/Saturdaze.Application/Admin/EmailTemplates/EmailTemplateRenderer.cs` | Resolve and Fill |
| `backend/src/Saturdaze.Application/Admin/EmailTemplates/EmailTemplateRules.cs` | `CheckHtml`, the placeholder name pattern |
| `frontend/projects/components/src/lib/email-preview/` | The sandboxed frame and its CSP |
| `backend/src/Saturdaze.Application/Admin/EmailTemplates/SaveEmailTemplateCommand.cs` | `EmailTemplateConcurrency` |
| `clips/editor.mp4`, `preview.mp4`, `refused.mp4`, `required.mp4`, `stale.mp4` | Screen recordings |

## Run sheet

| Time | Segment | Content |
|------|---------|---------|
| 00:00-00:27 | Introduction | What the video covers |
| 00:28-01:28 | The editor | Header, form, Save only when changed, version |
| 01:29-02:38 | Placeholders | Syntax, built-ins, sample data |
| 02:39-03:35 | The preview | Inbox line, widths, plain text, sources |
| 03:36-04:21 | Rendering | The renderer; HTML encoding |
| 04:22-05:49 | Keeping HTML inert | The check, a refusal, the sandboxed frame |
| 05:50-06:21 | Required placeholders | System link, marketing unsubscribe |
| 06:22-07:07 | Two administrators | The version check, a stale save, Reload |
| 07:08-08:14 | Recap | Things to remember; next video |

## Demo commands

```sh
export SD_EMAIL_DEMO_CONNECTION="…;Database=SaturdazeEmailDemo;…"
export SD_DEMO_RESET="node tools/video-record/email-demo/reset.mjs"
node tools/video-record/record-clips.mjs docs/videos/20-editing-and-previewing-email-templates
# `stale` saves the holiday greeting as jo.curator@saturdaze.app mid-clip through the admin API.
```

## Pitfalls

- The built-in `appUrl` follows configuration (`Saturdaze:Email:AppUrl`, else `Saturdaze:Share:AppOrigin`); on a developer machine it is a localhost address.
- The HTML check is a deny-list at authoring time; keep the preview frame sandboxed and send only active, checked content.
- A status change also bumps the version, so an editor left open across an Activate elsewhere goes stale too.

## References

- `docs/specs/L2.md` (L2-127, L2-128); `docs/detailed-designs/administration/manage-email-templates/README.md`
- MDN: [`<iframe sandbox>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#sandbox), [Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
