# 17 · The photo activity log

Every decision in the last four videos changes what families see: a new primary, a rejected photo, an edited credit. When someone asks why a weekend cover changed, or a photographer asks where their credit went, you need an answer. This short video covers the activity log: what Saturdaze Admin records for every photo change, how it is written, and the screen that reads it. Recorded against the demo data, as of October 2026.

## What gets recorded

Every create, edit, primary change, removal and review that goes through the admin API writes a `PhotoAuditEntry`. Each entry holds who, as the administrator's id and email; when, in UTC; the place, as its kind and id; the photo; the action; and the values before and after, as JSON. There are six actions: upload, add from URL, edit, primary, remove and review.

Two design choices matter. The entry keeps the place even after the photo row is deleted, so a removal or a rejection still reads in the log. And a sequence number that the database assigns breaks ties, so entries written in the same instant still list newest first.

`PhotoAuditWriter` is the one place that creates entries. It takes the administrator from the current request, and refuses to write without one. It stamps the time, and serialises before and after with camel case names, leaving out nulls. Then it adds the entry to the unit of work, and the handler's own save persists it. So a change and its record commit together, or not at all.

What goes into before and after is chosen per action. A primary change records the previous and the new primary photo, with their addresses. An edit records the three detail fields. A removal records the address, whether it was the primary, and what became primary next. A review records the decision and the reason. And an upload records the address, the byte size and the dimensions, never the file name, and never the image itself.

## The Activity log screen

Before this recording, two administrators made a morning of changes on the demo: a new primary, an edit, a kept photo, a rejection with a reason, a photo added from an address, and a removal. The Activity log shows each one as a row: the time in UTC, the administrator's email, the place name as a link, a chip for the action, and one line saying what changed. The edit reads alt text, from nothing to the new text. The rejection names the file and quotes the reason. The primary change names the old file and the new one.

The place name is looked up when the log is read, so a renamed place shows its current name, and a place that has left the catalog shows as a removed place instead of breaking the row.

Two filters narrow it down. Place offers every place the log has seen; pick Bronte Creek, and you get its three uploads, the primary change and the removal. Administrator does the same for people; pick the second curator, and only that curator's changes remain. As on the Places screen, the filters live in the query string, so a filtered log is a link. And each place name takes you straight to that place's photos.

On the server, the photo audit endpoint filters by kind and place, or by administrator, orders by time and then by sequence, newest first, and pages fifty at a time.

## Recap

Things to remember.

- Every admin photo change writes one audit entry, committed together with the change.
- An entry records who, when in UTC, the place, the action, and the values before and after, never a file name or an image.
- The log survives deleted photos, and looks place names up live.
- Filter by place or by administrator, and every filtered view is a link.

That completes the Saturdaze Admin series. Go back to video twelve for the shell, or read the detailed designs under the administration folder for the full design behind every screen.
