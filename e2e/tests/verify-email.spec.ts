import { test, expect } from "../fixtures/sd-test.js";
import { API_URL, devToken, registerThrowaway } from "../fixtures/auth.js";

/**
 * Verify email — `?token=` drives verifying → verified | expired; the
 * "sent" state is where sign-up lands. Tokens are real (dev delivery).
 */

test.describe("Verify email", () => {
  test("a valid token verifies and offers family setup", async ({ page, pages, request }) => {
    const account = await registerThrowaway(request, "verify");
    const token = await devToken(request, "/api/auth/resend-verification", account.email);

    const verified = page.waitForResponse((r) => r.url().endsWith("/api/auth/verify-email"));
    await page.goto(`/verify-email?token=${encodeURIComponent(token)}`);
    const v = pages.verifyEmail;
    await v.waitForReady();
    expect((await verified).ok()).toBeTruthy();

    await expect(v.cardTitle()).toHaveText("You are verified");
    await expect(v.setUpFamilyLink()).toBeVisible();
    await expect(v.skipToWeekendLink()).toBeVisible();
    await expect(v.body).toHaveAttribute("data-page", "verify-email");
  });

  test("'Skip to this weekend' goes to the weekend (signing in first when needed)", async ({ page, pages, request }) => {
    const account = await registerThrowaway(request, "verify");
    const token = await devToken(request, "/api/auth/resend-verification", account.email);
    await page.goto(`/verify-email?token=${encodeURIComponent(token)}`);
    const v = pages.verifyEmail;
    await v.waitForReady();
    await expect(v.cardTitle()).toHaveText("You are verified");
    await v.skipToWeekendLink().click();
    await page.waitForURL(/\/(weekend|sign-in\?returnUrl=%2Fweekend)$/);
  });

  test("'Set up your family' goes to Family (signing in first when needed)", async ({ page, pages, request }) => {
    const account = await registerThrowaway(request, "verify");
    const token = await devToken(request, "/api/auth/resend-verification", account.email);
    await page.goto(`/verify-email?token=${encodeURIComponent(token)}`);
    const v = pages.verifyEmail;
    await v.waitForReady();
    await expect(v.cardTitle()).toHaveText("You are verified");
    await v.setUpFamilyLink().click();
    await page.waitForURL(/\/(family|sign-in\?returnUrl=%2Ffamily)$/);
  });

  test("a consumed token lands on the 'expired' state with a resend button", async ({ page, pages, request }) => {
    const account = await registerThrowaway(request, "verify");
    const token = await devToken(request, "/api/auth/resend-verification", account.email);
    const first = await request.post(`${API_URL}/api/auth/verify-email`, { data: { token } });
    expect(first.ok()).toBeTruthy();

    await page.goto(`/verify-email?token=${encodeURIComponent(token)}`);
    const v = pages.verifyEmail;
    await v.waitForReady();
    await expect(v.cardTitle()).toHaveText("This link has expired");
    await expect(v.resendVerificationButton()).toBeVisible();
    await expect(v.backToSignInLink()).toHaveAttribute("href", /\/sign-in$/);
  });

  test("a garbage token lands on the 'expired' state", async ({ page, pages }) => {
    await page.goto("/verify-email?token=garbage");
    await pages.verifyEmail.waitForReady();
    await expect(pages.verifyEmail.cardTitle()).toHaveText("This link has expired");
  });

  test("no token at all shows the 'expired' state rather than spinning", async ({ page, pages }) => {
    await page.goto("/verify-email");
    await pages.verifyEmail.waitForReady();
    await expect(pages.verifyEmail.cardTitle()).toHaveText("This link has expired");
    await expect(pages.verifyEmail.statusCard()).toHaveCount(0);
  });

  test("Resend from the expired state re-issues a link for a signed-in user", async ({ page, pages, request, signIn }) => {
    const account = await registerThrowaway(request, "verify");
    await signIn(account);
    await page.goto("/verify-email?token=stale");
    const v = pages.verifyEmail;
    await v.waitForReady();
    await expect(v.cardTitle()).toHaveText("This link has expired");
    const resent = page.waitForResponse((r) => r.url().endsWith("/api/auth/resend-verification"));
    await v.resendVerificationButton().click();
    expect((await resent).ok()).toBeTruthy();
    await expect(v.cardTitle()).toHaveText("Check your email");
  });
});

test.describe("Verify email — ?state= overrides (dev only)", () => {
  for (const [key, title] of [
    ["verifySent", "Check your email"],
    ["verifyVerifying", "Verifying your email"],
    ["verifyVerified", "You are verified"],
    ["verifyExpired", "This link has expired"],
  ] as const) {
    test(`${key} renders "${title}"`, async ({ goto, pages }) => {
      await goto(key);
      await pages.verifyEmail.waitForReady();
      await expect(pages.verifyEmail.cardTitle()).toHaveText(title);
      if (key === "verifyVerifying") {
        await expect(pages.verifyEmail.statusCard()).toHaveAttribute("aria-live", "polite");
      }
    });
  }
});
