import { Locator } from "@playwright/test";
import { AuthShellPage } from "./auth-shell.page.js";

export class VerifyEmailPage extends AuthShellPage {
  pending(): Locator {
    return this.authCard.locator('.state.pending');
  }

  success(): Locator {
    return this.authCard.locator('.state.success');
  }

  errorState(): Locator {
    return this.authCard.locator('.state.error');
  }

  setupFamilyButton(): Locator {
    return this.authCard.locator('sd-button:has-text("Set up your family")');
  }
}
