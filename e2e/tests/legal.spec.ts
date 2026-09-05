import { test, expect } from "../fixtures/sd-test.js";

/**
 * Legal — Terms (default) and Privacy on one template; the `#privacy`
 * fragment drives `body[data-doc]`, the `.doc-switch` `aria-current`, and
 * which `article.prose` is shown. Anonymous; works in both worlds.
 */

test.describe("Legal", () => {
  test("defaults to Terms in the site shell", async ({ goto, pages }) => {
    await goto("legal");
    const l = pages.legal;
    await l.waitForReady();
    await expect(l.body).toHaveAttribute("data-page", "legal");
    await expect(l.body).toHaveAttribute("data-doc", "terms");
    await expect(l.sitebar).toBeVisible();
    await expect(l.topbar).toHaveCount(0);
    await expect(l.bottomNav).toHaveCount(0);
    await expect(l.activeDocTab()).toHaveText("Terms");
    await expect(l.visibleArticle()).toHaveCount(1);
    await expect(l.proseTitle("terms")).toHaveText("Terms of Service");
    await expect(l.proseUpdated("terms")).toContainText(/Last updated/);
    await expect(l.toc("terms")).toHaveCount(6);
  });

  test("#privacy shows the Privacy Policy", async ({ goto, pages }) => {
    await goto("legalPrivacy");
    const l = pages.legal;
    await l.waitForReady();
    await expect(l.body).toHaveAttribute("data-doc", "privacy");
    await expect(l.activeDocTab()).toHaveText("Privacy");
    await expect(l.visibleArticle()).toHaveCount(1);
    await expect(l.proseTitle("privacy")).toHaveText("Privacy Policy");
    await expect(l.toc("privacy")).toHaveCount(5);
  });

  test("the document switch toggles without a page load", async ({ page, goto, pages }) => {
    await goto("legal");
    const l = pages.legal;
    await l.waitForReady();
    await l.docTab("Privacy").click();
    await expect(page).toHaveURL(/#privacy$/);
    await expect(l.body).toHaveAttribute("data-doc", "privacy");
    await expect(l.activeDocTab()).toHaveText("Privacy");
    await l.docTab("Terms").click();
    await expect(l.body).toHaveAttribute("data-doc", "terms");
    await expect(l.activeDocTab()).toHaveText("Terms");
  });

  test("footer links cross-link the two documents and sign-in", async ({ goto, pages }) => {
    await goto("legal");
    const l = pages.legal;
    await l.waitForReady();
    await expect(l.footerLink("Terms")).toBeVisible();
    await expect(l.footerLink("Privacy")).toHaveAttribute("href", /#privacy$/);
    await expect(l.footerLink("Sign in")).toHaveAttribute("href", /sign-in/);
    await l.footerLink("Privacy").click();
    await expect(l.body).toHaveAttribute("data-doc", "privacy");
  });

  test("the sitebar's Sign in leads to the sign-in screen", async ({ page, goto, pages }) => {
    await goto("legal");
    await pages.legal.waitForReady();
    await pages.legal.sitebar.getByRole("link", { name: "Sign in", exact: true }).click();
    await page.waitForURL(/sign-in/);
  });
});
