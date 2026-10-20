# ADR-018 — A static marketing site at www.saturdaze.ca, and the app moves to app.saturdaze.ca

**Status:** Accepted
**Date:** 2026-10-20
**Category:** operations
**Deciders:** Quinntyne Brown
**Related:** [ADR-009](ADR-009-v2-responsive-shell.md) (site shell), [ADR-010](ADR-010-visual-parity-policy.md) (visual parity), [ADR-013](ADR-013-fluent-design-tokens.md) (tokens), [ADR-017](ADR-017-production-hosting-and-continuous-deployment.md) (hosting), L2-150 to L2-156.

## Context

The only page that tells a family what Saturdaze is lives inside the Angular app: the landing page at `/`, guarded so signed-in users skip it. It ships with the app's bundle, it cannot be indexed or shared on its own, and it has no room for a video, screenshots or Open Graph tags. Shelfie solved the same problem with a static marketing page at `www.shelfie.kids` and the app at `app.shelfie.kids`; Saturdaze follows that shape on its own hosting (ADR-017). The domain is `saturdaze.ca`, held at Namecheap; `saturdaze.app`, named in ADR-017, was never bound.

## Decision

1. **Hosts.** `https://www.saturdaze.ca` serves the marketing page. `https://app.saturdaze.ca` serves the Angular app. The bare domain `saturdaze.ca` redirects permanently to `https://www.saturdaze.ca/`. The API keeps its own host; it never served the marketing page.
2. **A fourth Static Web App.** `eng/infra/main.bicep` declares `sd-www-<suffix>` beside the family, admin and design-system apps, on the same SKU parameter. `www.saturdaze.ca` and the apex bind to it through `marketingCustomDomain` and `marketingApexDomain`; `app.saturdaze.ca` binds to the family app through the existing `appCustomDomain`. `deploy.yml` uploads `marketing/` in a `marketing-web` job and the smoke job loads the page and checks its security headers.
3. **Static page outside the workspace.** `marketing/` holds plain HTML, CSS and JavaScript with no framework and no build. It is not an Angular project, so the components-library rule does not apply to it. Its `staticwebapp.config.json` sets a strict Content-Security-Policy (`default-src 'self'`, no inline script or style) and the other security headers, so the page has no inline code and no third-party requests.
4. **Tokens are generated, not copied.** `npm run tokens` writes `marketing/assets/tokens.css` from the same TypeScript theme as `_tokens.scss`, and `tokens:check` fails CI when it is stale. Shelfie copies its token file by hand and lists that as a cost; here the theme stays the single source (ADR-013).
5. **The landing page leaves the app.** `/` and every unknown path redirect to `/weekend`; `requireAuth` sends an anonymous visitor on to `/sign-in?returnUrl=%2Fweekend`. The site bar wordmark and the auth shell's "Back to Saturdaze" link to the marketing site through `environment.siteUrl`. The legal page, the shared weekend and the dialogs gallery keep the site shell.
6. **One domain everywhere.** E-mail is sent from `no-reply@saturdaze.ca`, share and invite links are built on `https://app.saturdaze.ca` (`Share:AppOrigin`, derived from `APP_CUSTOM_DOMAIN`), the admin app links to it, and the seed accounts use `@saturdaze.ca` addresses.
7. **A brand video.** "Meet Saturdaze" (`docs/videos/44-meet-saturdaze`) is recorded from the real app and narrated with Azure Speech `en-US-JennyNeural`, `cheerful` style, rate `-5%`, the voice Shelfie's brand video uses. `tools/video-audio/generate-audio.mjs` gains an `azure` engine for it; the other videos keep the free Edge voices. The page serves the MP4 itself with a poster and the browser's controls; it does not autoplay.

## Options Considered

### Option 1: Static site on a fourth Static Web App (chosen)
- **Pros:** Same platform, same Bicep, same OIDC deploy; Free tier costs nothing; headers are declared in the repo.
- **Cons:** Static Web Apps has no first-class apex-to-www redirect (see Risks).

### Option 2: Keep the landing page in the Angular app
- **Pros:** No new host.
- **Cons:** The marketing page ships with the app, cannot carry its own metadata or strict CSP, and every copy change is an app release.

### Option 3: Serve the marketing page from the family Static Web App under a path
- **Pros:** One fewer resource.
- **Cons:** One host cannot be both `www` and `app`; the SPA navigation fallback and the app's CSP would apply to the marketing page.

## Consequences

### Positive
- A shareable, indexable page with Open Graph metadata, real screenshots and a one-minute video.
- The app's initial route is the app; nothing in the bundle exists only for visitors.
- Rolling the marketing page back is a revert of `marketing/`; it never touches the app.

### Negative
- The seed administrator is now `admin@saturdaze.ca`. Deploys do not run the seeder, so production keeps its existing `admin@saturdaze.app` row, which still signs in. If the seeder is ever pointed at production, rename that row first so it does not add a second administrator: `UPDATE Users SET Email = 'admin@saturdaze.ca', NormalizedEmail = 'admin@saturdaze.ca' WHERE NormalizedEmail = 'admin@saturdaze.app'` (the seeder matches on the lower-cased `NormalizedEmail`).
- The MP4 is committed twice (in `docs/videos/44-meet-saturdaze/` and `marketing/assets/video/`), a few megabytes each.
- `marketing/` is outside `frontend/`, so the husky hook does not format it; CI runs Prettier on it explicitly.

### Risks
- **Free-tier quota.** On 2026-10-20 the subscription already held eleven Free Static Web Apps across other projects, and a what-if of this template failed with `InvalidSkuName: This subscription has too many static sites with SKU: Free` for both `sd-admin-<suffix>` (ADR-014, not yet created) and `sd-www-<suffix>`. Either delete Free Static Web Apps that are no longer used, or set the repository variable `MARKETING_SWA_SKU=Standard` (US$9/month for this app alone; `swaSkuName` moves all of them).
- **Apex redirect.** Static Web Apps documents binding an apex domain (TXT validation plus an ALIAS record, which Namecheap supports) but not an automatic redirect to `www`. The plan binds the apex to `sd-www-<suffix>` and makes `www.saturdaze.ca` the default domain in the portal, then checks `curl -sI https://saturdaze.ca/` for a 301 to `https://www.saturdaze.ca/`. If that does not hold, leave `MARKETING_APEX_DOMAIN` blank and use Namecheap's URL redirect record for `@`. **Verified 2026-10-20:** with `www.saturdaze.ca` marked `isDefault` on its custom-domain resource (`PUT …/customDomains/www.saturdaze.ca` with `properties.isDefault: true`; the portal's "Set as default"), `https://saturdaze.ca/` answers `301 Location: https://www.saturdaze.ca/` with a valid certificate for the apex. The Namecheap fallback was not needed.

## Implementation Notes

- Repository variables: `APP_CUSTOM_DOMAIN=app.saturdaze.ca`, `MARKETING_CUSTOM_DOMAIN=www.saturdaze.ca`, `MARKETING_APEX_DOMAIN=saturdaze.ca`.
- Namecheap records for `saturdaze.ca`: `CNAME app` → the family Static Web App's default host; `CNAME www` → the marketing Static Web App's default host; `ALIAS @` → the marketing default host; TXT `_dnsauth.app`, `_dnsauth.www` and `_dnsauth` with the tokens from `az staticwebapp hostname show -n <swa> -g saturdaze-rg --hostname <host> --query validationToken -o tsv`.
- Local preview: `node e2e/fixtures/marketing-server.mjs ../marketing 4500` from `e2e/` serves the page with the production headers on `http://localhost:4500`, the dev `siteUrl`.
- Narration: `export SPEECH_REGION=canadacentral SPEECH_KEY=…` then `node tools/video-audio/generate-audio.mjs docs/videos/44-meet-saturdaze --engine azure`.
