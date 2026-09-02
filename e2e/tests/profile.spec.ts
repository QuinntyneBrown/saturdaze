import { test, expect } from "../fixtures/sd-test.js";
import { SEEDED_USER } from "../fixtures/auth.js";

/**
 * Family profile for the seeded Browns. Mutating tests restore what they
 * change so the run is repeatable without a reset.
 */

test.describe("Family profile", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("profile");
    await pages.profile.waitForComponentsReady();
    await expect(pages.profile.memberRow("Quinn")).toBeVisible();
  });

  test("top bar reads 'Family profile'", async ({ pages }) => {
    await expect(pages.profile.topBarTitle()).toHaveText("Family profile");
  });

  test("family identity block shows the seeded name and home location", async ({ pages }) => {
    await expect(pages.profile.familyName()).toBeVisible();
    await expect(pages.profile.location()).toBeVisible();
  });

  test("members section lists all four Browns + add row", async ({ pages }) => {
    for (const name of ["Quinn", "Sara", "Eli", "Mae"]) await expect(pages.profile.memberRow(name)).toBeVisible();
    await expect(pages.profile.addMemberRow()).toBeVisible();
  });

  test("each member carries an avatar with the rotation tone", async ({ pages }) => {
    await expect(pages.profile.memberAvatar("Quinn")).toHaveAttribute("tone", "primary");
    await expect(pages.profile.memberAvatar("Sara")).toHaveAttribute("tone", "leaf");
    await expect(pages.profile.memberAvatar("Eli")).toHaveAttribute("tone", "sky");
    await expect(pages.profile.memberAvatar("Mae")).toHaveAttribute("tone", "sun");
  });

  test("recurring commitments section lists 3 commitments + add row", async ({ pages }) => {
    await expect(pages.profile.commitmentRow("Swim lessons")).toBeVisible();
    await expect(pages.profile.commitmentRow("Church")).toBeVisible();
    await expect(pages.profile.commitmentRow("Workout window")).toBeVisible();
    await expect(pages.profile.addCommitmentRow()).toBeVisible();
    await expect(pages.profile.commitmentsSection().locator('sd-chip[tone="accent"]')).toHaveCount(3);
  });

  test("likes section lists 6 leaf chips and 2 warn chips", async ({ pages }) => {
    await expect(pages.profile.likeChips()).toHaveCount(6);
    await expect(pages.profile.dislikeChips()).toHaveCount(2);
  });

  test("preferences: three keyed toggles — Budget off, Try new off, Friday preview on", async ({ pages }) => {
    const all = pages.profile.toggles();
    await expect(all).toHaveCount(3);
    await expect(all.nth(0)).toHaveAttribute("aria-label", "Budget is a factor");
    await expect(all.nth(1)).toHaveAttribute("aria-label", "Try something new each weekend");
    await expect(all.nth(2)).toHaveAttribute("aria-label", "Friday preview notifications");
    await expect(all.nth(0)).not.toHaveAttribute("checked", "");
    await expect(all.nth(1)).not.toHaveAttribute("checked", "");
    await expect(all.nth(2)).toHaveAttribute("checked", "");
  });

  test("a toggle persists through the API and survives a reload", async ({ pages, page }) => {
    const tryNew = () => pages.profile.toggles().nth(1);

    let saved = page.waitForResponse((r) => r.url().endsWith("/api/family") && r.request().method() === "PUT");
    await tryNew().click();
    expect((await saved).status()).toBe(200);
    await expect(tryNew()).toHaveAttribute("checked", "");

    await page.reload();
    await pages.profile.waitForComponentsReady();
    await expect(pages.profile.memberRow("Quinn")).toBeVisible();
    await expect(tryNew()).toHaveAttribute("checked", "");

    saved = page.waitForResponse((r) => r.url().endsWith("/api/family") && r.request().method() === "PUT");
    await tryNew().click();
    expect((await saved).status()).toBe(200);
    await expect(tryNew()).not.toHaveAttribute("checked", "");
  });

  test("deleting a member asks through a dialog and cancel keeps them", async ({ pages, page }) => {
    await pages.profile.memberRow("Mae").locator('button[aria-label="Delete family member"]').click();
    const dialog = page.locator('sd-dialog[title="Delete Mae?"]');
    await expect(dialog).toBeVisible();
    await dialog.locator('sd-button[variant="secondary"] button').click();
    await expect(dialog).not.toBeVisible();
    await expect(pages.profile.memberRow("Mae")).toBeVisible();
  });

  test("the add-member row opens the member dialog", async ({ pages, page }) => {
    await pages.profile.addMemberRow().click();
    const dialog = page.locator("sd-dialog");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });

  test("account section shows the signed-in email and no admin tools for a regular user", async ({ pages, page }) => {
    await expect(pages.profile.accountEmail()).toHaveText(SEEDED_USER.email);
    await expect(page.locator('sd-section[title="Admin tools"]')).toHaveCount(0);
  });

  test("admin sees the moderation shortcut", async ({ goto, pages, page }) => {
    await goto("profile", { as: "admin" });
    await pages.profile.waitForComponentsReady();
    await expect(page.locator('sd-section[title="Admin tools"]')).toBeVisible();
  });

  test("bottom nav active=profile", async ({ pages }) => {
    await expect(pages.profile.activeNavKey()).toHaveAttribute("href", /\/profile$/);
  });
});
