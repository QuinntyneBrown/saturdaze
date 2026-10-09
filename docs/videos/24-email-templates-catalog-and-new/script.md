# 24 · Email templates: the catalog and new templates

Video eighteen ended on a gap: Saturdaze drafts account emails, but the wording lives in no place an administrator can see or change. More email is coming, too: scheduled weekend digests, notifications, birthday and holiday greetings, and marketing. This video is the first of three on email templates in Saturdaze Admin. It covers what a template is, the two system templates the platform ships with, the Email templates screen, and how a new template is created or duplicated. Recorded against the email demo data, as of October 2026. One honest note first: templates are ready, but nothing sends them yet. A sender is a later capability.

## What a template is

An email template is named, categorised email content. It has a subject, a preheader, which is the grey line inboxes show after the subject, an HTML body, and a plain-text body. All four can use placeholders: a name in double curly braces, like recipient name, that a sender fills in at send time.

Three properties decide how a template is used. The key is how a sender finds it, such as `account.password-reset`. It is lowercase words joined by dots or hyphens, at most a hundred characters, unique, and it never changes after creation. The category says what the template is for: account, notification, scheduled, special occasion, or marketing. It is fixed at creation too. And the status is the lifecycle: draft while it is being written, active when senders may use it, archived when it is retired but kept.

Every template also carries sample data for the preview, a system flag, and a version number that starts at one and goes up with every change. That number does two jobs, which video twenty-five covers: it orders the history, and it stops two administrators from overwriting each other.

## The system templates

Two templates exist before anyone signs in. `saturdaze seed` reads a bundled file, `email-templates.json`, and creates Verify your email and Reset your password as active, account, system templates at version one. Their wording follows the flows video eighteen walked through: the verification link works for twenty-four hours, the reset link for sixty minutes.

The seeder only ever inserts. If a key already exists, it leaves that template alone, so an administrator's edits survive every reseed. A system template can be edited, but it can never be archived or deleted, and both of its bodies must keep the one link it exists to carry: the verification link, or the reset link.

## The Email templates screen

Email templates is the sixth entry in the admin navigation. Each row shows the name, the key in monospace, a category chip, a status chip, a System chip for the two account templates, and the last change: the time in UTC and who made it. The seeded rows say Saturdaze; the demo's other templates were written by two administrators just before this recording. Rows are ordered by name.

Category and Status narrow the list, and they live in the address, so a filtered list is a link you can share. Choose Account and only the two system templates remain. Choose Draft and you see the work in progress. Search matches the name, the key or the subject, ignoring case, so typing reset finds the password template by its key.

## Creating a template

New template opens a dialog. Type a name, and the key follows it: Birthday wishes becomes birthday hyphen wishes. As soon as you edit the key yourself, it stops following. Pick a category, add a description that says when the email goes out and to whom, and create it.

The new template opens in the editor as a draft at version one, and it is not empty. Each category has starter content: a greeting, a message, a button and a footer, already written with built-in placeholders. The special occasion starter wishes the recipient a happy occasion, with occasion as a sample value. The marketing starter goes one step further: both of its bodies carry the unsubscribe link, because every marketing template must keep one.

A key is unique, and the server is the judge. Type a new name, overwrite the key with account dot password hyphen reset, and the dialog stays open with the reason in place: a template already uses this key. A malformed key is refused before you get that far, with the rule spelled out under the field.

## Duplicating a template

Duplicate starts from a template you already like. Open Verify your email, choose Duplicate, and the same dialog opens as Duplicate template: the name reads Copy of Verify your email, and the category is locked to account. Give it a key and create it. The copy carries the subject, preheader, both bodies and the sample data, but it is a new draft at version one, and it is not a system template. It has no System chip, and it can be archived or deleted like any other.

## Under the hood

Two endpoints serve this screen, both behind the Admin policy. The list endpoint takes q, category and status; an unknown category or status is a bad request. The create endpoint takes the key, name, description and category, plus an optional duplicate of. It checks the key pattern and the name, refuses a taken key with the code template key exists and a conflict status, copies the content from the source or the starter, and writes the template's first revision in the same save.

## Recap

Things to remember.

- A template is a subject, preheader, HTML body and text body, with placeholders, a key, a category and a status.
- The key and the category are fixed once created; senders will look templates up by key.
- Two system templates are seeded, never overwritten, never archived or deleted, and always keep their link.
- New template suggests the key from the name and starts from content suited to the category; marketing always carries an unsubscribe link.
- Duplicate copies the content into a new, ordinary draft.

Next, video twenty-five opens the editor: placeholders and sample data, the live preview, the rules that keep the HTML safe, and what happens when two administrators edit at once.
