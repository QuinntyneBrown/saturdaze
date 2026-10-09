# Manage email templates

## Overview

Saturdaze is a web application that plans personalized family weekends. The API already drafts two account emails, email verification and password reset, but their wording lives in no editable place and no email provider sends them yet (drift audit gap G01, video 18). Later capabilities add scheduled emails, notifications, special-occasion greetings and marketing. This feature gives those emails one managed home: an administrator writes, previews, versions and retires email templates from Saturdaze Admin (`scaffold-admin-application`), and a later sender looks an active template up by its key.

*email template* — named, categorized email content: a subject, a preheader, an HTML body and a plain-text body

*key* — immutable, unique identifier a sender uses to find a template, such as `account.password-reset`; lowercase words joined by dots or hyphens

*category* — what the template is for: `Account`, `Notification`, `Scheduled`, `SpecialOccasion` or `Marketing`; fixed at creation

*status* — lifecycle state: `Draft` (being written), `Active` (available to senders) or `Archived` (retired, kept for reference)

*Liquid* — the template language subjects, preheaders and bodies are written in (ADR-017): `{{ name }}` outputs a value, `{% if %}` and `{% for %}` add conditions and loops, and filters such as `upcase` or `date` format values

*placeholder* — top-level Liquid variable a template reads from outside, such as `recipientName` or `ideas`, which a sender supplies at send time; variables the template defines itself (`assign`, `capture`, `for`, `tablerow`) are not placeholders

*sample data* — per-template JSON object whose top-level names are placeholders and whose values (text, numbers, booleans, lists, objects) the preview uses in place of real recipient data

*built-in placeholder* — placeholder every template may use without sample data: `appName`, `appUrl`, `recipientName`, `recipientEmail`, `unsubscribeUrl`, `currentYear`

*system template* — template the platform itself depends on (`account.verify-email`, `account.password-reset`); editable, never deleted, archived or left without its required placeholder

*revision* — immutable snapshot of a template written on every create, save and status change

The slice touches no family data. Templates hold content, not recipients; the preview renders sample values only.

## Description

### Domain

`EmailTemplate` (`Saturdaze.Domain/Entities`) carries `Id`, `Key`, `Name`, `Description`, `Category` (`EmailTemplateCategory`), `Status` (`EmailTemplateStatus`), `Subject`, `Preheader`, `HtmlBody`, `TextBody`, `SampleData` (a JSON object of placeholder name to any JSON value), `IsSystem`, `Version`, `CreatedAt`, `CreatedByEmail`, `UpdatedAt`, `UpdatedByEmail` and `UpdatedBy` (nullable administrator id). `Version` starts at 1 and increases by one on every change; it doubles as the optimistic concurrency token.

`EmailTemplateRevision` carries `Id`, `TemplateId`, `Version`, `Action` (`EmailTemplateRevisionAction`: `Create`, `Edit`, `Status`), `Status`, `Name`, `Subject`, `Preheader`, `HtmlBody`, `TextBody`, `SampleData`, `OccurredAt`, `AdminUserId` (null for the seeder) and `AdminEmail`. Revisions are written, never updated, and are deleted with their template.

### Persistence

The migration `AddEmailTemplates` creates `EmailTemplates` with a unique index on `Key` and an index on `(Category, Status)`, and `EmailTemplateRevisions` with a unique index on `(TemplateId, Version)` and a cascading foreign key to the template. Enums are stored as strings. `HtmlBody` and `TextBody` are `nvarchar(max)` bounded by validation at 100 000 and 50 000 characters. The migration applies through `saturdaze migrate`.

`EmailTemplateSeeder` (`Saturdaze.Cli/Seed`, an `IJsonSeeder` over the bundled `email-templates.json`) inserts each system template whose key is missing as `Active`, `IsSystem = true`, version 1, with a version 1 revision. It never changes a template that exists, so an administrator's edits survive every `saturdaze seed`.

### Application

Handlers live in `Saturdaze.Application/Admin/EmailTemplates/`; `AdminEmailTemplatesController` (`api/admin/email-templates`) stays thin and carries `[Authorize(Policy = "Admin")]`.

| Handler | Route | Behaviour |
|---------|-------|-----------|
| `ListEmailTemplatesQueryHandler` | `GET /api/admin/email-templates?q=&category=&status=` | Filters by category and status, matches `q` against name, key and subject ignoring case, orders by name, returns `EmailTemplateSummaryDto` rows. |
| `GetEmailTemplateQueryHandler` | `GET /api/admin/email-templates/{id}` | Returns `EmailTemplateDto` with the content, sample data and `requiredPlaceholders`; 404 for an unknown id. |
| `CreateEmailTemplateCommandHandler` | `POST /api/admin/email-templates` | Validates the key pattern, name and category; refuses an existing key with `template_key_exists`; copies the content from `duplicateOf` or from `EmailTemplateStarters.For(category)`; creates a `Draft` at version 1 and a `Create` revision. |
| `SaveEmailTemplateCommandHandler` | `PUT /api/admin/email-templates/{id}` | Refuses a stale `version` with `template_stale` (through `EmailTemplateConcurrency`, which also turns a lost race on the `Version` token into `template_stale`), checks the content through `EmailTemplateLiquid` and `EmailTemplateRules`, saves name, description, subject, preheader, bodies and sample data, increments the version and writes an `Edit` revision. |
| `PreviewEmailTemplateQueryHandler` | `POST /api/admin/email-templates/preview` | Checks the content as a save would (without required placeholders) and renders it through `EmailTemplateRenderer` without touching the database; a render that exceeds the step limit is refused with `invalid_template`. |
| `ChangeEmailTemplateStatusCommandHandler` | `POST /api/admin/email-templates/{id}/status` | Refuses any status but `Active` for a system template with `system_template`, refuses a stale version, sets the status, increments the version and writes a `Status` revision. |
| `DeleteEmailTemplateCommandHandler` | `DELETE /api/admin/email-templates/{id}` | Refuses a system template with `system_template`; deletes the template and, by cascade, its revisions; logs the key and the administrator id. |
| `ListEmailTemplateRevisionsQueryHandler` | `GET /api/admin/email-templates/{id}/revisions` | Returns revision summaries newest first. |
| `GetEmailTemplateRevisionQueryHandler` | `GET /api/admin/email-templates/{id}/revisions/{version}` | Returns one revision's full content; 404 for an unknown version. |

`EmailTemplateCatalog` holds the fixed knowledge: the system keys and their required placeholders (`verificationLink`, `resetLink`), `unsubscribeUrl` as required for every marketing template, and the wire names of categories and statuses. `EmailTemplateStarters.For(category)` returns the starter content per category. `EmailTemplateLimits` holds the field limits a save and a preview share.

`EmailTemplateLiquid` wraps Fluid (ADR-017). It holds one thread-safe `FluidParser` and the `TemplateOptions` every render uses: Fluid's standard filters, `MaxSteps = 10 000`, and an empty file provider. `Parse(field, text)` returns the parsed template or raises `BadRequestException` with `invalid_template` and a message such as "Subject: End of tag '}}' was expected at (1:12)". `Analyse(template)` walks the syntax tree with a Fluid `AstVisitor` and returns the top-level variables the template reads (the first segment of each member expression, minus names defined by `assign`, `capture`, `for` and `tablerow`, and `forloop`), the filters it uses and whether it uses `include` or `render`. `Check(field, text, html)` parses and analyses one field and refuses an unknown filter or an `include`/`render` with `invalid_template`, and `raw` in the HTML body with `unsafe_html`.

`EmailTemplateRules` keeps the HTML deny-list: `unsafe_html` for `<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>`, `<base>`, an `on…=` attribute or a `javascript:`, `vbscript:` or `data:text/html` URL inside a tag. `CheckRequired` raises `missing_placeholder` when a required variable is not among the variables either body reads, so `{{ resetLink | escape }}` counts as using `resetLink`. The check is a deny-list at the point of authoring; the preview frame's sandbox is the second line of defence, and a future sender should send only active, checked content.

`EmailTemplateRenderer` renders each field with `EmailTemplateLiquid`: the HTML body with `HtmlEncoder.Default`, so every value written into HTML is encoded, and the subject, preheader and text body with `NullEncoder`. The context holds the built-in samples first and the sample data over them, converted from JSON to dictionaries, lists and primitives. It returns the placeholders in order of first use with the value (text, or JSON for a list or object) and its source (`sample`, `builtin`, `missing`). `EmailTemplateRenderer.BuiltIns()` supplies the built-in samples; `appUrl` comes from `EmailPreviewOptions.AppUrl`, bound from `Saturdaze:Email:AppUrl` and else `Saturdaze:Share:AppOrigin`. The renderer has no database dependency, so a sender can reuse it.

`SampleDataRules` bounds the sample data: a JSON object of at most 100 top-level names, each a Liquid identifier, serialising to at most 20 000 characters; a violation is a 400 field error on `sampleData`.

`EmailTemplateRevisionWriter` is the one place that creates revisions, reading the administrator from `ICurrentUserAccessor`. FluentValidation validators bound name (120), description (500), subject (1 to 200), preheader (200), HTML body (1 to 100 000) and text body (1 to 50 000); the exception middleware returns 400 with field errors.

### Frontend

`api` gains `IAdminEmailTemplatesService` with the `ADMIN_EMAIL_TEMPLATES_SERVICE` token and the HTTP implementation `AdminEmailTemplatesService` (`list`, `get`, `create`, `save`, `preview`, `setStatus`, `remove`, `revisions`, `revision`), the DTOs (`email-template.dto.ts`) and the view models (`EmailTemplateRow`, `EmailTemplateView`, `EmailPreviewView`, `EmailRevisionRow`). The admin composition root binds the token.

`AdminNavKey` gains `emails` ("Email templates", `mail` icon, `/email-templates`), so `sd-admin-nav` shows the destination in the side navigation and the top bar.

Pages in `projects/admin/src/app/pages/`:

- `EmailTemplatesPage` (A8, `/email-templates`) lists templates as `sd-list-item` rows with category, status and system chips and the last change, with a search box and Category and Status selects reflected in the query string. "New template" opens AD7.
- `EmailTemplatePage` (A9, `/email-templates/:id`) is the editor screen: a form for name, description, subject, preheader, HTML body, text body and the sample data as one JSON field (checked in the browser to be a JSON object before any request is sent), beside a sticky `sd-email-preview` from 1200 px and below it under 1200 px. The header shows the key, category, version and last change and offers Save changes, History, Activate, Archive or Restore as draft, Duplicate and Delete according to the status and the system flag; the status, System and Unsaved changes chips sit directly under it, followed by the note that explains a template's required placeholders. The bodies use the `code` option of `sd-text-input` (monospace, no wrapping, no spellcheck), added for this screen with its own story. Edits trigger a preview 300 ms after the last keystroke.

Dialogs in `projects/admin/src/app/dialogs/`: `NewTemplateDialog` (AD7: name, key with a suggestion from the name, category, description; also the Duplicate flow), `DeleteTemplateDialog` (AD8: names the template, Delete template) and `TemplateHistoryDialog` (AD9: revisions newest first, Load into editor). Each opens through CDK `Dialog` with the shared `DIALOG_OPTIONS`.

`components` gains `sd-email-preview` (`EmailPreview`) with a story folder (ADR-012) and a perf-test scenario (ADR-014) that renders 50 copies, since each copy is an iframe with its own document. It shows the subject and preheader as an inbox line, an `<iframe sandbox>` with no `allow-scripts` or `allow-same-origin` whose `srcdoc` holds the rendered HTML, a Width switch (Desktop 600 px, Phone 375 px) and a Format switch (HTML, Plain text) built on `sd-seg-radio`, and the placeholder list with missing values flagged. The frame's document carries a Content-Security-Policy that blocks scripts and every fetch but HTTPS images and fonts.

### Tests

`Saturdaze.Api.Tests/Admin/EmailTemplates/` covers each endpoint with the seeded system templates: access (401, 403), list filters, create (starter, duplicate, 409, 400), save (version, `template_stale`, `unsafe_html`, `invalid_template`, `missing_placeholder`), preview (sample, built-in, missing, HTML encoding), the Liquid profile (conditions, loops, filters, unknown filters, `include`, `raw`, the step limit, JSON sample data), status and delete rules, and revisions. `Saturdaze.Cli.Tests` covers the seeder's insert-only behaviour. `e2e/tests/admin/email-templates.spec.ts` and `email-template-{create,edit,preview,lifecycle,history}.spec.ts` drive A8, A9 and AD7 to AD9 through `e2e/pages/admin/admin-email-templates.page.ts` and `admin-email-template.page.ts`; `e2e/fixtures/email-templates.ts` creates a template per test through the API so no spec depends on data an earlier run left behind.

### Out of scope

Sending, scheduling, audience selection, unsubscribe handling and localisation are later capabilities. Each shall look a template up by `Key` with `Status = Active` and render it through `EmailTemplateRenderer`, the same Liquid engine and profile as the preview.

## Requirements

The following L2 requirements refine the cited L1 capabilities.

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-130` | `L1-038`, `L1-017` | An `EmailTemplate` shall carry `Id`, `Key` (unique, lowercase letters and digits in dot- or hyphen-separated words, at most 100 characters, immutable after creation), `Name` (at most 120), `Description` (at most 500), `Category` (`Account`, `Notification`, `Scheduled`, `SpecialOccasion`, `Marketing`; immutable), `Status` (`Draft`, `Active`, `Archived`), `Subject` (at most 200), `Preheader` (at most 200), `HtmlBody` (at most 100 000 characters), `TextBody` (at most 50 000), `SampleData` (a JSON object whose top-level names are Liquid variables and whose values are any JSON: text, numbers, booleans, lists or objects; L2-137), `IsSystem`, `Version` (starts at 1, increases by one on every change), `CreatedAt`, `CreatedBy`, `UpdatedAt` and `UpdatedBy`. `saturdaze seed` shall create the system templates `account.verify-email` ("Verify your email", requires `{{verificationLink}}`) and `account.password-reset` ("Reset your password", requires `{{resetLink}}`) as `Active`, `Account`, `IsSystem = true` when they are missing, and shall never overwrite a template that exists. |
| `L2-131` | `L1-038`, `L1-011` | `GET /api/admin/email-templates?q=&category=&status=` shall return every template ordered by name with `id`, `key`, `name`, `category`, `status`, `isSystem`, `subject`, `version`, `updatedAt` and `updatedByEmail`; `q` matches name, key or subject ignoring case. Every `/api/admin/email-templates*` endpoint shall require the `Admin` policy (L2-111). The Email templates screen (A8, `/email-templates`), reached from an "Email templates" link in the admin navigation, shall list each template as a row with its name, key, category chip, status chip and "Updated {UTC time} by {email}", and shall offer a search box and Category and Status filters that are kept in the URL. |
| `L2-132` | `L1-038` | `POST /api/admin/email-templates` with `{ key, name, description, category, duplicateOf? }` shall create a `Draft` template at version 1 with `isSystem = false`. Without `duplicateOf` the subject, preheader, bodies and sample data shall come from the category's starter content (a marketing starter carries `{{unsubscribeUrl}}` in both bodies); with `duplicateOf` they shall be copied from that template. The response shall be 201 with the full template. A key that exists shall be refused with 409 `template_key_exists`; a malformed key, an empty name or an unknown category shall be refused with 400 naming the field. The New template dialog (AD7), opened by "New template" on A8 and by "Duplicate" on A9, shall collect name, key (suggested from the name until the key is edited), category (fixed to the source's category when duplicating) and description, and on success shall open the new template's editor. |
| `L2-133` | `L1-038`, `L1-012` | `GET /api/admin/email-templates/{id}` shall return the full template plus its `requiredPlaceholders`. `PUT /api/admin/email-templates/{id}` with `{ name, description, subject, preheader, htmlBody, textBody, sampleData, version }` shall save the content, increase `version` by one and record the administrator and UTC time; key, category, status and system flag shall not change. The save shall be refused with 409 `template_stale` when `version` is not the stored version, with 400 `invalid_template` when the subject, preheader or either body is not valid Liquid under L2-137, with 400 `unsafe_html` when the HTML body contains `<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>`, `<base>`, an `on…=` event attribute, a `javascript:`, `vbscript:` or `data:text/html` URL, or the `raw` filter, and with 400 `missing_placeholder` when a system template's HTML or text body no longer uses its required variable or a marketing template's body no longer uses `unsubscribeUrl`. The Email template editor (A9, `/email-templates/{id}`) shall edit name, description, subject, preheader, HTML body, text body and the sample data as a JSON object (refusing JSON that does not parse to an object before anything is sent), keep "Save changes" disabled until something changed, show the server's refusal in an alert, and on `template_stale` say that someone else changed the template and offer to reload. |
| `L2-134` | `L1-038`, `L1-012`, `L1-014` | `POST /api/admin/email-templates/preview` with `{ subject, preheader, htmlBody, textBody, sampleData }` shall render the content as Liquid (L2-137) without saving it and return `{ subject, preheader, html, text, placeholders }`. Each variable the template reads shall take its sample value, else a built-in sample (`appName`, `appUrl`, `recipientName`, `recipientEmail`, `unsubscribeUrl`, `currentYear`), else be empty; values written into the HTML body shall be HTML-encoded, and the subject, preheader and text body shall take them as written. `placeholders` shall list each distinct top-level variable the template reads from outside (not those it defines with `assign`, `capture`, `for` or `tablerow`), in order of first use, with its `value` (text, or JSON for a list or object) and `source` (`sample`, `builtin` or `missing`). The preview shall refuse unsafe HTML and invalid Liquid with the same codes as L2-133. On A9 the preview pane (`sd-email-preview`) shall show the rendered subject and preheader, the HTML in an `<iframe sandbox>` that allows neither scripts nor same-origin access, a Desktop (600 px) and Phone (375 px) width switch, a "Plain text" view, and the list of placeholders with missing ones flagged; it shall refresh within one second of an edit without saving. |
| `L2-135` | `L1-038` | `POST /api/admin/email-templates/{id}/status` with `{ status, version }` shall move a template to `Active`, `Archived` or `Draft`, increase its version and record the administrator. A system template shall stay `Active`: any other status shall be refused with 400 `system_template`. A stale `version` shall be refused with 409 `template_stale`. `DELETE /api/admin/email-templates/{id}` shall delete a non-system template and its revisions and return 204; a system template shall be refused with 400 `system_template`. On A9, a draft shall offer "Activate", an active non-system template "Archive", and an archived template "Restore as draft"; "Delete" shall open the Delete template confirmation (AD8) naming the template and, on confirm, return to A8 without the template. |
| `L2-136` | `L1-038`, `L1-015` | Every create, save and status change shall write an `EmailTemplateRevision` (`TemplateId`, `Version`, `Action` of `Create`, `Edit` or `Status`, `Status`, `Name`, `Subject`, `Preheader`, `HtmlBody`, `TextBody`, `SampleData`, `OccurredAt` in UTC, `AdminUserId`, `AdminEmail`). Seeding writes version 1 with no administrator. `GET /api/admin/email-templates/{id}/revisions` shall list the template's revisions newest first with `version`, `action`, `status`, `subject`, `occurredAt` and `adminEmail`; `GET /api/admin/email-templates/{id}/revisions/{version}` shall return one revision's full content. The History dialog (AD9), opened by "History" on A9, shall list the revisions as "v{n} · {action} · {UTC time} · {email}" with the subject, and "Load into editor" on a revision shall put its name, subject, preheader, bodies and sample data into the editor unsaved, so "Save changes" makes it the next version. |
| `L2-137` | `L1-038`, `L1-012` | Subjects, preheaders and bodies shall be written in Liquid and rendered with the Fluid engine (ADR-017). Standard Liquid tags and Fluid's standard filters shall be available. A template shall not use `include` or `render`, nor a filter Fluid does not provide, and the HTML body shall not use `raw`. Rendering shall stop after 10 000 steps. Every refusal shall name the field and, for a syntax error, the line and column. Sample data shall be a JSON object of at most 100 top-level names, each a Liquid identifier, serialising to at most 20 000 characters. Content written with plain `{{name}}` placeholders stays valid without change. |

## Diagrams

### System context

The context view shows the administrator managing templates and the email provider a later sender hands active templates to.

![C4 system context for managing email templates](diagrams/c4-context.png)

### Containers

The container view follows a change from the admin application through the API to the database, and the CLI inserting the system templates.

![C4 container view for managing email templates](diagrams/c4-container.png)

### Components

The component view names the pages and dialogs, the `api` service, the preview component, the handlers and the application services they share.

![C4 component view for managing email templates](diagrams/c4-component.png)

### Class structure

The class view shows the template, its revisions, the enums and the services that check, render and record content.

![Class diagram for managing email templates](diagrams/class-structure.png)

### Behaviour — create or duplicate a template

The sequence view traces AD7 from the key suggestion through the key check, the starter or duplicated content and the first revision (`L2-132`, `L2-136`).

![Sequence — create or duplicate a template](diagrams/sequence-create.png)

### Behaviour — edit, preview and save

The sequence view traces a debounced preview through the rules and the renderer, then a save with its version check and revision (`L2-133`, `L2-134`, `L2-136`).

![Sequence — edit, preview and save a template](diagrams/sequence-edit-preview.png)

### Behaviour — status, history and delete

The sequence view traces a status change, loading a revision into the editor and deleting a template through AD8 (`L2-135`, `L2-136`).

![Sequence — change status, delete and restore a revision](diagrams/sequence-lifecycle-history.png)
