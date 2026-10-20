import { Request } from "@playwright/test";
import { test, expect } from "../../fixtures/sd-test.js";
import { apiLogin, SEEDED_ADMIN, sendInvitations, uniqueEmail } from "../../fixtures/auth.js";

/**
 * Invitations (A8): an administrator invites families to Saturdaze (L2-157)
 * and sees and revokes what was sent (L2-158). Addresses are minted per test
 * so a re-run never collides with an earlier invite.
 */

test.describe("Admin invitations", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("adminInvitations");
    await pages.adminInvitations.waitForScreen("invitations");
  });

  test("Invitations is a destination in the admin navigation and the screen fits every width", async ({
    page,
    pages,
  }) => {
    // Traces to: L2-158 AC4
    const a = pages.adminInvitations;
    await expect(a.adminNavLink("invitations")).toHaveAttribute("aria-current", "page");
    for (const width of [390, 820, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await a.hasHorizontalOverflow(), `${width}px`).toBe(false);
    }
  });

  test("sending to two addresses lists both as Invite sent", async ({ page, pages }) => {
    // Traces to: L2-157 AC9
    const a = pages.adminInvitations;
    const [ana, ben] = [uniqueEmail("ana"), uniqueEmail("ben")];
    const posts: Request[] = [];
    page.on("request", (r) => {
      if (r.method() === "POST" && r.url().endsWith("/api/admin/invitations")) posts.push(r);
    });

    await a.inviteFamiliesButton().click();
    await expect(a.inviteDialog()).toBeVisible();
    await a.enterEmails([ana, ben]);
    await expect(a.emailChips()).toHaveCount(2);
    await a.sendInvitesButton().click();

    await expect(a.inviteDialog()).toHaveCount(0);
    expect(posts).toHaveLength(1);
    expect((posts[0].postDataJSON() as { emails: string[] }).emails).toEqual([ana, ben]);

    const topTwo = await a.inviteRows().locator(".list__title").allTextContents();
    expect(topTwo.slice(0, 2).sort()).toEqual([ana, ben].sort());
    for (const email of [ana, ben]) {
      const row = a.inviteRow(email);
      await expect(a.inviteRowStatus(row)).toHaveText("Invite sent");
      await expect(a.inviteRowMeta(row)).toContainText("Expires in 14 days");
      await expect(a.inviteRowSample(row)).toHaveText("No sample weekend");
    }
  });

  test("nothing is sent without an address", async ({ page, pages }) => {
    // Traces to: L2-157 AC10
    const a = pages.adminInvitations;
    let posts = 0;
    page.on("request", (r) => {
      if (r.method() === "POST" && r.url().endsWith("/api/admin/invitations")) posts++;
    });

    await a.inviteFamiliesButton().click();
    await a.sendInvitesButton().click();

    await expect(a.inviteDialogError()).toContainText("Enter at least one email address");
    await expect(a.inviteDialog()).toBeVisible();
    expect(posts).toBe(0);
  });

  test("revoking a pending invite through the confirmation", async ({ page, pages, request }) => {
    // Traces to: L2-158 AC5
    const a = pages.adminInvitations;
    const admin = await apiLogin(request, SEEDED_ADMIN);
    const [sent] = await sendInvitations(request, admin, [uniqueEmail("revoke")]);
    const deletes: Request[] = [];
    page.on("request", (r) => {
      if (r.method() === "DELETE" && r.url().includes("/api/admin/invitations/")) deletes.push(r);
    });
    await page.reload();
    await a.waitForScreen("invitations");

    const row = a.inviteRow(sent.email);
    await expect(a.inviteRowStatus(row)).toHaveText("Invite sent");
    await a.revokeButton(row).click();
    await expect(a.revokeDialog()).toContainText("Revoke this invite?");
    await a.confirmRevokeButton().click();

    await expect(a.inviteRowStatus(row)).toHaveText("Revoked");
    expect(deletes).toHaveLength(1);
    expect(deletes[0].url()).toContain(`/api/admin/invitations/${sent.id}`);
    await expect(a.revokeButton(row)).toHaveCount(0);
  });

  test("with nothing sent the screen offers the first invite", async ({ page, pages }) => {
    // Traces to: L2-158 AC6
    const a = pages.adminInvitations;
    await page.route("**/api/admin/invitations", (route) => route.fulfill({ json: [] }));
    await page.route("**/api/admin/prospects", (route) => route.fulfill({ json: [] }));
    await page.reload();
    await a.waitForScreen("invitations");

    await expect(a.emptyTitle()).toHaveText("No invites yet");
    await expect(a.emptyInviteButton()).toBeVisible();
  });
});
