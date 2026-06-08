# api — Public API

## Contents

- [Classes](#classes)

## Classes

### `ActivityService`

_Implements: `IActivityService`_

**Methods**

| Method | Parameters | Returns | Deprecated | Description |
| --- | --- | --- | --- | --- |
| `list` | `()` | `Signal<ActivityView>` | no | – |
| `load` | `()` | `Promise<void>` | no | – |

### `AuthService`

Real HTTP `IAuthService`. Bound to `AUTH_SERVICE` in the application composition root. Every method funnels backend errors through `rethrowAsAuthError` so the session store sees the uniform `AuthError` shape regardless of transport quirks.

_Implements: `IAuthService`_

**Methods**

| Method | Parameters | Returns | Deprecated | Description |
| --- | --- | --- | --- | --- |
| `signUp` | `req: SignupRequest` | `Promise<{ token: AuthToken; user: User }>` | no | – |
| `login` | `req: LoginRequest` | `Promise<{ token: AuthToken; user: User }>` | no | – |
| `forgotPassword` | `req: ForgotPasswordRequest` | `Promise<void>` | no | – |
| `resendVerification` | `req: ResendVerificationRequest` | `Promise<void>` | no | – |
| `resetPassword` | `req: ResetPasswordRequest` | `Promise<void>` | no | – |
| `verifyEmail` | `req: VerifyEmailRequest` | `Promise<void>` | no | – |
| `me` | `()` | `Promise<User>` | no | – |

### `EventSubmissionsService`

_Implements: `IEventSubmissionsService`_

**Methods**

| Method | Parameters | Returns | Deprecated | Description |
| --- | --- | --- | --- | --- |
| `mine` | `()` | `Signal<ReadonlyArray<EventSubmissionDto>>` | no | – |
| `pending` | `()` | `Signal<ReadonlyArray<EventSubmissionDto>>` | no | – |
| `loadMine` | `()` | `Promise<void>` | no | – |
| `loadPending` | `()` | `Promise<void>` | no | – |
| `submit` | `payload: SubmitEventRequest` | `Promise<EventSubmissionDto>` | no | – |
| `approve` | `id: string` | `Promise<EventSubmissionDto>` | no | – |
| `reject` | `id: string, reason?: string \| null` | `Promise<EventSubmissionDto>` | no | – |

### `EventsService`

_Implements: `IEventsService`_

**Methods**

| Method | Parameters | Returns | Deprecated | Description |
| --- | --- | --- | --- | --- |
| `list` | `()` | `Signal<EventsView>` | no | – |
| `load` | `weekendOfIso?: string` | `Promise<void>` | no | – |

### `FamilyService`

_Implements: `IFamilyService`_

**Methods**

| Method | Parameters | Returns | Deprecated | Description |
| --- | --- | --- | --- | --- |
| `getProfile` | `()` | `Signal<FamilyProfile>` | no | – |
| `getEditableProfile` | `()` | `Signal<EditableFamilyProfile \| null>` | no | – |
| `load` | `()` | `Promise<void>` | no | – |
| `saveProfile` | `profile: EditableFamilyProfile` | `Promise<void>` | no | – |

### `RestaurantService`

_Implements: `IRestaurantService`_

**Methods**

| Method | Parameters | Returns | Deprecated | Description |
| --- | --- | --- | --- | --- |
| `list` | `()` | `Signal<RestaurantView>` | no | – |
| `load` | `()` | `Promise<void>` | no | – |
| `refresh` | `()` | `Promise<void>` | no | – |
| `vote` | `restaurantId: string, voterName: string, vote: Vote` | `Promise<void>` | no | – |
| `lock` | `restaurantId: string` | `Promise<void>` | no | – |

### `SavedService`

_Implements: `ISavedService`_

**Methods**

| Method | Parameters | Returns | Deprecated | Description |
| --- | --- | --- | --- | --- |
| `list` | `()` | `Signal<SavedView>` | no | – |
| `load` | `()` | `Promise<void>` | no | – |

### `SessionStore`

Signal-based session state. Persists the token in `localStorage` when `remember=true` and in `sessionStorage` otherwise. `rehydrate()` runs once at bootstrap to resolve the persisted token back into a `user` via `IAuthService.me()`.

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
| `signUp` | `req: SignupRequest` | `Promise<void>` | no | – |
| `login` | `req: LoginRequest, remember: boolean` | `Promise<void>` | no | – |
| `logout` | `()` | `void` | no | – |
| `forgotPassword` | `req: ForgotPasswordRequest` | `Promise<void>` | no | – |
| `resendVerification` | `req: ResendVerificationRequest` | `Promise<void>` | no | – |
| `resetPassword` | `req: ResetPasswordRequest` | `Promise<void>` | no | – |
| `verifyEmail` | `req: VerifyEmailRequest` | `Promise<void>` | no | – |
| `rehydrate` | `()` | `Promise<void>` | no | – |
| `clearError` | `()` | `void` | no | – |

### `WeekendPlanService`

_Implements: `IWeekendPlanService`_

**Methods**

| Method | Parameters | Returns | Deprecated | Description |
| --- | --- | --- | --- | --- |
| `getOverview` | `()` | `Signal<WeekendOverview>` | no | – |
| `getItinerary` | `()` | `Signal<ItineraryView>` | no | – |
| `loadCurrent` | `()` | `Promise<void>` | no | Fetch the upcoming weekend (server auto-plans on miss). |
| `plan` | `weekendOfIso: string` | `Promise<void>` | no | Plan an explicit Saturday. POST /api/weekends/plan. Idempotent server-side. |
| `regenerate` | `id?: string` | `Promise<void>` | no | – |
| `regenerateDay` | `day: 'Saturday' \| 'Sunday', id?: string` | `Promise<void>` | no | – |
| `markFavourite` | `favourite: boolean, id?: string` | `Promise<void>` | no | – |
| `createShareLink` | `id?: string` | `Promise<string>` | no | – |
| `calendarLinks` | `id?: string` | `CalendarLinks` | no | – |
| `lockBlock` | `blockId: string, locked: boolean` | `Promise<void>` | no | – |
| `lockDay` | `day: 'Saturday' \| 'Sunday', locked: boolean, id?: string` | `Promise<void>` | no | – |
| `swapBlock` | `blockId: string` | `Promise<void>` | no | – |
| `addErrand` | `description: string, estimatedMinutes: number, id?: string` | `Promise<void>` | no | – |
| `remixSaved` | `id: string` | `Promise<void>` | no | – |
| `repeatSaved` | `id: string` | `Promise<void>` | no | – |
| `setActiveDay` | `day: 'Saturday' \| 'Sunday'` | `void` | no | – |

