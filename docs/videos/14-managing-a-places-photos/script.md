# 14 · Managing a place's photos

A place in Saturdaze can have several photos, but families only ever see one of them: the primary. This video opens a place in Saturdaze Admin and covers everything you can do with the photos it already has. You will see how the primary looks in every slot the family app uses, choose a different primary, edit alt text, attribution and licence, and remove a photo. Adding new photos is video fifteen. Along the way you will meet the one domain rule that holds it together, and see why every one of these actions locks the photo against seeding and ingestion. Recorded against the demo data, as of October 2026.

## The Place photos screen

Open Bronte Creek Provincial Park from Places. The header gives the kind and the photo count, and something you would not otherwise know: five weekend covers follow this place. That is the cover impact, the number of weekends whose chosen cover comes from this place's primary photo. The API returns it as a number only. No weekend or family identifier ever reaches the admin app, which keeps family data where ADR-008 says it belongs.

How families see it previews the primary photo in every family app slot, through `sd-slot-preview`: the idea card at sixteen by nine, the four by three thumbnail at two sizes, and the weekend cover with its scrim and title. This is where you judge a crop, before a family does. A place with no primary shows the fallback tile in every slot.

Below that are the photos, one `sd-photo-tile` each. The badges say whether it is the primary, whether it is curated or came from a provider, and whether it has been reviewed. Then come the alt text, the credit, the licence, the real pixel size, and the actions.

The place's photos endpoint returns every photo, not just the primary, with its review state, its lock, who changed it last, and a blocked flag: whether the family app would refuse its address. A blocked photo's tile shows a Blocked URL panel instead of an image, so you are never fooled by a picture families cannot see.

## Choosing the primary

Each tile that is not the primary offers Make primary. Choose it on the boardwalk trail, and the confirmation states the consequence before you commit: five weekend covers will change. Weekends whose cover follows this place show the new primary on their next load, in Past and on shared links too. With none, it reads: no weekend covers follow this place. Confirm, and exactly one request goes to the primary endpoint. The tile gains the primary star, and the previews switch over.

On the server, `MakePhotoPrimaryCommandHandler` loads the photo and its siblings, stamps the photo with `AdminPhotoTouch`, writes an audit entry naming the previous and the new primary, and hands over to `PrimaryPhotoWriter`.

Two details are worth knowing. The rule itself is one loop in the domain: `PlacePhotoSet.MarkPrimary` sets primary on the chosen photo and clears it on every other photo of the place. But the database also enforces one primary per place, with a filtered unique index. A single save that sets the new primary before clearing the old one can trip that index. So the writer saves twice: clear first, then promote. Every statement is valid on its own.

The second detail is `AdminPhotoTouch`. Every administrator change runs it. It sets `AdminLocked`, marks the photo reviewed, and records when and by whom. The lock is the promise that seeding and ingestion will never undo a curator's decision. Video sixteen shows both sides of that promise.

## Editing details

The Ontario Science Centre's photo has no alt text, so its tile carries a Missing alt text chip, and the place counts under missing alt text on the health screen. Families are not left with nothing, though: the API still sends "Photo of" and the place name.

Edit opens a dialog with three fields: alt text, attribution and licence. The address is not one of them; to swap the image, you add a new photo and remove this one. Attribution and licence are mandatory. Clear the attribution, and Save stays disabled until it is back. The licence is a fixed list, Saturdaze owned, three Creative Commons licences and provider terms, plus Other, which takes free text. Write the alt text, save, and the chip is gone.

The patch endpoint applies the same rules on the server. Attribution and licence must be filled, or it returns a 400 naming the field, and the request has no address field at all, so the URL cannot change. Like every admin change, the edit locks the photo.

## Removing a photo

Removing a photo that is not the primary just asks you to confirm. Removing the primary asks a question first, because families need something to see next. The dialog lists the other photos and No photo, and preselects a default: the first curated photo, else the first reviewed provider photo, else no photo. It also repeats the cover impact. Pick the meadow, confirm, and the meadow is the primary again.

`RemovePhotoCommandHandler` never guesses. Removing a primary without `nextPrimaryId` returns a 400 with `next_primary_required`, and an id from another place returns `next_primary_invalid`. Passing none leaves the place without a photo, deliberately. The row is deleted before the sibling is promoted, so the one primary index is free. And for a curated upload, the stored file is deleted too, so it stops being served.

## Recap

Things to remember.

- Families see one photo per place, the primary, and the previews show it in every slot before a family does.
- Make primary states how many weekend covers will change, and the database keeps exactly one primary.
- Edits keep attribution and licence mandatory and never change the address.
- Removing the primary always makes you choose what comes next, even if that is no photo.
- Every admin change locks the photo, so seeding and ingestion leave it alone.

Next, video fifteen adds new photos: curated uploads, photos from an allow-listed address, and the public store that serves them.
