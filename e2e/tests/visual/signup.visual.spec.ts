import { test, expect } from "../../fixtures/sd-test.js";

test.describe("Visual: Signup", () => {
  test.beforeEach(async ({ goto, pages, settle }) => {
    await goto("signup");
    await pages.signup.waitForReady();
    await settle();
  });

  test("matches the mock pixel-for-pixel @full-page", async ({ page }) => {
    await expect(page).toHaveScreenshot("signup.full.png", { fullPage: true });
  });

  test("auth card matches the mock", async ({ pages }) => {
    await expect(pages.signup.authCard).toHaveScreenshot("signup.card.png");
  });
});
