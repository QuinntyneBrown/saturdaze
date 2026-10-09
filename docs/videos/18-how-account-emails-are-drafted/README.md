# 18 · How account emails are drafted

> **Runtime:** ~7.1 min · **Audience:** developers working on accounts and sign-in · **Prerequisites:** none; ADR-007 helps

**Video:** [18-how-account-emails-are-drafted.mp4](18-how-account-emails-are-drafted.mp4) · [Slides](slides.html) · **Audio:** [18-how-account-emails-are-drafted.mp3](18-how-account-emails-are-drafted.mp3) · [Transcript](script.md) · [Clips](clips/clips.mjs)

## Why this video exists

Saturdaze says "Check your email" after sign-up and after forgot password, but as of October 2026 it has no email provider (drift audit gap G01). This video shows what is real. The server drafts a single-use, hashed token for each link and returns an envelope (`AuthTokenDeliveryDto`) a sender could post. In Development and Testing, `DevDelivery` hands the token back in the response. Everywhere else the link goes nowhere.

## Learning objectives

By the end, the viewer can:

- Explain how a link token is made, what is stored, and why only the hash is stored.
- Trace the verification and password-reset flows from handler to screen.
- Say what makes a link single use, and what kills an older link.
- Get a working link locally, the way the tests do, and say what is missing for real delivery.

## Key questions

| Question | What a strong answer includes |
|----------|-------------------------------|
| What is drafted? | 32 random bytes, Base64Url-encoded, from `CreateRawRefreshToken`. Stored as a lowercase-hex SHA-256 in `TokenHash`. |
| What makes a link single use? | `ConsumedAtUtc` is set on use, and on every live token when a new link is requested. |
| How long do links last? | Verification: 24 hours. Reset: 60 minutes in `ForgotPasswordCommandHandler`. The reset screens say 30, which is drift. |
| Does forgot password leak accounts? | No. Known and unknown addresses both get `202 Accepted`, and the page shows the sent card either way (L2-004). |
| What is sent? | Nothing. `DevDelivery` returns `{ email, token, expiresAtUtc }` only in Development and Testing, and `{}` otherwise (G01). |

## Code / assets on screen

| File | What to show |
|------|--------------|
| `backend/src/Saturdaze.Api/Controllers/AuthController.cs` | "No email provider yet" comment; `DevDelivery` |
| `backend/src/Saturdaze.Infrastructure/Authentication/JwtTokenService.cs` | `CreateRawRefreshToken`, `HashRefreshToken` |
| `backend/src/Saturdaze.Domain/Entities/EmailVerificationToken.cs` | The token shape (same as `PasswordResetToken`) |
| `backend/src/Saturdaze.Application/Contracts/AuthTokenDeliveryDto.cs` | The envelope |
| `backend/src/Saturdaze.Application/Auth/RegisterUserCommandHandler.cs` | A 24-hour token drafted, the raw value dropped |
| `backend/src/Saturdaze.Application/Auth/ResendVerificationCommandHandler.cs` | Consume live tokens, draft a fresh one |
| `backend/src/Saturdaze.Application/Auth/VerifyEmailCommandHandler.cs` | Hash, look up, consume |
| `backend/src/Saturdaze.Application/Auth/ForgotPasswordCommandHandler.cs` | Same `202` for unknown addresses; 60-minute expiry |
| `frontend/projects/saturdaze/src/app/pages/reset-password/reset-password.page.html` | "30 minutes" copy (drift) |
| `e2e/fixtures/auth.ts` | `devToken` |
| `docs/detailed-design-drift-audit.md` | G01 |
| `clips/verify.mp4`, `clips/reset.mp4` | Screen recordings of `/verify-email` and `/reset-password` |

## Run sheet

| Time | Segment | Content |
|------|---------|---------|
| 00:00-00:34 | Introduction | Two "Check your email" screens; a link is drafted, and no email is sent |
| 00:35-02:04 | Drafting a token | Random bytes, the hash, the token shape, the envelope |
| 02:05-03:41 | The verification email | Register, resend, verify; clip of `/verify-email` |
| 03:42-05:00 | The password reset email | No account leak, 60 minutes; clip of `/reset-password`; the 30-minute drift |
| 05:01-06:15 | Delivery | `DevDelivery`, `devToken`, gap G01 and where a sender plugs in |
| 06:16-07:05 | Recap | Things to remember |

## Demo commands

```powershell
# API as Development against the demo database, plus the family app
./tools/video-record/admin-demo/start-api.ps1
cd frontend; npm run start -- --port 4200

# Get a reset link the way the tests do (Development only)
Invoke-RestMethod -Method Post -Uri http://localhost:5100/api/auth/forgot-password `
  -ContentType 'application/json' -Body '{"email":"you@example.com"}'
# then open http://localhost:4200/reset-password?token=<token>

# Record the clips (each clip registers its own throwaway account)
$env:SD_DEMO_RESET = "node tools/video-record/admin-demo/reset.mjs"
node tools/video-record/record-clips.mjs docs/videos/18-how-account-emails-are-drafted
```

## Pitfalls

- Registration never returns the verification token. Call `resend-verification` to get a usable link, which also kills the one drafted at sign-up.
- `resend-verification` returns no token for an already-verified account, so a seeded user will make `devToken` throw.
- Outside Development and Testing, the response body is `{}`. That is by design, not a bug.
- Resend throttling is client-side only, so the server accepts every request.
- The reset screens say 30 minutes and the handler uses 60. Fixing either one is a behaviour change: write the requirement first.

## References

- `docs/detailed-designs/identity-and-access/` (register, verify email, recover password; sequence diagrams)
- `docs/specs/L1.md` L1-001 · `docs/specs/L2.md` L2-004, L2-005, L2-006
- `docs/adr/ADR-007-refresh-token-session-lifecycle.md`
- `docs/detailed-design-drift-audit.md` (G01)
