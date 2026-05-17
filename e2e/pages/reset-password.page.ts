import { Locator } from "@playwright/test";
import { AuthShellPage } from "./auth-shell.page.js";

export class ResetPasswordPage extends AuthShellPage {
  passwordInput(): Locator {
    return this.authCard.locator('sd-text-input[label="New password"] input');
  }

  confirmInput(): Locator {
    return this.authCard.locator('sd-text-input[label="Confirm password"] input');
  }

  submitButton(): Locator {
    return this.authCard.locator('sd-button:has-text("Update password")');
  }

  errorState(): Locator {
    return this.authCard.locator('.error-state');
  }

  authError(): Locator {
    return this.authCard.locator('.auth-error[role="alert"]');
  }

  fieldError(): Locator {
    return this.authCard.locator('.field-error[role="alert"]');
  }
}
