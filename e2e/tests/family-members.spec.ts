import { test, expect } from "../fixtures/sd-test.js";
import { Credentials, registerThrowaway } from "../fixtures/auth.js";
import { AcceptInvitePage } from "../pages/accept-invite.page.js";
import { FamilyPage } from "../pages/family.page.js";

/**
 * Family members who sign in (L1-037) — a throwaway owner adds a member who
 * will not sign in (D17b), invites one who will (D17b → D30), the invitee
 * joins on /accept-invite with their own password and sees the member view
 * of Family, and the owner removes them (D17 → D21).
 */

const PASSWORD = "Lavender-17-May";

function inviteeEmail(): string {
  return `invitee-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

test.describe("Family members who sign in", () => {
  let owner: Credentials;

  test.beforeEach(async ({ request, signIn, goto, pages }) => {
    owner = await registerThrowaway(request, "owner");
    await signIn(owner);
    await goto("family", { anonymous: true });
    await pages.family.waitForReady();
  });

  test("the owner adds a member who will not sign in", async ({ pages }) => {
    // Traces to: L2-125 #5, L2-124 #4, L2-010 #3
    const f = pages.family;
    await expect(f.membersSubtitle()).toHaveText("Ages shape the picks. Tap a person to edit.");

    await f.addMemberRow().click();
    await expect(f.signInChoice("No sign-in")).toBeChecked();
    await f.dialogAction("Cancel").click();

    const sent = await f.addMember({ name: "Mae", age: 5 });

    expect(sent).toEqual({ name: "Mae", age: 5, email: null });
    await expect(f.dialog()).toHaveCount(0);
    await expect(f.rowSubtitle(f.memberRow("Mae"))).toHaveText("Kid · 5");
  });

  test("the owner invites a member and shares the link from D30", async ({ pages }) => {
    // Traces to: L2-126 #6
    const f = pages.family;
    const email = inviteeEmail();

    await f.addMemberRow().click();
    await f.signInChoice("Invite to sign in").check();
    await expect(f.dialogField("Email")).toBeVisible();
    await expect(f.dialogAction("Send invite")).toBeDisabled();
    await f.dialogAction("Cancel").click();

    const sent = await f.addMember({ name: "Sara", age: 36, inviteEmail: email });

    expect(sent).toEqual({ name: "Sara", age: 36, email });
    await expect(f.dialogTitle()).toHaveText("Invite ready for Sara");
    await expect(f.inviteLink()).toContainText("/accept-invite?token=");
    await f.dialogAction("Done").click();
    await expect(f.dialog()).toHaveCount(0);
    await expect(f.rowSubtitle(f.memberRow("Sara"))).toHaveText(`Parent · 36 · Invite sent to ${email}`);
  });

  test("an invited member joins, sees the member view, and the owner removes them", async ({
    browser,
    pages,
  }) => {
    // Traces to: L2-127 #6, L2-124 #4, L2-128 #7
    const f = pages.family;
    const email = inviteeEmail();
    await f.addMember({ name: "Sara", age: 36, inviteEmail: email });
    const link = (await f.inviteLink().textContent())!.trim();
    await f.dialogAction("Done").click();

    const inviteeContext = await browser.newContext();
    const inviteePage = await inviteeContext.newPage();
    const invite = new AcceptInvitePage(inviteePage);
    await invite.open(link);
    await expect(invite.cardTitle()).toHaveText("Join E2E Family on Saturdaze");
    await expect(invite.emailField()).toHaveValue(email);
    await invite.join(PASSWORD);
    await expect(inviteePage).toHaveURL(/\/weekend$/);

    const memberFamily = new FamilyPage(inviteePage);
    await memberFamily.open();
    await expect(memberFamily.membersSubtitle()).toHaveText(
      `Ages shape the picks. Only ${owner.email} can change who's in.`,
    );
    await expect(memberFamily.addMemberRow()).toHaveCount(0);
    await expect(memberFamily.actionableMemberRows()).toHaveCount(0);
    await expect(memberFamily.rowSubtitle(memberFamily.memberRow("Sara"))).toHaveText(
      `Parent · 36 · Signs in as ${email}`,
    );
    await inviteeContext.close();

    await f.open();
    await f.startRemoving("Sara");
    await expect(f.dialogSubtitle()).toHaveText("Sara will be signed out and will no longer be able to sign in.");
    const deletes = await f.confirmRemoval();
    expect(deletes).toHaveLength(1);
    await expect(f.memberRow("Sara")).toHaveCount(0);
  });

  test("an unusable invite link says so", async ({ browser }) => {
    // Traces to: L2-127 #6
    const context = await browser.newContext();
    const page = await context.newPage();
    const invite = new AcceptInvitePage(page);
    await invite.open("/accept-invite?token=not-a-real-invite");
    await expect(invite.cardTitle()).toHaveText("This invite no longer works");
    await expect(invite.signInLink()).toBeVisible();
    await context.close();
  });
});
