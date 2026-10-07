# 15 · Adding curated photos: upload and URL

> **Runtime:** ~7 min · **Audience:** curators, and developers who configure or change photo storage · **Prerequisites:** video 14

**Video:** [15-adding-curated-photos.mp4](15-adding-curated-photos.mp4) · [Slides](slides.html) · **Audio:** [15-adding-curated-photos.mp3](15-adding-curated-photos.mp3) · [Transcript](script.md) · [Clips](clips/clips.mjs)

## Why this video exists

Curators add photos two ways: upload (AD1, L2-115) and add from an allow-listed URL (AD2, L2-116). Uploads need somewhere public to live, which ADR-015 answers with a second photo store. This video records both dialogs live, including their refusals, and walks the handlers, the sanitizer, the promotion rule and the store configuration.

## Learning objectives

By the end, the viewer can:

- Upload a curated photo and explain which checks run in the browser and which on the server.
- Explain what `IImageSanitizer` guarantees, and what is logged and audited about an upload.
- State when a new curated photo becomes primary (`ShouldPromoteCurated`).
- Explain why curated photos need `ICuratedPhotoStore` rather than `IPhotoStore`, and configure `PublicOrigin` and the allow-list together.
- Add a photo from a URL and explain the allow-list-first, fetch-once design.

## Key questions

| Question | What a strong answer includes |
|----------|-------------------------------|
| What happens to uploaded bytes? | Magic-byte check, decode, orientation, long edge capped at 2400 px, re-encoded JPEG: no EXIF/GPS; 400 `unsupported_image`; 413 over 10 MB before reading. |
| When does a curated photo become primary? | When the place has no primary, or its primary is an unreviewed, unlocked provider photo. |
| Why a second store? | Family photos are private behind signed, expiring URLs; catalog photos must be public, cacheable and on an allow-listed origin (ADR-015). |
| What must be configured? | `Saturdaze:CuratedPhotos:PublicOrigin` = an origin in `Saturdaze:Images:AllowedOrigins` and both apps' CSP `img-src`. |
| How is Add from URL kept safe? | `IsAllowed` before any fetch; 409 `photo_exists`; one fetch, 10 s, 10 MB, no retries; bytes verified, then discarded; the URL is stored. |

## Code / assets on screen

| File | What to show |
|------|--------------|
| `backend/src/Saturdaze.Application/Admin/Photos/UploadCuratedPhotoCommandHandler.cs` | Sanitize, store, save; log and audit |
| `backend/src/Saturdaze.Infrastructure/Photos/SkiaImageSanitizer.cs` | What sanitizing means |
| `backend/src/Saturdaze.Domain/Entities/PlacePhotoSet.cs` | `ShouldPromoteCurated` |
| `backend/src/Saturdaze.Application/Photos/CuratedPhotoPorts.cs`, `backend/src/Saturdaze.Api/Controllers/CatalogPhotosController.cs` | Port and public route |
| `backend/src/Saturdaze.Api/appsettings.json` | `CuratedPhotos` section |
| `backend/src/Saturdaze.Application/Admin/Photos/AddPhotoFromUrlCommandHandler.cs` | Allow-list first, one fetch |
| `clips/upload.mp4`, `refused.mp4`, `url.mp4` | Screen recordings |

## Run sheet

| Time | Segment | Content |
|------|---------|---------|
| 00:00-00:38 | Introduction | Two ways in |
| 00:39-01:47 | Upload | Upload dialog, promotion to primary, refused PDF |
| 01:48-03:21 | On the server | Handler order, sanitizer, promotion rule, privacy |
| 03:22-04:56 | Curated store | Two stores, the port and controller, configuration |
| 04:56-06:13 | From a URL | Add from URL dialog and its refusals; the handler |
| 06:14-06:59 | Recap | Things to remember; next video |

## Demo commands

```powershell
$env:SD_DEMO_RESET = "node tools/video-record/admin-demo/reset.mjs"
node tools/video-record/record-clips.mjs docs/videos/15-adding-curated-photos
```

## Pitfalls

- `PublicOrigin` and `AllowedOrigins` disagreeing: every upload projects as blocked.
- Running the API on another host or port than `PublicOrigin` (a preview slot) has the same effect.
- The upload dialog pre-fills "Photo · Saturdaze" / "Saturdaze owned": change both for anyone else's photo.

## References

- [ADR-015](../../adr/ADR-015-public-curated-photo-storage.md)
- `docs/specs/L2.md` (L2-115, L2-116); `docs/detailed-designs/administration/manage-place-photos/README.md`
- [ASP.NET Core response caching headers](https://learn.microsoft.com/aspnet/core/performance/caching/response)
