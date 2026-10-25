# Feature: The family owner is in "Who's in", tied to their account

## Goal

Today the account that creates a family (the owner) is never on the family's "Who's in" list. The list shows
only `FamilyMember` rows, and no flow creates one for the owner. The owner appears only as `ownerEmail` in the
non-owner subtitle "Only {ownerEmail} can change who's in." So an invited member such as Vanessa signs in and
does not see the person who invited her. The owner does not see themselves either, and the planner plans
without the owner's age.

Where this lives today:

- `backend/src/Saturdaze.Application/Auth/RegisterUserCommandHandler.cs` creates the `Family` with
  `OwnerUserId` and no member row. `SignInWithGoogleCommandHandler.cs` and `AcceptPlatformInvitationCommand.cs`
  do the same, and so does the first profile save in
  `backend/src/Saturdaze.Application/Families/SaveFamilyProfileCommandHandler.cs`.
- `backend/src/Saturdaze.Domain/Entities/FamilyMember.cs` already has a nullable `UserId`.
  `FamilyProfileMapper.cs` already reports a member whose `UserId` resolves to an account as
  `access: Account` with that `email`. On `/family` that row then reads "Signs in as {email}"
  (`frontend/projects/api/src/lib/api/family-presentation.ts`).
- Welcome (`frontend/projects/saturdaze/src/app/pages/welcome/`) and `/family`
  (`frontend/projects/saturdaze/src/app/pages/family/`) list members and open the member dialog
  (`frontend/projects/saturdaze/src/app/dialogs/family-member-dialog/`).

What the user should get:

1. **New families.** When an owner starts a family, by email registration, Google sign-in or accepting a
   platform invitation, they give their own first name and age, and become a "Who's in" member linked to their
   account (`UserId` = owner). On `/family`, everyone in the family sees the owner's row, for example
   "Quinntyne · Parent · 44 · Signs in as quinntyne@…". Choose the capture point that fits the existing flows
   best: the create-account form, or the first welcome step for accounts that skipped it, such as Google
   sign-in. Record the choice.
2. **Existing families whose owner is missing.** The owner can claim an existing member who has no account and
   no outstanding invite with a "This is me" action. That links the member to the owner's account. The owner
   can also add themselves through "Add a family member" with a "This is me" option, which links the new member
   to their account instead of inviting anyone. While the owner has no linked member, `/family` (owner view)
   shows a clear prompt to add or claim themselves.
3. **Backfill.** The system cannot guess names or ages, so no data migration invents members. Existing owners
   are brought in through the prompt in point 2. If an existing member's name matches the owner exactly and
   unambiguously, do not auto-link. Leave it to the owner's "This is me".

What stays unchanged:

- Invited members still join through `/accept-invite` and become `Account` members (L2-126, L2-127).
- Only the owner changes who's in (L2-124, L2-129).
- The owner's own row cannot be removed by anyone. `RemoveFamilyMemberCommand.cs` already refuses to remove
  the owner, so keep that.
- Family data stays scoped to the caller's family.
- Every account has at most one linked member, and every member has at most one account.
- Planner behaviour does not change, apart from now seeing the owner's age as a member.

## Finish the whole feature in one run. Do not stop. (CRITICAL)

- You are authorised to take this feature all the way: mocks, requirements, detailed design, incremental
  test-first implementation, docs and estimates alignment, green tests and a PR. Go through every phase and
  every slice in one continuous run. Do not pause between phases to report, ask for approval, or wait for
  "continue".
- Do not end your turn until the "Done means" list at the bottom is fully true. A partial result, a plan, or
  "the next steps would be..." is not done.
- Where the repo's instructions say "stop and ask", treat this prompt as the confirmation in advance for
  everything in scope here. Choose the simplest option that fits the existing architecture, record it (an ADR
  or the design's open-questions section, if the repo has them), and keep going.
- If a shared library, component or design asset lacks something, that is not a reason to stop. Update it
  first, as the repo's rules require, then go on.
- When a test, build or command fails, find the root cause and fix it, then go on. Never weaken a test to make
  it pass, and never skip a step quietly.
- Only stop for a real blocker you cannot resolve yourself, such as missing credentials, or an action outside
  this repo that can't be undone, such as production deploys or data changes. If that happens, finish
  everything else first, then report the blocker clearly.
- Keep track of progress (a todo list), so that nothing gets left out after context is summarised.

## Rules (read first, binding)

- Follow `AGENTS.md` exactly, especially:
  - A requirement, a detailed design and a mock come before any production code. Use the
    `implementing-incrementally` skill with ATDD: write the failing acceptance test first, for each slice.
  - Back end: integration tests against the API in `backend/tests/Saturdaze.Api.Tests/` (start from the
    `Families/` and `Auth/` folders). Tests use per-fixture SQLite or EF InMemory, never a database server
    (ADR-020). API tests run sequentially (ADR-002).
  - Front end: Playwright in `e2e/tests/` (start from `family-members.spec.ts`, `family.spec.ts`,
    `create-account.spec.ts` and `join.spec.ts`), with the Page Object Model in `e2e/pages/` (`family.page.ts`,
    `welcome.page.ts`, `create-account.page.ts`, `dialogs.page.ts`). Never put a selector in a test. Run in
    Chromium only.
  - Never write architecture tests. Do not write tests for the mocks or the design system.
  - Business rules go in handlers, not controllers. Endpoints are authenticated by default (ADR-008). Read
    ADR-007 before touching auth, and ADR-016 and ADR-019 (both files) for ownership, ownerless families and
    platform invitations.
  - The API does not apply migrations on startup. If the schema changes, for example a unique index on
    `FamilyMember.UserId`, add an EF migration in `Saturdaze.Infrastructure` and keep the seed data idempotent.
  - Frontend: `sd-*` selectors, keep the mock's BEM classes (ADR-009), Fluent v9 tokens by role (ADR-013), no
    inline forms in pages (editing opens a CDK Dialog in `frontend/projects/saturdaze/src/app/dialogs/`), and
    API services behind their contract and injection token. Each `ng-content` slot is declared once. Run
    `npm run lint` and `npm run format:check` in `frontend/`.
  - If a component's API changes, update its Storybook story folder and run `npm run build-storybook`. A new
    component also needs a perf-test scenario (ADR-014).
  - Read ADR-010 before changing visual baselines. Update baselines only for intentional design changes.
- Work through the phases below **in order**, using the repo skill each phase names.
- Copy the house style of each folder. Read the existing neighbours before you write anything new.

## Phase 1: Mocks

- Update the static design reference in `docs/mocks/pages/`. Follow `docs/mocks/README.md` and the existing
  pages.
  - `create-account.html`: the owner's first name and age fields, if you capture them there.
  - `welcome.html`: the owner's own row ("You" or the owner's name, with "Signs in as …"), and the step that
    asks for the owner's name and age when they were not captured at signup.
  - `family.html`, `family.members.html` and `family.member.html`: the owner's row as seen by the owner and by
    a non-owner. Also the owner-view prompt shown when the owner is not yet in "Who's in" ("Add yourself" or
    "This is me").
  - `dialogs.html`: the D17b add-member dialog with a "This is me" choice, a "This is me" action in the
    edit-member dialog for an unlinked member, and the edit dialog for the owner's own row (name and age
    editable, no remove, no invite).
- Keep the design system (`frontend/projects/components/stories/`, `docs/design-system/`) in step if a new
  pattern is needed. That work is design-only and gets no tests.

## Phase 2: Requirements (`engineering-requirements`)

- Under L1-037 in `docs/specs/L1.md`, state that the owner is a member of their own family. Then add new L2
  requirements to `docs/specs/L2.md`, starting at L2-183 (L2-182 is the last). Suggested split:
  - The owner is a "Who's in" member linked to their account from family creation: registration, Google
    sign-in, platform-invitation acceptance and first profile save. Cover the `GET /api/family` shape
    (`access: Account`, `email` = owner email) and what both owner and non-owner see on `/family`.
  - The owner gives their first name and age when starting a family: where it is captured, validation the same
    as members (name 1–100 characters, unique in the family case-insensitively, age 0–120), and the
    Google/invitation paths.
  - The owner claims an existing member ("This is me") or adds themselves. Cover: only the owner; only a member
    with no account and no outstanding invite; one linked member per account (409 when one already exists);
    403 `owner_only` for non-owners.
  - The owner-view prompt when the owner has no linked member (existing families), and that no migration
    invents members.
  - The owner's own row can be edited (name and age) but not removed or invited, through either the members
    endpoints or the profile save (L2-129).
- Cross-reference L2-124 to L2-129 rather than copying them, and amend their acceptance criteria where the
  owner row changes them. An example is L2-124 #4 (the subtitle text).

## Phase 3: Detailed design (`writing-software-design-documents`)

- Update `docs/detailed-designs/identity-and-access/manage-family-members/README.md`, and
  `register-family-account`, `sign-in-with-google`, `join-from-invitation` and
  `docs/detailed-designs/family-profile/onboard-new-family` where they change. Add a new feature folder only if
  the claim flow does not fit `manage-family-members`.
- Cover:
  - API shape: for example `POST /api/family/members` with `{self: true}`, and
    `POST /api/family/members/{id}/claim`, or the simplest equivalent. Also the `RegisterUserCommand` and
    Google/invitation request changes.
  - Handler changes: `FamilyOwnership`, `FamilyProfileReader` and the `SaveFamilyProfileCommandHandler`
    member-sync rules that protect the linked row.
  - The data constraint: one member per `UserId`, with a filtered unique index and a migration.
  - The frontend service contract in `frontend/projects/api/`, the page and dialog changes, sequence diagrams,
    and the security rules (owner-only, family scope).
- Record the decisions in the design's open-questions section, or as a new ADR in `docs/adr/` (ADR-023) if
  the decision is architectural: where the name and age are captured, and why there is no auto-backfill.

## Phase 4: Incremental implementation (`implementing-incrementally`, test-first)

- Plan thin vertical slices, for example:
  1. **API:** registration takes the owner's name and age and creates the linked owner member. `GET
     /api/family` shows it as `Account` with the owner's email.
  2. **API:** the same for Google sign-in, platform-invitation acceptance and the first profile save of an
     account with no family. Where no name or age is available yet, `GET /api/family` lets the client know the
     owner still needs to add themselves.
  3. **API:** the owner claims an existing unlinked, uninvited member ("This is me"), or adds themselves. Cover
     the 403, 404 and 409 rules, and the migration with the unique `UserId` index.
  4. **API:** the owner's linked row survives `PUT`/profile saves (L2-129) and cannot be removed. Its name and
     age stay editable.
  5. **UI:** the create-account form (or the first welcome step) captures name and age. The owner's row shows
     on welcome and `/family` for the owner.
  6. **UI:** a non-owner (an invited member) sees the owner's row on `/family`. This is the reported bug, end
     to end.
  7. **UI:** the owner-view prompt and the "This is me" flows in the add and edit member dialogs.
- For each slice:
  - Write the Given-When-Then criteria.
  - Write the acceptance test, following the repo's test approach and locations.
  - Run it and show that it fails for the expected reason.
  - Implement the minimum that makes it pass, and refactor while the tests are green.
  - Run the regression checks, then commit.
- Regression checks:
  - Backend: `dotnet test backend/Saturdaze.sln`.
  - Frontend, from `frontend/`: `npm run lint`, `npm run format:check`, the frontend unit specs, and
    `npm run build -- saturdaze --configuration development`.
  - Playwright: from `e2e/`, against the API started by `eng/Start-E2eApi.ps1`, run the relevant tests in
    Chromium.
  - `npm run build-storybook` if a component's API changed.
- When all slices are green, bring `docs/estimates/identity-and-access.md`, `docs/estimates/family-profile.md`
  and `docs/estimates/README.md` to their true state (`estimating-designs`). Keep the mocks, requirements and
  designs aligned with what was built.

## Deferred (not in scope)

- Letting a member other than the owner link or unlink their own account to a different row.
- Transferring family ownership.
- Changing what the planner does with ages.
- A per-member display name or avatar for the owner beyond what members already have.

## Done means

- A new owner who registers, by email, Google or a platform invitation, is in "Who's in" as
  "{name} · {Parent|Kid} · {age} · Signs in as {email}". Every account in the family sees that row.
- An existing owner who is missing from the list sees a prompt on `/family`. They can add themselves or claim
  an existing member with "This is me". After that, an invited member such as Vanessa sees them.
- The owner's row can be edited but not removed. Only the owner can claim or add themselves. An account links
  to at most one member.
- All the new and existing tests pass: `dotnet test backend/Saturdaze.sln`, the frontend lint, format and unit
  specs, and the relevant Playwright tests in Chromium.
- The mocks, `docs/specs/L1.md`, `docs/specs/L2.md`, the detailed designs, any ADR and `docs/estimates/`
  agree with the code.
- The work is on a branch with a PR to `main`, following the repo's conventions. Fetch and rebase onto `main`
  first, because another session may have pushed to it.
- Only then end the run, with a short summary of what was built, the decisions made along the way, and
  anything deferred.
