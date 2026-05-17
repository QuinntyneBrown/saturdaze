# Button and Link Audit - 2026-05-17

Target audited: https://gentle-rock-070070c0f.7.azurestaticapps.net/

Audit account used for guarded pages: `quinntynebrown@gmail.com` / seeded password.

## Scope

I audited the deployed Azure Static Web Apps URL, not a local dev server. The route list was cross-checked against `frontend/projects/saturdaze/src/app/app.routes.ts`.

Covered anonymous/public routes:

- `/`
- `/login`
- `/signup`
- `/forgot-password`
- `/check-email`
- `/reset-password`
- `/reset-password?token=valid-mock-reset-token`
- `/verify-email`
- `/verify-email?token=valid-mock-verify-token`
- `/dialogs`
- `/components`

Covered authenticated routes after signing in:

- `/weekend`
- `/itinerary`
- `/activities`
- `/restaurants`
- `/saved`
- `/events`
- `/errand`
- `/profile`

Method: Playwright/Chromium browser checks, direct route loads, SPA navigation checks, and source inspection for the relevant templates/components. I did not intentionally mutate production data; destructive browser confirms were dismissed.

## Summary

Several controls are confirmed broken or unimplemented. The highest impact issues are:

- Authenticated routes cannot be reliably opened directly or refreshed after login because route guards run before session rehydration finishes.
- Several visible anchors still expose mock `.html` hrefs. Plain SPA clicks are sometimes intercepted, but direct open, copy link, modifier-click, and one in-app day switcher click can land on a blank frame with Angular `NG04002`.
- Password reset and email verification UI is present, but the deployed backend only exposes `register`, `login`, and `me`; the forgot/reset/verify endpoints return 404.
- Profile dialogs on the deployed app open without action buttons, so sign-out/add/edit flows cannot be completed from the sheet.
- Many product CTA buttons are visible but have no route, click handler, dialog, API call, or state change.

## High Priority Findings

### 1. Guarded pages break on direct load, refresh, and returnUrl login

Affected pages:

- `/weekend`
- `/itinerary`
- `/activities`
- `/restaurants`
- `/saved`
- `/events`
- `/errand`
- `/profile`

Evidence:

- After successful sign-in, reloading `/weekend` called `/api/auth/me` successfully with HTTP 200, then the app still navigated to `/login?returnUrl=%2Fweekend`.
- Opening `/restaurants` while signed out correctly redirected to `/login?returnUrl=%2Frestaurants`, but after sign-in the app landed on `/weekend`, not `/restaurants`.

Likely source:

- `frontend/projects/saturdaze/src/app/auth/require-auth.guard.ts`
- `frontend/projects/saturdaze/src/app/app.ts`
- `frontend/projects/saturdaze/src/app/pages/login/login.page.ts`

What to implement:

- Make session rehydration complete before initial guarded navigation. Prefer an app initializer that awaits `SessionStore.rehydrate()` before router activation, or make the guard return an async result that waits for rehydration.
- Preserve and honor `returnUrl` in `LoginPage.submit()` instead of always navigating to `/weekend`.
- Add an E2E test for:
  - login -> `/weekend` -> reload still shows `/weekend`
  - anonymous direct `/restaurants` -> login -> lands on `/restaurants`

### 2. Mock `.html` hrefs are exposed as real links and can blank the app

Affected controls:

- Bottom nav links: `home.html`, `activities.html`, `saved.html`, `profile.html`
- Home day card href: `itinerary.html`
- Itinerary day switcher href: `itinerary.html`

Evidence:

- Directly opening `/activities.html`, `/saved.html`, `/profile.html`, `/home.html`, or `/itinerary.html` produced an empty app frame and console error `NG04002`.
- Clicking the Sunday day switcher on `/itinerary` navigated to a blank frame and logged `NG04002: 'itinerary.html'`.
- Bottom nav plain left-clicks are intercepted and route correctly, but the actual link target is still invalid for direct open, copy link, new tab, and modifier-click.

Likely source:

- `frontend/projects/components/src/lib/bottom-nav/bottom-nav.ts`
- `frontend/projects/components/src/lib/day-card/day-card.ts`
- `frontend/projects/saturdaze/src/app/pages/home/home.page.html`
- `frontend/projects/saturdaze/src/app/pages/itinerary/itinerary.page.html`

What to implement:

- Replace mock hrefs with real Angular route hrefs such as `/weekend`, `/activities`, `/saved`, `/profile`, and `/itinerary`.
- Update E2E selectors to use stable data attributes like `data-nav-key` instead of `href$="home.html"`.
- If mock parity still needs `.html` aliases, add explicit Angular redirect routes for those aliases so direct opens do not fail.
- Implement the itinerary day switcher as a real route or state change, for example `/itinerary?day=sunday`, and prevent it from navigating to `itinerary.html`.

### 3. Forgot/reset/verify email buttons call missing backend endpoints

Affected controls/pages:

- `/forgot-password`: `Send reset link`
- `/reset-password?token=...`: `Update password`
- `/verify-email?token=...`: automatic verification flow
- `/check-email`: `Resend` is a no-op without a stored user email

Evidence:

- `Send reset link` posted to `https://sd-api-uofnt2.azurewebsites.net/api/auth/forgot-password` and received HTTP 404. The UI still navigated to `/check-email`, implying success.
- `Update password` posted to `/api/auth/reset-password` and received HTTP 404, then showed a generic error.
- `/verify-email?token=valid-mock-verify-token` showed `Verification didn't work` with a generic error.
- Backend `AuthController` currently exposes only `POST /api/auth/register`, `POST /api/auth/login`, and `GET /api/auth/me`.

Likely source:

- `backend/src/Saturdaze.Api/Controllers/AuthController.cs`
- `frontend/projects/api/src/lib/services/auth.service.ts`
- `frontend/projects/saturdaze/src/app/pages/forgot-password/forgot-password.page.ts`
- `frontend/projects/saturdaze/src/app/pages/reset-password/reset-password.page.ts`
- `frontend/projects/saturdaze/src/app/pages/verify-email/verify-email.page.ts`
- `frontend/projects/saturdaze/src/app/pages/check-email/check-email.page.ts`

What to implement:

- Add backend endpoints and application handlers for:
  - `POST /api/auth/forgot-password`
  - `POST /api/auth/reset-password`
  - `POST /api/auth/verify-email`
  - likely `POST /api/auth/resend-verification`
- Add token persistence/validation and email delivery or dev-safe email capture.
- Stop showing success on `/forgot-password` if the request fails for transport/configuration reasons. It is fine not to reveal account existence, but 404/configuration failure should not look like a sent email.
- Make `/check-email` carry the relevant email context or require an email entry before `Resend`.

### 4. Profile dialogs open without visible action buttons on the deployed app

Affected controls:

- `/profile`: `Add family member`
- `/profile`: edit family member
- `/profile`: `Add a commitment`
- `/profile`: edit commitment
- `/profile`: `Sign out`

Evidence:

- `Add family member` opened a dialog, but the dialog contained only a hidden submit button and no visible `Cancel` or `Add member` button.
- `Sign out` opened a dialog with text, but no visible `Stay signed in` or `Sign out` action buttons.

Likely source:

- `frontend/projects/components/src/lib/dialog/dialog.html`
- `frontend/projects/saturdaze/src/app/dialogs/family-member-dialog/family-member-dialog.html`
- `frontend/projects/saturdaze/src/app/dialogs/commitment-dialog/commitment-dialog.html`
- `frontend/projects/saturdaze/src/app/dialogs/sign-out-dialog/sign-out-dialog.html`

What to implement:

- Fix `sd-dialog` content projection so `[slot=actions]` children are rendered exactly once for both static gallery dialogs and CDK overlay dialogs.
- Keep the slot selector consistent across all dialog callers.
- Add E2E tests that open each profile dialog and assert visible action buttons exist and can close/submit as appropriate.
- Note: the local working tree already contains uncommitted `sd-dialog` changes that appear related to this issue; verify them in a deployed or locally running build before closing this item.

## Product Controls With No Confirmed Behavior

These controls were visible and clickable, but produced no route change, dialog, API request, or visible state change in the deployed app.

### Splash `/`

Affected controls:

- `Get started`
- Hero `Create your account`
- Hero `See a sample weekend`
- Closing `Create your account`
- Closing `Already have one? Sign in`

Evidence:

- Clicking each button left the URL and page content unchanged.

Likely source:

- `frontend/projects/saturdaze/src/app/pages/splash/splash.page.html`

What to implement:

- Make account CTAs navigate to `/signup`.
- Make `Already have one? Sign in` navigate to `/login`.
- Define what `See a sample weekend` should do. Reasonable options:
  - route to a public sample weekend page
  - open a static sample modal
  - navigate to `/login?returnUrl=%2Fweekend` if the sample is not public

### Signup `/signup`

Affected links:

- `Terms`
- `Privacy Policy`

Evidence:

- Both links use `href="#"`. In the deployed app they navigated away from `/signup` rather than opening policy content.

Likely source:

- `frontend/projects/saturdaze/src/app/pages/signup/signup.page.html`

What to implement:

- Add real `/terms` and `/privacy` routes, external policy URLs, or mark the labels as non-links until the documents exist.

### Check Email `/check-email`

Affected controls:

- `Open mail app`
- `Resend` when no signed-in/stored email is available

Evidence:

- `Open mail app` had no route, protocol link, dialog, or visible state change.
- Anonymous `Resend` showed `Resent - check your inbox again` without making any API request.

Likely source:

- `frontend/projects/saturdaze/src/app/pages/check-email/check-email.page.html`
- `frontend/projects/saturdaze/src/app/pages/check-email/check-email.page.ts`

What to implement:

- Use a real `mailto:` or provider/deep-link strategy for `Open mail app`, or remove the button.
- Store/pass the destination email into `/check-email`, and call a real resend endpoint. If no email exists, prompt for one instead of showing success.

### Home `/weekend`

Affected controls:

- `Open calendar`
- Toolbar `Share with Sara`
- Hero `Plan This Weekend`
- Quick action `Regenerate the weekend`
- Quick action `Lock what's already perfect`
- Quick action `Share with Sara for approval`
- Detail pane `Open full day`
- Detail pane `Regenerate`
- Detail pane `Open Saturday`

Evidence:

- Buttons produced no visible change.
- The quick actions are rendered with `href="#"`; clicking `Regenerate the weekend` navigated out of the app to `/` on the deployed site.

Likely source:

- `frontend/projects/saturdaze/src/app/pages/home/home.page.html`

What to implement:

- `Open calendar`: open calendar export/subscription, or remove until calendar integration exists.
- `Share with Sara`: open share dialog and create/copy a read-only share link.
- `Plan This Weekend`: call generate weekend flow or route to `/itinerary`.
- Quick actions:
  - `Regenerate`: open confirm dialog and call `POST /api/weekends/current/regenerate` or equivalent.
  - `Lock`: open lock-selection mode or route to itinerary.
  - `Share`: open the same share dialog.
- `Open full day` and `Open Saturday`: route to `/itinerary` with the correct day.

### Itinerary `/itinerary`

Affected controls:

- Top `Regenerate`
- Top `More`
- Day switcher Sunday row
- Footer `Regenerate`
- Footer `Lock day`
- Detail `See on map`

Evidence:

- `Regenerate`, `More`, `Lock day`, and `See on map` had no visible effect.
- The Sunday day switcher navigated to invalid `itinerary.html` and blanked the app.

Likely source:

- `frontend/projects/saturdaze/src/app/pages/itinerary/itinerary.page.html`

What to implement:

- Wire regenerate controls to a confirm dialog and regenerate endpoint.
- Wire `Lock day` to the lock endpoint/state.
- Implement a more menu or remove the button.
- Wire `See on map` to a map route/dialog using the day's block locations.
- Implement day switching with real state/route handling.

### Activities `/activities`

Affected control:

- `Try something new`

Evidence:

- Clicking it produced no visible state change, route, dialog, or API request.

Likely source:

- `frontend/projects/saturdaze/src/app/pages/activities/activities.page.html`

What to implement:

- Define and implement the action: refresh suggestions, route to a preference/filter flow, or open a "surprise me" dialog.

### Restaurants `/restaurants`

Affected controls:

- `Refresh picks`
- Vote `Yes` / `No` buttons on restaurant cards
- `See menu`
- `Lock it in`

Evidence:

- Each clicked control produced no visible state change, route, dialog, or API request.

Likely source:

- `frontend/projects/saturdaze/src/app/pages/restaurants/restaurants.page.html`
- `frontend/projects/components/src/lib/vote-row/vote-row.html`

What to implement:

- `Refresh picks`: call a restaurant refresh endpoint or local recompute.
- Vote buttons: emit selected vote, update active state, and persist the vote.
- `See menu`: link to restaurant menu URLs from catalog data.
- `Lock it in`: persist the selected restaurant into the weekend plan.

### Saved `/saved`

Affected controls:

- Top-left `Back`
- `More`
- `Remix`
- `Repeat`

Evidence:

- All produced no visible route, dialog, API request, or state change.

Likely source:

- `frontend/projects/saturdaze/src/app/pages/saved/saved.page.html`

What to implement:

- Use `sd-top-bar back` for the back affordance or wire the leading icon button to `Location.back()` with a fallback route.
- Implement or remove the `More` menu.
- `Remix`: create a new draft from the saved weekend with variation.
- `Repeat`: create a new current weekend from the saved plan.

### Errand `/errand`

Affected controls:

- `Pick a different slot`
- `Add to weekend`

Evidence:

- Both produced no visible state change, route, dialog, or API request.

Likely source:

- `frontend/projects/saturdaze/src/app/pages/errand/errand.page.html`

What to implement:

- Bind the form inputs to state.
- `Pick a different slot`: recalculate or show alternate slot choices.
- `Add to weekend`: call the errand endpoint and return to `/weekend` or `/itinerary` with confirmation.

### Profile `/profile`

Affected control:

- `More`

Evidence:

- Clicking it produced no menu, route, dialog, API request, or visible state change.

Likely source:

- `frontend/projects/saturdaze/src/app/pages/profile/profile.page.html`

What to implement:

- Add an account/profile overflow menu, or remove the button.

## Demo/Gallery Pages

The `/components` and `/dialogs` pages are public review/gallery routes. They contain many visible demo buttons that intentionally do not perform product actions.

Recommendation:

- Keep them out of product navigation, or clearly mark controls in these galleries as non-interactive demo examples.
- If they remain public routes, consider disabling demo buttons or adding a local-only review mode to prevent audit noise.

## Controls That Worked In This Audit

Confirmed working:

- `/login`: seeded production account signs in successfully.
- `/login`: `Forgot password?`, `Create an account`, and `Back to home` links navigate.
- `/signup`: `Create account` posts to `/api/auth/register`; using the existing seeded email returned HTTP 409 and showed the expected inline `An account with that email already exists.` message.
- `/signup`: `Sign in` and `Back to home` links navigate.
- `/forgot-password`: `Back to sign in` and `Back to home` links navigate.
- `/check-email`: `Use a different one` and `Back to sign in` links navigate.
- `/reset-password`: `Back to forgot password` and `Back to sign in` links navigate.
- `/verify-email`: `Back to sign in` and `mailto:support@saturdaze.app` links are valid.
- Home day cards navigate to `/itinerary` on plain left-click because `sd-day-card` intercepts the click.
- Bottom nav plain left-clicks navigate within the SPA.
- Profile add/edit rows open dialogs, but the deployed dialogs are missing visible action buttons as noted above.

## Suggested Verification Gates

Add or extend Playwright tests for these behaviors:

- All visible anchors must have either:
  - a valid URL/route that works when opened directly, or
  - `role="button"` plus a click handler if they are not links.
- Authenticated route reload preserves the current page.
- `returnUrl` after login is honored.
- No `href="#"` remains on production pages unless it is prevented and has a real action.
- No production page exposes `.html` mock hrefs unless alias routes exist.
- Every visible `sd-button` or `sd-icon-button` on product pages either changes route, opens a dialog/menu, calls an API, changes state, or is disabled/removed.
- Profile dialogs render visible action buttons.
- Forgot/reset/verify email endpoints return expected statuses in backend integration tests before enabling the UI.
