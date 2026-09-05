import { test, expect } from "../fixtures/sd-test.js";
import { ALERT_SLUGS, DIALOG_SLUGS, MENU_SLUGS } from "../pages/dialogs.page.js";

/**
 * Dialogs gallery (`/dialogs`, dev only) — every specimen renders
 * statically inline with the mock's id, role and title; nothing is opened
 * by clicking. Checked in both worlds.
 */

test.describe("Dialogs gallery", () => {
  test.beforeEach(async ({ goto, pages, settle }) => {
    await goto("dialogs");
    await pages.dialogs.waitForReady();
    await settle();
  });

  test("renders exactly the thirty specimens with their ids", async ({ pages }) => {
    const d = pages.dialogs;
    await expect(d.pageTitle()).toHaveText("Dialogs");
    await expect(d.specimens()).toHaveCount(DIALOG_SLUGS.length);
    for (const slug of DIALOG_SLUGS) {
      await expect(d.specimen(slug), `#dialog-${slug}`).toBeAttached();
      await expect(d.specimenLabel(slug)).not.toBeEmpty();
      await expect(d.panel(slug), `#dialog-${slug} panel`).toBeVisible();
    }
  });

  test("dialog specimens carry role, aria-modal, a labelled title and a Close button", async ({ pages }) => {
    const d = pages.dialogs;
    for (const slug of DIALOG_SLUGS) {
      if (MENU_SLUGS.includes(slug)) continue;
      const panel = d.panel(slug);
      await expect(panel).toHaveAttribute("role", ALERT_SLUGS.includes(slug) ? "alertdialog" : "dialog");
      await expect(panel).toHaveAttribute("aria-modal", "true");
      const labelledBy = await panel.getAttribute("aria-labelledby");
      expect(labelledBy, `#dialog-${slug} aria-labelledby`).toBeTruthy();
      await expect(d.title(slug)).toHaveAttribute("id", labelledBy!);
      await expect(d.title(slug)).not.toBeEmpty();
      await expect(d.closeButton(slug)).toBeVisible();
    }
  });

  test("menu specimens are role=menu with menuitems", async ({ pages }) => {
    const d = pages.dialogs;
    await expect(d.panel("more-menu")).toHaveAttribute("role", "menu");
    await expect(d.menuItems("more-menu")).toHaveText(["Regenerate the weekend", "Add to calendar"]);
    await expect(d.panel("account")).toHaveAttribute("role", "menu");
    await expect(d.panel("account").locator(".menu__header")).toContainText("@");
    await expect(d.menuItems("account")).toHaveText(["Family settings", "Sign out"]);
    await expect(d.menuItems("account").last()).toHaveClass(/menu__item--warn/);
  });

  test("titles match the design deck", async ({ pages }) => {
    const d = pages.dialogs;
    const expected: Array<[(typeof DIALOG_SLUGS)[number], string]> = [
      ["block", "Terre Bleu Lavender Farm"],
      ["block-locked", "Bath and books"],
      ["block-commitment", "Swim lessons"],
      ["regenerate", "Regenerate the weekend?"],
      ["regenerate-day", "Regenerate Saturday?"],
      ["share", "Share this weekend"],
      ["calendar", "Add to your calendar"],
      ["errand", "Add an errand"],
      ["errand-added", "Added to Sunday at 9:15"],
      ["suggest", "Suggest an event"],
      ["submitted", "Thanks, it is in the queue"],
      ["lock-in", "Lock La Marina for Saturday lunch?"],
      ["rate", "How was it?"],
      ["rename", "Rename this weekend"],
      ["repeat", "Use this weekend again?"],
      ["remix", "Remix this weekend?"],
      ["member", "Edit Mae"],
      ["member-add", "Add a family member"],
      ["commitment", "Edit Swim lessons"],
      ["commitment-add", "Add a commitment"],
      ["home", "Home location"],
      ["likes", "Likes and dislikes"],
      ["remove", "Remove Mae from the family?"],
      ["remove-commitment", "Remove Swim lessons?"],
      ["signout", "Sign out?"],
      ["approve", "Approve Port Credit Buskerfest?"],
      ["reject", "Reject this suggestion?"],
      ["more", "Weekend options"],
    ];
    for (const [slug, title] of expected) {
      await expect(d.title(slug), `#dialog-${slug}`).toHaveText(new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
    }
  });

  test("danger fill is reserved for Replace draft, Remove, Sign out and Reject", async ({ pages }) => {
    const d = pages.dialogs;
    await expect(d.action("repeat", "Replace draft")).toHaveClass(/btn--danger/);
    await expect(d.action("remove", "Remove")).toHaveClass(/btn--danger/);
    await expect(d.action("remove-commitment", "Remove")).toHaveClass(/btn--danger/);
    await expect(d.action("signout", "Sign out")).toHaveClass(/btn--danger/);
    await expect(d.action("reject", "Reject")).toHaveClass(/btn--danger/);
    await expect(d.gallery.locator(".btn--danger")).toHaveCount(5);
  });

  test("form dialogs disable the primary until required fields are valid", async ({ pages }) => {
    const d = pages.dialogs;
    await expect(d.action("suggest", "Submit")).toBeDisabled();
    await expect(d.action("errand", "Add to weekend")).toBeEnabled();
    await expect(d.panel("errand").getByRole("radio", { name: "Either" })).toBeChecked();
  });
});
