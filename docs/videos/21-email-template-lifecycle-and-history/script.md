# 21 · Email template lifecycle and history

This is the last of three videos on email templates. Video nineteen created templates and video twenty edited them. This one follows a template through its life: activating it, archiving it, restoring it, and deleting it, and the revision history that records every one of those changes. It ends with what a future sender needs from all this. Recorded against the email demo data, as of October 2026.

## Draft, active, archived

A template is in one of three statuses. Draft means it is still being written. Active means a sender may use it. Archived means it is retired, but kept and still readable. The editor offers exactly one status action, the one that fits: a draft offers Activate, an active template offers Archive, and an archived template offers Restore as draft.

In the recording, the holiday greeting starts as a draft at version one. Activate makes it active at version two. Archive retires it at version three. Restore as draft brings it back for more work, at version four. Every status change is a change like any other: the version goes up by one, the header records who and when, and a revision is written.

Behind the buttons is one endpoint: a POST to the template's status route, with the status and the version the editor loaded. A stale version is refused with template stale, exactly like a save. Asking for the status a template already has changes nothing and writes nothing. And because a status change does not touch the content, any unsaved edits in the form survive it.

## System templates stay active

The two system templates are the exception. The platform depends on them, so they stay active, always. Open Verify your email and the header offers Save changes, History and Duplicate, but no Archive and no Delete, and the note explains why. The API enforces the same rule, so a script cannot get around the screen: asking for any status other than active on a system template, or deleting one, is refused with the code system template.

## Deleting a template

Archive is usually the right way to retire a template, because it keeps the content and its history. When a template should truly go, Delete opens a confirmation. It names the template, its key, and how many versions will be lost, says that this cannot be undone, and points at Archive as the way to keep it. Confirm, and exactly one delete request is sent, the editor returns to the list, and the template is gone.

On the server, the delete removes the template and, through a cascading foreign key, every revision with it. Because the history goes too, the API writes a log line naming the key, the template id and the administrator, so the deletion itself is still on record.

## The revision history

Every create, save and status change writes an email template revision. A revision is a snapshot: the version, the action, which is create, edit or status, the status at that moment, the name, subject, preheader, both bodies and the sample data, the time in UTC, and the administrator. Revisions are written, never updated. One class writes them, in the same save as the change, so a template and its history cannot disagree. The seeder writes version one of each system template, with Saturdaze as the author.

History in the editor lists the revisions newest first. Each row reads like v three, edit, the time, and who, with the subject underneath. The weekend notification shows four: created and edited by the first administrator, edited again by the second curator, then activated.

Load into editor takes an older version and puts its name, subject, preheader, bodies and sample data into the form, unsaved. Nothing on the server changes yet. The Unsaved changes chip appears, and Save makes it the next version, version five here. History never rewrites the past: restoring version one creates version five with version one's content, and versions two to four are still there.

Two endpoints serve the dialog: one lists a template's revisions with their summaries, and one returns a single revision's full content when you load it.

## What a sender will need

Nothing sends these templates yet. That is the gap from video eighteen, and choosing an email provider is its own decision. But the contract for a sender is already in place. A sender looks a template up by its key, and uses it only if its status is active. It renders the subject, preheader and both bodies with the same renderer the preview uses, passing real values instead of samples, so what an administrator previewed is what goes out. For the account flows, that means the verification and reset links drafted today go into the placeholders the system templates are required to keep.

Scheduling, choosing an audience, handling unsubscribes and translating templates are later capabilities. Each starts, like everything here, with a requirement, a design and a mock.

## Recap

Things to remember.

- Draft, Active, Archived: the editor offers the one action that fits, and every status change is a new version.
- System templates stay active and cannot be deleted; the API enforces it.
- Delete removes the template and its history after a confirmation; archive keeps both.
- Every create, save and status change writes a revision; History loads an old one into the editor, and saving makes it the next version.
- A future sender finds an active template by key and renders it with the preview's renderer.

That completes the email templates series. The full design is in the manage email templates folder under the administration detailed designs.
