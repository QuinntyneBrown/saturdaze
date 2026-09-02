# Dead Code: Findings & Removal Plan

> Two-part document: **Findings (with evidence)** records what dead code was identified and the `file:line` proof; the **Removal plan** sequences the cleanup into verified batches. Produced by a multi-agent sweep + adversarial verification on 2026-06-08, then a per-finding evidence refresh and a documentation-accuracy critic.

## Implementation status (2026-06-09)

**Implemented and verified green** (committed on `main`):

- ✅ **Batch 1** — removed `RefreshToken.RevokedByIp`/`ReplacedByTokenId` (+ EF migration `20260609012844_RemoveUnusedRefreshTokenColumns` dropping both columns), `JwtOptions.RefreshTokenDays` (+ `appsettings.json` key + test override), `CalendarLinksDto`. **Gate:** `dotnet build` clean; `dotnet test` = 188 passed / 1 skipped / **0 failed** (Application 52, Cli 62, Infrastructure 24, Api 50).
- ✅ **Batch 2** — removed the unread frontend DTO mirror fields `category`/`driveMinutes` from `event-submission.dto.ts`. **Gate:** `npm run build -- api` + app build clean.
- ✅ **Batch 3** — removed `WeekendPlanService.swapBlock`/`markFavourite` (impl + contract + `SERVICE_API.md`). **Gate:** api build + vitest 9/9.
- ✅ **Batch 5** — removed the 5 orphaned CSS token groups from `_tokens.scss` (`--sd-indoor`, `--sd-lh-tight/-snug`, `--sd-s-0..9`, `--sd-r-sm`, `--sd-bp-tablet/-desktop`). **Gate:** components build clean; bare-token grep confirmed zero references and the `indoor` chip tone hardcodes its color (`chip.scss:18`), so zero render impact. (`docs/mocks` token CSS left untouched — mocks still reference `--sd-r-sm`/`--sd-indoor` and aren't deployed.)

**Deviations found during execution** (the code contradicted the plan — not implemented):

- ⏭️ **Batch 4 — SKIPPED (re-evaluated: NOT dead).** `ActivityFilter`, `FilterDef`, and `PresentationOverlay` are each *imported and used* — `ActivityFilter` by `activity-view.ts:11`, `FilterDef`/`PresentationOverlay` by `activity.service.ts:15-16,19,84`. They are named types used once each, so "removal" is only *inlining churn* that touches the public API surface, with no dead-code benefit. The plan's `FilterDef` step (`const FILTER_DEFS = [` with inferred type) would also **break the strict-mode build** — `match: (a) => …` becomes implicit `any`. Recommend dropping Batch 4 from the plan, or treating it as an optional style refactor, not dead-code removal.
- ⏸️ **Batch 6 — HELD (coupled to the Batch 7 decision).** Verification showed `RejectSubmissionDialog` is used **only** by `AdminEventsPage` (`openReject` + template button) — perfectly symmetric to `ApproveSubmissionDialog`, which the plan itself couples to the page in Batch 7. And `requireAdmin`, while referenced nowhere today, is the guard you'd need to **complete** the feature (per the caution note). So the entire orphaned-admin cluster (page + both dialogs + guard + profile link + e2e + mocks) is **one product decision** — finish the feature (add the `/admin/events` route) or scrap it — and deleting fragments now would leave a worse half-state. Held in full pending that decision.

**Resolved 2026-09-01** (the full-repo audit closed the held items):

- ✅ **Batch 6/7 — completed as a feature, not deleted.** `/admin/events` is now registered in `app.routes.ts` behind `requireAuth` + `requireAdmin`; `RejectSubmissionDialog` and `requireAdmin` are live. Spec L2-050 and ADR-006 stand.
- ✅ **`Commitment` model — removed**, together with the write-only `FamilyProfile.members`/`commitments` fields, `FamilyMember`, `WeekendPlan` and `Day` (the profile page reads `EditableFamilyProfile`).
- ↩️ **`RefreshToken.ReplacedByTokenId` — reinstated by design** (migration `AddRefreshTokenRotation`): `POST /api/auth/refresh` now rotates tokens and links the replacement, per L2-033 and ADR-007.

**Originally held for human decision** (kept for the record):

- ⏸️ **Batch 7** — `AdminEventsPage` directory (+ the coupled Batch 6 pieces above). Spec L2-050 / ADR-006 mandate this feature; the likely correct fix is to *finish* it, not delete it.
- ⏸️ **`Commitment`** — write-only public-`FamilyProfile`-contract field; removable only as a deliberate contract change (see Caution items).

---

## Overview

This document covers **20 unique verified findings: 18 safe to remove and 2 caution** (need human judgment), plus an appendix of ~44 symbols that *look* dead but are kept alive by indirection (MediatR/DI/EF/Angular-template/route/structural-typing). Work is organized into dependency-aware batches grouped by area (backend domain/contracts/auth, frontend api-lib models, service methods, components-lib CSS tokens, and the orphaned admin-events feature). Each batch must be built and tested before the next begins.

The **two caution items** are: (1) the orphaned `admin-events` admin-moderation page, unreachable only because its `/admin/events` route was never wired into `app.routes.ts` — likely *incomplete feature work* (spec L2-050, ADR-006) that should be **finished** rather than deleted; and (2) the `Commitment` model type, which is *write-only* — produced by `FamilyService` but never read — so removable only as a deliberate change to the public `FamilyProfile` contract and its producer.

### Counts

| Risk | Count |
| --- | --- |
| safe | 18 |
| caution | 2 (`admin-events` page dir, `Commitment` model) |
| keep (looks-dead-but-alive) | ~44 verified alive — DO NOT remove (see appendix) |

> De-duplication: the raw analysis double-counted `CalendarLinksDto` and `requireAdmin`; collapsed here to one symbol each. `Commitment` was re-classified from *safe* to *caution* during the evidence refresh (see the Findings re-classification note).

### By area

| Area | Symbols | Count |
| --- | --- | --- |
| Backend — Domain entity | `RefreshToken.RevokedByIp`, `RefreshToken.ReplacedByTokenId` | 2 safe |
| Backend — Application contracts | `CalendarLinksDto` | 1 safe |
| Backend — Infrastructure auth | `JwtOptions.RefreshTokenDays` | 1 safe |
| Frontend api-lib — models (interfaces/types) | `ActivityFilter`, `PresentationOverlay`, `FilterDef` | 3 safe |
| Frontend api-lib — DTO properties (frontend mirror only) | `EventSubmissionDto.driveMinutes`, `EventSubmissionDto.category` | 2 safe |
| Frontend api-lib — service methods | `WeekendPlanService.swapBlock`, `WeekendPlanService.markFavourite` | 2 safe |
| Frontend components-lib — CSS tokens | `--sd-s-0..9`, `--sd-bp-tablet/-desktop`, `--sd-lh-tight/-snug`, `--sd-r-sm`, `--sd-indoor` | 5 safe (token groups) |
| Frontend saturdaze app — orphaned admin feature | `requireAdmin` guard, `RejectSubmissionDialog` (safe); `AdminEventsPage` dir (caution) | 2 safe + 1 caution |
| Frontend api-lib — model (write-only) | `Commitment` | 1 caution |

---

## ⚠️ Reviewer correction (read before executing Batch 1)

Post-synthesis code review (reading `ApproveSubmissionCommandHandler.cs`, `EventSubmissionMapper.cs`, and `EventSubmission.cs` directly) **overrides the original Batch 1 `Category` cross-stack steps**:

- `backend/.../EventSubmissions/ApproveSubmissionCommandHandler.cs:65` reads `submission.DriveMinutes` → `LocalEvent.DriveMinutes`, and `:67` reads `submission.Category` → `LocalEvent.Category` when an admin approves a submission. `LocalEvent.Category`/`DriveMinutes` are then displayed on the public events page.
- **Therefore the backend `EventSubmission.Category` / `EventSubmission.DriveMinutes` columns and their `SubmitEventCommand` → handler → entity → `EventSubmissionDto` → mapper plumbing are ALIVE.** Do **not** drop the DB columns, do **not** remove the command/handler/mapper/contract members, and do **not** create the `RemoveEventSubmissionCategory` migration.
- **Only the two frontend TypeScript DTO mirror fields are removable** — `category` and `driveMinutes` in `frontend/projects/api/src/lib/models/event-submission.dto.ts` — because the Angular code never reads them off the response. These are handled together in **Batch 2** (frontend-only). Batch 1 below is now **backend-safe items only**.

---

## Findings — confirmed dead (with evidence)

Each finding below was re-verified against the working tree with current `file:line` references; all but one remain dead, and the single re-classification is called out in its own note at the end.

| Area | Symbol | Kind | Risk | Still dead? |
| --- | --- | --- | --- | --- |
| Backend — Domain | `RevokedByIp` | Entity property | safe | Yes |
| Backend — Domain | `ReplacedByTokenId` | Entity property | safe | Yes |
| Backend — Infrastructure | `RefreshTokenDays` | Options property + config | safe | Yes |
| Backend — Application | `CalendarLinksDto` | C# DTO record | safe | Yes |
| Frontend api-lib — DTO field | `driveMinutes` | DTO field (frontend mirror) | safe | Yes |
| Frontend api-lib — DTO field | `category` | DTO field (frontend mirror) | safe | Yes |
| Frontend api-lib — model | `ActivityFilter` | TS type | safe | Yes |
| Frontend api-lib — model | `Commitment` | TS interface | **caution (re-classified from safe)** | Removable only as a contract change |
| Frontend api-lib — model | `PresentationOverlay` | TS type | safe | Yes |
| Frontend api-lib — model | `FilterDef` | TS type | safe | Yes |
| Frontend api-lib — service method | `swapBlock` | Service method | safe | Yes |
| Frontend api-lib — service method | `markFavourite` | Service method | safe | Yes |
| Frontend components-lib — CSS token | `--sd-s-0 .. --sd-s-9` | CSS custom property | safe | Yes |
| Frontend components-lib — CSS token | `--sd-bp-tablet, --sd-bp-desktop` | CSS custom property | safe | Yes |
| Frontend components-lib — CSS token | `--sd-lh-tight, --sd-lh-snug` | CSS custom property | safe | Yes |
| Frontend components-lib — CSS token | `--sd-r-sm` | CSS custom property | safe | Yes |
| Frontend components-lib — CSS token | `--sd-indoor` | CSS custom property | safe | Yes |
| Frontend app — orphaned admin feature | `RejectSubmissionDialog` | Dialog component | safe | Yes |
| Frontend app — orphaned admin feature | `requireAdmin` | Route guard | safe | Yes |
| Frontend app — orphaned admin feature | `AdminEventsPage` | Routed page | **caution** | Yes |

---

### Backend — Domain

**`RevokedByIp` — `backend/src/Saturdaze.Domain/Entities/RefreshToken.cs`**

- **Evidence:** No active references found. Grep searched entire repo (backend/src excluding Migrations, frontend, e2e, docs) for "RevokedByIp" and found only: RefreshToken.cs:13 (definition), AppDbContextModelSnapshot.cs:431 (migration artifact), 20260518230316_AddEventSubmissions.Designer.cs:434 (migration artifact), 20260517015653_AddAuth.Designer.cs:293 (migration artifact), 20260517015653_AddAuth.cs:45 (migration artifact), dead-code-removal-plan.md (documentation). No usage in handlers, services, DTOs, controllers, tests, config, or frontend.
- **Removal:** 1. Delete property declaration at line 13 from backend/src/Saturdaze.Domain/Entities/RefreshToken.cs. 2. Create EF migration: `dotnet ef migrations add RemoveUnusedRefreshTokenColumns --project backend/src/Saturdaze.Infrastructure --startup-project backend/src/Saturdaze.Api`. 3. EF automatically updates AppDbContextModelSnapshot.cs. 4. Apply migration: `dotnet run --project backend/src/Saturdaze.Cli -- migrate`. No ripple: no DI registration, no test override, no configuration key, no public API export.
- **Scope:** Entity property only — domain model. Do not touch backend entity column (it is removed via EF migration, not manual edit). Do not touch CreatedByIp (line 12, alive per spec L2-033). Frontend has no corresponding DTO field for this property.

**`ReplacedByTokenId` — `backend/src/Saturdaze.Domain/Entities/RefreshToken.cs`**

- **Evidence:** Comprehensive grep of entire repo (backend/src, frontend/projects, e2e, docs/mocks, all *.cs, *.ts, *.tsx, *.js, *.json, *.html excluding bin/obj/node_modules/dist) found ZERO references outside migrations and documentation. Results: backend/src/Saturdaze.Domain/Entities/RefreshToken.cs:11 (definition only), backend/src/Saturdaze.Infrastructure/Migrations/20260517015653_AddAuth.cs (migration only - non-usage), backend/src/Saturdaze.Infrastructure/Migrations/20260517015653_AddAuth.Designer.cs:287 (migration only), backend/src/Saturdaze.Infrastructure/Migrations/20260518230316_AddEventSubmissions.Designer.cs:428 (migration only), backend/src/Saturdaze.Infrastructure/Migrations/AppDbContextModelSnapshot.cs:425 (snapshot only - non-usage), docs/dead-code-removal-plan.md:21,61,74 (documentation), docs/specs/L2.md:386,389 (spec). NO property access (`.ReplacedByTokenId`) found in application code. NOT set in LoginCommandHandler.cs, RegisterUserCommandHandler.cs, or ResetPasswordCommandHandler.cs where RefreshToken instances are created.
- **Removal:** 1. Delete line 11 (public Guid? ReplacedByTokenId { get; set; }) from backend/src/Saturdaze.Domain/Entities/RefreshToken.cs. 2. Create new EF migration: dotnet ef migrations add RemoveReplacedByTokenId --project backend/src/Saturdaze.Infrastructure --startup-project backend/src/Saturdaze.Api. This will auto-regenerate AppDbContextModelSnapshot.cs to drop the column from the model (EF handles DB schema removal). 3. Update docs/dead-code-removal-plan.md line 61 and line 74 (remove ReplacedByTokenId entry), update dead-code-removal-plan.md line 21 to remove ReplacedByTokenId from the count. 4. Update docs/specs/L2.md line 386 and 389 (remove reference to ReplacedByTokenId token-linking behavior in spec). No other ripples: property is never imported, injected, exported from public-api, tested, or configured.
- **Scope:** Backend entity property only. The property is defined at line 11 of RefreshToken.cs. It was planned as a feature (token replacement tracking) but never implemented in application logic. No frontend DTO mirror exists. Safe to remove without affecting any live feature.

---

### Backend — Infrastructure

**`RefreshTokenDays` — `backend/src/Saturdaze.Infrastructure/Authentication/JwtOptions.cs`**

- **Evidence:** backend/src/Saturdaze.Api/appsettings.json:19; backend/tests/Saturdaze.Api.Tests/Support/SaturdazeApiFactory.cs:46. No usage found via grep for RefreshTokenDays in JwtTokenService.cs, Program.cs, DependencyInjection.cs, or any frontend/e2e/CLI code. JwtOptions property is never read by any constructor-injected code.
- **Removal:** 1. Delete property declaration at backend/src/Saturdaze.Infrastructure/Authentication/JwtOptions.cs:11 ("public int RefreshTokenDays { get; set; } = 14;"). 2. Remove config key from backend/src/Saturdaze.Api/appsettings.json:19 ("RefreshTokenDays": 14,). 3. Remove test override from backend/tests/Saturdaze.Api.Tests/Support/SaturdazeApiFactory.cs:46 (["Saturdaze:Jwt:RefreshTokenDays"] = "14",). 4. No DI ripple: JwtTokenService only reads AccessTokenMinutes (line 30, 35); JwtBearerPostConfigure only reads Issuer, Audience, SigningKey. 5. No public-api.ts export (backend-only). 6. No test/snapshot ripples beyond config override removal.
- **Scope:** Backend options property only — no frontend mirror, no database column, no CLI config. JwtOptions is read via IOptions&lt;JwtOptions&gt; DI but the RefreshTokenDays property is never accessed by any handler or middleware code.

---

### Backend — Application

**`CalendarLinksDto` — `backend/src/Saturdaze.Application/Contracts/WeekendShareDto.cs`**

- **Evidence:** Searched ENTIRE repo (backend *.cs, frontend *.ts/*.tsx/*.html, e2e, docs, *.json, *.csproj, Directory.Packages.props, public-api.ts) with grep for "CalendarLinksDto" and properties "IcsUrl|WebcalUrl|GoogleCalendarUrl". Only match: WeekendShareDto.cs:5 (the definition itself). Zero usage references found in backend code, tests, or controllers. Frontend has structurally similar but independent CalendarLinks interface (weekend-plan.service.contract.ts:9–22, used in weekend-plan.service.ts:205–213 and product-action-dialog.html:5,11,17) — not the backend DTO.
- **Removal:** 1. Delete line 5 from backend/src/Saturdaze.Application/Contracts/WeekendShareDto.cs (the entire `public sealed record CalendarLinksDto(string IcsUrl, string WebcalUrl, string GoogleCalendarUrl);` declaration). 2. Keep line 3 `WeekendShareDto` — it is live (WeekendsController.Share():55,63). 3. No DI, import, test, config, or public-api ripples — CalendarLinksDto has zero references in backend code.
- **Scope:** Backend C# DTO only. Frontend TypeScript CalendarLinks interface (weekend-plan.service.contract.ts) is unrelated and stays. Companion WeekendShareDto record is alive and must not be touched.

---

### Frontend api-lib — DTO field

> **IMPORTANT scope guard for both fields below.** The backend `EventSubmission.Category` and `EventSubmission.DriveMinutes` entity columns are **ALIVE**: `ApproveSubmissionCommandHandler.cs` reads `submission.DriveMinutes` (~line 65) and `submission.Category` (~line 67) into the published `LocalEvent`, which is displayed on the events page. The backend command/handler/entity/contract/mapper plumbing **STAYS**. **Only the two TypeScript mirror fields** in `frontend/projects/api/src/lib/models/event-submission.dto.ts` (`category` at line 47, `driveMinutes` at line 51) are removable. Never drop the DB columns and never create a Category/DriveMinutes migration.

**`driveMinutes` — `frontend/projects/api/src/lib/models/event-submission.dto.ts`**

- **Evidence:** frontend/projects/api/src/lib/models/event-submission.dto.ts:51 (definition); docs/dead-code-removal-plan.md:25,38,44,47,87,94,98,102 (planning doc only); docs/specs/L2.md:244 (spec doc only); docs/detailed-designs/01-schedule-ingestion/README.md:291 (design doc only). No code references found - not accessed in: approve-submission-dialog.ts, reject-submission-dialog.ts, admin-events.page.ts, events.page.ts, or submit-event-dialog.ts.
- **Removal:** 1. Remove property declaration at line 51-51 from event-submission.dto.ts (including doc comment lines 49-50). 2. Confirm public-api.ts exports EventSubmissionDto from models barrel (not specific property, so no change needed). 3. No DI registration or imports affected (DTO is internal to api lib). 4. No tests reference EventSubmissionDto.driveMinutes. 5. No visual snapshots or config keys reference this field. This is a pure DTO property removal with no ripple effects.
- **Scope:** Frontend DTO property ONLY — backend EventSubmission entity column DriveMinutes is ALIVE and actively read by ApproveSubmissionCommandHandler.cs line 65 when publishing LocalEvents. Only the TypeScript mirror field in event-submission.dto.ts is removable. Companion field category (same DTO) is also dead but handled separately in Batch 2.

**`category` — `frontend/projects/api/src/lib/models/event-submission.dto.ts`**

- **Evidence:** Searched entire repo with Grep patterns: "category" (type: ts, frontend) found only in service implementations (ActivityService, EventsService) reading ActivityDto.category and LocalEventDto.category, NOT EventSubmissionDto.category; "\.category\b" (ts, frontend app) no matches; "category" (spec.ts) no matches; "category" (json) no matches. Backend confirms EventSubmission.Category column is alive: ApproveSubmissionCommandHandler.cs:67 reads submission.Category into LocalEvent.Category (displayed on events page via events.service.ts:71). Frontend TypeScript DTOs verified: event-submission.dto.ts:47 (the property) is never read by any page, dialog, or service. Public API barrel: event-submission.ts (line 2) re-exports EventSubmissionDto from dto file, but DTO property removal is non-breaking. No test/snapshot references to EventSubmissionDto.category found.
- **Removal:** Frontend DTO field removal (Batch 2 per dead-code-removal-plan.md): 1. Line 45-47: Remove the category property declaration (including doc comment "Category.") from frontend/projects/api/src/lib/models/event-submission.dto.ts. 2. No public-api.ts changes needed (DTO re-exported by barrel; property removal is non-breaking). 3. Verify: npm run build -- api. 4. Backend EventSubmission.Category column stays (alive per ApproveSubmissionCommandHandler.cs:67). 5. Frontend SubmitEventRequest.category (submit-event-request.ts:40) - SAME SITUATION (also dead frontend mirror, backend alive) - remove together in same batch per plan step 2.
- **Scope:** Frontend DTO field only. Backend EventSubmission.Category entity column and C# EventSubmissionDto.Category are ALIVE: ApproveSubmissionCommandHandler.cs:67 reads submission.Category → LocalEvent.Category; EventSubmissionMapper.cs:19 maps entity.Category → DTO; Category is configured in Infrastructure/EventSubmissionConfiguration.cs:19. Do NOT drop the DB column, do NOT remove backend entity property, do NOT create a migration. Only remove the frontend TypeScript mirror field (never read by Angular code).

---

### Frontend api-lib — model

**`ActivityFilter` — `frontend/projects/api/src/lib/models/activity-filter.ts`**

- **Evidence:** frontend/projects/api/src/lib/models/activity-view.ts:1 (import), activity-view.ts:11 (property type), activity.ts:3 (barrel re-export). No references in app, components, e2e, backend, or any config/JSON/HTML files. Grep searches: git grep -n "ActivityFilter" returns only these 4 lines across entire repo (excluding dead-code-removal-plan.md plan document).
- **Removal:** 1. Delete frontend/projects/api/src/lib/models/activity-filter.ts (entire file, lines 1-14). 2. In frontend/projects/api/src/lib/models/activity.ts:3, remove line: export type { ActivityFilter } from './activity-filter'; 3. In frontend/projects/api/src/lib/models/activity-view.ts:1, remove import statement and inline the type on line 11 (replace readonly filters property type with inline literal shape: readonly { readonly label: string; readonly tone: 'default' | 'primary' | 'leaf' | 'indoor' | 'sky' | 'sun' | 'warn' | 'accent'; }[]).
- **Scope:** Frontend TypeScript type only. ActivityView itself and the related activity.service.ts logic remain alive and consumed by the app. No backend impact (no DB column, no entity field, no migration).

**`PresentationOverlay` — `frontend/projects/api/src/lib/models/presentation-overlay.ts`**

- **Evidence:** frontend/projects/api/src/lib/models/presentation-overlay.ts:7 (definition); frontend/projects/api/src/lib/services/activity.service.ts:16 (import); frontend/projects/api/src/lib/services/activity.service.ts:84 (type annotation). Exhaustive searches found no other references in app, components lib, e2e, backend, or mock data.
- **Removal:** 1. Delete frontend/projects/api/src/lib/models/presentation-overlay.ts (lines 1-24). 2. Remove import at frontend/projects/api/src/lib/services/activity.service.ts:16. 3. Replace Record<string, PresentationOverlay> type annotation at frontend/projects/api/src/lib/services/activity.service.ts:84 with inline type Record<string, { readonly subtitle?: string; readonly ages?: string; readonly tag?: string; readonly why?: string }>. No public-api.ts barrel edit required.
- **Scope:** Frontend-only type used internally by ActivityService to overlay presentation metadata on activities. Not exported from public-api.ts, not consumed by app or any other service.

**`FilterDef` — `frontend/projects/api/src/lib/models/filter-def.ts`**

- **Evidence:** frontend/projects/api/src/lib/services/activity.service.ts:15 (import), frontend/projects/api/src/lib/services/activity.service.ts:19 (type annotation in const FILTER_DEFS). No other references found in app code, tests, templates, backend, or configs.
- **Removal:** 1. Delete file frontend/projects/api/src/lib/models/filter-def.ts (lines 9-13 containing the type definition). 2. In frontend/projects/api/src/lib/services/activity.service.ts: remove import at line 15 `import { FilterDef } from '../models/filter-def';` and change line 19 from `const FILTER_DEFS: ReadonlyArray<FilterDef> = [` to `const FILTER_DEFS = [` (let type be inferred). 3. No public-api.ts export to remove (FilterDef is not exported). 4. No DI registration, tests, or snapshots reference this type.
- **Scope:** Frontend api-lib model type only. Used to type a private constant in activity.service.ts. Not exported to public API. Safe to remove with no cross-stack impact.

---

### Frontend api-lib — service method

**`swapBlock` — `frontend/projects/api/src/lib/services/weekend-plan.service.ts`**

- **Evidence:** Search results confirm no consumer calls found: `git grep "\.swapBlock("` returned no results; `git grep "swapBlock"` returns only definition and docs: frontend/projects/api/src/lib/services/weekend-plan.service.contract.ts:115 (interface def), frontend/projects/api/src/lib/services/weekend-plan.service.ts:267 (method def), frontend/projects/api/src/lib/services/weekend-plan.service.ts:274 (error log within method), frontend/projects/api/SERVICE_API.md:149 (docs table row). No references in saturdaze app pages (home, itinerary, errand, saved). No references in components lib. No references in e2e tests. No references in backend.
- **Removal:** 1. Delete method implementation from weekend-plan.service.ts lines 260-276 (JSDoc + method body). 2. Delete method signature from weekend-plan.service.contract.ts lines 108-115 (JSDoc + interface member). 3. Remove swapBlock row from frontend/projects/api/SERVICE_API.md line 149. 4. Note: loadCurrent (line 96 in service.ts) stays alive — it's called from constructor at line 74 AND exported via public-api.ts barrel export at lines 52,63. After swapBlock removal, constructor call sustains it. 5. Note: IWeekendPlanService contract and weekend-plan.service implementation exports via public-api.ts (lines 52,63) stay intact — swapBlock method removal does not break barrel export semantics in TypeScript.
- **Scope:** Frontend TypeScript method only. Backend POST /api/blocks/{id}/swap endpoint and test coverage (backend/tests/Saturdaze.Api.Tests/Blocks/WeekendFlowTests.cs) remain untouched and alive. UI mockup icons/text in docs/mocks showing "swap" label are unrelated gallery artifacts, not functional code.

**`markFavourite` — `frontend/projects/api/src/lib/services/weekend-plan.service.ts`**

- **Evidence:** Grep of entire repo (backend, frontend, e2e, docs/mocks) found zero references to `markFavourite` outside the definition and its interface contract. The only mentions are: frontend/projects/api/src/lib/services/weekend-plan.service.ts:168 (method implementation), frontend/projects/api/src/lib/services/weekend-plan.service.contract.ts:76 (interface signature), frontend/projects/api/SERVICE_API.md:144 (documentation table, not code), docs/dead-code-removal-plan.md (planning document, not code). No component, page, template, test, e2e spec, backend endpoint, or seed JSON calls this method.
- **Removal:** Batch 3 (Batch numbering per dead-code-removal-plan.md): 1. Delete `markFavourite` method implementation (incl. JSDoc block lines 161–180) from frontend/projects/api/src/lib/services/weekend-plan.service.ts. 2. Delete `markFavourite` method signature (incl. JSDoc block lines 69–76) from frontend/projects/api/src/lib/services/weekend-plan.service.contract.ts. 3. Remove the `markFavourite` row (line 144) from frontend/projects/api/SERVICE_API.md. 4. No public-api.ts change required (exports whole interface/class, not individual methods). 5. Backend endpoints (PUT /api/weekends/{id}/favourite and supporting infrastructure) remain alive — they are tested by backend tests; only the frontend caller is dead.
- **Scope:** Frontend TypeScript service method and contract only. The backend endpoint PUT /api/weekends/{id}/favourite, its controller, and command/handler remain — this batch removes only the unused frontend caller. Backend tests still exercise the endpoint (backend/tests/Saturdaze.Api.Tests/Weekends/HistoryAndFavouriteTests.cs:58).

---

### Frontend components-lib — CSS token

**`--sd-s-0 .. --sd-s-9` — `frontend/projects/components/src/lib/styles/_tokens.scss`**

- **Evidence:** Exhaustive grep across entire repo found only: docs/mocks/styles/tokens.css:53-62 (documentation baseline copy, not deployed); frontend/projects/components/src/lib/styles/_tokens.scss:56-65 (the token declarations themselves); docs/dead-code-removal-plan.md:27,182 (plan documentation). Zero references found in: any SCSS component stylesheet (checked all 24 component .scss files); any CSS file in deployed code; any TypeScript/JavaScript file (app, api lib, services, etc.); any HTML template file (mocks are not deployed app code); any JSON seed or config file; any .csproj or Directory.Packages.props; no `var(--sd-s-*)` found in any CSS property value across the entire working tree. Searches run: `grep -r "--sd-s-[0-9]"` → only found in _tokens.scss + tokens.css baseline + docs; `grep -r "var(--sd-s-"` → zero matches; `grep -r "\bsd-s-[0-9]\b"` → only found in dead-code-removal-plan.md; checked all component SCSS files individually (button, card, activity-card, event-card, bottom-nav, etc.); verified global styles and index.scss forwards tokens but no component uses spacing tokens.
- **Removal:** Current removal per Batch 5 (dead-code-removal-plan.md:176-195): 1. Line 55: Delete comment `// Spacing — 4px base scale.` 2. Lines 56-65: Delete all 10 spacing custom properties (`--sd-s-0: 0;`, `--sd-s-1: 4px;`, `--sd-s-2: 8px;`, `--sd-s-3: 12px;`, `--sd-s-4: 16px;`, `--sd-s-5: 20px;`, `--sd-s-6: 24px;`, `--sd-s-7: 32px;`, `--sd-s-8: 40px;`, `--sd-s-9: 56px;`). Ripple effects: Update docs/mocks/styles/tokens.css (lines 52-62) in parallel for documentation baseline parity. No public-api.ts export (CSS custom properties have no TS barrel). No DI registration or TypeScript imports to remove. No component SCSS files import or use these tokens. No snapshot files or visual tests reference these tokens. Verify via `npm run build -- components` + `npm run test:visual`.
- **Scope:** Scope limited to the 10 CSS custom properties only — `--sd-s-0` through `--sd-s-9`. The spacing scale definition itself is unused, but components hardcode spacing values (e.g., `padding: 16px`, `gap: 8px`) rather than consuming `var(--sd-s-*)`. The comment block on line 55 and the entire 11-line section (55-65) can be safely removed. Do NOT touch surrounding color/typography/radius/elevation token sections. Ensure `--sd-lh-base` (line 48) remains — it is used by _global.scss:16 and is part of a separate unused token group (`--sd-lh-tight/-snug`), which is listed as a separate Batch 5 item. The breakpoint tokens `--sd-bp-tablet/-desktop` are also separate items in Batch 5.

**`--sd-bp-tablet, --sd-bp-desktop` — `frontend/projects/components/src/lib/styles/_tokens.scss`**

- **Evidence:** Grep search (sd-bp-tablet|sd-bp-desktop) across entire repo: only found in definition files — docs/mocks/styles/tokens.css:93-94, frontend/projects/components/src/lib/styles/_tokens.scss:97-98. Zero runtime usage: no var(--sd-bp-tablet) or var(--sd-bp-desktop) CSS calls, no getComputedStyle consumption, no TypeScript references. Breakpoint constants live exclusively in SCSS variables ($bp-tablet, $bp-desktop in _breakpoints.scss:5-6), consumed by respond-to() mixin (lines 10, 14). All @media queries use hard-coded pixel values (720px, 1024px) in component SCSS.
- **Removal:** 1. Delete lines 97-98 from frontend/projects/components/src/lib/styles/_tokens.scss (--sd-bp-tablet: 720px; and --sd-bp-desktop: 1024px;). 2. Delete corresponding lines 93-94 from docs/mocks/styles/tokens.css. 3. No public-api.ts export (CSS tokens not exported as TypeScript). 4. No DI or import ripples (styles forwarded via @forward "tokens" in index.scss:5 but never accessed). 5. No component SCSS changes (respond-to() mixin uses SCSS variables, not CSS custom properties). 6. No test snapshots reference these tokens. 7. Optional: remove or update comment block lines 92-96 in _tokens.scss if desired (documents breakpoint design; can be kept as context).
- **Scope:** CSS custom properties only — frontend DTO mirror field limitation does NOT apply here (that's for backend entity columns alive in handlers). The SCSS variables $bp-tablet/$bp-desktop in _breakpoints.scss remain ALIVE and in use.

**`--sd-lh-tight, --sd-lh-snug` — `frontend/projects/components/src/lib/styles/_tokens.scss`**

- **Evidence:** Grep found --sd-lh-tight and --sd-lh-snug defined in: frontend/projects/components/src/lib/styles/_tokens.scss:46-47 (definition only); docs/mocks/styles/tokens.css:43-44 (baseline mirror). No active references found in: any frontend component stylesheets (frontend/projects/**/*.scss) — grep for "lh-tight|lh-snug" returned only the definition file; any TypeScript files (frontend/projects/**/*.ts) — no matches; any HTML templates (frontend/projects/**/*.html) — no matches; any backend code (.NET files in backend/); any e2e tests (e2e/); any docs except the dead-code-removal-plan.md and tokens baseline. The only matching lines in the entire repo are the definitions themselves and the plan document.
- **Removal:** 1. Line 46: Delete `  --sd-lh-tight: 1.2;` from frontend/projects/components/src/lib/styles/_tokens.scss. 2. Line 47: Delete `  --sd-lh-snug:  1.35;` from frontend/projects/components/src/lib/styles/_tokens.scss. 3. In docs/mocks/styles/tokens.css (documentation baseline, keep in sync): Delete lines 43-44 (`--sd-lh-tight: 1.2;` and `--sd-lh-snug:  1.35;`). 4. Verify --sd-lh-base (line 48 in _tokens.scss) is preserved — it is actively used by frontend/projects/components/src/lib/styles/_global.scss:16. 5. No public-api.ts export needed (CSS variables are not exported). 6. No DI/import ripples (CSS variables are purely stylesheet tokens).
- **Scope:** CSS custom properties only — frontend tokens file. No backend column, no migration, no DTO/contract impact. The sibling --sd-lh-base (value 1.5) is ALIVE and must be preserved (used in _global.scss:16).

**`--sd-r-sm` — `frontend/projects/components/src/lib/styles/_tokens.scss`**

- **Evidence:** frontend/projects/components/src/lib/styles/_tokens.scss:68 (definition only); docs/mocks/styles/tokens.css:65 (design documentation baseline, not app code); docs/mocks/pages/privacy.html:78 (static mock artifact, not deployed). Grep searches for "var(--sd-r-sm)", "sd-r-sm", "border-radius.*8px", "border-radius" across all .ts/.tsx/.scss/.css/.html files confirmed no other active usage. git grep confirmed same.
- **Removal:** 1. Delete line 68 (`--sd-r-sm: 8px;`) from frontend/projects/components/src/lib/styles/_tokens.scss. 2. (Optional mock maintenance per line 191 of dead-code-removal-plan.md:) Either leave docs/mocks/pages/privacy.html:78 unchanged (mocks not deployed) or hardcode the resolved value (8px) for mock self-consistency; this does not block production removal.
- **Scope:** CSS custom property only — no TypeScript DTO fields, backend columns, or DI configuration involved. The token appears in no component SCSS files and is never referenced via var() in any active template or stylesheet. Safe removal confirmed with zero impact on rendered pixels (verified via grep of all component stylesheets).

**`--sd-indoor` — `frontend/projects/components/src/lib/styles/_tokens.scss`**

- **Evidence:** docs/mocks/pages/dialogs.html:501 (inline style attribute in mock gallery, not deployed code); docs/mocks/styles/tokens.css:29 (documentation baseline only, mirrors the SCSS definition). No production code references found.
- **Removal:** 1. Delete line 32 (`--sd-indoor: #C9B6E0;  // indoor chip`) from frontend/projects/components/src/lib/styles/_tokens.scss. Line numbers will shift after deletion of other tokens in Batch 5 (--sd-s-0..9 at lines 55-65, --sd-bp-tablet/desktop at 92-98, --sd-lh-tight/snug at 46-47, --sd-r-sm at 68), so verify final order in the file. 2. (Optional) Delete line 29 from docs/mocks/styles/tokens.css for documentation consistency, though this is not deployed. 3. (Optional) Replace the inline `var(--sd-indoor)` reference in docs/mocks/pages/dialogs.html:501 with the hex value `#C9B6E0`, or leave the mock as-is since it is not deployed.
- **Scope:** CSS custom property only — no DI registration, no public-api.ts export, no TypeScript usage. Not used in any component stylesheet (.scss). The mock dialogs.html and tokens.css are static documentation/design artifacts, not part of the deployed application. This token is purely declarational dead code.

---

### Frontend app — orphaned admin feature

**`RejectSubmissionDialog` — `frontend/projects/saturdaze/src/app/dialogs/reject-submission-dialog`**

- **Evidence:** frontend/projects/saturdaze/src/app/pages/admin-events/admin-events.page.ts:30-31 (import), line 90 (opened in dialog.open call); No other references found after exhaustive search of backend, frontend app + libs, e2e, docs/mocks, seed *.json, *.html templates, *.csproj, Directory.Packages.props, public-api.ts barrels.
- **Removal:** 1. Delete directory frontend/projects/saturdaze/src/app/dialogs/reject-submission-dialog/ (reject-submission-dialog.ts line 27, reject-submission-dialog.html, reject-submission-dialog.scss). 2. In admin-events.page.ts: remove import statement at lines 30-32 and remove openReject() method at lines 89-99 (Note: this page is unreachable due to missing /admin/events route, so these changes are purely to prevent compilation errors; if AdminEventsPage is later deleted in Batch 7, these edits become superseded). 3. No public-api.ts exports, no DI registrations, no test specs, no other ripples detected.
- **Scope:** Removal is safe and independent of whether AdminEventsPage (parent consumer) is completed or deleted. The dialog is dead regardless because AdminEventsPage is unreachable (route never registered in app.routes.ts). The backend Command/Handler/DTO symbols are alive and must NOT be touched.

**`requireAdmin` — `frontend/projects/saturdaze/src/app/auth/require-admin.guard.ts`**

- **Evidence:** Definition at frontend/projects/saturdaze/src/app/auth/require-admin.guard.ts:11. Zero active usages. Only documentation references: docs/user-contributed-events-plan.html:632 (planning text), docs/dead-code-removal-plan.md (analysis document). Comprehensive grep search across entire repo (*.ts, *.html, *.json, *.csproj, *.md, excluding node_modules/.deploy/.run) found no imports or usages outside the definition and documentation.
- **Removal:** 1. Delete file frontend/projects/saturdaze/src/app/auth/require-admin.guard.ts (all 20 lines, entire file). 2. No import removals—guard is not imported anywhere. 3. No DI/composition-root changes—never registered. 4. No public-api.ts updates—not exported. 5. No route registrations to remove—never added to app.routes.ts (verified app.routes.ts:1-177 has no requireAdmin reference). 6. No test files reference it. 7. Optional documentation update: docs/user-contributed-events-plan.html:632 and docs/adr/ADR-006-event-submission-flow.md to note removal pending feature completion (planning text only).
- **Scope:** Frontend TypeScript guard only. The AdminEventsPage component it protects (frontend/projects/saturdaze/src/app/pages/admin-events/) is a separate caution item (Batch 7 in plan) because it is feature-incomplete, not abandoned—deletion of requireAdmin is independent. No backend, no database, no DTO changes involved.

**`AdminEventsPage` — `frontend/projects/saturdaze/src/app/pages/admin-events`** — **risk: caution**

- **Evidence:** FRONTEND CONSUMER SEARCH: e2e/fixtures/sd-test.ts:24 (import statement), e2e/fixtures/sd-test.ts:46 (Pages interface property), e2e/fixtures/sd-test.ts:83 (fixture instantiation), e2e/pages/admin-events.page.ts:7 (e2e test page object, same-name class), e2e/tests/admin-events.spec.ts:6 (test file usage via goto("adminEvents")), e2e/fixtures/routes.ts:21 (route definition: adminEvents: { app: "/admin/events", mock: "/pages/admin.events.html" }), frontend/projects/saturdaze/src/app/pages/profile/profile.page.html:147 (routerLink to /admin/events), docs/dead-code-removal-plan.md (documentation references only), docs/mocks/index.html:49 (mock gallery link only). BOOTSTRAP/ROUTING SEARCH: frontend/projects/saturdaze/src/app/app.routes.ts — searched entire file; NO /admin/events route definition found; frontend/projects/saturdaze/src/app/app.config.ts — no AdminEventsPage import or DI reference; public-api.ts barrels — not exported from components or api libraries. DEAD CODE CONFIRMATION: Angular route `/admin/events` is NEVER registered in app.routes.ts (lines 1-176 checked complete); no route guard `requireAdmin` is applied to any route (only defined in isolation at require-admin.guard.ts, never imported by app.routes.ts); no module-level import of AdminEventsPage outside e2e test infrastructure; profile link at profile.page.html:147 `[routerLink]="['/admin/events']"` targets a non-existent route.
- **Removal:** CURRENT COMPONENT STATE (admin-events.page.ts:42): Line 42 export class AdminEventsPage implements OnInit { }; Line 35 selector 'app-admin-events'; Imports: Dialog, EVENT_SUBMISSIONS_SERVICE, ApproveSubmissionDialog, RejectSubmissionDialog. CURRENT RIPPLES: 1. profile.page.html:142-153 — "Admin tools" nav section with routerLink to /admin/events (lines ~142-153). 2. e2e/fixtures/sd-test.ts — three removals: Line 24 import { AdminEventsPage } from "../pages/admin-events.page.js", Line 46 adminEvents: AdminEventsPage (Pages interface property), Line 83 adminEvents: new AdminEventsPage(page) (fixture instantiation). 3. e2e/fixtures/routes.ts:21 — remove adminEvents route entry. 4. e2e/pages/admin-events.page.ts — delete entire test page object file. 5. e2e/tests/admin-events.spec.ts — delete entire spec file. 6. e2e/tests/visual/admin-events.visual.spec.ts — delete entire visual spec file. 7. e2e/tests/visual/admin-events.visual.spec.ts-snapshots/ — delete 3 visual snapshot PNG files (admin-events-full-mobile-win32.png, admin-events-full-tablet-win32.png, admin-events-full-desktop-win32.png). 8. frontend/projects/saturdaze/src/app/pages/admin-events/ — delete entire directory (admin-events.page.ts, .html, .scss). SECONDARY RIPPLES (per dead-code-removal-plan.md Batch 7, step 1): ApproveSubmissionDialog (frontend/.../dialogs/approve-submission-dialog/) becomes newly dead if AdminEventsPage is deleted (it is currently alive ONLY because AdminEventsPage imports and opens it at lines :26 and :78). NO PUBLIC-API EXPORT (not in components or api library public barrels). NO DI REGISTRATION (no provide statement in app.config.ts for this component). NO SPEC/CONFIG KEY (no appsettings entry).
- **Scope:** Scope: AdminEventsPage component only in the admin-events directory. DO NOT touch: backend EventSubmissionsController and EVENT_SUBMISSIONS_SERVICE (live production code); backend EventSubmission.Category and EventSubmission.DriveMinutes columns (alive per Reviewer Correction in dead-code-removal-plan.md); spec L2-050 and ADR-006 (reference the feature; will require update/supersession if deletion proceeds); ApproveSubmissionDialog (separate caution decision; currently alive only because AdminEventsPage imports it — becomes newly dead if this deletion proceeds per Batch 7 step 1 of plan); requireAdmin guard (separate caution decision; currently safe to delete but may be needed if feature is completed instead of abandoned). Key difference from typical dead code: this is a COMPLETE, FULLY-WIRED FEATURE that simply lacks the route registration in app.routes.ts. The page is connected to live backend, has e2e tests, visual snapshots, and design spec coverage. This is INCOMPLETE FEATURE WORK, not abandoned code. The caution rating reflects that the right decision may be to ADD THE ROUTE rather than DELETE the page.

---

### Re-classified during evidence refresh

**`Commitment` — `frontend/projects/api/src/lib/models/commitment.ts` — re-classified `safe` → `caution` (write-only).**

The original sweep proposed deleting `Commitment` as a self-contained dead vertical. The evidence refresh found it is *referenced*, so it is **not a clean safe delete** — but a deeper read shows it is **write-only**: produced by the service mapper yet read by nobody. So it is removable, but only as a deliberate public-contract change. Marked **caution**.

- **References (all producer/declaration/export — no reader):** `family-profile.ts:1` (import) + `:26` (the `commitments: readonly Commitment[]` field on the `FamilyProfile` interface); `family.ts:1` (re-export) → `public-api.ts:26` (transitive export); produced by `FamilyService` at `family.service.ts:31` (`PLACEHOLDER_PROFILE.commitments: []`) and `:117` (`mapFamily()` sets `commitments` from the DTO).
- **Why it is NOT alive:** nothing ever *reads* `FamilyProfile.commitments`. Every `.commitments` access in the app (`profile.page.html:59`, `profile.page.ts:139/145/161/216/224`) is on `EditableFamilyProfile.commitments` (type `EditableCommitment` from `family.service.contract.ts:83`) — a different type via a different signal (`getEditableProfile()`), not the api-model `FamilyProfile`. The read-only `FamilyProfile.commitments` field is filled in by the mapper and never consumed.
- **Why caution, not safe:** removing it edits the **public exported `FamilyProfile` interface** and its **producer** (`mapFamily()` + `PLACEHOLDER_PROFILE`), and `commitments` is a real domain concept the app fully supports via the editable path — so the read-only view omitting it may be an intentional gap, not dead weight. A human should confirm intent before dropping it from the contract. (Removal procedure is in the **Caution items** section below.)
- **Scope note:** Frontend TypeScript model only; the backend C# domain is a separate concern and is unaffected.

---

## Execution order

Batches are ordered **safe-first, then caution**, and within that, lowest-blast-radius first. The frontend model interfaces removed in Batch 4 are each referenced only by a structural property that is inlined in the same batch — no dead service depends on them, so no later ordering is required. The orphaned `admin-events` cluster (Batches 6 and 7) is deliberately last: the dead `RejectSubmissionDialog` and `requireAdmin` guard are removed first (safe), and the page directory itself is held for the caution review. **Per the reviewer correction above, the `EventSubmissionDto.category`/`driveMinutes` removals are frontend-DTO-only (Batch 2); the backend columns and command plumbing stay.**

1. **Batch 1** — Backend dead schema & contracts (RefreshToken props, `JwtOptions.RefreshTokenDays`, `CalendarLinksDto`)
2. **Batch 2** — Frontend-only DTO mirror fields: `EventSubmissionDto.driveMinutes` **and** `category` (TS type-narrowing; backend untouched)
3. **Batch 3** — Frontend unwired service methods: `swapBlock`, `markFavourite`
4. **Batch 4** — Frontend unused api-lib model types: `ActivityFilter`, `PresentationOverlay`, `FilterDef`
5. **Batch 5** — Components-lib unused CSS tokens (5 token groups)
6. **Batch 6** — Orphaned admin feature, safe parts: `RejectSubmissionDialog` dialog + `requireAdmin` guard
7. **Batch 7 (CAUTION — hold for human review)** — `AdminEventsPage` directory + profile nav link + e2e infra
8. **Caution — `Commitment`** (hold for human review) — remove only as a deliberate `FamilyProfile` contract change; see Caution items

---

## Batch 1 — Backend dead schema & contracts

| File | Symbol | Kind | Risk |
| --- | --- | --- | --- |
| `backend/src/Saturdaze.Domain/Entities/RefreshToken.cs` | `RevokedByIp` | property | safe |
| `backend/src/Saturdaze.Domain/Entities/RefreshToken.cs` | `ReplacedByTokenId` | property | safe |
| `backend/src/Saturdaze.Infrastructure/Authentication/JwtOptions.cs` | `RefreshTokenDays` | property | safe |
| `backend/src/Saturdaze.Application/Contracts/WeekendShareDto.cs` | `CalendarLinksDto` | sealed record | safe |

> The original draft listed an `EventSubmissionDto.Category` "cross-stack" row here. **Removed** per the reviewer correction above — the backend column is alive (read by `ApproveSubmissionCommandHandler.cs:67`). The frontend-only `category` field moved to Batch 2.

### Removal steps

**`RefreshToken.RevokedByIp`**
1. Delete the `RevokedByIp` property declaration (line 13) from `backend/src/Saturdaze.Domain/Entities/RefreshToken.cs`.
2. **Keep `CreatedByIp` (line 12)** — it is in `looksDeadButAlive` (spec L2-033). Do not touch it.

**`RefreshToken.ReplacedByTokenId`**
3. Delete the `ReplacedByTokenId` property declaration (line 11) from `backend/src/Saturdaze.Domain/Entities/RefreshToken.cs`.
4. After steps 1+3, create ONE EF migration covering both dropped columns: `dotnet ef migrations add RemoveUnusedRefreshTokenColumns --project backend/src/Saturdaze.Infrastructure --startup-project backend/src/Saturdaze.Api`. EF will regenerate `AppDbContextModelSnapshot.cs` automatically (drops `RevokedByIp` and `ReplacedByTokenId` from `RefreshTokens`). Do NOT hand-edit the existing `20260517015653_AddAuth.cs` migration.
5. Apply the migration: `dotnet run --project backend/src/Saturdaze.Cli -- migrate`.

**`JwtOptions.RefreshTokenDays`**
6. Delete `public int RefreshTokenDays { get; set; } = 14;` (line 11) from `backend/src/Saturdaze.Infrastructure/Authentication/JwtOptions.cs`.
7. Remove the `Saturdaze:Jwt:RefreshTokenDays` config key from each `appsettings.json` that defines it: `backend/src/Saturdaze.Api/appsettings.json` (the source of truth); the `.run/` and `.deploy/` copies (`.deploy/api-publish/appsettings.json`, `.run/api/appsettings.json`, `.run/publish-check/appsettings.json`) are build/publish outputs — regenerate them rather than hand-editing where practical.
8. Remove the test override `["Saturdaze:Jwt:RefreshTokenDays"] = "14",` (line 46) from `backend/tests/Saturdaze.Api.Tests/Support/SaturdazeApiFactory.cs`.
9. No DI changes: `JwtTokenService` and the `JwtBearer` post-configure only read `SigningKey` / `AccessTokenMinutes` / `Issuer` / `Audience`.

**`CalendarLinksDto`** (de-duplicated — appears twice in JSON, same symbol)
10. Delete the `CalendarLinksDto` record declaration (line 5) from `backend/src/Saturdaze.Application/Contracts/WeekendShareDto.cs`. **Keep the companion `WeekendShareDto` record** — it is used by `WeekendsController.Share()`. The frontend's independent `CalendarLinks` interface in `weekend-plan.service.contract.ts` is unrelated and untouched.

**`EventSubmissionDto.Category` — backend: DO NOT REMOVE (correction).** The entity column `EventSubmission.Category` and its plumbing (`SubmitEventCommand` → `SubmitEventCommandHandler` → `EventSubmission` → `EventSubmissionDto` → `EventSubmissionMapper`) are **alive**: `ApproveSubmissionCommandHandler.cs:67` copies `submission.Category` into `LocalEvent.Category`, which is displayed on the events page (`events.service.ts:71` → `events.page.html:53`). The same is true for `DriveMinutes` (`ApproveSubmissionCommandHandler.cs:65`). No backend file, no entity column, no migration, and no seed JSON is touched in this batch. The frontend-only TS DTO fields (`category`, `driveMinutes`) are removed in **Batch 2**.

### Verify after this batch
`dotnet build backend/Saturdaze.sln` then `dotnet test backend/Saturdaze.sln`.

---

## Batch 2 — Frontend-only DTO mirror fields: `driveMinutes` + `category`

| File | Symbol | Kind | Risk |
| --- | --- | --- | --- |
| `frontend/projects/api/src/lib/models/event-submission.dto.ts` | `driveMinutes` | property | safe |
| `frontend/projects/api/src/lib/models/event-submission.dto.ts` | `category` | property | safe |

### Removal steps
1. Remove the `driveMinutes` property declaration (and its doc comment, lines 49–51) from `frontend/projects/api/src/lib/models/event-submission.dto.ts`.
2. Remove the `category` property declaration (line 47) from the same file.
3. **Leave the backend untouched.** `EventSubmission.DriveMinutes`/`Category` and the C# `EventSubmissionDto.DriveMinutes`/`Category` are alive: `ApproveSubmissionCommandHandler.cs:65,67` copies both to the published `LocalEvent`, which the frontend DOES display (`events.service.ts:68,71` → `events.page.html:50,53`). Only the *frontend TypeScript DTO mirror* of these two fields is unused; the wire still carries them.
4. No `public-api.ts` change (DTO re-exported by barrel; property removal is non-breaking). Confirm no test or snapshot references `.driveMinutes`/`.category` on `EventSubmissionDto` before deleting.

### Verify after this batch
`npm run build -- api`, then `npm run build -- saturdaze --configuration development`.

---

## Batch 3 — Frontend unwired `WeekendPlanService` methods

| File | Symbol | Kind | Risk |
| --- | --- | --- | --- |
| `frontend/projects/api/src/lib/services/weekend-plan.service.ts` | `swapBlock` | method | safe |
| `frontend/projects/api/src/lib/services/weekend-plan.service.ts` | `markFavourite` | method | safe |

### Removal steps

**`swapBlock`**
1. Delete the `swapBlock` method implementation (incl. JSDoc, approx. lines 261–276) from `frontend/projects/api/src/lib/services/weekend-plan.service.ts`.
2. Delete the `swapBlock` method signature (incl. JSDoc, approx. lines 108–115) from `frontend/projects/api/src/lib/services/weekend-plan.service.contract.ts`.
3. Remove the `swapBlock` row from `frontend/projects/api/SERVICE_API.md` (line ~149).
4. **Keep `loadCurrent`** — `looksDeadButAlive`: it is called from the constructor (`:74`) AND from `swapBlock`. After `swapBlock` is deleted, the constructor call still keeps `loadCurrent` alive; verify the constructor `void this.loadCurrent();` line remains.
5. The static swap-dialog mockup in `docs/mocks/pages/dialogs.html:109` is a UI gallery artifact; it does not call `swapBlock`. Leave it.

**`markFavourite`**
6. Delete the `markFavourite` method implementation (approx. lines 161–180) from `frontend/projects/api/src/lib/services/weekend-plan.service.ts`.
7. Delete the `markFavourite` method signature (approx. lines 69–76) from `frontend/projects/api/src/lib/services/weekend-plan.service.contract.ts`.
8. Remove the `markFavourite` row from `frontend/projects/api/SERVICE_API.md` (line ~144).
9. No `public-api.ts` change (it exports the whole interface/class, not individual methods). The backend endpoints `POST /api/blocks/{id}/swap` and `PUT /api/weekends/{id}/favourite` remain — they are still covered by backend tests; only the frontend callers are dead. Do NOT remove the backend endpoints in this batch.

### Verify after this batch
`npm run build -- api`, then `npm test` (Vitest), then `npm run test:behavior` (e2e behavior — confirms no page relied on these methods).

---

## Batch 4 — Frontend unused api-lib model types

These three model types are each referenced only by a structural property that is inlined within this same batch. No dead *service* depends on them, so there is no later cross-batch ordering requirement — but the inline-replacement edits MUST land together with each file deletion. (`Commitment` was originally part of this batch but was re-classified to **caution** during the evidence refresh — see the Caution items section — because removing it changes the public `FamilyProfile` contract and its producer.)

| File | Symbol | Kind | Risk |
| --- | --- | --- | --- |
| `frontend/projects/api/src/lib/models/activity-filter.ts` | `ActivityFilter` | interface | safe |
| `frontend/projects/api/src/lib/models/presentation-overlay.ts` | `PresentationOverlay` | interface | safe |
| `frontend/projects/api/src/lib/models/filter-def.ts` | `FilterDef` | type | safe |

### Removal steps

**`ActivityFilter`**
1. Delete file `frontend/projects/api/src/lib/models/activity-filter.ts`.
2. In `frontend/projects/api/src/lib/models/activity.ts`: remove line 3 `export type { ActivityFilter } from './activity-filter';` (this is the only place `ActivityFilter` reaches `public-api.ts`, via `export * from './lib/models/activity'` on `public-api.ts:23`).
3. In `frontend/projects/api/src/lib/models/activity-view.ts`: remove line 1 `import { ActivityFilter } from './activity-filter';` and change line 11's property type from `readonly ActivityFilter[]` to an inline shape, e.g. `readonly { readonly label: string; readonly tone: ActivityTone }[]` (or reuse `FilterDef` ONLY if Batch order keeps `FilterDef`; since `FilterDef` is also being removed in this batch, inline the literal). Confirmed against the actual file: `activity-view.ts` imports `ActivityFilter` (line 1) and `ActivitySection` (line 2) and uses `ActivityFilter` at line 11.

**`PresentationOverlay`**
4. Delete file `frontend/projects/api/src/lib/models/presentation-overlay.ts`.
5. In `frontend/projects/api/src/lib/services/activity.service.ts`: remove the import (line 16) and replace `Record<string, PresentationOverlay>` (line 84) with the inlined shape `Record<string, { readonly subtitle?: string; readonly ages?: string; readonly tag?: string; readonly why?: string }>`. Not exported from `public-api.ts` — no barrel edit needed.

**`FilterDef`**
6. Delete file `frontend/projects/api/src/lib/models/filter-def.ts`.
7. In `frontend/projects/api/src/lib/services/activity.service.ts`: remove the import (line 15) and change `const FILTER_DEFS: ReadonlyArray<FilterDef> = [` (line 19) to `const FILTER_DEFS = [` (let the type be inferred from the literal). Not exported from `public-api.ts` — no barrel edit needed.

### Verify after this batch
`npm run build -- api`, then `npm run build -- saturdaze --configuration development` (the app consumes `ActivityView`), then `npm test`, then `npm run test:behavior` (activities specs exercise these types structurally).

---

## Batch 5 — Components-lib unused CSS tokens

All five token groups (one of which, `--sd-s-0..9`, is a 10-variable spacing scale) are pure CSS custom properties in `frontend/projects/components/src/lib/styles/_tokens.scss` with the mock baseline in `docs/mocks/styles/tokens.css`. None are exported from `public-api.ts`; CSS variables have no DI/reflection indirection.

| Symbol(s) | `_tokens.scss` lines | mock `tokens.css` lines |
| --- | --- | --- |
| `--sd-s-0` … `--sd-s-9` (spacing scale section) | 55–65 | 52–62 |
| `--sd-bp-tablet`, `--sd-bp-desktop` (+ comment block) | 92–98 | 89–94 |
| `--sd-lh-tight`, `--sd-lh-snug` | 46–47 | 43–44 |
| `--sd-r-sm` | 68 | (n/a — only privacy.html mock uses it) |
| `--sd-indoor` | 32 | 29 |

### Removal steps
1. In `frontend/projects/components/src/lib/styles/_tokens.scss`: delete the spacing section (lines 55–65), the breakpoint comment block + the two `--sd-bp-*` declarations (lines 92–98), the two line-height tokens `--sd-lh-tight`/`--sd-lh-snug` (lines 46–47), `--sd-r-sm` (line 68), and `--sd-indoor` (line 32). Verify the surrounding color/typography/radius/elevation sections remain intact, and that `--sd-lh-base` (used by `_global.scss:16`) is preserved.
2. In `docs/mocks/styles/tokens.css` (documentation baseline — keep in sync): delete spacing (52–62), `--sd-bp-*` (89–94), `--sd-lh-tight/-snug` (43–44), `--sd-indoor` (29). `--sd-r-sm` has no `tokens.css` definition to remove.
3. `docs/mocks/pages/privacy.html:78` references `var(--sd-r-sm)` and `docs/mocks/pages/dialogs.html:501` references `var(--sd-indoor)` — these are static design artifacts NOT part of the deployed app. Either leave them (mocks are not deployed) or hardcode the resolved values (`--sd-indoor` → `#5A3B82`) for mock self-consistency. Do not block production removal on the mock files.
4. Actual breakpoints come from `_breakpoints.scss` (`$bp-tablet`/`$bp-desktop` SCSS vars + `respond-to()` mixin) and hardcoded media queries (`dialog.scss:41`) — unaffected. Components hardcode spacing/colors today, so no component SCSS changes.

### Verify after this batch
`npm run build -- components`, then `npm run test:visual` (pixel-diff against committed baselines — confirms removing the unused tokens produced zero rendered-pixel change). If `test:visual` is green, no baseline re-capture is needed.

---

## Batch 6 — Orphaned admin feature: safe parts (`RejectSubmissionDialog` + `requireAdmin`)

These two are SAFE because they are dead **regardless of whether `admin-events` is later completed-or-deleted**: the dialog is consumed only by the not-routed page, and the guard is referenced by no route. Remove them before touching the page directory itself.

| File | Symbol | Kind | Risk |
| --- | --- | --- | --- |
| `frontend/projects/saturdaze/src/app/dialogs/reject-submission-dialog/` (dir) | `RejectSubmissionDialog` | standalone dialog | safe |
| `frontend/projects/saturdaze/src/app/auth/require-admin.guard.ts` | `requireAdmin` | route guard (`CanActivateFn`) | safe |

### Removal steps

**`RejectSubmissionDialog`**
1. Delete directory `frontend/projects/saturdaze/src/app/dialogs/reject-submission-dialog/` (`.ts`, `.html`, `.scss`).
2. In `frontend/projects/saturdaze/src/app/pages/admin-events/admin-events.page.ts`: remove the `RejectSubmissionDialog` / `RejectSubmissionDialogResult` import block (lines ~29–32) and the `openReject` method that opens it (lines ~89–99). **Note:** this edits the `admin-events.page.ts` that Batch 7 deletes wholesale — if Batch 7 is approved and runs together, deleting the page dir supersedes these edits. If Batch 7 is held (caution), these edits are still required so the page compiles without the deleted dialog.
3. Selector `app-reject-submission-dialog` appears in no template; not exported from any `public-api.ts`; no tests reference it. No further ripples.

**`requireAdmin`** (de-duplicated — appears 3x in JSON, same symbol)
4. Delete file `frontend/projects/saturdaze/src/app/auth/require-admin.guard.ts`.
5. No import/DI/`public-api.ts`/route ripples: `app.routes.ts` has no `canActivate: [requireAdmin]`. Documentation references (`docs/user-contributed-events-plan.html:632`, `docs/adr/ADR-006-event-submission-flow.md`) are planning text — leave them, or add a note that the guard was removed pending feature completion.

### Verify after this batch
`npm run build -- saturdaze --configuration development` (must compile with the dialog/guard gone — and, if Batch 7 is held, with the `admin-events.page.ts` edits from step 2 in place).

---

## Batch 7 (CAUTION — HOLD for human review) — `AdminEventsPage` directory

This is the **only caution item.** Remove only after a human confirms the admin-moderation feature is being **abandoned** rather than **completed**.

| File / dir | Symbol | Kind | Risk |
| --- | --- | --- | --- |
| `frontend/projects/saturdaze/src/app/pages/admin-events/` (dir) | `AdminEventsPage` | Angular page (component + template + styles) | **caution** |

### Why caution (do not auto-remove)
The page is fully implemented and wired to live infrastructure: it injects `EVENT_SUBMISSIONS_SERVICE` (which works against the real `EventSubmissionsController`), is targeted by a `[routerLink]="['/admin/events']"` in `profile.page.html:147`, has e2e behavior + visual specs and committed visual snapshots, and is mandated by **spec L2-050** ("Users with the `admin` role must have access to `/admin/events`") and **ADR-006** (Decision #2). The single missing piece is the route registration in `app.routes.ts` (commit `43cec3f` added the page but omitted the route). So this is **incomplete feature work, not abandoned code** — the correct fix may be to *add the route + `requireAdmin` guard* rather than delete. A human must decide: **complete** (wire the route, keep Batch 6 items too) or **delete** (proceed below).

### Removal steps (only if "delete" is chosen)
1. Delete directory `frontend/projects/saturdaze/src/app/pages/admin-events/` (`admin-events.page.ts`, `.html`, `.scss`). This also removes the consumer of `ApproveSubmissionDialog` — see ripple note in the appendix; if `AdminEventsPage` is deleted, `ApproveSubmissionDialog` (`frontend/.../dialogs/approve-submission-dialog/`) becomes newly dead and should be deleted in the same change (it is currently `looksDeadButAlive` ONLY because this page imports it at `admin-events.page.ts:26`/`:78`).
2. Remove the "Admin tools" nav link from `frontend/projects/saturdaze/src/app/pages/profile/profile.page.html` (lines ~142–153, incl. the `[routerLink]="['/admin/events']"` at :147). UI contract change — but the link 404s today since the route was never registered, so no live user path is lost.
3. e2e cleanup (test infra, not production): delete `e2e/tests/admin-events.spec.ts`, `e2e/tests/visual/admin-events.visual.spec.ts`, `e2e/pages/admin-events.page.ts`; remove the `AdminEventsPage` import + fixture registration from `e2e/fixtures/sd-test.ts` (lines 24, 46, 83); remove the `adminEvents` route entry from `e2e/fixtures/routes.ts:21`.
4. Delete the visual snapshots `e2e/tests/visual/admin-events.visual.spec.ts-snapshots/admin-events-full-*.png` (3 viewports).
5. Optionally delete the design mock `docs/mocks/pages/admin.events.html` if no longer a baseline source.
6. Update spec/ADR: deleting the page contradicts **L2-050** and **ADR-006**. If proceeding, file an ADR superseding ADR-006 (or amend L2-050) so the spec stays truthful. Do NOT silently leave the spec mandating a removed feature.

### Verify after this batch
`npm run build -- saturdaze --configuration development`, then `npm run test:behavior` and `npm run test:visual` (the admin-events specs/snapshots must be gone, not failing).

---

## Caution items (need human judgment before removing)

| Item | Why it needs judgment |
| --- | --- |
| `frontend/projects/saturdaze/src/app/pages/admin-events/` — `AdminEventsPage` (Batch 7) | The component is complete and connected to a working backend (`EventSubmissionsController` via `EVENT_SUBMISSIONS_SERVICE`), referenced by a profile nav link, covered by e2e + visual tests with committed snapshots, and **required by spec L2-050 and ADR-006**. It is unreachable only because the `/admin/events` route was never added to `app.routes.ts` (omitted in commit `43cec3f`). This is an **incomplete feature**, so the right action may be to finish it (add route + `requireAdmin` guard) rather than delete it. Removing it is a spec/ADR-contradicting decision a human must own. If kept, Batch 6's `RejectSubmissionDialog`/`requireAdmin` removals should be reconsidered (the dialog is genuinely unused, but `requireAdmin` would be needed to complete the feature). |
| `frontend/projects/api/src/lib/models/commitment.ts` — `Commitment` (re-classified from safe) | `Commitment` is **write-only**: produced by `FamilyService` (`family.service.ts:31` `PLACEHOLDER_PROFILE`, `:117` `mapFamily()`) and exported via `FamilyProfile` → `public-api.ts:26`, but **never read** — every `.commitments` reader uses `EditableFamilyProfile.commitments` (`EditableCommitment`), a different type. It is removable, but only as a deliberate change to the **public `FamilyProfile` contract** plus its producer, and `commitments` is a first-class domain concept the app fully supports via the editable path — so the read-only view omitting it may be an intentional gap. A human should confirm intent. |

### Removal procedure for `Commitment` (only if "remove" is chosen)
1. Delete file `frontend/projects/api/src/lib/models/commitment.ts`.
2. In `family-profile.ts`: remove the `import { Commitment } from './commitment';` (line 1) and the `commitments: readonly Commitment[]` property (the block around lines 23–26).
3. In `family.ts`: remove the `export type { Commitment } from './commitment';` re-export (line 1) — this is what reaches `public-api.ts:26`.
4. In `family.service.ts` (the producer): remove `commitments: []` from `PLACEHOLDER_PROFILE` (line 31) and the `commitments: dto.commitments.map(...)` block inside `mapFamily()` (around line 117). Leave `mapEditable()` and `saveProfile()` untouched — those drive the live editable path via `EditableCommitment`.
5. **Keep `FamilyProfile`, `FamilyMember`, `LikeChip`, `RhythmEntry`, `PreferenceToggle`** — all alive (see appendix).
6. **Verify:** `npm run build -- api`, then `npm run build -- saturdaze --configuration development`, then `npm test` and `npm run test:behavior` (profile specs exercise the editable path).

---

## Do NOT remove — looks dead but is alive

These symbols look unused by naive grep but are reached via an indirection mechanism. Listed so they are not re-flagged. **None of these should be removed by this plan.**

### Backend

| Symbol | Path | Kept alive by |
| --- | --- | --- |
| `RefreshToken.CreatedByIp` | `backend/src/Saturdaze.Domain/Entities/RefreshToken.cs` | Spec requirement L2-033 (`docs/specs/L2.md:386`) mandates the property exist for refresh-token IP tracking, even though impl is incomplete. |
| `System.Security.Cryptography.Xml` (PackageVersion pin) | `backend/Directory.Packages.props:34` | Transitive dep via `Microsoft.EntityFrameworkCore.SqlServer`; CVE mitigation (NU1903) promoted to error by `TreatWarningsAsErrors`. ADR-004. |
| `EventSubmissionDto.DriveMinutes` (C#) | `backend/src/Saturdaze.Application/Contracts/EventSubmissionDto.cs` | Approve handler copies it to `LocalEvent.DriveMinutes` → displayed on frontend (`events.service.ts:68` → `events.page.html:50`). Only the *frontend TS mirror* is dead (Batch 2). |
| `EventSubmissionDto.Category` (C#) | `backend/src/Saturdaze.Application/Contracts/EventSubmissionDto.cs` | Flows entity→DTO→approve→`LocalEvent.Category`→query→`events.service.ts:71` (`tag`)→`events.page.html:53`. Frontend DTO field unread, but the entity column feeds a displayed value — see the Reviewer correction near the top. |
| `EventSubmissionDto.ReviewedAtUtc` / `reviewedAtUtc` | `backend/.../EventSubmissionDto.cs:21`; `frontend/.../event-submission.dto.ts:71` | Set by Approve/Reject handlers, mapped by `EventSubmissionMapper.cs:25`, returned by `EventSubmissionsController` — live data contract (audit metadata) even though UI doesn't read it. |
| `EventSubmissionDto.RejectionReason` / `rejectionReason` | `backend/.../EventSubmissionDto.cs:22`; `frontend/.../event-submission.dto.ts:75` | Set by `RejectSubmissionCommandHandler:56`, mapped at `EventSubmissionMapper.cs:26`, asserted by `EventSubmissionsControllerTests.cs:163`. Live contract; no UI yet. |

### Frontend — admin feature (alive within the orphaned cluster)

| Symbol | Path | Kept alive by |
| --- | --- | --- |
| `AdminEventsPage` | `frontend/.../pages/admin-events/admin-events.page.ts` | Profile `routerLink`, e2e fixtures/specs/visual snapshots, spec L2-050, ADR-006, injected `EVENT_SUBMISSIONS_SERVICE`. (Caution item, not auto-removed — see Batch 7.) |
| `ApproveSubmissionDialog` | `frontend/.../dialogs/approve-submission-dialog/approve-submission-dialog.ts` | Imported + opened by `AdminEventsPage` (`:26`, `:78`). It is alive ONLY because `AdminEventsPage` lives. If Batch 7 deletes the page, delete this dialog in the same change (Batch 7 step 1). |

### Frontend — api-lib model types (alive via structural typing through service contracts → page templates)

All of the following are referenced only as property types inside a `*-View` / `*-Profile` interface that is a service-contract return type (`Signal<...>`) consumed by a page template. They are NOT directly imported by the app, but removing them breaks the public type contract and the template bindings.

| Symbol | Path | Reaches a live template via |
| --- | --- | --- |
| `ActivitySection` | `.../models/activity-section.ts` | `ActivityView.sections` → `ACTIVITY_SERVICE.list()` → `activities.page.html:22` |
| `ActivityTone` | `.../models/activity-tone.ts` | `Activity.tone` → `[tone]="a.tone"` (`activities.page.html:30`) |
| `ActivityView` | `.../models/activity-view.ts` | `IActivityService.list(): Signal<ActivityView>` → activities page |
| `Activity` | `.../models/activity.ts` | `ActivitySection.activities` → `activities.page.html:25` |
| `AnticipationTip` | `.../models/anticipation-tip.ts` | `WeekendOverview.anticipations` → `home.page.html:101-108` |
| `AvoidItem` | `.../models/avoid-item.ts` | `SavedView.avoid` → `saved.page.html:40-45` |
| `DayChip` | `.../models/day-chip.ts` | `DaySummary`/`Block` chips → `home.page.html:88-92` |
| `DayHeaderChip` | `.../models/day-header-chip.ts` | `ItineraryView.chips` → `itinerary.page.html:18-24` |
| `DayOption` | `.../models/day-option.ts` | `ItineraryView.dayOptions` → `itinerary.page.html:29` |
| `DaySummary` | `.../models/day-summary.ts` | `WeekendOverview` → `getOverview()` Signal → home page |
| `EventFilter` | `.../models/event-filter.ts` | `EventsView.filters` → `events.page.html:19` |
| `EventSection` | `.../models/event-section.ts` | `EventsView` → `IEventsService.list()` → events page |
| `EventSubmissionStatus` | `.../models/event-submission-status.ts` | `EventSubmissionDto.status` → `events.page.ts:62` (`.status`) |
| `EventsView` | `.../models/events-view.ts` | `IEventsService.list(): Signal<EventsView>` → events page |
| `FamilyMemberTone` | `.../models/family-member-tone.ts` | `FamilyMember.tone` → family profile contract |
| `FamilyMember` | `.../models/family-member.ts` | `FamilyProfile.members` → `getProfile()` Signal → profile page |
| `FamilyProfile` | `.../models/family-profile.ts` | `IFamilyService.getProfile(): Signal<FamilyProfile>` → `profile.page.html` |
| `FamilyVote` | `.../models/family-vote.ts` | `Restaurant.votes` → `restaurants.page.html:34,67,94` |
| `LikeChip` | `.../models/like-chip.ts` | `FamilyProfile.likes` → `profile.page.html:117` |
| `LocalEvent` | `.../models/local-event.ts` | `EventSection.events` → `events.page.html:45` |
| `PreferenceToggle` | `.../models/preference-toggle.ts` | `FamilyProfile.preferences` → `profile.page.html:128-136` |
| `QuickAction` | `.../models/quick-action.ts` | `WeekendOverview.quickActions` → `home.page.html:114` |
| `RestaurantFilter` | `.../models/restaurant-filter.ts` | `RestaurantView.filters` → `restaurants.page.html:11` |
| `RestaurantSection` | `.../models/restaurant-section.ts` | `RestaurantView` sections → restaurants page |
| `RestaurantView` | `.../models/restaurant-view.ts` | `IRestaurantService.list(): Signal<RestaurantView>` → restaurants page |
| `Restaurant` | `.../models/restaurant.ts` | `RestaurantSection.picks` → `restaurants.page.html:20-27` |
| `RhythmEntry` | `.../models/rhythm-entry.ts` | `FamilyProfile.rhythm` → `profile.page.html:103-108` |
| `SavedFilter` | `.../models/saved-filter.ts` | `SavedView.filters` → `saved.page.html:11` |
| `SavedView` | `.../models/saved-view.ts` | `ISavedService.list(): Signal<SavedView>` → saved page |
| `SavedWeekend` | `.../models/saved-weekend.ts` | `SavedView.recent` → `saved.page.html:21-30` |

### Frontend — other live indirection

| Symbol | Path | Kept alive by |
| --- | --- | --- |
| `nextHourFromNow` | `frontend/.../shared/next-hour-default.ts` | Internal call from `nextHourFromNowAsInputValue` (`:22`) + unit tests (`next-hour-default.spec.ts:7,17,24`). |
| `WeekendPlanService.loadCurrent` | `frontend/.../services/weekend-plan.service.ts` | Constructor init (`:74`) + (currently) `swapBlock` (`:272`) + `IWeekendPlanService` contract (`:46`). Stays alive via the constructor call after `swapBlock` removal (Batch 3 step 4). |

---

## Notes & limitations

- **Static analysis only.** These findings come from grep/import-graph reasoning and the supplied adversarial verification — **no test-coverage instrumentation or runtime tracing was run.** Treat each removal as a hypothesis to be confirmed by build + test.
- **Build + test each batch before starting the next.** The exact verify command is named at the end of every batch (`dotnet build`/`dotnet test backend/Saturdaze.sln`, `npm run build -- api|components|saturdaze`, `npm test`, `npm run test:behavior`, `npm run test:visual`). Do not chain batches without a green gate in between — a later batch's inline-type replacements depend on the prior barrel edits compiling cleanly.
- **EF migrations are forward-only in spirit here.** Always generate a NEW migration (Batch 1) rather than editing `20260517015653_AddAuth.cs`; run `saturdaze migrate` (the project does NOT migrate on startup) and confirm the regenerated `AppDbContextModelSnapshot.cs` is committed.
- **Visual baselines:** Batch 5 (CSS tokens) and Batch 7 (admin page) must pass `npm run test:visual` against committed baselines. Only re-capture baselines (`npm run baseline`) if an *intentional* rendered change lands — token removal should produce zero pixel diff, so a baseline re-capture there would mask a real regression.
- **De-duplication:** `CalendarLinksDto` (2 JSON entries) and `requireAdmin` (3 JSON entries) are each a single symbol; remove once.
- **Cross-stack correction (resolved):** code review confirmed `EventSubmission.Category` **and** `EventSubmission.DriveMinutes` (entity columns) are alive — `ApproveSubmissionCommandHandler.cs:65,67` copies both into the displayed `LocalEvent`. The original Batch 1 draft wrongly listed `Category` as a safe cross-stack removal; that has been corrected. Backend stays; only the two frontend TS DTO mirror fields are removed (Batch 2).
- **Spec/ADR truthfulness:** deleting `AdminEventsPage` (Batch 7) contradicts spec L2-050 and ADR-006. If the team chooses deletion, supersede/amend those documents in the same change so the spec does not mandate a removed feature.