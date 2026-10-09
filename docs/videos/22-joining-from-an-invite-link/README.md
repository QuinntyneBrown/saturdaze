# 22 · Joining from an invite link

> **Runtime:** ~6.2 min · **Audience:** developers working on accounts, auth and the family page · **Prerequisites:** videos 20 and 21

**Video:** [22-joining-from-an-invite-link.mp4](22-joining-from-an-invite-link.mp4) · [Slides](slides.html) · **Audio:** [22-joining-from-an-invite-link.mp3](22-joining-from-an-invite-link.mp3) · [Transcript](script.md) · [Clips](clips/clips.mjs)

## Why this video exists

The invitee's side of L2-127: the accept page, the two anonymous endpoints, the account it creates, and what a member who is not the owner sees and may change (L2-124 #4, L2-129).

## Learning objectives

By the end, the viewer can:

- Trace an invite link from `/accept-invite?token=…` to a signed-in member.
- Say what `InvitationResolver` checks and which error each case returns.
- List what accepting writes in one save, and why the email is marked verified.
- Describe the member view and the server rule that backs it.

## Key questions

| Question | What a strong answer includes |
|----------|-------------------------------|
| Why no guard on the route? | Like `/verify-email`, it is opened from a message, signed in or not. |
| Which endpoints are anonymous? | `POST /api/auth/invitation` (preview) and `POST /api/auth/accept-invitation`; L2-008's list grew by these two. |
| What makes a link unusable? | Missing or accepted → `token_invalid` (a removed member's invite is missing); past 7 days → `token_expired`. |
| What does accepting write? | A user in the family with `EmailVerifiedUtc` set; `FamilyMember.UserId`; `AcceptedAtUtc`; a refresh token. 201, stored like a sign-up. |
| What changes for a non-owner? | The subtitle names the owner, rows aren't actionable, no add row; `PUT /api/family` changing members → 403 `owner_only`. |

## Code / assets on screen

| File | What to show |
|------|-------------|
| `frontend/projects/saturdaze/src/app/app.routes.ts` | The unguarded `accept-invite` route |
| `backend/src/Saturdaze.Application/Auth/InvitationResolver.cs` | Hash lookup and the two errors |
| `backend/src/Saturdaze.Application/Auth/AcceptInvitationCommand.cs` | The four writes |
| `frontend/projects/saturdaze/src/app/pages/family/family.page.ts` | `membersSubtitle` |
| `backend/src/Saturdaze.Application/Families/SaveFamilyProfileCommandHandler.cs` | The non-owner guard |
| Clips `accept` and `invalid` (390 px), `sign-in`, `member-view` | Joining on a phone; the used link; signing in; the member view |

## Run sheet

| Time | Segment | Content |
|------|---------|---------|
| 00:00-00:25 | Introduction | Jordan's side |
| 00:25-01:26 | Opening the link | Unguarded route, two anonymous endpoints, `InvitationResolver` |
| 01:27-03:05 | Choosing a password | The join card, checks on accept, the four writes; clip on a phone |
| 03:05-03:33 | A link that no longer works | Used, removed, expired; clip of the used link |
| 03:34-04:03 | Signing in as themselves | An ordinary account; clip of sign-in |
| 04:04-05:30 | The member view | Three UI changes, the server guard; clip of Jordan's family page |
| 05:30-06:13 | Recap | Things to remember |

## Demo commands

```sh
curl -s -X POST http://localhost:5100/api/auth/invitation -H 'content-type: application/json' \
  -d '{"token":"<token from the invite>"}'
curl -s -X POST http://localhost:5100/api/auth/accept-invitation -H 'content-type: application/json' \
  -d '{"token":"<token>","password":"lavender-weekend"}'

SD_DEMO_RESET='dotnet run --project backend/src/Saturdaze.Cli -- reset --yes' \
  node tools/video-record/record-clips.mjs docs/videos/22-joining-from-an-invite-link
```

## Pitfalls

- `token_invalid` covers used and removed invites alike; the page shows one state for both, plus expiry.
- A short password fails with `weak_password` and leaves the invite usable.
- If the address gained an account after the invite was sent, accepting returns 409 `email_in_use`.
- The non-owner guard compares names and ages; a save with the member list unchanged still succeeds.

## References

- `docs/specs/L2.md` L2-124, L2-127, L2-129, L2-008
- `docs/adr/ADR-016-family-ownership-and-member-sign-in.md`
- `docs/detailed-designs/identity-and-access/manage-family-members/` (sequence: accept an invitation)
- Mocks: `docs/mocks/pages/accept-invite.html`, `docs/mocks/pages/family.member.html`
