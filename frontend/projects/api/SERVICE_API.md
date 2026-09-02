# api — Public API

Pages inject the `*_SERVICE` tokens and depend only on the contracts; the
concrete classes below are bound in `app.config.ts`. Every screen reads one
reactive view model (`Signal<…View>`) and calls plain methods to change it.
Pure helpers (dates, formatting, weather words, projections) are exported
from `lib/api/` so every page shares one implementation.

## Helpers

| Module | Exports | Description |
| --- | --- | --- |
| `lib/api/weekend-dates` | `upcomingSaturdayIso`, `addDaysIso`, `parseIsoDate`, `toIsoDate`, `localIsoDate`, `weekendDates`, `weekendDayIso`, `monthAbbr`, `formatWeekendRange`, `formatWeekendSpan`, `formatDayDate`, `formatEventDate`, `formatWeekendEyebrow`, `calendarFileName` | `upcomingSaturdayIso()` mirrors the backend rule (Sat → today, Sun → yesterday, otherwise the coming Saturday). `formatDayDate` "17 May", `formatEventDate` "Sat 17 May", `formatWeekendEyebrow` "10 – 11 May 2026", `calendarFileName` "weekend-17-may.ics". |
| `lib/api/format` | `MONTH_ABBR`, `formatWhen`, `dateTileParts`, `timeAgo`, `hhmm`, `hhmm12`, `clock12`, `toMinutes`, `minutesBetween`, `timeRange`, `formatMinutes`, `formatDuration`, `numberWord`, `capitalise`, `initialOf` | `hhmm` is the 24-hour rail clock ("17:00"); `timeRange` is 12-hour with one suffix ("9:00 to 10:00", "5:00 to 6:00pm", "10:00am to 2:00pm"); `formatDuration` keeps minutes up to 90 ("60m", "90m", "2h"); `numberWord(12)` → "twelve". |
| `lib/api/weather` | `forecastFor`, `weatherIcon`, `weatherWord`, `weatherWordCapitalised`, `weatherAdjective`, `weatherNote`, `isOutdoorFriendly`, `isWetDay`, `roundOrDash` | Forecast tags → icon / copy / "can we be outside?". `weatherAdjective` ("sunny", "rainy", "cloudy"…) fronts a day in copy; `weatherNote` is the day-header line ("Light breeze, good for outdoors"). |
| `lib/api/weekend-projection` | `projectWeekend`, `projectDay`, `toBlockRow`, `weekendSubtitle`, `blockIcon`, `dayKeeping`, `bySortThenStart` | `WeekendDto` → `WeekendView`, shared by the weekend service and the read-only share page. `projectWeekend(null)` is the loading view; `projectWeekend(null, 'empty')` the first-weekend view; a dto with zero blocks is `empty`. |
| `lib/api/errand-placement` | `placementFor` | Diffs the weekend before and after `POST …/errands` to find the new errand block (falls back to the newest errand with the same description). |
| `lib/api/history-filters` | `PAST_FILTERS`, `pastFilterChips`, `matchesPastFilter`, `skippingChips`, `filterEmptyCopy`, `SKIP_RATING_CEIL` | Client-side filtering for the Past page (`All`, `Favourites`, `This year`, `5★`), the "Skipping next time" chips and the empty-filter copy. |
| `lib/api/family-presentation` | `memberRole`, `memberSubtitle`, `commitmentDayLabel`, `commitmentSubtitle`, `commitmentIcon`, `kidsPhrase`, `membersSummary`, `commitmentsSummary`, `joinNames`, `ADULT_AGE` | Role is derived from age (18+ is a parent). "Parent · 38", "Saturdays · 9:00 to 10:00", "Eli and Mae", "2 parents · Eli 9 · Mae 5". |

## View models

One barrel per screen under `lib/models/`; `chip-view` and `filter-chip` are shared.

| Barrel | Types |
| --- | --- |
| `models/weekend` | `WeekendView { status; id; weekendOf; headline; subtitle; days; blockCount }`, `DayView { day; dateIso; dateLabel; weather; meta; locked; keeping; blocks }`, `BlockRow { id; day; kind; refId; time; timeRange; duration; durationMinutes; icon; title; subtitle; reason; chips; locked; commitment; errand; done; drive; highlight; swappable; lockable }`, `ErrandPlacement`, `CalendarExport`, `WeatherDay`, `WeekendDay`, `BlockKind`, `WeekendStatus` |
| `models/ideas` | `IdeasActivitiesView`, `ActivitySection`, `ActivityCard`, `IdeasFoodView`, `FoodFilters`, `FoodSection`, `FoodCard`, `FamilyVote`, `IdeasEventsView`, `EventSection`, `EventCard`, `DateTile`, `MealSlot`, `Vote`, `VoterTone` |
| `models/past` | `PastView { status; subtitle; filters; weekends; skipping; filterEmpty }`, `PastWeekendCard` |
| `models/family` | `FamilyView { status; headline; subtitle; home; members; commitments; likes; dislikes; preferences; plannedAround }`, `MemberRow`, `CommitmentRow` (one per backend row), `PlannedAroundRow`, `PreferenceToggle`, `DayOfWeek`, `memberTone` |
| `models/review` | `ReviewView { status; subtitle; cards }`, `SubmissionCard` |
| `models/event-submission` | `EventSubmissionDto`, `EventSubmissionStatus`, `SubmitEventRequest` |
| `models/chip-view`, `models/filter-chip` | `ChipView { tone; icon?; label }`, `ChipTone`, `FilterChip { label; tone; icon?; active }` |

DTO files (`*.dto.ts`) stay service-internal.

## Classes

### `ActivityService`

_Implements: `IActivityService`_

Loads the catalogue, the `tryNew` picks and the weekend forecast, then groups them into "Right for this weekend's weather" / "If the weather turns" / "Try something new". The subtitle comes from the family ("Picked for Eli and Mae, under 45 minutes from Port Credit."). Six filter chips, always shown; empty sections are dropped while a filter is active.

**Methods**

| Method | Parameters | Returns | Description |
| --- | --- | --- | --- |
| `list` | `()` | `Signal<IdeasActivitiesView>` | The Activities segment for the active filter. |
| `load` | `()` | `Promise<void>` | `GET /api/activities`, `GET /api/activities?tryNew=true`, `GET /api/weather?weekendOf=`. |
| `setFilter` | `label: string` | `void` | `All` · `Outdoor` · `Indoor` · `Under 30 min` · `Ages 5+` · `Weather-safe`; unknown labels fall back to `All`. |

### `AuthService`

Real HTTP `IAuthService`. Bound to `AUTH_SERVICE` in the application composition root. Every method funnels backend errors through `rethrowAsAuthError` so the session store sees the uniform `AuthError` shape regardless of transport quirks.

_Implements: `IAuthService`_

**Methods**

| Method | Parameters | Returns | Description |
| --- | --- | --- | --- |
| `signUp` | `req: SignupRequest` | `Promise<{ token: AuthToken; user: User }>` | `homeLocation` is optional (`string \| null`). |
| `login` | `req: LoginRequest` | `Promise<{ token: AuthToken; user: User }>` | Login. |
| `refresh` | `req: RefreshRequest` | `Promise<{ token: AuthToken; user: User }>` | Exchange a refresh token for a new access + refresh pair; a 401 rejects with `token_expired`. |
| `logout` | `req: LogoutRequest` | `Promise<void>` | Best-effort server-side revocation of the refresh token (4 s timeout). |
| `forgotPassword` | `req: ForgotPasswordRequest` | `Promise<void>` | Forgot Password. |
| `resendVerification` | `req: ResendVerificationRequest` | `Promise<void>` | Resend Verification. |
| `resetPassword` | `req: ResetPasswordRequest` | `Promise<void>` | Reset Password. |
| `verifyEmail` | `req: VerifyEmailRequest` | `Promise<void>` | Verify Email. |
| `me` | `()` | `Promise<User>` | Me. |

### `EventSubmissionsService`

_Implements: `IEventSubmissionsService`_

The family's own suggestions plus the admin review queue. `review()` keeps the queue oldest first; a card approved in this session stays in place as `approved` (the page collapses it), a rejected card leaves. `loadPending()` resets the queue.

**Methods**

| Method | Parameters | Returns | Description |
| --- | --- | --- | --- |
| `mine` | `()` | `Signal<ReadonlyArray<EventSubmissionDto>>` | The caller's own submissions, any status. |
| `pending` | `()` | `Signal<ReadonlyArray<EventSubmissionDto>>` | Pending rows (admin), excluding this session's approvals. |
| `review` | `()` | `Signal<ReviewView>` | `loading` → `empty` / `ready`; subtitle "Three waiting, oldest first. …". |
| `loadMine` | `()` | `Promise<void>` | `GET /api/events/submissions/mine`. |
| `loadPending` | `()` | `Promise<void>` | `GET /api/events/submissions/pending`. |
| `submit` | `payload: SubmitEventRequest` | `Promise<EventSubmissionDto>` | `POST /api/events/submissions`; prepends to `mine()`. |
| `approve` | `id: string, driveMinutes?: number \| null` | `Promise<EventSubmissionDto>` | `POST …/{id}/approve` (`{ driveMinutes }` when given, else an empty body). |
| `reject` | `id: string, reason?: string \| null` | `Promise<EventSubmissionDto>` | `POST …/{id}/reject` with the trimmed reason or `null`. |

### `EventsService`

_Implements: `IEventsService`_

`GET /api/events?weekendOf=&maxDriveMinutes=45` per load, plus `EVENT_SUBMISSIONS_SERVICE.loadMine()`. Sections: "Your suggestion" (the family's pending submissions, `pending: true`, chip "Pending review"), then Saturday / Sunday / Coming soon for this weekend, or "Next weekend". Category chips come from the categories present (Seasonal sun · Theatre indoor · Festival leaf · else neutral); none active means all.

**Methods**

| Method | Parameters | Returns | Description |
| --- | --- | --- | --- |
| `list` | `()` | `Signal<IdeasEventsView>` | The Events segment for the active window and category. |
| `load` | `weekendOfIso?: string` | `Promise<void>` | Defaults to `upcomingSaturdayIso()`; the parameter exists for tests. |
| `setWindow` | `window: 'This weekend' \| 'Next weekend'` | `void` | Switch the time window. |
| `setCategory` | `label: string \| null` | `void` | Narrow to one category, `null` for all. |

### `FamilyService`

_Implements: `IFamilyService`_

`getFamily()` is the read-only projection for the Family page and the "Planned around" rows on the empty Weekend screen: headline (name or "Your family"), members oldest first with a derived role, one `CommitmentRow` per backend row, likes / dislikes as chips, the three toggles with their copy. `getEditableProfile()` is the full-replace payload for `saveProfile`.

**Methods**

| Method | Parameters | Returns | Description |
| --- | --- | --- | --- |
| `getFamily` | `()` | `Signal<FamilyView>` | `loading` until the first `GET /api/family` lands. |
| `getEditableProfile` | `()` | `Signal<EditableFamilyProfile \| null>` | `null` until loaded. |
| `load` | `()` | `Promise<void>` | `GET /api/family`. |
| `saveProfile` | `profile: EditableFamilyProfile` | `Promise<void>` | `PUT /api/family` — name, the three toggles, members/commitments (with ids), preferences. |

### `RestaurantService`

_Implements: `IRestaurantService`_

Loads Saturday and Sunday × Lunch and Dinner for the upcoming weekend. The view shows the selected day's Lunch then Dinner (a slot chip narrows to one). Picks rank locked, then wife-approved, then closest; the first unlocked pick is `topPick`; a locked pick gets `lockedLabel` and dims its siblings (votes disabled). Section subtitles read the current weekend's Meal block ("Near Lavender fields · 1:00 to 2:15pm"), else "Close to home". The vote roster is the family's members (from `FAMILY_SERVICE`).

**Methods**

| Method | Parameters | Returns | Description |
| --- | --- | --- | --- |
| `list` | `()` | `Signal<IdeasFoodView>` | Day chips, slot chips, extra chips and the sections. |
| `load` | `()` | `Promise<void>` | Four `GET /api/restaurants?day=&slot=` calls; a failed list is simply empty. |
| `setFilters` | `patch: Partial<FoodFilters>` | `void` | Merge `{ day; slot; wifeApproved; quick }`. |
| `vote` | `restaurantId: string, voterName: string, vote: Vote` | `Promise<void>` | `POST /api/restaurants/{id}/vote`. |
| `lock` | `restaurantId: string, day: WeekendDay, slot: MealSlot` | `Promise<void>` | `POST /api/restaurants/{id}/lock` for the given day + meal. |

### `SavedService`

_Implements: `ISavedService`_

The Past page. Every weekend is shown (newest first); the "Skipping next time" strip lists activities from weekends rated ≤ 2. Chips: `All`, `Favourites`, `This year`, `5★`, filtered client-side; `filterEmpty` carries the copy for a filter with no matches.

**Methods**

| Method | Parameters | Returns | Description |
| --- | --- | --- | --- |
| `list` | `()` | `Signal<PastView>` | `loading` → `empty` / `ready`. |
| `load` | `()` | `Promise<void>` | `GET /api/weekends/history?take=50`. |
| `setFilter` | `label: string` | `void` | Select a chip. |
| `setFavourite` | `id: string, favourite: boolean` | `Promise<void>` | `PUT /api/weekends/{id}/favourite`. |
| `rate` | `id: string, rating: number \| null` | `Promise<void>` | `PUT /api/weekends/{id}/rating` (1..5, `null` clears). |
| `rename` | `id: string, title: string \| null` | `Promise<void>` | `PUT /api/weekends/{id}/title` (`null` clears). |

### `SessionStore`

Signal-based session state. Persists the access + refresh token pair in `localStorage` when `remember=true` and in `sessionStorage` otherwise. `rehydrate()` runs once at bootstrap: a token inside the 60 s refresh window is exchanged via `refreshSession()`, otherwise the persisted token is resolved back into a `user` via `IAuthService.me()`. The `authInterceptor` calls `refreshSession()` once on a 401 and retries the request with the rotated bearer.

_Implements: `ISessionStore`_

**Properties**

| Name | Type | Description |
| --- | --- | --- |
| `readonly user` | `Signal<User \| null>` | – |
| `readonly token` | `Signal<AuthToken \| null>` | – |
| `readonly loading` | `Signal<boolean>` | – |
| `readonly error` | `Signal<AuthError \| null>` | – |
| `readonly rememberedEmail` | `Signal<string \| null>` | – |
| `readonly isAuthenticated` | – | – |

**Methods**

| Method | Parameters | Returns | Description |
| --- | --- | --- | --- |
| `signUp` | `req: SignupRequest` | `Promise<void>` | Sign Up. |
| `login` | `req: LoginRequest, remember: boolean` | `Promise<void>` | Login. |
| `logout` | `()` | `Promise<void>` | Revokes the refresh token server-side (best effort), then clears every persisted credential. |
| `refreshSession` | `()` | `Promise<boolean>` | Single-flight refresh-token exchange; `false` means the session was cleared. |
| `forgotPassword` | `req: ForgotPasswordRequest` | `Promise<void>` | Forgot Password. |
| `resendVerification` | `req: ResendVerificationRequest` | `Promise<void>` | Resend Verification. |
| `resetPassword` | `req: ResetPasswordRequest` | `Promise<void>` | Reset Password. |
| `verifyEmail` | `req: VerifyEmailRequest` | `Promise<void>` | Verify Email. |
| `rehydrate` | `()` | `Promise<void>` | Rehydrate. |
| `clearError` | `()` | `void` | Clear Error. |

### `SharedWeekendService`

_Implements: `ISharedWeekendService`_

Anonymous; the share token is the capability. The result is the same `WeekendView` the Weekend page renders, forced `ready`.

**Methods**

| Method | Parameters | Returns | Description |
| --- | --- | --- | --- |
| `load` | `token: string` | `Promise<WeekendView>` | `GET /api/weekends/shared/{token}`; rejects when the link is invalid. |

### `WeekendPlanService`

_Implements: `IWeekendPlanService`_

Holds the current `WeekendDto` and projects it through `projectWeekend` into one `WeekendView`. `loadCurrent()` maps a 404 (or a weekend with zero blocks) to `status: 'empty'` and rejects on any other failure. Every mutation applies the server's returned weekend and rejects on failure so the page can show a banner.

**Methods**

| Method | Parameters | Returns | Description |
| --- | --- | --- | --- |
| `getWeekend` | `()` | `Signal<WeekendView>` | `loading` → `empty` / `ready`. |
| `loadCurrent` | `()` | `Promise<void>` | `GET /api/weekends/current`; 404 → `empty`. |
| `plan` | `weekendOfIso: string` | `Promise<void>` | `POST /api/weekends/plan`. Idempotent server-side. |
| `regenerate` | `id?: string` | `Promise<void>` | `POST /api/weekends/{id}/regenerate`. |
| `regenerateDay` | `day: WeekendDay, id?: string` | `Promise<void>` | `POST /api/weekends/{id}/days/{day}/regenerate`. |
| `createShareLink` | `id?: string` | `Promise<string>` | `POST /api/weekends/{id}/share` → the share URL. |
| `calendarExport` | `id?: string` | `CalendarExport` | `{ icsUrl; fileName "weekend-16-may.ics"; eventCount }`. |
| `lockBlock` | `blockId: string, locked: boolean` | `Promise<void>` | `PUT /api/blocks/{id}/lock`. |
| `swapBlock` | `blockId: string, rejectedActivityIds?: readonly string[]` | `Promise<void>` | `POST /api/blocks/{id}/swap` — the server picks; only unlocked activity blocks. |
| `lockDay` | `day: WeekendDay, locked: boolean, id?: string` | `Promise<void>` | `PUT /api/weekends/{id}/days/{day}/lock`. |
| `addErrand` | `description: string, estimatedMinutes: number, preferredDay: WeekendDay \| null` | `Promise<ErrandPlacement \| null>` | `POST /api/weekends/{id}/errands`; resolves with where the errand landed. |
| `setErrandDone` | `errandId: string, done: boolean` | `Promise<void>` | `PUT /api/errands/{id}/done`. |
| `remixSaved` | `id: string` | `Promise<void>` | `POST /api/weekends/{id}/remix`; the result becomes current. |
| `repeatSaved` | `id: string` | `Promise<void>` | `POST /api/weekends/{id}/repeat`; the result becomes current. |
