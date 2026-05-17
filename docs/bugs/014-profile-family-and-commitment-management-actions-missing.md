# Bug 014 — Profile family and commitment management actions are missing

## Symptom

On `http://127.0.0.1:4201/profile`, the `Add a family member` action does not
work. The page also does not provide a working way to edit or delete existing
family members.

The `Add a commitment` action does not work either. The page also does not
provide a working way to edit or delete existing commitments.

## Impact

The Profile page cannot be used to maintain the household setup. Users are
stuck with the seeded family members and commitments, even though those values
drive planning, preferences, and weekend availability.

This blocks realistic profile management workflows:

- Add, edit, and delete family members.
- Add, edit, and delete commitments.
- Persist the changed profile data so other pages and future plans use it.

## Fix

Implement working Profile page management flows for family members and
commitments.

Expected behavior:

1. `Add a family member` opens an input flow, validates required fields, saves
   the new member, and updates the displayed list.
2. Existing family members can be edited and deleted.
3. `Add a commitment` opens an input flow, validates required fields, saves the
   new commitment, and updates the displayed list.
4. Existing commitments can be edited and deleted.
5. Changes persist through the backend API and survive page refresh.

Verify both desktop and mobile layouts, including cancel, validation, save, and
delete-confirmation states.

## Status

- Logged: 2026-05-16
- Reported from: `http://127.0.0.1:4201/profile`
- Status: Fixed
- Fixed: 2026-05-16
- Verification: Playwright smoke confirmed add, edit, delete, and reload
  persistence for both family members and recurring commitments on
  `http://127.0.0.1:4201/profile`.
