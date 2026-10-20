import { Locator, Page } from "@playwright/test";
import { BasePage, control } from "./base.page.js";
import { PageSlug } from "../fixtures/routes.js";

export type JoinDayName = "Saturday" | "Sunday";

/**
 * Join Saturdaze — pages/join.html, three stacked states (L2-161). The app's
 * `/join?token=…` previews the invitation and shows one of them under the
 * site bar:
 *   sample   .join__hero  .join__title "A weekend planned for {family}" · .join__sub
 *            .join__card (.auth-card)  Email (read-only) · Password · Confirm password · [Create my account]
 *            .join__days  .day Saturday / Sunday, read-only blocks
 *   plain    .auth-card "Join Saturdaze" · same fields · [Join Saturdaze]
 *   invalid  .auth-card "This invite no longer works" · [Sign in]
 */
export class JoinPage extends BasePage {
  readonly slug: PageSlug = "join";

  constructor(page: Page) {
    super(page);
  }

  protected readyAnchor(): Locator {
    return this.page.locator(".join__title, .auth-card__title");
  }

  /** Opens the join link, keeping only its path and query. */
  async open(joinUrl: string): Promise<void> {
    const url = new URL(joinUrl, "http://localhost");
    await this.page.goto(`${url.pathname}${url.search}`);
    await this.waitForReady();
  }

  heroTitle(): Locator {
    return this.main.locator(".join__title");
  }

  heroSubtitle(): Locator {
    return this.main.locator(".join__sub");
  }

  cardTitle(): Locator {
    return this.main.locator(".auth-card__title");
  }

  get daysGrid(): Locator {
    return this.main.locator(".join__days");
  }

  day(name: JoinDayName): Locator {
    return this.daysGrid
      .locator(".day")
      .filter({ has: this.page.locator(".day__title", { hasText: name }) });
  }

  blocks(name: JoinDayName): Locator {
    return this.day(name).locator(".block");
  }

  blockTitle(block: Locator): Locator {
    return block.locator(".block__title");
  }

  /** How many columns the days grid resolves to at the current viewport. */
  async dayColumns(): Promise<number> {
    return this.daysGrid.evaluate(
      (el) =>
        getComputedStyle(el).gridTemplateColumns.trim().split(/\s+/).length,
    );
  }

  async heroColumns(): Promise<number> {
    return this.main
      .locator(".join__hero")
      .evaluate(
        (el) =>
          getComputedStyle(el).gridTemplateColumns.trim().split(/\s+/).length,
      );
  }

  emailField(): Locator {
    return this.main.getByLabel("Email", { exact: true });
  }

  passwordField(): Locator {
    return this.main.getByLabel("Password", { exact: true });
  }

  confirmField(): Locator {
    return this.main.getByLabel("Confirm password", { exact: true });
  }

  /** "Create my account" (sample) or "Join Saturdaze" (plain). */
  submitButton(): Locator {
    return this.main.getByRole("button", {
      name: /Create my account|Join Saturdaze/,
    });
  }

  async join(password: string): Promise<void> {
    await this.passwordField().fill(password);
    await this.confirmField().fill(password);
    await this.submitButton().click();
  }

  signInLink(): Locator {
    return control(this.main, "Sign in");
  }

  formError(): Locator {
    return this.main.locator('[role="alert"]');
  }
}
