# 20 · Who owns a family, and who's in

Until now, one Saturdaze account meant one family. Whoever signed up got a family profile, and nobody else could sign in to it. A partner who wanted to check the weekend had to borrow the phone. This video starts a short series on family member sign-in, from October 2026. Each person can now sign in with their own email and password, while the family keeps one profile and one set of weekends. The person who created the family owns it and decides who is in. This first video covers ownership, the three ways a member can relate to signing in, and adding a member who will never sign in, like a young child.

## One family, several sign-ins

The requirement is L1-037. The account that creates a family owns it. The owner can invite family members by email, so each signs in with their own credentials. The owner can add members, like young children, who are planned for but never sign in. And the owner can remove members, which ends their sign-in. Only the owner changes who belongs to the family.

Everything else is shared. A member who signs in sees the same family profile, the same commitments and the same weekends as the owner. Planning still reads names and ages, exactly as before. ADR-016 records the decisions behind the design, and the next three videos follow the invite, the join and the removal.

## Recording the owner

Ownership is one nullable column on the family, `OwnerUserId`. Registration sets it to the new account, in the same save that creates the family. The first profile save of an account with no family sets it too. The user seeder sets it when it attaches the first seeded account to a household.

Families that existed before the feature needed an owner as well. The migration backfills each family with its earliest-created account, ordered by created time and then by ID, so the answer is the same on every database.

One case stays without an owner: a family that no account ever created, like the shared seeded household the API tests use. Such a family lets any of its accounts manage members. That keeps the test suite working without widening access for any family that has an owner.

## How a member signs in

Every member now has an access value, and there are exactly three. None means the member is planned for and never signs in. Invited means an invitation is outstanding. Account means the member signs in with their own email and password.

Access is derived, not stored as a flag. A member linked to a user account is Account. A member with an unaccepted invitation is Invited. Anything else is None. There is no child flag: a member added without an email is, by construction, a member who cannot sign in.

The family endpoint carries all of this. It returns whether you are the owner, the owner's email, and for each member an access value and an email, which is empty for None.

Here is the owner's view of a fresh family, the Riveras. Alex created the account, so Alex owns it. Under Who's in, the subtitle says ages shape the picks, tap a person to edit. Each row opens the member dialog, and the add row sits underneath. The Account card at the bottom shows the address Alex signs in with.

## Only the owner changes who's in

The owner check lives in one place, a small service called `FamilyOwnership`. It loads the caller's family with its members. If the family has an owner and the caller is not that owner, it throws a forbidden exception with the code `owner_only`, which the API returns as a four oh three.

That is a deliberate change from the usual rule here. Elsewhere, Saturdaze answers another family's data with a four oh four, so it never confirms what exists. A member asking to change their own family is different. They can already see every member, so a four oh three reveals nothing new, and it tells the app exactly why.

## Adding a member who won't sign in

Adding a member opens the add member dialog. It still asks for a name and an age, and now it asks one more question: will they sign in? The default is No sign-in, and the hint underneath says no invite is sent, which suits young children. Saving posts the name and age to the family members endpoint, with no email.

The server checks the owner, trims the name, and refuses a name already in the family, ignoring case, with a four oh nine. A name longer than one hundred characters, or an age outside zero to one hundred and twenty, fails validation. Otherwise it adds the member and answers two oh one Created, with the member at access None and no invite.

In the recording, Alex adds Mae, who is five. The sign-in choice stays on No sign-in. After saving, Mae appears in the list as Kid, five, with nothing about signing in, because there is nothing to say.

## Recap

Things to remember.

- The account that creates a family owns it, through `OwnerUserId`. Older families were given their earliest account.
- Every member is None, Invited or Account, and that value is derived from links, not stored.
- Only the owner changes who's in. Anyone else gets a four oh three with `owner_only`.
- Adding a member without an email creates someone who is planned for and never signs in.

The next video follows the other choice in that dialog: inviting someone to sign in.
