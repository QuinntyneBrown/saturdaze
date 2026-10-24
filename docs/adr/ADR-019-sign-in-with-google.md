# ADR-019 — Sign in with Google through Google Identity Services ID tokens

**Status:** Accepted
**Date:** 2026-10-20
**Category:** identity-and-access
**Deciders:** Quinntyne Brown
**Implements:** [L2-163](../specs/L2.md#l2-163-sign-in-with-google-creates-or-signs-in-the-account), [L2-164](../specs/L2.md#l2-164-the-sign-in-screen-offers-continue-with-google).
**Related:** [ADR-007](ADR-007-refresh-token-session-lifecycle.md) (token issue), [ADR-008](ADR-008-per-user-family-scoping-and-auth-fallback.md) (anonymous surface), [ADR-010](ADR-010-visual-parity-policy.md) (visual parity), [ADR-016](ADR-016-family-ownership-and-member-sign-in.md) (invitations).

## Context

Every account signs in with an email and a password (ADR-007). Families that live in Google already have an identity there, and a sign-in that creates the account on first use removes the password, the verification email and the forgotten-password round trip for them. The question is which Google flow to use, how a Google identity maps onto the existing `User` and `Family` model, and how the flow is tested when no test can hold a Google account.

## Decision

1. **ID-token flow, Google's own button.** The sign-in screen renders Google's button through Google Identity Services (`accounts.google.com/gsi/client`). Google hands the browser a signed ID token (the "credential"), which the browser posts to `POST /api/auth/google`. There is no OAuth authorization code, no client secret and no call from the API to Google on the sign-in path. The only configuration is the public OAuth client id, set once in `environment.googleClientId` for the app and once as `Saturdaze:Google:ClientId` for the API, which validates the token's audience against it.
2. **Offline verification without `Google.Apis.Auth`.** `GoogleIdTokenVerifier` (Infrastructure) validates the credential with the `Microsoft.IdentityModel` stack the JWT bearer already brings: Google's JWKS (`https://www.googleapis.com/oauth2/v3/certs`) is fetched through `IHttpClientFactory`, cached in `IMemoryCache` for the document's `Cache-Control: max-age` (one hour when absent), and re-fetched once when a token names an unknown key. Signature, issuer (`https://accounts.google.com` or `accounts.google.com`), audience and expiry (five minutes of skew) are all required. The Application layer sees only `IGoogleIdTokenVerifier.VerifyAsync(credential)`, which returns the Google subject, email and whether Google verified that email, or `null`.
3. **Mapping onto accounts.** `Users.GoogleSubject` (nullable, unique when set) links an account to a Google account. `SignInWithGoogleCommandHandler` looks up the subject first; failing that, it links the Google account to the existing account with the same email **only when that account's email is verified**; an unverified existing account is refused with `409 email_unverified` and left unchanged; and when no account exists it creates one as registration does (a `User` owning a new empty `Family`), with `EmailVerifiedUtc` set because Google verified the address, no verification email, and an empty `PasswordHash`. The linking rule closes the pre-registration takeover: an attacker who registered with a victim's address but never proved ownership cannot gain the victim's Google sign-in, and the victim keeps a password-less path to their own data (reset by email, then sign in with the password). Google's `email_verified=false` is refused with `401 google_email_unverified` for the same reason.
4. **Password-less accounts.** An account created through Google has no password. `LoginCommandHandler` refuses an empty hash with the usual `401 invalid_credentials`, so the response never says why. The person sets a password through the existing forgot-password flow if they want one; both sign-ins then work.
5. **One minting site, one anonymous surface.** Success issues the pair through `RefreshTokenIssuer`, so lifetimes, hashing, IP capture and the `AuthSuccessDto` shape are those of a password login. `POST /api/auth/google` joins the `[AllowAnonymous]` list of L2-008.
6. **The browser owns persistence.** `SessionStore.loginWithGoogle(credential, remember)` persists the pair to the tier the "Remember me" toggle selects (L2-007) and remembers the email when the toggle is on, exactly as `login()` does. The page shares its return-URL rule with the password path.
7. **Tests stand in for Google at both boundaries.** API tests replace `IGoogleIdTokenVerifier` with a fake that maps credential strings to identities, so every mapping rule in decision 3 is an integration test against the real database; `GoogleIdTokenVerifierTests` sign tokens with a throwaway RSA key and serve the matching JWKS from a fake handler, so the verification rules run without the network. Playwright installs a fake `window.google.accounts.id` before each page loads (so no spec ever downloads Google's script) and answers `POST /api/auth/google` from a route stub with a pair obtained from a real `POST /api/auth/login`, so the whole browser path (button, store, storage tier, navigation, banners) runs against the real session machinery. The fake's button is drawn to the same branding rules as the mock's stand-in, so the sign-in visual baselines stay exact (ADR-010).

## Options Considered

### Option 1: Google Identity Services ID token, Google-rendered button (chosen)
- **Pros:** No secret to deploy; verification is offline against cached keys; Google's button carries its own branding and accessibility; the smallest configuration surface (one client id).
- **Cons:** The button is an iframe that the design tokens cannot style; the mock draws a stand-in to Google's branding guidelines and the dark theme is chosen at render time (`filled_black`), not by the cascade.

### Option 2: OAuth 2.0 authorization code in a popup, exchanged by the API
- **Pros:** A design-system button with pixel parity; refresh tokens from Google if the product ever reads Google data.
- **Cons:** A client secret in Azure and in every developer's environment; an outbound call to Google's token endpoint per sign-in; the deploy pipeline refuses to run until the secret exists.

### Option 3: ASP.NET Core's Google remote authentication handler
- **Pros:** Framework-provided.
- **Cons:** A cookie-and-redirect scheme beside the bearer scheme, a callback route on the API origin and a cross-origin hand-off back to the SPA; the session model of ADR-007 would need a second entry point.

## Consequences

- A new column (`Users.GoogleSubject`, migration `AddGoogleSubject`) and a new anonymous endpoint.
- `Saturdaze:Google:ClientId` is optional: when it is empty the API answers `503 google_not_configured`, and the app hides the button when `environment.googleClientId` is empty, so a deployment without a Google OAuth client keeps working.
- A person with a pending family invitation (ADR-016) who signs in with Google first gets their own family rather than the inviting one, and the invitation then fails with `email_in_use`; invitees keep using the invite link. Accepting an invitation through Google is a later requirement.
- The Google button renders once at the card's width; it does not re-render on resize.
- Removing a Google link and showing "Signed in with Google" on the account card are out of scope.
- **Amended 2026-10-24 (L2-182).** Saturdaze Admin's sign-in offers the same button through the same OAuth client and `POST /api/auth/google`; the admin app binds `GOOGLE_CLIENT_ID` and `GOOGLE_IDENTITY` in its own composition root. The client's authorised JavaScript origins therefore list the admin origins (`http://localhost:4300`, `https://admin.saturdaze.ca`) beside the family app's. The role gate is unchanged: a Google sign-in that resolves to a `User` role sees `sd-admin-gate`.
