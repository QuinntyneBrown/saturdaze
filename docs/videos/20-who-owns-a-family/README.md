# 20 · Who owns a family, and who's in

> **Runtime:** ~5.7 min · **Audience:** developers and product people working on accounts and the family profile · **Prerequisites:** none; video 18 helps

**Video:** [20-who-owns-a-family.mp4](20-who-owns-a-family.mp4) · [Slides](slides.html) · **Audio:** [20-who-owns-a-family.mp3](20-who-owns-a-family.mp3) · [Transcript](script.md) · [Clips](clips/clips.mjs)

## Why this video exists

As of October 2026, a Saturdaze family can have several sign-ins (L1-037, ADR-016). This first video in the family members series sets up the vocabulary the others use: who owns a family, the three kinds of member access, the owner-only rule, and adding a member who will never sign in.

## Learning objectives

By the end, the viewer can:

- Say who owns a family, how `Family.OwnerUserId` is set, and how existing families were given an owner.
- Name the three member access values and explain why access is derived rather than stored.
- Explain the owner-only rule, and why it answers 403 where the rest of the API answers 404.
- Add a member who never signs in, and name the responses the endpoint can give.

## Key questions

| Question | What a strong answer includes |
|----------|-------------------------------|
| Who owns a family? | The account that created it: registration, the first profile save, or `UserSeeder`. Older families got their earliest account (`CreatedAtUtc`, then `Id`). |
| What if no account created it? | `OwnerUserId` stays null, and any of its accounts may manage members (the shared seeded test household). |
| What are None, Invited and Account? | Never signs in; an unaccepted invitation exists; linked to a user. Derived in `FamilyProfileMapper`, never stored. |
| Who may change who's in? | Only the owner. `FamilyOwnership.EnsureOwnerAsync` throws `ForbiddenException("owner_only")`, mapped to 403. |
| How is a child added? | D17b with "No sign-in": `POST /api/family/members` with no email; 201 with access None and no invite. |

## Code / assets on screen

| File | What to show |
|------|-------------|
| `docs/specs/L1.md` | L1-037 |
| `backend/src/Saturdaze.Application/Auth/RegisterUserCommandHandler.cs` | `OwnerUserId = userId` |
| `backend/src/Saturdaze.Infrastructure/Migrations/*_AddFamilyOwner.cs` | The backfill `UPDATE` |
| `backend/src/Saturdaze.Application/Families/FamilyOwnership.cs` | `IsOwner`, `EnsureOwnerAsync` |
| `backend/src/Saturdaze.Domain/Enums/MemberAccess.cs` | None, Invited, Account |
| `backend/src/Saturdaze.Application/Families/FamilyProfileMapper.cs` | Access derived per member |
| `backend/src/Saturdaze.Application/Families/AddFamilyMemberCommand.cs` | Owner check, unique name |
| Clips `owner-view`, `add-child` | The owner's Family page; adding Mae, 5, with No sign-in |

## Run sheet

| Time | Segment | Content |
|------|---------|---------|
| 00:00-00:38 | Introduction | One account was one family; the series |
| 00:38-01:24 | One family, several sign-ins | L1-037; what is shared and what is owner-only |
| 01:25-02:19 | Recording the owner | `OwnerUserId`, the backfill, ownerless families |
| 02:20-03:27 | How a member signs in | None, Invited, Account; derived; `GET /api/family`; clip of the owner's view |
| 03:28-04:08 | Only the owner changes who's in | `EnsureOwnerAsync`; 403 vs ADR-008's 404 |
| 04:08-05:08 | Adding a member who won't sign in | D17b, the handler and its responses; clip of adding Mae |
| 05:09-05:42 | Recap | Things to remember |

## Demo commands

```sh
# Against a freshly reset database (see tools/video-record/family-demo/README.md)
curl -s -X POST http://localhost:5100/api/family/members \
  -H "Authorization: Bearer $OWNER_TOKEN" -H 'content-type: application/json' \
  -d '{"name":"Mae","age":5}'
curl -s http://localhost:5100/api/family -H "Authorization: Bearer $OWNER_TOKEN"

# Record the clips
SD_DEMO_RESET='dotnet run --project backend/src/Saturdaze.Cli -- reset --yes' \
  node tools/video-record/record-clips.mjs docs/videos/20-who-owns-a-family
```

## Pitfalls

- The owner's own row is an ordinary member with access None; nothing links the owner's account to a member row.
- An ownerless family lets every account manage members. It exists for seed data; don't create one on purpose.
- A non-owner gets 403 `owner_only`, not 404: they can already see the members.
- Member names are unique per family, ignoring case (409 `member_name_in_use`).

## References

- `docs/specs/L1.md` L1-037 · `docs/specs/L2.md` L2-124, L2-125
- `docs/adr/ADR-016-family-ownership-and-member-sign-in.md` · `docs/adr/ADR-008-per-user-family-scoping-and-auth-fallback.md`
- `docs/detailed-designs/identity-and-access/manage-family-members/`
- Mocks: `docs/mocks/pages/family.members.html`, `docs/mocks/pages/dialogs.html#dialog-member-add`
