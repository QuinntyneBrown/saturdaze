import { test, expect } from "../fixtures/sd-test.js";

test.describe("Family profile", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("profile");
    await pages.profile.waitForComponentsReady();
  });

  test("top bar reads 'Family profile'", async ({ pages }) => {
    await expect(pages.profile.topBarTitle()).toHaveText("Family profile");
  });

  test("family identity block", async ({ pages }) => {
    await expect(pages.profile.familyName()).toBeVisible();
    await expect(pages.profile.location()).toBeVisible();
  });

  test("members section lists all four Browns + add row", async ({ pages }) => {
    await expect(pages.profile.memberRow("Quinn")).toBeVisible();
    await expect(pages.profile.memberRow("Sara")).toBeVisible();
    await expect(pages.profile.memberRow("Eli")).toBeVisible();
    await expect(pages.profile.memberRow("Mae")).toBeVisible();
    await expect(pages.profile.addMemberRow()).toBeVisible();
  });

  test("each member carries an avatar with the correct tone", async ({ pages }) => {
    await expect(pages.profile.memberAvatar("Quinn")).toHaveAttribute(
      "tone",
      "primary"
    );
    await expect(pages.profile.memberAvatar("Sara")).toHaveAttribute(
      "tone",
      "leaf"
    );
    await expect(pages.profile.memberAvatar("Eli")).toHaveAttribute(
      "tone",
      "sky"
    );
    await expect(pages.profile.memberAvatar("Mae")).toHaveAttribute(
      "tone",
      "sun"
    );
  });

  test("recurring commitments section lists 3 commitments + add row", async ({ pages }) => {
    await expect(pages.profile.commitmentRow("Swim lessons")).toBeVisible();
    await expect(pages.profile.commitmentRow("Church")).toBeVisible();
    await expect(pages.profile.commitmentRow("Workout window")).toBeVisible();
    await expect(pages.profile.addCommitmentRow()).toBeVisible();

    // Each commitment has a 'Locked' accent chip.
    await expect(
      pages.profile.commitmentsSection().locator('sd-chip[tone="accent"]')
    ).toHaveCount(3);
  });

  test("likes section lists 6 leaf chips and 2 warn chips", async ({ pages }) => {
    await expect(pages.profile.likeChips()).toHaveCount(6);
    await expect(pages.profile.dislikeChips()).toHaveCount(2);
  });

  test("preferences section has 3 toggles — 'Budget' off, others on", async ({ pages }) => {
    await expect(pages.profile.toggles()).toHaveCount(3);
    const all = pages.profile.toggles();
    await expect(all.nth(0)).not.toHaveAttribute("checked", /.*/);
    await expect(all.nth(1)).toHaveAttribute("checked", "");
    await expect(all.nth(2)).toHaveAttribute("checked", "");
  });

  test("bottom nav active=profile", async ({ pages }) => {
    await expect(pages.profile.activeNavKey()).toHaveAttribute(
      "href",
      /profile\.html$/
    );
  });
});
