# Choose a weekend cover photo

## Overview

Saturdaze is a web application that plans personalized family weekends. Each weekend now opens on a cover: a photo with the date range, the title, and the summary laid over it (`docs/mocks/pages/weekend.html`). The same cover identifies the weekend on the Past screen (`docs/mocks/pages/past.html`) and is the preview image when a family shares the weekend link.

*cover* — photo that represents one weekend on the Weekend screen, in Past, and in link previews

*default cover* — primary photo of Saturday's day highlight, else Sunday's, else the photo fallback

*stop cover* — cover the family picked from the photos of the weekend's stops

*uploaded cover* — photo a family member uploaded for the weekend, private to the family and to holders of its share link

*day highlight* — the block the planner marks as the day's main activity (the "Day highlight" chip)

*signed URL* — time-limited URL that grants read access to one private object

This feature adds the cover to the `Weekend` aggregate, the "Change photo" dialog (D28 in `docs/mocks/pages/dialogs.html`), a safe upload path, cover photos on Past cards, and Open Graph tags for shared links. Place photos come from `discovery/store-place-location-and-imagery`; the rest of the Weekend screen is `weekend-planning/map-itinerary-and-travel-legs`.

## Description

### Domain

`Weekend` gains a `Cover` owned value: `Source` (`CoverSource`: `Default`, `Stop`, `Upload`), `BlockId?` (the chosen stop), and `Upload?` (`CoverUpload`: `StorageKey`, `Width`, `Height`, `SizeBytes`, `UploadedAtUtc`). A new weekend starts with `Source = Default`.

`CoverResolver` is a domain service that turns a weekend into a `ResolvedCover(Url, Alt, Attribution, Label, IsUpload)` or `null`:

- `Default` uses the primary photo of Saturday's highlight block, else Sunday's (L2-096 AC1).
- `Stop` uses the primary photo of the place behind `BlockId`.
- `Upload` uses a signed URL for `StorageKey`.

The label is "Your photo" for an upload and "From {place}" otherwise (L2-098 AC1). With no photo, the result is `null` and clients show the fallback; the title still renders as the page `h1` (L2-096 AC3).

`RegenerateWeekendCommandHandler`, `RegenerateWeekendDayCommandHandler`, and `ReuseWeekendCommandHandler` call `Cover.Reconcile(blocks)` after replanning. A `Stop` cover whose place still appears in a surviving block re-points to that block; otherwise the cover reverts to `Default` (L2-096 AC6). An `Upload` cover survives regeneration.

### API

`WeekendDto` and `WeekendSummaryDto` gain `Cover: CoverDto?` (`Url`, `Alt`, `Attribution`, `Label`, `IsUpload`). `GetWeekendHistoryQueryHandler` resolves covers for each summary.

`PUT /api/weekends/{id}/cover` takes `{ source: "default" }` or `{ source: "stop", blockId }` and dispatches `SetWeekendCoverCommand`. A `blockId` that is not a stop of this weekend with a photo returns 400. The choice persists (L2-096 AC2).

`POST /api/weekends/{id}/cover` takes `multipart/form-data` with one `file` part and dispatches `UploadWeekendCoverCommand` (L2-097):

1. `ICurrentFamilyAccessor` scopes the weekend; another family's ID returns 404 (AC1).
2. The endpoint sets `[RequestSizeLimit(10 MB)]`; a larger body returns 413 before anything is stored (AC3).
3. `ImageSanitizer.Inspect` reads the magic bytes and accepts only JPEG, PNG, or WebP whatever the file name says; anything else returns 400 `unsupported_image` (AC2).
4. `ImageSanitizer.Reencode` decodes, auto-orients, caps the long edge at a size `<TO SUPPLY>`, and re-encodes to WebP with every metadata profile removed, including EXIF GPS (AC4). The image library is `<TO SUPPLY>`.
5. `IPhotoStore.PutAsync` writes the result under a random key to a private container, and the handler sets `Cover.Source = Upload`. A replaced upload is deleted.
6. The handler logs the weekend ID and byte size only, never the file name or content (AC7).

`IPhotoStore` is an application port. `AzureBlobPhotoStore` in Infrastructure implements it with a private Azure Blob Storage container and user-delegation SAS URLs. Family reads use a short expiry; the exact lifetime is `<TO SUPPLY>`. A request after expiry returns 403 from storage (AC5). Provisioning the storage account belongs to `operations/deploy-to-azure`, and its origin joins `ImageOptions.AllowedOrigins` and the CSP `img-src`.

`GetSharedWeekendQueryHandler` resolves the cover with a share-scoped signed URL only when the token is valid; a revoked or invalid token returns 404 and no URL (AC6). Token revocation does not exist today; adding it is `<TO SUPPLY>`.

### Link previews

Link-preview crawlers do not run the Angular application, so the static host cannot emit per-weekend tags. `SharePreviewController` adds an anonymous `GET /s/{token}` route on the API (opted out of the fallback policy, ADR-008). It returns a small HTML document with `og:title` (the weekend title), `og:description` (the summary), `og:image` (a share-scoped signed URL valid for at least 7 days), and `twitter:card`, then redirects browsers to `/sample-weekend?share={token}` with a `<meta http-equiv="refresh">` and a link (L2-098 AC3). `WeekendsController.Share` returns this `/s/{token}` URL as `shareUrl`. The public host name for `/s/` is `<TO SUPPLY>`.

### Frontend

`sd-cover` is a new `components` component for `.cover`: an `<img>` sized like `sd-media`, eager-loaded because it is above the fold, the credit chip, the eyebrow, the `h1` title, the summary, a gradient scrim that keeps the overlay at 4.5:1 over light and dark regions (L2-096 AC4), and a projected action slot for "Change photo". Its aspect ratio is 16:9 below 720 px and 21:8 from 720 px; the Add to calendar, Share, and More actions sit below it (L2-096 AC5). A null cover renders the tinted fallback.

`CoverPhotoDialog` is a new CDK dialog in `frontend/projects/saturdaze/src/app/dialogs/cover-photo-dialog`. It lists the weekend's stops that have photos as a radio group of `photo-pick__opt` tiles, plus a "Your own photo" file input that accepts `image/jpeg,image/png,image/webp`. It checks type and the 10 MB limit before upload, shows server errors in an `sd-banner`, and confirms with "Use this photo".

`IWeekendPlanService` gains `setCover(choice, id?)` and `uploadCover(file, id?)`. `WeekendView` gains `cover: CoverView | null` and `dateRange`. `ISavedService` gains `uploadCover(weekendId, file)` and `setCover(weekendId, choice)`, and `PastWeekendCard` gains `cover: CoverView | null`.

`sd-past-card` leads with `sd-media` and the cover label as its credit. A past weekend without a cover renders an "Add a photo" control in the media slot, named "Add a photo to {title}", which opens `CoverPhotoDialog` (L2-098 AC2). The Past grid keeps 1, 2, and 3 columns at 390, 820, and 1440 px with 16:9 covers (L2-098 AC4).

`SharedWeekendPage` shows the cover read-only.

## Requirements

The following L2 requirements refine the cited L1 capabilities.

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-096` | `L1-034` | The Weekend screen shall open with a cover (`.cover`) showing the weekend's cover photo with the date range, the title, and the summary overlaid. The cover defaults to the primary photo of Saturday's day highlight, else Sunday's, else a tinted fallback. "Change photo" opens a CDK dialog (D28) offering every stop's photo plus "Your own photo". |
| `L2-097` | `L1-034`, `L1-012` | `POST /api/weekends/{id}/cover` shall accept a JPEG, PNG, or WebP up to 10 MB from a member of the owning family, store it in private object storage, and set it as the cover. The server shall verify the file by content (magic bytes), re-encode it, strip all metadata including EXIF location, and serve it only through short-lived signed URLs to the family or to a valid share-link holder. |
| `L2-098` | `L1-034`, `L1-010` | Past weekend cards shall lead with the weekend's cover (`docs/mocks/pages/past.html`), labelled "Your photo" for family uploads and "From {place}" otherwise. A past weekend without a cover shall show an "Add a photo" tile that opens D28. The shared-weekend page shall emit Open Graph `og:image`, `og:title`, and `og:description` so link previews show the cover. |

## Diagrams

### System context

The context view adds the link recipient and the link-preview crawler, which read the cover through a share token, and the object storage that holds uploads.

![C4 system context for choosing a weekend cover photo](diagrams/c4-context.png)

### Containers

The container view shows uploads flowing through the API into private Blob Storage, and signed URLs flowing back to the browser and to crawlers.

![C4 container view for choosing a weekend cover photo](diagrams/c4-container.png)

### Components

The component view names the dialog, cover component, endpoints, handlers, resolver, sanitizer, photo store, and share preview controller.

![C4 component view for choosing a weekend cover photo](diagrams/c4-component.png)

### Class structure

The class view shows the `Cover` value on `Weekend`, the resolver that turns it into a `CoverDto`, and the upload ports.

![Class diagram for choosing a weekend cover photo](diagrams/class-structure.png)

### Behaviour — choose or upload a cover

The sequence covers picking a stop photo and uploading a family photo, including the 404, 413, and `unsupported_image` alternates (`L2-096`, `L2-097`).

![Sequence — choose or upload a cover](diagrams/sequence-cover.png)

### Behaviour — preview a shared weekend

A crawler fetches `/s/{token}` and receives Open Graph tags with a share-scoped image URL; a browser is redirected to the shared page (`L2-098`).

![Sequence — preview a shared weekend](diagrams/sequence-share-preview.png)
