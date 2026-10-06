import path from "node:path";

import { test, expect, isPhone } from "../fixtures/sd-test.js";
import { registerUser } from "../fixtures/auth.js";

/**
 * L2-087 — a profile photo replaces the initials avatar in the Family
 * Account card and the top bar. Each test signs in as a freshly registered
 * account so the seeded user's avatar never changes.
 */

const PHOTO = path.join(__dirname, "..", "fixtures", "files", "profile-photo.png");
const AVATAR_URL = /\/api\/avatars\/[0-9a-f]{32}$/;

test.describe("Profile photo", () => {
  test.beforeEach(async ({ request, signIn, goto, pages }) => {
    await signIn(await registerUser(request, "photo"));
    // Already signed in as the new account; skip the fixture's default sign-in.
    await goto("family", { anonymous: true });
    await pages.family.waitForReady();
  });

  test("adding a photo replaces the Account card initial and survives a reload", async ({ page, pages }) => {
    const f = pages.family;
    await expect(f.accountAvatar()).toHaveText("P");
    await expect(f.accountAvatarPhoto()).toHaveCount(0);

    await f.addPhotoButton().click();
    await expect(f.dialogTitle()).toHaveText("Profile photo");
    await expect(f.dialogAction("Save")).toBeDisabled();
    await f.choosePhoto(PHOTO);
    await expect(f.photoPreview().locator("img")).toBeVisible();
    await f.dialogAction("Save").click();
    await expect(f.dialog()).toHaveCount(0);

    await expect(f.accountAvatarPhoto()).toHaveAttribute("src", AVATAR_URL);
    await expect(f.accountAvatar()).toHaveText("");
    await expect(f.changePhotoButton()).toBeVisible();

    await page.reload();
    await f.waitForReady();
    await expect(f.accountAvatarPhoto()).toHaveAttribute("src", AVATAR_URL);
  });

  test("the top-bar avatar shows the photo instead of the initial (≥720)", async ({ pages }, testInfo) => {
    test.skip(isPhone(testInfo), "the top bar (and its avatar) is display:none below 720px");
    const f = pages.family;
    await expect(f.accountMenuButton()).toHaveText("P");

    await f.addPhotoButton().click();
    await f.choosePhoto(PHOTO);
    await f.dialogAction("Save").click();

    await expect(f.accountMenuPhoto()).toHaveAttribute("src", AVATAR_URL);
    await expect(f.accountMenuButton()).toHaveText("");
  });
});
