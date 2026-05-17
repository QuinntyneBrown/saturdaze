import { Locator } from "@playwright/test";
import { AuthShellPage } from "./auth-shell.page.js";

export class ForgotPasswordPage extends AuthShellPage {
  emailInput(): Locator {
    return this.authCard.locator('sd-text-input[label="Email"] input');
  }

  submitButton(): Locator {
    return this.authCard.locator('sd-button:has-text("Send reset link")');
  }

  async submit(email: string): Promise<void> {
    await this.emailInput().fill(email);
    await this.submitButton().locator('button').click();
  }
}
