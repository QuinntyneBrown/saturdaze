import { test as setup, expect } from "@playwright/test";
import { LoginPage } from "../pages/login.page.js";
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
  await page.goto("/login");

  const login = new LoginPage(page);
  await login.waitForReady();
  await login.fillCredentials(AUDIT_USER.email, AUDIT_USER.password);
  await login.submit();

  await page.waitForURL("**/weekend");
  await expect(page.locator("sd-bottom-nav")).toBeVisible();

  await page.context().storageState({ path: AUTH_STATE });
});
