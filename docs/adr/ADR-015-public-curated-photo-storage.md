# ADR-015 — Public storage and serving for curated place photos

**Status:** Accepted
**Date:** 2026-10-06
**Related:** [ADR-014](ADR-014-separate-admin-application.md), L2-100, L2-101, L2-109, L2-115, L2-119.

## Context

Family cover uploads (L2-109) go through `IPhotoStore`, a **private** store served only through short-lived HMAC-signed URLs (`GET /api/photos/{key}?exp=&sig=`). That is right for family photos: they are private to the family and a share-link holder.

Curated place photos are the opposite. They appear on every family's idea cards, Past cards and covers, they are cached by browsers and CDNs, and `PlacePhotoReader.Project` only serves a photo whose URL is HTTPS on an origin in `ImageOptions.AllowedOrigins`, which the family app's CSP `img-src` mirrors. A signed URL that expires in minutes cannot be stored as a `PlacePhoto.Url`, and a private origin cannot be allow-listed.

PRD Q1 offers two options: an Azure Blob container behind a CDN origin, or an unsigned API route.

## Decision

1. **A second port, `ICuratedPhotoStore`**, distinct from `IPhotoStore`: `PutAsync(content, contentType) → key`, `OpenAsync(key)`, `DeleteAsync(key)` and `PublicUrl(key)`. The admin upload handler stores the sanitized bytes through it and saves `PublicUrl(key)` as the photo's `Url` and the key as `PlacePhoto.StorageKey`; removal deletes the file by key.
2. **The shipped implementation serves from the API.** `FileSystemCuratedPhotoStore` writes under `Saturdaze:CuratedPhotos:Directory`, and `CatalogPhotosController` serves `GET /api/catalog-photos/{key}` with `[AllowAnonymous]`, `Cache-Control: public, max-age=31536000, immutable` and `X-Content-Type-Options: nosniff`. Keys are random and never reused, so immutable caching is safe. `PublicUrl` is `{Saturdaze:CuratedPhotos:PublicOrigin}/api/catalog-photos/{key}`.
3. **The API origin joins the allow-list and the CSP.** `Saturdaze:Images:AllowedOrigins` lists the API origin (the same value as `PublicOrigin`), and both apps' `staticwebapp.config.json` list it in `img-src`. The e2e and API test fixtures use `https://images.example.com` for the API origin so the existing allow-list tests keep their meaning.
4. **Azure Blob + CDN stays the production option**, not a different design: an `AzureBlobCuratedPhotoStore` implementing the same port with the CDN origin as `PublicOrigin` can replace the file-system store by configuration. Choosing it is a deployment decision that needs a storage account and CDN endpoint; it does not change the handlers, the schema or the apps.
5. **Only sanitized bytes enter the store.** Uploads pass `IImageSanitizer` (verified by content, re-encoded, metadata stripped) before `PutAsync`, exactly as family uploads do. URL adds do not copy the image: the allow-listed source URL is stored as is.

## Consequences

- Curated photos are cacheable by any browser or CDN, and the family app's CSP does not change shape; it gains one origin.
- The private store, its signer and `GET /api/photos/{key}` are untouched; family uploads stay private.
- Running the API behind a hostname other than `PublicOrigin` (a preview slot, a local port) serves URLs that the allow-list rejects until the two settings agree; the startup warning for missing production configuration covers the new keys.
- Moving to Blob later means copying existing files from the API's directory to the container and rewriting `PlacePhoto.Url` for photos with a `StorageKey`; the key, not the URL, is the stable identity, which is why it is stored.
