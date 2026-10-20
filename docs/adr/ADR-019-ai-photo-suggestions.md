# ADR-019 — Photo suggestions come from Claude web search, through the API, never hot-linked

**Status:** Accepted
**Date:** 2026-10-20
**Category:** integration
**Deciders:** Quinntyne Brown
**Related:** [ADR-011](ADR-011-claude-via-microsoft-foundry.md) (Claude on Foundry), [ADR-015](ADR-015-public-curated-photo-storage.md) (curated store and allow-list), [suggest-photos-with-ai design](../detailed-designs/discovery/suggest-photos-with-ai/README.md), L1-038, L2-157 to L2-160.

## Context

Three dialogs change a photo: the weekend cover (D29), the profile photo (D27) and the admin's curated place photo (AD1, AD2). Each takes a file from the device; the admin dialog also takes an allow-listed URL. Finding a good photo of a zoo, a farm or a park is left to the person. The ingestion pipeline already asks Claude on Microsoft Foundry to research the web (ADR-011), and the Messages API's `web_search_20250305` tool returns page content the model can mine for image addresses, titles and licences.

Two constraints shape how suggestions can reach the browser:

- **The family app's CSP and `ImageOptions.AllowedOrigins`** only admit images from the API origin and the configured providers (L2-101, ADR-015). A thumbnail from `upload.wikimedia.org` or a venue's site is blocked by the browser, and allow-listing the open web is not an option.
- **Privacy.** Loading a third-party image from the family's browser tells that host what a family is looking at; the shared cover and the private store exist so family photos stay private.

## Decision

1. **Claude on Foundry does the research.** `FindPhotoSuggestionsCommandHandler` sends one research request per search through `IWebSearchClient`, the port `ClaudeWebSearchClient` implements. The client registration moves from `AddIngestion` into `AddClaudeWebSearch`, which `AddInfrastructure` also calls, so the API host uses the `Saturdaze:Ingestion:Claude` section and `ANTHROPIC_FOUNDRY_API_KEY` that `eng/infra/main.bicep` already writes. The prompt asks for openly licensed or official-source photographs and a JSON array with the image address, title, source name and page, attribution and licence; prose and code fences are tolerated and ignored.
2. **The API fetches every candidate itself.** `HttpPublicImageFetcher` accepts HTTPS only, resolves the host, refuses loopback, private, link-local, multicast and cloud-metadata addresses, connects to the resolved address, follows no redirects, and stops at 10 s or 10 MB. `SkiaImageSanitizer` then verifies the bytes by content and re-encodes them without metadata, as it does for uploads. A candidate that fails any step is dropped; the response never carries an address the browser would load directly.
3. **Previews are served from the API, signed and short-lived.** Each cleaned image is held in memory for 15 minutes under a random id bound to the requesting user, and the response carries `/api/photo-suggestions/{id}?exp=&sig=` signed by `HmacPhotoUrlSigner` with the same key as family photo URLs. The anonymous `GET` is the only way to see a suggestion, so the CSP does not change and third-party hosts never see a family's browser.
4. **A chosen suggestion is stored like an upload.** The three "use" commands resolve the suggestion for the caller and delegate to `UploadWeekendCoverCommand`, `UploadCuratedPhotoCommand` and `SetAvatarCommand`. The weekend cover keeps the attribution in a new `CoverUploadCredit` column and is labelled "From the web"; the curated photo keeps the source page in the audit snapshot; the avatar is scaled to 512 px first. No new storage, signing or serving path exists for suggested photos.
5. **Bounded spend.** `PhotoSuggestionOptions` caps candidates at 6, web searches at 5 per request, and searches at 20 per user per rolling hour (429 `suggestion_limit`). An unconfigured or failing Claude endpoint is a 503 `suggestions_unavailable`; the dialogs keep the device upload and the stop photos usable.

## Options Considered

### Option 1: Claude web search plus an API-side fetch, clean and signed preview (chosen)
- **Pros:** One Claude integration and one key. The CSP, the allow-list and the private store are untouched. Every photo a family sees was verified by content. The browser never contacts a third-party host. The chosen photo takes the existing storage path.
- **Cons:** Each search costs Claude tokens and up to six image fetches, and the previews live in API memory for 15 minutes. Licence and attribution come from the model's reading of the page and are shown for the person to judge; the admin dialog keeps them editable.

### Option 2: Return the image addresses and let the browser load them
- **Pros:** No fetch, no memory, no preview endpoint.
- **Cons:** Blocked by the CSP and the allow-list; would require opening `img-src` to the web. Leaks the family's activity to every host. Hot-links images that the site may not allow to be embedded.

### Option 3: A stock-photo API (Unsplash, Pexels) instead of web search
- **Pros:** Clean licensing, predictable JSON, free tiers.
- **Cons:** Generic photos rather than the actual place; a second vendor account and key; no coverage for a local park or a one-off event. Could be added later as a second source behind the same port.

### Option 4: Ingestion pre-fetches photos for every place
- **Pros:** No user-facing latency.
- **Cons:** Already covered by provider photos and the review queue (L2-120); does nothing for weekend covers chosen by mood or for profile photos.

## Consequences

### Positive
- Suggestions work on all three dialogs with one service, one component and one prompt.
- Nothing in the storage, signing, CSP or audit design changes shape; the feature adds a credit column and a source URL in the audit snapshot.
- The fetcher's address rules are unit-tested and shared by nothing else, so the allow-listed `HttpRemoteImageFetcher` keeps its narrower contract.

### Negative
- Suggestions are lost on an API restart and are not shared across instances; a second instance would need a distributed cache behind `IPhotoSuggestionStore`.
- Claude's licence reading can be wrong. The family app shows the attribution as a credit; the admin app asks the administrator to confirm it before saving.

### Risks
- Foundry's shared Claude quota is finite; the per-user hourly cap and the 503 path bound the blast radius.
- Image hosts can rate-limit the API's address; a dropped candidate only shortens the list.
