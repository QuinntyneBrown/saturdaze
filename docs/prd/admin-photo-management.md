# PRD — Saturdaze Admin: Photo Management

> Status: draft · 2026-10-06
>
> Owner: Saturdaze product · Audience: product, design, backend, frontend
>
> Builds on: [L1-032](../specs/L1.md#l1-032-place-location-and-imagery),
> [L1-033](../specs/L1.md#l1-033-photo-led-discovery),
> [L1-034](../specs/L1.md#l1-034-weekend-cover-photo-and-photo-memories),
> [L2-100](../specs/L2.md#l2-100-store-place-photos-with-provenance),
> [L2-101](../specs/L2.md#l2-101-deliver-images-quickly-and-safely),
> [store-place-location-and-imagery](../detailed-designs/discovery/store-place-location-and-imagery/README.md),
> [ADR-008](../adr/ADR-008-per-user-family-scoping-and-auth-fallback.md),
> [ADR-012](../adr/ADR-012-storybook-design-system.md),
> [ADR-013](../adr/ADR-013-fluent-design-tokens.md)

## 1. Summary

Saturdaze now leads every idea card, weekend cover, and Past card with a place
photo. Those photos reach the catalog three ways: bundled seed JSON
(`Source = Curated`), provider-backed ingestion (`Source = Provider`), and — in
the enum but not yet in any flow — user submission (`Source = Submitter`). The
only way to change a curated photo today is to edit seed JSON and re-run
`saturdaze seed`; ingestion photos cannot be reviewed, replaced, or removed at
all.

This PRD defines **Saturdaze Admin**, a second Angular application in the
existing workspace (`frontend/projects/admin`) for the people who look after
the catalog. Its first and only job in v1 is **photo management**: find places
whose imagery is missing or poor, add and edit curated photos, choose the
primary photo, and review what ingestion brought in. It reuses the `components`
and `api` libraries, the same design tokens, the same JWT sign-in, and the same
API; it ships and deploys separately from the family app.

## 2. Problem

| # | Problem | Evidence in the codebase |
|---|---------|--------------------------|
| P1 | Curated photos can only change through a code change. | `SeedPhotos.Apply` upserts from `backend/src/Saturdaze.Cli/Seed/*.json`; there is no photo write endpoint. |
| P2 | Ingestion photos are unreviewed. A wrong or unflattering provider photo becomes primary when a place has none. | `CatalogUpserter.AddPhotosAsync` stores every attributed candidate as `Provider` and promotes the first. |
| P3 | Nobody can see which places have no photo, a disallowed URL, or missing alt text. | `PlacePhotoReader.Project` silently returns `null` for non-HTTPS or off-allow-list URLs; cards fall back to a tinted tile. |
| P4 | Ingestion photo rejections are recorded but invisible. | `IngestionRun.SkipReasons` is written and never surfaced. |
| P5 | Admin work lives inside the family app. | `/review-submissions` is the only admin surface; it shares the family shell, bottom nav and bundle. Adding catalog tooling there would grow a product meant to stay "radically simple" (mocks README). |

## 3. Goals and non-goals

### Goals

1. An administrator can bring any catalog place from "no photo" to "a good,
   licensed, accessible primary photo" in under two minutes, without a deploy.
2. Every photo shown to families has been either curated or reviewed by an
   administrator, and every review is auditable.
3. Photo coverage and photo health are measurable per catalog.
4. The admin app is a peer application in the workspace, sharing libraries,
   not code copied out of `projects/saturdaze`.

### Non-goals (v1)

- Editing non-photo catalog fields (name, schedule, drive time, location).
  The app is structured so these can follow (§12).
- Viewing or moderating **family-uploaded** photos (weekend cover uploads,
  profile avatars). These are private to the family by L1-034 and L2-109 and
  stay inaccessible to administrators.
- Moving `/review-submissions` out of the family app. See open question Q5.
- Image editing beyond what the server already does (no crop, filters, or
  retouching). Cropping for the 16:9 slot is a v2 candidate (§12).
- A second identity system. Admins sign in with their existing Saturdaze account.

## 4. Users

| Persona | Description | Needs |
|---------|-------------|-------|
| **Catalog curator** (primary) | A Saturdaze administrator (`UserRole.Admin`) who maintains the Port Credit catalog a few hours a week, usually on a laptop. | Find the worst gaps first; add a photo with correct credit quickly; trust that the next ingestion or seed run won't undo their work. |
| **Operator** (secondary) | The developer who runs ingestion and deployments. | See why ingestion skipped photos; confirm the allow-list matches what's stored. |

Families are not users of this app; they experience its output on the Ideas,
Weekend and Past screens.

## 5. Scope of v1

### 5.1 Screens

| ID | Screen | Purpose |
|----|--------|---------|
| A1 | **Sign in** | Reuses `sd-auth-shell` / `sd-auth-card` and `SESSION_STORE`. A signed-in non-admin sees "This account can't use Saturdaze Admin" with a sign-out action; nothing else loads. |
| A2 | **Photo health** (home) | Coverage per catalog (activities, restaurants, events): places with a primary photo, without any photo, with only unreviewed provider photos, with a blocked URL, with missing alt text. Each figure links to A3 pre-filtered. |
| A3 | **Places** | Searchable, filterable list of catalog places with the primary photo thumbnail rendered through `sd-media`, kind, photo count, and health flags. Filters: kind, health flag, source of primary, "upcoming events only". Sort: worst health first (default), name, recently changed. |
| A4 | **Place photos** | One place: its photos as tiles (source badge, licence, attribution, size, primary marker, review state), a live preview of the primary in the family-app slots (idea card 16:9 at 390 px and 1440 px, 4:3, cover with scrim and title), and the actions in §5.2. |
| A5 | **Review queue** | Provider photos not yet reviewed, newest first, with the place name and the photo it would replace. Keep, Make primary, or Reject in one step each. |
| A6 | **Ingestion photo skips** | Per `IngestionRun`, the photo skip reasons from `SkipReasons`, linked to the place when it exists. Read-only. |
| A7 | **Activity log** | Every photo change: who, when, place, action, before/after values. Filterable by place and administrator. |

Dialogs (CDK Dialog, per the "no inline forms" rule):

| ID | Dialog | Opened from |
|----|--------|-------------|
| AD1 | Add photo — upload | A4 |
| AD2 | Add photo — from URL | A4 |
| AD3 | Edit photo details (alt text, attribution, licence) | A4 tile |
| AD4 | Confirm make primary (shows the number of weekend covers that follow this place, §7.3) | A4, A5 |
| AD5 | Confirm remove photo (requires a replacement primary when removing the primary) | A4 |
| AD6 | Reject provider photo (optional reason) | A4, A5 |

### 5.2 Photo actions

| Action | Behaviour |
|--------|-----------|
| **Upload a curated photo** | JPEG, PNG or WebP up to 10 MB. The server verifies by content, re-encodes and strips metadata with the existing `IImageSanitizer`, records the real width and height, and stores it in **public curated storage** on an `ImageOptions.AllowedOrigins` origin (§7.2). `Source = Curated`. |
| **Add from URL** | HTTPS URL on an allowed origin only; anything else is refused before save with the reason, matching what `PlacePhotoReader` would do at projection. The server fetches the image once to verify type and dimensions. `Source = Curated`. |
| **Edit details** | Alt text, attribution, licence. Attribution and licence stay mandatory (L2-100). The URL is immutable — replace by adding and removing. |
| **Make primary** | Applies `PlacePhotoSet.MarkPrimary`; exactly one primary remains. |
| **Remove** | Deletes the photo row; deletes the stored file for curated uploads. Removing the primary requires choosing the next primary (default: next curated, else next reviewed provider photo), or explicitly leaving the place with no photo. |
| **Review provider photo** | *Keep* marks it reviewed; *Make primary* marks it reviewed and primary; *Reject* removes it and records its URL so ingestion never re-adds it. |
| **Reorder** | Not in v1; only primary vs. not-primary matters to any current screen. |

### 5.3 Rules that protect admin work

- **Ingestion never overrides an admin decision.** `CatalogUpserter` already
  leaves known URLs alone; it must also skip URLs an admin rejected, and it
  must not change which photo is primary on a place that has one.
- **Seeding never overrides an admin decision.** `SeedPhotos.Apply` must not
  reassign the primary or overwrite alt/attribution/licence on a photo an
  administrator has edited. Seeding stays idempotent and safe to re-run.
- **Curated beats provider for the default primary.** When a place gains its
  first curated photo and its current primary is an unreviewed provider
  photo, the curated photo becomes primary.

## 6. User stories and acceptance criteria

Criteria are written so each can become a Playwright (front end, Page Object
Model, Chromium only) or API integration test. Final IDs are assigned when they
enter `docs/specs/L2.md` (§10).

**US-1 Admin-only access.**
1. Given a signed-in non-admin, when they open the admin app, then they see the
   "can't use Saturdaze Admin" state and no catalog data is requested.
2. Given a non-admin token, when any `/api/admin/*` endpoint is called, then
   the response is 403 `forbidden` (as L2-050 AC3).
3. Given an anonymous request to any `/api/admin/*` endpoint, then the response is 401.

**US-2 See photo health.**
1. Given 20 activities of which 4 have no photo, when A2 loads, then the
   activities figure shows 16 of 20 with a primary photo and "4 without a
   photo" links to A3 filtered to those 4.
2. Given a primary photo on `http://` or an origin outside `AllowedOrigins`,
   then the place is counted and flagged as "blocked URL".

**US-3 Find a place.**
1. Given the search "harbour", then A3 lists places in any catalog whose name
   contains it, case-insensitively.
2. Given the default sort, then places with no photo appear before places with
   a blocked URL, which appear before places with only unreviewed provider photos.

**US-4 Upload a curated photo.**
1. Given a 3 MB JPEG with GPS EXIF, attribution "Photo · Saturdaze", licence
   "Saturdaze owned", when uploaded to a place with no photo, then it becomes
   primary, its stored file has no EXIF, and the place's idea card shows it.
2. Given a file named `.jpg` whose content is a PDF, then the response is 400
   `unsupported_image` and nothing is stored.
3. Given an 11 MB image, then the response is 413 and nothing is stored.
4. Given an empty attribution or licence, then the dialog's save is disabled
   and the API rejects the request with a field error.

**US-5 Add a photo from a URL.**
1. Given `http://images.example.com/a.jpg` or a non-allowed origin, then the
   dialog shows "This address isn't on the image allow-list" and nothing is saved.
2. Given an allowed HTTPS URL that returns HTML, then the response is 400
   `unsupported_image`.

**US-6 Choose the primary photo.**
1. Given a place with three photos, when the third is made primary, then
   exactly one photo has `IsPrimary = true` (L2-100 AC1) and the family app's
   idea card shows the new photo on next load.
2. Given 5 weekends whose chosen cover follows this place, then AD4 states
   "5 weekend covers will change" before confirming.

**US-7 Remove a photo.**
1. Given the primary of a place with two photos, when it is removed, then AD5
   requires choosing the remaining photo as primary or "no photo", and the
   result has at most one primary.
2. Given a curated upload is removed, then its stored file is deleted.

**US-8 Review ingestion photos.**
1. Given an ingestion run that added a provider photo, then it appears in A5
   until it is kept, promoted, or rejected.
2. Given a rejected provider photo, when ingestion runs again and returns the
   same URL for that place, then it is not stored and the run's skip reasons
   record "previously rejected".
3. Given a place whose primary was chosen by an admin, when ingestion adds a
   new provider photo, then the primary does not change.

**US-9 Seeding respects admin edits.**
1. Given an admin changed the primary on a seeded place, when `saturdaze seed`
   runs again, then the admin's primary is kept and nothing else changes.

**US-10 Accessible text.**
1. Given a curated photo saved with empty alt text, then A4 flags it as
   "missing alt text" and A2 counts it; families still see the
   `"Photo of {place}"` fallback (L2-100 AC4).

**US-11 Audit.**
1. Given any create, edit, primary change, removal, or review, then A7 lists it
   with the administrator's email, UTC timestamp, place, and before/after values.
2. Given an upload, then logs record the place ID and size but not the file
   name or image content (as L2-109 AC7).

## 7. Product and technical design notes

These notes constrain the detailed design; they are not the design itself.

### 7.1 Workspace and shared libraries

```
frontend/projects/
  components/   shared UI library (sd-* components, Fluent tokens) — unchanged role
  api/          shared data library — gains admin contracts + auth plumbing
  saturdaze/    family app — unchanged
  admin/        NEW application project
```

- `ng generate application admin` with `prefix: sd`, standalone components,
  the same `angular.json` builder, budgets, ESLint and Prettier configuration,
  and its own `public/staticwebapp.config.json`.
- The app consumes `components` and `api` through the existing path mappings;
  no component is copied. New UI the admin app needs (for example a photo tile
  with a source badge, or a data table row) is built in `components` with a
  Storybook story folder (ADR-012), so it is reviewable in the docsite and
  available to both apps.
- `authInterceptor`, `requireAuth` and `requireAdmin` currently live in
  `projects/saturdaze/src/app/auth/`. They move into the `api` library (or a
  secondary entry point such as `api/auth`) so both apps share one
  implementation; the family app's imports change, its behaviour does not.
- New services follow the contract + injection-token pattern:
  `ADMIN_PLACES_SERVICE`, `ADMIN_PHOTOS_SERVICE`, `ADMIN_AUDIT_SERVICE`. Admin
  pages depend on the tokens; `projects/admin/src/app/app.config.ts` binds the
  HTTP implementations, mirroring the family app's composition root.
- Global styles: the admin app loads the same foundation stylesheet and token
  output (`_tokens.scss`) as the family app. Admin-specific layout lives in
  component styles; colours are read by Fluent role, never hex (ADR-013).
- Layout: desktop-first (curators work on laptops) with a side navigation at
  ≥ 1024 px, but usable down to 390 px with no horizontal scroll. The family
  app's bottom-nav chrome handling (ADR-005) does not apply.

### 7.2 Backend

- **Endpoints** under `api/admin/`, each `[Authorize(Policy = "Admin")]` on top
  of the global fallback policy (ADR-008). Business rules live in MediatR
  handlers in `Saturdaze.Application/Admin/Photos/`; controllers stay thin.

  | Method | Route | Purpose |
  |--------|-------|---------|
  | GET | `/api/admin/photo-health` | A2 figures |
  | GET | `/api/admin/places?kind=&flag=&q=&sort=&page=` | A3 |
  | GET | `/api/admin/places/{kind}/{id}/photos` | A4 (every photo, not just the primary, with review state and cover-impact count) |
  | POST | `/api/admin/places/{kind}/{id}/photos` | Upload (multipart) or add by URL (JSON) |
  | PATCH | `/api/admin/photos/{photoId}` | Edit alt/attribution/licence |
  | POST | `/api/admin/photos/{photoId}/primary` | Make primary |
  | DELETE | `/api/admin/photos/{photoId}?nextPrimaryId=` | Remove |
  | POST | `/api/admin/photos/{photoId}/review` | `{ decision: keep \| primary \| reject, reason? }` |
  | GET | `/api/admin/photo-reviews` | A5 |
  | GET | `/api/admin/ingestion-runs/photo-skips` | A6 |
  | GET | `/api/admin/photo-audit` | A7 |

- **Domain changes** (`Saturdaze.Domain`): `PlacePhoto` gains `ReviewState`
  (`Unreviewed`, `Reviewed`; curated and seeded photos are `Reviewed`),
  `StorageKey` (nullable, curated uploads only), `UpdatedAt`, `UpdatedBy`, and
  `AdminLocked` (true once an administrator edits it — the flag seeding and
  ingestion respect, §5.3). New `RejectedPlacePhoto` (`PlaceKind`, `PlaceId`,
  `Url`, `RejectedAt`, `RejectedBy`, `Reason`) and `PhotoAuditEntry`. Migrations
  apply through `saturdaze migrate`; the API never migrates on startup.
- **Curated storage must be public.** The existing `IPhotoStore` is private and
  served only through short-lived signed URLs, which suits family uploads but
  not catalog photos: they are cached by browsers, shown on every family's
  cards, and must sit on an `AllowedOrigins` origin. Curated uploads need a
  separate public store (e.g. an Azure Blob container behind a CDN origin, or
  an unsigned `GET /api/catalog-photos/{key}`) added to both
  `ImageOptions.AllowedOrigins` and the family app's CSP `img-src`. The
  choice needs an ADR (§9).
- **CORS.** The admin app's origin is added to `Cors:AllowedOrigins`.
- **Family isolation.** Admin endpoints read catalog tables only. They never
  join `Weekends` except for the aggregate cover-impact count, which returns a
  number, never weekend or family identifiers.

### 7.3 Effects on the family app

- Changing a place's primary photo changes, on next load: its idea cards, the
  default cover of any weekend whose highlight is that place, and every
  weekend cover chosen as "From {place}" — `Weekend.CoverPlaceId` points at the
  place, not a specific photo, so Past cards follow too. AD4 makes this visible
  (US-6 AC2). Pinning a cover to a specific photo is out of scope.
- No family-app screen, route, or DTO changes in v1 other than the auth
  plumbing move in §7.1.

### 7.4 Delivery

- `frontend/package.json` gains `start:admin` and `build:admin`; CI lints,
  format-checks, unit-tests and builds both apps.
- `deploy.yml` gains an admin web job uploading `dist/admin/browser` to its own
  Azure Static Web App (separate deployment token), after migrations, like the
  family app. A separate host keeps admin code out of the family bundle and
  lets the admin origin be restricted later (e.g. SWA access restrictions).
- `e2e/` gains an admin Playwright project (Chromium only) with one page object
  per admin screen and dialog; the existing mobile/tablet/desktop projects are
  unchanged.

## 8. Non-functional requirements

| Area | Requirement |
|------|-------------|
| Security | Server-side Admin policy on every admin endpoint; client guards are UX only. Uploads verified by content, re-encoded, metadata stripped; 10 MB limit enforced before buffering. URL adds fetch only HTTPS allowed origins (no SSRF to internal hosts), with a timeout and size cap. |
| Privacy | No access to family uploads, avatars, family data, or weekend identifiers. Logs omit file names and image bytes. |
| Accessibility | WCAG 2.1 AA, same rules as the family app: keyboard-operable dialogs (CDK focus trap), visible focus, labelled controls, status changes announced. The admin app nudges curators toward alt text (US-10). |
| Performance | A3 renders 50 places per page with lazy thumbnails through `sd-media`; A4 previews request slot-sized images (L2-101 AC4). |
| Consistency | Same Fluent tokens, BEM-parity components and Storybook coverage as the family app. |
| Observability | Request logging and exception middleware ordering unchanged; admin actions emit structured logs with place ID and action. |

## 9. Decisions to record

| ADR | Decision |
|-----|----------|
| ADR-014 | Admin tooling is a separate Angular application in the workspace, sharing `components` and `api`, deployed to its own Static Web App. |
| ADR-015 | Public storage and serving for curated photos, distinct from the private signed-URL store for family uploads; how its origin joins `AllowedOrigins` and the CSP. |

## 10. Path to implementation

AGENTS.md requires a requirement, a detailed design and a mock before any
production change, and every slice is delivered with the
`implementing-incrementally` skill and ATDD.

1. **Requirements.** Add L1-036 "Catalog photo administration" and L2s for each
   user story (§6) through the `engineering-requirements` skill.
2. **Detailed designs.** `docs/detailed-designs/administration/` gains
   `manage-place-photos/`, `review-ingested-photos/` and
   `scaffold-admin-application/` through the `writing-software-design-documents` skill.
3. **Mocks.** `docs/mocks/pages/admin.*.html` for A1–A7 and AD1–AD6 added to
   the dialogs gallery, using the existing `_shell.html` conventions and
   screenshots at 390 / 820 / 1440.
4. **ADRs** 014 and 015.
5. **Slices** (each: Given-When-Then criteria → failing acceptance test →
   minimal code → regression checks):

   | # | Slice | Proves |
   |---|-------|--------|
   | S1 | Scaffold `projects/admin`, move auth plumbing into `api`, A1 sign-in + admin gate | US-1 |
   | S2 | `GET /api/admin/places` + A3 list (read-only) | US-3 |
   | S3 | A4 place photos with previews (read-only) | A4 rendering |
   | S4 | Make primary + AD4 with cover-impact count | US-6 |
   | S5 | Edit details + AD3, `AdminLocked`, seeding respects it | US-9, US-10 |
   | S6 | Curated public store (ADR-015) + upload AD1 | US-4 |
   | S7 | Add from URL AD2 | US-5 |
   | S8 | Remove + AD5 | US-7 |
   | S9 | Review state, A5 queue, rejection list honoured by ingestion | US-8 |
   | S10 | A2 photo health | US-2 |
   | S11 | A6 ingestion skips, A7 audit log | US-11 |
   | S12 | Admin SWA deploy job and CORS | Delivery |

## 11. Success metrics

- ≥ 95 % of activities and restaurants, and ≥ 80 % of upcoming events, have a
  primary photo that projects (not blocked) within four weeks of launch.
- 100 % of primary photos are curated or reviewed.
- 0 places with a blocked primary URL.
- Median time from opening A4 to a saved primary photo under two minutes.
- No admin decision reverted by a seed or ingestion run (from the audit log).

## 12. Future scope

- Catalog field editing (name, schedule, location, drive time) and catalog
  place creation/retirement in the same app.
- Moving event-submission moderation (`/review-submissions`, L2-050) into the
  admin app (Q5).
- Moderation of `Source = Submitter` photos once event submissions accept photos.
- Focal point / crop per slot so 16:9 and 4:3 frames keep the subject.
- Photo provider search inside AD2 (e.g. a licensed stock or places API), with
  attribution and licence filled from the provider.
- Bulk actions in A5.

## 13. Open questions

| # | Question | Default if unanswered |
|---|----------|-----------------------|
| Q1 | Public curated storage: Azure Blob + CDN, or an unsigned API route? | Azure Blob container on the existing storage account, its origin added to `AllowedOrigins` and CSP. |
| Q2 | Licence values: free text, or a fixed list (CC BY 4.0, CC BY-SA 4.0, CC0, Saturdaze owned, Provider terms)? | Fixed list plus "Other" with free text. |
| Q3 | Should alt text be mandatory for curated photos, rather than only flagged? | Flagged in v1; mandatory after the backlog is cleared. |
| Q4 | Admin app hostname and whether to add network-level access restriction beyond the Admin role. | `admin.` subdomain on its own SWA; role check only in v1. |
| Q5 | Move `/review-submissions` into the admin app now, later, or never? | Later (§12); the family app keeps it in v1 and links to the admin app from the role-gated Family › Admin section. |
| Q6 | Should a weekend cover chosen "From {place}" be pinned to the photo that was primary at the time? | No; covers follow the place's primary, made visible by AD4. |
