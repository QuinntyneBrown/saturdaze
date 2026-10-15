# 43 · Reset links: say what the server does

> **Runtime:** ~4.5 min · **Audience:** contributors to the auth flow, the reset screens and the tests · **Prerequisites:** video 18 (How account emails are drafted)

**Video:** [43-reset-link-lifetime-88.mp4](43-reset-link-lifetime-88.mp4) · [Slides](slides.html) · **Audio:** [43-reset-link-lifetime-88.mp3](43-reset-link-lifetime-88.mp3) · [Transcript](script.md) · [Clips](clips/clips.mjs)

## Why this video exists

Issue 88: the password-reset screens told people their link lasts 30 minutes, but `ForgotPasswordCommandHandler` keeps it valid for 60 (`now.AddMinutes(60)`), the detailed design says 60, and L2-005 stated no expiry. Decision: 60 minutes (copy only, lowest risk). L2-005 now has AC5 (accepted at T+59, rejected as `token_expired` at T+61) and AC6 (the screens state the same duration).

## Learning objectives

By the end, the viewer can:

- Explain why one number must live in the requirement, the handler and the copy.
- Describe the decision between 60 and 30 minutes and why 60 was chosen.
- Read the back-end clock tests and the Playwright test that ties the copy to the server's response.

## Key questions

| Question | What a strong answer includes |
|----------|-------------------------------|
| Why 60 and not 30? | Copy-only, lowest risk: people were told less time than they got; token handling is unchanged. |
| Why were the back-end tests green first? | The server was already right; they pin the contract. The red test was the front-end copy. |
| How is a link shown accepted and rejected? | The fake clock gained `TimeOfDay`: T+59 min → 200, T+61 min → 400 `token_expired`. |

## Code / assets on screen

| File | What to show |
|------|--------------|
| `docs/specs/L2.md` | L2-005 AC5 and AC6. |
| `backend/tests/Saturdaze.Api.Tests/Auth/PasswordResetExpiryTests.cs` | The three clock tests. |
| `backend/tests/Saturdaze.Api.Tests/Support/FakeDateTimeProvider.cs` | `TimeOfDay`. |
| `e2e/tests/reset-password.spec.ts` | The lifetime acceptance test. |
| `frontend/projects/saturdaze/src/app/pages/reset-password/reset-password.page.html` | The two lines of copy. |

## Run sheet

| Time | Segment | Content |
|------|---------|---------|
| 00:00-00:27 | Introduction | What the video covers. |
| 00:27-01:06 | The mismatch | 30 vs 60 and the silent requirement. |
| 01:06-01:31 | Why it matters | Trust and security. |
| 01:31-03:24 | The fix | Decision, requirement, tests, copy. |
| 03:24-04:07 | On the real screen | Before, after and the clock tests. |
| 04:07-04:32 | Recap | Four things to remember. |

## Demo commands

```sh
cd backend && dotnet test tests/Saturdaze.Api.Tests --filter "FullyQualifiedName~PasswordResetExpiryTests"
cd e2e && npx playwright test tests/reset-password.spec.ts --project=desktop -g "same duration"
# clips: development builds of main and the fix, served on :4401 and :4402, API on :5100
node tools/video-record/record-clips.mjs docs/videos/43-reset-link-lifetime-88
```

## Pitfalls

- A running local API locks the build output; stop it before `dotnet test`.
- An expired token returns `token_expired`; a used or unknown one returns `token_invalid`.

## References

- ADR-007 (local JWT authentication) in `docs/adr/`.
