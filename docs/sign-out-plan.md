# Plan — Sign-out treatment

**Goal.** Wire the mock-designed sign-out flow into the Angular app. An Account section on `/profile` shows the signed-in identity and a destructive Sign out button. Tapping it opens a CDK confirmation dialog. Confirming clears the session (calls `SessionStore.logout()`) and routes to `/login`. Refreshing the browser after sign-out does *not* re-authenticate.

This is a small UX slice that builds on machinery already in place. **No backend changes are required for the minimum viable cut** — every backend piece (`/api/auth/me`, the JWT middleware, the interceptor's 401 handling) keeps doing what it does today. An optional H slice (S5) wires up `createdAtUtc` so the "since May 2026" sub-line in the mock is data-driven rather than aspirational.

The mock for this work lives in `docs/mocks/pages/profile.html` (Account section, end of file) and `docs/mocks/pages/dialogs.html` (last entry — "Sign out confirm").

---

## 1. What is already in place

- **`SessionStore.logout()`** — `frontend/projects/api/src/lib/services/session-store.ts:87`. Clears both storage tiers, resets `user/token/error` signals.
- **CDK `Dialog`** is injected into `ProfilePage` (`pages/profile/profile.page.ts:60`) and already used for `FamilyMemberDialog` and `CommitmentDialog`. Same pattern applies to the new sign-out dialog.
- **Page-level dialog conventions** under `frontend/projects/saturdaze/src/app/dialogs/<name>-dialog/<name>-dialog.{ts,html,scss}`. Each exports a `*Data` input interface and a `*Result` output type; the page uses `firstValueFrom(ref.closed)` to await the result.
- **`authInterceptor`** (`auth/auth.interceptor.ts:26`) already redirects to `/login?returnUrl=<current>` on any 401 and calls `session.logout()` along the way, so a forced sign-out path exists. The deliberate path will share the same `SessionStore.logout()` call.
- **`requireAuth` guard** reads `SessionStore.isAuthenticated()` synchronously, so clearing the session signal makes the next guarded navigation bounce immediately.
- **`User` model** (`projects/api/src/lib/models/user.ts`) exposes `id, email, role, emailVerifiedUtc`. Critically, **no `createdAtUtc`** — the mock's "since May 2026" line needs either a backend addition or softer copy. See D2.
- **Icon library drift** — the `sign_out` glyph was added to `docs/mocks/components/sd-icon.js` when the mock landed. The production library at `frontend/projects/components/src/lib/icon/icon.ts` does not have it yet. Pulling it across is mechanical (one line in the `ICONS` map).
- **Seeded dev user** — `quinntynebrown@gmail.com` / `password123` is reset-stable via `UserSeeder`, so the e2e suite has a deterministic identity to sign in and out as.

---

## 2. Decisions

| # | Decision | Default |
|---|---|---|
| D1 | Confirm before signing out? | **Yes.** Match the mock. A one-tap destructive action is the kind of mis-fire a user only forgives once. The cancel action is labelled `Stay signed in` so the safe choice reads as an affirmation, not as undoing intent. |
| D2 | Identity sub-line on the Account card | **"Signed in" with no date for the I-slice.** `User` doesn't carry `createdAtUtc` yet. S5 (optional, deferable) adds it. Until then, the mock's "since May 2026" copy is aspirational and the rendered UI degrades gracefully. |
| D3 | Where the user lands after sign-out | **`/login`.** The user just opted out of this session; `/login` is the canonical re-entry surface and matches what the interceptor uses on 401. (`/splash` is the public marketing pitch — wrong audience for someone who already has an account.) |
| D4 | The profile top-bar `more` overflow button | **Out of scope.** The mock's "more" icon stays as a stub. The Account-section button is the discoverable primary affordance. Once a second account action exists, an action sheet or menu becomes worth building — not before. |
| D5 | Server-side session revocation | **Not in this plan.** There is no `POST /api/auth/logout` endpoint yet — refresh-token rotation is deferred to H5 in `docs/auth-implementation-plan.md`. Client-side `SessionStore.logout()` is sufficient given the soft-gate posture; the access token expires inside 15 minutes either way. When H5 lands, wire a `revoke()` call into the confirm path. |
| D6 | Multi-tab consistency | **Not in this plan.** Signing out in tab A leaves tab B authenticated until its next API call returns 401 (then `authInterceptor` bounces it). A `storage`-event listener on the `sd.auth.token` key is the obvious follow-up if real users complain. |

---

## 3. Slices

Each slice is small enough to land as a single commit and has a concrete done-when.

### Slice S1 — Add `sign_out` glyph to the Angular icon set

`frontend/projects/components/src/lib/icon/icon.ts` — append one entry to the `ICONS` map mirroring the mock:

```ts
sign_out: `<path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5"/><path d="M14 8l4 4-4 4"/><path d="M18 12H9"/>`,
```

The file's own header already says it "Mirrors `docs/mocks/components/sd-icon.js`" — this is bringing the runtime back in sync.

*Done when*: `<sd-icon name="sign_out">` renders the door-and-arrow glyph in the components gallery at `/components`.

### Slice S2 — `SignOutDialog` component

New folder: `frontend/projects/saturdaze/src/app/dialogs/sign-out-dialog/`. Three files mirror the existing `family-member-dialog/`:

```ts
export interface SignOutDialogData {
  readonly email: string;
}
export type SignOutDialogResult = 'confirm';   // closed without a result ⇒ cancel
```

Content matches `docs/mocks/pages/dialogs.html` (last entry, "Sign out confirm"):

- Title: `Sign out?`
- Subtitle: `I'll forget you on this device until you sign back in.`
- Body: a sunk `sd-card` with a `key` icon. Heading **You'll need to sign back in**, then `{{ data.email }} + your password. Saved weekends and family settings stay put.`
- Actions: `Stay signed in` (secondary, calls `dialogRef.close()`) + `Sign out` (`variant="danger"`, calls `dialogRef.close('confirm')`).

A11y: `autoFocus: 'first-tabbable'`, `restoreFocus: true`. Because the dialog's first tabbable control is `Stay signed in`, the destructive action is not the default — Enter on an empty form cancels rather than confirms.

*Done when*: a Vitest spec opens the dialog against a stub `DialogRef` and asserts the confirm button resolves to `'confirm'` while the cancel button (and Esc) resolves to `undefined`.

### Slice S3 — Account section on `/profile` + page wiring

**Template** — append to `profile.page.html`, *outside* `.profile-cols` and *before* `<sd-bottom-nav>`. The markup follows the mock 1:1:

```html
<sd-section title="Account" subtitle="This device's session">
  <div class="account-block">
    <sd-card variant="sunk">
      <div class="account-identity">
        <sd-avatar [name]="(user()?.email ?? '?').charAt(0).toUpperCase()" tone="primary" />
        <div class="account-meta">
          <div class="account-email">{{ user()?.email }}</div>
          <div class="account-sub">Signed in</div>
        </div>
      </div>
    </sd-card>
    <sd-button variant="danger" full (click)="signOut()">
      <sd-icon slot="leading" name="sign_out" [size]="16" />
      Sign out
    </sd-button>
  </div>
</sd-section>
```

**Page class** — small additions to `ProfilePage`:

```ts
private readonly session = inject(SESSION_STORE);
private readonly router  = inject(Router);
protected readonly user  = this.session.user;

protected async signOut(): Promise<void> {
  const email = this.user()?.email ?? '';
  const ref = this.dialog.open<SignOutDialogResult, SignOutDialogData>(
    SignOutDialog,
    { data: { email }, autoFocus: 'first-tabbable', restoreFocus: true },
  );
  const result = await firstValueFrom(ref.closed);
  if (result !== 'confirm') return;

  this.session.logout();
  await this.router.navigateByUrl('/login');
}
```

The page already imports `Dialog`, `Avatar`, `Button`, `Card`, `Icon`, `Section`. Only `SESSION_STORE` (token) and `Router` are new injections.

*Done when*:

- The Account section renders at the bottom of `/profile` with the signed-in email.
- Clicking **Sign out**, then **Sign out** in the dialog:
  - empties `localStorage.sd.auth.token` and `sd.auth.storage` (also session storage),
  - sets `SessionStore.user()` / `token()` / `error()` to `null`,
  - navigates to `/login`.
- Reloading `/login` and trying to navigate to `/weekend` re-bounces to `/login?returnUrl=%2Fweekend` (proves the persisted token is genuinely gone, not just the in-memory signals).

### Slice S4 — Tests

- **`sign-out-dialog.spec.ts`** — confirm button resolves `'confirm'`; cancel button + Escape resolve `undefined`.
- **`profile.page.spec.ts`** (or a focused test if the file grows too large) — with a stub `Dialog` that emits `'confirm'`, `signOut()` calls `SessionStore.logout()` and `router.navigateByUrl('/login')`. With a stub that emits `undefined`, neither side-effect fires.
- **`e2e/tests/sign-out.spec.ts`** — log in as `quinntynebrown@gmail.com` / `password123`, navigate to `/profile`, scroll the Account section into view, click Sign out, confirm in the dialog, assert URL is `/login`. Then navigate to `/weekend` and assert URL becomes `/login?returnUrl=%2Fweekend`. The seeded user makes this deterministic across machines.
- **Visual** — update `e2e/tests/visual/profile.visual.spec.ts` baseline once the Account section is in place. One-shot re-record with `SD_BASELINE=1`.

### Slice S5 — Optional H1: data-driven "since {month year}" sub-line

Three minor edits, deferrable until after I1 ships:

1. **API** — add `CreatedAtUtc` to `UserDto` (`Saturdaze.Application/Contracts/UserDto.cs`) and surface it from `RegisterUserCommandHandler.Handle` + `MeQueryHandler`.
2. **Frontend model** — add `readonly createdAtUtc: string;` to `User`.
3. **Profile template** — replace `Signed in` with `Signed in · since {{ user()?.createdAtUtc | date:'MMMM y' }}`.

No DB migration is required — `User.CreatedAtUtc` already exists in the domain entity (`Domain/Entities/User.cs:14`); it just isn't projected into the DTO yet.

*Done when*: the Account card sub-line reads "Signed in · since May 2026" for the seeded user (or whatever month they registered) without any hard-coded date string in the codebase.

---

## 4. Verification matrix

After S1–S4 land, the following should hold:

| Scenario | Expected |
|---|---|
| `/profile` rendered while signed in | Account section visible at the bottom; identity card shows `email` from `session.user()`; danger Sign out button enabled. |
| Tap Sign out → dialog opens | CDK dialog with title "Sign out?", reassurance card, two actions. Esc and the backdrop close it without signing out. First-tabbable focus lands on **Stay signed in**. |
| Confirm in dialog | `session.user()` becomes `null`; `localStorage.sd.auth.token` and `sd.auth.storage` are gone; the same for `sessionStorage`; router lands on `/login` with no `returnUrl`. |
| Sign out, then attempt back-navigation to `/weekend` | `requireAuth` redirects to `/login?returnUrl=%2Fweekend`. |
| Sign out while offline | Still works — `SessionStore.logout()` is purely client-side; no network call. |
| Bearer attached after sign-out | None. The interceptor reads `session.token()`, which is now `null`, so subsequent requests carry no `Authorization` header. |

---

## 5. Risks & non-goals

- **No server-side token revocation.** The 15-minute access token remains technically valid until expiry; only this client forgets it. Acceptable until H5 ships, at which point a `/api/auth/logout` call into the confirm path becomes mechanical.
- **No multi-tab broadcast.** Tab B keeps its in-memory session until its next API call returns 401. A `window.addEventListener('storage', …)` listener inside `SessionStore` is the right follow-up; deliberately deferred to keep this slice small.
- **Subline copy depends on S5.** The I-slice ships with `Signed in` (no date). If a stakeholder expects the mock's exact copy, land S5 in the same PR.
- **Visual baseline shift.** Existing `profile.visual.spec.ts` snapshots will fail until re-recorded. Coordinate with whoever holds the baseline.

---

## 6. Next action

Execute **S1** (icon glyph) and **S2** (the dialog component) in parallel — they're independent. Then **S3** (page wiring) once both are in. Tests in **S4** land alongside or just behind S3. S5 only if "since {month year}" is a must-have for the launch reviewer.
