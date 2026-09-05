import { test, expect } from "../../fixtures/sd-test.js";

/**
 * Family parity — pages/family.html.
 *
 * Every section is seed-derived for the Browns (members, commitments,
 * home, likes, preferences) so it is compared verbatim. The account card's
 * "Signed in since" line and the admin section's pending count are runtime
 * values and are masked. The admin section only renders for the Admin
 * role, so it is captured with the seeded admin session.
 */

test.describe("Visual: Family", () => {
  test.beforeEach(async ({ goto, pages, settle }) => {
    await goto("family");
    await pages.family.waitForReady();
    await settle();
  });

  test("page header", async ({ pages }) => {
    await expect(pages.family.pageHeader).toHaveScreenshot("family.header.png");
  });

  test("'Who's in' members", async ({ pages }) => {
    await expect(pages.family.membersSection()).toHaveScreenshot("family.members.png");
  });

  test("'Locked in every weekend' commitments", async ({ pages }) => {
    await expect(pages.family.commitmentsSection()).toHaveScreenshot("family.commitments.png");
  });

  test("Home", async ({ pages }) => {
    await expect(pages.family.homeSection()).toHaveScreenshot("family.home.png");
  });

  test("Likes and dislikes", async ({ pages }) => {
    await expect(pages.family.likesSection()).toHaveScreenshot("family.likes.png");
  });

  test("Preferences toggles", async ({ pages }) => {
    await expect(pages.family.preferencesSection()).toHaveScreenshot("family.preferences.png");
  });

  test("Account card", async ({ pages }) => {
    const f = pages.family;
    await expect(f.accountSection()).toHaveScreenshot("family.account.png", {
      mask: [f.accountSince()],
    });
  });
});

test.describe("Visual: Family — admin", () => {
  test("Admin section with the review-submissions row", async ({ goto, pages, settle }) => {
    await goto("family", { as: "admin" });
    await pages.family.waitForReady();
    await settle();
    const f = pages.family;
    await expect(f.adminSection()).toHaveScreenshot("family.admin.png", {
      mask: [f.rowSubtitle(f.reviewSubmissionsRow()), f.pendingCountChip()],
    });
  });
});
