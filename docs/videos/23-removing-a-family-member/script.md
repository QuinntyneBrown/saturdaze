# 23 · Removing a family member

This is the fourth and last video in the family members series, and it is about letting people go. The owner can remove any member: a child who no longer needs planning for, someone whose invite was never used, or someone who signs in. The interesting part is the last one. When a member who signs in is removed, their access has to end, right then, even in a browser they still have open. This video shows what the owner sees, what the server deletes, and the one change that makes removal take effect immediately.

## What the owner is told

Removal starts in the edit member dialog, the same one used to change a name or an age. For a member with access, that dialog now says how they sign in: invite sent to an address, or signs in as an address. The Remove button sits on the left, and it opens the remove confirmation, D21.

The confirmation says what removal will do to that person's access, and there are three versions. For a member who never signed in, it says future weekends will not plan for them, exactly as before. For an invited member, it says the invite sent to their address will stop working. For a member who signs in, it says they will be signed out and will no longer be able to sign in. The owner learns the consequence before choosing it, not after.

Confirming calls delete on the family member's endpoint, with the member's ID. Removing no longer goes through the whole-profile save.

## What the server removes

The handler starts with the same owner check as every member change, so anyone else gets a four oh three. It looks for the member inside the caller's family only. A member of another family, or an ID that does not exist, is a four oh four, so the endpoint never confirms what other families contain.

A member without an account is simply deleted. Their invitation, if they had one, goes with them, because of the cascading foreign key from video twenty-one. That is why the removed link answers this invite no longer works.

A member with an account takes their account with them. The handler deletes the user, and the database cascades the rest: refresh tokens, verification and reset tokens, and the profile photo. Why delete, and not just detach the account from the family? Because the account only exists because the owner invited it in. A detached login with no family would quietly create a new family the first time it saved a profile. ADR-016 makes that call.

One member is never removable: one linked to the owner's own account. Trying answers four oh nine, cannot remove owner. Otherwise the response is two oh four, and the app reloads the family.

Here is the owner removing Theo, whose invite was never used. The dialog says invite sent to Theo's address. The confirmation says that invite will stop working. After Remove, Theo is gone from the list, and so is the invitation.

Now Rosa, who signs in. The dialog says signs in as Rosa's address, and the confirmation says Rosa will be signed out and will no longer be able to sign in. After Remove, Rosa's row disappears, and so does Rosa's account.

## Access ends now

Deleting the account ends the refresh tokens, but an access token is a signed token that lives for fifteen minutes. Before this feature, the family lookup trusted the family ID inside that token first. ADR-008 accepted that a stale claim could live for fifteen minutes. A removed member with an open tab could have kept reading the family for that long.

So the lookup changed. `CurrentUserFamilyAccessor` now reads the family from the user's row on every request, by primary key, once per request scope. If the user no longer exists, the request is unauthenticated, a four oh one. The family claim is still put in the token, but it is no longer trusted for scoping. ADR-016 records this as superseding part of ADR-008, and it costs one indexed read per request.

The app already knew what to do with a four oh one. It tries one refresh. The refresh token was deleted with the account, so that fails too, and the app sends the person to the sign-in page.

In the recording, Jordan is on the family page in their own browser. Meanwhile, from another device, Alex removes Jordan. Jordan's tab still shows the family, until Jordan clicks Weekend. The next request is refused, the refresh fails, and Jordan lands on sign in. Signing in with the old password now says that email and password did not match, because the account no longer exists.

## The profile save can't drop them

There is one more way a member could leave the list: the whole-profile save, which replaces the member list with whatever the request contains. If that could drop an invited member or one who signs in, their invitation or account would survive their removal from the family.

So the save refuses. If the request leaves out a member who is invited or has an account, the handler answers four oh nine, member has access, and changes nothing. Members like that leave through the delete endpoint, which revokes their access with them. Members without access can still be dropped by the save, as before.

## Recap

Things to remember.

- D21 says what removal does to a person's access before the owner confirms.
- Removing a member deletes their invitation, and deletes the account of a member who signs in, with its sessions.
- The family lookup reads the user's row on every request, so a removed member's open tab gets a four oh one at once.
- The owner's own account can't be removed, and the profile save can't drop a member with access.

That completes the family members series: who owns a family, inviting a member, joining from the link, and removing a member. The requirements are L2-124 to L2-129, and the decisions are in ADR-016.
