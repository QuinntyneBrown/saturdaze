# 16 · Reviewing ingested photos

Ingestion, the pipeline from videos seven to eleven, asks Claude to research local places, and its results can come with photos. Those provider photos are useful, but nobody chose them. This video covers the review loop Saturdaze Admin adds around them: where provider photos wait, the three decisions you can make, how a rejection is remembered so the photo never comes back, and the screen that shows why a run left a photo out. It ends with the other half of the promise: seeding and ingestion never undo an administrator's decision. Recorded against the demo data, as of October 2026.

## Where provider photos come from

When `CatalogUpserter` stores a row from an ingestion run, it also adds the row's photo candidates as provider photos. Every `PlacePhoto` now carries a review state. Photos that ingestion stores start as Unreviewed; curated, seeded and administrator-reviewed photos are Reviewed.

A provider photo becomes the primary only when the place has none. So an unreviewed photo can be in front of families, which is exactly why the health screen flags it, and why the queue exists. Families keep seeing it in the meantime. Review is about the curator catching up, not about hiding new places.

## The review queue

The Photo health header offers to review four new photos, and the Review queue lists them, newest first. Each item shows the new photo from ingestion beside the photo it would replace, or, when the place has no primary yet, says it would become primary. The place name links to that place's photos, and the line under it gives the kind and the licence.

There are three decisions, and each is one step. Keep marks the photo reviewed, and it leaves the queue; Snug Harbour's photo stays exactly as it is. Make primary goes through the same confirmation as on the place screen, stating the cover impact, here none, then marks the photo reviewed and makes it the place's only primary. The botanical gardens' provider photo now replaces the curated one.

Behind the buttons is one endpoint, the review endpoint, which takes a decision of keep, primary or reject, and an optional reason. `ReviewPhotoCommandHandler` refuses a photo that is already reviewed with a 409, writes an audit entry, and then switches on the decision. Keep and primary both run `AdminPhotoTouch`, so the photo ends up locked as well as reviewed.

## Rejections stick

La Marina's new photo is the Port Credit lighthouse, not the restaurant. Reject opens a confirmation: the photo is deleted, and ingestion never adds this address for La Marina again. The reason is optional, and it is kept for the activity log. Confirm, and exactly one review call is made, and the item disappears. Keep the zoo's photo as well, and the queue is empty: nothing to review.

A rejection does two things. It deletes the photo row, and it records a `RejectedPlacePhoto` with the place, the URL, who rejected it, when, and the reason. If the rejected photo was the primary, the place falls back to its default primary: the first curated photo, else the first reviewed provider photo, if it has one. La Marina has neither, so it goes back to no photo, which is honest.

That record is what makes the rejection stick. `CatalogUpserter` now loads the place's rejected addresses before it adds any candidates. A candidate on that list is skipped, and the run's skip reasons record the place, the address, and the words previously rejected.

## Ingestion photo skips

Those skip reasons have their own screen. Ingestion photo skips lists each run that left a photo out, newest first, with its type, its start time in UTC and its status, then one line per skip: the place, the reason, and the address. It is read-only, and a place that still exists links to its photos.

In this demo, the restaurants run shows La Marina's lighthouse skipped as previously rejected. That run is staged, because only a live Claude run would produce it, but the line is exactly what the upserter writes, and the screen parses it with a pattern that mirrors that format. Other lines show the older reason, missing attribution or licence. A name with no matching place, like the splash pad, is listed without a link.

## Seeding respects administrators too

Ingestion is one side of the promise; seeding is the other. `saturdaze seed` is idempotent and gets re-run often. `SeedPhotos.Apply` now leaves an `AdminLocked` photo's alt text, attribution and licence alone, and it will not reassign the primary on a place whose primary is locked. Ingestion follows the same rule from its side: on a place that already has a primary, a new provider photo is stored unreviewed and not primary, so the curator's choice stays in front of families.

## Recap

Things to remember.

- Provider photos arrive unreviewed and wait in the review queue until someone keeps, promotes or rejects them.
- Keep and Make primary review and lock the photo, and Make primary states the cover impact first.
- Reject deletes the photo and remembers its address for that place, so ingestion skips it from then on, and says so.
- Ingestion photo skips shows every run's skips, read-only, with links to the places.
- Seeding and ingestion never undo an administrator's decision.

Next, video seventeen covers the record of all these decisions: the activity log.
