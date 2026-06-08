# api — Public API

## Classes

### `ActivityService`

_Implements: `IActivityService`_

**Methods**

| Method | Parameters | Returns | Deprecated | Description |
| --- | --- | --- | --- | --- |
| `list` | `()` | `Signal<ActivityView>` | no | List. |
| `load` | `()` | `Promise<void>` | no | Load. |

### `AuthService`

Real HTTP `IAuthService`. Bound to `AUTH_SERVICE` in the application composition root. Every method funnels backend errors through `rethrowAsAuthError` so the session store sees the uniform `AuthError` shape regardless of transport quirks.

_Implements: `IAuthService`_

**Methods**

| Method | Parameters | Returns | Deprecated | Description |
| --- | --- | --- | --- | --- |
| `signUp` | `req: SignupRequest` | `Promise<{ token: AuthToken; user: User }>` | no | Sign Up. |
| `login` | `req: LoginRequest` | `Promise<{ token: AuthToken; user: User }>` | no | Login. |
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

**Methods**

| Method | Parameters | Returns | Deprecated | Description |
| --- | --- | --- | --- | --- |
| `list` | `()` | `Signal<EventsView>` | no | List. |
| `load` | `weekendOfIso?: string` | `Promise<void>` | no | Load. |

### `FamilyService`

_Implements: `IFamilyService`_

**Methods**

| Method | Parameters | Returns | Deprecated | Description |
| --- | --- | --- | --- | --- |
| `getProfile` | `()` | `Signal<FamilyProfile>` | no | Get Profile. |
| `getEditableProfile` | `()` | `Signal<EditableFamilyProfile \| null>` | no | – |
| `load` | `()` | `Promise<void>` | no | Load. |
| `saveProfile` | `profile: EditableFamilyProfile` | `Promise<void>` | no | Save Profile. |

### `RestaurantService`

_Implements: `IRestaurantService`_

**Methods**

| Method | Parameters | Returns | Deprecated | Description |
| --- | --- | --- | --- | --- |
| `list` | `()` | `Signal<RestaurantView>` | no | List. |
| `load` | `()` | `Promise<void>` | no | Load. |
| `refresh` | `()` | `Promise<void>` | no | Refresh. |
| `vote` | `restaurantId: string, voterName: string, vote: Vote` | `Promise<void>` | no | Vote. |
| `lock` | `restaurantId: string` | `Promise<void>` | no | Lock. |

### `SavedService`

_Implements: `ISavedService`_

**Methods**

| Method | Parameters | Returns | Deprecated | Description |
| --- | --- | --- | --- | --- |
| `list` | `()` | `Signal<SavedView>` | no | List. |
| `load` | `()` | `Promise<void>` | no | Load. |

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
| `signUp` | `req: SignupRequest` | `Promise<void>` | no | Sign Up. |
| `login` | `req: LoginRequest, remember: boolean` | `Promise<void>` | no | Login. |
| `logout` | `()` | `void` | no | Logout. |
| `forgotPassword` | `req: ForgotPasswordRequest` | `Promise<void>` | no | Forgot Password. |
| `resendVerification` | `req: ResendVerificationRequest` | `Promise<void>` | no | Resend Verification. |
| `resetPassword` | `req: ResetPasswordRequest` | `Promise<void>` | no | Reset Password. |
| `verifyEmail` | `req: VerifyEmailRequest` | `Promise<void>` | no | Verify Email. |
| `rehydrate` | `()` | `Promise<void>` | no | Rehydrate. |
| `clearError` | `()` | `void` | no | Clear Error. |

### `WeekendPlanService`

_Implements: `IWeekendPlanService`_

**Methods**

| Method | Parameters | Returns | Deprecated | Description |
| --- | --- | --- | --- | --- |
| `getOverview` | `()` | `Signal<WeekendOverview>` | no | Get Overview. |
| `getItinerary` | `()` | `Signal<ItineraryView>` | no | Get Itinerary. |
| `loadCurrent` | `()` | `Promise<void>` | no | Fetch the upcoming weekend (server auto-plans on miss). |
| `plan` | `weekendOfIso: string` | `Promise<void>` | no | Plan an explicit Saturday. POST /api/weekends/plan. Idempotent server-side. |
| `regenerate` | `id?: string` | `Promise<void>` | no | Regenerate. |
| `regenerateDay` | `day: 'Saturday' \| 'Sunday', id?: string` | `Promise<void>` | no | Regenerate Day. |
| `markFavourite` | `favourite: boolean, id?: string` | `Promise<void>` | no | Mark Favourite. |
| `createShareLink` | `id?: string` | `Promise<string>` | no | Create Share Link. |
| `calendarLinks` | `id?: string` | `CalendarLinks` | no | Calendar Links. |
| `lockBlock` | `blockId: string, locked: boolean` | `Promise<void>` | no | Lock Block. |
| `lockDay` | `day: 'Saturday' \| 'Sunday', locked: boolean, id?: string` | `Promise<void>` | no | Lock Day. |
| `swapBlock` | `blockId: string` | `Promise<void>` | no | Swap Block. |
| `addErrand` | `description: string, estimatedMinutes: number, id?: string` | `Promise<void>` | no | Add Errand. |
| `remixSaved` | `id: string` | `Promise<void>` | no | Remix Saved. |
| `repeatSaved` | `id: string` | `Promise<void>` | no | Repeat Saved. |
| `setActiveDay` | `day: 'Saturday' \| 'Sunday'` | `void` | no | Set Active Day. |

