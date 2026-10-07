# 15 · Adding curated photos: upload and URL

Video fourteen managed the photos a place already has. This one adds new ones. A curator has two ways in: upload a file, or add a photo from an address. Both create a curated photo that is reviewed and locked from the start. They differ in where the image lives. Uploads are sanitized and stored by Saturdaze in a new public store; URL adds point at an allowed image host, as they are. You will see both dialogs, the checks on each side of the wire, and the store design from ADR-015. Recorded against the demo data, as of October 2026.

## Uploading a photo

Riverwood Conservancy has no photos yet, so families see the fallback tile everywhere. Upload photo opens the upload dialog. The picker accepts JPEG, PNG or WebP up to ten megabytes, and the dialog previews the image with its name, size and pixel dimensions before anything is sent. Attribution and licence start as "Photo, Saturdaze" and "Saturdaze owned", the right answer for the team's own photos. This one is not ours, so clear the attribution, and Save disables: attribution and licence are both mandatory. Credit the photographer, choose the matching Creative Commons licence, and save.

Because the place had no primary, the new curated photo becomes the primary straight away, and the previews fill in. The tile reads primary, curated and reviewed.

The dialog checks the type and size before sending, so a PDF is refused on the spot with "That file is not a photo we can use", and Save stays disabled. That check is a convenience. The server checks again, by content, not by name.

## On the server

`UploadCuratedPhotoCommandHandler` works in a fixed order. First, the place must exist. Then the bytes go through `IImageSanitizer`, the same sanitizer family cover uploads already use. It recognises JPEG, PNG and WebP by their magic bytes, whatever the file is called, decodes the image, applies the camera orientation, caps the long edge at 2400 pixels, and re-encodes it as JPEG. Re-encoding writes pixels only, so EXIF data, GPS location included, is gone. Anything that does not decode is a 400 with `unsupported_image`. An upload over ten megabytes never gets that far: the controller answers 413 before it reads the file.

Only the sanitized bytes are stored. The photo is saved as curated, reviewed and admin locked, with its real width and height and its storage key. Then comes the promotion rule, `PlacePhotoSet.ShouldPromoteCurated`. A new curated photo becomes primary when the place has no primary, or when its primary is a provider photo that nobody has reviewed or locked. A primary that is curated, or that an administrator chose, stays where it is. Curated beats an unreviewed provider photo, but it never overrides a curator.

One privacy detail. The log line and the audit entry record the place and the byte size, never the file name, and never the image.

## The curated store

Where do the bytes go? Family cover uploads already have a private store, `IPhotoStore`, served only through short-lived signed URLs. That is right for family photos, and wrong for catalog photos. Catalog photos appear on every family's cards, get cached by browsers, and must sit on an origin that the image allow-list and the content security policy can name. A URL that expires in minutes cannot be stored on a photo.

So ADR-015 adds a second port, `ICuratedPhotoStore`, with put, open, delete and public URL. The shipped implementation, `FileSystemCuratedPhotoStore`, writes each file under a configured directory with a random key. `CatalogPhotosController` serves it anonymously from the catalog photos route, with a one-year immutable cache header and no-sniff. Keys are never reused, so immutable caching is safe.

The public URL is `Saturdaze:CuratedPhotos:PublicOrigin` followed by that route. For uploads to show, the same origin must be in `Saturdaze:Images:AllowedOrigins` and in both apps' content security policy. If the two settings disagree, every upload projects as blocked, so set them together. An Azure Blob store behind a CDN can replace the file system store later, by configuration. The key, not the URL, is the stable identity, which is why it is stored.

## Adding from a URL

The second way in is Add from URL. The dialog asks for an image URL and the same three details. It refuses anything that is not HTTPS before saving: type an http address, and it says this address isn't on the image allow-list, with Save disabled. An HTTPS address on a host that is not allow-listed passes the browser check, but the server refuses it with `url_not_allowed`, and the dialog shows the same message. In this demo, a local image host on the allow-list stands in for a provider's CDN. Give it an address there, and the photo is added.

Riverwood already has a curated primary now, so the new photo joins as a second curated photo, not as the primary.

`AddPhotoFromUrlCommandHandler` checks the allow-list with `PlacePhotoReader.IsAllowed` before any network call, so it cannot be pointed at an internal host. A URL the place already has is a 409, `photo_exists`. Then the image is fetched exactly once, with a ten second budget and a ten megabyte cap, and run through the sanitizer only to verify the type and read the real dimensions. The bytes are not kept: the photo stores the allowed source address as it is.

## Recap

Things to remember.

- Uploads are verified by content, re-encoded and stripped of metadata before they are stored.
- Curated photos are reviewed and locked from the start, and become primary only over nothing, or over an unreviewed provider photo.
- The curated store is public and cached as immutable; its origin must be on the image allow-list and in both apps' content security policy.
- URL adds check the allow-list before any fetch, fetch once to verify, and store the address, not the bytes.

Next, video sixteen turns to the photos curators did not choose: reviewing what ingestion brings in, and making rejections stick.
