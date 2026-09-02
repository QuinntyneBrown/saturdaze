# api — Public API

Pages inject the `*_SERVICE` tokens and depend only on the contracts; the
concrete classes below are bound in `app.config.ts`. Pure helpers (dates,
formatting, weather words) are exported from `lib/api/` so every page shares
one implementation.

## Helpers

| Module | Exports | Description |
| --- | --- | --- |
| `lib/api/weekend-dates` | `upcomingSaturdayIso`, `addDaysIso`, `parseIsoDate`, `toIsoDate`, `localIsoDate`, `weekendDates`, `weekendDayIso`, `monthAbbr`, `formatWeekendRange`, `formatWeekendSpan` | `upcomingSaturdayIso()` mirrors the backend rule (Sat → today, Sun → yesterday, otherwise the coming Saturday). |
| `lib/api/format` | `MONTH_ABBR`, `formatWhen`, `dateTileParts`, `timeAgo`, `hhmm`, `toMinutes`, `minutesBetween`, `formatMinutes` | Timestamp / duration formatting used by events, admin and the weekend projections. |
| `lib/api/weather` | `forecastFor`, `weatherIcon`, `weatherWord`, `weatherWordCapitalised`, `weatherNote`, `isOutdoorFriendly`, `isWetDay`, `roundOrDash` | Forecast tags → icon / copy / "can we be outside?". |

## Classes

### `ActivityService`

_Implements: `IActivityService`_

Loads the catalogue, the `tryNew` picks and the Saturday forecast, then groups them into the three spec'd sections (weather-fit, "If weather turns", "Try something new"). Filter chips are predicate-based; the active chip is rendered `primary`.

**Methods**

| Method | Parameters | Returns | Deprecated | Description |
| --- | --- | --- | --- | --- |
| `list` | `()` | `Signal<ActivityView>` | no | The view for the active filter. |
| `load` | `()` | `Promise<void>` | no | `GET /api/activities`, `GET /api/activities?tryNew=true`, `GET /api/weather?weekendOf=`. |
| `activeFilter` | `()` | `Signal<string>` | no | Label of the selected chip (`All` by default). |
| `setFilter` | `label: string` | `void` | no | Select a chip. |

### `AuthService`

Real HTTP `IAuthService`. Bound to `AUTH_SERVICE` in the application composition root. Every method funnels backend errors through `rethrowAsAuthError` so the session store sees the uniform `AuthError` shape regardless of transport quirks.

_Implements: `IAuthService`_

**Methods**

| Method | Parameters | Returns | Deprecated | Description |
| --- | --- | --- | --- | --- |
| `signUp` | `req: SignupRequest` | `Promise<{ token: AuthToken; user: User }>` | no | Sign Up. |
| `login` | `req: LoginRequest` | `Promise<{ token: AuthToken; user: User }>` | no | Login. |
| `refresh` | `req: RefreshRequest` | `Promise<{ token: AuthToken; user: User }>` | no | Exchange a refresh token for a new access + refresh pair; a 401 rejects with `token_expired`. |
| `logout` | `req: LogoutRequest` | `Promise<void>` | no | Best-effort server-side revocation of the refresh token (4 s timeout). |
| `forgotPassword` | `req: ForgotPasswordRequest` | `Promise<void>` | no | Forgot Password. |
| `resendVerification` | `req: ResendVerificationRequest` | `Promise<void>` | no | Resend Verification. |
| `resetPassword` | `req: ResetPasswordRequest` | `Promise<void>` | no | Reset Password. |
| `verifyEmail` | `req: VerifyEmailRequest` | `Promise<void>` | no | Verify Email. |
| `me` | `()` | `Promise<User>` | no | Me. |

### `EventSubmissionsService`

_Implements: `IEventSubmissionsService`_

**Methods**

| Method | Parameters | Returns | Deprecated | Description |
| --- | --- | --- | --- | --- |
| `mine` | `()` | `Signal<ReadonlyArray<EventSubmissionDto>>` | no | Mine. |
| `pending` | `()` | `Signal<ReadonlyArray<EventSubmissionDto>>` | no | Pending. |
| `loadMine` | `()` | `Promise<void>` | no | Load Mine. |
| `loadPending` | `()` | `Promise<void>` | no | Load Pending. |
| `submit` | `payload: SubmitEventRequest` | `Promise<EventSubmissionDto>` | no | Submit. |
| `approve` | `id: string` | `Promise<EventSubmissionDto>` | no | Approve. |
| `reject` | `id: string, reason?: string \| null` | `Promise<EventSubmissionDto>` | no | Reject. |

### `EventsService`

_Implements: `IEventsService`_

One `GET /api/events?weekendOf=` per load (the backend returns Fri..Sun plus the 14-day "coming soon" tail). Events are bucketed Saturday / Sunday / Coming soon; a multi-day event shows on the first weekend day it touches. Chips: `This weekend`, `Next weekend`, then one per category present.

**Methods**

| Method | Parameters | Returns | Deprecated | Description |
| --- | --- | --- | --- | --- |
| `list` | `()` | `Signal<EventsView>` | no | The view for the active filter. |
| `load` | `weekendOfIso?: string` | `Promise<void>` | no | Defaults to `upcomingSaturdayIso()`; the parameter exists for tests. |
| `activeFilter` | `()` | `Signal<string>` | no | Label of the selected chip. |
| `setFilter` | `label: string` | `void` | no | Select a chip. |

### `FamilyService`

_Implements: `IFamilyService`_

`FamilyProfile.familyName` is `null` until the family is named; `preferences` carries the three keyed toggles (`budget`, `tryNew`, `fridayPreview`). `EditableFamilyProfile` members and commitments carry their persisted `id` so edits keep identity.

**Methods**

| Method | Parameters | Returns | Deprecated | Description |
| --- | --- | --- | --- | --- |
| `getProfile` | `()` | `Signal<FamilyProfile>` | no | Get Profile. |
| `getEditableProfile` | `()` | `Signal<EditableFamilyProfile \| null>` | no | – |
| `load` | `()` | `Promise<void>` | no | `GET /api/family`. |
| `saveProfile` | `profile: EditableFamilyProfile` | `Promise<void>` | no | `PUT /api/family` — name, the three toggles, members/commitments (with ids), preferences. |

### `RestaurantService`

_Implements: `IRestaurantService`_

Saturday lunch and Sunday dinner for the upcoming weekend (`wifeApprovedOnly=false` so the "Wife-approved only" chip has something to narrow; approved picks still rank first, locked first of all). The vote roster is the family's members (from `FAMILY_SERVICE`); members without a recorded vote show as undecided.

**Methods**

| Method | Parameters | Returns | Deprecated | Description |
| --- | --- | --- | --- | --- |
| `list` | `()` | `Signal<RestaurantView>` | no | The view for the active filter (`Lunch`, `Dinner`, `Wife-approved only`, `< 15 min`). |
| `load` | `()` | `Promise<void>` | no | Two `GET /api/restaurants?day=&slot=` calls. |
| `refresh` | `()` | `Promise<void>` | no | Reload; votes and locks are server-side and survive. |
| `vote` | `restaurantId: string, voterName: string, vote: Vote` | `Promise<void>` | no | `POST /api/restaurants/{id}/vote`. |
| `lock` | `restaurantId: string, day: WeekendDay, slot: MealSlot` | `Promise<void>` | no | `POST /api/restaurants/{id}/lock` for the given day + meal. |
| `activeFilter` | `()` | `Signal<string>` | no | Label of the selected chip. |
| `setFilter` | `label: string` | `void` | no | Select a chip. |

### `SavedService`

_Implements: `ISavedService`_

Recent = weekends rated > 2 (or unrated); "Avoid repeating" lists every activity from a weekend rated ≤ 2 (L2-027). Chips: `All`, `Favourites`, `This year`, `5★ only`.

**Methods**

| Method | Parameters | Returns | Deprecated | Description |
| --- | --- | --- | --- | --- |
| `list` | `()` | `Signal<SavedView>` | no | The view for the active filter. |
| `load` | `()` | `Promise<void>` | no | `GET /api/weekends/history?take=20`. |
| `activeFilter` | `()` | `Signal<string>` | no | Label of the selected chip. |
| `setFilter` | `label: string` | `void` | no | Select a chip. |
| `setFavourite` | `id: string, favourite: boolean` | `Promise<void>` | no | `PUT /api/weekends/{id}/favourite`. |
| `rate` | `id: string, rating: number \| null` | `Promise<void>` | no | `PUT /api/weekends/{id}/rating` (1..5, `null` clears). |
| `rename` | `id: string, title: string \| null` | `Promise<void>` | no | `PUT /api/weekends/{id}/title` (`null` clears). |

### `SessionStore`

Signal-based session state. Persists the access + refresh token pair in `localStorage` when `remember=true` and in `sessionStorage` otherwise. `rehydrate()` runs once at bootstrap: a token inside the 60 s refresh window is exchanged via `refreshSession()`, otherwise the persisted token is resolved back into a `user` via `IAuthService.me()`. The `authInterceptor` calls `refreshSession()` once on a 401 and retries the request with the rotated bearer.

_Implements: `ISessionStore`_

**Properties**

| Name | Type | Optional | Deprecated | Description |
| --- | --- | --- | --- | --- |
| `readonly user` | `Signal<User \| null>` | no | no | – |
| `readonly token` | `Signal<AuthToken \| null>` | no | no | – |
| `readonly loading` | `Signal<boolean>` | no | no | – |
| `readonly error` | `Signal<AuthError \| null>` | no | no | – |
| `readonly rememberedEmail` | `Signal<string \| null>` | no | no | – |
| `readonly isAuthenticated` | – | no | no | – |

**Methods**

| Method | Parameters | Returns | Deprecated | Description |
| --- | --- | --- | --- | --- |
| `signUp` | `req: SignupRequest` | `Promise<void>` | no | Sign Up. |
| `login` | `req: LoginRequest, remember: boolean` | `Promise<void>` | no | Login. |
| `logout` | `()` | `Promise<void>` | no | Revokes the refresh token server-side (best effort), then clears every persisted credential. |
| `refreshSession` | `()` | `Promise<boolean>` | no | Single-flight refresh-token exchange; `false` means the session was cleared. |
| `forgotPassword` | `req: ForgotPasswordRequest` | `Promise<void>` | no | Forgot Password. |
| `resendVerification` | `req: ResendVerificationRequest` | `Promise<void>` | no | Resend Verification. |
| `resetPassword` | `req: ResetPasswordRequest` | `Promise<void>` | no | Reset Password. |
| `verifyEmail` | `req: VerifyEmailRequest` | `Promise<void>` | no | Verify Email. |
| `rehydrate` | `()` | `Promise<void>` | no | Rehydrate. |
| `clearError` | `()` | `void` | no | Clear Error. |

### `SharedWeekendService`

_Implements: `ISharedWeekendService`_

Anonymous; the share token is the capability.

**Methods**

| Method | Parameters | Returns | Deprecated | Description |
| --- | --- | --- | --- | --- |
| `load` | `token: string` | `Promise<SharedWeekend>` | no | `GET /api/weekends/shared/{token}`; rejects when the link is invalid. |

### `WeekendPlanService`

_Implements: `IWeekendPlanService`_

Holds the current `WeekendDto` and projects it into the home overview (greeting from `FAMILY_SERVICE`, forecast, day cards, data-derived anticipations, quick actions by `kind`) and the itinerary view (blocks carry `kind`, `refId`, `reason`, `done`).

**Methods**

| Method | Parameters | Returns | Deprecated | Description |
| --- | --- | --- | --- | --- |
| `getOverview` | `()` | `Signal<WeekendOverview>` | no | Get Overview. |
| `getItinerary` | `()` | `Signal<ItineraryView>` | no | Get Itinerary. |
| `lastErrandPlacement` | `()` | `Signal<ErrandPlacement \| null>` | no | Where the most recently added errand landed (day + time). |
| `loadCurrent` | `()` | `Promise<void>` | no | Fetch the upcoming weekend (server auto-plans on miss). |
| `plan` | `weekendOfIso: string` | `Promise<void>` | no | Plan an explicit Saturday. POST /api/weekends/plan. Idempotent server-side. |
| `regenerate` | `id?: string` | `Promise<void>` | no | Regenerate. |
| `regenerateDay` | `day: WeekendDay, id?: string` | `Promise<void>` | no | Regenerate Day. |
| `createShareLink` | `id?: string` | `Promise<string>` | no | Create Share Link. |
| `calendarLinks` | `id?: string` | `CalendarLinks` | no | Calendar Links. |
| `lockBlock` | `blockId: string, locked: boolean` | `Promise<void>` | no | Lock Block. |
| `swapBlock` | `blockId: string, rejectedActivityIds?: readonly string[]` | `Promise<void>` | no | `POST /api/blocks/{id}/swap` — next-best activity; a no-op with a reason when none is left. |
| `lockDay` | `day: WeekendDay, locked: boolean, id?: string` | `Promise<void>` | no | Lock Day. |
| `addErrand` | `description: string, estimatedMinutes: number, preferredDay?: WeekendDay \| null, id?: string` | `Promise<void>` | no | The planner places the errand immediately, preferring `preferredDay`. |
| `setErrandDone` | `errandId: string, done: boolean` | `Promise<void>` | no | `PUT /api/errands/{id}/done`. |
| `remixSaved` | `id: string` | `Promise<void>` | no | Remix Saved. |
| `repeatSaved` | `id: string` | `Promise<void>` | no | Repeat Saved. |
| `setActiveDay` | `day: WeekendDay` | `void` | no | Set Active Day. |
