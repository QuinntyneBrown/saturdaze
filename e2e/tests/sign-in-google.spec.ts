// Traces to: L2-158
import { Route } from "@playwright/test";
import { test, expect } from "../fixtures/sd-test.js";
import { apiLogin, registerThrowaway } from "../fixtures/auth.js";
import { E2E_GOOGLE_CREDENTIAL } from "../fixtures/google-identity.js";

/**
 * Sign in with Google — the browser half (L2-158). Google Identity Services
 * is the fixture's fake (`fixtures/google-identity.ts`); `POST /api/auth/google`
 * is answered from a route stub, because no spec can obtain a real Google
 * credential, and the API's own rules are covered by `GoogleSignInTests`.
 * The stub's token pair comes from a real `POST /api/auth/login`, so
 * everything after the button (store, storage tier, guards, navigation)
 * runs against the real session machinery.
 *
 * AC7 (no client id configured, nothing rendered) is a compile-time
 * environment choice and is covered by the page's Vitest spec.
 */

const GOOGLE_ROUTE = "**/api/auth/google";

/** The wire shape `AuthService` expects, built from a real login. */
async function realPair(request: Parameters<typeof apiLogin>[0]): Promise<unknown> {
  const creds = await registerThrowaway(request, "e2e-google");
  const session = await apiLogin(request, creds);
  return {
    token: {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      accessTokenExpiresAtUtc: session.expiresUtc,
      tokenType: "Bearer",
    },
    user: session.user,
  };
}

/** The API's `{ code, message }` error shape; the message is always non-empty on the wire. */
const authError = (status: number, code: string) => (route: Route) =>
  route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify({ code, message: `stubbed ${code}` }),
  });

test.describe("Sign in with Google", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("signIn");
    await pages.signIn.waitForReady();
  });

  // Traces to: L2-158 AC1, AC8
  test("the divider and Google's button sit between Sign in and New here, spanning the card", async ({ page, pages }) => {
    const s = pages.signIn;
    await expect(s.orDivider()).toBeVisible();
    await expect(s.orDivider()).toHaveText("or");
    await expect(s.googleButton()).toBeVisible();

    const order = await s.card().evaluate((card) => {
      const nodes = Array.from(card.querySelectorAll('button, [role="separator"], .auth-card__alt'));
      return nodes.map((n) => (n.getAttribute("role") === "separator" ? "or" : n.textContent?.trim() ?? ""));
    });
    expect(order).toEqual(["Sign in", "or", "Continue with Google", expect.stringContaining("New here?")]);

    const host = await s.googleHost().boundingBox();
    const form = await s.cardForm().boundingBox();
    expect(host).not.toBeNull();
    expect(form).not.toBeNull();
    expect(Math.abs(host!.width - form!.width)).toBeLessThanOrEqual(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  // Traces to: L2-158 AC1
  test("still fits at 320 px", async ({ page, pages }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await expect(pages.signIn.googleButton()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  // Traces to: L2-158 AC8
  test("the button is reachable from the keyboard", async ({ page, pages }) => {
    const s = pages.signIn;
    await s.signInButton().focus();
    await page.keyboard.press("Tab");
    await expect(s.googleButton()).toBeFocused();
  });

  // Traces to: L2-158 AC2
  test("a credential the API accepts lands on /weekend with a remembered session", async ({ page, pages, request }) => {
    const pair = await realPair(request);
    let body: unknown = null;
    await page.route(GOOGLE_ROUTE, async (route) => {
      body = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(pair) });
    });

    await expect(pages.signIn.rememberToggle()).toBeChecked();
    await pages.signIn.googleButton().click();

    await page.waitForURL("**/weekend");
    expect(body).toEqual({ credential: E2E_GOOGLE_CREDENTIAL });
    await expect(page.locator('body[data-page="weekend"]')).toBeAttached();
    expect(await page.evaluate(() => localStorage.getItem("sd.auth.token"))).toBeTruthy();
    expect(await page.evaluate(() => sessionStorage.getItem("sd.auth.token"))).toBeNull();

    await page.reload();
    await pages.weekend.waitForReady();
    expect(new URL(page.url()).pathname).toBe("/weekend");
  });

  // Traces to: L2-158 AC3
  test("remember me off keeps a Google session in sessionStorage", async ({ page, pages, request }) => {
    const pair = await realPair(request);
    await page.route(GOOGLE_ROUTE, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(pair) }),
    );

    await pages.signIn.rememberToggle().click();
    await expect(pages.signIn.rememberToggle()).not.toBeChecked();
    await pages.signIn.googleButton().click();

    await page.waitForURL("**/weekend");
    expect(await page.evaluate(() => localStorage.getItem("sd.auth.token"))).toBeNull();
    expect(await page.evaluate(() => sessionStorage.getItem("sd.auth.token"))).toBeTruthy();
  });

  // Traces to: L2-158 AC4
  test("honours a same-origin returnUrl", async ({ page, pages, request }) => {
    const pair = await realPair(request);
    await page.goto("/sign-in?returnUrl=%2Fpast");
    await pages.signIn.waitForReady();
    await page.route(GOOGLE_ROUTE, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(pair) }),
    );

    await pages.signIn.googleButton().click();

    await page.waitForURL("**/past");
    await pages.past.waitForReady();
  });

  // Traces to: L2-158 AC5
  test("an unverified existing account is told to sign in with its password first", async ({ page, pages }) => {
    const s = pages.signIn;
    await page.route(GOOGLE_ROUTE, authError(409, "email_unverified"));

    await s.googleButton().click();

    await expect(s.errorBanner()).toHaveText(
      "That email already has a Saturdaze account that hasn't verified its email. Sign in with your password to verify it first.",
    );
    await expect(s.errorBanner()).toHaveAttribute("role", "alert");
    expect(new URL(page.url()).pathname).toBe("/sign-in");
    expect(await page.evaluate(() => localStorage.getItem("sd.auth.token"))).toBeNull();
    expect(await page.evaluate(() => sessionStorage.getItem("sd.auth.token"))).toBeNull();
    await expect(s.emailInput()).not.toHaveAttribute("aria-invalid", "true");
    await expect(s.passwordInput()).not.toHaveAttribute("aria-invalid", "true");
  });

  // Traces to: L2-158 AC6
  test("a refused credential asks to try again", async ({ page, pages }) => {
    const s = pages.signIn;
    await page.route(GOOGLE_ROUTE, authError(401, "google_token_invalid"));

    await s.googleButton().click();

    await expect(s.errorBanner()).toHaveText("Google sign-in didn't complete. Try again.");
    expect(new URL(page.url()).pathname).toBe("/sign-in");
    await expect(s.googleButton()).toBeVisible();
  });
});
