import { Locator } from "@playwright/test";
import { AuthShellPage } from "./auth-shell.page.js";

/**
 * Sign-up — pages/signup.html.
 */
export class SignupPage extends AuthShellPage {
  familyNameInput(): Locator {
    return this.authCard.locator('sd-text-input[label="Family name"] input');
  }

  homeLocationInput(): Locator {
    return this.authCard.locator('sd-text-input[label="Home location"] input');
  }

  emailInput(): Locator {
    return this.authCard.locator('sd-text-input[label="Email"] input');
  }

  passwordInput(): Locator {
    return this.authCard.locator('sd-text-input[label="Password"] input');
  }

  termsCheckbox(): Locator {
    return this.authCard.locator('label.check').first().locator('input[type="checkbox"]');
  }

  fridayPreviewCheckbox(): Locator {
    return this.authCard.locator('label.check').nth(1).locator('input[type="checkbox"]');
  }

  submitButton(): Locator {
    return this.authCard.locator('sd-button:has-text("Create account")');
  }

  errorMessage(): Locator {
    return this.authCard.locator('.auth-error[role="alert"]');
  }

  passwordHint(): Locator {
    return this.authCard.locator('.field-error[role="alert"]');
  }

  async fill(opts: {
    familyName?: string;
    homeLocation?: string;
    email: string;
    password: string;
  }): Promise<void> {
    await this.familyNameInput().fill(opts.familyName ?? 'The Browns');
    await this.homeLocationInput().fill(opts.homeLocation ?? 'Port Credit, Mississauga');
    await this.emailInput().fill(opts.email);
    await this.passwordInput().fill(opts.password);
  }

  async submit(): Promise<void> {
    await this.submitButton().locator('button').click();
  }
}
