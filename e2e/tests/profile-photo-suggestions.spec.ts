import { test, expect } from "../fixtures/sd-test.js";
import { registerUser } from "../fixtures/auth.js";
import { stubPhotoSuggestions, stubUseSuggestedAvatar, TWO_SUGGESTIONS } from "../fixtures/photo-suggestions.js";

/**
 * D27 "Find a photo" — AI suggestions for the profile photo (L2-160). Each
 * test signs in as a freshly registered account so the seeded user's avatar
 * never changes.
 */

test.describe("Profile photo — suggestions", () => {
  test.beforeEach(async ({ request, signIn, goto, pages }) => {
    await signIn(await registerUser(request, "suggest"));
    await goto("family", { anonymous: true });
    await pages.family.waitForReady();
  });

  test("a described photo is found, previewed and saved as the avatar", async ({ page, pages }) => {
    // Traces to: L2-160 AC3, AC4
    const stub = await stubPhotoSuggestions(page);
    await stubUseSuggestedAvatar(page, stub);
    const f = pages.family;

    await f.addPhotoButton().click();
    await expect(f.dialogTitle()).toHaveText("Profile photo");
    await expect(f.findPhotosButton()).toBeDisabled();
    await f.suggestionQueryInput().fill("su");
    await expect(f.findPhotosButton()).toBeDisabled();
    await f.suggestionQueryInput().fill("sunflower field");
    await expect(f.findPhotosButton()).toBeEnabled();

    await f.findPhotosButton().click();
    await expect(f.suggestionOptions()).toHaveCount(2);
    expect(stub.searches[0]).toEqual({ target: "profile", query: "sunflower field" });
    await expect(f.dialogAction("Save")).toBeDisabled();

    await f.suggestionOption(/Farm at dusk/).check();
    await expect(f.photoPreview().locator("img")).toHaveAttribute("src", /photo-suggestions/);
    await expect(f.dialogAction("Save")).toBeEnabled();
    await f.dialogAction("Save").click();
    await expect(f.dialog()).toHaveCount(0);
    expect(stub.uses[0]).toEqual({ suggestionId: TWO_SUGGESTIONS[1].id });
    await expect(f.accountAvatarPhoto()).toHaveAttribute("src", /photo-suggestions/);
    await expect(f.accountAvatar()).toHaveText("");
  });

  test("suggestion tiles fit the dialog at phone width", async ({ page, pages }) => {
    // Traces to: L2-160 AC5
    await stubPhotoSuggestions(page);
    const f = pages.family;

    await f.addPhotoButton().click();
    await f.suggestionQueryInput().fill("sunflower field");
    await f.findPhotosButton().click();
    await expect(f.suggestionOptions()).toHaveCount(2);
    const overflow = await f.dialogBody().evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
