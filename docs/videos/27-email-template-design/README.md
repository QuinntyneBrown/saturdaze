# 27 · Email template administration: the detailed design

> **Runtime:** ~9.1 min · **Audience:** developers and reviewers of Saturdaze Admin · **Prerequisites:** videos 24 to 26 help (the screens); video 18 (account emails)

**Video:** [27-email-template-design.mp4](27-email-template-design.mp4) · [Slides](slides.html) · **Audio:** [27-email-template-design.mp3](27-email-template-design.mp3) · [Transcript](script.md)

## Why this video exists

Videos 24 to 26 show the email template screens as built. This video explains the detailed design behind them, `docs/detailed-designs/administration/manage-email-templates/README.md`, as revised on 2026-10-09 to write templates in Liquid rendered with Fluid (ADR-017, L2-137). It walks the C4 views, the class diagram and the three sequence diagrams, the rules that keep templates safe, and the traceability to L1-038 and L2-130 to L2-137. Where the code is still catching up with the Liquid revision, the design document is the source of truth.

## Learning objectives

By the end, the viewer can:

- State what the feature is for, its key terms, and what is out of scope.
- Read the context, container and component views and name the services the handlers share.
- Describe `EmailTemplate`, `EmailTemplateRevision` and how `Version` serves as the concurrency token.
- Walk through create or duplicate, edit with preview and save, and status, history and delete.
- Explain the Liquid profile, the three layers that keep HTML inert, required placeholders and the six error codes.
- Trace each part of the design to its requirement and its tests.

## Key questions

| Question | What a strong answer includes |
|----------|-------------------------------|
| Why does the feature exist? | Account emails are drafted with no editable wording and no provider (G01); one managed home; a later sender finds an Active template by key. |
| What are the containers? | Saturdaze Admin (Angular), Saturdaze API behind the `Admin` policy, SQL Server, and the CLI whose `seed` inserts missing system templates without overwriting. |
| What protects concurrent edits? | `Version` starts at 1, +1 per change, sent back on save and status change; a mismatch is 409 `template_stale`; it is also the EF Core concurrency token, so a lost race is `template_stale` too. |
| What is a revision? | An immutable snapshot (version, action `Create`/`Edit`/`Status`, status, content, sample data, UTC time, administrator) written in the same save; deleted with its template by cascade. |
| What does the Liquid profile forbid? | Unknown filters, `include` and `render`, `raw` in the HTML body (`unsafe_html`), more than 10 000 steps; syntax errors name field, line and column; sample data capped at 100 names and 20 000 characters. |
| How is HTML kept inert? | Deny-list in `EmailTemplateRules`; `HtmlEncoder.Default` for values in the HTML body; `<iframe sandbox>` without `allow-scripts` or `allow-same-origin` and a CSP allowing only HTTPS images and fonts. |
| What are required placeholders? | `verificationLink`, `resetLink`, `unsubscribeUrl` for marketing; found by walking the parsed template; missing from either body → 400 `missing_placeholder`. |
| How does it trace? | L1-038 refined by L2-130 to L2-137; sequence arrows cite acceptance criteria; API, CLI and Playwright tests. |

## Code / assets on screen

| File | What to show |
|------|--------------|
| `docs/detailed-designs/administration/manage-email-templates/README.md` | Terms, handler table, services, frontend, tests, requirements |
| `docs/detailed-designs/administration/manage-email-templates/diagrams/c4-context.png` | System context (legend cropped) |
| `docs/detailed-designs/administration/manage-email-templates/diagrams/c4-container.png` | Containers (legend cropped) |
| `docs/detailed-designs/administration/manage-email-templates/diagrams/c4-component.png` | Front-end half, then back-end half |
| `docs/detailed-designs/administration/manage-email-templates/diagrams/class-structure.png` | `EmailTemplate`, `EmailTemplateRevision` and enums |
| `docs/detailed-designs/administration/manage-email-templates/diagrams/sequence-create.png` | Create or duplicate |
| `docs/detailed-designs/administration/manage-email-templates/diagrams/sequence-edit-preview.png` | Preview and save |
| `docs/detailed-designs/administration/manage-email-templates/diagrams/sequence-lifecycle-history.png` | Status, history, delete |
| `docs/adr/ADR-017-liquid-email-templates.md` | Why Liquid and Fluid; the restricted profile |
| `docs/specs/L1.md` (L1-038), `docs/specs/L2.md` (L2-130 to L2-137) | Traceability table; L2-137 acceptance criteria as refused examples |

The slides reference the diagram PNGs in place (`../../detailed-designs/…/diagrams/*.png`) and crop them with `object-view-box` through the `figure.diagram` class in `../assets/slides.css`.

## Run sheet

| Time | Segment | Content |
|------|---------|---------|
| 00:00-00:24 | Introduction | What the video covers; the Liquid revision |
| 00:25-01:22 | Purpose and scope | Why, the terms, out of scope |
| 01:23-01:44 | System context | Administrator, Saturdaze, the future provider |
| 01:45-02:12 | Containers | Admin app, API, SQL Server, CLI seed |
| 02:13-03:09 | Components | Front end, nine routes and handlers, application services |
| 03:10-03:49 | Data model | Template, revisions, `Version`, persistence |
| 03:50-04:21 | Create or duplicate | Key check, starter or source, first revision |
| 04:22-05:16 | Edit, preview and save | Debounced preview; save with optimistic concurrency |
| 05:17-06:02 | Status, history and delete | `system_template`, Load into editor, cascade and log |
| 06:03-06:51 | Liquid profile | ADR-017; the restricted profile |
| 06:52-07:55 | Keeping HTML inert | Three layers, required placeholders, six codes |
| 07:56-08:28 | Requirements traceability | L1-038, L2-130 to L2-137, tests |
| 08:29-09:04 | Recap | Things to remember; video 25 to be re-recorded |

## Demo commands

```sh
node tools/video-audio/generate-audio.mjs docs/videos/27-email-template-design --dry-run
node tools/video-audio/generate-audio.mjs docs/videos/27-email-template-design
node tools/video-build/build-video.mjs docs/videos/27-email-template-design --check
node tools/video-build/build-video.mjs docs/videos/27-email-template-design --slides-only
node tools/video-build/build-video.mjs docs/videos/27-email-template-design
```

## Pitfalls

- The video follows the design as documented on 2026-10-09; until the Liquid implementation lands, the running app may still show the earlier `{{name}}`-only placeholders (videos 24 and 25).
- The diagrams are shown from their PNGs; regenerate the PNGs from the PUML before rebuilding the video if the design changes, and re-check the crops.
- The deny-list is a check at authoring time; the sandboxed frame is the second line of defence, and a future sender should send only Active, checked content.

## References

- `docs/detailed-designs/administration/manage-email-templates/README.md` and `diagrams/`
- `docs/adr/ADR-017-liquid-email-templates.md`
- `docs/specs/L1.md` (L1-038), `docs/specs/L2.md` (L2-130 to L2-137)
- Liquid template language: https://shopify.github.io/liquid/ · Fluid: https://github.com/sebastienros/fluid
