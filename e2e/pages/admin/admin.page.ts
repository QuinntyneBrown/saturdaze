import { Locator, Page } from "@playwright/test";
import { BasePage, control } from "../base.page.js";
import { PageSlug } from "../../fixtures/routes.js";

export type AdminNavKey = "health" | "places" | "reviews" | "skips" | "activity" | "emails";

/**
 * Chrome shared by every Saturdaze Admin screen — pages/admin.*.html
 * (ADR-014). Every admin screen stamps `body[data-page="admin"]` and names
 * itself in `data-screen`.
 *
 *   .admin-nav              side navigation ≥1024, a bar below
 *     .admin-nav__link[data-nav]  Photo health · Places · Review queue · Ingestion skips · Activity log · Email templates
 *     .admin-nav__account   avatar · email · Sign out
 *   .admin-gate             the "can't use Saturdaze Admin" card for a non-admin (sign out only)
 */
export abstract class AdminPage extends BasePage {
  readonly slug: PageSlug = "admin";

  constructor(page: Page) {
    super(page);
  }

  /** `body[data-screen]` names the admin screen (sign-in · health · places · place · …). */
  async waitForScreen(screen: string): Promise<void> {
    await this.page.waitForSelector(`body[data-page="admin"][data-screen="${screen}"]`, {
      state: "attached",
      timeout: 10_000,
    });
    await this.readyAnchor().first().waitFor({ state: "attached", timeout: 10_000 });
  }

  get adminNav(): Locator {
    return this.page.locator(".admin-nav");
  }

  adminNavLink(key: AdminNavKey): Locator {
    return this.adminNav.locator(`.admin-nav__link[data-nav="${key}"]`);
  }

  activeAdminNavLink(): Locator {
    return this.adminNav.locator('.admin-nav__link[aria-current="page"]');
  }

  adminNavEmail(): Locator {
    return this.adminNav.locator(".admin-nav__email");
  }

  signOutButton(): Locator {
    return control(this.adminNav.locator(".admin-nav__account"), "Sign out");
  }

  /** The highlighted note inside an admin dialog (AD4's cover impact). */
  dialogNote(): Locator {
    return this.dialog().locator(".well");
  }

  /* ---------- AD7 New email template (A8 "New template", A9 "Duplicate") ---------- */

  /** AD7's fields; a required field's label also reads "Required". */
  templateNameInput(): Locator {
    return this.dialog().getByRole("textbox", { name: /^Name\b/ });
  }

  templateKeyInput(): Locator {
    return this.dialog().getByRole("textbox", { name: /^Key\b/ });
  }

  templateCategorySelect(): Locator {
    return this.dialog().getByLabel("Category", { exact: true });
  }

  templateDescriptionInput(): Locator {
    return this.dialog().getByRole("textbox", { name: /^Description\b/ });
  }

  /** The refusal AD7 shows in place (`template_key_exists`, a field error). */
  dialogAlert(): Locator {
    return this.dialog().locator('.banner--warn[role="alert"]');
  }

  /* ---------- Gate (signed in, not an administrator) ---------- */

  gate(): Locator {
    return this.page.locator(".admin-gate");
  }

  gateTitle(): Locator {
    return this.gate().locator(".auth-card__title");
  }

  gateEmail(): Locator {
    return this.gate().locator(".email-chip");
  }

  gateSignOutButton(): Locator {
    return control(this.gate(), "Sign out");
  }
}
