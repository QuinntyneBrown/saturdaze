# 21 · Inviting a family member

In the last video, the owner added a member who will never sign in. This one follows the other choice in the same dialog: inviting someone, so they get their own sign-in to the family. You will see what the owner fills in, what the server creates and stores, why the owner gets a link to share instead of an email being sent, and the two cases the server refuses.

## Invite to sign in

The add member dialog asks: will they sign in? Choosing Invite to sign in changes three things. An email field appears, and it is required. The hint changes to say they will choose their own password from the invite link. And the primary button becomes Send invite, with a mail icon, disabled until there is an email.

The dialog checks the address the same way the sign-in forms do, after trimming spaces. Saving sends the name, the age and the email to the same endpoint as before, post to the family members endpoint. The email is the only difference between adding a child and inviting a person.

## What the server creates

The server runs the owner check first, exactly as in video twenty, and the same rule for unique names. Then, because there is an email, it creates two rows in one save: the member, and a `FamilyInvitation` for that member.

The invitation records the family, the member it belongs to, the email as typed and in lower case, who sent it, when it was created and when it expires. Invitations last seven days. A column called `AcceptedAtUtc` starts empty and is set when the invite is used, which makes it single use.

The token is made by the same two helpers that make reset and verification links, the ones video eighteen walks through. Thirty-two random bytes become the raw token, and only its SHA-256 hash is stored. Someone who reads the database sees hashes, never a working invite.

The invitation is tied to its member with a cascading foreign key. Remove the member, and the invitation goes with them. That will matter in video twenty-three.

## A link for the owner to share

Here is the part that may surprise you. As of October 2026, Saturdaze has no email provider, so nothing can be emailed. Rather than draft an email that goes nowhere, the server hands the invite link back to the owner, who sends it however the family talks: a text, a chat, a note on the fridge.

The handler builds a relative path, accept invite with the token in the query string. The controller makes it absolute against the app's origin, from the setting `Saturdaze:Share:AppOrigin`, the same one share links use. The response carries the member, at access Invited, and the invite: the email, the token, the link and when it expires.

Is it safe to give the owner the raw token in every environment? Yes. The owner is already entitled to add this person to the family, so holding the link adds no power they did not have. ADR-016 records that reasoning. The cost is that the link is shown once. Only the hash is stored, so it cannot be shown again. If the owner loses it, they remove the pending member and invite again.

In the recording, Alex invites Jordan, who is thirty-seven. The email field appears when Invite to sign in is chosen, and Send invite stays disabled until it is filled. After sending, the invite link dialog opens: invite ready for Jordan, send this link to the address, it works once. The Copy link button copies it and says copied for two seconds. The footnote says it expires in seven days and that they choose their own password. After Done, Jordan's row reads Parent, thirty-seven, invite sent to Jordan's address.

## What the server refuses

Two refusals are specific to invites, and both come back as four oh nine conflicts.

The first is an email that already signs in to Saturdaze, with the code `email_in_use`. Moving an existing account, with its own family and weekends, into another family is a bigger change than an invite. It is out of scope, and ADR-016 says so.

The second is an email that already has an outstanding invitation to this family, with the code `already_invited`. One pending invite per address keeps the list honest.

A malformed address never gets that far. It fails validation with a four hundred that names the email field.

In the recording, Alex first tries to invite an address that already has an account, and the page says that email already signs in to Saturdaze. Then Alex tries Jordan's address again, and the page says that email already has an invite to this family. Neither attempt adds a member.

## Recap

Things to remember.

- An email in the add member dialog is the whole difference between a child and an invite.
- An invitation is single use, lasts seven days, and is stored only as a hash.
- There is no email provider yet, so the owner gets the link to share. It is shown once.
- Removing the member removes the invitation with them.
- Addresses that already sign in, or are already invited, are refused with a four oh nine.

Next, video twenty-two opens that link from the invitee's side.
