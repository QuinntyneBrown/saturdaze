// Traces to: L2-182
import { Route } from "@playwright/test";
import { test, expect } from "../../fixtures/sd-test.js";
import { SEEDED_ADMIN, apiLogin } from "../../fixtures/auth.js";
import { E2E_GOOGLE_CREDENTIAL } from "../../fixtures/google-identity.js";

/**
 * Sign in to Saturdaze Admin with Google (L2-182). Google Identity Services
 * is the fixture's fake (`fixtures/google-identity.ts`); `POST /api/auth/google`
 * is answered from a route stub with a pair minted by a real
 * `POST /api/auth/login` as the seeded administrator, so everything after
 * the button (store, storage tier, the admin gate, navigation) runs for
 * real. The API's own rules are covered by `GoogleSignInTests` (L2-163).
 */

const GOOGLE_ROUTE = "**/api/auth/google";

async function adminPair(request: Parameters<typeof apiLogin>[0]): Promise<unknown> {
  const session = await apiLogin(request, SEEDED_ADMIN);
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

const authError = (status: number, code: string) => (route: Route) =>
  route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify({ code, message: `stubbed ${code}` }),
  });

const noHorizontalScroll = (page: import("@playwright/test").Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

test.describe("Admin sign in with Google", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("adminSignIn", { anonymous: true });
    await pages.adminSignIn.waitForScreen("sign-in");
  });

  // Traces to: L2-182 AC1
  test("the divider and Google's button follow Sign in and span the form", async ({ page, pages }) => {
    const s = pages.adminSignIn;
    await expect(s.orDivider()).toHaveText("or");
    await expect(s.googleButton()).toBeVisible();

    const order = await s.card().evaluate((card) =>
      Array.from(card.querySelectorAll('button, [role="separator"]')).map((n) =>
        n.getAttribute("role") === "separator" ? "or" : (n.textContent?.trim() ?? ""),
      ),
    );
    expect(order).toEqual(["Sign in", "or", "Continue with Google"]);

    const host = await s.googleHost().boundingBox();
    const form = await s.cardForm().boundingBox();
    expect(Math.abs(host!.width - form!.width)).toBeLessThanOrEqual(1);
    expect(await noHorizontalScroll(page)).toBe(true);

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(s.googleButton()).toBeVisible();
    expect(await noHorizontalScroll(page)).toBe(true);
  });

  // Traces to: L2-182 AC2
  test("an accepted credential lands on Photo health with a remembered session", async ({ page, pages, request }) => {
    const pair = await adminPair(request);
    let body: unknown = null;
    await page.route(GOOGLE_ROUTE, async (route) => {
      body = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(pair) });
    });

    await expect(pages.adminSignIn.rememberToggle()).toBeChecked();
    await pages.adminSignIn.googleButton().click();

    await pages.adminHealth.waitForScreen("health");
    expect(new URL(page.url()).pathname).toBe("/");
    expect(body).toEqual({ credential: E2E_GOOGLE_CREDENTIAL });
    expect(await page.evaluate(() => localStorage.getItem("sd.auth.token"))).toBeTruthy();
    expect(await page.evaluate(() => sessionStorage.getItem("sd.auth.token"))).toBeNull();

    await page.reload();
    await pages.adminHealth.waitForScreen("health");
    expect(new URL(page.url()).pathname).toBe("/");
  });

  // Traces to: L2-182 AC3
  test("honours a same-origin returnUrl", async ({ page, pages, request }) => {
    const pair = await adminPair(request);
    await page.goto("/sign-in?returnUrl=%2Fplaces");
    await pages.adminSignIn.waitForScreen("sign-in");
    await page.route(GOOGLE_ROUTE, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(pair) }),
    );

    await pages.adminSignIn.googleButton().click();

    await page.waitForURL("**/places");
    await pages.adminPlaces.waitForScreen("places");
  });

  // Traces to: L2-182 AC4
  test("a refused credential asks to try again and marks no field", async ({ page, pages }) => {
    const s = pages.adminSignIn;
    await page.route(GOOGLE_ROUTE, authError(401, "google_token_invalid"));

    await s.googleButton().click();

    await expect(s.errorBanner()).toHaveText("Google sign-in didn't complete. Try again.");
    await expect(s.errorBanner()).toHaveAttribute("role", "alert");
    expect(new URL(page.url()).pathname).toBe("/sign-in");
    expect(await page.evaluate(() => localStorage.getItem("sd.auth.token"))).toBeNull();
    expect(await page.evaluate(() => sessionStorage.getItem("sd.auth.token"))).toBeNull();
    await expect(s.emailInput()).not.toHaveAttribute("aria-invalid", "true");
    await expect(s.passwordInput()).not.toHaveAttribute("aria-invalid", "true");
  });

  // Traces to: L2-182 AC5
  test("an unverified existing account is told to sign in with its password first", async ({ page, pages }) => {
    const s = pages.adminSignIn;
    await page.route(GOOGLE_ROUTE, authError(409, "email_unverified"));

    await s.googleButton().click();

    await expect(s.errorBanner()).toHaveText(
      "That email already has a Saturdaze account that hasn't verified its email. Sign in with your password to verify it first.",
    );
    expect(new URL(page.url()).pathname).toBe("/sign-in");
  });
});
