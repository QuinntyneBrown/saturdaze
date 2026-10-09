# 21 · Inviting a family member

> **Runtime:** ~5.5 min · **Audience:** developers working on accounts and the family profile · **Prerequisites:** video 20; video 18 for how link tokens are made

**Video:** [21-inviting-a-family-member.mp4](21-inviting-a-family-member.mp4) · [Slides](slides.html) · **Audio:** [21-inviting-a-family-member.mp3](21-inviting-a-family-member.mp3) · [Transcript](script.md) · [Clips](clips/clips.mjs)

## Why this video exists

Inviting is how a family gets more than one sign-in (L2-126). The design has one surprise worth explaining: with no email provider (drift audit gap G01), the invite link goes back to the owner to share, in every environment, and is shown only once (ADR-016 §3).

## Learning objectives

By the end, the viewer can:

- Describe what "Invite to sign in" changes in D17b and what it sends.
- Name the fields of `FamilyInvitation`, its lifetime, and what makes it single use.
- Explain why the raw token is safe to return to the owner, and what it costs.
- Name the two invite-specific refusals and why each exists.

## Key questions

| Question | What a strong answer includes |
|----------|-------------------------------|
| What differs from adding a child? | Only the email, sent to the same `POST /api/family/members`. |
| What is stored? | A `FamilyInvitation`: family, member, email (as typed and normalized), `TokenHash`, inviter, created, expires (7 days), `AcceptedAtUtc`. |
| How is the token made? | `CreateRawRefreshToken` (32 random bytes, Base64Url); only the SHA-256 from `HashRefreshToken` is stored. |
| Why does the owner get the link? | No email provider. The owner may add this person anyway, so the link adds no power. Shown once; lost means remove and re-invite. |
| Where does the link's origin come from? | `Saturdaze:Share:AppOrigin`; the controller prefixes the handler's relative path. |
| What is refused? | 409 `email_in_use` (already an account) and 409 `already_invited` (outstanding invite to this family); 400 for a malformed email. |

## Code / assets on screen

| File | What to show |
|------|-------------|
| `frontend/projects/saturdaze/src/app/dialogs/family-member-dialog/` | The sign-in choice and email field |
| `backend/src/Saturdaze.Domain/Entities/FamilyInvitation.cs` | The entity |
| `backend/src/Saturdaze.Application/Families/AddFamilyMemberCommand.cs` | `InviteAsync`: refusals, token, row |
| `backend/src/Saturdaze.Infrastructure/Persistence/Configurations/FamilyInvitationConfiguration.cs` | Cascading foreign key to the member |
| `backend/src/Saturdaze.Api/Controllers/FamilyController.cs` | The absolute invite URL |
| Clips `invite`, `refusals` | Inviting Jordan and D30; the two refusals |

## Run sheet

| Time | Segment | Content |
|------|---------|---------|
| 00:00-00:21 | Introduction | The other choice in the dialog |
| 00:22-01:02 | Invite to sign in | Email field, hint, Send invite; the request |
| 01:02-02:08 | What the server creates | Two rows, the entity, the hashed token, the cascade |
| 02:09-03:53 | A link for the owner to share | No email provider; relative and absolute URL; why it's safe; clip of inviting Jordan |
| 03:54-04:53 | What the server refuses | `email_in_use`, `already_invited`, validation; clip of both refusals |
| 04:53-05:28 | Recap | Things to remember |

## Demo commands

```sh
curl -s -X POST http://localhost:5100/api/family/members \
  -H "Authorization: Bearer $OWNER_TOKEN" -H 'content-type: application/json' \
  -d '{"name":"Jordan","age":37,"email":"jordan.rivera@example.com"}'
# → 201 { "member": { …, "access": "Invited" }, "invite": { "email", "token", "url", "expiresAtUtc" } }

SD_DEMO_RESET='dotnet run --project backend/src/Saturdaze.Cli -- reset --yes' \
  node tools/video-record/record-clips.mjs docs/videos/21-inviting-a-family-member
```

## Pitfalls

- The link is in the 201 response only. It cannot be fetched again; remove the pending member and invite again.
- Outside Development, `Saturdaze:Share:AppOrigin` must be set: `appsettings.json` holds only a placeholder, replaced through the `SATURDAZE__SHARE__APPORIGIN` environment variable, as share links already require.
- An address that already has an account cannot be invited, even one with an empty family.
- The dialog closes before the server answers, so a refusal shows in the page's error banner, not in the dialog.

## References

- `docs/specs/L2.md` L2-126 · `docs/adr/ADR-016-family-ownership-and-member-sign-in.md` §3
- `docs/detailed-designs/identity-and-access/manage-family-members/` (sequence: add or invite a member)
- `docs/detailed-design-drift-audit.md` (G01) · video 18, How account emails are drafted
- Mocks: `docs/mocks/pages/dialogs.html#dialog-member-invite`, `#dialog-invite-link`
