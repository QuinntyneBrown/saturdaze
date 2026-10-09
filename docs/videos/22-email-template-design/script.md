# 22 · Email template administration: the detailed design

Videos nineteen to twenty-one showed the email template screens. This one explains the detailed design behind them, view by view, from the C4 diagrams to the requirements. In October 2026 the design was revised to write templates in Liquid, rendered with Fluid. Where the code is still catching up, the design document is the source of truth.

## Purpose and scope

Saturdaze already drafts two account emails, but their wording lives in no editable place and no provider sends them yet; that is gap G01 from video eighteen. This feature gives every email one managed home: administrators write, preview, version and retire templates in Saturdaze Admin, and a later sender looks an active template up by its key.

A few terms carry the design. A template's key, such as `account.password-reset`, is unique and never changes; its category is fixed; its status is Draft, Active or Archived. Placeholders are the variables a template reads, filled from sample data or six built-ins. System templates are the two the platform depends on, and a revision is a snapshot of every change.

Sending, scheduling, audiences and localisation are out of scope, and no family data is touched.

## System context

In the context view, an administrator manages templates in Saturdaze. Saturdaze will hand rendered active templates to an email provider, which delivers them to family members. The provider is external and not yet chosen, and the arrow to it is labelled a later capability. The design stops at the template.

## Containers

One level down are four containers. The administrator uses Saturdaze Admin, the Angular app. It calls the Saturdaze API, where every email template route sits behind the Admin policy. The API reads and writes templates and revisions in SQL Server through EF Core. And the command-line tool's seed inserts the two system templates when they are missing, and never changes one that exists.

## Components

The component view has two halves. On the front end, the list and editor pages open three CDK dialogs: new template, delete and history. They reach the API only through the admin email templates service, injected by its token, and render `sd-email-preview`, the sandboxed preview frame.

On the back end, a thin controller sends MediatR requests to nine handlers, one per route. They lean on five application services. `EmailTemplateLiquid` parses Liquid and enforces the profile. `EmailTemplateRules` holds the HTML deny-list and the required placeholder check. `EmailTemplateRenderer` renders through it, for previews now and for real emails later. The catalog and starters hold the fixed knowledge, and the revision writer records every change.

## The data model

The class view starts with the entity. The field that matters most is Version. It starts at one, goes up by one on every change, and doubles as the optimistic concurrency token.

Each template owns many revisions. A revision copies the version, an action of create, edit or status, the content, the time in UTC and the administrator. Revisions are never updated, and are deleted with their template.

In the database, the key is unique, category and status are indexed for the list filters, and revisions are unique per template and version, with a cascading foreign key.

## Create or duplicate

The first sequence creates a template. New template on the list, or Duplicate in the editor, opens the dialog. The command is validated, then the handler checks the key. An existing key gets 409 `template_key_exists`. Otherwise the content is copied from the source template or taken from the category's starter, the template becomes a draft at version one, a create revision is written, and one save commits both. The API answers 201 and the dialog opens the editor.

## Edit, preview and save

The second sequence has two halves. First the preview: three hundred milliseconds after the last keystroke, the editor sends the unsaved content. The handler checks each field with the Liquid service, runs the HTML deny-list, and only then renders, with the sample data over the built-ins. Nothing touches the database.

Then the save. The editor sends the version it loaded. If the stored version differs, the answer is 409 `template_stale`, and the editor offers to reload. That is optimistic concurrency: no locks, and no silent overwrite. Otherwise the same checks run, plus required placeholders; the version goes up, an edit revision is written, and one save commits it. Version is also the EF Core concurrency token, so a save that loses a race gets `template_stale` too.

## Status, history and delete

The third sequence covers the rest. Activate, Archive and Restore as draft send the new status with the version. A system template must stay active, so anything else is refused with `system_template`. Otherwise the version goes up and a status revision is written.

History lists the revisions newest first. Load into editor puts an old revision's content in the form, unsaved, and saving makes it the next version, so the past is never rewritten.

Delete asks for confirmation, then removes the template and, by cascade, its revisions. System templates are refused. Because the history goes too, the API logs the key and the administrator.

## The Liquid profile

Now the rules. ADR sixteen chose Liquid, rendered with the Fluid library. It is widely known, built for untrusted authors, and the existing double-brace placeholders are already valid Liquid.

The design restricts it. Only standard tags and Fluid's standard filters, and an unknown filter is refused rather than silently ignored. No include or render, so a template is self-contained. No raw in the HTML body, because raw would undo the encoding. At most ten thousand steps per render, so a runaway loop fails fast. Every refusal names the field, and syntax errors give the line and column. Sample data is capped at one hundred names and twenty thousand characters.

## Keeping HTML inert

Liquid controls substitution, not the markup an administrator types, so HTML gets three layers of defence. First, a deny-list refuses dangerous tags, event attributes and javascript URLs. Second, every value written into the HTML body is encoded. Third, the preview frame is sandboxed, with no scripts and no same-origin access, and its Content Security Policy blocks every fetch except HTTPS images and fonts.

Required placeholders protect the reason a template exists: `verificationLink` for verification, `resetLink` for reset, and `unsubscribeUrl` for every marketing template. The check walks the parsed template, so the reset link with an escape filter still counts. If either body stops using one, the save is refused with `missing_placeholder`.

Six error codes, listed here, cover the business rules, and the editor shows each refusal in an alert.

## Requirements traceability

Everything traces to one capability, L one oh thirty-seven, email template administration, refined by eight requirements, L two one twenty-four to one thirty-one, one per part of the feature, the newest being Liquid.

The sequence diagrams carry these IDs on their arrows, down to acceptance criteria. And the tests close the loop: API integration tests for every endpoint and the Liquid profile, command-line tests for the seeder, and Playwright specs through two page objects.

## Recap

Things to remember.

- One home for every email; a sender finds an active template by key and uses the preview's renderer.
- Version is the concurrency token: a stale save or status change gets `template_stale`.
- Every create, save and status change writes an immutable revision.
- Restricted Liquid, a deny-list, encoding and a sandboxed frame keep templates inert.

ADR sixteen also records that video twenty, which shows the earlier placeholder syntax, should be re-recorded.
