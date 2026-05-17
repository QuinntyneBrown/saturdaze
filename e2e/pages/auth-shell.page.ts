import { Locator, Page } from "@playwright/test";

/**
 * Shared auth-shell chrome — used by login / signup / forgot-password /
 * check-email / reset-password / verify-email.
 *
 * The mocks render plain `.auth-shell` + `.auth-card` divs; the Angular
 * implementation will render `sd-auth-shell` + `sd-auth-card` (slice C1).
 * Locators accept either so the same POM serves both the baseline-capture
 * pass (against `docs/mocks/pages/*.html`) and the verify pass (against the
 * Angular app).
 *
 * Auth pages deliberately do NOT extend `BasePage` — they have no top-bar
 * or bottom-nav. Signed-out visitors see only the task in front of them.
 */
export class AuthShellPage {
  constructor(protected readonly page: Page) {}

  get authShell(): Locator {
    return this.page.locator("sd-auth-shell, .auth-shell");
  }

  get authCard(): Locator {
    return this.page.locator("sd-auth-card, .auth-card");
  }

  get brand(): Locator {
    return this.authShell.locator(".brand");
  }

  async waitForReady(): Promise<void> {
    await this.page.waitForSelector("sd-auth-shell, .auth-shell", {
      state: "attached",
      timeout: 8_000,
    });
  }
}
