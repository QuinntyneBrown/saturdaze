import { test as setup, expect } from "@playwright/test";
import { SignInPage } from "../pages/sign-in.page.js";
import { AUTH_STATE, AUDIT_USER } from "./constants.js";

/**
 * One real UI sign-in per audit run; the five viewport projects reuse the
 * saved storageState. Remember-me defaults to `true`, so the token lands in
 * `localStorage` (`sd.auth.token`) — which `storageState` captures — and
 * `provideAppInitializer` awaits `rehydrate()` before guards run, so a
 * direct `goto()` to any guarded route is deterministic afterwards.
 *
 * Regenerated fresh each run, so a stale `expiresUtc` can never bite.
 */
setup("sign in and save session", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/sign-in");

  const signIn = new SignInPage(page);
  await signIn.waitForReady();
  await signIn.signIn(AUDIT_USER.email, AUDIT_USER.password);

  await page.waitForURL("**/weekend");
  await expect(page.locator('body[data-page="weekend"]')).toBeAttached();
  await expect(page.locator(".bottom-nav")).toBeVisible();

  await page.context().storageState({ path: AUTH_STATE });
});
