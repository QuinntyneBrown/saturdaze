# 22 · Joining from an invite link

In the last video, Alex invited Jordan and got a link to share. This video is Jordan's side. Jordan opens the link on a phone, chooses a password, and lands in the Riveras' weekend, signed in. Later, Jordan signs in like anyone else, with their own email and password. Then we look at the family page as Jordan sees it, because a member who is not the owner sees who's in, but cannot change it.

## Opening the link

The link points at the accept invite page in the family app. Like the verify email page, it has no route guard. People reach it from a message, signed in or not, and whoever opens it is about to become a new account.

The page reads the token from the query string and asks the server what the invite is for. That call, and the one that accepts the invite, are two new anonymous auth endpoints, because the invitee has no account yet. The anonymous list in L2-008 grew by exactly those two.

On the server, a small service called `InvitationResolver` does the checking for both. It hashes the token it receives and looks the hash up. No invitation, or one already accepted, is token invalid. A removed member's invitation is gone with the member, so it is token invalid too. An invitation past its seven days is token expired. A usable one comes back with the family name, the invited email, and who sent it.

## Choosing a password

A usable invite shows the join card. The title reads join the Riveras on Saturdaze. The subtitle names who invited you, and asks you to choose a password to sign in with your own account. The email is shown read-only: the invite is for that address, and nobody else. Below it are a password, with the strength meter from the other password screens, and a confirmation.

Joining posts the token and the password to the accept invitation endpoint. The handler resolves the invitation again, so a link used in another tab in the meantime fails cleanly. A password shorter than eight characters is weak password, and the invite stays usable. An address that gained an account in the meantime is email in use.

Then it does four things in one save. It creates the user, in the inviting family, with the email already marked verified, because only the invited address could have received the link. It links the member to that user, so the member's access becomes Account. It stamps the invitation as accepted. And it issues a refresh token through the same issuer that registration and sign-in use. The response is two oh one, with tokens, exactly like a sign-up, and the app stores the session the same way and opens the weekend.

Here it is on a phone. The card names the family and Alex as the inviter. The email is filled in and cannot be changed. Jordan types a password twice and chooses join the family. A moment later, Jordan is on this weekend's plan for the Riveras: the same weekend Alex sees.

## A link that no longer works

Every unusable link ends in the same place. Used, removed or more than seven days old, the page says this invite no longer works, and asks you to get a new link from whoever invited you. A sign in button sits underneath, for someone who already joined and simply opened the link again.

That is what the recording shows. Jordan opens the same link a second time, and gets the invalid state, because the invitation is already accepted.

## Signing in as themselves

From now on Jordan is an ordinary account. The sign-in form, remember me, forgot password and sign-out all work the same way they do for Alex. Nothing about the session says invited: the access token carries Jordan's own ID and the family's ID, and every family-scoped endpoint finds the Riveras through Jordan's own account.

In the recording, Jordan signs in with their own email and password on a laptop, and lands on the Riveras' weekend.

## The member view

The family page asks the server whether you are the owner. For Jordan, the answer is no, and three things change.

The subtitle under who's in names the owner: only Alex's address can change who's in. The rows are plain rows, without the chevron, so tapping a person does nothing. And the add a family member row is gone. Jordan's own row says signs in as Jordan's address.

Everything else on the page still works for Jordan. Home, likes and dislikes, preferences and commitments are shared, and any member can change them. The server enforces the line. When a member who is not the owner saves the profile, the handler compares the member list in the request with the one stored, by name and age. If anything is added, removed, renamed or re-aged, the save fails with four oh three, owner only. If the list is unchanged, the rest of the profile saves normally.

In the recording, Jordan's family page names Alex as the one who changes who's in. Jordan's own row says signs in, with Jordan's address, while Alex, Eli and Mae show only their roles and ages. Tapping Mae does nothing, because the row is not a button. There is no add row under the list. And the Account card at the bottom of the page shows Jordan's own address, because Jordan is signed in as Jordan, not as Alex.

## Recap

Things to remember.

- The accept invite page has no guard, and its two endpoints are anonymous: one previews, one accepts.
- Accepting creates a verified account in the inviting family, links the member, and signs them in like a sign-up.
- Used, removed and expired invites all end in this invite no longer works.
- After joining, a member signs in like anyone else, with their own email and password.
- Members who are not the owner see who's in read-only, and the server refuses their member-list changes with four oh three.

The last video in the series removes members, and shows that their access really ends.
