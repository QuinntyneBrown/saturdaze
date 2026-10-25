import { test, expect } from "../../fixtures/sd-test.js";
import { stubCalendarApi } from "../../fixtures/calendar-api.js";
import { isBaseline } from "../../fixtures/routes.js";

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

  test("'How you plan' rows", async ({ page, pages, settle }) => {
    // The mock draws a family that leaves Halloween out and keeps Sunday quiet (L2-197).
    if (!isBaseline()) {
      await page.route(/\/api\/family$/, async (route) => {
        if (route.request().method() !== "GET") return route.fallback();
        const response = await route.fetch();
        const family = { ...(await response.json()), excludedThemes: ["halloween"], quietSunday: true };
        await route.fulfill({ response, json: family });
      });
      await page.reload();
      await pages.family.waitForReady();
      await settle();
    }
    await expect(pages.family.planSection()).toHaveScreenshot("family.plan.png");
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

test.describe("Visual: Family — calendar", () => {
  // The mock draws the section not connected, on a deployment with Google
  // configured (L2-174 AC1); the stub gives the app the same state whatever
  // the API's configuration. In baseline mode it is never called.
  test("Calendar section, not connected", async ({ page, goto, pages, settle }) => {
    await stubCalendarApi(page, { googleConfigured: true });
    await goto("family");
    await pages.family.waitForReady();
    await settle();
    await expect(pages.family.calendarSection()).toHaveScreenshot("family.calendar.png");
  });
});
