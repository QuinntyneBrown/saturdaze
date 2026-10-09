# 23 · Removing a family member

> **Runtime:** ~6.3 min · **Audience:** developers working on accounts, auth and the family profile · **Prerequisites:** videos 20 to 22; ADR-008 helps

**Video:** [23-removing-a-family-member.mp4](23-removing-a-family-member.mp4) · [Slides](slides.html) · **Audio:** [23-removing-a-family-member.mp3](23-removing-a-family-member.mp3) · [Transcript](script.md) · [Clips](clips/clips.mjs)

## Why this video exists

Removal is where access control has to hold (L2-128, L2-129). A removed member's invitation must stop working, and a removed member who signs in must lose access immediately, even in a tab they still have open. That took one change outside the feature: the family lookup now reads the database on every request (ADR-016 §5, superseding ADR-008 §2).

## Learning objectives

By the end, the viewer can:

- Describe the three D21 confirmations and when each appears.
- List what `DELETE /api/family/members/{id}` deletes, and its responses.
- Explain why a member with an account is deleted, not detached.
- Explain why an open tab loses access at once, and what that costs.
- Say why the whole-profile save refuses to drop a member with access.

## Key questions

| Question | What a strong answer includes |
|----------|-------------------------------|
| What does D21 say? | None: "Future weekends will not plan for them." Invited: "The invite sent to … will stop working." Account: "… will be signed out and will no longer be able to sign in." |
| What is deleted? | The member; its invitation (cascade); for Account, the user, with refresh, verify and reset tokens and avatar (cascade). |
| What can it answer? | 204; 403 `owner_only`; 404 outside the family; 409 `cannot_remove_owner`. |
| Why not detach the account? | A familyless login would create a new family on its first profile save; the account only existed through the invite. |
| Why does access end at once? | `CurrentUserFamilyAccessor` reads `Users.FamilyId` per request; a missing user is 401; the refresh token is gone, so the app goes to sign-in. |
| What does the profile save refuse? | Dropping an Invited or Account member: 409 `member_has_access`. |

## Code / assets on screen

| File | What to show |
|------|-------------|
| `frontend/projects/saturdaze/src/app/pages/family/family.page.ts` | `removalConsequence` |
| `backend/src/Saturdaze.Application/Families/RemoveFamilyMemberCommand.cs` | The handler |
| `backend/src/Saturdaze.Application/Common/CurrentUserFamilyAccessor.cs` | The per-request lookup |
| `frontend/projects/api/src/lib/auth/auth.interceptor.ts` | 401 → one refresh → sign in (unchanged) |
| `backend/src/Saturdaze.Application/Families/SaveFamilyProfileCommandHandler.cs` | `member_has_access` |
| Clips `remove-invited`, `remove-account`, `signed-out` | Removing Theo and Rosa; Jordan's open tab after removal |

## Run sheet

| Time | Segment | Content |
|------|---------|---------|
| 00:00-00:32 | Introduction | Three kinds of removal; why the last one matters |
| 00:33-01:28 | What the owner is told | The access hint, three D21 bodies, the `DELETE` |
| 01:29-03:18 | What the server removes | The handler, cascades, delete vs detach, responses; clips of removing Theo and Rosa |
| 03:19-04:51 | Access ends now | The 15-minute gap, the accessor change, the client's 401 path; clip of Jordan's tab |
| 04:52-05:29 | The profile save can't drop them | `member_has_access` |
| 05:30-06:17 | Recap | Things to remember; the series |

## Demo commands

```sh
curl -s -X DELETE http://localhost:5100/api/family/members/<memberId> -H "Authorization: Bearer $OWNER_TOKEN" -o /dev/null -w '%{http_code}\n'
# the removed member's old access token, refresh token and password all now fail
curl -s http://localhost:5100/api/family -H "Authorization: Bearer $MEMBER_TOKEN" -o /dev/null -w '%{http_code}\n'   # 401

SD_DEMO_RESET='dotnet run --project backend/src/Saturdaze.Cli -- reset --yes' \
  node tools/video-record/record-clips.mjs docs/videos/23-removing-a-family-member
```

## Pitfalls

- Removal is permanent for a member who signs in: the account is deleted, and re-inviting creates a new one.
- The owner's own member row isn't linked to the owner's account, so it is removable like any member without access.
- The `family_id` claim is still in the token but no longer trusted; don't reintroduce a claim-first lookup.
- The profile save can still drop members without access; only Invited and Account members are protected.

## References

- `docs/specs/L2.md` L2-128, L2-129
- `docs/adr/ADR-016-family-ownership-and-member-sign-in.md` §4, §5 · `docs/adr/ADR-008-per-user-family-scoping-and-auth-fallback.md`
- `docs/detailed-designs/identity-and-access/manage-family-members/` (sequence: remove a member)
- Mocks: `docs/mocks/pages/dialogs.html#dialog-remove-invited`, `#dialog-remove-account`
